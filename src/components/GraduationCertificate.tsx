import React, { useEffect, useRef, useState } from 'react';
import { LearningMaterial, StudentSession } from '../types';
import { soundManager } from '../utils/audio';

interface GraduationCertificateProps {
  material: LearningMaterial;
  session: StudentSession;
  onPlayAgain: () => void;
  onBackToHome: () => void;
}

export const GraduationCertificate: React.FC<GraduationCertificateProps> = ({
  material,
  session,
  onPlayAgain,
  onBackToHome,
}) => {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingPNG, setIsExportingPNG] = useState(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState('');

  // Date and Certificate ID formatting
  const completionDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const certificateNumber = `SMK-INT/${new Date().getFullYear()}/${Math.floor(100000 + Math.random() * 900000)}`;

  // Trigger celebration on mount
  useEffect(() => {
    soundManager.playGraduationFanfare();

    // Trigger confetti if available from CDN
    if (typeof (window as any).confetti === 'function') {
      const end = Date.now() + 3.5 * 1000;
      const colors = ['#6366f1', '#10b981', '#f59e0b', '#06b6d4', '#ec4899'];

      (function frame() {
        (window as any).confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors,
        });
        (window as any).confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();
    }
  }, []);

  // --- DOWNLOAD PDF VIA html2pdf.js ---
  const handleDownloadPDF = async () => {
    if (!certificateRef.current) return;
    setIsExportingPDF(true);
    setExportSuccessMsg('');

    try {
      const element = certificateRef.current;
      const html2pdf = (window as any).html2pdf;

      if (typeof html2pdf === 'function') {
        const opt = {
          margin: [8, 8, 8, 8],
          filename: `Sertifikat-${session.studentName.replace(/\s+/g, '_')}-Interaktif-SMK.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
        };

        const pdfPromise = html2pdf().set(opt).from(element).save();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('PDF generation timed out')), 6000)
        );

        await Promise.race([pdfPromise, timeoutPromise]);
        setExportSuccessMsg('Sertifikat PDF berhasil diunduh!');
        soundManager.playMatchSuccess();
      } else {
        // Fallback to print
        window.print();
      }
    } catch (err) {
      console.warn('PDF generation notice:', err);
      window.print();
    } finally {
      setIsExportingPDF(false);
      setTimeout(() => setExportSuccessMsg(''), 4000);
    }
  };

  // --- DOWNLOAD PNG IMAGE VIA html2canvas / Canvas ---
  const handleDownloadPNG = async () => {
    if (!certificateRef.current) return;
    setIsExportingPNG(true);
    setExportSuccessMsg('');

    try {
      const html2pdf = (window as any).html2pdf;
      const html2canvas = (window as any).html2canvas;

      // Check if html2canvas is available directly or inside html2pdf bundle
      const canvasFn = html2canvas || (html2pdf ? html2pdf.html2canvas : null);

      if (canvasFn) {
        const canvas = await canvasFn(certificateRef.current, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
        });
        const imgData = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `Sertifikat-${session.studentName.replace(/\s+/g, '_')}-Interaktif-SMK.png`;
        link.href = imgData;
        link.click();
        setExportSuccessMsg('Sertifikat Gambar PNG berhasil diunduh!');
        soundManager.playMatchSuccess();
      } else {
        window.print();
      }
    } catch (err) {
      console.error('Error generating PNG:', err);
      window.print();
    } finally {
      setIsExportingPNG(false);
      setTimeout(() => setExportSuccessMsg(''), 4000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Celebration Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm font-bold mb-3 shadow-lg shadow-emerald-500/10">
          <i className="fa-solid fa-crown text-amber-400"></i>
          <span>SELURUH LEVEL TUNTAS DENGAN KETEPATAN 100%!</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Selamat, Anda Dinyatakan <span className="bg-gradient-to-r from-amber-300 via-emerald-300 to-cyan-300 bg-clip-text text-transparent">LULUS!</span>
        </h1>
        <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-xl mx-auto">
          Anda telah menuntaskan seluruh materi dan tantangan permainan <strong className="text-white">Interaktif SMK</strong>. Bukti ketuntasan belajar digital Anda telah diterbitkan secara resmi di bawah ini.
        </p>
      </div>

      {/* Graduation Stats Pill Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto mb-8 text-center">
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-3.5">
          <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Status Ketuntasan</div>
          <div className="text-sm sm:text-base font-extrabold text-emerald-400 mt-1">100% Sempurna</div>
        </div>
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-3.5">
          <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Tingkat Kelulusan</div>
          <div className="text-sm sm:text-base font-extrabold text-amber-400 mt-1">Predikat A</div>
        </div>
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-3.5">
          <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Total Level</div>
          <div className="text-sm sm:text-base font-extrabold text-indigo-300 mt-1">{material.levels.length} Level</div>
        </div>
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-3.5">
          <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Total Skor</div>
          <div className="text-sm sm:text-base font-extrabold text-cyan-300 mt-1">{session.totalScore} Poin</div>
        </div>
      </div>

      {/* Action Buttons Bar */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
        <button
          onClick={handleDownloadPDF}
          disabled={isExportingPDF}
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all transform hover:-translate-y-0.5 cursor-pointer"
        >
          {isExportingPDF ? (
            <>
              <i className="fa-solid fa-spinner fa-spin"></i>
              <span>Memproses Dokumen PDF...</span>
            </>
          ) : (
            <>
              <i className="fa-solid fa-file-pdf text-rose-300"></i>
              <span>Unduh Sertifikat PDF</span>
            </>
          )}
        </button>

        <button
          onClick={handleDownloadPNG}
          disabled={isExportingPNG}
          className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700 font-bold text-sm shadow-md flex items-center gap-2 transition-all transform hover:-translate-y-0.5 cursor-pointer"
        >
          {isExportingPNG ? (
            <>
              <i className="fa-solid fa-spinner fa-spin"></i>
              <span>Mengambil Gambar...</span>
            </>
          ) : (
            <>
              <i className="fa-solid fa-image text-emerald-400"></i>
              <span>Download Sertifikat Gambar</span>
            </>
          )}
        </button>

        <button
          onClick={handlePrint}
          className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-sm font-semibold flex items-center gap-2"
        >
          <i className="fa-solid fa-print"></i>
          <span>Cetak</span>
        </button>

        <button
          onClick={onPlayAgain}
          className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-sm font-semibold flex items-center gap-2"
        >
          <i className="fa-solid fa-rotate-right"></i>
          <span>Main Lagi</span>
        </button>

        <button
          onClick={onBackToHome}
          className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-sm font-semibold flex items-center gap-2"
        >
          <i className="fa-solid fa-house"></i>
          <span>Menu Utama</span>
        </button>
      </div>

      {exportSuccessMsg && (
        <div className="max-w-md mx-auto mb-6 p-3 bg-emerald-950/80 border border-emerald-500 rounded-xl text-emerald-200 text-xs text-center flex items-center justify-center gap-2 animate-fade-in">
          <i className="fa-solid fa-circle-check text-emerald-400"></i>
          <span>{exportSuccessMsg}</span>
        </div>
      )}

      {/* --- FORMAL DIGITAL CERTIFICATE CANVAS / CONTAINER --- */}
      <div className="overflow-x-auto pb-6">
        <div
          ref={certificateRef}
          className="min-w-[800px] max-w-[950px] mx-auto bg-[#faf8f2] text-slate-900 rounded-2xl p-8 sm:p-12 shadow-2xl relative select-none border-8 border-double border-[#b38e44]"
          style={{
            fontFamily: "'Plus Jakarta Sans', serif",
            backgroundImage: 'radial-gradient(#eedcb0 0.75px, transparent 0.75px)',
            backgroundSize: '24px 24px',
          }}
        >
          {/* Ornamental Inner Border Frame */}
          <div className="border-2 border-[#1e293b] p-6 sm:p-8 rounded-xl relative">
            {/* Corner Decorative Ornaments */}
            <div className="absolute -top-3 -left-3 text-2xl text-[#b38e44]">
              <i className="fa-solid fa-certificate"></i>
            </div>
            <div className="absolute -top-3 -right-3 text-2xl text-[#b38e44]">
              <i className="fa-solid fa-certificate"></i>
            </div>
            <div className="absolute -bottom-3 -left-3 text-2xl text-[#b38e44]">
              <i className="fa-solid fa-certificate"></i>
            </div>
            <div className="absolute -bottom-3 -right-3 text-2xl text-[#b38e44]">
              <i className="fa-solid fa-certificate"></i>
            </div>

            {/* Official Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-3 justify-center mb-2">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#1e3a8a] to-[#2563eb] text-white flex items-center justify-center text-xl shadow-md">
                  <i className="fa-solid fa-graduation-cap"></i>
                </div>
                <div className="text-left">
                  <div className="text-xs font-black tracking-widest text-[#1e3a8a] uppercase">
                    SEKOLAH MENENGAH KEJURUAN
                  </div>
                  <div className="text-[11px] font-bold text-[#b38e44] tracking-wider uppercase">
                    MEDIA PEMBELAJARAN BERBASIS GAME - INTERAKTIF SMK
                  </div>
                </div>
              </div>

              <h2
                className="text-2xl sm:text-4xl font-extrabold tracking-wider text-[#0f172a] uppercase mt-2"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                SERTIFIKAT KELULUSAN
              </h2>
              <div className="text-[11px] font-semibold tracking-widest text-slate-500 uppercase mt-0.5">
                NO. DOKUMEN: {certificateNumber}
              </div>
              <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#b38e44] to-transparent mx-auto mt-2"></div>
            </div>

            {/* Statement of Achievement */}
            <div className="text-center my-6 space-y-3">
              <p className="text-xs sm:text-sm text-slate-600 font-medium tracking-wide">
                Dengan bangga menyatakan bahwa peserta didik di bawah ini:
              </p>

              {/* Student Name */}
              <div className="py-2">
                <h3 className="text-2xl sm:text-4xl font-black text-[#1e293b] tracking-tight border-b-2 border-slate-300 inline-block px-8 pb-1">
                  {session.studentName || 'NAMA SISWA'}
                </h3>
              </div>

              <div className="text-xs sm:text-sm font-bold text-[#1e3a8a] tracking-wider uppercase">
                KELAS / JURUSAN: {session.studentClass || 'KELAS / KOMPETENSI KEAHLIAN'}
              </div>

              <p className="text-xs sm:text-sm text-slate-700 max-w-2xl mx-auto leading-relaxed pt-2">
                Telah berhasil menyelesaikan secara tuntas seluruh tahapan pemahaman materi ajar serta lulus 100% pada semua level tantangan permainan edukasi bertingkat:
              </p>

              {/* Topic Name */}
              <div className="inline-block bg-[#0f172a] text-white px-6 py-2 rounded-xl text-sm sm:text-base font-bold shadow-sm tracking-wide">
                "{material.topic}"
              </div>

              {/* Predicate Badge */}
              <div className="pt-2">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#ecfdf5] border-2 border-[#10b981] text-[#065f46] text-xs font-black uppercase tracking-wider shadow-sm">
                  <i className="fa-solid fa-award text-amber-500"></i>
                  <span>Lulus Dengan Predikat: SANGAT BAIK (A)</span>
                </span>
              </div>
            </div>

            {/* Signatures & Verification Seal */}
            <div className="mt-8 pt-6 border-t border-slate-300 grid grid-cols-3 items-center text-center">
              {/* Left: Verification QR / Barcode Seal */}
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-white border border-slate-300 p-1.5 rounded-lg shadow-sm flex items-center justify-center">
                  <i className="fa-solid fa-qrcode text-3xl text-slate-800"></i>
                </div>
                <span className="text-[9px] font-semibold text-slate-500 uppercase mt-1 tracking-wider">
                  Verifikasi Digital
                </span>
              </div>

              {/* Center: Gold Education Seal */}
              <div className="flex flex-col items-center">
                <div className="w-18 h-18 rounded-full border-4 border-[#b38e44] bg-[#fbf5e6] flex flex-col items-center justify-center p-2 text-[#b38e44] shadow-md">
                  <i className="fa-solid fa-medal text-xl"></i>
                  <span className="text-[8px] font-black uppercase tracking-tighter mt-0.5">
                    SMK BISA
                  </span>
                </div>
                <span className="text-[9px] font-extrabold text-[#b38e44] uppercase mt-1 tracking-wider">
                  KOMPETENSI TERUJI
                </span>
              </div>

              {/* Right: Guru Pengampu Signature */}
              <div className="flex flex-col items-center">
                <div className="text-[11px] text-slate-600 font-medium">
                  Ditetapkan pada: {completionDate}
                </div>
                <div className="my-2 h-10 flex items-center justify-center">
                  <span
                    className="text-xl sm:text-2xl font-bold text-[#1e3a8a] italic"
                    style={{ fontFamily: "'Cinzel', cursive" }}
                  >
                    Guru Pengampu
                  </span>
                </div>
                <div className="w-32 border-b border-slate-400"></div>
                <div className="text-[11px] font-bold text-slate-800 mt-1 uppercase">
                  Tim Fasilitator Kejuruan
                </div>
                <div className="text-[9px] text-slate-500">
                  Instruktur Media Interaktif SMK
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
