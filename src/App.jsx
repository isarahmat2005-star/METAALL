import React, { useState, useEffect, useRef } from 'react';
import { 
  UploadCloudIcon, CloseIcon, EditIcon, TrashIcon, EyeIcon, LangIcon, PlayIcon, 
  PauseIcon, CoffeeIcon, CopyIcon, AlertTriangleIcon, BriefcaseIcon, DownloadIcon, 
  ClockIcon, CheckCircleIcon, XCircleIcon, Trash2Icon, SparklesIcon, Wand2Icon, 
  FilePlusIcon, FolderPlusIcon, FileJsonIcon, FileTextIcon, UserIcon, LogOutIcon, ChevronLeftIcon, ChevronRightIcon
} from './icons';
import { 
  ADOBE_CATEGORIES, SHUTTERSTOCK_IMAGE_VECTOR_CATEGORIES, SHUTTERSTOCK_VIDEO_CATEGORIES, 
  DREAMSTIME_CATEGORIES, VCG_CATEGORIES, PLATFORMS, UPLOAD_MODES, DEFAULT_NEGATIVE, 
  HF_CONVERTER_URLS 
} from './constants';
import { loadJSZip, isVectorExt, isVideoFile, handleCopy, calculateTargetSize } from './utils';

// =====================================================================
// === KONFIGURASI GOOGLE APPS SCRIPT (SATPAM LOGIN) ===
// Masukkan URL Deployment Web App dari Google Apps Script Anda di sini.
// =====================================================================
const GAS_AUTH_URL = "https://script.google.com/macros/s/AKfycbx5pWDC7QOECHiaqlc0hHmitXfTa_YdSUcq08aqy5s37THyVpBIUovvxKwovuvotVWvsg/exec"; 

// =====================================================================
// === INDEXED DB HELPER FUNCTIONS ===
// =====================================================================
const DB_NAME = 'MetalDB';
const DB_VERSION = 2;
const STORE_NAME = 'files_store';
const META_STORE_NAME = 'meta_store';

const initDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = (event) => reject("IndexedDB error: " + event.target.errorCode);
        request.onsuccess = (event) => resolve(event.target.result);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(META_STORE_NAME)) {
              db.createObjectStore(META_STORE_NAME, { keyPath: 'key' }); 
            }
        };
    });
};

const saveFileToDB = async (fileData) => {
    try {
        const db = await initDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        
        // Buat salinan tanpa properti non-serializable seperti URL blob sementara
        const { url, ...storableData } = fileData;
        
        // Simpan File asli. IndexedDB modern mendukung penyimpanan File dan Blob.
        store.put(storableData);
        
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    } catch (error) {
        console.error("Failed to save to IndexedDB:", error);
    }
};

const loadFilesFromDB = async () => {
    try {
        const db = await initDB();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.getAll();
        
        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                // Rekonstruksi URL dari objek File yang tersimpan
                const files = request.result.map(data => {
                    return {
                        ...data,
                        url: data.file ? URL.createObjectURL(data.file) : null
                    };
                });
                resolve(files);
            };
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error("Failed to load from IndexedDB:", error);
        return [];
    }
};

const deleteFileFromDB = async (id) => {
    try {
        const db = await initDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.delete(id);
    } catch (error) {
        console.error("Failed to delete from IndexedDB:", error);
    }
};

const clearAllFilesFromDB = async () => {
    try {
        const db = await initDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.clear();
    } catch (error) {
        console.error("Failed to clear IndexedDB:", error);
    }
};


const convertVectorWithFallback = async (fileObj, signal) => {
  const urls = [...HF_CONVERTER_URLS].sort(() => Math.random() - 0.5);
  const formData = new FormData();
  formData.append('file', fileObj);

  for (const baseUrl of urls) {
    if (signal?.aborted) break;
    try {
      const res = await fetch(`${baseUrl}/convert`, {
        method: 'POST',
        body: formData,
        signal
      });
      if (res.ok) {
        const blob = await res.blob();
        return URL.createObjectURL(blob);
      }
    } catch (err) {}
  }
  return null; 
};

const extractDataJIT = async (fileItem, numFrames, signal) => {
  return new Promise(async (resolve, reject) => {
    const checkAbort = () => {
      if (signal?.aborted) {
        reject(new DOMException('Aborted', 'AbortError'));
        return true;
      }
      return false;
    };
    if (checkAbort()) return;

    const onAbort = () => reject(new DOMException('Aborted', 'AbortError'));
    if (signal) signal.addEventListener('abort', onAbort);

    const cleanup = () => { if (signal) signal.removeEventListener('abort', onAbort); };

    const fileObj = fileItem.file;
    const ext = fileObj.name.split('.').pop().toLowerCase();

    if (isVideoFile(fileObj.name)) {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(fileObj);
      video.muted = true; video.playsInline = true;
      const frames = [];
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      video.onloadedmetadata = () => {
        if (checkAbort()) { cleanup(); URL.revokeObjectURL(video.src); return; }
        const { targetWidth, targetHeight } = calculateTargetSize(video.videoWidth, video.videoHeight);
        canvas.width = targetWidth; canvas.height = targetHeight;
        const duration = video.duration;
        const percentages = [];
        if (numFrames === 1) percentages.push(0.5); 
        else if (numFrames === 2) percentages.push(0.15, 0.85); 
        else {
          const step = (0.85 - 0.15) / (numFrames - 1);
          for (let i = 0; i < numFrames; i++) percentages.push(0.15 + (i * step)); 
        }
        let idx = 0;
        video.onseeked = () => {
          if (checkAbort()) { cleanup(); URL.revokeObjectURL(video.src); return; }
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          frames.push(canvas.toDataURL('image/jpeg', 0.8));
          idx++;
          if (idx < numFrames) {
             video.currentTime = duration * percentages[idx];
          } else { 
             cleanup(); URL.revokeObjectURL(video.src); resolve({ frames, isTransparent: false }); 
          }
        };
        video.onerror = () => { cleanup(); resolve({ frames: [], isTransparent: false }); };
        video.currentTime = duration * percentages[0];
      };
      video.onerror = () => { cleanup(); resolve({ frames: [], isTransparent: false }); };
    } 
    else {
      let urlToLoad = URL.createObjectURL(fileObj);
      let shouldRevoke = true;

      if (ext === 'eps' || ext === 'ai') {
        if (fileItem.isConverted && fileItem.url) {
           urlToLoad = fileItem.url;
           shouldRevoke = false; 
        } else {
           const convertedUrl = await convertVectorWithFallback(fileObj, signal);
           if (convertedUrl) {
              urlToLoad = convertedUrl;
              shouldRevoke = true; 
           } else {
              const canvas = document.createElement('canvas');
              canvas.width = 400; canvas.height = 400;
              const ctx = canvas.getContext('2d');
              ctx.fillStyle = '#f1f5f9'; ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.fillStyle = '#475569'; ctx.font = 'bold 24px sans-serif';
              ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
              ctx.fillText(ext.toUpperCase(), 200, 200);
              resolve({ frames: [canvas.toDataURL('image/jpeg', 0.85)], isTransparent: false });
              cleanup();
              return;
           }
        }
      }

      const img = new Image();
      let isTransparent = false;

      img.onload = () => {
        if (checkAbort()) { cleanup(); if(shouldRevoke) URL.revokeObjectURL(urlToLoad); return; }
        const { targetWidth, targetHeight } = calculateTargetSize(img.width, img.height);
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth; canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');

        if (ext === 'png' || ext === 'webp') {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = 50; tempCanvas.height = 50;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.drawImage(img, 0, 0, 50, 50);
            const imgData = tempCtx.getImageData(0, 0, 50, 50).data;
            for (let i = 3; i < imgData.length; i += 4) {
                if (imgData[i] < 255) { isTransparent = true; break; }
            }
        }

        ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, canvas.width, canvas.height); 
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        resolve({ frames: [canvas.toDataURL('image/jpeg', 0.85)], isTransparent: (ext === 'svg') ? true : isTransparent });
        cleanup(); 
        if(shouldRevoke) URL.revokeObjectURL(urlToLoad);
      };
      img.onerror = () => { 
        cleanup(); 
        if(shouldRevoke) URL.revokeObjectURL(urlToLoad); 
        resolve({ frames: [], isTransparent: false }); 
      };
      img.src = urlToLoad;
    }
  });
};

const saveDeviceIdToDB = async (id) => {
    try {
        const db = await initDB();
        const tx = db.transaction(META_STORE_NAME, 'readwrite');
        tx.objectStore(META_STORE_NAME).put({ key: 'device_id', value: id });
    } catch (err) {
        console.error('Gagal simpan device id ke IndexedDB:', err);
    }
};

const loadDeviceIdFromDB = () => {
    return new Promise(async (resolve) => {
        try {
            const db = await initDB();
            const tx = db.transaction(META_STORE_NAME, 'readonly');
            const req = tx.objectStore(META_STORE_NAME).get('device_id');
            req.onsuccess = () => resolve(req.result ? req.result.value : null);
            req.onerror = () => resolve(null);
        } catch (err) {
            resolve(null);
        }
    });
};

export default function App() {
  const [copiedId, setCopiedId] = useState(null);
  const [deviceId, setDeviceId] = useState('');
  
  // --- AUTH STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginState, setLoginState] = useState('idle'); // idle, loading, success, failed
  
  // TAMBAHKAN DUA BARIS INI:
  const [showFullEmail, setShowFullEmail] = useState(false);
  const getMaskedEmail = (email) => {
      if (!email) return '';
      const [name, domain] = email.split('@');
      if (!domain) return email;
      return '*'.repeat(name.length) + '@' + domain;
  };
  
  // --- TOAST STATE ---
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' }); // type: success | error

  const showToast = (message, type = 'success') => {
      setToast({ show: true, message, type });
      setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };
  
  // Initialize App and Check Auth
  useEffect(() => {
     const initAuth = async () => {
          // 1. Setup Device ID (cross-check localStorage + IndexedDB)
          let currentDeviceId = localStorage.getItem('metal_device_id');
          const dbDeviceId = await loadDeviceIdFromDB();
  
          if (!currentDeviceId && dbDeviceId) {
              // localStorage kosong tapi IndexedDB masih ada -> pulihkan dari sana
              currentDeviceId = dbDeviceId;
              localStorage.setItem('metal_device_id', currentDeviceId);
          } else if (!currentDeviceId) {
            // Keduanya kosong -> baru benar-benar device baru
              currentDeviceId = 'dev_' + Math.random().toString(36).substring(2, 15);
              localStorage.setItem('metal_device_id', currentDeviceId);
          }

          saveDeviceIdToDB(currentDeviceId); // pastikan selalu ke-sync ke IndexedDB
          setDeviceId(currentDeviceId);

          if (navigator.storage && navigator.storage.persist) {
              navigator.storage.persist().then((granted) => {
                  console.log('Persistent storage granted:', granted);
              });
          }
 
          // 2. Check existing session
          const session = localStorage.getItem('metal_session');
          if (session) {
              const parsedSession = JSON.parse(session);
              // Optional: Check expiry if needed. For now, trust the session.
              setIsAuthenticated(true);
              setAuthEmail(parsedSession.email);
              loadInitialData(); // Load IndexedDB data only after confirmed auth
          }
      };
 
      initAuth();
  }, []);

  const loadInitialData = async () => {
      const storedFiles = await loadFilesFromDB();
      setFiles(storedFiles);
  };
  
  const handleLogin = async () => {
      if (!loginEmail.trim()) {
          showToast("Masukkan email terlebih dahulu", "error");
          return;
      }
      
      setLoginState('loading');
      
      try {
          const res = await fetch(GAS_AUTH_URL, {
              method: 'POST',
              mode: 'cors',
              redirect: 'follow',
              headers: { 'Content-Type': 'text/plain;charset=utf-8' },
              body: JSON.stringify({ action: 'login', email: loginEmail, deviceId: deviceId })
          });
          
          const data = await res.json();
          
          if (data.success) {
              setLoginState('success');
              showToast("Selamat Datang Kembali", "success");
              
              // Simpan sesi
              localStorage.setItem('metal_session', JSON.stringify({ email: loginEmail }));
              setAuthEmail(loginEmail);
              setIsAuthenticated(true);
              loadInitialData();
              
          } else {
              setLoginState('failed');
              // Tampilkan pesan error dari GAS
              if (data.message === "Max Device Terpakai") {
                  showToast("Max Device Terpakai", "error");
              } else if (data.message === "Email Tidak Terdaftar") {
                  showToast("Email Tidak Terdaftar", "error");
              } else {
                  showToast(data.message || "Gagal Login", "error");
              }
              
              setTimeout(() => setLoginState('idle'), 1500);
          }
          
      } catch (err) {
          console.error("Auth error:", err);
          setLoginState('failed');
          showToast("Koneksi gagal. Cek internet atau URL Satpam.", "error");
          setTimeout(() => setLoginState('idle'), 1500);
      }
  };

  const handleLogout = () => {
      // Kirim sinyal ke GAS untuk menghapus deviceId yang tersimpan.
      fetch(GAS_AUTH_URL, {
          method: 'POST',
          mode: 'cors',
          redirect: 'follow',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'logout', email: authEmail, deviceId })
      }).catch(err => console.error("Gagal mengirim sinyal logout ke GAS:", err));

      localStorage.removeItem('metal_session');
      setIsAuthenticated(false);
      setAuthEmail('');
      setFiles([]); // Clear UI files
      window.location.reload(); // Paksa reload agar halaman bersih kembali ke form login
  };

  const handleCopyClick = (text, idToSet) => {
    handleCopy(text);
    if (idToSet) {
       setCopiedId(idToSet);
       setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const [platform, setPlatform] = useState(PLATFORMS[0]);
  const [uploadMode, setUploadMode] = useState(UPLOAD_MODES[0]);
  
  const isBackupMode = platform === 'Export Backup Progress';
  const isZipMode = platform === 'Export All (ZIP)';
  
  const defaultCsvOrJson = isBackupMode ? 'metal_backup' : isZipMode ? 'metal_zip' : `metal_${platform.replace(/\s+/g, '').toLowerCase()}`;
  
  const defaultSettings = {
    titleLength: 70, keywordCount: 40, workerCount: 5, workerDelay: 5, frameCount: 3,
    csvFilename: '', customInstructions: '', negativeMetadata: DEFAULT_NEGATIVE
  };

  const [settings, setSettings] = useState(defaultSettings); 

  const activeSettingsRef = useRef({
    titleLength: settings.titleLength,
    keywordCount: settings.keywordCount,
    frameCount: settings.frameCount,
    customInstructions: settings.customInstructions,
    negativeMetadata: settings.negativeMetadata
  });
  
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  
  const filesRef = useRef([]); 
  const isPausedRef = useRef(false);
  const abortControllerRef = useRef(null);
  const isGeneratingRef = useRef(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  useEffect(() => { 
      filesRef.current = files;
      // Sinkronisasi otomatis ke IndexedDB (simpan satu per satu lebih disarankan, 
      // tapi untuk kesederhanaan kita asumsikan fungsi add/update individual dipanggil)
  }, [files]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (files.length > 0 && isGenerating) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [files.length, isGenerating]); 

  const [previewFile, setPreviewFile] = useState(null);
  const [editingFile, setEditingFile] = useState(null);
  const fileInputRef = useRef(null);

  const [fileToDelete, setFileToDelete] = useState(null);
  const [clearAllConfirm, setClearAllConfirm] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => { const timer = setInterval(() => setCurrentTime(new Date()), 1000); return () => clearInterval(timer); }, []);

  const timeString = currentTime.toLocaleTimeString('id-ID', { hour12: false });
  const dateString = currentTime.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

  const hasVideo = files.some(f => isVideoFile(f.file?.name || ''));
  const countPending = files.filter(f => f.status === 'pending').length;
  const countProcessing = files.filter(f => f.status === 'processing').length;
  const countSuccess = files.filter(f => f.status === 'done').length;
  const countFailed = files.filter(f => f.status === 'failed').length;

  const isAppLocked = isGenerating || countProcessing > 0 || isZipping;
  
  const acceptMime = uploadMode === 'Import Backup' ? 'application/json' : (uploadMode === 'EPS' || uploadMode === 'AI') ? 'image/*' : 'image/*,video/*,.ai,.eps,.svg,.pdf';

  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');

  const totalPages = Math.ceil(files.length / itemsPerPage);
  
  useEffect(() => {
      if (currentPage > totalPages && totalPages > 0) {
          setCurrentPage(totalPages);
          setPageInput(String(totalPages));
      }
  }, [files.length, itemsPerPage, totalPages]);

  const handlePageInputChange = (e) => {
      setPageInput(e.target.value);
  };

  const handlePageInputKeyDown = (e) => {
      if (e.key === 'Enter') {
          let newPage = parseInt(pageInput);
          if (isNaN(newPage) || newPage < 1) newPage = 1;
          if (newPage > totalPages) newPage = totalPages;
          setCurrentPage(newPage);
          setPageInput(String(newPage));
      }
  };

  const paginatedFiles = files.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const processSelectedFiles = (selected) => {
    if (!selected.length) return;
    const newFiles = selected.map((originalFile) => {
      let finalFile = originalFile;
      
      if (uploadMode === 'EPS' || uploadMode === 'AI') {
        const ext = uploadMode.toLowerCase();
        const nameWithoutExt = originalFile.name.replace(/\.[^/.]+$/, "");
        const newName = `${nameWithoutExt}.${ext}`;
        finalFile = new File([originalFile], newName, { type: originalFile.type });
      }

      return {
        id: Math.random().toString(36).substr(2, 9),
        file: finalFile, 
        url: URL.createObjectURL(finalFile), 
        status: 'pending', displayLang: 'EN', uploadModeRecord: uploadMode, errorMessage: null,
        cachedMetadata: null,
        isConverted: false, 
        metadata: { title_en: '', description_en: '', keywords_en: '', title_id: '', description_id: '', keywords_id: '', title_zh: '', description_zh: '', keywords_zh: '', category_adobe: '', category_shutterstock: '', category_dreamstime: [], miricanvas_type: '', miricanvas_tier: 'Premium', category_vcg: '' }
      };
    });

    setFiles(prev => [...prev, ...newFiles]);
    // Save new initialized items to DB
    newFiles.forEach(f => saveFileToDB(f));

    newFiles.forEach(async (f) => {
      const ext = f.file.name.split('.').pop().toLowerCase();
      if (ext === 'eps' || ext === 'ai') {
        const thumbUrl = await convertVectorWithFallback(f.file);
        if (thumbUrl) {
          URL.revokeObjectURL(f.url);
          setFiles(prev => {
              const updated = prev.map(item => item.id === f.id ? { ...item, url: thumbUrl, isConverted: true } : item);
              const changedItem = updated.find(item => item.id === f.id);
              if(changedItem) saveFileToDB(changedItem);
              return updated;
          });
        }
      } else if (ext === 'svg') {
        setFiles(prev => {
            const updated = prev.map(item => item.id === f.id ? { ...item, isConverted: true } : item);
            const changedItem = updated.find(item => item.id === f.id);
            if(changedItem) saveFileToDB(changedItem);
            return updated;
        });
      }
    });
  };

  const handleUploadAction = (filesArray) => {
    if (!filesArray.length) return;
    
    if (uploadMode === 'Import Backup') {
        const file = filesArray[0];
        if (file && file.name.endsWith('.json')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const backupData = JSON.parse(event.target.result);
                    setFiles(prev => {
                        const updated = prev.map(f => {
                            const match = backupData.find(b => b.name === f.file.name);
                            if (match) {
                                const newF = { ...f, status: 'done', metadata: match.metadata, errorMessage: null };
                                saveFileToDB(newF);
                                return newF;
                            }
                            return f;
                        });
                        return updated;
                    });
                } catch (err) {
                    showToast('Format JSON tidak valid!', 'error');
                }
            };
            reader.readAsText(file);
        }
        return;
    }
    
    processSelectedFiles(filesArray);
  };

  const handleUpload = (e) => { 
    handleUploadAction(Array.from(e.target.files)); 
    e.target.value = ''; 
  };
  const handleDrop = (e) => {
    e.preventDefault(); setIsDragging(false);
    if(isAppLocked) return;
    if (e.dataTransfer.files) handleUploadAction(Array.from(e.dataTransfer.files));
  };

  const promptClearAll = () => setClearAllConfirm(true);
  const confirmClearAllAction = () => {
    setIsPaused(false); isPausedRef.current = false; setIsGenerating(false); isGeneratingRef.current = false;
    if (abortControllerRef.current) abortControllerRef.current.abort();
    files.forEach(f => { if(f.url) URL.revokeObjectURL(f.url); });
    setFiles([]);
    clearAllFilesFromDB(); // Clear IndexedDB
    setClearAllConfirm(false);
    setCurrentPage(1);
    setPageInput('1');
  };

  const promptRemoveFile = (id) => setFileToDelete(id);
  const confirmDeleteFile = () => {
    setFiles(prev => prev.filter(f => f.id !== fileToDelete));
    deleteFileFromDB(fileToDelete); // Delete from IndexedDB
    setFileToDelete(null);
  };

  const toggleLang = (id) => setFiles(prev => {
    const updated = prev.map(f => {
      if (f.id !== id) return f;
      let nextLang = 'EN';
      if (f.displayLang === 'EN') nextLang = 'ID';
      else if (f.displayLang === 'ID') nextLang = 'ZH';
      const updatedF = { ...f, displayLang: nextLang };
      saveFileToDB(updatedF); // Update DB
      return updatedF;
    });
    return updated;
  });

  const fetchWithRetry = (payload, retries = 5, signal) => {
    return new Promise((resolve, reject) => {
      // Pastikan kita bisa mengirim pesan ke jendela induk (Gemini Canvas)
      if (window.parent === window) {
        return reject(new Error("Aplikasi harus dijalankan di dalam iframe Gemini Canvas."));
      }

      // Buat ID unik untuk melacak permintaan ini
      const requestId = Math.random().toString(36).substr(2, 9);
      
      // Fungsi penangkap balasan dari Canvas
      const messageListener = (event) => {
        const data = event.data;
        if (data && data.type === 'GEMINI_RESPONSE' && data.id === requestId) {
          window.removeEventListener('message', messageListener);
          if (data.success) {
            resolve(data.data);
          } else {
            reject(new Error(data.error || "Gagal memproses di Canvas"));
          }
        }
      };

      // Dengarkan balasan
      window.addEventListener('message', messageListener);

      // Tangani pembatalan request
      if (signal) {
        signal.addEventListener('abort', () => {
          window.removeEventListener('message', messageListener);
          reject(new DOMException('Aborted', 'AbortError'));
        });
      }

      // Kirim payload tertutup ke Canvas!
      window.parent.postMessage({
        type: 'CALL_GEMINI',
        id: requestId,
        payload: payload
      }, '*');

    });
  };

  const callGemini = async (fileItem, signal) => {
    const isVid = isVideoFile(fileItem.file.name);
    const ext = fileItem.file.name.split('.').pop().toLowerCase();
    const isVectorMode = 
      fileItem.uploadModeRecord === 'EPS' || 
      fileItem.uploadModeRecord === 'AI' || 
      ext === 'svg' || 
      ext === 'eps' || 
      ext === 'ai';
    const mediaType = isVid ? 'video' : 'gambar/foto';
    
    const adobeCats = ADOBE_CATEGORIES.map(c => c.en).join(', ');
    const shutterCats = isVid ? SHUTTERSTOCK_VIDEO_CATEGORIES.map(c => c.en).join(', ') : SHUTTERSTOCK_IMAGE_VECTOR_CATEGORIES.map(c => c.en).join(', ');
    const dreamCatsMap = DREAMSTIME_CATEGORIES.map(c => `ID ${c.id}="${c.en}"`).join(', ');
    const dreamCatsExact = DREAMSTIME_CATEGORIES.map(c => c.en).join(', ');
    const vcgCats = isVid ? 'TIDAK PERLU KATEGORI (KOSONGKAN)' : VCG_CATEGORIES.map(c => c.zh).join(', ');

    const extractData = await extractDataJIT(fileItem, isVid ? settings.frameCount : 1, signal);
    const frames = extractData?.frames || [];
    const isTransparent = extractData?.isTransparent || false;

    const transparentInstruction = (isTransparent && !isVectorMode) 
        ? "\n\nATURAN MUTLAK PNG: Ini adalah gambar CUTOUT/TRANSPARAN. JANGAN gunakan keyword 'white background', 'isolated on white'. WAJIB GUNAKAN KEYWORD: 'transparent background', 'png', 'isolated', 'cutout', 'no background'." 
        : "";

    // --- LOGIKA DETERMINISTIK PEMILIHAN FORMULA ---
    const getHash = (str) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = (hash * 31 + str.charCodeAt(i)) | 0;
      }
      return Math.abs(hash);
    };
    const fileHash = getHash(fileItem.file.name);

    // 5 Variasi Struktur Judul (Diperluas dengan fokus pada detail mikro)
    const titleFormulas = [
      "[Subjek Visual Utama] + [Aksi/Kondisi] + [Lingkungan/Konteks]",
      "[Konteks Konsep/Tema] + [Subjek Visual] + [Detail Mikro Visual]",
      "[Gaya Visual/Komposisi] + [Subjek Visual] + [Konteks/Tujuan]",
      "[Fokus Detail Mikro] + [Subjek Visual] + [Gaya/Warna Dominan]",
      "[Target Industri/Penggunaan] + [Subjek Visual] + [Kondisi Spesifik]"
    ];
    const assignedTitleFormula = titleFormulas[fileHash % 5];

    // 6 Variasi Struktur Deskripsi (Tanpa Basa-Basi)
    const descFormulas = [
      "Mulai langsung dengan penjelasan komposisi latar atau gaya visual, lalu sebutkan objek utamanya.",
      "Mulai langsung dengan menyebutkan objek utama beserta detail fisiknya, lalu jelaskan konteks atau aktivitasnya.",
      "Mulai langsung dengan menyoroti detail visual sekunder atau warna dominan, lalu hubungkan dengan objek utamanya.",
      "Mulai langsung dengan menyebutkan sudut pandang atau kontras visual, lalu jelaskan wujud objek utamanya.",
      "Mulai langsung dengan menyoroti elemen mikro (contoh: ketebalan garis, bayangan, bentuk spesifik), lalu gabungkan dengan utilitas objek.",
      "Mulai langsung dengan fokus pada estetika atau mood visual aset, lalu sebutkan subjek utamanya secara lugas."
    ];
    const assignedDescFormula = descFormulas[fileHash % 6];
    // ----------------------------------------------

    const promptText = `Anda adalah Art Director senior dan kurator metadata microstock profesional. Sebelum membuat metadata, tembus 4 LAPIS ANALISIS VISUAL berikut: 
1. Fisik Makro (Objek utama & wujud besar)
2. Fisik Mikro (Gali detail unik JIKA ADA) 
3. Konsep (Pesan/emosi yang dibawa) 
4. Utilitas/Desain (Cara pakai).

<context>
Media Type: ${mediaType}
Filename: "${fileItem.file.name}"
Instruksi Tambahan User: ${settings.customInstructions ? settings.customInstructions : '-'}
(PENTING: Jika merujuk pada Kategori dengan Angka ID, kembalikan HANYA TEKS NAMA KATEGORI, BUKAN ID dari referensi daftar ini: [${dreamCatsMap}]).
</context>

<pantangan_mutlak>
DILARANG KERAS menggunakan kata singkatan kecerdasan buatan atau istilah generatif, serta hindari kata/frasa ini: ${settings.negativeMetadata}.
PENGECUALIAN (OVERRIDE LARANGAN DI ATAS): Jika elemen sensitif benar-benar terlihat jelas di gambar, keyword terkait BOLEH digunakan secara faktual.
</pantangan_mutlak>

<aturan_ketat_metadata>
1. Judul (Title): Gunakan angka ${settings.titleLength} karakter sebagai acuan panjang maksimal. WAJIB gunakan format Title Case (Huruf Kapital di awal setiap kata) untuk bahasa Inggris dan Indonesia.
   - DILARANG diawali kata sandang bahasa Inggris. DILARANG menggunakan kata sifat hiperbola atau opini subjektif yang tidak berwujud fisik.
   - BUYER-INTENT: Judul wajib berorientasi komersial dengan menyebutkan solusi, konsep industri, atau target kegunaan aset, bukan sekadar deskripsi objek buta.
   - FORMULA JUDUL WAJIB UNTUK GAMBAR INI: Anda TIDAK BOLEH MEMILIH. Anda WAJIB menggunakan struktur ini: "${assignedTitleFormula}". JIKA gambar memiliki detail fisik mikro pendukung yang benar-benar terlihat, gunakan untuk memperkaya variasi kata. JIKA gambar terlalu simpel/flat tanpa detail mikro nyata, JANGAN MENGARANG — gunakan variasi dari Konteks Konsep atau Gaya Visual saja.

2. Deskripsi (Description): Gunakan angka ${settings.titleLength} sebagai estimasi panjang rata-rata. WAJIB MINIMAL 5 KATA.
   - ZERO-CLICHE RULE: DILARANG KERAS menggunakan klausa basa-basi, kata sambutan, atau frasa pengantar abstrak di awal kalimat.
   - FORMULA DESKRIPSI WAJIB UNTUK GAMBAR INI: Anda TIDAK BOLEH MEMILIH. Anda WAJIB mematuhi instruksi pembuka kalimat ini: "${assignedDescFormula}".

3. Keyword (Inggris & Indonesia):
   - Berjumlah TEPAT ${settings.keywordCount} buah, dipisah koma dan spasi.
   - FORMAT: Seluruh keyword WAJIB ditulis dalam huruf kecil (lowercase) sepenuhnya. DILARANG KERAS mengulang kata yang PERSIS SAMA dalam satu daftar keyword (meski dalam bahasa yang sama).
   - SISTEM TIER (GRADASI BOBOT):
     * Tier 1 (Urutan 1-10): MURNI FISIK & VISUAL. Hanya objek nyata, detail mikro (jika ada), warna, dan gaya. Inti subjek Judul WAJIB masuk di sini. UJI LOGIKA EKSTREM: Jika kata tersebut tidak bisa disentuh atau difoto wujudnya secara harfiah, DILARANG KERAS masuk ke urutan 1-10!
     * Tier 2 (Urutan 11-25): KONSEP SPESIFIK & AKSI. WAJIB spesifik pada makna UNIK gambar ini! HINDARI kata konsep generik yang dipukul rata untuk semua gambar yang kebetulan bertema sama.
     * Tier 3 (Urutan 26-akhir): KATEGORI PAYUNG. Industri atau tema luas.
   - REGULASI FRASA: Maksimal HANYA 15% dari total keyword yang boleh berupa frasa 2 kata, dan HANYA DIKHUSUSKAN untuk istilah industri komersial baku yang maknanya akan rusak jika dipisah. PENTING: Meskipun objek kompleks memiliki banyak komponen fisik pendukung, NAMA KOMPONEN TERSEBUT WAJIB DIPECAH menjadi kata tunggal (singular). Sisa keyword WAJIB dipisah menjadi kata tunggal. Dilarang keras membuat frasa penggabungan deskriptif yang terdiri dari kata sifat dan kata benda umum, wajib dipecah. Dilarang pakai tanda hubung.

4. Kategori Adobe: Pilih TEPAT 1 dari: [${adobeCats}]. 
5. Kategori Shutterstock: WAJIB pilih TEPAT 2 dari: [${shutterCats}]. Pisahkan dengan koma. TIDAK BOLEH KOSONG.
6. Kategori Dreamstime: WAJIB pilih TEPAT 3 dari: [${dreamCatsExact}]. (Pilih kategori berdasarkan elemen fisik yang BENAR-BENAR TERLIHAT. Jangan asal menyamakan kategori dengan media lain kecuali subjek fisiknya identik).
7. MiriCanvas: Sesuaikan 'miricanvas_type' secara logis dengan medianya. Jika foto nyata (Photo/Background), jika ilustrasi/vektor (SVG/PNG element), jika video (Video). Atur 'miricanvas_tier' ke 'Premium' KECUALI user meminta 'Standard'.

8. Metadata Mandarin (500px/VCG):
   - title_zh & description_zh: JANGAN terjemahkan struktur kalimat Inggris kata-per-kata. Susun ULANG sebagai kalimat Mandarin natural dari nol. PENTING: title_zh WAJIB memuat elemen yang SAMA PERSIS maknanya dengan title_en. DILARANG KERAS menambahkan kata pelengkap abstrak, konsep baru, atau detail ekstra yang tidak memiliki padanan langsung di title_en. Restrukturisasi tata bahasa diizinkan, penambahan makna dilarang. title_zh WAJIB ditulis menyambung tanpa spasi.
   - category_vcg: Pilih TEPAT 1 (Mandarin) dari: [${vcgCats}]. Prioritaskan BENTUK VISUAL/FISIK jika ragu. DILARANG menebak tema konseptual yang tidak berwujud. JIKA INI VIDEO, WAJIB diisi dengan string kosong "".
   - keywords_zh: Maksimal 35 KATA/BUAH FRASA (词). Gunakan Hanzi Sederhana. WAJIB patuhi SISTEM TIER dan REGULASI FRASA pada Aturan No 3 secara ketat. PENTING: keywords_zh WAJIB tunduk pada Uji Logika Ekstrem yang sama seperti Rule #3 (kata abstrak/tidak berwujud fisik mutlak DILARANG di posisi 1-10). WAJIB dicek silang untuk mencegah duplikasi Hanzi yang bermakna identik akibat terjemahan sinonim; jika ada, hapus salah satu. WAJIB menggunakan terminologi industri desain/fotografi Tiongkok. Pisahkan frasa dengan spasi tunggal, TANPA koma atau simbol.

9. Output: TIGA BAHASA (Inggris, Indonesia, Mandarin) dalam JSON.${transparentInstruction}
</aturan_ketat_metadata>

<self_check>
SEBELUM MENGEMBALIKAN JSON, LAKUKAN PENGECEKAN TERTUTUP:
- Apakah Anda 100% mematuhi Formula Judul dan Deskripsi yang ditugaskan secara spesifik?
- Apakah Judul (Inggris dan Indonesia) sudah menggunakan format Title Case?
- Apakah "detail mikro" yang disebutkan di judul/keyword BENAR-BENAR terlihat di gambar, atau hanya dikarang untuk memenuhi kuota variasi? Jika mengarang/halusinasi, hapus dan ganti dengan elemen yang benar-benar nyata!
- Apakah nama komponen-komponen fisik pendukung pada objek kompleks sudah dipecah menjadi kata tunggal di dalam keyword?
- Apakah urutan 1-10 pada keyword (termasuk keywords_zh Mandarin) berisi kata abstrak yang tidak bisa disentuh/difoto? Jika YA, pindahkan ke Tier 2 atau Tier 3!
- Apakah seluruh keyword (EN dan ID) sudah ditulis dalam huruf kecil (lowercase)?
- Apakah ada kata literal yang diulang/duplikat dalam satu bahasa pada keyword? Jika YA, ganti dengan kata baru!
- Apakah ada duplikasi kata/makna pada keywords_zh akibat terjemahan sinonim? Jika YA, hapus duplikatnya!
- Apakah title_zh Mandarin menambahkan kata konsep/makna baru yang tidak disebutkan di title_en? Jika YA, hapus agar konsisten!
- Apakah title_zh Mandarin masih mengandung spasi pemisah? Jika YA, gabungkan menjadi satu kalimat menyambung!
- Apakah kata-kata konseptual (Tier 2) sudah benar-benar spesifik secara unik untuk gambar ini?
</self_check>`;

    let parts = [{ text: promptText }];
    frames.forEach(frame => {
       if (frame) parts.push({ inlineData: { mimeType: 'image/jpeg', data: frame.split(',')[1] } });
    });

    const payload = {
      contents: [{ parts }],
      generationConfig: {
        temperature: 0.15,
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            title_en: { type: "STRING" }, description_en: { type: "STRING" }, keywords_en: { type: "STRING" },
            title_id: { type: "STRING" }, description_id: { type: "STRING" }, keywords_id: { type: "STRING" },
            title_zh: { type: "STRING" }, description_zh: { type: "STRING" }, keywords_zh: { type: "STRING" },
            category_adobe: { type: "STRING" }, category_shutterstock: { type: "STRING" }, 
            category_dreamstime: { type: "ARRAY", items: { type: "STRING" } },
            miricanvas_type: { type: "STRING" }, miricanvas_tier: { type: "STRING" },
            category_vcg: { type: "STRING" }
          },
          required: ["title_en", "description_en", "keywords_en", "title_id", "description_id", "keywords_id", "title_zh", "description_zh", "keywords_zh", "category_adobe", "category_shutterstock", "category_dreamstime", "miricanvas_type", "miricanvas_tier"]
        }
      }
    };
    
    const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error(JSON.stringify({ error: "Request Timeout", message: "AI tidak memberikan respon dalam 60 detik." }, null, 2))), 60000)
    );

    const data = await Promise.race([fetchWithRetry(payload, 5, signal), timeoutPromise]);
    let parsedData = JSON.parse(data.candidates[0].content.parts[0].text);
    
    if(parsedData.keywords_en) parsedData.keywords_en = parsedData.keywords_en.replace(/-/g, ' ').replace(/,\s*/g, ', ');
    if(parsedData.keywords_id) parsedData.keywords_id = parsedData.keywords_id.replace(/-/g, ' ').replace(/,\s*/g, ', ');
    if(parsedData.keywords_zh) parsedData.keywords_zh = parsedData.keywords_zh.replace(/-/g, ' ').replace(/,\s*/g, ', ');
    
    return parsedData;
  };

  const callGeminiEdit = async (fileItem) => {
    const promptText = `User telah mengedit metadata. Perbaiki tata bahasanya agar lebih komersial, lalu terjemahkan/sinkronkan ke bahasa lawannya (Inggris, Indonesia, Mandarin) secara akurat. Keyword wajib 1 kata per item (hindari tanda hubung, gunakan spasi koma secara rapi).
Data Editan Saat Ini (Bahasa diedit user: ${fileItem.displayLang}):
Title: ${fileItem.displayLang === 'EN' ? fileItem.metadata.title_en : fileItem.displayLang === 'ID' ? fileItem.metadata.title_id : fileItem.metadata.title_zh}
Description: ${fileItem.displayLang === 'EN' ? fileItem.metadata.description_en : fileItem.displayLang === 'ID' ? fileItem.metadata.description_id : fileItem.metadata.description_zh}
Keywords: ${fileItem.displayLang === 'EN' ? fileItem.metadata.keywords_en : fileItem.displayLang === 'ID' ? fileItem.metadata.keywords_id : fileItem.metadata.keywords_zh}

Kategori biarkan sama:
Adobe: ${fileItem.metadata.category_adobe}
Shutterstock: ${fileItem.metadata.category_shutterstock}
Dreamstime: ${JSON.stringify(fileItem.metadata.category_dreamstime)}
MiriCanvas Type: ${fileItem.metadata.miricanvas_type}
MiriCanvas Tier: ${fileItem.metadata.miricanvas_tier}
500px (VCG): ${fileItem.metadata.category_vcg}

Kembalikan seluruh data JSON (English, Indonesia, & Mandarin) secara lengkap dan sinkron.`;

    const payload = {
      contents: [{ parts: [{ text: promptText }] }],
      generationConfig: {
        temperature: 0.15,
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            title_en: { type: "STRING" }, description_en: { type: "STRING" }, keywords_en: { type: "STRING" },
            title_id: { type: "STRING" }, description_id: { type: "STRING" }, keywords_id: { type: "STRING" },
            title_zh: { type: "STRING" }, description_zh: { type: "STRING" }, keywords_zh: { type: "STRING" },
            category_adobe: { type: "STRING" }, category_shutterstock: { type: "STRING" }, 
            category_dreamstime: { type: "ARRAY", items: { type: "STRING" } },
            miricanvas_type: { type: "STRING" }, miricanvas_tier: { type: "STRING" },
            category_vcg: { type: "STRING" }
          },
          required: ["title_en", "description_en", "keywords_en", "title_id", "description_id", "keywords_id", "title_zh", "description_zh", "keywords_zh", "category_adobe", "category_shutterstock", "category_dreamstime", "miricanvas_type", "miricanvas_tier"]
        }
      }
    };
    const data = await fetchWithRetry(payload);
    let parsedData = JSON.parse(data.candidates[0].content.parts[0].text);
    
    if(parsedData.keywords_en) parsedData.keywords_en = parsedData.keywords_en.replace(/-/g, ' ').replace(/,\s*/g, ', ');
    if(parsedData.keywords_id) parsedData.keywords_id = parsedData.keywords_id.replace(/-/g, ' ').replace(/,\s*/g, ', ');
    if(parsedData.keywords_zh) parsedData.keywords_zh = parsedData.keywords_zh.replace(/-/g, ' ').replace(/,\s*/g, ', ');

    return parsedData;
  };

  const checkAndClearCache = () => {
    if (activeSettingsRef.current) {
      const current = activeSettingsRef.current;
      const s = settings;
      const isChanged = current.titleLength !== s.titleLength ||
                        current.keywordCount !== s.keywordCount ||
                        current.frameCount !== s.frameCount ||
                        current.customInstructions !== s.customInstructions ||
                        current.negativeMetadata !== s.negativeMetadata;
      
      if (isChanged) {
         setFiles(prev => {
             const updated = prev.map(f => ({ ...f, cachedMetadata: null }));
             updated.forEach(f => saveFileToDB(f)); // Sync reset cache
             return updated;
         });
      }
    }
    activeSettingsRef.current = {
      titleLength: settings.titleLength,
      keywordCount: settings.keywordCount,
      frameCount: settings.frameCount,
      customInstructions: settings.customInstructions,
      negativeMetadata: settings.negativeMetadata
    };
  };

  const generateMetadata = async (isResume = false) => {
    if (isGeneratingRef.current) return;
    
    isGeneratingRef.current = true;
    setIsGenerating(true); 
    setIsPaused(false); 
    isPausedRef.current = false;
    
    checkAndClearCache(); 

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    if (!isResume) {
      setFiles(prev => {
          const updated = prev.map(f => f.status === 'failed' ? { ...f, status: 'pending', errorMessage: null } : f);
          updated.filter(f => f.status === 'pending').forEach(f => saveFileToDB(f));
          return updated;
      });
    }
    
    const runWorkers = async () => {
      const requestedWorkers = parseInt(settings.workerCount) || 5;
      const filesToProcess = filesRef.current.filter(f => f.status === 'pending').length;
      const concurrency = Math.max(1, Math.min(requestedWorkers, filesToProcess));
      
      const delayMs = (parseInt(settings.workerDelay) || 0) * 1000;
      const workers = [];

      for (let workerId = 0; workerId < concurrency; workerId++) {
        workers.push((async () => {
          if (workerId > 0 && delayMs > 0 && !isPausedRef.current) {
            await new Promise(r => setTimeout(r, delayMs * workerId));
          }

          while (!isPausedRef.current) {
            let fileToProcess = null;
            let fileIndex = -1;
            
            for (let j = 0; j < filesRef.current.length; j++) {
              if (filesRef.current[j].status === 'pending') {
                fileIndex = j;
                fileToProcess = filesRef.current[j];
                filesRef.current[j] = { ...fileToProcess, status: 'processing', errorMessage: null };
                break; 
              }
            }

            if (!fileToProcess) break; 
            
            setFiles(prev => {
                const updated = prev.map(f => f.id === fileToProcess.id ? { ...f, status: 'processing', errorMessage: null } : f);
                const item = updated.find(f => f.id === fileToProcess.id);
                if(item) saveFileToDB(item);
                return updated;
            });

            if (fileToProcess.cachedMetadata) {
               const idx = filesRef.current.findIndex(f => f.id === fileToProcess.id);
               if(idx !== -1) {
                 filesRef.current[idx] = { ...filesRef.current[idx], status: 'done', metadata: fileToProcess.cachedMetadata, cachedMetadata: null };
                 setFiles(prev => {
                     const updated = prev.map(f => f.id === fileToProcess.id ? { ...f, status: 'done', metadata: fileToProcess.cachedMetadata, cachedMetadata: null } : f);
                     const item = updated.find(f => f.id === fileToProcess.id);
                     if(item) saveFileToDB(item);
                     return updated;
                 });
               }
            } else {
               const ghostTask = async () => {
                   try {
                     const metadata = await callGemini(fileToProcess, signal);
                     const idx = filesRef.current.findIndex(f => f.id === fileToProcess.id);
                     if (idx !== -1) {
                         if (isPausedRef.current) {
                            filesRef.current[idx] = { ...filesRef.current[idx], status: 'pending', cachedMetadata: metadata };
                            setFiles(prev => {
                                const updated = prev.map(f => f.id === fileToProcess.id ? { ...f, status: 'pending', cachedMetadata: metadata } : f);
                                const item = updated.find(f => f.id === fileToProcess.id);
                                if(item) saveFileToDB(item);
                                return updated;
                            });
                         } else {
                            filesRef.current[idx] = { ...filesRef.current[idx], status: 'done', metadata };
                            setFiles(prev => {
                                const updated = prev.map(f => f.id === fileToProcess.id ? { ...f, status: 'done', metadata } : f);
                                const item = updated.find(f => f.id === fileToProcess.id);
                                if(item) saveFileToDB(item);
                                return updated;
                            });
                         }
                     }
                   } catch (error) {
                     const idx = filesRef.current.findIndex(f => f.id === fileToProcess.id);
                     if (idx !== -1) {
                         if (error.name === 'AbortError' || isPausedRef.current) {
                            filesRef.current[idx] = { ...filesRef.current[idx], status: 'pending' };
                            setFiles(prev => {
                                const updated = prev.map(f => f.id === fileToProcess.id ? { ...f, status: 'pending' } : f);
                                const item = updated.find(f => f.id === fileToProcess.id);
                                if(item) saveFileToDB(item);
                                return updated;
                            });
                         } else {
                            filesRef.current[idx] = { ...filesRef.current[idx], status: 'failed', errorMessage: error.message };
                            setFiles(prev => {
                                const updated = prev.map(f => f.id === fileToProcess.id ? { ...f, status: 'failed', errorMessage: error.message } : f);
                                const item = updated.find(f => f.id === fileToProcess.id);
                                if(item) saveFileToDB(item);
                                return updated;
                            });
                         }
                     }
                   }
               };

               const taskPromise = ghostTask();
               const softTimeout = new Promise(r => setTimeout(() => r('TIMEOUT'), 30000));
               
               await Promise.race([taskPromise, softTimeout]);
            }

            if (delayMs > 0 && !isPausedRef.current) {
               await new Promise(r => setTimeout(r, delayMs));
            }
          }
        })());
      }
      await Promise.all(workers);
    };

    while (!isPausedRef.current) {
      await runWorkers();
      
      await new Promise(r => {
         const check = setInterval(() => {
             const processing = filesRef.current.some(f => f.status === 'processing');
             const pending = filesRef.current.some(f => f.status === 'pending');
             if (!processing) { clearInterval(check); r(); }
             else if (pending) { clearInterval(check); r(); } 
         }, 500);
      });

      const stillPending = filesRef.current.some(f => f.status === 'pending');
      if (!stillPending) break; 
    }

    if (!isPausedRef.current) {
       setIsGenerating(false);
       isGeneratingRef.current = false;
    }
  };

  const handlePauseResume = () => {
    if ((isGenerating || countProcessing > 0) && !isPaused) { 
      setIsPaused(true); 
      isPausedRef.current = true; 
      if (abortControllerRef.current) {
         abortControllerRef.current.abort();
      }
      setFiles(prev => {
          const updated = prev.map(f => f.status === 'processing' ? { ...f, status: 'pending', errorMessage: null } : f);
          updated.forEach(f => { if(f.status === 'pending') saveFileToDB(f); });
          return updated;
      });
      setIsGenerating(false);
      isGeneratingRef.current = false;
    }
    else if (isPaused || (!isGenerating && countPending > 0)) {
      generateMetadata(true); 
    }
  };

  const resolveFilenameForCsv = (fileRecord) => {
    let name = fileRecord.file.name;
    return name;
  };

  const handleExportCSV = async () => {
    if (!files.length) return;
    
    const getBackupJsonStr = () => {
      const backupData = files.filter(f => f.status === 'done').map(f => ({
          name: f.file.name,
          metadata: f.metadata
      }));
      return JSON.stringify(backupData, null, 2);
    };

    const getAdobeCsvStr = () => {
      let csv = 'Filename,Title,Keywords,Category\n';
      files.forEach(f => {
        if(f.status === 'done') {
          const title = (f.metadata.title_en || '').replace(/"/g, '""');
          const keywords = (f.metadata.keywords_en || '').replace(/"/g, '""');
          const cat = (f.metadata.category_adobe || '').replace(/"/g, '""');
          csv += `"${resolveFilenameForCsv(f)}","${title}","${keywords}","${cat}"\n`;
        }
      });
      return csv;
    };

    const getShutterCsvStr = () => {
      let csv = 'Filename,Description,Keywords,Category,Editorial,Mature content,illustration\n';
      files.forEach(f => {
        if(f.status === 'done') {
          const desc = (f.metadata.description_en || '').replace(/"/g, '""');
          const keywords = (f.metadata.keywords_en || '').replace(/"/g, '""');
          const cat = (f.metadata.category_shutterstock || '').replace(/"/g, '""');
          csv += `"${resolveFilenameForCsv(f)}","${desc}","${keywords}","${cat}","no","no","no"\n`;
        }
      });
      return csv;
    };

    const getDreamstimeCsvStr = () => {
      let titleHeader = "Image Name";
      if (files.length > 0) {
        const firstFileExt = resolveFilenameForCsv(files[0]);
        if (isVideoFile(firstFileExt)) titleHeader = "Video Name";
        else if (isVectorExt(firstFileExt)) titleHeader = "Vector Name";
      }
      let csv = `Filename,${titleHeader},Description,Category 1,Category 2,Category 3,Keywords,W-EL,SR-EL,SR-Price,Editorial,MR doc ids,Pr Docs\n`;
      
      const getDtId = (name) => { const found = DREAMSTIME_CATEGORIES.find(c => c.en === name); return found ? found.id : ''; };
      files.forEach(f => {
        if(f.status === 'done') {
          const title = (f.metadata.title_en || '').replace(/"/g, '""');
          const desc = (f.metadata.description_en || '').replace(/"/g, '""');
          const keywords = (f.metadata.keywords_en || '').replace(/"/g, '""');
          const dtCats = f.metadata.category_dreamstime || [];
          const cat1 = getDtId(dtCats[0] || '');
          const cat2 = getDtId(dtCats[1] || '');
          const cat3 = getDtId(dtCats[2] || '');
          csv += `"${resolveFilenameForCsv(f)}","${title}","${desc}","${cat1}","${cat2}","${cat3}","${keywords}","","","","","",""\n`;
        }
      });
      return csv;
    };

    const getMiriCanvasCsvStr = () => {
      let csv = 'fileName,elementName,keywords,tier,contentType\n';
      files.forEach(f => {
        if(f.status === 'done') {
          const originalName = resolveFilenameForCsv(f);
          const nameWithoutExt = originalName.replace(/\.[^/.]+$/, "");
          const title = (f.metadata.title_en || '').replace(/"/g, '""');
          const rawKeywords = (f.metadata.keywords_en || '').split(',').map(k => k.trim()).filter(k => k.length > 0);
          const keywords = rawKeywords.slice(0, 25).join(', ').replace(/"/g, '""');
          const tier = f.metadata.miricanvas_tier || 'Premium';
          const contentType = f.metadata.miricanvas_type || 'Photo';
          csv += `"${nameWithoutExt}","${title}","${keywords}","${tier}","${contentType}"\n`;
        }
      });
      return csv;
    };

    const getArabStockCsvStr = () => {
      let csv = 'Filename,Title,Tag\n';
      files.forEach(f => {
        if(f.status === 'done') {
          const title = (f.metadata.title_en || '').replace(/"/g, '""');
          const keywords = (f.metadata.keywords_en || '').replace(/"/g, '""');
          csv += `"${resolveFilenameForCsv(f)}","${title}","${keywords}"\n`;
        }
      });
      return csv;
    };

    const getVcgCsvStr = () => {
      let csv = 'Filename,Title,Description,Keywords,Category\n';
      files.forEach(f => {
        if(f.status === 'done') {
          const title = (f.metadata.title_zh || '').replace(/"/g, '""');
          const desc = (f.metadata.description_zh || '').replace(/"/g, '""');
          const rawKeywords = (f.metadata.keywords_zh || '').split(',').map(k => k.trim()).filter(k => k.length > 0);
          const keywords = rawKeywords.slice(0, 35).join(', ').replace(/"/g, '""');
          const cat = (f.metadata.category_vcg || '').replace(/"/g, '""');
          csv += `"${resolveFilenameForCsv(f)}","${title}","${desc}","${keywords}","${cat}"\n`;
        }
      });
      return csv;
    };

    const downloadFile = (content, filename, type) => {
      const blob = new Blob([content], { type });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    if (platform === 'Export All (ZIP)') {
      setIsZipping(true);
      try {
        const JSZip = await loadJSZip();
        const zip = new JSZip();
        
        zip.file("Adobe_Stock_Metadata.csv", getAdobeCsvStr());
        zip.file("Shutterstock_Metadata.csv", getShutterCsvStr());
        zip.file("Dreamstime_Metadata.csv", getDreamstimeCsvStr());
        zip.file("MiriCanvas_Metadata.csv", getMiriCanvasCsvStr());
        zip.file("500px_VCG_Metadata.csv", getVcgCsvStr());
        zip.file("Arab_Stock_Metadata.csv", getArabStockCsvStr());
        zip.file("Backup_Metadata.json", getBackupJsonStr());
        
        const zipBlob = await zip.generateAsync({ type: "blob" });
        let fileName = settings.csvFilename.trim() || 'metal_zip';
        if (!fileName.toLowerCase().endsWith('.zip')) fileName += '.zip';
        
        downloadFile(zipBlob, fileName, 'application/zip');
      } catch (err) {
        showToast("Gagal membuat ZIP", "error");
      } finally {
        setIsZipping(false);
      }
      return;
    }
    
    let fileName = settings.csvFilename.trim() || defaultCsvOrJson;

    if (platform === 'Export Backup Progress') {
      if (!fileName.toLowerCase().endsWith('.json')) fileName += '.json';
      downloadFile(getBackupJsonStr(), fileName, 'application/json');
      return;
    }

    if (!fileName.toLowerCase().endsWith('.csv')) fileName += '.csv';
    
    let csvContent = '';
    if (platform === 'Adobe Stock') csvContent = getAdobeCsvStr();
    else if (platform === 'Shutterstock') csvContent = getShutterCsvStr();
    else if (platform === 'Dreamstime') csvContent = getDreamstimeCsvStr();
    else if (platform === 'MiriCanvas') csvContent = getMiriCanvasCsvStr();
    else if (platform === '500px (VCG)') csvContent = getVcgCsvStr();
    else if (platform === 'Arab Stock') csvContent = getArabStockCsvStr();

    downloadFile(csvContent, fileName, 'text/csv;charset=utf-8;');
  };

  const saveEdit = async () => {
    const fileToUpdate = { ...editingFile };
    setEditingFile(null);
    setFiles(prev => {
        const updated = prev.map(f => f.id === fileToUpdate.id ? { ...fileToUpdate, status: 'processing', errorMessage: null } : f);
        const item = updated.find(f => f.id === fileToUpdate.id);
        if(item) saveFileToDB(item);
        return updated;
    });
    
    try {
      const updatedMeta = await callGeminiEdit(fileToUpdate);
      setFiles(prev => {
          const updated = prev.map(f => f.id === fileToUpdate.id ? { ...f, status: 'done', metadata: updatedMeta } : f);
          const item = updated.find(f => f.id === fileToUpdate.id);
          if(item) saveFileToDB(item);
          return updated;
      });
    } catch (error) {
      setFiles(prev => {
          const updated = prev.map(f => f.id === fileToUpdate.id ? { ...fileToUpdate, status: 'failed', errorMessage: `Edit Gagal: ${error.message}` } : f);
          const item = updated.find(f => f.id === fileToUpdate.id);
          if(item) saveFileToDB(item);
          return updated;
      });
    }
  };

  const translateCat = (catName, dict, displayLang) => {
    if (displayLang === 'EN' || !catName) return catName;
    const found = dict.find(c => c.en === catName);
    return found && found.id_lang ? found.id_lang : catName;
  };

  const translateVcgCat = (catName, displayLang) => {
    if (!catName) return catName;
    const found = VCG_CATEGORIES.find(c => c.zh === catName);
    if (!found) return catName;
    if (displayLang === 'EN') return found.en;
    if (displayLang === 'ID') return found.id_lang;
    return catName; 
  };

  const isAdobe = platform === 'Adobe Stock';
  const isShutter = platform === 'Shutterstock';
  const isDream = platform === 'Dreamstime';
  const isArab = platform === 'Arab Stock';
  const isMiri = platform === 'MiriCanvas';
  const isVcg = platform === '500px (VCG)';

  const displayTotalFiles = files.length;
  const completedCount = countSuccess;
  const failedCount = countFailed;
  
  const isCurrentTabProcessing = isGenerating || countProcessing > 0 || isPaused;
  const isCurrentTabPaused = isPaused;

  const canGenerate = (countPending > 0 || countFailed > 0) && !isGenerating && !isPaused && !isZipping;
  const canPauseResume = (isGenerating || countProcessing > 0 || isPaused) && !isZipping;
  const isCsvActive = !isAppLocked && countSuccess > 0 && !isZipping;

  const getStatusBorderColor = () => {
      if (isCurrentTabProcessing && !isCurrentTabPaused) return 'border-blue-400 shadow-md ring-1 ring-blue-200';
      if (isCurrentTabProcessing && isCurrentTabPaused) return 'border-amber-400 shadow-md ring-1 ring-amber-200';
      if (failedCount > 0) return 'border-red-200';
      if (completedCount > 0 && completedCount === displayTotalFiles && displayTotalFiles > 0) return 'border-green-300';
      return 'border-slate-200';
  };

  const getLoadingButtonStyle = () => {
      if (isCurrentTabPaused) return 'from-amber-50 to-amber-100 text-amber-700 border-amber-200';
      return 'from-blue-50 to-blue-100 text-blue-700 border-blue-200';
  };

  const getLoadingIconColor = () => {
      if (isCurrentTabPaused) return 'text-amber-600';
      return 'text-blue-600';
  };

  const inputClass = "w-full text-sm py-1.5 px-2 border border-slate-300 rounded bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none focus:border-blue-500 transition-all disabled:bg-slate-100 disabled:text-slate-400 placeholder:text-slate-300 h-[30px]";

  if (!isAuthenticated) {
      return (
          <div className="fixed inset-0 flex items-center justify-center bg-slate-100 overflow-hidden" style={{ fontFamily: "'Share Tech', sans-serif", backgroundImage: 'linear-gradient(rgba(59, 130, 246, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.05) 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Share+Tech&display=swap');
            `}</style>

            {/* GLOBAL TOAST NOTIFICATION */}
            <div className={`fixed top-4 right-4 z-[9999] transition-all duration-500 transform ${toast.show ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
                <div className={`px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 border ${toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                    {toast.type === 'error' ? <AlertTriangleIcon className="w-5 h-5"/> : <CheckCircleIcon className="w-5 h-5"/>}
                    <span className="font-bold text-sm tracking-wide">{toast.message}</span>
                </div>
            </div>

            <div className={`flex flex-col items-center justify-center w-full max-w-sm px-4 z-10 transition-all duration-500 ${loginState === 'success' ? 'opacity-0 scale-110' : 'opacity-100 scale-100'}`}>
                {/* Di bawah ini border-slate-200 diubah menjadi border-blue-200 */}
                <div className="w-full bg-white p-6 rounded-lg border border-blue-200 shadow-md flex flex-col gap-4 relative z-10">
                    <div className="text-center mb-2">
                        <h1 className="text-2xl font-bold text-blue-600 tracking-widest">METAL LOGIN</h1>
                    </div>
                    <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} className="w-full p-3 rounded-lg bg-white border border-slate-300 text-slate-800 font-bold text-center outline-none transition-all h-12 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:bg-slate-100" placeholder="MASUKKAN EMAIL" disabled={loginState === 'loading' || loginState === 'success'} />
                    {/* Di bawah ini class bg-slate-800 diubah menjadi bg-blue-600 hover:bg-blue-700 */}
                    <button onClick={handleLogin} disabled={loginState === 'loading' || loginState === 'success'} className="bg-blue-600 hover:bg-blue-700 text-white p-3 text-base font-bold rounded-lg cursor-pointer shadow-sm transition disabled:opacity-50">
                        {loginState === 'loading' ? 'MEMPROSES...' : 'LOGIN'}
                    </button>
                </div>
            </div>
          </div>
      );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech&display=swap');
        body { font-family: 'Share Tech', sans-serif; overscroll-behavior: contain; margin: 0; padding: 0; }
        .custom-scroll::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
      `}</style>
      
      {/* GLOBAL TOAST NOTIFICATION */}
      <div className={`fixed top-4 right-4 z-[9999] transition-all duration-500 transform ${toast.show ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
          <div className={`px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 border ${toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
              {toast.type === 'error' ? <AlertTriangleIcon className="w-5 h-5"/> : <CheckCircleIcon className="w-5 h-5"/>}
              <span className="font-bold text-sm tracking-wide">{toast.message}</span>
          </div>
      </div>

      <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-slate-100 text-slate-900 flex flex-col">
        
        <header className="bg-[#0f172a] border-b border-slate-800 sticky top-0 z-30 shadow-md h-14 flex items-center shrink-0">
          <div className="w-full px-4 sm:px-6 flex justify-between items-center">
            {/* Tautan pada Logo dihilangkan */}
            <div className="text-2xl font-bold text-white tracking-widest flex items-center gap-2">
              METAL
            </div>
            <div className="text-right flex flex-col justify-center items-end text-slate-100">
              <div className="text-[16px] leading-none font-bold tracking-[0.1em]">{timeString}</div>
              <div className="text-[11px] leading-tight text-slate-400 tracking-wider mt-0.5">{dateString}</div>
            </div>
          </div>
        </header>

        <main className="w-full flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden relative min-h-0 bg-slate-100">
          
          <aside className="w-full lg:w-[380px] bg-slate-50 lg:border-r border-slate-200 flex flex-col z-20 shrink-0 lg:h-full lg:overflow-hidden">
            
            <div className="flex-1 flex flex-col overflow-y-visible lg:overflow-y-auto overflow-x-hidden custom-scroll">
              <div className="p-4 flex flex-col gap-4">
                
                {/* ACTIVE USER PANEL (Menggantikan My Project & Support) */}
                {/* border-slate-200 diubah menjadi border-blue-200 */}
                <div className="flex items-center justify-between p-3 bg-white border border-blue-200 rounded-lg shadow-sm">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                            <UserIcon className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Email Aktif</span>
                            {/* Email dipanggil melalui logika sensor bintang */}
                            <span className="text-xs font-bold text-slate-700 truncate pr-2">
                                {showFullEmail ? authEmail : getMaskedEmail(authEmail)}
                            </span>
                        </div>
                    </div>
                    {/* Tambahan grup div untuk membungkus tombol Mata dan Logout agar bersebelahan */}
                    <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={() => setShowFullEmail(!showFullEmail)} className="w-8 h-8 flex items-center justify-center bg-slate-50 text-slate-500 hover:bg-slate-200 hover:text-slate-700 rounded-md transition-colors shadow-sm shrink-0" title={showFullEmail ? "Sembunyikan Email" : "Tampilkan Email"}>
                            <EyeIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => setLogoutConfirm(true)} className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-md transition-colors shadow-sm shrink-0" title="Logout">
                            <LogOutIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-200">
                  <div className="flex items-center justify-between mb-3 pb-1.5 border-b border-blue-100">
                    <h2 className="text-[15px] font-bold text-slate-700 uppercase tracking-wide">Pengaturan & Unggah</h2>
                    {/* Indikator dot hijau/merah dihapus */}
                  </div>
                  
                  <div className="mb-3">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Platform Pilihan</label>
                    <select value={platform} onChange={(e) => setPlatform(e.target.value)} disabled={isAppLocked} className={`${inputClass} font-bold cursor-pointer disabled:opacity-60`}>
                      {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>

                  <div className="mb-4 relative">
                    <div className="flex justify-between items-end mb-1">
                      <label className="block text-[11px] font-bold text-slate-600">Unggah Media</label>
                      <select value={uploadMode} onChange={e => setUploadMode(e.target.value)} disabled={isAppLocked} className="border border-slate-300 rounded text-[10px] font-bold px-1.5 py-0.5 bg-slate-50 outline-none cursor-pointer disabled:opacity-60 text-slate-700">
                        {UPLOAD_MODES.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <input type="file" multiple accept={acceptMime} webkitdirectory={uploadMode === 'Folder' ? "true" : undefined} className="hidden" ref={fileInputRef} onChange={handleUpload} disabled={isAppLocked} />
                    <div onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={handleDrop} onClick={() => { if(!isAppLocked) fileInputRef.current?.click() }} className={`w-full h-20 flex flex-col items-center justify-center gap-1 border-2 border-dashed rounded-lg transition-all active:scale-[0.99] cursor-pointer ${isAppLocked ? 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-200' : isDragging ? 'border-blue-500 bg-blue-100 scale-[1.02]' : 'border-blue-300 hover:bg-blue-50 text-blue-700'}`}>
                      <div className="flex items-center gap-2.5">
                        {uploadMode === 'Folder' ? <FolderPlusIcon /> : uploadMode === 'Import Backup' ? <FileJsonIcon /> : <FilePlusIcon />}
                        <span className={`text-xs uppercase tracking-widest ${isDragging ? 'font-black' : 'font-bold'}`}>
                           {uploadMode === 'File' ? 'UPLOAD ASSETS' : uploadMode === 'Folder' ? 'UPLOAD FOLDER' : uploadMode === 'Import Backup' ? 'UPLOAD BACKUP' : 'UPLOAD FILE IMAGE'}
                        </span>
                      </div>
                      <span className={`text-[9px] font-bold text-slate-500 uppercase tracking-tighter px-4 ${isDragging ? 'text-blue-600' : 'text-slate-400'}`}>
                        {uploadMode === 'Import Backup' ? 'JSON backup' : uploadMode === 'EPS' || uploadMode === 'AI' ? `Convert to .${uploadMode.toLowerCase()} Format` : 'JPG, PNG, WEBP, MP4, MOV, SVG, AI, EPS, DLL'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5 leading-tight">Pjg Title/Desc</label>
                      <input type="number" value={settings.titleLength} onChange={e => setSettings({...settings, titleLength: e.target.value})} disabled={isAppLocked} className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5 leading-tight">Jml Keyword</label>
                      <input type="number" value={settings.keywordCount} onChange={e => setSettings({...settings, keywordCount: e.target.value})} disabled={isAppLocked} className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5 leading-tight">Frame (Vid)</label>
                      <input type="number" min="1" value={settings.frameCount} onChange={e => setSettings({...settings, frameCount: e.target.value})} disabled={isAppLocked || !hasVideo} className={`${inputClass} disabled:opacity-50`} />
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-2 mb-3">
                    <div className="col-span-1">
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Worker</label>
                      <input type="number" value={settings.workerCount} onChange={e => setSettings({...settings, workerCount: e.target.value})} disabled={isAppLocked} className={inputClass} />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Delay</label>
                      <input type="number" value={settings.workerDelay} onChange={e => setSettings({...settings, workerDelay: e.target.value})} disabled={isAppLocked} className={inputClass} />
                    </div>
                    <div className="col-span-3">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <FileTextIcon />
                        <label className="block text-[10px] font-bold text-slate-600 leading-none">{isBackupMode ? 'Custom Nama JSON' : isZipMode ? 'Custom Nama ZIP' : 'Custom Nama CSV'}</label>
                      </div>
                      <input type="text" value={settings.csvFilename} onChange={e => setSettings({...settings, csvFilename: e.target.value})} disabled={isAppLocked} placeholder={defaultCsvOrJson} className={`${inputClass} placeholder:text-slate-400`} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Instruksi Tambahan</label>
                      <textarea value={settings.customInstructions} onChange={e => setSettings({...settings, customInstructions: e.target.value})} disabled={isAppLocked} className="w-full text-xs p-2 border border-slate-300 rounded bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all disabled:bg-slate-100 disabled:text-slate-400 h-14 resize-none custom-scroll leading-tight" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-red-600 mb-0.5">Negative Metadata</label>
                      <textarea value={settings.negativeMetadata} onChange={e => setSettings({...settings, negativeMetadata: e.target.value})} disabled={isAppLocked} className="w-full text-xs p-2 border border-red-200 rounded bg-red-50/30 text-slate-900 focus:ring-2 focus:ring-red-500 focus:outline-none transition-all disabled:bg-slate-100 disabled:text-slate-400 h-14 resize-none custom-scroll leading-tight" />
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <div className="shrink-0 p-4 bg-slate-50 border-t border-slate-200 flex flex-col gap-4 z-10">
              
              <div className={`bg-white rounded-lg border ${getStatusBorderColor()} shadow-sm transition-all duration-300 overflow-hidden`}>
                  <div className="grid grid-cols-3 gap-0 border-b border-slate-100 p-2 bg-slate-50">
                      <div className="flex flex-col items-center justify-center border border-blue-200 rounded-lg bg-blue-50 py-1.5 shadow-sm transition-all">
                          <div className="flex items-center gap-1 mb-1 text-blue-600">
                              <ClockIcon />
                              <span className="text-xs font-medium capitalize leading-none">Selected</span>
                          </div>
                          <span className="text-xs font-black text-blue-600 tabular-nums">{countPending + countProcessing}</span>
                      </div>
                      <div className="mx-1.5 flex flex-col items-center justify-center border border-green-200 rounded-lg bg-green-50 py-1.5 shadow-sm transition-all">
                          <div className="flex items-center gap-1 mb-1 text-green-600">
                              <CheckCircleIcon />
                              <span className="text-xs font-medium capitalize leading-none">Completed</span>
                          </div>
                          <span className="text-xs font-black text-green-700 tabular-nums">{completedCount}</span>
                      </div>
                      <div className="flex flex-col items-center justify-center border border-red-200 rounded-lg bg-red-50 py-1.5 shadow-sm transition-all">
                          <div className="flex items-center gap-1 mb-1 text-red-600">
                              <XCircleIcon />
                              <span className="text-xs font-medium capitalize leading-none">Failed</span>
                          </div>
                          <span className="text-xs font-black text-red-700 tabular-nums">{failedCount}</span>
                      </div>
                  </div>
                  <div className="p-3 bg-white flex items-center justify-between gap-3">
                      <button 
                          onClick={promptClearAll} 
                          disabled={isAppLocked || files.length === 0 || isZipping} 
                          className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-sm font-bold uppercase tracking-wide rounded border transition-colors ${files.length > 0 && (!isCurrentTabProcessing || isCurrentTabPaused) && !isZipping ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed opacity-50'}`}
                      >
                          <Trash2Icon /> CLEAR ALL
                      </button>
                  </div>
              </div>

              <div className="flex gap-1.5 h-10">
                  {isCurrentTabProcessing ? (
                      <div className={`flex-1 bg-gradient-to-r border text-xs font-bold rounded-lg flex items-center justify-center gap-2 shadow-sm select-none transition-all duration-300 ${getLoadingButtonStyle()}`}>
                          <SparklesIcon className={`w-4 h-4 ${isPaused ? '' : 'animate-spin'} ${getLoadingIconColor()}`} style={{ animationDuration: '3s' }} />
                          <span className="uppercase tracking-wide">{isTabPaused ? 'Terhenti' : <>Memproses<span className="dot-anim inline-block w-3 text-left"></span></>}</span>
                      </div>
                  ) : (
                      <button 
                          onClick={() => generateMetadata(false)} 
                          disabled={!canGenerate} 
                          className={`flex-1 text-xs font-bold rounded-lg border shadow transition-colors flex items-center justify-center gap-2 uppercase tracking-wide truncate ${canGenerate ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-700 hover:-translate-y-0.5 duration-200' : 'bg-slate-100 border-slate-200 cursor-not-allowed text-slate-400'}`}
                      >
                          <Wand2Icon className="w-3 h-3" />
                          <span className="truncate">Generate</span>
                      </button>
                  )}

                  <button 
                      onClick={handlePauseResume} 
                      disabled={!canPauseResume} 
                      className={`w-10 h-10 flex items-center justify-center rounded-lg border shadow-sm transition-all active:scale-95 shrink-0 ${!canPauseResume ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : isCurrentTabPaused ? 'bg-green-600 border-green-700 text-white hover:bg-green-700 hover:-translate-y-0.5 duration-200' : 'bg-amber-100 border-amber-300 text-amber-600 hover:bg-amber-200 hover:-translate-y-0.5 duration-200'}`}
                  >
                      {isCurrentTabPaused ? <PlayIcon /> : <PauseIcon />}
                  </button>

                  <button 
                      onClick={handleExportCSV} 
                      disabled={!isCsvActive || isZipping} 
                      className={`flex-1 text-xs font-bold rounded-lg border shadow transition-colors flex items-center justify-center gap-2 uppercase tracking-wide truncate ${(isCsvActive && !isZipping) ? 'bg-green-600 hover:bg-green-700 text-white border-green-700 hover:-translate-y-0.5 duration-200' : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-80'}`}
                  >
                      {isZipping ? <SparklesIcon className="w-4 h-4 animate-spin text-slate-400" /> : <DownloadIcon />}
                      <span className="truncate">Export {isBackupMode ? 'JSON' : isZipMode ? 'ZIP' : 'CSV'}</span>
                  </button>
              </div>

            </div>
          </aside>

          {/* AREA KANAN: Daftar File & Pagination */}
          <section className="flex-1 flex flex-col lg:overflow-hidden relative min-h-0 bg-slate-100">
            
            {/* --- PAGINATION CONTROL BENTUK BARU --- */}
            <div className="bg-white border-b border-slate-200 p-3 flex justify-between items-center shrink-0 shadow-sm z-10">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                    {[50, 100, 150, 200, 250].map(num => (
                        <button key={num} onClick={() => { setItemsPerPage(num); setCurrentPage(1); setPageInput('1'); }} className={`px-2 py-1 rounded border transition ${itemsPerPage === num ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border-slate-200'}`}>
                            {num}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-3">
                    <button disabled={currentPage === 1} onClick={() => {setCurrentPage(p => p - 1); setPageInput(String(currentPage - 1));}} className="p-1 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-50 border border-slate-200 transition"><ChevronLeftIcon /></button>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-700 tracking-widest">{currentPage} / {totalPages || 1}</span>
                    </div>
                    <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => {setCurrentPage(p => p + 1); setPageInput(String(currentPage + 1));}} className="p-1 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-50 border border-slate-200 transition"><ChevronRightIcon /></button>
                </div>
            </div>

            <div className="flex-1 p-4 lg:overflow-y-auto custom-scroll pb-20 lg:pb-4">
              {files.length > 0 ? (
                
                <div className="grid gap-4 items-start" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
                  {paginatedFiles.map(f => (
                    <div key={f.id} className={`bg-white hover:shadow-md rounded-lg shadow-sm border flex flex-col transition-all duration-300 ${f.status === 'processing' ? 'border-blue-400 ring-2 ring-blue-100' : f.status === 'failed' ? 'border-red-300' : 'border-blue-200'}`}>
                      
                      <div className="grid grid-cols-4 gap-2 p-2 bg-blue-50/50 border-b border-blue-100 rounded-t-lg shrink-0">
                        <button onClick={() => setPreviewFile(f)} className="flex flex-row items-center justify-center gap-1.5 py-1.5 rounded border bg-white border-blue-200 text-blue-600 hover:bg-blue-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed" title="Preview File">
                          <EyeIcon />
                          <span className="text-[10px] font-bold uppercase tracking-tight truncate">Prev</span>
                        </button>
                        <button disabled={f.status !== 'done'} onClick={() => setEditingFile({...f})} className="flex flex-row items-center justify-center gap-1.5 py-1.5 rounded border bg-white border-blue-200 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed" title="Edit Metadata">
                          <EditIcon />
                          <span className="text-[10px] font-bold uppercase tracking-tight truncate">Edit</span>
                        </button>
                        <button disabled={f.status !== 'done'} onClick={() => toggleLang(f.id)} className={`flex flex-row items-center justify-center gap-1.5 py-1.5 rounded border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${f.displayLang === 'EN' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'} hover:brightness-95`} title="Toggle Language">
                          <LangIcon />
                          <span className="text-[10px] font-bold uppercase tracking-tight truncate">{f.displayLang}</span>
                        </button>
                        <button disabled={isAppLocked || isZipping || f.status === 'pending' || f.status === 'processing'} onClick={() => promptRemoveFile(f.id)} className="flex flex-row items-center justify-center gap-1.5 py-1.5 rounded border bg-white border-blue-200 text-red-500 hover:bg-red-50 hover:border-red-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed" title="Delete File">
                          <TrashIcon />
                          <span className="text-[10px] font-bold uppercase tracking-tight truncate">Del</span>
                        </button>
                      </div>

                      <div className="p-2 border-b border-blue-100 flex justify-between items-center gap-1 shrink-0 bg-white relative">
                        <p className="text-[12px] font-bold text-slate-800 truncate" title={f.file?.name}>{f.file?.name}</p>
                        <span className={`text-[8px] font-black tracking-widest px-1.5 py-0.5 rounded border whitespace-nowrap ${f.status === 'done' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : f.status === 'processing' ? 'bg-blue-50 text-blue-700 border-blue-200' : f.status === 'failed' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                          {f.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="p-2 w-full h-[150px] bg-white rounded-b-lg relative flex flex-col">
                        <div className="flex-1 overflow-x-hidden overflow-y-auto break-words custom-scroll flex flex-col gap-2.5 text-[11px] leading-snug whitespace-normal border border-blue-200 bg-blue-50/10 rounded p-1.5 relative">
                          {f.status === 'done' ? (
                            <>
                              <div className={isAdobe || isDream || isArab || isBackupMode || isZipMode || isVcg || isMiri ? 'text-blue-600' : 'text-slate-500'}>
                                <div className="text-[9px] font-bold mb-0.5 flex items-center gap-1 uppercase tracking-widest opacity-80">
                                  Title
                                  <button onClick={() => handleCopyClick(f.displayLang === 'EN' ? f.metadata.title_en : f.displayLang === 'ID' ? f.metadata.title_id : f.metadata.title_zh, `${f.id}-title`)} className={`transition-colors ${copiedId === `${f.id}-title` ? 'text-blue-500 scale-110' : 'text-inherit hover:opacity-70'}`} title="Salin Title"><CopyIcon /></button>
                                </div>
                                <div className="font-medium">{f.displayLang === 'EN' ? f.metadata.title_en : f.displayLang === 'ID' ? f.metadata.title_id : f.metadata.title_zh}</div>
                              </div>
                              
                              <div className={isShutter || isDream || isBackupMode || isZipMode || isVcg ? 'text-blue-600' : 'text-slate-500'}>
                                <div className="text-[9px] font-bold mb-0.5 flex items-center gap-1 uppercase tracking-widest opacity-80">
                                  Deskripsi
                                  <button onClick={() => handleCopyClick(f.displayLang === 'EN' ? f.metadata.description_en : f.displayLang === 'ID' ? f.metadata.description_id : f.metadata.description_zh, `${f.id}-desc`)} className={`transition-colors ${copiedId === `${f.id}-desc` ? 'text-blue-500 scale-110' : 'text-inherit hover:opacity-70'}`} title="Salin Deskripsi"><CopyIcon /></button>
                                </div>
                                <div className="font-medium">
                                  {f.displayLang === 'EN' ? f.metadata.description_en : f.displayLang === 'ID' ? f.metadata.description_id : f.metadata.description_zh}
                                </div>
                              </div>
                              
                              <div className="text-blue-600">
                                <div className="text-[9px] font-bold mb-0.5 flex items-center gap-1 uppercase tracking-widest opacity-80">
                                  {isArab ? 'Tag' : 'Keyword'}
                                  <button onClick={() => handleCopyClick(f.displayLang === 'EN' ? f.metadata.keywords_en : f.displayLang === 'ID' ? f.metadata.keywords_id : f.metadata.keywords_zh, `${f.id}-key`)} className={`transition-colors ${copiedId === `${f.id}-key` ? 'text-blue-500 scale-110' : 'text-inherit hover:opacity-70'}`} title={isArab ? "Salin Tag" : "Salin Keyword"}><CopyIcon /></button>
                                </div>
                                <div className="font-medium">{f.displayLang === 'EN' ? f.metadata.keywords_en : f.displayLang === 'ID' ? f.metadata.keywords_id : f.metadata.keywords_zh}</div>
                              </div>

                              <div className={isAdobe || isBackupMode || isZipMode ? 'text-blue-600' : 'text-slate-500'}>
                                <div className="text-[9px] font-bold mb-0.5 uppercase tracking-widest opacity-80">Kategori Adobe</div>
                                <div className="font-medium">{translateCat(f.metadata.category_adobe, ADOBE_CATEGORIES, f.displayLang)}</div>
                              </div>

                              <div className={isShutter || isBackupMode || isZipMode ? 'text-blue-600' : 'text-slate-500'}>
                                <div className="text-[9px] font-bold mb-0.5 uppercase tracking-widest opacity-80">Kat. Shutterstock</div>
                                <div className="font-medium">
                                  {f.metadata.category_shutterstock.split(',').map(c => translateCat(c.trim(), isVideoFile(f.file?.name || '') ? SHUTTERSTOCK_VIDEO_CATEGORIES : SHUTTERSTOCK_IMAGE_VECTOR_CATEGORIES, f.displayLang)).join(', ')}
                                </div>
                              </div>

                              <div className={isDream || isBackupMode || isZipMode ? 'text-blue-600' : 'text-slate-500'}>
                                <div className="text-[9px] font-bold mb-0.5 uppercase tracking-widest opacity-80">Kat. Dreamstime</div>
                                <div className="flex flex-col font-medium">
                                  {f.metadata.category_dreamstime && f.metadata.category_dreamstime.map((cat, idx) => {
                                    const dtObj = DREAMSTIME_CATEGORIES.find(c => c.en === cat);
                                    const idStr = dtObj ? `[${dtObj.id}] ` : '';
                                    return <span key={idx}>Cat {idx+1}: {idStr}{translateCat(cat, DREAMSTIME_CATEGORIES, f.displayLang)}</span>;
                                  })}
                                </div>
                              </div>
                              
                              <div className={isMiri || isBackupMode || isZipMode ? 'text-blue-600' : 'text-slate-500'}>
                                <div className="text-[9px] font-bold mb-0.5 uppercase tracking-widest opacity-80">TYPE & TIER MIRICANVAS</div>
                                <div className="font-medium flex flex-col">
                                  <span>Type: {f.metadata.miricanvas_type}</span>
                                  <span>Tier: {f.metadata.miricanvas_tier}</span>
                                </div>
                              </div>

                              <div className={isVcg || isBackupMode || isZipMode ? 'text-blue-600' : 'text-slate-500'}>
                                <div className="text-[9px] font-bold mb-0.5 uppercase tracking-widest opacity-80">Kategori 500px (VCG)</div>
                                <div className="font-medium">
                                  {f.metadata.category_vcg ? translateVcgCat(f.metadata.category_vcg, f.displayLang) : <span className="italic text-slate-400">Tidak ada (Video)</span>}
                                </div>
                              </div>
                            </>
                          ) : f.status === 'failed' ? (
                             <pre className="text-[10px] text-red-600 font-mono whitespace-pre-wrap font-bold m-auto">
                               {f.errorMessage || "Gagal memproses."}
                             </pre>
                          ) : f.status === 'processing' ? (
                             <div className="flex flex-col gap-2 items-center justify-center text-[11px] font-bold text-blue-500 h-full m-auto">
                               <svg className="animate-spin h-6 w-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                               </svg>
                               <span className="tracking-widest uppercase text-[9px]">Processing...</span>
                             </div>
                          ) : (
                             <div className="flex items-center justify-center text-[10px] font-bold uppercase tracking-widest text-slate-400 h-full m-auto">
                               Menunggu...
                             </div>
                          )}
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center w-full h-full min-h-[50vh]">
                  <div className="w-16 h-16 bg-white shadow-sm border border-blue-200 text-blue-400 rounded-full flex items-center justify-center mb-4">
                    <UploadCloudIcon />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Area Media</h3>
                  <p className="text-slate-500 text-sm max-w-md">Unggah file dari panel sebelah kiri.<br/>Kartu akan tampil responsif mengikuti ukuran layar perangkat Anda.</p>
                </div>
              )}
            </div>
          </section>
        </main>

        {previewFile && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm transition-opacity" onClick={() => setPreviewFile(null)}>
            <div className="relative bg-white rounded-xl shadow-2xl p-3 max-w-[95vw] max-h-[95vh] w-fit mx-auto flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-3 shrink-0 w-0 min-w-full">
                <div className="flex-1 overflow-x-auto whitespace-nowrap custom-scroll mr-3">
                  <h3 className="font-bold text-sm text-slate-800" title={previewFile.file?.name}>
                    {previewFile.file?.name}
                  </h3>
                </div>
                <button className="text-slate-400 hover:text-slate-900 transition bg-slate-100 hover:bg-slate-200 p-1.5 rounded-lg shrink-0" onClick={() => setPreviewFile(null)}>
                  <CloseIcon />
                </button>
              </div>
              <div className="flex items-center justify-center bg-slate-100/50 rounded-lg overflow-hidden min-w-[200px] min-h-[100px]">
                {isVideoFile(previewFile.file?.name || '') ? (
                  <video src={previewFile.url} controls className="max-w-full max-h-[calc(90vh-80px)] object-contain" />
                ) : (previewFile.file?.name.toLowerCase().endsWith('.eps') || previewFile.file?.name.toLowerCase().endsWith('.ai')) && !previewFile.isConverted ? (
                  <div className="w-[300px] h-[300px] flex flex-col items-center justify-center bg-slate-50 text-slate-400 p-6 select-none">
                    <svg className="w-16 h-16 text-blue-400 mb-3 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    <span className="text-xs font-bold uppercase tracking-widest text-center text-blue-500">MENGHUBUNGI SERVER...</span>
                    <span className="text-[10px] text-slate-400 mt-1 uppercase text-center">Sedang memproses preview vektor</span>
                  </div>
                ) : (
                  <img src={previewFile.url} className="max-w-full max-h-[calc(90vh-80px)] object-contain" alt="Preview" />
                )}
              </div>
            </div>
          </div>
        )}

        {editingFile && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm transition-opacity" onClick={() => setEditingFile(null)}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl flex flex-col overflow-hidden max-h-[90vh]" onClick={e => e.stopPropagation()}>
              <div className="p-3 border-b flex justify-between items-center bg-slate-50 shrink-0">
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2"><EditIcon /> Edit & Sinkronisasi Cerdas</h3>
                <span className="text-[11px] font-bold bg-slate-200 px-2 py-1 rounded text-slate-700">Versi: {editingFile.displayLang}</span>
              </div>
              <div className="p-4 space-y-3 overflow-y-auto custom-scroll">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Judul ({editingFile.displayLang})</label>
                  <textarea className="w-full border rounded p-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50" rows={2} value={editingFile.displayLang === 'EN' ? editingFile.metadata.title_en : editingFile.displayLang === 'ID' ? editingFile.metadata.title_id : editingFile.metadata.title_zh} onChange={e => { const key = editingFile.displayLang === 'EN' ? 'title_en' : editingFile.displayLang === 'ID' ? 'title_id' : 'title_zh'; setEditingFile({...editingFile, metadata: {...editingFile.metadata, [key]: e.target.value}}); }} />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Deskripsi ({editingFile.displayLang})</label>
                  <textarea className="w-full border rounded p-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50" rows={3} value={editingFile.displayLang === 'EN' ? editingFile.metadata.description_en : editingFile.displayLang === 'ID' ? editingFile.metadata.description_id : editingFile.metadata.description_zh} onChange={e => { const key = editingFile.displayLang === 'EN' ? 'description_en' : editingFile.displayLang === 'ID' ? 'description_id' : 'description_zh'; setEditingFile({...editingFile, metadata: {...editingFile.metadata, [key]: e.target.value}}); }} />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Keywords ({editingFile.displayLang})</label>
                  <textarea className="w-full border rounded p-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50" rows={4} value={editingFile.displayLang === 'EN' ? editingFile.metadata.keywords_en : editingFile.displayLang === 'ID' ? editingFile.metadata.keywords_id : editingFile.metadata.keywords_zh} onChange={e => { const key = editingFile.displayLang === 'EN' ? 'keywords_en' : editingFile.displayLang === 'ID' ? 'keywords_id' : 'keywords_zh'; setEditingFile({...editingFile, metadata: {...editingFile.metadata, [key]: e.target.value}}); }} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 border-t pt-3">
                  <div className="col-span-1 flex flex-col gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Kategori Adobe</label>
                      <select className="w-full border rounded p-2 text-[10px] focus:ring-2 focus:ring-blue-500 outline-none bg-white" value={editingFile.metadata.category_adobe || ADOBE_CATEGORIES[0].en} onChange={e => setEditingFile({...editingFile, metadata: {...editingFile.metadata, category_adobe: e.target.value}})}>
                        {ADOBE_CATEGORIES.map(c => <option key={c.en} value={c.en}>{translateCat(c.en, ADOBE_CATEGORIES, editingFile.displayLang)}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Kat Shutterstock</label>
                      <div className="flex flex-col gap-1.5">
                        {[0, 1].map(idx => (
                          <select key={idx} className="w-full border rounded p-2 text-[10px] focus:ring-2 focus:ring-blue-500 outline-none bg-white" 
                            value={editingFile.metadata.category_shutterstock.split(',')[idx]?.trim() || (isVideoFile(editingFile.file?.name || '') ? SHUTTERSTOCK_VIDEO_CATEGORIES[idx].en : SHUTTERSTOCK_IMAGE_VECTOR_CATEGORIES[idx].en)} 
                            onChange={e => {
                              const activeDict = isVideoFile(editingFile.file?.name || '') ? SHUTTERSTOCK_VIDEO_CATEGORIES : SHUTTERSTOCK_IMAGE_VECTOR_CATEGORIES;
                              const cats = editingFile.metadata.category_shutterstock.split(',').map(c=>c.trim());
                              cats[0] = cats[0] || activeDict[0].en; cats[1] = cats[1] || activeDict[1].en;
                              cats[idx] = e.target.value;
                              setEditingFile({...editingFile, metadata: {...editingFile.metadata, category_shutterstock: cats.join(', ')}});
                            }}>
                            {(isVideoFile(editingFile.file?.name || '') ? SHUTTERSTOCK_VIDEO_CATEGORIES : SHUTTERSTOCK_IMAGE_VECTOR_CATEGORIES).map(c => <option key={c.en} value={c.en}>{translateCat(c.en, isVideoFile(editingFile.file?.name || '') ? SHUTTERSTOCK_VIDEO_CATEGORIES : SHUTTERSTOCK_IMAGE_VECTOR_CATEGORIES, editingFile.displayLang)}</option>)}
                          </select>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="col-span-1">
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Kat Dreamstime</label>
                    <div className="flex flex-col gap-1.5">
                      {[0,1,2].map(idx => (
                        <select key={idx} className="w-full border rounded p-2 text-[10px] focus:ring-2 focus:ring-blue-500 outline-none bg-white" 
                          value={editingFile.metadata.category_dreamstime?.[idx] || DREAMSTIME_CATEGORIES[idx].en} 
                          onChange={e => {
                            const newDream = [...(editingFile.metadata.category_dreamstime || [DREAMSTIME_CATEGORIES[0].en, DREAMSTIME_CATEGORIES[1].en, DREAMSTIME_CATEGORIES[2].en])];
                            newDream[idx] = e.target.value;
                            setEditingFile({...editingFile, metadata: {...editingFile.metadata, category_dreamstime: newDream}});
                          }}>
                          {DREAMSTIME_CATEGORIES.map(c => <option key={c.id} value={c.en}>{`[${c.id}] ${translateCat(c.en, DREAMSTIME_CATEGORIES, editingFile.displayLang)}`}</option>)}
                        </select>
                      ))}
                    </div>
                  </div>
                  
                  <div className="col-span-1 flex flex-col gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">MiriCanvas Type</label>
                      <select className="w-full border rounded p-2 text-[10px] focus:ring-2 focus:ring-blue-500 outline-none bg-white" value={editingFile.metadata.miricanvas_type || 'Photo'} onChange={e => setEditingFile({...editingFile, metadata: {...editingFile.metadata, miricanvas_type: e.target.value}})}>
                        {['Photo', 'Photo(Cut-out)', 'SVG element', 'PNG element', 'Background', 'GIF', 'Video'].map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">MiriCanvas Tier</label>
                      <select className="w-full border rounded p-2 text-[10px] focus:ring-2 focus:ring-blue-500 outline-none bg-white" value={editingFile.metadata.miricanvas_tier || 'Premium'} onChange={e => setEditingFile({...editingFile, metadata: {...editingFile.metadata, miricanvas_tier: e.target.value}})}>
                        {['Premium', 'Standard'].map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="col-span-1 flex flex-col gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Kategori 500px (VCG)</label>
                      <select className="w-full border rounded p-2 text-[10px] focus:ring-2 focus:ring-blue-500 outline-none bg-white" disabled={isVideoFile(editingFile.file?.name || '')} value={editingFile.metadata.category_vcg || VCG_CATEGORIES[0].zh} onChange={e => setEditingFile({...editingFile, metadata: {...editingFile.metadata, category_vcg: e.target.value}})}>
                        {isVideoFile(editingFile.file?.name || '') ? (
                           <option value="">Video (Kosong)</option>
                        ) : (
                           VCG_CATEGORIES.map(c => <option key={c.id} value={c.zh}>{translateVcgCat(c.zh, editingFile.displayLang)}</option>)
                        )}
                      </select>
                    </div>
                  </div>
                </div>

              </div>
              <div className="p-3 border-t bg-slate-50 flex justify-between items-center shrink-0 rounded-b-lg">
                <span className="text-[10px] text-slate-400 italic hidden sm:block">*AI akan menyinkronkan terjemahan otomatis.</span>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button onClick={() => setEditingFile(null)} className="flex-1 sm:flex-none px-4 py-1.5 text-sm font-bold bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-lg transition">Batal</button>
                  <button onClick={saveEdit} className="flex-1 sm:flex-none px-5 py-1.5 text-sm font-bold bg-slate-800 text-white rounded-lg hover:bg-slate-900 shadow-sm transition">Simpan</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {fileToDelete && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
             <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm flex flex-col items-center text-center">
                <div className="bg-red-100 p-3 rounded-full mb-3">
                  <AlertTriangleIcon />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Hapus File?</h3>
                <p className="text-sm text-slate-600 mt-2 mb-6">Apakah Anda yakin ingin menghapus file ini dari daftar?</p>
                <div className="flex w-full gap-3">
                   <button onClick={() => setFileToDelete(null)} className="flex-1 bg-slate-200 text-slate-700 font-bold py-2 rounded-lg hover:bg-slate-300 transition">Batal</button>
                   <button onClick={confirmDeleteFile} className="flex-1 bg-red-600 text-white font-bold py-2 rounded-lg hover:bg-red-700 transition shadow-sm">Ya, Hapus</button>
                </div>
             </div>
          </div>
        )}

        {clearAllConfirm && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
             <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm flex flex-col items-center text-center">
                <div className="bg-red-100 p-3 rounded-full mb-3">
                  <AlertTriangleIcon />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Hapus Semua File?</h3>
                <p className="text-sm text-slate-600 mt-2 mb-6">Anda akan menghapus <b>semua file</b> dari daftar. Semua hasil metadata akan hilang.</p>
                <div className="flex w-full gap-3">
                   <button onClick={() => setClearAllConfirm(false)} className="flex-1 bg-slate-200 text-slate-700 font-bold py-2 rounded-lg hover:bg-slate-300 transition">Batal</button>
                   <button onClick={confirmClearAllAction} className="flex-1 bg-red-600 text-white font-bold py-2 rounded-lg hover:bg-red-700 transition shadow-sm">Ya, Hapus Semua</button>
                </div>
             </div>
          </div>
        )}

        {logoutConfirm && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
             <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm flex flex-col items-center text-center">
                <div className="bg-red-100 p-3 rounded-full mb-3">
                  <AlertTriangleIcon />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Keluar dari Akun?</h3>
                <p className="text-sm text-slate-600 mt-2 mb-6">Apakah Anda yakin ingin logout? Anda harus login kembali untuk masuk ke sistem.</p>
                <div className="flex w-full gap-3">
                   <button onClick={() => setLogoutConfirm(false)} className="flex-1 bg-slate-200 text-slate-700 font-bold py-2 rounded-lg hover:bg-slate-300 transition">Batal</button>
                   <button onClick={() => { setLogoutConfirm(false); handleLogout(); }} className="flex-1 bg-red-600 text-white font-bold py-2 rounded-lg hover:bg-red-700 transition shadow-sm">Ya, Logout</button>
                </div>
             </div>
          </div>
        )}

      </div>
    </>
  );
}
