import { jsPDF } from 'jspdf';
import { LearningMaterial } from '../types';

// Helper to extract text and base64 from a PDF file using pdf.js or FileReader
export async function extractTextFromPDF(file: File): Promise<{
  text: string;
  base64: string;
  numPages: number;
  fileName: string;
}> {
  return new Promise(async (resolve, reject) => {
    try {
      const arrayBuffer = await file.arrayBuffer();

      // Convert arrayBuffer to base64
      let binary = '';
      const bytes = new Uint8Array(arrayBuffer);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);

      let extractedText = '';
      let numPages = 1;

      // Try reading pages using pdf.js if loaded
      const pdfjsLib = (window as any).pdfjsLib;
      if (pdfjsLib) {
        try {
          const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
          const pdfDoc = await loadingTask.promise;
          numPages = pdfDoc.numPages;

          const textChunks: string[] = [];
          for (let pageNum = 1; pageNum <= Math.min(numPages, 20); pageNum++) {
            const page = await pdfDoc.getPage(pageNum);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
              .map((item: any) => item.str)
              .join(' ');
            if (pageText.trim()) {
              textChunks.push(`--- Halaman ${pageNum} ---\n${pageText}`);
            }
          }
          extractedText = textChunks.join('\n\n');
        } catch (pdfErr) {
          console.warn('pdf.js extraction warning, falling back to base64 passing:', pdfErr);
        }
      }

      // If extractedText is empty or short, clean file name as fallback context
      if (!extractedText.trim()) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        extractedText = `Materi dari dokumen: ${cleanName}. Silakan buatkan rangkuman dan soal SMK berdasarkan isi materi kejuruan terkait.`;
      }

      resolve({
        text: extractedText,
        base64,
        numPages,
        fileName: file.name,
      });
    } catch (err) {
      reject(err);
    }
  });
}

// Download the complete Learning Material as a clean, reliable, professional PDF document using jsPDF
export async function downloadMaterialAsPDF(material: LearningMaterial): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 15;
      const contentWidth = pageWidth - margin * 2; // 180mm
      let y = 18;

      const dateStr = new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      // Helper for page break
      const checkPageBreak = (neededHeight: number) => {
        if (y + neededHeight > pageHeight - 20) {
          doc.addPage();
          y = 18;
          renderHeaderBar();
        }
      };

      const renderHeaderBar = () => {
        doc.setFillColor(30, 58, 138); // #1e3a8a Navy
        doc.rect(margin, y, 14, 14, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('SMK', margin + 2.5, y + 8.5);

        doc.setTextColor(30, 58, 138);
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        doc.text('INTERAKTIF SMK • MEDIA PEMBELAJARAN BERBASIS GAME', margin + 18, y + 5);

        doc.setTextColor(100, 116, 139);
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.text(`Bahan Ajar Siswa & Lembar Evaluasi Mandiri • Dicetak: ${dateStr}`, margin + 18, y + 10);

        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.4);
        doc.line(margin, y + 16, margin + contentWidth, y + 16);

        y += 22;
      };

      // Render initial header
      renderHeaderBar();

      // Topic Title Box
      doc.setFillColor(248, 250, 252); // Slate-50
      doc.setDrawColor(199, 210, 254); // Indigo-200
      doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'FD');

      doc.setTextColor(180, 83, 9); // Amber-700
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.text('TOPIK PEMBELAJARAN KEJURUAN', margin + 4, y + 6);

      doc.setTextColor(15, 23, 42); // Slate-900
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      const topicLines = doc.splitTextToSize(material.topic || 'Modul Pembelajaran SMK', contentWidth - 8);
      doc.text(topicLines, margin + 4, y + 13);

      doc.setTextColor(71, 85, 105);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Tingkat: ${material.targetGrade || 'Kelas X/XI SMK'} | Bidang: ${material.subject || 'Teknik & Kejuruan'}`,
        margin + 4,
        y + 19
      );

      y += 28;

      // Section 1: Pengantar Modul
      if (material.detailedContent) {
        checkPageBreak(30);

        doc.setFillColor(30, 58, 138);
        doc.rect(margin, y, 2.5, 6, 'F');
        doc.setTextColor(30, 58, 138);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('I. PENGANTAR & RINGKASAN MODUL', margin + 5, y + 5);

        y += 9;

        doc.setTextColor(51, 65, 85);
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        const introLines = doc.splitTextToSize(material.detailedContent, contentWidth - 4);
        doc.text(introLines, margin + 2, y);

        y += introLines.length * 4.2 + 6;
      }

      // Section 2: Poin-Poin Kunci Materi (Wajib Dipelajari)
      if (material.summaryPoints && material.summaryPoints.length > 0) {
        checkPageBreak(35);

        doc.setFillColor(30, 58, 138);
        doc.rect(margin, y, 2.5, 6, 'F');
        doc.setTextColor(30, 58, 138);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('II. POIN-POIN KUNCI MATERI (WAJIB DIPELAJARI SEBELUM KUIS)', margin + 5, y + 5);

        y += 9;

        material.summaryPoints.forEach((point, idx) => {
          const pointText = `${idx + 1}. ${point}`;
          const lines = doc.splitTextToSize(pointText, contentWidth - 8);
          const boxHeight = lines.length * 4.2 + 4;

          checkPageBreak(boxHeight + 2);

          doc.setFillColor(idx % 2 === 0 ? 248 : 255, idx % 2 === 0 ? 250 : 255, idx % 2 === 0 ? 252 : 255);
          doc.setDrawColor(226, 232, 240);
          doc.roundedRect(margin, y, contentWidth, boxHeight, 1.5, 1.5, 'FD');

          doc.setTextColor(30, 41, 59);
          doc.setFontSize(8.5);
          doc.setFont('helvetica', 'normal');
          doc.text(lines, margin + 4, y + 4.5);

          y += boxHeight + 2.5;
        });

        y += 4;
      }

      // Section 3: Struktur Level Permainan & Pasangan Soal
      if (material.levels && material.levels.length > 0) {
        checkPageBreak(35);

        doc.setFillColor(30, 58, 138);
        doc.rect(margin, y, 2.5, 6, 'F');
        doc.setTextColor(30, 58, 138);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('III. STRUKTUR LEVEL PERMAINAN & BANK PASANGAN SOAL', margin + 5, y + 5);

        y += 9;

        material.levels.forEach((lvl) => {
          checkPageBreak(30);

          // Level Header Banner
          doc.setFillColor(241, 245, 249);
          doc.setDrawColor(203, 213, 225);
          doc.roundedRect(margin, y, contentWidth, 10, 1.5, 1.5, 'FD');

          doc.setTextColor(15, 23, 42);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.text(`Level ${lvl.levelNumber}: ${lvl.title}`, margin + 3, y + 6.5);

          doc.setFontSize(7.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(lvl.type === 'memory' ? 79 : 8, lvl.type === 'memory' ? 70 : 145, lvl.type === 'memory' ? 229 : 178);
          const typeLabel = lvl.type === 'memory' ? '[Model 1: Kartu Memori]' : '[Model 2: Drag & Drop]';
          doc.text(typeLabel, margin + contentWidth - 45, y + 6.5);

          y += 12;

          // Instruction line
          if (lvl.description) {
            doc.setTextColor(100, 116, 139);
            doc.setFontSize(7.5);
            doc.setFont('helvetica', 'italic');
            const descLines = doc.splitTextToSize(`Petunjuk: ${lvl.description}`, contentWidth);
            doc.text(descLines, margin + 1, y);
            y += descLines.length * 3.5 + 2;
          }

          // Table Header
          checkPageBreak(15);
          doc.setFillColor(226, 232, 240);
          doc.rect(margin, y, contentWidth, 6, 'F');
          doc.setTextColor(51, 65, 85);
          doc.setFontSize(7.5);
          doc.setFont('helvetica', 'bold');
          doc.text('No', margin + 2, y + 4.2);
          doc.text('Kunci / Istilah (Kiri)', margin + 12, y + 4.2);
          doc.text('Definisi / Jawaban / Penjelasan (Kanan)', margin + 70, y + 4.2);
          y += 6;

          // Table Rows
          lvl.pairs.forEach((pair, pIdx) => {
            const termLines = doc.splitTextToSize(pair.term, 52);
            const defLines = doc.splitTextToSize(pair.definition, contentWidth - 72);
            const rowHeight = Math.max(termLines.length, defLines.length) * 4 + 3;

            checkPageBreak(rowHeight + 2);

            // Row background alternate
            if (pIdx % 2 === 1) {
              doc.setFillColor(248, 250, 252);
              doc.rect(margin, y, contentWidth, rowHeight, 'F');
            }

            // Divider line
            doc.setDrawColor(226, 232, 240);
            doc.line(margin, y + rowHeight, margin + contentWidth, y + rowHeight);

            doc.setTextColor(100, 116, 139);
            doc.setFontSize(7.5);
            doc.setFont('helvetica', 'normal');
            doc.text(String(pIdx + 1), margin + 2, y + 4);

            doc.setTextColor(15, 23, 42);
            doc.setFont('helvetica', 'bold');
            doc.text(termLines, margin + 12, y + 4);

            doc.setTextColor(51, 65, 85);
            doc.setFont('helvetica', 'normal');
            doc.text(defLines, margin + 70, y + 4);

            y += rowHeight;
          });

          y += 5;
        });
      }

      // Add page numbering on all pages
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.line(margin, pageHeight - 12, margin + contentWidth, pageHeight - 12);

        doc.setTextColor(148, 163, 184);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text('Dokumen Resmi Media Pembelajaran Interaktif SMK', margin, pageHeight - 8);
        doc.text(`Halaman ${i} dari ${totalPages}`, margin + contentWidth - 22, pageHeight - 8);
      }

      // Generate filename and save directly
      const cleanTopic = (material.topic || 'Materi_SMK')
        .replace(/[^a-zA-Z0-9]/g, '_')
        .slice(0, 30);
      const filename = `Modul_Materi_${cleanTopic}.pdf`;

      doc.save(filename);
      resolve();
    } catch (err) {
      console.error('Error generating PDF with jsPDF:', err);
      reject(err);
    }
  });
}
