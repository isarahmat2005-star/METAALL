import gradio as gr
import os
import re
import tempfile
import zipfile
import asyncio
import nest_asyncio
import imageio
import imageio.v3 as iio
import time
import base64
import json
import glob
import shutil
import subprocess
import uuid
from playwright.async_api import async_playwright
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

nest_asyncio.apply()

# ==========================================
# MEMAKSA INSTALASI CHROMIUM (UNTUK HUGGING FACE)
# ==========================================
print("Mengunduh mesin Chromium...")
subprocess.run(["playwright", "install", "chromium"])
print("Selesai mengunduh Chromium!")

# Inisiasi FastAPI murni untuk mencegat API React
app = FastAPI()

# ==========================================
# CORS
# Wajib ada supaya frontend yang jalan di origin lain (mis. Gemini Canvas)
# bisa memanggil endpoint custom di bawah ini. Endpoint yang ditempel
# langsung ke objek FastAPI (bukan lewat Gradio) TIDAK otomatis dapat CORS
# dari Gradio, jadi kalau ini tidak ada, browser bisa memblokir response-nya
# meski server sudah sukses memprosesnya.
# ==========================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

def bersihkan_file_user(safe_task_id):
    try:
        temp_base = tempfile.gettempdir()
        tmp_folders = glob.glob(os.path.join(temp_base, f'gradio_render_{safe_task_id}*'))
        for folder in tmp_folders:
            if os.path.isdir(folder):
                shutil.rmtree(folder, ignore_errors=True)
    except Exception as e:
        print("Gagal membersihkan memori:", e)

# ==========================================
# API JOB QUEUE (ASYNC JOB + POLLING)
# ==========================================
# Ganti pola lama (1 request panjang, nunggu sampai render kelar) dengan
# pola job + polling:
#   1) POST /start-render   -> balas cepat {job_id}, render jalan di background
#   2) GET  /status/{job_id} -> dicek berkala oleh client (ringan & instan)
#   3) GET  /result/{job_id} -> ambil base64 setelah status == "done"
#
# Ini menghindari 1 koneksi HTTP yang harus tetap terbuka selama render
# berlangsung (rawan kena timeout proxy HF / watchdog client), dan
# memungkinkan job "ditinggal" client dideteksi & dibatalkan otomatis
# (lihat JOB_NO_POLL_TIMEOUT) supaya tidak ada render zombie yang numpuk.
# ==========================================
API_JOBS = {}                  # job_id -> dict status/progress/result
JOB_NO_POLL_TIMEOUT = 180      # detik: job dibatalkan jika tidak ada polling status sama sekali
JOB_RESULT_EXPIRY = 600        # detik: job selesai/gagal yang tidak diambil akan dibuang dari memori

def _now():
    return time.time()

def _wrap_html_for_api(js_code, width, height):
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ margin: 0; padding: 0; background: transparent; overflow: hidden; }}
            svg {{ width: {width}px; height: {height}px; display: block; }}
        </style>
    </head>
    <body>
        <svg id="canvas" viewBox="0 0 {width} {height}" preserveAspectRatio="xMidYMid slice"></svg>
        <script>
            {js_code}
            const svgEl = document.getElementById('canvas');
            if (typeof create === 'function') {{ create(svgEl, {width}, {height}); }}
            window.renderFrameAtTime = function(time) {{
                if (typeof update === 'function') {{ update(time, svgEl, {width}, {height}); }}
            }};
        </script>
    </body>
    </html>
    """

async def _run_render_job(job_id, js_code, width, height, duration, fps, bitrate, safe_task_id):
    job = API_JOBS[job_id]
    job["status"] = "processing"
    total_frames = int(duration * fps)
    target_bitrate = int(bitrate * 1000000)

    bersihkan_file_user(safe_task_id)
    temp_dir = tempfile.mkdtemp(prefix=f"gradio_render_{safe_task_id}")
    mp4_path = os.path.join(temp_dir, f"output_{safe_task_id}.mp4")
    html_path = os.path.join(temp_dir, "index.html")

    browser = None
    try:
        with open(html_path, "w", encoding="utf-8") as f:
            f.write(_wrap_html_for_api(js_code, width, height))

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True, args=['--no-sandbox', '--disable-setuid-sandbox'])
            page = await browser.new_page(viewport={"width": width, "height": height})
            await page.goto(f"file://{html_path}")
            await asyncio.sleep(1)

            writer = imageio.get_writer(mp4_path, fps=fps, codec='libx264', bitrate=target_bitrate)

            for i in range(total_frames):
                # Kalau sudah lama sekali tidak ada yang polling status job ini,
                # anggap client sudah give up -> hentikan render, jangan numpuk.
                if _now() - job["last_polled"] > JOB_NO_POLL_TIMEOUT:
                    job["status"] = "cancelled"
                    job["error"] = "Dibatalkan: tidak ada polling status dari client dalam waktu lama."
                    writer.close()
                    return

                current_time = i / fps
                await page.evaluate(f"window.renderFrameAtTime({current_time})")
                screenshot_bytes = await page.screenshot()

                # imread & append_data adalah operasi sinkron/blocking. Dijalankan
                # lewat asyncio.to_thread supaya TIDAK memblokir event loop utama -
                # request /status & /start-render job lain tetap responsif selagi
                # render ini berjalan.
                frame_data = await asyncio.to_thread(iio.imread, screenshot_bytes)
                await asyncio.to_thread(writer.append_data, frame_data)

                job["progress"] = {"frame": i + 1, "total": total_frames}

            writer.close()
            await browser.close()
            browser = None

        with open(mp4_path, "rb") as video_file:
            b64_string = base64.b64encode(video_file.read()).decode("utf-8")

        job["status"] = "done"
        job["result"] = f"data:video/mp4;base64,{b64_string}"
        job["finished_at"] = _now()

    except Exception as e:
        job["status"] = "failed"
        job["error"] = str(e)
        job["finished_at"] = _now()
    finally:
        if browser is not None:
            try:
                await browser.close()
            except Exception:
                pass
        bersihkan_file_user(safe_task_id)

async def _cleanup_loop():
    """Jalan di background: buang job basi (selesai/gagal/dibatalkan yang
    hasilnya tidak pernah diambil) dari memori supaya tidak membengkak."""
    while True:
        await asyncio.sleep(30)
        stale_ids = [
            jid for jid, job in API_JOBS.items()
            if job["status"] in ("done", "failed", "cancelled")
            and _now() - job.get("finished_at", job["created_at"]) > JOB_RESULT_EXPIRY
        ]
        for jid in stale_ids:
            API_JOBS.pop(jid, None)

@app.on_event("startup")
async def _start_cleanup_task():
    asyncio.create_task(_cleanup_loop())

@app.post("/start-render")
async def start_render(request: Request):
    try:
        body = await request.json()
        data = body.get("data", [])

        js_code = str(data[0])
        resolution = str(data[1])
        duration = float(data[2])
        fps = int(data[3])
        task_id = str(data[4])
        bitrate = int(data[5])

        width, height = map(int, resolution.split("x"))

        safe_task_id = "".join([c for c in str(task_id) if c.isalnum()])
        if not safe_task_id:
            safe_task_id = "default"

        job_id = f"{safe_task_id}_{uuid.uuid4().hex[:8]}"

        API_JOBS[job_id] = {
            "status": "queued",
            "progress": {"frame": 0, "total": int(duration * fps)},
            "result": None,
            "error": None,
            "created_at": _now(),
            "last_polled": _now(),
        }

        asyncio.create_task(
            _run_render_job(job_id, js_code, width, height, duration, fps, bitrate, safe_task_id)
        )

        return JSONResponse(content={"job_id": job_id})

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.get("/status/{job_id}")
async def get_status(job_id: str):
    job = API_JOBS.get(job_id)
    if job is None:
        return JSONResponse(content={"error": "Job tidak ditemukan (mungkin sudah expired)."}, status_code=404)

    job["last_polled"] = _now()
    return JSONResponse(content={
        "status": job["status"],
        "progress": job["progress"],
        "error": job["error"],
    })

@app.get("/result/{job_id}")
async def get_result(job_id: str):
    job = API_JOBS.get(job_id)
    if job is None:
        return JSONResponse(content={"error": "Job tidak ditemukan (mungkin sudah expired)."}, status_code=404)

    if job["status"] != "done":
        return JSONResponse(content={"error": f"Job belum selesai (status: {job['status']})."}, status_code=409)

    result = job["result"]
    # Setelah diambil, langsung buang dari memori supaya tidak menumpuk.
    API_JOBS.pop(job_id, None)
    return JSONResponse(content={"data": [result]})

# ==========================================
# VARIABEL GLOBAL KENDALI RENDER (START/PAUSE/STOP)
# ==========================================
JOB_STATE = {"status": "idle"}

# ==========================================
# 1. FUNGSI PEMBUNGKUS HTML
# ==========================================
def wrap_svg_as_html(js_code, w, h):
    return f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>html, body {{ margin: 0; padding: 0; width: {w}px; height: {h}px; overflow: hidden; background: transparent; }} svg {{ display: block; width: 100%; height: 100%; }}</style></head><body>
    <svg id="mainCanvas" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}"></svg>
    <script>
        {js_code}
        const svg = document.getElementById('mainCanvas'); const width = {w}; const height = {h};
        try {{ if (typeof create === 'function') create(svg, width, height); }} catch (err) {{}}
        window.renderFrameAtTime = (t) => {{ try {{ if (typeof update === 'function') update(t, svg, width, height); }} catch (err) {{}} }};
    </script>
</body></html>"""

# ==========================================
# 2. EKSTRAKSI METADATA FILE (.TXT)
# ==========================================
def parse_txt_file(content):
    width, height, duration = 1920, 1080, 10
    res_match = re.search(r'//\s*\[META\]\s*RES:(\d+x\d+)', content, re.IGNORECASE)
    if res_match:
        res_parts = res_match.group(1).lower().split('x')
        width, height = int(res_parts[0]), int(res_parts[1])
    else:
        vb_match = re.search(r'viewBox["\']?\s*,\s*["\']0\s+0\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)["\']', content, re.IGNORECASE)
        if vb_match: width, height = int(float(vb_match.group(1))), int(float(vb_match.group(2)))

    dur_match = re.search(r'//\s*\[META\]\s*DUR:(\d+)', content, re.IGNORECASE)
    if dur_match: duration = int(dur_match.group(1))

    js_match = re.search(r'```(?:javascript|js)?\s*([\s\S]*?)```', content, re.IGNORECASE)
    clean_code = js_match.group(1).strip() if js_match else content.strip()
    return clean_code, width, height, duration

# ==========================================
# 3. MESIN RENDER VIDEO DENGAN PAUSE/STOP INTERRUPT
# ==========================================
async def render_single_video(code, width, height, duration, fps, bitrate, output_path):
    html_content = wrap_svg_as_html(code, width, height)
    total_frames = int(duration * fps)
    bitrate_str = f"{bitrate}M"

    update_interval = max(1, fps // 4)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=['--no-sandbox', '--disable-setuid-sandbox'])
        page = await browser.new_page(viewport={'width': width, 'height': height})
        await page.set_content(html_content)

        writer = imageio.get_writer(output_path, fps=fps, codec='libx264', quality=None, bitrate=bitrate_str, macro_block_size=1)
        for frame in range(total_frames):
            # Tahan proses (sleep) jika tombol PAUSE ditekan
            while JOB_STATE["status"] == "paused":
                await asyncio.sleep(0.5)

            # Hentikan paksa jika tombol STOP ditekan
            if JOB_STATE["status"] == "stopped":
                break

            time_sec = frame / fps
            await page.evaluate(f"window.renderFrameAtTime({time_sec})")
            screenshot_bytes = await page.screenshot(type='jpeg', quality=100)
            img_matrix = imageio.v3.imread(screenshot_bytes)
            writer.append_data(img_matrix)

            if frame % update_interval == 0 or frame == total_frames - 1:
                yield frame + 1, total_frames

        writer.close()
        await browser.close()

# ==========================================
# 4. LOGIKA UI & BATCH GENERATOR
# ==========================================
def update_ui_on_upload(files):
    if not files:
        return [], "0", "0", "0", "Belum ada file diunggah.", gr.update(interactive=False, variant="secondary"), gr.update(interactive=False)
    names = "\n".join([f"{i+1}. {os.path.basename(f)}" for i, f in enumerate(files)])
    return files, str(len(files)), "0", "0", names, gr.update(interactive=True, variant="primary"), gr.update(interactive=True)

def clear_all_files():
    return [], "0", "0", "0", "Belum ada file diunggah.", gr.update(interactive=False, variant="secondary"), gr.update(interactive=False)

def get_formatted_time(elapsed_sec):
    h, rem = divmod(int(elapsed_sec), 3600)
    m, s = divmod(rem, 60)
    return f"{h:02d}:{m:02d}:{s:02d}"

async def process_batch_render(files, fps_str, bitrate_str, zip_filename):
    if not files:
        yield "Waktu tempuh total: 00:00:00\n\nTIDAK ADA FILE", "0", "0", "0", None, None, ""
        return

    fps = int(fps_str)
    bitrate = int(bitrate_str)

    total = len(files)
    completed = 0
    failed = 0

    batch_start_time = time.time()
    yield "Waktu tempuh total: 00:00:00\n\nMenyiapkan antrean...", str(total), str(completed), str(failed), None, None, ""

    temp_dir = tempfile.mkdtemp()
    generated_videos = []

    for i, file_obj in enumerate(files):
        if JOB_STATE["status"] == "stopped":
            break

        filename = os.path.basename(file_obj)
        base_name = os.path.splitext(filename)[0]
        output_mp4 = os.path.join(temp_dir, f"{base_name}_{i+1}.mp4")

        file_start_time = time.time()

        try:
            with open(file_obj, 'r', encoding='utf-8') as f:
                content = f.read()
            code, width, height, duration = parse_txt_file(content)

            async for current_frame, total_frames in render_single_video(code, width, height, duration, fps, bitrate, output_mp4):
                if JOB_STATE["status"] == "stopped":
                    break

                pct = int((current_frame / total_frames) * 100)

                total_time_str = get_formatted_time(time.time() - batch_start_time)

                fm, fs = divmod(int(time.time() - file_start_time), 60)
                file_time_str = f"{fm:02d}:{fs:02d}"

                status_info = f"Waktu tempuh total: {total_time_str}\n\n{filename}\n{file_time_str} ({pct}%)"
                yield status_info, str(total), str(completed), str(failed), generated_videos, None, ""

            if JOB_STATE["status"] != "stopped":
                generated_videos.append(output_mp4)
                completed += 1

        except Exception as e:
            print(f"Error pada {filename}: {str(e)}")
            failed += 1

    zip_name_clean = zip_filename.strip() if zip_filename.strip() else "AMATI-Render-MP4"
    final_zip_path = os.path.join(temp_dir, f"{zip_name_clean}.zip")

    base64_list = []
    if generated_videos:
        with zipfile.ZipFile(final_zip_path, 'w') as zipf:
            for vid_path in generated_videos:
                zipf.write(vid_path, os.path.basename(vid_path))
                with open(vid_path, "rb") as vf:
                    b64_str = base64.b64encode(vf.read()).decode('utf-8')
                    base64_list.append(b64_str)
    else:
        final_zip_path = None

    base64_result = json.dumps(base64_list) if base64_list else ""
    final_time_str = get_formatted_time(time.time() - batch_start_time)
    yield f"Waktu tempuh total: {final_time_str}", str(total), str(completed), str(failed), generated_videos, final_zip_path, base64_result

# ==========================================
# KENDALI TOMBOL STATE (START/PAUSE/STOP)
# ==========================================
def on_start():
    JOB_STATE["status"] = "running"
    return (
        gr.update(interactive=False, elem_classes="btn-orange"),
        gr.update(interactive=True, value="PAUSE", elem_classes="btn-orange"),
        gr.update(interactive=True, elem_classes="btn-orange")
    )

def on_finish():
    JOB_STATE["status"] = "idle"
    return (
        gr.update(interactive=True, elem_classes=""),
        gr.update(interactive=False, value="PAUSE", elem_classes=""),
        gr.update(interactive=False, elem_classes="")
    )

def toggle_pause():
    if JOB_STATE["status"] == "running":
        JOB_STATE["status"] = "paused"
        return gr.update(value="RESUME", elem_classes="btn-orange")
    elif JOB_STATE["status"] == "paused":
        JOB_STATE["status"] = "running"
        return gr.update(value="PAUSE", elem_classes="btn-orange")
    return gr.update()

def do_stop():
    JOB_STATE["status"] = "stopped"
    return gr.update(interactive=False)

# ==========================================
# 5. ANTARMUKA GRADIO DENGAN CSS KHUSUS
# ==========================================
custom_css = """
@import url('https://fonts.googleapis.com/css2?family=Share+Tech&display=swap');

/* Memaksa seluruh teks menggunakan Share Tech */
.gradio-container * {
    font-family: 'Share Tech', sans-serif !important;
}

.fixed-height-list textarea {
    height: 110px !important;
    max-height: 110px !important;
    min-height: 110px !important;
    overflow-y: auto !important;
}
.fixed-gallery {
    height: 350px !important;
    max-height: 350px !important;
    overflow-y: auto !important;
}
.fixed-zip {
    height: 100px !important;
    min-height: 100px !important;
    max-height: 100px !important;
    overflow: hidden !important;
}
.fixed-zip [data-testid="file-upload"] {
    height: 60px !important;
    display: flex !important;
    justify-content: center !important;
    align-items: center !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
}
.fixed-zip [data-testid="file-upload"] span {
    display: none !important;
}
.fixed-zip [data-testid="file-upload"] svg {
    width: 25px !important;
    height: 25px !important;
    color: #4b5563 !important;
    margin: 0 !important;
}
.fixed-zip .file-preview {
    height: 60px !important;
    display: flex !important;
    justify-content: center !important;
    align-items: center !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
}
.fixed-zip table,
.fixed-zip tbody,
.fixed-zip tr,
.fixed-zip td {
    margin: 0 auto !important;
    border: none !important;
    background: transparent !important;
    text-align: center !important;
}
.btn-orange {
    background: linear-gradient(to bottom right, #f97316, #ea580c) !important;
    border-color: #c2410c !important;
    color: white !important;
}
@media (max-width: 640px) {
    .stats-row {
        display: flex !important;
        flex-wrap: nowrap !important;
        gap: 4px !important;
    }
    .stats-row > div {
        flex: 1 1 0 !important;
        min-width: 0 !important;
    }
}
.btn-red {
    background: linear-gradient(to bottom right, #ef4444, #dc2626) !important;
    border-color: #b91c1c !important;
    color: white !important;
}
.txt-box-container {
    position: relative !important;
}
.btn-clear-float {
    position: absolute !important;
    top: 7px !important;
    right: 14px !important;
    width: auto !important;
    min-width: 60px !important;
    height: 25px !important;
    padding: 0 10px !important;
    z-index: 999 !important;
}
"""

with gr.Blocks(css=custom_css) as interface:
    gr.Markdown("# AMATI - Mesin Render MP4")

    with gr.Row():
        # === KOLOM KIRI ===
        with gr.Column(scale=1):
            file_state = gr.State([])

            upload_btn = gr.UploadButton("Upload File TXT", file_count="multiple", file_types=[".txt"], variant="primary")

            with gr.Column(elem_classes="txt-box-container"):
                btn_clear = gr.Button("Clear", elem_classes="btn-red btn-clear-float", interactive=False)
                txt_file_list = gr.Textbox(label="Daftar Kode JS (.TXT)", interactive=False, elem_classes="fixed-height-list")

            with gr.Row():
                input_fps = gr.Dropdown(choices=["30", "60", "90", "120"], value="60", label="FPS Render")
                input_bitrate = gr.Dropdown(choices=["10", "20", "30", "40", "50", "60", "80", "100"], value="30", label="Bitrate (Mbps)")

            input_zip_name = gr.Textbox(label="Nama Ekspor ZIP Output", placeholder="AMATI-Render-MP4")

            with gr.Row(elem_classes="stats-row"):
                val_selected = gr.Textbox(label="Selected", value="0", interactive=False, min_width=30)
                val_completed = gr.Textbox(label="Completed", value="0", interactive=False, min_width=30)
                val_failed = gr.Textbox(label="Failed", value="0", interactive=False, min_width=30)

            with gr.Row(elem_classes="stats-row"):
                btn_start = gr.Button("START", variant="secondary", min_width=1, interactive=False)
                btn_pause = gr.Button("PAUSE", variant="secondary", interactive=False, min_width=1)
                btn_stop = gr.Button("STOP", variant="secondary", interactive=False, min_width=1)
        # === KOLOM KANAN ===
        with gr.Column(scale=1):
            render_info = gr.Textbox(label="Informasi Render", value="Belum ada antrean.", interactive=False, lines=4)
            output_gallery = gr.Gallery(label="Hasil Video", columns=2, allow_preview=True, object_fit="contain", elem_classes="fixed-gallery")
            output_zip = gr.File(label="Ekspor ZIP", elem_classes="fixed-zip")
            output_base64 = gr.Textbox(visible=False, label="Output Base64 API")

    upload_btn.upload(
        fn=update_ui_on_upload,
        inputs=[upload_btn],
        outputs=[file_state, val_selected, val_completed, val_failed, txt_file_list, btn_start, btn_clear]
    )

    btn_start.click(
        fn=on_start,
        outputs=[btn_start, btn_pause, btn_stop]
    ).then(
        fn=process_batch_render,
        inputs=[file_state, input_fps, input_bitrate, input_zip_name],
        outputs=[render_info, val_selected, val_completed, val_failed, output_gallery, output_zip, output_base64]
    ).then(
        fn=on_finish,
        outputs=[btn_start, btn_pause, btn_stop]
    )

    btn_pause.click(fn=toggle_pause, outputs=[btn_pause])
    btn_stop.click(fn=do_stop, outputs=[btn_stop])

    btn_clear.click(
        fn=clear_all_files,
        inputs=[],
        outputs=[file_state, val_selected, val_completed, val_failed, txt_file_list, btn_start, btn_clear]
    )

# ==========================================
# PERBAIKAN: teruskan css= LANGSUNG ke mount_gradio_app
# Karena custom_css yang diberikan ke gr.Blocks(css=...) baru benar-benar
# aktif setelah .launch() dipanggil. Kode ini tidak memanggil .launch()
# (dia dimount ke FastAPI lalu dijalankan lewat uvicorn), jadi CSS-nya
# harus dioper lagi di sini supaya tetap ter-inject ke frontend.
# ==========================================
app = gr.mount_gradio_app(app, interface, path="/", css=custom_css)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=7860)
