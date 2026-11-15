import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MANUAL_BOOK_CHAPTERS } from './manualBookData';

export interface ManualPdfBranding {
  appName?: string;
  appTagline?: string;
  institutionName?: string;
  shortInstitutionName?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
}

const EMERALD_DARK: [number, number, number] = [10, 47, 28]; // #0a2f1c
const EMERALD_PRIMARY: [number, number, number] = [4, 120, 87]; // #047857
const EMERALD_LIGHT_BG: [number, number, number] = [236, 253, 245]; // #ecfdf5
const SLATE_TEXT: [number, number, number] = [30, 41, 59]; // #1e293b
const SLATE_MUTED: [number, number, number] = [100, 116, 139]; // #64748b
const BORDER_COLOR: [number, number, number] = [203, 213, 225]; // #cbd5e1

export function buildComprehensiveManualPdfDoc(branding?: ManualPdfBranding): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 18;
  const contentWidth = pageWidth - marginX * 2;
  const topMargin = 22;
  const bottomMargin = 20;

  const appName = branding?.appName || 'SPI SMART';
  const appTagline = branding?.appTagline || 'BUMD';
  const institution =
    branding?.institutionName || 'Perumda Air Minum Tirta Saiyo Kabupaten Pasaman';
  const shortInstitution =
    branding?.shortInstitutionName || 'Perumda Tirta Saiyo Pasaman';
  const todayFormatted = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  let cursorY = topMargin;

  const ensureSpace = (neededHeight: number) => {
    if (cursorY + neededHeight > pageHeight - bottomMargin) {
      doc.addPage();
      cursorY = topMargin;
    }
  };

  const writeWrappedParagraph = (
    text: string,
    fontSize = 9.5,
    fontStyle: 'normal' | 'bold' | 'italic' = 'normal',
    color: [number, number, number] = SLATE_TEXT,
    indentX = 0,
    lineSpacing = 4.6
  ) => {
    doc.setFont('helvetica', fontStyle);
    doc.setFontSize(fontSize);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, contentWidth - indentX) as string[];
    lines.forEach((line) => {
      ensureSpace(lineSpacing + 1);
      doc.text(line, marginX + indentX, cursorY);
      cursorY += lineSpacing;
    });
    cursorY += 1.5;
  };

  // ============================================================================
  // 1. COVER PAGE (Halaman Sampul)
  // ============================================================================
  doc.setFillColor(...EMERALD_DARK);
  doc.rect(0, 0, pageWidth, 82, 'F');

  doc.setFillColor(...EMERALD_PRIMARY);
  doc.rect(0, 82, pageWidth, 4, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(167, 243, 208); // emerald-200
  doc.text('BUKU PANDUAN PENGGUNAAN APLIKASI (USER MANUAL BOOK)', marginX, 26);

  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  doc.text(`${appName} ${appTagline}`, marginX, 42);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11.5);
  doc.setTextColor(209, 250, 229);
  const instLines = doc.splitTextToSize(
    `Sistem Informasi Pengawasan Intern Berbasis Risiko · ${institution}`,
    contentWidth
  ) as string[];
  let coverInstY = 52;
  instLines.forEach((l) => {
    doc.text(l, marginX, coverInstY);
    coverInstY += 6;
  });

  // Main Cover Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(...BORDER_COLOR);
  doc.roundedRect(marginX, 102, contentWidth, 72, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...EMERALD_DARK);
  doc.text('PANDUAN LENGKAP & KOMPREHENSIF', marginX + 8, 116);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...SLATE_TEXT);
  const coverDesc = doc.splitTextToSize(
    'Dokumen ini menyajikan panduan operasional lengkap untuk seluruh modul aplikasi, mencakup pengaturan hak akses berbasis peran (RBAC), penggunaan multi-tahun anggaran, Pemilik Risiko, Register Risiko Matriks 5x5, RCSA, Self Assessment SPIP, Input RKA Manual (termasuk input manual Bidang/Kategori oleh Super User) yang terintegrasi ke PKPT, Pelaksanaan Audit (SPT, PKA, KKA, LHA & AI), Temuan 5C, Tindak Lanjut Rekomendasi, Audit Investigatif, Review Produk Hukum, serta Fitur Jabatan & Tanda Tangan Digital.',
    contentWidth - 16
  ) as string[];
  let cdY = 126;
  coverDesc.forEach((line) => {
    doc.text(line, marginX + 8, cdY);
    cdY += 5.2;
  });

  // Metadata Box at bottom of Cover
  autoTable(doc, {
    startY: 186,
    margin: { left: marginX, right: marginX },
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 3.5,
      textColor: SLATE_TEXT,
      lineColor: BORDER_COLOR,
    },
    headStyles: {
      fillColor: EMERALD_DARK,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    head: [['Informasi Dokumen', 'Keterangan']],
    body: [
      ['Nama Aplikasi', `${appName} (${appTagline}) - Sistem Pengawasan Intern`],
      ['Instansi / BUMD', institution],
      ['Cakupan Tahun', 'Multi-Tahun (Mendukung Tahun Berjalan & Tahun-Tahun Berikutnya)'],
      ['Sasaran Pembaca', 'Kepala SPI (Super User), Admin Sistem, Auditor, Direktur, Dewan Pengawas, Unit Kerja (Auditee)'],
      ['Tanggal Pembuatan', todayFormatted],
      ['Kontak / Alamat', `${branding?.address || 'Kabupaten Pasaman, Sumatera Barat'}${branding?.email ? ` · ${branding.email}` : ''}`],
    ],
  });

  // ============================================================================
  // 2. DAFTAR ISI (Table of Contents Page)
  // ============================================================================
  doc.addPage();
  cursorY = topMargin;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...EMERALD_DARK);
  doc.text('DAFTAR ISI', marginX, cursorY);
  cursorY += 3;
  doc.setDrawColor(...EMERALD_PRIMARY);
  doc.setLineWidth(0.8);
  doc.line(marginX, cursorY, marginX + 45, cursorY);
  cursorY += 8;

  autoTable(doc, {
    startY: cursorY,
    margin: { left: marginX, right: marginX },
    theme: 'striped',
    styles: {
      fontSize: 9,
      cellPadding: 3,
      textColor: SLATE_TEXT,
    },
    headStyles: {
      fillColor: EMERALD_PRIMARY,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    head: [['Bab', 'Judul Pembahasan', 'Ringkasan Cakupan']],
    body: MANUAL_BOOK_CHAPTERS.map((ch) => [ch.number, ch.title, ch.summary]),
    columnStyles: {
      0: { cellWidth: 20, fontStyle: 'bold' },
      1: { cellWidth: 65, fontStyle: 'bold' },
      2: { cellWidth: 'auto' },
    },
  });

  // ============================================================================
  // 3. CHAPTERS (BAB I - BAB X)
  // ============================================================================
  MANUAL_BOOK_CHAPTERS.forEach((chapter) => {
    doc.addPage();
    cursorY = topMargin;

    // Chapter Banner
    doc.setFillColor(...EMERALD_LIGHT_BG);
    doc.setDrawColor(...EMERALD_PRIMARY);
    doc.setLineWidth(0.4);
    doc.roundedRect(marginX, cursorY - 5, contentWidth, 20, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...EMERALD_PRIMARY);
    doc.text(chapter.number, marginX + 4, cursorY + 1);

    doc.setFontSize(12.5);
    doc.setTextColor(...EMERALD_DARK);
    const chTitleLines = doc.splitTextToSize(chapter.title, contentWidth - 8) as string[];
    doc.text(chTitleLines[0], marginX + 4, cursorY + 8);
    if (chTitleLines[1]) {
      doc.text(chTitleLines[1], marginX + 4, cursorY + 13);
    }

    cursorY += 21;

    writeWrappedParagraph(chapter.summary, 9.5, 'italic', SLATE_MUTED, 0, 4.5);
    cursorY += 2;

    chapter.subsections.forEach((sub) => {
      ensureSpace(16);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.8);
      doc.setTextColor(...EMERALD_DARK);
      const subLines = doc.splitTextToSize(sub.title, contentWidth) as string[];
      subLines.forEach((l) => {
        ensureSpace(6);
        doc.text(l, marginX, cursorY);
        cursorY += 5.2;
      });
      cursorY += 1;

      sub.paragraphs.forEach((p) => {
        writeWrappedParagraph(p, 9.5, 'normal', SLATE_TEXT, 0, 4.6);
      });

      if (sub.bullets && sub.bullets.length > 0) {
        sub.bullets.forEach((b) => {
          const colonIdx = b.indexOf(':');
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9.3);
          doc.setTextColor(...SLATE_TEXT);

          const bulletLines = doc.splitTextToSize(b, contentWidth - 6) as string[];
          bulletLines.forEach((line, idx) => {
            ensureSpace(5);
            if (idx === 0) {
              doc.setFont('helvetica', 'bold');
              doc.setTextColor(...EMERALD_PRIMARY);
              doc.text('•', marginX + 1.5, cursorY);
              doc.setFont('helvetica', 'normal');
              doc.setTextColor(...SLATE_TEXT);
            }
            if (idx === 0 && colonIdx > 0 && colonIdx < 55) {
              const prefix = line.slice(0, colonIdx + 1);
              const rest = line.slice(colonIdx + 1);
              if (b.startsWith(prefix)) {
                doc.setFont('helvetica', 'bold');
                doc.text(prefix, marginX + 5.5, cursorY);
                const prefixW = doc.getTextWidth(prefix);
                doc.setFont('helvetica', 'normal');
                doc.text(rest, marginX + 5.5 + prefixW, cursorY);
              } else {
                doc.text(line, marginX + 5.5, cursorY);
              }
            } else {
              doc.text(line, marginX + 5.5, cursorY);
            }
            cursorY += 4.5;
          });
          cursorY += 1;
        });
      }

      if (sub.callout) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const calloutLines = doc.splitTextToSize(sub.callout.text, contentWidth - 10) as string[];
        const boxHeight = 10 + calloutLines.length * 4.4;
        ensureSpace(boxHeight + 4);

        doc.setFillColor(...EMERALD_LIGHT_BG);
        doc.setDrawColor(...EMERALD_PRIMARY);
        doc.setLineWidth(0.35);
        doc.roundedRect(marginX, cursorY, contentWidth, boxHeight, 2, 2, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.3);
        doc.setTextColor(...EMERALD_DARK);
        doc.text(sub.callout.title, marginX + 4, cursorY + 5.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...SLATE_TEXT);
        let cy = cursorY + 10.5;
        calloutLines.forEach((l) => {
          doc.text(l, marginX + 4, cy);
          cy += 4.4;
        });

        cursorY += boxHeight + 4;
      }

      if (sub.table) {
        ensureSpace(26);
        if (sub.table.caption) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.8);
          doc.setTextColor(...SLATE_MUTED);
          doc.text(sub.table.caption, marginX, cursorY + 1);
          cursorY += 4;
        }

        autoTable(doc, {
          startY: cursorY,
          margin: { left: marginX, right: marginX, top: topMargin, bottom: bottomMargin },
          theme: 'grid',
          styles: {
            fontSize: 8.4,
            cellPadding: 2.6,
            textColor: SLATE_TEXT,
            lineColor: BORDER_COLOR,
            valign: 'top',
          },
          headStyles: {
            fillColor: EMERALD_DARK,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252],
          },
          head: [sub.table.headers],
          body: sub.table.rows,
        });

        cursorY = ((doc as any).lastAutoTable?.finalY ?? cursorY + 20) + 6;
      }

      cursorY += 2.5;
    });
  });

  // ============================================================================
  // 4. RUNNING HEADER & FOOTER ON ALL CONTENT PAGES (PAGE >= 2)
  // ============================================================================
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    if (i > 1) {
      // Top running header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...EMERALD_PRIMARY);
      doc.text(`MANUAL BOOK ${appName} — ${shortInstitution}`, marginX, 12);

      doc.setDrawColor(...BORDER_COLOR);
      doc.setLineWidth(0.25);
      doc.line(marginX, 14.5, pageWidth - marginX, 14.5);
    }

    // Bottom footer
    doc.setDrawColor(...BORDER_COLOR);
    doc.setLineWidth(0.25);
    doc.line(marginX, pageHeight - 13, pageWidth - marginX, pageHeight - 13);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...SLATE_MUTED);
    doc.text(
      `Panduan Resmi Penggunaan Aplikasi ${appName} · ${todayFormatted}`,
      marginX,
      pageHeight - 8.5
    );
    doc.text(`Halaman ${i} dari ${totalPages}`, pageWidth - marginX, pageHeight - 8.5, {
      align: 'right',
    });
  }

  return doc;
}

export function downloadComprehensiveManualPdf(branding?: ManualPdfBranding): string {
  const doc = buildComprehensiveManualPdfDoc(branding);
  const slug = (branding?.appName || 'SPI_SMART').replace(/[^a-zA-Z0-9]+/g, '_');
  const filename = `Manual_Book_Lengkap_${slug}.pdf`;
  doc.save(filename);
  return filename;
}
