import React, { useState } from 'react';
import { GameLevel, LearningMaterial, QuestionPair, QuestionType } from '../types';
import { storageManager } from '../utils/storage';
import { soundManager } from '../utils/audio';
import { generateContentWithAI } from '../utils/aiGenerator';
import { downloadMaterialAsPDF, extractTextFromPDF } from '../utils/pdfModule';

interface TeacherModeProps {
  material: LearningMaterial;
  onSaveMaterial: (updated: LearningMaterial) => void;
  onResetToDefault: () => void;
  onSwitchToStudent: () => void;
  isLoggedIn: boolean;
  onLoginSuccess: () => void;
  onLogout: () => void;
}

export const TeacherMode: React.FC<TeacherModeProps> = ({
  material,
  onSaveMaterial,
  onResetToDefault,
  onSwitchToStudent,
  isLoggedIn,
  onLoginSuccess,
  onLogout,
}) => {
  // Login form state
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  // Password change state
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [changePwdMsg, setChangePwdMsg] = useState('');

  // Working copy of material
  const [workingMaterial, setWorkingMaterial] = useState<LearningMaterial>(() => JSON.parse(JSON.stringify(material)));
  const [activeTab, setActiveTab] = useState<'materi' | 'levels' | 'ai'>('materi');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // PDF Export & Upload state
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isUploadingPDF, setIsUploadingPDF] = useState(false);
  const [uploadedPdfInfo, setUploadedPdfInfo] = useState<{
    fileName: string;
    numPages: number;
    textLength: number;
  } | null>(null);

  // AI Generator state
  const [aiTopicInput, setAiTopicInput] = useState(material.topic || '');
  const [aiContentInput, setAiContentInput] = useState(material.detailedContent || '');
  const [aiLevelsCount, setAiLevelsCount] = useState<number>(3);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiResultNotice, setAiResultNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // File import ref
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Handle Teacher Login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const creds = storageManager.getTeacherCredentials();
    if (
      usernameInput.trim().toLowerCase() === creds.username.toLowerCase() &&
      passwordInput.trim() === creds.password
    ) {
      soundManager.playMatchSuccess();
      setLoginError('');
      onLoginSuccess();
    } else {
      soundManager.playErrorBuzz();
      setLoginError('Username atau Password Guru salah. Silakan periksa kembali!');
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPasswordInput.trim() || newPasswordInput.trim().length < 4) {
      setChangePwdMsg('Password minimal terdiri dari 4 karakter.');
      return;
    }
    const success = storageManager.updateTeacherPassword(newPasswordInput.trim());
    if (success) {
      soundManager.playMatchSuccess();
      setChangePwdMsg('Password guru berhasil diperbarui!');
      setTimeout(() => {
        setShowChangePasswordModal(false);
        setChangePwdMsg('');
        setNewPasswordInput('');
      }, 1500);
    }
  };

  // --- Material Updates ---
  const handleSaveAll = () => {
    const success = storageManager.saveMaterial(workingMaterial);
    if (success) {
      soundManager.playMatchSuccess();
      onSaveMaterial(workingMaterial);
      setSaveSuccessMsg('Materi pembelajaran berhasil disimpan ke localStorage!');
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    } else {
      soundManager.playErrorBuzz();
      alert('Gagal menyimpan materi.');
    }
  };

  // --- Unduh Materi PDF ---
  const handleDownloadPDF = async () => {
    setIsExportingPDF(true);
    setSaveSuccessMsg('');
    try {
      soundManager.playCardFlip();
      await downloadMaterialAsPDF(workingMaterial);
      soundManager.playMatchSuccess();
      setSaveSuccessMsg('Modul materi pembelajaran berhasil diunduh dalam format PDF!');
      setTimeout(() => setSaveSuccessMsg(''), 4500);
    } catch (err: any) {
      console.error('Error generating PDF:', err);
      soundManager.playErrorBuzz();
      alert('Gagal mengunduh PDF. Silakan gunakan opsi Cetak di browser.');
    } finally {
      setIsExportingPDF(false);
    }
  };

  // --- Upload Materi PDF / Dokumen ---
  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if it's a PDF file
    if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
      setIsUploadingPDF(true);
      setAiResultNotice(null);
      setSaveSuccessMsg(`Sedang membaca dan mengekstrak file PDF: ${file.name}...`);

      try {
        soundManager.playCardFlip();
        const extracted = await extractTextFromPDF(file);
        setUploadedPdfInfo({
          fileName: extracted.fileName,
          numPages: extracted.numPages,
          textLength: extracted.text.length,
        });

        // Derive clean topic from file name
        const cleanTopic = file.name
          .replace(/\.[^/.]+$/, '')
          .replace(/[-_]/g, ' ')
          .replace(/modul|materi|ajar|smk|kelas|x|xi|xii/gi, '')
          .trim();
        const detectedTopic = cleanTopic.length >= 3 ? cleanTopic : workingMaterial.topic;

        setAiTopicInput(detectedTopic);
        setAiContentInput(extracted.text);

        // Auto-run AI question generation from the PDF!
        setSaveSuccessMsg(`File PDF berhasil diekstrak (${extracted.numPages} halaman). AI sedang menyusun level dan soal...`);
        setIsGeneratingAI(true);

        const aiResult = await generateContentWithAI({
          topic: detectedTopic,
          content: extracted.text,
          pdfBase64: extracted.base64,
          fileName: file.name,
          levelsCount: aiLevelsCount,
        });

        const updated: LearningMaterial = {
          ...workingMaterial,
          topic: aiResult.topic || detectedTopic,
          summaryPoints: aiResult.summaryPoints.length > 0 ? aiResult.summaryPoints : workingMaterial.summaryPoints,
          detailedContent: extracted.text.slice(0, 1000),
          levels: aiResult.levels,
          updatedAt: new Date().toISOString(),
        };

        setWorkingMaterial(updated);
        storageManager.saveMaterial(updated);
        onSaveMaterial(updated);

        soundManager.playMatchSuccess();
        setSaveSuccessMsg(`Sukses! Materi & ${aiResult.levels.length} Level Soal berhasil dibuat dari file PDF "${file.name}"!`);
        setActiveTab('levels');
      } catch (err: any) {
        console.error('Error uploading/processing PDF:', err);
        soundManager.playErrorBuzz();
        alert(`Gagal memproses file PDF: ${err.message || 'Format tidak didukung'}`);
      } finally {
        setIsUploadingPDF(false);
        setIsGeneratingAI(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
      return;
    }

    // JSON fallback
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = storageManager.parseImportedJSON(text);
        setWorkingMaterial(parsed);
        storageManager.saveMaterial(parsed);
        onSaveMaterial(parsed);
        soundManager.playMatchSuccess();
        alert('Materi JSON berhasil diimpor!');
      } catch (err: any) {
        soundManager.playErrorBuzz();
        alert(`Gagal mengimpor JSON: ${err.message}`);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleResetDefault = () => {
    if (confirm('Apakah Anda yakin ingin mengatur ulang ke materi contoh bawaan SMK? Perubahan saat ini akan ditimpa.')) {
      const def = onResetToDefault();
      setWorkingMaterial(JSON.parse(JSON.stringify(material)));
      soundManager.playMatchSuccess();
    }
  };

  // --- AI Generator Trigger ---
  const handleGenerateAI = async () => {
    if (!aiTopicInput.trim()) {
      setAiResultNotice({ type: 'error', message: 'Silakan isi topik pembelajaran terlebih dahulu.' });
      return;
    }
    if (!aiContentInput.trim() || aiContentInput.trim().length < 20) {
      setAiResultNotice({
        type: 'error',
        message: 'Konten materi terlalu singkat. Masukkan ringkasan atau silabus materi yang jelas.',
      });
      return;
    }

    setIsGeneratingAI(true);
    setAiResultNotice(null);

    try {
      const result = await generateContentWithAI({
        topic: aiTopicInput.trim(),
        content: aiContentInput.trim(),
        levelsCount: aiLevelsCount,
      });

      // Update working material
      const updated: LearningMaterial = {
        ...workingMaterial,
        topic: result.topic,
        summaryPoints: result.summaryPoints.length > 0 ? result.summaryPoints : workingMaterial.summaryPoints,
        detailedContent: aiContentInput.trim(),
        levels: result.levels,
        updatedAt: new Date().toISOString(),
      };

      setWorkingMaterial(updated);
      storageManager.saveMaterial(updated);
      onSaveMaterial(updated);

      soundManager.playMatchSuccess();
      setAiResultNotice({
        type: 'success',
        message: `Berhasil menghasilkan ${result.levels.length} Level dan ${result.summaryPoints.length} Poin Materi menggunakan AI!`,
      });
      setActiveTab('levels');
    } catch (err: any) {
      soundManager.playErrorBuzz();
      setAiResultNotice({
        type: 'error',
        message: err?.message || 'Gagal menghasilkan materi dengan AI.',
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Preset Template for Quick AI Generation
  const loadVocationalSample = () => {
    setAiTopicInput('Dasar Pemrograman Web & Frontend SMK');
    setAiContentInput(`Pengenalan Pemrograman Web Modern untuk SMK Jurusan Rekayasa Perangkat Lunak (RPL / PPLG):
1. HTML (HyperText Markup Language): Bahasa markup standar untuk menstrukturkan elemen halaman web seperti paragraf, tabel, tombol, dan form input.
2. CSS (Cascading Style Sheets): Bahasa penataan visual gaya yang mengatur layout responsif, warna, tipografi, dan animasi tampilan antarmuka.
3. JavaScript: Bahasa pemrograman dinamis sisi klien yang menghidupkan interaktivitas, logika, penanganan event, dan manipulasi DOM.
4. DOM (Document Object Model): Struktur pohon hierarki objek dari dokumen HTML yang dapat diakses dan diubah oleh JavaScript.
5. Responsive Web Design: Pendekatan desain antarmuka yang menyesuaikan tata letak dengan ukuran layar perangkat smartphone, tablet, maupun desktop menggunakan CSS Flexbox dan Grid.
6. Git & GitHub: Sistem kontrol versi untuk melacak riwayat perubahan kode sumber dan berkolaborasi dalam tim software engineer.`);
  };

  // --- CRUD Points & Levels ---
  const addSummaryPoint = () => {
    const nextPoints = [...workingMaterial.summaryPoints, 'Poin ringkasan materi baru...'];
    setWorkingMaterial({ ...workingMaterial, summaryPoints: nextPoints });
  };

  const updateSummaryPoint = (index: number, val: string) => {
    const nextPoints = [...workingMaterial.summaryPoints];
    nextPoints[index] = val;
    setWorkingMaterial({ ...workingMaterial, summaryPoints: nextPoints });
  };

  const deleteSummaryPoint = (index: number) => {
    const nextPoints = workingMaterial.summaryPoints.filter((_, i) => i !== index);
    setWorkingMaterial({ ...workingMaterial, summaryPoints: nextPoints });
  };

  const addLevel = () => {
    const newLevelNumber = workingMaterial.levels.length + 1;
    const isMemory = newLevelNumber % 2 !== 0;
    const newLvl: GameLevel = {
      levelNumber: newLevelNumber,
      title: `Level ${newLevelNumber}: ${isMemory ? 'Kartu Memori' : 'Drag & Drop'}`,
      type: isMemory ? 'memory' : 'dragdrop',
      description: isMemory
        ? 'Buka dan cocokkan pasangan kartu istilah dan definisinya!'
        : 'Pasangkan setiap pernyataan di kolom kiri ke kolom kanan!',
      pairs: [
        {
          id: `p-${Date.now()}-1`,
          term: 'Istilah Kunci 1',
          definition: 'Penjelasan atau definisi dari istilah kunci 1',
        },
        {
          id: `p-${Date.now()}-2`,
          term: 'Istilah Kunci 2',
          definition: 'Penjelasan atau definisi dari istilah kunci 2',
        },
        {
          id: `p-${Date.now()}-3`,
          term: 'Istilah Kunci 3',
          definition: 'Penjelasan atau definisi dari istilah kunci 3',
        },
        {
          id: `p-${Date.now()}-4`,
          term: 'Istilah Kunci 4',
          definition: 'Penjelasan atau definisi dari istilah kunci 4',
        },
      ],
    };
    setWorkingMaterial({ ...workingMaterial, levels: [...workingMaterial.levels, newLvl] });
  };

  const deleteLevel = (index: number) => {
    if (workingMaterial.levels.length <= 1) {
      alert('Minimal harus memiliki 1 level permainan!');
      return;
    }
    const filtered = workingMaterial.levels.filter((_, i) => i !== index);
    const renumbered = filtered.map((lvl, idx) => ({ ...lvl, levelNumber: idx + 1 }));
    setWorkingMaterial({ ...workingMaterial, levels: renumbered });
  };

  const updateLevelType = (lvlIndex: number, type: QuestionType) => {
    const updatedLevels = [...workingMaterial.levels];
    updatedLevels[lvlIndex].type = type;
    setWorkingMaterial({ ...workingMaterial, levels: updatedLevels });
  };

  const addPairToLevel = (lvlIndex: number) => {
    const updatedLevels = [...workingMaterial.levels];
    const newPair: QuestionPair = {
      id: `pair-${Date.now()}`,
      term: 'Istilah Baru',
      definition: 'Definisi atau penjelasan yang sesuai',
    };
    updatedLevels[lvlIndex].pairs.push(newPair);
    setWorkingMaterial({ ...workingMaterial, levels: updatedLevels });
  };

  const updatePair = (lvlIndex: number, pairIndex: number, field: keyof QuestionPair, value: string) => {
    const updatedLevels = [...workingMaterial.levels];
    updatedLevels[lvlIndex].pairs[pairIndex] = {
      ...updatedLevels[lvlIndex].pairs[pairIndex],
      [field]: value,
    };
    setWorkingMaterial({ ...workingMaterial, levels: updatedLevels });
  };

  const deletePair = (lvlIndex: number, pairIndex: number) => {
    const updatedLevels = [...workingMaterial.levels];
    if (updatedLevels[lvlIndex].pairs.length <= 2) {
      alert('Level minimal harus memiliki 2 pasang soal!');
      return;
    }
    updatedLevels[lvlIndex].pairs.splice(pairIndex, 1);
    setWorkingMaterial({ ...workingMaterial, levels: updatedLevels });
  };

  // =========================================================================
  // VIEW 1: LOGIN GURU (PROTECTED SECURITY GATE)
  // =========================================================================
  if (!isLoggedIn) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-850 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto mb-3 text-2xl shadow-lg">
              <i className="fa-solid fa-lock"></i>
            </div>
            <h2 className="text-2xl font-black text-white">
              Mode Guru / Kelola Materi
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Masukkan Username dan Password Guru untuk mengedit materi &amp; soal
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Username Guru
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <i className="fa-solid fa-user-tie"></i>
                </div>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="Username (Default: guru)"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password Guru
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <i className="fa-solid fa-key"></i>
                </div>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Password (Default: smkbisa123)"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
            </div>

            {loginError && (
              <div className="p-3 bg-rose-950/70 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                <i className="fa-solid fa-circle-exclamation flex-shrink-0"></i>
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              Masuk Mode Guru
            </button>
          </form>

          {/* Default Credentials Hint Box */}
          <div className="mt-6 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 block mb-1 font-semibold">
              Kredensial Akses Bawaan (Default):
            </span>
            <div className="inline-flex items-center gap-3 text-xs font-mono text-amber-300">
              <span>User: <strong>guru</strong></span>
              <span>•</span>
              <span>Pass: <strong>smkbisa123</strong></span>
            </div>
          </div>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={onSwitchToStudent}
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              ← Kembali ke Mode Siswa
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: DASHBOARD MODE GURU
  // =========================================================================
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Action Header */}
      <div className="bg-slate-850 border border-slate-700/80 rounded-3xl p-6 mb-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase tracking-wider">
              <i className="fa-solid fa-shield-halved mr-1.5"></i>
              Mode Guru Aktif
            </span>
            <span className="text-xs text-slate-400 hidden sm:inline">
              Kelola Kurikulum &amp; Generator Soal AI
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Kelola Materi &amp; Soal Pembelajaran
          </h1>
        </div>

        {/* Action Buttons Top Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSaveAll}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/25 flex items-center gap-2 transition-all cursor-pointer"
          >
            <i className="fa-solid fa-floppy-disk"></i>
            <span>Simpan Materi</span>
          </button>

          {/* Unduh Materi PDF */}
          <button
            onClick={handleDownloadPDF}
            disabled={isExportingPDF}
            title="Download seluruh modul pembelajaran dalam format PDF resmi"
            className="px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500 text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-60"
          >
            {isExportingPDF ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>
                <span>Menyiapkan PDF...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-file-pdf text-rose-300"></i>
                <span>Unduh Materi (PDF)</span>
              </>
            )}
          </button>

          {/* Upload File PDF Materi (dengan fallback JSON) */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.json,application/pdf"
            onChange={handleUploadFile}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingPDF || isGeneratingAI}
            title="Unggah dokumen PDF (Modul, Silabus, atau RPS SMK)"
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-cyan-300 hover:text-white border border-cyan-500/40 text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
          >
            {isUploadingPDF ? (
              <>
                <i className="fa-solid fa-spinner fa-spin text-cyan-400"></i>
                <span>Mengekstrak PDF...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-file-arrow-up text-cyan-400"></i>
                <span>Upload Materi (PDF)</span>
              </>
            )}
          </button>

          <button
            onClick={() => setShowChangePasswordModal(true)}
            title="Ganti Password Guru"
            className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 text-xs font-medium"
          >
            <i className="fa-solid fa-key"></i>
          </button>

          <button
            onClick={onLogout}
            title="Keluar dari sesi Guru"
            className="px-3 py-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 text-xs font-medium"
          >
            <i className="fa-solid fa-right-from-bracket"></i>
          </button>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="mb-6 p-4 bg-emerald-950/80 border border-emerald-500 rounded-2xl text-emerald-200 text-sm flex items-center gap-2 animate-fade-in">
          <i className="fa-solid fa-circle-check text-emerald-400 text-lg"></i>
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 mb-6 gap-2">
        <button
          onClick={() => setActiveTab('materi')}
          className={`py-3 px-5 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'materi'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10 rounded-t-xl'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <i className="fa-solid fa-book-bookmark"></i>
          <span>1. Informasi &amp; Ringkasan Materi</span>
        </button>

        <button
          onClick={() => setActiveTab('levels')}
          className={`py-3 px-5 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'levels'
              ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10 rounded-t-xl'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <i className="fa-solid fa-layer-group"></i>
          <span>2. Level &amp; Pembuat Soal ({workingMaterial.levels.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          className={`py-3 px-5 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'ai'
              ? 'border-amber-500 text-amber-400 bg-amber-500/10 rounded-t-xl'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <i className="fa-solid fa-wand-magic-sparkles"></i>
          <span>3. AI Generator Soal Otomatis</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: INFORMASI & RINGKASAN MATERI                                       */}
      {/* ========================================================================= */}
      {activeTab === 'materi' && (
        <div className="space-y-6">
          <div className="bg-slate-850 border border-slate-700/80 rounded-2xl p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <i className="fa-solid fa-pen-to-square text-indigo-400"></i>
                <span>Judul Pembelajaran &amp; Sasaran Kelas</span>
              </h2>

              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={isExportingPDF}
                className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <i className="fa-solid fa-file-pdf text-rose-400"></i>
                <span>Unduh Modul (PDF)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Topik / Judul Pembelajaran *
                </label>
                <input
                  type="text"
                  value={workingMaterial.topic}
                  onChange={(e) => setWorkingMaterial({ ...workingMaterial, topic: e.target.value })}
                  placeholder="Contoh: Dasar-Dasar Jaringan Komputer & Perangkat Keras"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Sasaran Kelas / Tingkat
                </label>
                <input
                  type="text"
                  value={workingMaterial.targetGrade || ''}
                  onChange={(e) => setWorkingMaterial({ ...workingMaterial, targetGrade: e.target.value })}
                  placeholder="Contoh: Kelas X / XI SMK"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Pengantar / Deskripsi Materi Lengkap
              </label>
              <textarea
                rows={3}
                value={workingMaterial.detailedContent || ''}
                onChange={(e) => setWorkingMaterial({ ...workingMaterial, detailedContent: e.target.value })}
                placeholder="Penjelasan ringkas pembuka modul..."
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Poin Ringkasan Materi */}
          <div className="bg-slate-850 border border-slate-700/80 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <i className="fa-solid fa-list-check text-cyan-400"></i>
                  <span>Ringkasan Materi Ajar (Poin-Poin Penting)</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Poin-poin ini wajib dibaca dan ditinjau oleh siswa sebelum kuis dibuka.
                </p>
              </div>

              <button
                type="button"
                onClick={addSummaryPoint}
                className="px-3.5 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5"
              >
                <i className="fa-solid fa-plus"></i>
                <span>Tambah Poin</span>
              </button>
            </div>

            <div className="space-y-3">
              {workingMaterial.summaryPoints.map((point, idx) => (
                <div key={idx} className="flex items-start gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                  <span className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 flex-shrink-0 mt-1">
                    {idx + 1}
                  </span>
                  <textarea
                    rows={2}
                    value={point}
                    onChange={(e) => updateSummaryPoint(idx, e.target.value)}
                    className="flex-1 bg-transparent border-0 text-sm text-slate-200 focus:outline-none resize-none leading-relaxed"
                  />
                  <button
                    type="button"
                    onClick={() => deleteSummaryPoint(idx)}
                    title="Hapus Poin"
                    className="p-2 text-slate-500 hover:text-rose-400 transition-colors"
                  >
                    <i className="fa-solid fa-trash-can text-sm"></i>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: LEVEL & PEMBUAT SOAL                                               */}
      {/* ========================================================================= */}
      {activeTab === 'levels' && (
        <div className="space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <i className="fa-solid fa-gamepad text-indigo-400"></i>
                <span>Pengaturan Level &amp; Pasangan Soal</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Pilih model soal per level: Model 1 (Kartu Memori) atau Model 2 (Drag &amp; Drop).
              </p>
            </div>

            <button
              onClick={addLevel}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-indigo-600/20"
            >
              <i className="fa-solid fa-plus"></i>
              <span>Tambah Level Baru</span>
            </button>
          </div>

          {/* List of Levels */}
          {workingMaterial.levels.map((lvl, lvlIdx) => (
            <div
              key={lvl.levelNumber}
              className="bg-slate-850 border border-slate-700/80 rounded-3xl p-6 shadow-xl"
            >
              {/* Level Header Settings */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-black text-base">
                    {lvl.levelNumber}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Level {lvl.levelNumber}: {lvl.title}
                    </h3>
                    <span className="text-xs text-slate-400">
                      Jumlah Soal: {lvl.pairs.length} Pasang
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Model Selector */}
                  <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-700 text-xs">
                    <button
                      type="button"
                      onClick={() => updateLevelType(lvlIdx, 'memory')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                        lvl.type === 'memory'
                          ? 'bg-indigo-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <i className="fa-solid fa-brain mr-1.5"></i>
                      Model 1: Kartu Memori
                    </button>
                    <button
                      type="button"
                      onClick={() => updateLevelType(lvlIdx, 'dragdrop')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                        lvl.type === 'dragdrop'
                          ? 'bg-cyan-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <i className="fa-solid fa-arrows-left-right-to-line mr-1.5"></i>
                      Model 2: Drag &amp; Drop
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteLevel(lvlIdx)}
                    title="Hapus Level Ini"
                    className="p-2 text-slate-500 hover:text-rose-400 rounded-lg transition-colors"
                  >
                    <i className="fa-solid fa-trash-can"></i>
                  </button>
                </div>
              </div>

              {/* Title & Description Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Judul Level
                  </label>
                  <input
                    type="text"
                    value={lvl.title}
                    onChange={(e) => {
                      const updated = [...workingMaterial.levels];
                      updated[lvlIdx].title = e.target.value;
                      setWorkingMaterial({ ...workingMaterial, levels: updated });
                    }}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Instruksi / Petunjuk Level
                  </label>
                  <input
                    type="text"
                    value={lvl.description}
                    onChange={(e) => {
                      const updated = [...workingMaterial.levels];
                      updated[lvlIdx].description = e.target.value;
                      setWorkingMaterial({ ...workingMaterial, levels: updated });
                    }}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                  />
                </div>
              </div>

              {/* Pairs Editor Grid */}
              <div className="space-y-3 mt-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Daftar Pasangan Soal (Kunci/Istilah &amp; Jawaban/Definisi):</span>
                  <button
                    type="button"
                    onClick={() => addPairToLevel(lvlIdx)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-bold inline-flex items-center gap-1"
                  >
                    <i className="fa-solid fa-plus"></i> Tambah Pasangan
                  </button>
                </div>

                <div className="space-y-2.5">
                  {lvl.pairs.map((pair, pIdx) => (
                    <div
                      key={pair.id || pIdx}
                      className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-3 items-center"
                    >
                      <div className="md:col-span-1 text-center font-bold text-slate-500 text-xs">
                        #{pIdx + 1}
                      </div>

                      {/* Term (Kunci/Istilah Kiri) */}
                      <div className="md:col-span-4">
                        <label className="block text-[10px] uppercase font-bold text-cyan-400 mb-0.5">
                          Kunci / Istilah (Kiri)
                        </label>
                        <input
                          type="text"
                          value={pair.term}
                          onChange={(e) => updatePair(lvlIdx, pIdx, 'term', e.target.value)}
                          placeholder="Contoh: Router"
                          className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs font-semibold focus:outline-none focus:border-cyan-400"
                        />
                      </div>

                      {/* Definition (Jawaban/Penjelasan Kanan) */}
                      <div className="md:col-span-6">
                        <label className="block text-[10px] uppercase font-bold text-amber-400 mb-0.5">
                          Jawaban / Penjelasan / Definisi (Kanan)
                        </label>
                        <input
                          type="text"
                          value={pair.definition}
                          onChange={(e) => updatePair(lvlIdx, pIdx, 'definition', e.target.value)}
                          placeholder="Contoh: Perangkat penghubung antar subnet..."
                          className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      {/* Action */}
                      <div className="md:col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => deletePair(lvlIdx, pIdx)}
                          title="Hapus Pasangan Soal"
                          className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                        >
                          <i className="fa-solid fa-trash-can text-xs"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: AI GENERATOR SOAL OTOMATIS                                         */}
      {/* ========================================================================= */}
      {activeTab === 'ai' && (
        <div className="bg-slate-850 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase mb-2">
                <i className="fa-solid fa-wand-magic-sparkles"></i>
                <span>Gemini AI Kurikulum SMK</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Buat Soal Otomatis Berdasarkan Materi Ajar
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
                Cukup tempelkan silabus atau ringkasan modul pembelajaran Anda di bawah ini. AI secara otomatis akan menyusun ringkasan poin materi, pasangan kartu memori, dan drag-and-drop bertingkat!
              </p>
            </div>

            <button
              type="button"
              onClick={loadVocationalSample}
              className="text-xs px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 font-semibold transition-colors"
            >
              <i className="fa-solid fa-file-import mr-1.5"></i>
              Muat Contoh Materi Web/RPL
            </button>
          </div>

          {/* Prominent PDF Upload Card */}
          <div className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-2 border-dashed border-indigo-500/40 hover:border-indigo-400 transition-colors">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center text-2xl flex-shrink-0">
                  <i className="fa-solid fa-file-pdf"></i>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Upload File PDF Materi Ajar / Silabus SMK</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold">
                      Format .PDF
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Unggah modul ajar, materi presentasi, atau silabus berformat PDF untuk diekstrak teksnya &amp; disusun menjadi soal kuis otomatis.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingPDF || isGeneratingAI}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-60"
                >
                  {isUploadingPDF ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i>
                      <span>Mengekstrak PDF...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-cloud-arrow-up"></i>
                      <span>Pilih File PDF (.pdf)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {uploadedPdfInfo && (
              <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-circle-check text-emerald-400"></i>
                  <span>
                    File PDF Aktif: <strong className="text-white">{uploadedPdfInfo.fileName}</strong> ({uploadedPdfInfo.numPages} halaman)
                  </span>
                </div>
                <span className="text-[11px] text-cyan-400 font-semibold">
                  Teks berhasil diekstrak ({uploadedPdfInfo.textLength} karakter)
                </span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Topik / Mata Pelajaran Kejuruan *
              </label>
              <input
                type="text"
                value={aiTopicInput}
                onChange={(e) => setAiTopicInput(e.target.value)}
                placeholder="Contoh: Dasar Pemrograman Web & Framework SMK"
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Teks / Catatan Materi Guru (Sumber Pembuatan Soal) *
              </label>
              <textarea
                rows={8}
                value={aiContentInput}
                onChange={(e) => setAiContentInput(e.target.value)}
                placeholder="Tempelkan teks materi, silabus kejuruan, atau rangkuman di sini..."
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 leading-relaxed"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-3">
                <label className="text-xs font-semibold text-slate-300">
                  Target Jumlah Level:
                </label>
                <div className="inline-flex rounded-xl bg-slate-900 border border-slate-700 p-1 text-xs">
                  {[2, 3, 4].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setAiLevelsCount(count)}
                      className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                        aiLevelsCount === count
                          ? 'bg-amber-500 text-slate-950'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {count} Level
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleGenerateAI}
                disabled={isGeneratingAI}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-500/20 flex items-center gap-2.5 transition-all transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isGeneratingAI ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    <span>AI Sedang Menganalisis &amp; Merancang Soal...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-wand-magic-sparkles"></i>
                    <span>Buat Soal Otomatis dengan AI</span>
                  </>
                )}
              </button>
            </div>

            {aiResultNotice && (
              <div
                className={`p-4 rounded-xl text-xs flex items-center gap-2 mt-4 animate-fade-in ${
                  aiResultNotice.type === 'success'
                    ? 'bg-emerald-950/80 border border-emerald-500 text-emerald-200'
                    : 'bg-rose-950/80 border border-rose-800 text-rose-300'
                }`}
              >
                <i
                  className={`fa-solid ${
                    aiResultNotice.type === 'success' ? 'fa-circle-check text-emerald-400' : 'fa-circle-exclamation text-rose-400'
                  }`}
                ></i>
                <span>{aiResultNotice.message}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- FOOTER SHORTCUTS --- */}
      <div className="mt-8 pt-6 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={handleResetDefault}
          className="text-xs text-slate-500 hover:text-rose-400 transition-colors"
        >
          <i className="fa-solid fa-rotate-left mr-1"></i>
          Atur Ulang ke Materi Bawaan (Reset Demo)
        </button>

        <button
          onClick={onSwitchToStudent}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md"
        >
          <span>Coba Tampilan Siswa (Pratinjau)</span>
          <i className="fa-solid fa-arrow-right"></i>
        </button>
      </div>

      {/* --- MODAL GANTI PASSWORD GURU --- */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-6 text-center shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">
              Ganti Password Guru
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Masukkan password baru untuk mengamankan akses Mode Guru.
            </p>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <input
                type="password"
                value={newPasswordInput}
                onChange={(e) => setNewPasswordInput(e.target.value)}
                placeholder="Password baru (min. 4 karakter)"
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                required
              />

              {changePwdMsg && (
                <div className="text-xs text-emerald-400 font-semibold">
                  {changePwdMsg}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowChangePasswordModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                >
                  Simpan Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
