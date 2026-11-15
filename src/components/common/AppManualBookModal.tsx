import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  BookOpen,
  Download,
  X,
  Search,
  ChevronRight,
  ChevronLeft,
  Info,
  CheckCircle2,
  FileDown,
  Layers,
} from 'lucide-react';
import { MANUAL_BOOK_CHAPTERS, ManualChapter } from '../../lib/manualBookData';
import { downloadComprehensiveManualPdf } from '../../lib/appManualPdfGenerator';
import { useAppBranding } from '../../context/AppBrandingContext';

interface AppManualBookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppManualBookModal: React.FC<AppManualBookModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { branding } = useAppBranding();
  const [activeChapterId, setActiveChapterId] = useState<string>(
    MANUAL_BOOK_CHAPTERS[0]?.id || 'bab-1'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const filteredChapters = useMemo<ManualChapter[]>(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return MANUAL_BOOK_CHAPTERS;
    return MANUAL_BOOK_CHAPTERS.filter((ch) => {
      if (
        ch.number.toLowerCase().includes(q) ||
        ch.title.toLowerCase().includes(q) ||
        ch.summary.toLowerCase().includes(q)
      ) {
        return true;
      }
      return ch.subsections.some((sub) => {
        if (sub.title.toLowerCase().includes(q)) return true;
        if (sub.paragraphs.some((p) => p.toLowerCase().includes(q))) return true;
        if (sub.bullets?.some((b) => b.toLowerCase().includes(q))) return true;
        if (
          sub.callout &&
          (sub.callout.title.toLowerCase().includes(q) ||
            sub.callout.text.toLowerCase().includes(q))
        ) {
          return true;
        }
        if (
          sub.table &&
          (sub.table.headers.some((h) => h.toLowerCase().includes(q)) ||
            sub.table.rows.some((r) => r.some((c) => c.toLowerCase().includes(q))))
        ) {
          return true;
        }
        return false;
      });
    });
  }, [searchQuery]);

  const activeChapter = useMemo(() => {
    return (
      filteredChapters.find((c) => c.id === activeChapterId) ||
      filteredChapters[0] ||
      MANUAL_BOOK_CHAPTERS[0]
    );
  }, [filteredChapters, activeChapterId]);

  const activeChapterIndex = useMemo(() => {
    return MANUAL_BOOK_CHAPTERS.findIndex((c) => c.id === activeChapter?.id);
  }, [activeChapter]);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeChapter?.id]);

  if (!isOpen) return null;

  const handleDownloadPdf = () => {
    try {
      setIsGenerating(true);
      const filename = downloadComprehensiveManualPdf({
        appName: branding.appName,
        appTagline: branding.appTagline,
        institutionName: branding.institutionName,
        shortInstitutionName: branding.shortInstitutionName,
        address: branding.address,
        phone: branding.phone,
        email: branding.email,
        website: branding.website,
      });
      setDownloadNotice(`File PDF berhasil dibuat dan diunduh: ${filename}`);
      setTimeout(() => setDownloadNotice(null), 6000);
    } catch (err) {
      console.error('Gagal membuat PDF manual book:', err);
      setDownloadNotice('Terjadi kendala saat membuat PDF. Silakan gunakan tautan PDF statis di panel kiri.');
    } finally {
      setIsGenerating(false);
    }
  };

  const renderBulletText = (text: string) => {
    const colonIdx = text.indexOf(':');
    if (colonIdx > 0 && colonIdx < 55) {
      const prefix = text.slice(0, colonIdx + 1);
      const rest = text.slice(colonIdx + 1);
      return (
        <>
          <strong className="font-bold text-slate-900">{prefix}</strong>
          <span>{rest}</span>
        </>
      );
    }
    return <span>{text}</span>;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col h-[92vh] max-h-[92vh] border border-emerald-900/20">
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-[#0a2f1c] via-[#0d3824] to-[#072114] text-white px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-emerald-950/40 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-800 text-emerald-200 rounded">
                  Panduan Lengkap & Komprehensif
                </span>
                <span className="text-[11px] text-emerald-300 font-mono">
                  10 Bab · Semua Peran
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-extrabold text-white tracking-tight mt-0.5 truncate">
                Buku Panduan Penggunaan Aplikasi ({branding.appName || 'SPI SMART'})
              </h2>
              <p className="text-[11px] text-emerald-300/80 truncate">
                {branding.institutionName || 'Perumda Air Minum Tirta Saiyo Kabupaten Pasaman'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-extrabold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-60 rounded-lg shadow-sm transition-colors cursor-pointer"
              title="Buat dan unduh Manual Book lengkap (Bab I - X) dalam format file PDF (.pdf)"
            >
              <Download className="w-4 h-4" />
              <span>{isGenerating ? 'Memproses PDF...' : 'Unduh File PDF (.pdf)'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              title="Tutup Manual Book"
              aria-label="Tutup Manual Book"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Download Notification Banner */}
        {downloadNotice && (
          <div className="px-5 py-2.5 bg-emerald-50 border-b border-emerald-200 flex items-center justify-between gap-2 text-xs text-emerald-900 shrink-0">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{downloadNotice}</span>
            </div>
            <button
              onClick={() => setDownloadNotice(null)}
              className="text-emerald-700 hover:text-emerald-950 font-bold"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Main Body: Left TOC Sidebar + Right Chapter Content */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden bg-slate-50">
          {/* Left TOC Sidebar */}
          <aside className="w-full md:w-72 lg:w-80 bg-slate-100/95 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col shrink-0 max-h-56 md:max-h-none">
            {/* Search Input */}
            <div className="p-3 border-b border-slate-200 bg-white/60">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari bab atau kata kunci..."
                  className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    title="Hapus pencarian"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Chapter List */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-1">
              <div className="px-2 pb-1 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Daftar Isi ({filteredChapters.length} Bab)
                </span>
              </div>

              {filteredChapters.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  Tidak ditemukan topik untuk &ldquo;{searchQuery}&rdquo;.
                </div>
              ) : (
                filteredChapters.map((ch) => {
                  const isActive = activeChapter?.id === ch.id;
                  return (
                    <button
                      key={ch.id}
                      onClick={() => setActiveChapterId(ch.id)}
                      className={`w-full text-left px-3 py-2 rounded-xl transition-all flex items-start justify-between gap-2 cursor-pointer ${
                        isActive
                          ? 'bg-emerald-800 text-white shadow-sm'
                          : 'text-slate-700 hover:bg-slate-200/80 hover:text-slate-900'
                      }`}
                    >
                      <div className="min-w-0">
                        <span
                          className={`block text-[10px] font-extrabold uppercase tracking-wider ${
                            isActive ? 'text-amber-300' : 'text-emerald-700'
                          }`}
                        >
                          {ch.number}
                        </span>
                        <span className="block text-xs font-semibold leading-snug line-clamp-2">
                          {ch.title}
                        </span>
                      </div>
                      {isActive && (
                        <ChevronRight className="w-4 h-4 shrink-0 mt-1 text-emerald-200" />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Static PDF Direct Download Fallback Card */}
            <div className="hidden md:block p-3 border-t border-slate-200 bg-emerald-50/70 space-y-2">
              <div className="flex items-start gap-2">
                <Layers className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div className="text-[11px] text-slate-700 leading-snug">
                  <p className="font-bold text-emerald-950">Versi Dokumen PDF Siap Cetak</p>
                  <p className="text-slate-600 mt-0.5">
                    Mencakup sampul, daftar isi, matriks peran, rumus PKPT, dan seluruh alur kerja.
                  </p>
                </div>
              </div>
              <a
                href="/docs/Manual_Book_Lengkap_SPI_SMART.pdf"
                download="Manual_Book_Lengkap_SPI_SMART.pdf"
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-emerald-900 bg-white hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors"
              >
                <FileDown className="w-3.5 h-3.5 text-emerald-700" />
                <span>Unduh PDF Standar (.pdf)</span>
              </a>
            </div>
          </aside>

          {/* Right Chapter Reader */}
          <div ref={contentRef} className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-white">
            {activeChapter && (
              <div className="max-w-3xl mx-auto space-y-6">
                {/* Chapter Hero Card */}
                <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-200 p-5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider bg-emerald-800 text-white rounded-md">
                      {activeChapter.number}
                    </span>
                    <span className="text-xs font-medium text-emerald-800">
                      Panduan Operasional Modul
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                    {activeChapter.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                    {activeChapter.summary}
                  </p>
                </div>

                {/* Subsections */}
                <div className="space-y-6">
                  {activeChapter.subsections.map((sub) => (
                    <section
                      key={sub.title}
                      className="rounded-xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs space-y-3"
                    >
                      <h4 className="text-sm sm:text-base font-bold text-emerald-950 border-b border-slate-100 pb-2">
                        {sub.title}
                      </h4>

                      {sub.paragraphs.map((p, idx) => (
                        <p
                          key={idx}
                          className="text-xs sm:text-sm text-slate-700 leading-relaxed"
                        >
                          {p}
                        </p>
                      ))}

                      {sub.bullets && sub.bullets.length > 0 && (
                        <ul className="space-y-2 pt-1">
                          {sub.bullets.map((b, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 leading-relaxed"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0 mt-2" />
                              <div>{renderBulletText(b)}</div>
                            </li>
                          ))}
                        </ul>
                      )}

                      {sub.callout && (
                        <div className="rounded-xl bg-emerald-50/90 border border-emerald-200 p-3.5 flex items-start gap-2.5">
                          <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                          <div className="text-xs sm:text-sm">
                            <p className="font-bold text-emerald-950">{sub.callout.title}</p>
                            <p className="text-emerald-900/90 mt-0.5 leading-relaxed">
                              {sub.callout.text}
                            </p>
                          </div>
                        </div>
                      )}

                      {sub.table && (
                        <div className="pt-1 space-y-1.5">
                          {sub.table.caption && (
                            <p className="text-[11px] font-bold text-slate-500">
                              {sub.table.caption}
                            </p>
                          )}
                          <div className="overflow-x-auto rounded-xl border border-slate-200">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="bg-[#0a2f1c] text-white">
                                  {sub.table.headers.map((h) => (
                                    <th
                                      key={h}
                                      className="px-3 py-2.5 font-bold border-b border-emerald-900 whitespace-nowrap"
                                    >
                                      {h}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200">
                                {sub.table.rows.map((row, rIdx) => (
                                  <tr
                                    key={rIdx}
                                    className={
                                      rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/80'
                                    }
                                  >
                                    {row.map((cell, cIdx) => (
                                      <td
                                        key={cIdx}
                                        className={`px-3 py-2.5 align-top leading-relaxed ${
                                          cIdx === 0
                                            ? 'font-semibold text-slate-900'
                                            : 'text-slate-700'
                                        }`}
                                      >
                                        {cell}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </section>
                  ))}
                </div>

                {/* Bottom Prev/Next Chapter Controls */}
                <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
                  <button
                    onClick={() => {
                      if (activeChapterIndex > 0) {
                        setActiveChapterId(MANUAL_BOOK_CHAPTERS[activeChapterIndex - 1].id);
                      }
                    }}
                    disabled={activeChapterIndex <= 0}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Bab Sebelumnya</span>
                  </button>

                  <span className="text-[11px] font-semibold text-slate-500">
                    {activeChapterIndex + 1} dari {MANUAL_BOOK_CHAPTERS.length} Bab
                  </span>

                  <button
                    onClick={() => {
                      if (activeChapterIndex < MANUAL_BOOK_CHAPTERS.length - 1) {
                        setActiveChapterId(MANUAL_BOOK_CHAPTERS[activeChapterIndex + 1].id);
                      }
                    }}
                    disabled={activeChapterIndex >= MANUAL_BOOK_CHAPTERS.length - 1}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer"
                  >
                    <span>Bab Berikutnya</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
