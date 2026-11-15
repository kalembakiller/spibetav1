import {
  collection,
  doc,
  getDocs,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';

export interface BackupCollectionMeta {
  key: string;
  label: string;
  description: string;
}

export const BACKUP_COLLECTIONS: BackupCollectionMeta[] = [
  {
    key: 'users',
    label: 'Pengguna & Akun RBAC',
    description: 'Daftar akun, peran pengguna, status persetujuan, dan unit kerja',
  },
  {
    key: 'units',
    label: 'Master Unit & Pemilik Risiko',
    description: 'Unit kerja, bidang operasional, kepala unit, dan wilayah pelayanan',
  },
  {
    key: 'risk_registers',
    label: 'Register Risiko Korporat (5x5)',
    description: 'Identifikasi risiko, analisis akar masalah, skor inheren/residual & mitigasi',
  },
  {
    key: 'rcsa_assessments',
    label: 'Penilaian Risiko & Kontrol (RCSA)',
    description: 'Lembar penilaian mandiri unit kerja dan reviu efektivitas kontrol SPI',
  },
  {
    key: 'bpkp_assessments',
    label: 'Self Assessment SPIP Terpadu',
    description: 'Indikator kinerja BUMD & maturitas 5 unsur SPIP lintas tahun',
  },
  {
    key: 'rka_items',
    label: 'Input RKA Manual',
    description: 'Data Rencana Kerja & Anggaran, pagu, realisasi, dan prioritas strategis',
  },
  {
    key: 'rka_categories',
    label: 'Bidang / Kategori Program RKA',
    description: 'Daftar bidang atau kategori program RKA yang diinput manual Super User',
  },
  {
    key: 'pkpt',
    label: 'Penyusunan PKPT',
    description: 'Program Kerja Pengawasan Tahunan beserta skor prioritas risiko + RKA',
  },
  {
    key: 'spi_programs',
    label: 'Program Tahunan Kapabilitas SPI',
    description: 'Program kerja non-audit untuk penguatan kapabilitas internal SPI',
  },
  {
    key: 'audit_assignments',
    label: 'Surat Perintah Tugas (SPT)',
    description: 'Penugasan tim pemeriksa, dasar audit, ruang lingkup, dan jadwal',
  },
  {
    key: 'audit_programs',
    label: 'Program Kerja Audit (PKA)',
    description: 'Langkah kerja pemeriksaan, metode uji, sampel, dan pelaksana',
  },
  {
    key: 'work_papers',
    label: 'Kertas Kerja Audit (KKA)',
    description: 'Dokumentasi pengujian substantif, bukti, dan hasil reviu berjenjang',
  },
  {
    key: 'audit_reports',
    label: 'Laporan Hasil Audit (LHA)',
    description: 'Naskah LHA, ringkasan eksekutif, kesimpulan, dan status pengesahan',
  },
  {
    key: 'findings',
    label: 'Temuan Audit (5C)',
    description: 'Matriks temuan Condition, Criteria, Cause, Consequence & potensi kerugian',
  },
  {
    key: 'recommendations',
    label: 'Rekomendasi Audit',
    description: 'Daftar rekomendasi perbaikan, PIC unit kerja, target, dan status',
  },
  {
    key: 'follow_ups',
    label: 'Tindak Lanjut Rekomendasi',
    description: 'Laporan progres aksi unit kerja, tautan link bukti, dan verifikasi SPI',
  },
  {
    key: 'investigations',
    label: 'Audit Investigatif & Fraud',
    description: 'Catatan kasus rahasia, kronologi, modus, dan progres penelaahan',
  },
  {
    key: 'regulations',
    label: 'Basis Data Peraturan & Hukum',
    description: 'Inventaris produk hukum, SOP, dan hasil review klausul kepatuhan',
  },
  {
    key: 'signatories',
    label: 'Pejabat Penandatangan & TTD Digital',
    description: 'Data jabatan, NIP, tanda tangan kanvas/upload, dan stempel QR',
  },
  {
    key: 'app_settings',
    label: 'Logo, Identitas & Pengaturan Aplikasi',
    description: 'Konfigurasi nama aplikasi, nama instansi, alamat, dan logo kantor',
  },
];

export type BackupImportMode = 'MERGE' | 'REPLACE';

export interface DatabaseBackupPayload {
  metadata: {
    format: 'SPI_SMART_FIRESTORE_BACKUP';
    version: string;
    exportedAt: string;
    exportedBy: string;
    appName?: string;
    institutionName?: string;
    totalCollections: number;
    totalDocuments: number;
    collectionCounts: Record<string, number>;
  };
  collections: Record<string, Record<string, Record<string, unknown>>>;
}

export interface BackupProgressInfo {
  currentCollection: string;
  currentCollectionLabel: string;
  completedCollections: number;
  totalCollections: number;
  processedDocs: number;
}

export interface ExportDatabaseResult {
  filename: string;
  totalCollections: number;
  totalDocuments: number;
  collectionCounts: Record<string, number>;
}

export interface ImportDatabaseResult {
  totalCollections: number;
  totalWrittenDocuments: number;
  totalDeletedDocuments: number;
  collectionCounts: Record<string, number>;
}

function serializeFirestoreValue(val: unknown): unknown {
  if (val === undefined) return null;
  if (val === null) return null;
  if (val instanceof Timestamp) {
    return { __firestoreTimestamp: val.toDate().toISOString() };
  }
  if (Array.isArray(val)) {
    return val.map((item) => serializeFirestoreValue(item));
  }
  if (typeof val === 'object') {
    const obj = val as Record<string, unknown>;
    if (typeof obj.toDate === 'function' && typeof obj.seconds === 'number') {
      try {
        return { __firestoreTimestamp: (obj.toDate as () => Date)().toISOString() };
      } catch {
        return String(obj);
      }
    }
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v !== undefined) {
        clean[k] = serializeFirestoreValue(v);
      }
    }
    return clean;
  }
  return val;
}

function deserializeFirestoreValue(val: unknown): unknown {
  if (val === undefined) return null;
  if (val === null) return null;
  if (Array.isArray(val)) {
    return val.map((item) => deserializeFirestoreValue(item));
  }
  if (typeof val === 'object') {
    const obj = val as Record<string, unknown>;
    if (
      typeof obj.__firestoreTimestamp === 'string' &&
      Object.keys(obj).length === 1
    ) {
      const parsedDate = new Date(obj.__firestoreTimestamp);
      if (!isNaN(parsedDate.getTime())) {
        return Timestamp.fromDate(parsedDate);
      }
    }
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v !== undefined) {
        clean[k] = deserializeFirestoreValue(v);
      }
    }
    return clean;
  }
  return val;
}

export async function exportDatabaseToJson(options: {
  selectedCollections: string[];
  exportedBy: string;
  appName?: string;
  institutionName?: string;
  onProgress?: (info: BackupProgressInfo) => void;
}): Promise<ExportDatabaseResult> {
  const { selectedCollections, exportedBy, appName, institutionName, onProgress } = options;
  const collectionsData: Record<string, Record<string, Record<string, unknown>>> = {};
  const collectionCounts: Record<string, number> = {};
  let totalDocuments = 0;

  for (let i = 0; i < selectedCollections.length; i++) {
    const colKey = selectedCollections[i];
    const meta = BACKUP_COLLECTIONS.find((c) => c.key === colKey);
    onProgress?.({
      currentCollection: colKey,
      currentCollectionLabel: meta?.label || colKey,
      completedCollections: i,
      totalCollections: selectedCollections.length,
      processedDocs: totalDocuments,
    });

    try {
      const snap = await getDocs(collection(db, colKey));
      const docsMap: Record<string, Record<string, unknown>> = {};
      snap.docs.forEach((d) => {
        docsMap[d.id] = serializeFirestoreValue(d.data()) as Record<string, unknown>;
      });
      collectionsData[colKey] = docsMap;
      collectionCounts[colKey] = snap.docs.length;
      totalDocuments += snap.docs.length;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, colKey);
    }
  }

  onProgress?.({
    currentCollection: '',
    currentCollectionLabel: 'Menyiapkan file JSON...',
    completedCollections: selectedCollections.length,
    totalCollections: selectedCollections.length,
    processedDocs: totalDocuments,
  });

  const payload: DatabaseBackupPayload = {
    metadata: {
      format: 'SPI_SMART_FIRESTORE_BACKUP',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      exportedBy,
      appName: appName || 'SPI SMART',
      institutionName: institutionName || '',
      totalCollections: selectedCollections.length,
      totalDocuments,
      collectionCounts,
    },
    collections: collectionsData,
  };

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(
    now.getHours()
  )}${pad(now.getMinutes())}`;
  const slug = (appName || 'SPI_SMART').replace(/[^a-zA-Z0-9]+/g, '_');
  const filename = `Backup_Database_${slug}_${stamp}.json`;

  const jsonString = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return {
    filename,
    totalCollections: selectedCollections.length,
    totalDocuments,
    collectionCounts,
  };
}

export async function parseDatabaseBackupFile(file: File): Promise<DatabaseBackupPayload> {
  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('File bukan format JSON yang valid. Pastikan Anda memilih file backup .json.');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Struktur file backup tidak valid.');
  }

  const candidate = parsed as Partial<DatabaseBackupPayload>;
  if (!candidate.collections || typeof candidate.collections !== 'object') {
    throw new Error('File JSON tidak memiliki objek "collections" yang valid.');
  }

  const recognizedKeys = new Set(BACKUP_COLLECTIONS.map((c) => c.key));
  const sanitizedCollections: Record<string, Record<string, Record<string, unknown>>> = {};
  const collectionCounts: Record<string, number> = {};
  let totalDocuments = 0;

  for (const [colKey, docsObj] of Object.entries(candidate.collections)) {
    if (!recognizedKeys.has(colKey)) continue;
    if (!docsObj || typeof docsObj !== 'object' || Array.isArray(docsObj)) continue;

    const validDocs: Record<string, Record<string, unknown>> = {};
    for (const [docId, docData] of Object.entries(docsObj)) {
      if (docId && docData && typeof docData === 'object' && !Array.isArray(docData)) {
        validDocs[docId] = docData as Record<string, unknown>;
      }
    }
    sanitizedCollections[colKey] = validDocs;
    const count = Object.keys(validDocs).length;
    collectionCounts[colKey] = count;
    totalDocuments += count;
  }

  const colKeys = Object.keys(sanitizedCollections);
  if (colKeys.length === 0) {
    throw new Error(
      'Tidak ditemukan koleksi database aplikasi yang dikenali di dalam file JSON ini.'
    );
  }

  return {
    metadata: {
      format: 'SPI_SMART_FIRESTORE_BACKUP',
      version: candidate.metadata?.version || '1.0',
      exportedAt: candidate.metadata?.exportedAt || '',
      exportedBy: candidate.metadata?.exportedBy || 'Tidak diketahui',
      appName: candidate.metadata?.appName || 'SPI SMART',
      institutionName: candidate.metadata?.institutionName || '',
      totalCollections: colKeys.length,
      totalDocuments,
      collectionCounts,
    },
    collections: sanitizedCollections,
  };
}

export async function importDatabaseFromBackup(options: {
  backup: DatabaseBackupPayload;
  selectedCollections: string[];
  mode: BackupImportMode;
  currentUserUid?: string;
  onProgress?: (info: BackupProgressInfo) => void;
}): Promise<ImportDatabaseResult> {
  const { backup, selectedCollections, mode, currentUserUid, onProgress } = options;

  let totalWrittenDocuments = 0;
  let totalDeletedDocuments = 0;
  const collectionCounts: Record<string, number> = {};

  const BATCH_LIMIT = 350;

  for (let i = 0; i < selectedCollections.length; i++) {
    const colKey = selectedCollections[i];
    const meta = BACKUP_COLLECTIONS.find((c) => c.key === colKey);
    const docsMap = backup.collections[colKey] || {};
    const entries = Object.entries(docsMap);

    onProgress?.({
      currentCollection: colKey,
      currentCollectionLabel: meta?.label || colKey,
      completedCollections: i,
      totalCollections: selectedCollections.length,
      processedDocs: totalWrittenDocuments,
    });

    // If REPLACE mode, delete existing documents in this collection first
    // Safety guard: never delete superman_root or the currently signed-in super user account
    if (mode === 'REPLACE') {
      try {
        const existingSnap = await getDocs(collection(db, colKey));
        const docsToDelete = existingSnap.docs.filter((d) => {
          if (colKey === 'users') {
            if (d.id === 'superman_root') return false;
            if (currentUserUid && d.id === currentUserUid) return false;
          }
          return true;
        });

        for (let idx = 0; idx < docsToDelete.length; idx += BATCH_LIMIT) {
          const chunk = docsToDelete.slice(idx, idx + BATCH_LIMIT);
          const batch = writeBatch(db);
          chunk.forEach((docSnap) => {
            batch.delete(docSnap.ref);
          });
          await batch.commit();
          totalDeletedDocuments += chunk.length;
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, colKey);
      }
    }

    // Write backup documents in safe batch chunks
    try {
      for (let idx = 0; idx < entries.length; idx += BATCH_LIMIT) {
        const chunk = entries.slice(idx, idx + BATCH_LIMIT);
        const batch = writeBatch(db);
        chunk.forEach(([docId, rawData]) => {
          const restoredData = deserializeFirestoreValue(rawData) as Record<string, unknown>;
          const ref = doc(db, colKey, docId);
          if (mode === 'MERGE') {
            batch.set(ref, restoredData, { merge: true });
          } else {
            batch.set(ref, restoredData);
          }
        });
        await batch.commit();
        totalWrittenDocuments += chunk.length;
      }
      collectionCounts[colKey] = entries.length;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, colKey);
    }
  }

  onProgress?.({
    currentCollection: '',
    currentCollectionLabel: 'Impor database selesai.',
    completedCollections: selectedCollections.length,
    totalCollections: selectedCollections.length,
    processedDocs: totalWrittenDocuments,
  });

  return {
    totalCollections: selectedCollections.length,
    totalWrittenDocuments,
    totalDeletedDocuments,
    collectionCounts,
  };
}
