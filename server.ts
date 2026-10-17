import express from 'express';
import { createServer as createViteServer } from 'vite';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '25mb' }));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Server-side Gemini API Route
  app.post('/api/ai/generate-questions', async (req, res) => {
    const { topic, content, pdfBase64, fileName, targetLevelsCount = 2 } = req.body;

    if (!topic && !content && !pdfBase64) {
      return res.status(400).json({ error: 'Topik, konten materi, atau file PDF wajib diisi.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY belum dikonfigurasi di environment server. Fitur fallback offline akan digunakan.',
        fallback: true,
      });
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const effectiveTopic = topic || (fileName ? fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') : 'Materi Pembelajaran SMK');

      const prompt = `Anda adalah asisten kurikulum cerdas untuk guru Sekolah Menengah Kejuruan (SMK) di Indonesia.
Berdasarkan dokumen/materi ajar berikut ini, buatlah struktur pembelajaran berbasis game yang interaktif dan menarik untuk siswa SMK.

Topik Pembelajaran: "${effectiveTopic}"
${content ? `Teks Materi / Rangkuman:\n"""\n${content}\n"""` : ''}

Instruksi Pembuatan Soal & Level:
1. Buat ringkasan poin-poin materi kunci (3-5 poin penting) yang mudah dipahami siswa SMK.
2. Buat ${targetLevelsCount} level permainan berurutan dengan tingkat kesulitan meningkat:
   - Level 1: Tipe "memory" (Kartu Memori / Memory Card Matching Pair). Siswa harus mencocokkan Pasangan Istilah teknis (kiri) dan Definisi/Fungsi singkat (kanan). Buat 4 hingga 6 pasang kartu yang jelas dan presisi.
   - Level 2: Tipe "dragdrop" (Drag and Drop Matching). Siswa mencocokkan Pernyataan/Kasus/Komponen (kiri) dengan Pasangan Penjelasan/Solusi/Kategori (kanan). Buat 4 hingga 6 pasang.
   - Jika diminta level ke-3: Tipe "memory" atau "dragdrop" dengan materi studi kasus / sintaks / problem-solving SMK.
3. Bahasa Indonesia yang digunakan harus komunikatif, standar teknis SMK, dan edukatif.
4. Setiap item pasangan harus memiliki:
   - term: Istilah/pertanyaan/pernyataan singkat (maksimal 6-8 kata)
   - definition: Penjelasan atau pasangan yang tepat (singkat, padat, 1-2 kalimat)
   - clue: Petunjuk bantuan singkat bila siswa ragu (opsional, 1 kalimat).`;

      let contentsPayload: any = prompt;
      if (pdfBase64) {
        contentsPayload = {
          parts: [
            {
              inlineData: {
                mimeType: 'application/pdf',
                data: pdfBase64,
              },
            },
            {
              text: prompt,
            },
          ],
        };
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: contentsPayload,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              topic: { type: Type.STRING },
              summaryPoints: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              levels: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    levelNumber: { type: Type.INTEGER },
                    title: { type: Type.STRING },
                    type: {
                      type: Type.STRING,
                      description: 'Must be either "memory" or "dragdrop"',
                    },
                    description: { type: Type.STRING },
                    pairs: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          term: { type: Type.STRING },
                          definition: { type: Type.STRING },
                          clue: { type: Type.STRING },
                        },
                        required: ['id', 'term', 'definition'],
                      },
                    },
                  },
                  required: ['levelNumber', 'title', 'type', 'description', 'pairs'],
                },
              },
            },
            required: ['topic', 'summaryPoints', 'levels'],
          },
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Gemini tidak mengembalikan teks respon.');
      }

      const generatedData = JSON.parse(responseText);
      return res.json({ success: true, data: generatedData });
    } catch (err: any) {
      console.error('Error generating questions with Gemini:', err);
      return res.status(500).json({
        error: err?.message || 'Gagal menghasilkan materi dengan AI',
      });
    }
  });

  // Vite in dev or static files in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server Interaktif SMK running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
