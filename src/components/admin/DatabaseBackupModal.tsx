import React, { useState, useEffect, useRef } from 'react';
import {
  Database,
  Download,
  Upload,
  X,
  CheckCircle2,
  AlertTriangle,
  Shield,
  FileJson,
  Loader2,
  CheckSquare,
  Square,
  RefreshCw,
} from 'lucide-react';
import {
  BACKUP_COLLECTIONS,
  BackupImportMode,
  BackupProgressInfo,
  DatabaseBackupPayload,
  ExportDatabaseResult,
  ImportDatabaseResult,
  exportDatabaseToJson,
  importDatabaseFromBackup,
  parseDatabaseBackupFile,
} from '../../lib/databaseBackup';
import { useAuth } from '../../context/AuthContext';
import { useAppBranding } from '../../context/AppBrandingContext';

interface DatabaseBackupModalProps {
  isOpen: boolean;
  initialTab?: 'export' | 'import';
  onClose: () => void;
}

export const DatabaseBackupModal: React.FC<DatabaseBackupModalProps> = ({
  isOpen,
  initialTab = 'export',
  onClose,
}) => {
  const { userProfile } = useAuth();
  const { branding } = useAppBranding();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSuperUser =
    userProfile?.role === 'KEPALA_SPI' || userProfile?.role === 'ADMIN_SISTEM';

  const [activeTab, setActiveTab] = useState<'export' | 'import'>(initialTab);

  // Export States
  const [exportSelected, setExportSelected] = useState<string[]>(() =>
    BACKUP_COLLECTIONS.map((c) => c.key)
  );
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<BackupProgressInfo | null>(null);
  const [exportResult, setExportResult] = useState<ExportDatabaseResult | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  // Import States
  const [parsedBackup, setParsedBackup] = useState<DatabaseBackupPayload | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [importSelected, setImportSelected] = useState<string[]>([]);
  const [importMode, setImportMode] = useState<BackupImportMode>('MERGE');
  const [confirmReplaceChecked, setConfirmReplaceChecked] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<BackupProgressInfo | null>(null);
  const [importResult, setImportResult] = useState<ImportDatabaseResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setExportError(null);
      setImportError(null);
    }
  }, [isOpen, initialTab]);

  if (!isOpen || !isSuperUser) return null;

  const toggleExportCollection = (key: string) => {
    setExportSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const toggleImportCollection = (key: string) => {
    setImportSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleRunExport = async () => {
    if (exportSelected.length === 0) {
      setExportError('Pilih minimal 1 koleksi data untuk diekspor.');
      return;
    }
    setIsExporting(true);
    setExportError(null);
    setExportResult(null);
    try {
      const res = await exportDatabaseToJson({
        selectedCollections: exportSelected,
        exportedBy: userProfile?.displayName || userProfile?.email || 'Super User',
        appName: branding.appName,
        institutionName: branding.institutionName,
        onProgress: setExportProgress,
      });
      setExportResult(res);
    } catch (err) {
      console.error('Export database error:', err);
      setExportError(
        err instanceof Error
          ? `Gagal mengekspor database: ${err.message}`
          : 'Terjadi kesalahan saat mengekspor database.'
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportResult(null);
    setParsedBackup(null);
    setSelectedFileName(file.name);
    setConfirmReplaceChecked(false);

    try {
      const parsed = await parseDatabaseBackupFile(file);
      setParsedBackup(parsed);
      setImportSelected(Object.keys(parsed.collections));
    } catch (err) {
      setImportError(
        err instanceof Error ? err.message : 'File backup gagal dibaca.'
      );
    }
  };

  const handleRunImport = async () => {
    if (!parsedBackup) return;
    if (importSelected.length === 0) {
      setImportError('Pilih minimal 1 koleksi untuk diimpor.');
      return;
    }
    if (importMode === 'REPLACE' && !confirmReplaceChecked) {
      setImportError(
        'Centang kotak konfirmasi terlebih dahulu sebelum menjalankan mode Timpa Penuh (Replace).'
      );
      return;
    }

    setIsImporting(true);
    setImportError(null);
    setImportResult(null);
    try {
      const res = await importDatabaseFromBackup({
        backup: parsedBackup,
        selectedCollections: importSelected,
        mode: importMode,
        currentUserUid: userProfile?.uid,
        onProgress: setImportProgress,
      });
      setImportResult(res);
    } catch (err) {
      console.error('Import database error:', err);
      setImportError(
        err instanceof Error
          ? `Gagal mengimpor database: ${err.message}`
          : 'Terjadi kesalahan saat memulihkan database.'
      );
    } finally {
      setIsImporting(false);
    }
  };

  const formatIsoDate = (iso?: string) => {
    if (!iso) return '-';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh] border border-emerald-900/20">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0a2f1c] via-[#0d3824] to-[#072114] text-white px-5 py-4 flex items-center justify-between gap-3 border-b border-emerald-950/40 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-amber-400 text-amber-950 rounded">
                  Khusus Super User
                </span>
                <span className="text-[11px] text-emerald-300 font-mono">
                  {BACKUP_COLLECTIONS.length} Koleksi Firestore
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-extrabold text-white tracking-tight mt-0.5 truncate">
                Ekspor & Impor Database Sistem ({branding.appName || 'SPI SMART'})
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isExporting || isImporting}
            className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 disabled:opacity-40 transition-colors cursor-pointer"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 pt-3 bg-slate-100 border-b border-slate-200 flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('export')}
            disabled={isExporting || isImporting}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl border-b-2 transition-colors cursor-pointer ${
              activeTab === 'export'
                ? 'bg-white text-emerald-900 border-emerald-700 shadow-2xs'
                : 'text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Download className="w-4 h-4 text-emerald-700" />
            <span>Ekspor Database (.json)</span>
          </button>

          <button
            onClick={() => setActiveTab('import')}
            disabled={isExporting || isImporting}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl border-b-2 transition-colors cursor-pointer ${
              activeTab === 'import'
                ? 'bg-white text-amber-950 border-amber-600 shadow-2xs'
                : 'text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Upload className="w-4 h-4 text-amber-700" />
            <span>Impor / Pulihkan Database (.json)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-white">
          {activeTab === 'export' ? (
            <>
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-950">
                <Shield className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Cadangan Lengkap Database Cloud Firestore</p>
                  <p className="text-emerald-800/90 mt-0.5 leading-relaxed">
                    Fitur ini mengunduh seluruh isi koleksi database (pengguna, unit pemilik risiko, register risiko 5x5, RCSA, SPIP, RKA, PKPT, SPT, PKA, KKA, LHA, temuan 5C, tindak lanjut, investigasi, regulasi, pejabat TTD, dan logo kantor) ke dalam satu file <strong>.json</strong> yang aman disimpan secara lokal.
                  </p>
                </div>
              </div>

              {/* Collection Selection Controls */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Pilih Koleksi untuk Diekspor ({exportSelected.length} / {BACKUP_COLLECTIONS.length})
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setExportSelected(BACKUP_COLLECTIONS.map((c) => c.key))}
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 cursor-pointer"
                    >
                      Pilih Semua
                    </button>
                    <button
                      type="button"
                      onClick={() => setExportSelected([])}
                      className="text-[11px] font-bold text-slate-600 hover:text-slate-900 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 cursor-pointer"
                    >
                      Kosongkan
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                  {BACKUP_COLLECTIONS.map((col) => {
                    const checked = exportSelected.includes(col.key);
                    return (
                      <button
                        key={col.key}
                        type="button"
                        onClick={() => toggleExportCollection(col.key)}
                        className={`text-left p-2.5 rounded-xl border transition-all flex items-start gap-2.5 cursor-pointer ${
                          checked
                            ? 'bg-emerald-50/70 border-emerald-300'
                            : 'bg-slate-50 border-slate-200 opacity-75 hover:opacity-100'
                        }`}
                      >
                        {checked ? (
                          <CheckSquare className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {col.label}
                          </p>
                          <p className="text-[10.5px] text-slate-500 line-clamp-1">
                            {col.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Export Progress */}
              {isExporting && exportProgress && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                      Membaca: {exportProgress.currentCollectionLabel}
                    </span>
                    <span className="font-mono">
                      {exportProgress.completedCollections} / {exportProgress.totalCollections}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 transition-all duration-200"
                      style={{
                        width: `${Math.round(
                          (exportProgress.completedCollections /
                            Math.max(1, exportProgress.totalCollections)) *
                            100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {exportError && (
                <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl flex items-start gap-2 text-xs text-rose-900 font-semibold">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{exportError}</span>
                </div>
              )}

              {exportResult && (
                <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-extrabold text-emerald-950">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Ekspor Database Berhasil!</span>
                  </div>
                  <p className="text-emerald-900">
                    File <strong className="font-mono">{exportResult.filename}</strong> berhasil diunduh berisi{' '}
                    <strong>{exportResult.totalDocuments}</strong> dokumen dari{' '}
                    <strong>{exportResult.totalCollections}</strong> koleksi.
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Import File Upload */}
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-950">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Pemulihan / Impor Data dari File Backup (.json)</p>
                  <p className="text-amber-900/90 mt-0.5 leading-relaxed">
                    Pilih file backup JSON hasil ekspor aplikasi ini. Gunakan mode <strong>Gabung & Perbarui (Merge)</strong> agar data yang sudah ada di Firebase tetap aman dan hanya diperbarui/ditambahkan.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImporting}
                  className="w-full p-5 border-2 border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/30 rounded-xl transition-colors flex flex-col items-center justify-center gap-2 text-center cursor-pointer"
                >
                  <FileJson className="w-8 h-8 text-emerald-700" />
                  <div>
                    <p className="text-xs font-extrabold text-slate-900">
                      {selectedFileName
                        ? `File Terpilih: ${selectedFileName}`
                        : 'Klik di sini untuk memilih file Backup Database (.json)'}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Format file JSON standar backup {branding.appName || 'SPI SMART'}
                    </p>
                  </div>
                </button>
              </div>

              {/* Parsed Backup Preview */}
              {parsedBackup && (
                <div className="space-y-4">
                  {/* Metadata summary */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">
                        Tanggal Ekspor
                      </span>
                      <span className="font-bold text-slate-900">
                        {formatIsoDate(parsedBackup.metadata.exportedAt)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">
                        Diekspor Oleh
                      </span>
                      <span className="font-bold text-slate-900 truncate block">
                        {parsedBackup.metadata.exportedBy}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">
                        Jumlah Koleksi
                      </span>
                      <span className="font-bold text-emerald-800">
                        {parsedBackup.metadata.totalCollections} Koleksi
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">
                        Total Dokumen
                      </span>
                      <span className="font-bold text-emerald-800">
                        {parsedBackup.metadata.totalDocuments} Dokumen
                      </span>
                    </div>
                  </div>

                  {/* Select Collections to Restore */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        Koleksi yang Akan Diimpor ({importSelected.length} dipilih)
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setImportSelected(Object.keys(parsedBackup.collections))}
                          className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 px-2 py-1 rounded bg-emerald-50 cursor-pointer"
                        >
                          Pilih Semua
                        </button>
                        <button
                          type="button"
                          onClick={() => setImportSelected([])}
                          className="text-[11px] font-bold text-slate-600 hover:text-slate-900 px-2 py-1 rounded bg-slate-100 cursor-pointer"
                        >
                          Kosongkan
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                      {Object.keys(parsedBackup.collections).map((colKey) => {
                        const meta = BACKUP_COLLECTIONS.find((c) => c.key === colKey);
                        const count = parsedBackup.metadata.collectionCounts[colKey] || 0;
                        const checked = importSelected.includes(colKey);
                        return (
                          <button
                            key={colKey}
                            type="button"
                            onClick={() => toggleImportCollection(colKey)}
                            className={`text-left p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 cursor-pointer ${
                              checked
                                ? 'bg-emerald-50/70 border-emerald-300'
                                : 'bg-slate-50 border-slate-200 opacity-70'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {checked ? (
                                <CheckSquare className="w-4 h-4 text-emerald-700 shrink-0" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-400 shrink-0" />
                              )}
                              <span className="text-xs font-bold text-slate-900 truncate">
                                {meta?.label || colKey}
                              </span>
                            </div>
                            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-white border border-slate-200 rounded text-slate-700 shrink-0">
                              {count} dok
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Import Mode Selector */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-800 block">
                      Mode Penulisan ke Firestore:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setImportMode('MERGE');
                          setConfirmReplaceChecked(false);
                        }}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          importMode === 'MERGE'
                            ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-emerald-950">
                            Gabung & Perbarui (Merge)
                          </span>
                          <span className="px-1.5 py-0.5 text-[9.5px] font-bold bg-emerald-700 text-white rounded">
                            Direkomendasikan
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                          Menambahkan data baru & memperbarui ID yang cocok tanpa menghapus data yang sudah ada.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setImportMode('REPLACE')}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          importMode === 'REPLACE'
                            ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-500/20'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-rose-950">
                            Timpa Penuh (Replace)
                          </span>
                          <span className="px-1.5 py-0.5 text-[9.5px] font-bold bg-rose-700 text-white rounded">
                            Hati-hati
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                          Menghapus data lama pada koleksi terpilih lalu menggantinya persis seperti isi file backup.
                        </p>
                      </button>
                    </div>

                    {importMode === 'REPLACE' && (
                      <label className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-950 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={confirmReplaceChecked}
                          onChange={(e) => setConfirmReplaceChecked(e.target.checked)}
                          className="mt-0.5 rounded border-rose-400 text-rose-700 focus:ring-rose-500"
                        />
                        <span className="font-semibold leading-snug">
                          Saya memahami bahwa seluruh dokumen lama pada {importSelected.length} koleksi terpilih akan dihapus dan diganti dengan isi file backup (akun root <code>superman_root</code> & akun aktif tetap dilindungi).
                        </span>
                      </label>
                    )}
                  </div>
                </div>
              )}

              {/* Import Progress */}
              {isImporting && importProgress && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
                      Memulihkan: {importProgress.currentCollectionLabel}
                    </span>
                    <span className="font-mono">
                      {importProgress.completedCollections} / {importProgress.totalCollections}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 transition-all duration-200"
                      style={{
                        width: `${Math.round(
                          (importProgress.completedCollections /
                            Math.max(1, importProgress.totalCollections)) *
                            100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {importError && (
                <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl flex items-start gap-2 text-xs text-rose-900 font-semibold">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{importError}</span>
                </div>
              )}

              {importResult && (
                <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl space-y-1.5 text-xs">
                  <div className="flex items-center gap-2 font-extrabold text-emerald-950">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Impor Database Berhasil!</span>
                  </div>
                  <p className="text-emerald-900">
                    Sebanyak <strong>{importResult.totalWrittenDocuments}</strong> dokumen pada{' '}
                    <strong>{importResult.totalCollections}</strong> koleksi berhasil dipulihkan ke Cloud Firestore.
                    {importResult.totalDeletedDocuments > 0 && (
                      <span>
                        {' '}
                        ({importResult.totalDeletedDocuments} dokumen lama telah diganti).
                      </span>
                    )}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting || isImporting}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg disabled:opacity-50 cursor-pointer"
          >
            Tutup
          </button>

          {activeTab === 'export' ? (
            <button
              type="button"
              onClick={handleRunExport}
              disabled={isExporting || exportSelected.length === 0}
              className="flex items-center gap-2 px-4 py-2 text-xs font-extrabold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mengekspor Database...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Ekspor & Unduh Database (.json)</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleRunImport}
              disabled={
                isImporting ||
                !parsedBackup ||
                importSelected.length === 0 ||
                (importMode === 'REPLACE' && !confirmReplaceChecked)
              }
              className="flex items-center gap-2 px-4 py-2 text-xs font-extrabold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mengimpor Database...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Jalankan Impor Database</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
