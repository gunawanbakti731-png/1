import React, { useState } from 'react';
import { LearningMaterial } from '../types';

interface StudentHomeProps {
  material: LearningMaterial;
  onStartGame: (studentName: string, studentClass: string) => void;
  onOpenTeacherMode: () => void;
}

export const StudentHome: React.FC<StudentHomeProps> = ({
  material,
  onStartGame,
  onOpenTeacherMode,
}) => {
  const [studentName, setStudentName] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const quickClasses = ['X TKJ 1', 'X PPLG 2', 'XI TKJ 2', 'XI RPL 1', 'X DKV', 'XI TBSM'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) {
      setErrorMsg('Silakan masukkan nama lengkap Anda terlebih dahulu.');
      return;
    }
    if (!studentClass.trim()) {
      setErrorMsg('Silakan isi kelas atau jurusan Anda.');
      return;
    }
    setErrorMsg('');
    onStartGame(studentName.trim(), studentClass.trim());
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center py-8 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Decorative Background Lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-2xl pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center">
        {/* Badge Hero */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-indigo-500/30 text-indigo-300 text-xs sm:text-sm font-semibold mb-6 shadow-sm">
          <i className="fa-solid fa-graduation-cap text-indigo-400"></i>
          <span>Media Edukasi Berbasis Gamifikasi Interaktif</span>
        </div>

        {/* Main Title */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-center tracking-tight leading-tight text-white mb-4">
          INTERAKTIF <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-teal-300 bg-clip-text text-transparent">SMK</span>
        </h1>

        <p className="text-slate-300 text-center text-sm sm:text-base max-w-2xl mb-8">
          Tingkatkan kompetensi kejuruan Anda melalui permainan interaktif berbasis level. Pelajari ringkasan materi, taklukkan tantangan kartu memori &amp; drag-and-drop, dan unduh sertifikat kelulusan digital Anda!
        </p>

        {/* Active Subject & Topic Card */}
        <div className="w-full max-w-xl bg-slate-800/60 backdrop-blur-md border border-slate-700/80 rounded-2xl p-4 sm:p-5 mb-8 text-center shadow-xl">
          <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1">
            <i className="fa-solid fa-book-bookmark"></i>
            <span>Topik Pembelajaran Aktif</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white mb-1">
            {material.topic}
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
            <span className="px-2.5 py-0.5 rounded-md bg-slate-700/60 border border-slate-600/50">
              <i className="fa-solid fa-layer-group mr-1.5 text-indigo-400"></i>
              {material.levels.length} Level Tantangan
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-slate-700/60 border border-slate-600/50">
              <i className="fa-solid fa-id-badge mr-1.5 text-cyan-400"></i>
              {material.targetGrade || 'SMK'}
            </span>
          </div>
        </div>

        {/* Registration & Entry Form */}
        <div className="w-full max-w-md bg-slate-800/90 backdrop-blur-xl border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-indigo-950/40">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-white flex items-center justify-center gap-2">
              <i className="fa-solid fa-user-astronaut text-indigo-400"></i>
              <span>Data Siswa</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Masukkan identitas Anda untuk dicetak pada sertifikat resmi kelulusan
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Nama Lengkap Siswa *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <i className="fa-solid fa-user"></i>
                </div>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Contoh: Muhammad Budi Pratama"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-600 focus:border-indigo-500 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Kelas / Jurusan *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <i className="fa-solid fa-school"></i>
                </div>
                <input
                  type="text"
                  value={studentClass}
                  onChange={(e) => setStudentClass(e.target.value)}
                  placeholder="Contoh: X TKJ 1 / XI RPL"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-600 focus:border-indigo-500 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
                  required
                />
              </div>
              {/* Quick Class Tags */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[10px] text-slate-400">Pilih cepat:</span>
                {quickClasses.map((cls) => (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => setStudentClass(cls)}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-700/60 hover:bg-indigo-600/30 hover:text-indigo-200 text-slate-300 border border-slate-600/50 transition-colors"
                  >
                    {cls}
                  </button>
                ))}
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <i className="fa-solid fa-circle-exclamation flex-shrink-0"></i>
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full mt-2 py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 group transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <span>Mulai Belajar &amp; Bermain</span>
              <i className="fa-solid fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
            </button>
          </form>

          {/* Teacher shortcut footnote */}
          <div className="mt-5 pt-4 border-t border-slate-700/60 text-center">
            <button
              type="button"
              onClick={onOpenTeacherMode}
              className="text-xs text-slate-400 hover:text-indigo-300 inline-flex items-center gap-1.5 transition-colors"
            >
              <i className="fa-solid fa-lock text-[10px]"></i>
              <span>Anda Guru? Masuk ke Mode Kelola Materi</span>
            </button>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl mt-12">
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0">
              <i className="fa-solid fa-book-open-reader"></i>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">1. Ringkasan Materi</h4>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Pahami poin-poin materi esensial sebelum membuka arena permainan level.
              </p>
            </div>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0">
              <i className="fa-solid fa-puzzle-piece"></i>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">2. Arena Game Bertingkat</h4>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Taklukkan Model Kartu Memori &amp; Drag-and-Drop. Wajib 100% benar untuk lanjut level!
              </p>
            </div>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
              <i className="fa-solid fa-award"></i>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">3. Sertifikat Kelulusan</h4>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Dapatkan sertifikat digital otomatis berstandar formal yang siap diunduh PDF atau gambar.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
