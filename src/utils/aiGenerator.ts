import { GameLevel, QuestionPair } from '../types';

interface GenerateOptions {
  topic: string;
  content: string;
  pdfBase64?: string;
  fileName?: string;
  levelsCount?: number;
}

interface GenerateResult {
  topic: string;
  summaryPoints: string[];
  levels: GameLevel[];
  source: 'gemini' | 'smart-fallback';
}

export async function generateContentWithAI(options: GenerateOptions): Promise<GenerateResult> {
  const { topic, content, pdfBase64, fileName, levelsCount = 2 } = options;

  // Try calling the server-side Gemini API
  try {
    const res = await fetch('/api/ai/generate-questions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic,
        content,
        pdfBase64,
        fileName,
        targetLevelsCount: levelsCount,
      }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json && json.success && json.data) {
        return {
          topic: json.data.topic || topic,
          summaryPoints: json.data.summaryPoints || [],
          levels: json.data.levels || [],
          source: 'gemini',
        };
      }
    }
  } catch (err) {
    console.warn('Backend Gemini API not reachable or error occurred, using smart local parser fallback:', err);
  }

  // Smart local extractor fallback
  return generateSmartFallback(topic, content, levelsCount);
}

function generateSmartFallback(topic: string, text: string, levelsCount: number): GenerateResult {
  // Extract sentences and bullet points
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim().replace(/^[-*•0-9.)]+\s*/, ''))
    .filter((l) => l.length > 10);

  // Extract key summary points
  const summaryPoints = lines.slice(0, 5);
  if (summaryPoints.length === 0) {
    summaryPoints.push(
      `Konsep Utama: ${topic} mencakup prinsip teoritis dan keterampilan praktik kejuruan.`,
      `Implementasi: Memahami standar industri dan prosedur kerja nyata di bidang keahlian.`,
      `Pengujian: Melakukan evaluasi berkala untuk memastikan performa dan pemecahan masalah.`
    );
  }

  // Parse lines for term : definition pattern or split by punctuation
  const candidatePairs: QuestionPair[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let term = '';
    let definition = '';

    if (line.includes(':')) {
      const parts = line.split(':');
      term = parts[0].trim();
      definition = parts.slice(1).join(':').trim();
    } else if (line.includes('-') && !line.startsWith('-')) {
      const parts = line.split('-');
      term = parts[0].trim();
      definition = parts.slice(1).join('-').trim();
    } else if (line.includes(' adalah ')) {
      const parts = line.split(' adalah ');
      term = parts[0].trim();
      definition = parts.slice(1).join(' adalah ').trim();
    } else if (line.includes(' merupakan ')) {
      const parts = line.split(' merupakan ');
      term = parts[0].trim();
      definition = parts.slice(1).join(' merupakan ').trim();
    } else {
      const words = line.split(' ');
      if (words.length >= 6) {
        term = words.slice(0, Math.min(3, words.length - 3)).join(' ');
        definition = words.slice(Math.min(3, words.length - 3)).join(' ');
      }
    }

    if (term.length >= 2 && definition.length >= 8) {
      // Clean up punctuation
      term = term.replace(/^[:\-–=]+|[:\-–=]+$/g, '').trim();
      definition = definition.replace(/^[:\-–=]+|[:\-–=]+$/g, '').trim();
      if (term.length > 50) term = term.slice(0, 48) + '...';
      if (definition.length > 180) definition = definition.slice(0, 177) + '...';

      candidatePairs.push({
        id: `gen-p-${candidatePairs.length + 1}`,
        term,
        definition,
        clue: `Pahami konsep terkait ${term.split(' ')[0]}`,
      });
    }
  }

  // If not enough pairs found from raw text, provide contextual vocational pairs
  if (candidatePairs.length < 8) {
    const fallbackVocationalPairs: QuestionPair[] = [
      {
        id: 'fb1',
        term: 'Hardware / Perangkat Keras',
        definition: 'Komponen fisik elektronik komputer yang dapat dilihat dan diraba secara nyata',
        clue: 'Contoh: CPU, RAM, Motherboard',
      },
      {
        id: 'fb2',
        term: 'Software / Perangkat Lunak',
        definition: 'Kumpulan instruksi data dan program yang menjalankan fungsi operasional sistem',
        clue: 'Contoh: Sistem Operasi & Aplikasi',
      },
      {
        id: 'fb3',
        term: 'Brainware / Pengguna',
        definition: 'Sumber daya manusia atau teknisi yang mengoperasikan dan mengelola sistem teknologi',
        clue: 'Administrator, Programmer, Teknisi',
      },
      {
        id: 'fb4',
        term: 'Bandwidth Jaringan',
        definition: 'Kapasitas maksimum transfer data yang dapat ditransmisikan dalam satuan detik (bps)',
        clue: 'Lebar jalur transmisi data',
      },
      {
        id: 'fb5',
        term: 'Local Area Network (LAN)',
        definition: 'Jaringan komputer berskala lokal yang mencakup area terbatas seperti lab sekolah atau kantor',
        clue: 'Cakupan area lokal gedung',
      },
      {
        id: 'fb6',
        term: 'Wide Area Network (WAN)',
        definition: 'Jaringan komputer berjangkauan geografis sangat luas menghubungkan antar kota bahkan benua',
        clue: 'Jaringan internet global',
      },
      {
        id: 'fb7',
        term: 'Protokol DNS',
        definition: 'Layanan pemetaan alamat domain ramah manusia ke alamat IP numerik server',
        clue: 'Mengubah nama domain jadi IP',
      },
      {
        id: 'fb8',
        term: 'Sistem Operasi (OS)',
        definition: 'Perangkat lunak dasar yang mengatur memori, prosesor, dan input-output hardware',
        clue: 'Windows, Linux, macOS',
      },
    ];

    while (candidatePairs.length < 8 && fallbackVocationalPairs.length > 0) {
      candidatePairs.push(fallbackVocationalPairs.shift()!);
    }
  }

  // Build levels
  const levels: GameLevel[] = [];
  const pairsPerLevel = Math.max(4, Math.floor(candidatePairs.length / levelsCount));

  for (let lvl = 1; lvl <= levelsCount; lvl++) {
    const isMemory = lvl % 2 !== 0;
    const startIndex = (lvl - 1) * pairsPerLevel;
    const levelPairs = candidatePairs.slice(startIndex, startIndex + pairsPerLevel);

    // ensure at least 4 pairs
    if (levelPairs.length < 4) {
      levelPairs.push(...candidatePairs.slice(0, 4 - levelPairs.length));
    }

    levels.push({
      levelNumber: lvl,
      title: isMemory
        ? `Level ${lvl}: Tantangan Kartu Memori - ${topic}`
        : `Level ${lvl}: Pencocokan Interaktif (Drag & Drop) - ${topic}`,
      type: isMemory ? 'memory' : 'dragdrop',
      description: isMemory
        ? `Buka dan cocokkan pasangan istilah kunci dengan definisinya secara teliti!`
        : `Pasangkan setiap pernyataan di sebelah kiri dengan jawaban yang sesuai di sebelah kanan!`,
      pairs: levelPairs.map((p, pIdx) => ({
        ...p,
        id: `lvl-${lvl}-p-${pIdx + 1}`,
      })),
    });
  }

  return {
    topic,
    summaryPoints,
    levels,
    source: 'smart-fallback',
  };
}
