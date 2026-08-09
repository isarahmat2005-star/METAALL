export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb', // Izinkan data gambar/base64 besar
    },
  },
};

export default async function handler(req, res) {
  // Izinkan CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Tembak dari Server Vercel ke Server Google AI Studio (Server-to-Server)
    const aiStudioUrl = "https://ais-pre-chn3bsf3ur6vatranz4rl3-12007850683.asia-east1.run.app/api/generate";
    
    const response = await fetch(aiStudioUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Vercel Proxy Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Gagal terhubung ke AI Studio Proxy',
      details: error.message 
    });
  }
}
