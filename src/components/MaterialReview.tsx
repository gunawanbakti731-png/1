import React, { useState } from 'react';
import { LearningMaterial, StudentSession } from '../types';
import { soundManager } from '../utils/audio';
import { downloadMaterialAsPDF } from '../utils/pdfModule';

interface MaterialReviewProps {
  material: LearningMaterial;
  session: StudentSession;
  onProceedToLevel1: () => void;
  onBackToHome: () => void;
}

export const MaterialReview: React.FC<MaterialReviewProps> = ({
  material,
  session,
  onProceedToLevel1,
  onBackToHome,
}) => {
  const points = material.summaryPoints || [];
  // Track read points
  const [readPointIndices, setReadPointIndices] = useState<number[]>([]);
  const [hasConfirmedUnderstanding, setHasConfirmedUnderstanding] = useState(false);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [downloadNotice, setDownloadNotice] = useState('');

  const handleDownloadPDF = async () => {
    setIsDownloadingPDF(true);
    setDownloadNotice('Sedang mengunduh dokumen modul PDF...');
    soundManager.playCardFlip();

    try {
      await downloadMaterialAsPDF(material);
      soundManager.playMatchSuccess();
      setDownloadNotice('Dokumen Modul PDF berhasil diunduh ke perangkat Anda!');
    } catch (err) {
      console.error('Error generating PDF:', err);
      soundManager.playErrorBuzz();
      setDownloadNotice('Terjadi kendala saat mengunduh PDF.');
    } finally {
      setIsDownloadingPDF(false);
      setTimeout(() => setDownloadNotice(''), 4000);
    }
  };

  const toggleReadPoint = (index: number) => {
    soundManager.playCardFlip();
    if (readPointIndices.includes(index)) {
      setReadPointIndices(readPointIndices.filter((i) => i !== index));
    } else {
      const nextRead = [...readPointIndices, index];
      setReadPointIndices(nextRead);
      if (nextRead.length === points.length) {
        soundManager.playMatchSuccess();
      }
    }
  };

  const markAllRead = () => {
    soundManager.playMatchSuccess();
    setReadPointIndices(points.map((_, i) => i));
    setHasConfirmedUnderstanding(true);
  };

  const isAllRead = points.length === 0 || readPointIndices.length >= points.length;
  const canProceed = isAllRead && hasConfirmedUnderstanding;

  const handleProceed = () => {
    if (!canProceed) return;
    soundManager.playMatchSuccess();
    onProceedToLevel1();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Navigation & Student Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <button
          onClick={onBackToHome}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <i className="fa-solid fa-arrow-left"></i>
          <span>Kembali ke Data Siswa</span>
        </button>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Siswa: <strong className="text-white">{session.studentName}</strong> ({session.studentClass})</span>
        </div>
      </div>

      {/* Hero Header Card */}
      <div className="bg-gradient-to-br from-indigo-950/70 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 mb-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2">
            <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 border border-indigo-500/30">
              Tahap 1: Presentasi Materi Ajar
            </span>
            <span className="text-slate-400 hidden sm:inline">•</span>
            <span className="text-slate-400 hidden sm:inline">{material.targetGrade || 'SMK'}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white mb-3">
            {material.topic}
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-3xl">
            {material.detailedContent || 'Bacalah rangkuman konsep di bawah ini dengan saksama. Materi ini merupakan kunci untuk memecahkan soal kuis interaktif di Level 1 hingga tamat.'}
          </p>

          {/* Progress Bar of Reading */}
          <div className="mt-6 pt-6 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="text-xs font-semibold text-slate-300">
                Progres Peninjauan Materi:
              </div>
              <div className="w-36 sm:w-48 bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-700">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full transition-all duration-300 rounded-full"
                  style={{
                    width: `${points.length > 0 ? (readPointIndices.length / points.length) * 100 : 100}%`,
                  }}
                ></div>
              </div>
              <span className="text-xs font-bold text-cyan-400">
                {readPointIndices.length} / {points.length} Poin
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleDownloadPDF}
                disabled={isDownloadingPDF}
                className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {isDownloadingPDF ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    <span>Mengunduh...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-file-pdf text-rose-400"></i>
                    <span>Unduh Modul PDF</span>
                  </>
                )}
              </button>

              <button
                onClick={markAllRead}
                className="text-xs px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium transition-colors cursor-pointer"
              >
                <i className="fa-solid fa-check-double mr-1.5"></i>
                Tandai Semua Selesai Dibaca
              </button>
            </div>
          </div>

          {downloadNotice && (
            <div className="mt-4 p-3 bg-emerald-950/90 border border-emerald-500 rounded-xl text-emerald-200 text-xs flex items-center gap-2 animate-fade-in shadow-md">
              <i className="fa-solid fa-circle-check text-emerald-400 text-sm"></i>
              <span>{downloadNotice}</span>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="space-y-4 mb-8">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <i className="fa-solid fa-list-check text-cyan-400"></i>
          <span>Poin-Poin Kunci Materi (Wajib Dipelajari)</span>
        </h2>

        <div className="grid grid-cols-1 gap-3.5">
          {points.map((point, index) => {
            const isRead = readPointIndices.includes(index);
            return (
              <div
                key={index}
                onClick={() => toggleReadPoint(index)}
                className={`cursor-pointer rounded-2xl p-5 border transition-all duration-200 select-none ${
                  isRead
                    ? 'bg-slate-800/80 border-emerald-500/40 shadow-md shadow-emerald-950/20'
                    : 'bg-slate-850 border-slate-700/80 hover:border-indigo-500/50 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Status Checkbox / Icon */}
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors text-sm font-bold ${
                      isRead
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-slate-700/60 text-slate-400 border border-slate-600'
                    }`}
                  >
                    {isRead ? (
                      <i className="fa-solid fa-check"></i>
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">
                        Poin #{index + 1}
                      </span>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          isRead
                            ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                            : 'bg-slate-700 text-slate-400'
                        }`}
                      >
                        {isRead ? 'Sudah Dipahami' : 'Klik untuk Membaca'}
                      </span>
                    </div>
                    <p className={`text-sm sm:text-base leading-relaxed ${isRead ? 'text-slate-100 font-medium' : 'text-slate-300'}`}>
                      {point}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Confirmation & Call to Action Box */}
      <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 shadow-xl">
        <label className="flex items-start gap-3 cursor-pointer select-none mb-6">
          <input
            type="checkbox"
            checked={hasConfirmedUnderstanding}
            onChange={(e) => {
              setHasConfirmedUnderstanding(e.target.checked);
              if (e.target.checked) soundManager.playCardFlip();
            }}
            className="mt-1 w-5 h-5 rounded text-indigo-600 bg-slate-900 border-slate-600 focus:ring-indigo-500 focus:ring-offset-slate-900"
          />
          <span className="text-sm text-slate-200">
            Saya menyatakan bahwa saya telah membaca, mempelajari, dan memahami materi <strong>{material.topic}</strong> di atas dengan sungguh-sungguh dan siap membuktikannya di arena permainan!
          </span>
        </label>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-700/60">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <i className={`fa-solid ${canProceed ? 'fa-circle-check text-emerald-400' : 'fa-circle-info text-amber-400'}`}></i>
            <span>
              {canProceed
                ? 'Semua materi telah diverifikasi. Siap bertanding!'
                : 'Tandai semua poin dan centang konfirmasi untuk membuka Level 1.'}
            </span>
          </div>

          <button
            onClick={handleProceed}
            disabled={!canProceed}
            className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all duration-200 ${
              canProceed
                ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white shadow-lg shadow-emerald-500/25 cursor-pointer transform hover:-translate-y-0.5 animate-pulse'
                : 'bg-slate-700/50 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
            }`}
          >
            <span>Saya Sudah Paham, Lanjut ke Game Level 1</span>
            <i className="fa-solid fa-gamepad"></i>
          </button>
        </div>
      </div>
    </div>
  );
};
