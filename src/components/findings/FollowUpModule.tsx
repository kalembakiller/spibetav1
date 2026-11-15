import React, { useState, useEffect, useMemo } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import {
  FileCheck2,
  CheckCircle2,
  Clock,
  AlertCircle,
  UploadCloud,
  ShieldCheck,
  Search,
  MessageSquare,
  XCircle,
  Printer,
  FileText,
  Building,
  Calendar,
  User,
  Eye,
  Check,
  TrendingUp,
  Image as ImageIcon,
  ExternalLink,
  Trash2,
  ShieldAlert,
  Link2,
  Loader2,
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { Recommendation, FollowUp, RecommendationStatus } from '../../types/audit';
import { useAuth } from '../../context/AuthContext';
import { DocumentPrintPreviewModal } from '../common/DocumentPrintPreviewModal';

interface FollowUpModuleProps {
  initialFindingId?: string;
}

export const FollowUpModule: React.FC<FollowUpModuleProps> = ({ initialFindingId }) => {
  const { userProfile, hasRole } = useAuth();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [searchTerm, setSearchTerm] = useState(initialFindingId || '');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedUnit, setSelectedUnit] = useState<string>('ALL');

  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [activeRec, setActiveRec] = useState<Recommendation | null>(null);

  // Preview evidence modal
  const [previewEvidenceUrl, setPreviewEvidenceUrl] = useState<string | null>(null);
  const [previewEvidenceTitle, setPreviewEvidenceTitle] = useState<string>('');

  // Submit action states (Auditee) - link only
  const [responseNotes, setResponseNotes] = useState('');
  const [actionSteps, setActionSteps] = useState('');
  const [progressPercent, setProgressPercent] = useState<number>(100);
  const [actionDate, setActionDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [picName, setPicName] = useState('');
  const [evidenceFileName, setEvidenceFileName] = useState('');
  const [evidenceFileUrl, setEvidenceFileUrl] = useState('');

  // Deletion modals (Superuser)
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{ fu: FollowUp; rec: Recommendation } | null>(null);
  const [deleteRecModal, setDeleteRecModal] = useState<Recommendation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Verify action states (SPI Auditor)
  const [verifyStatus, setVerifyStatus] = useState<RecommendationStatus>('Selesai');
  const [verificationNotes, setVerificationNotes] = useState('');

  const isAuditorOrHead = hasRole(['KEPALA_SPI', 'AUDITOR', 'ADMIN_SISTEM']);
  const isSuperUser =
    userProfile?.role === 'KEPALA_SPI' ||
    userProfile?.role === 'ADMIN_SISTEM' ||
    userProfile?.email === 'hekctorsilalahi@gmail.com' ||
    userProfile?.username === 'superman';

  const isAuditee = userProfile?.role === 'AUDITEE';
  const auditeeUnitId = userProfile?.unitId || '';
  const auditeeUnitName = userProfile?.unitName || '';

  useEffect(() => {
    const unsubRecs = onSnapshot(collection(db, 'recommendations'), (snap) => {
      setRecommendations(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Recommendation)));
    });

    const unsubFollowUps = onSnapshot(collection(db, 'follow_ups'), (snap) => {
      setFollowUps(snap.docs.map((d) => ({ id: d.id, ...d.data() } as FollowUp)));
    });

    return () => {
      unsubRecs();
      unsubFollowUps();
    };
  }, []);

  const openSubmitAction = (r: Recommendation) => {
    setActiveRec(r);
    setResponseNotes('');
    setActionSteps('');
    setProgressPercent(100);
    setActionDate(new Date().toISOString().slice(0, 10));
    setPicName(userProfile?.displayName || r.pic || '');
    setEvidenceFileName('Laporan Bukti Fisik / Dokumentasi Perbaikan');
    setEvidenceFileUrl('');
    setIsSubmitModalOpen(true);
  };

  const handleSubmitAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRec) return;

    let formattedUrl = evidenceFileUrl.trim();
    if (formattedUrl && !formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }

    const followUpId = 'fu-' + Date.now();
    const newFu: FollowUp = {
      id: followUpId,
      recommendationId: activeRec.id,
      unitId: activeRec.unitId || auditeeUnitId || '',
      unitName: activeRec.unitName || auditeeUnitName || '',
      responseNotes: responseNotes.trim(),
      actionSteps: actionSteps.trim(),
      progressPercent: Number(progressPercent) || 100,
      actionDate: actionDate || new Date().toISOString().slice(0, 10),
      picName: picName.trim() || userProfile?.displayName || 'Auditee Unit',
      evidenceFileName: evidenceFileName.trim() || 'Tautan Bukti Aksi Unit',
      evidenceFileUrl: formattedUrl || undefined,
      submittedBy: userProfile?.displayName || 'Auditee Unit Kerja',
      submittedAt: new Date().toISOString(),
      status: 'Diajukan',
    };

    try {
      await setDoc(doc(db, 'follow_ups', followUpId), newFu);

      // Update recommendation status: if 100% go to 'Menunggu Verifikasi', otherwise 'Dalam Proses'
      const nextStatus: RecommendationStatus =
        progressPercent >= 100 ? 'Menunggu Verifikasi' : 'Dalam Proses';

      await updateDoc(doc(db, 'recommendations', activeRec.id), {
        status: nextStatus,
      });

      setIsSubmitModalOpen(false);
      setEvidenceFileUrl('');
    } catch (err) {
      console.error('Error submitting follow-up:', err);
      alert('Gagal mengirimkan laporan tindak lanjut unit.');
    }
  };

  // Superuser handler: Delete follow-up from database
  const handleDeleteFollowUp = async () => {
    if (!deleteConfirmModal) return;
    const { fu, rec } = deleteConfirmModal;
    setIsDeleting(true);

    try {
      // 1. Delete follow_up document from Firestore
      await deleteDoc(doc(db, 'follow_ups', fu.id));

      // 2. Recalculate recommendation status based on remaining follow-ups
      const remainingFu = followUps
        .filter((item) => item.recommendationId === rec.id && item.id !== fu.id)
        .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));

      let updatedStatus: RecommendationStatus = 'Belum Ditindaklanjuti';
      if (remainingFu.length > 0) {
        const topFu = remainingFu[0];
        if (topFu.status === 'Disetujui') {
          updatedStatus = 'Selesai';
        } else if (topFu.progressPercent && topFu.progressPercent >= 100) {
          updatedStatus = 'Menunggu Verifikasi';
        } else {
          updatedStatus = 'Dalam Proses';
        }
      }

      await updateDoc(doc(db, 'recommendations', rec.id), {
        status: updatedStatus,
      });

      setDeleteConfirmModal(null);
      alert('Tindak lanjut rekomendasi berhasil dihapus.');
    } catch (err: any) {
      console.error('Error deleting follow up:', err);
      alert('Gagal menghapus tindak lanjut: ' + (err.message || 'Error'));
    } finally {
      setIsDeleting(false);
    }
  };

  // Superuser handler: Delete recommendation and all its follow-ups from database
  const handleDeleteRecommendation = async () => {
    if (!deleteRecModal) return;
    const rec = deleteRecModal;
    setIsDeleting(true);

    try {
      const linkedFu = followUps.filter((item) => item.recommendationId === rec.id);
      for (const fu of linkedFu) {
        await deleteDoc(doc(db, 'follow_ups', fu.id));
      }
      await deleteDoc(doc(db, 'recommendations', rec.id));

      setDeleteRecModal(null);
      alert('Rekomendasi beserta seluruh data tindak lanjut berhasil dihapus.');
    } catch (err: any) {
      console.error('Error deleting recommendation:', err);
      alert('Gagal menghapus rekomendasi: ' + (err.message || 'Error'));
    } finally {
      setIsDeleting(false);
    }
  };

  const openVerifyAction = (r: Recommendation) => {
    setActiveRec(r);
    setVerifyStatus('Selesai');
    setVerificationNotes('Bukti aksi tindak lanjut dan dokumen fisik telah diverifikasi oleh tim auditor SPI dan dinyatakan memadai.');
    setIsVerifyModalOpen(true);
  };

  const handleVerifyAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRec) return;

    try {
      await updateDoc(doc(db, 'recommendations', activeRec.id), {
        status: verifyStatus,
      });

      // Find the latest follow-up for this recommendation
      const latestFu = followUps
        .filter((fu) => fu.recommendationId === activeRec.id)
        .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0];

      if (latestFu) {
        await updateDoc(doc(db, 'follow_ups', latestFu.id), {
          status: verifyStatus === 'Selesai' ? 'Disetujui' : 'Ditolak',
          verificationNotes,
          verifier: userProfile?.displayName || 'Auditor SPI',
          verifiedAt: new Date().toISOString(),
        });
      }

      setIsVerifyModalOpen(false);
    } catch (err) {
      console.error('Error verifying follow-up:', err);
      alert('Gagal menyimpan hasil verifikasi.');
    }
  };

  // Distinct units for filter
  const allUnits = useMemo(() => {
    const map = new Map<string, string>();
    recommendations.forEach((r) => {
      if (r.unitName) map.set(r.unitName, r.unitName);
      else if (r.unitId) map.set(r.unitId, r.unitId);
    });
    return Array.from(map.values());
  }, [recommendations]);

  // Strict Unit Filtering for Auditee
  const filteredRecs = useMemo(() => {
    return recommendations.filter((r) => {
      // If auditee, strictly restrict to their own unit
      if (isAuditee) {
        const matchesUnit =
          (auditeeUnitId && r.unitId === auditeeUnitId) ||
          (auditeeUnitName && (
            (r.unitName && r.unitName.toLowerCase().includes(auditeeUnitName.toLowerCase())) ||
            (r.pic && r.pic.toLowerCase().includes(auditeeUnitName.toLowerCase()))
          ));
        if (!matchesUnit) return false;
      } else if (selectedUnit !== 'ALL') {
        if (r.unitName !== selectedUnit && r.unitId !== selectedUnit) return false;
      }

      const matchesSearch =
        r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.recNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.pic && r.pic.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.unitName && r.unitName.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = selectedStatus === 'ALL' || r.status === selectedStatus;
      return matchesSearch && matchesStatus;
    });
  }, [recommendations, isAuditee, auditeeUnitId, auditeeUnitName, selectedUnit, searchTerm, selectedStatus]);

  return (
    <div className="space-y-6">
      {/* Auditee Unit Scope Notice */}
      {isAuditee && (
        <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white p-4 rounded-xl shadow-xs border border-emerald-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                Akses Terproteksi Khusus Unit Kerja
              </p>
              <h3 className="text-sm font-extrabold text-white">
                {auditeeUnitName || 'Unit Kerja Terdaftar'}
              </h3>
              <p className="text-[11px] text-emerald-200/80 mt-0.5">
                Anda hanya dapat melihat rekomendasi dan melaporkan bukti aksi perbaikan untuk unit kerja Anda sendiri.
              </p>
            </div>
          </div>
          <div className="px-3 py-1.5 bg-emerald-800/80 rounded-lg text-center shrink-0 border border-emerald-600/40">
            <span className="text-[10px] text-emerald-300 uppercase block font-semibold">Rekomendasi Unit</span>
            <span className="text-base font-black text-white">{filteredRecs.length} Butir</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-emerald-700" />
            Pemantauan & Tindak Lanjut Rekomendasi (TLR)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pengawasan realisasi perbaikan unit kerja, pelaporan bukti aksi fisik, dan pengujian keabsahan oleh auditor SPI
          </p>
        </div>

        <button
          onClick={() => setIsPrintModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors shadow-2xs shrink-0 cursor-pointer"
          title="Tinjau dan cetak laporan pemantauan tindak lanjut rekomendasi"
        >
          <Printer className="w-3.5 h-3.5 text-emerald-700" />
          <span>Cetak Laporan Pemantauan TLR</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari uraian rekomendasi, nomor, atau PIC..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Unit selector for Auditor / Kepala SPI */}
          {!isAuditee && (
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 font-medium"
            >
              <option value="ALL">Semua Unit Kerja Korporat</option>
              {allUnits.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          )}

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 font-medium"
          >
            <option value="ALL">Semua Status Tindak Lanjut</option>
            <option value="Belum Ditindaklanjuti">Belum Ditindaklanjuti</option>
            <option value="Dalam Proses">Dalam Proses</option>
            <option value="Menunggu Verifikasi">Menunggu Verifikasi SPI</option>
            <option value="Selesai">Selesai (Tervalidasi)</option>
            <option value="Tidak Dapat Ditindaklanjuti">Tidak Dapat Ditindaklanjuti</option>
          </select>
        </div>
      </div>

      {/* List Recommendations */}
      <div className="space-y-4">
        {filteredRecs.length === 0 ? (
          <div className="py-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200 text-xs">
            {isAuditee
              ? `Belum ada rekomendasi yang tercatat untuk unit ${auditeeUnitName || 'Anda'}.`
              : 'Tidak ditemukan rekomendasi untuk kriteria pencarian ini.'}
          </div>
        ) : (
          filteredRecs.map((r) => {
            const relatedFu = followUps
              .filter((fu) => fu.recommendationId === r.id)
              .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
            const latestFu = relatedFu[0];

            return (
              <div
                key={r.id}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:border-emerald-500 transition-all space-y-3"
              >
                {/* Header Card */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-300">
                      {r.recNumber}
                    </span>
                    {r.unitName && (
                      <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Building className="w-3 h-3 text-slate-500" />
                        {r.unitName}
                      </span>
                    )}
                    <span className="text-xs text-slate-500">
                      Temuan: <strong>{r.findingNumber || '-'}</strong>
                    </span>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 text-[10px] font-bold rounded-md ${
                      r.status === 'Selesai'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : r.status === 'Menunggu Verifikasi'
                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                        : r.status === 'Dalam Proses'
                        ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}
                  >
                    {r.status}
                  </span>
                </div>

                {/* Description and Info */}
                <div className="text-xs text-slate-800 space-y-2">
                  <p className="font-medium text-slate-900 leading-relaxed">{r.description}</p>
                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
                    <span>Penanggung Jawab: <strong className="text-slate-700">{r.pic}</strong></span>
                    <span>Tenggat Target: <strong className="text-slate-700">{r.targetDate}</strong></span>
                    <span>Indikator Keberhasilan: <strong className="text-slate-700">{r.successIndicator}</strong></span>
                  </div>
                </div>

                {/* Progress bar if follow-up has progress */}
                {latestFu?.progressPercent !== undefined && (
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-700 flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
                        Progres Realisasi Tindak Lanjut Unit:
                      </span>
                      <span className="font-bold font-mono text-emerald-800">
                        {latestFu.progressPercent}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          latestFu.progressPercent >= 100
                            ? 'bg-emerald-600'
                            : latestFu.progressPercent >= 50
                            ? 'bg-amber-500'
                            : 'bg-blue-500'
                        }`}
                        style={{ width: `${latestFu.progressPercent}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Follow-up trail if any */}
                {relatedFu.length > 0 && (
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2.5">
                    <span className="font-bold text-slate-900 block">Riwayat Laporan Bukti Aksi Unit Kerja:</span>
                    {relatedFu.map((fu) => (
                      <div key={fu.id} className="border-l-2 border-emerald-500 pl-3 py-1 space-y-1.5 bg-white p-2.5 rounded-r-lg border border-slate-200/60 shadow-2xs">
                        <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
                          <span className="font-bold text-slate-900 flex items-center gap-1">
                            <User className="w-3 h-3 text-emerald-700" />
                            {fu.submittedBy} ({fu.picName || 'PIC Unit'})
                          </span>
                          <span className="text-slate-400 font-mono text-[10px]">
                            {fu.actionDate ? `Tgl Aksi: ${fu.actionDate}` : fu.submittedAt.slice(0, 10)}
                          </span>
                        </div>

                        {fu.actionSteps && (
                          <div className="text-slate-700 text-[11px]">
                            <strong className="text-slate-800">Langkah Aksi:</strong> {fu.actionSteps}
                          </div>
                        )}

                        <p className="text-slate-700 text-[11px]">{fu.responseNotes}</p>

                        {/* Evidence Link / Document Info */}
                        {(fu.evidenceFileName || fu.evidenceFileUrl || fu.evidenceDataUrl) && (
                          <div className="pt-1.5 flex flex-wrap items-center gap-2">
                            <span className="text-[10px] text-slate-500 font-semibold">Bukti Fisik:</span>
                            {fu.evidenceFileUrl ? (
                              <a
                                href={fu.evidenceFileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-300 transition-colors shadow-2xs"
                                title="Buka tautan bukti aksi perbaikan unit"
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-emerald-700" />
                                <span>{fu.evidenceFileName || 'Buka Tautan Bukti Aksi'}</span>
                              </a>
                            ) : fu.evidenceDataUrl ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setPreviewEvidenceUrl(fu.evidenceDataUrl || null);
                                  setPreviewEvidenceTitle(fu.evidenceFileName || 'Bukti Aksi Tindak Lanjut');
                                }}
                                className="inline-flex items-center gap-1 px-2 py-0.5 text-[10.5px] font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded border border-emerald-300 transition-colors cursor-pointer"
                              >
                                <Eye className="w-3 h-3" />
                                <span>{fu.evidenceFileName || 'Lihat Lampiran Bukti'}</span>
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10.5px] text-slate-700 font-medium">
                                <FileText className="w-3 h-3 text-slate-400" />
                                {fu.evidenceFileName}
                              </span>
                            )}

                            {/* Superuser delete button for individual follow-up */}
                            {isSuperUser && (
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmModal({ fu, rec: r })}
                                title="Hapus tindak lanjut ini (Superuser)"
                                className="ml-auto inline-flex items-center gap-1 px-2 py-1 text-[10.5px] font-bold text-rose-700 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 hover:border-rose-600 rounded-md transition-colors cursor-pointer shadow-2xs"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Hapus Tindak Lanjut</span>
                              </button>
                            )}
                          </div>
                        )}

                        {!fu.evidenceFileName && !fu.evidenceFileUrl && !fu.evidenceDataUrl && isSuperUser && (
                          <div className="pt-1 flex justify-end">
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmModal({ fu, rec: r })}
                              title="Hapus tindak lanjut ini (Superuser)"
                              className="inline-flex items-center gap-1 px-2 py-0.5 text-[10.5px] font-bold text-rose-700 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 hover:border-rose-600 rounded-md transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Hapus Laporan Ini</span>
                            </button>
                          </div>
                        )}

                        {fu.verificationNotes && (
                          <div className="p-2 bg-emerald-50 rounded-lg text-[11px] text-emerald-950 border border-emerald-200 mt-1 space-y-0.5">
                            <span className="font-bold flex items-center gap-1 text-emerald-900">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                              Verifikasi SPI ({fu.verifier || 'Auditor SPI'}):
                            </span>
                            <p>{fu.verificationNotes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions Bar */}
                <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  {/* Superuser: Hapus Rekomendasi */}
                  {isSuperUser && (
                    <button
                      type="button"
                      onClick={() => setDeleteRecModal(r)}
                      className="mr-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded-lg transition-colors cursor-pointer"
                      title="Hapus butir rekomendasi beserta seluruh riwayat tindak lanjut terkait"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>Hapus Rekomendasi</span>
                    </button>
                  )}

                  {/* Auditee / Unit action: Upload Bukti Aksi Unit */}
                  <button
                    onClick={() => openSubmitAction(r)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg transition-colors cursor-pointer"
                  >
                    <UploadCloud className="w-3.5 h-3.5 text-emerald-800" />
                    <span>Laporkan Bukti Aksi Unit</span>
                  </button>

                  {/* SPI Auditor action */}
                  {isAuditorOrHead && (
                    <button
                      onClick={() => openVerifyAction(r)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-2xs transition-colors cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Verifikasi SPI</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Upload Bukti Tindak Lanjut (Auditee) */}
      {isSubmitModalOpen && activeRec && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
            <div className="px-6 py-4 bg-gradient-to-r from-[#0d3824] to-[#105234] text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">Pelaporan Bukti Aksi Tindak Lanjut Unit Kerja</h3>
                <p className="text-[11px] text-emerald-200">
                  Unit: {activeRec.unitName || auditeeUnitName || 'Unit Terkait'}
                </p>
              </div>
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="text-emerald-200 hover:text-white font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitAction} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <span className="font-bold text-emerald-800 block font-mono">{activeRec.recNumber}</span>
                <p className="text-slate-800 font-medium line-clamp-2 leading-relaxed">{activeRec.description}</p>
                <p className="text-[11px] text-slate-500 font-semibold">Tenggat Target: {activeRec.targetDate}</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Langkah-Langkah Aksi Perbaikan yang Telah Dieksekusi <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={actionSteps}
                  onChange={(e) => setActionSteps(e.target.value)}
                  placeholder="Contoh: 1. Melakukan perbaikan pipa transmisi bocor di STA 12; 2. Mengganti fitting flange baru; 3. Uji coba tekanan air..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-600 font-sans"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Uraian Deskripsi & Hasil Tindak Lanjut <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={responseNotes}
                  onChange={(e) => setResponseNotes(e.target.value)}
                  placeholder="Jelaskan kondisi saat ini setelah langkah aksi dilakukan dan indikator keberhasilan tercapai..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-600 font-sans"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Persentase Realisasi (%)
                  </label>
                  <select
                    value={progressPercent}
                    onChange={(e) => setProgressPercent(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-emerald-900"
                  >
                    <option value={25}>25% (Awal Pelaksanaan)</option>
                    <option value={50}>50% (Sebagian Selesai)</option>
                    <option value={75}>75% (Menjelang Tuntas)</option>
                    <option value={100}>100% (Tuntas Selesai)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tanggal Realisasi Aksi
                  </label>
                  <input
                    type="date"
                    required
                    value={actionDate}
                    onChange={(e) => setActionDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-sans"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    PIC / Staf Pelaksana
                  </label>
                  <input
                    type="text"
                    required
                    value={picName}
                    onChange={(e) => setPicName(e.target.value)}
                    placeholder="Nama PIC unit..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama / Nomor Dokumen Bukti Fisik <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={evidenceFileName}
                  onChange={(e) => setEvidenceFileName(e.target.value)}
                  placeholder="Contoh: Berita Acara Perbaikan Kebocoran No. 102/BA-TRC/2026"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              {/* Bukti Fisik: Pengisian Link Bukti Dokumen */}
              <div className="space-y-2 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <label className="block font-semibold text-slate-800">
                  Tautan / Link Bukti Dokumen <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Link2 className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={evidenceFileUrl}
                    onChange={(e) => setEvidenceFileUrl(e.target.value)}
                    placeholder="https://... (tempel tautan dokumen / foto bukti perbaikan)"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-600 font-mono"
                  />
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Unit kerja cukup mengisi / menempelkan link dokumen atau foto bukti aksi perbaikan (misal tautan penyimpanan cloud atau dokumen online).
                </p>
                {evidenceFileUrl.trim() && (
                  <div className="pt-1 flex items-center gap-2">
                    <span className="text-[10.5px] text-emerald-700 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-600" /> Link terisi
                    </span>
                    <a
                      href={evidenceFileUrl.trim().startsWith('http') ? evidenceFileUrl.trim() : `https://${evidenceFileUrl.trim()}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10.5px] text-emerald-800 font-semibold underline inline-flex items-center gap-1"
                    >
                      Uji Buka Tautan <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2 font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm cursor-pointer"
                >
                  Kirimkan untuk Verifikasi SPI
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Verifikasi SPI (Auditor) */}
      {isVerifyModalOpen && activeRec && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-[#0d3824] to-[#105234] text-white flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                Verifikasi & Validasi Tindak Lanjut oleh SPI
              </h3>
              <button
                onClick={() => setIsVerifyModalOpen(false)}
                className="text-emerald-200 hover:text-white font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleVerifyAction} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <span className="font-bold text-slate-900 font-mono">{activeRec.recNumber}</span>
                <p className="text-slate-700 line-clamp-2">{activeRec.description}</p>
                <p className="text-[11px] text-slate-500 font-medium">
                  Unit: {activeRec.unitName || '-'} · PIC: {activeRec.pic}
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Keputusan Status Verifikasi SPI</label>
                <select
                  value={verifyStatus}
                  onChange={(e) => setVerifyStatus(e.target.value as RecommendationStatus)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900"
                >
                  <option value="Selesai">Selesai (Bukti Memadai & Disetujui SPI)</option>
                  <option value="Dalam Proses">Dalam Proses (Perlu Perbaikan / Bukti Tambahan)</option>
                  <option value="Belum Ditindaklanjuti">Tolak Bukti (Tidak Sesuai Rekomendasi)</option>
                  <option value="Tidak Dapat Ditindaklanjuti">Tidak Dapat Ditindaklanjuti</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan Evaluasi / Bukti Uji Petik Auditor SPI</label>
                <textarea
                  rows={3}
                  required
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  placeholder="Uraian hasil pengujian fisik dan kelayakan bukti yang dilampirkan unit kerja..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-sans"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsVerifyModalOpen(false)}
                  className="px-4 py-2 font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm cursor-pointer"
                >
                  Simpan Status Verifikasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Evidence File Modal */}
      {previewEvidenceUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-5 py-3 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-bold text-xs truncate">{previewEvidenceTitle}</span>
              <button
                onClick={() => setPreviewEvidenceUrl(null)}
                className="text-slate-400 hover:text-white font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-4 overflow-auto flex items-center justify-center bg-slate-100 flex-1">
              {previewEvidenceUrl.startsWith('data:image/') ? (
                <img
                  src={previewEvidenceUrl}
                  alt={previewEvidenceTitle}
                  className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-sm"
                />
              ) : (
                <iframe
                  src={previewEvidenceUrl}
                  title={previewEvidenceTitle}
                  className="w-full h-[65vh] rounded-lg border border-slate-300 bg-white"
                />
              )}
            </div>
            <div className="p-3 bg-white border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewEvidenceUrl(null)}
                className="px-4 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Print Modal with Fitur Jabatan */}
      {isPrintModalOpen && (
        <DocumentPrintPreviewModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          documentTitle="LAPORAN PEMANTAUAN TINDAK LANJUT REKOMENDASI (TLR)"
          documentSubtitle={`Perumda Air Minum Tirta Saiyo Kabupaten Pasaman ${
            isAuditee && auditeeUnitName ? `- Unit ${auditeeUnitName}` : ''
          }`}
          documentNumber={`TLR/SPI-PTS/${new Date().getFullYear()}`}
          initialSignatory1Role="Kepala Satuan Pengawasan Intern"
          initialSignatory2Role="Direktur Perumda Air Minum Tirta Saiyo"
          defaultShowSignatory2={true}
        >
          {() => (
            <div className="space-y-5 text-xs font-serif leading-relaxed">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 grid grid-cols-3 gap-3 font-sans text-xs">
                <div>
                  <p className="text-slate-500">Cakupan Unit:</p>
                  <p className="font-bold text-slate-900">
                    {isAuditee && auditeeUnitName ? auditeeUnitName : selectedUnit === 'ALL' ? 'Semua Unit' : selectedUnit}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Total Rekomendasi:</p>
                  <p className="font-bold text-slate-900">{filteredRecs.length} Rekomendasi</p>
                </div>
                <div>
                  <p className="text-slate-500">Selesai Ditindaklanjuti:</p>
                  <p className="font-bold text-emerald-800">
                    {filteredRecs.filter((r) => r.status === 'Selesai').length} Rekomendasi (
                    {filteredRecs.length > 0
                      ? `${Math.round(
                          (filteredRecs.filter((r) => r.status === 'Selesai').length /
                            filteredRecs.length) *
                            100
                        )}%`
                      : '0%'}
                    )
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 font-sans uppercase tracking-wider text-xs border-b border-slate-300 pb-1">
                  Matriks Status Rekomendasi & Hasil Pengujian SPI:
                </h4>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] border-collapse border border-slate-300 font-sans">
                    <thead>
                      <tr className="bg-slate-100 font-bold text-slate-800 border-b border-slate-300">
                        <th className="p-2 border border-slate-300 w-8 text-center">No</th>
                        <th className="p-2 border border-slate-300 w-24">Nomor & Unit</th>
                        <th className="p-2 border border-slate-300">Uraian Rekomendasi SPI</th>
                        <th className="p-2 border border-slate-300 w-28">Target & PIC</th>
                        <th className="p-2 border border-slate-300 w-24 text-center">Status Akhir</th>
                        <th className="p-2 border border-slate-300">Catatan Verifikasi Auditor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredRecs.map((r, idx) => (
                        <tr key={r.id}>
                          <td className="p-2 border border-slate-300 text-center font-bold">{idx + 1}</td>
                          <td className="p-2 border border-slate-300">
                            <p className="font-bold font-mono text-[10px] text-slate-900">{r.recNumber}</p>
                            <p className="text-[10px] text-slate-600 font-sans">{r.unitName}</p>
                          </td>
                          <td className="p-2 border border-slate-300">{r.description}</td>
                          <td className="p-2 border border-slate-300 text-[10px]">
                            <p><strong>PIC:</strong> {r.pic}</p>
                            <p><strong>Target:</strong> {r.targetDate}</p>
                          </td>
                          <td className="p-2 border border-slate-300 text-center font-bold">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] ${
                                r.status === 'Selesai'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : r.status === 'Dalam Proses'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {r.status}
                            </span>
                          </td>
                          <td className="p-2 border border-slate-300 text-slate-700">
                            {r.successIndicator || 'Diverifikasi oleh tim pemeriksa SPI.'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </DocumentPrintPreviewModal>
      )}

      {/* Superuser Modal: Konfirmasi Hapus Tindak Lanjut */}
      {deleteConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-rose-200 overflow-hidden">
            <div className="px-6 py-4 bg-rose-700 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-200" />
                Hapus Tindak Lanjut Rekomendasi
              </h3>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteConfirmModal(null)}
                className="text-rose-200 hover:text-white font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1.5 text-rose-950">
                <p className="font-bold">Perhatian Khusus Superuser:</p>
                <p className="text-[11px] leading-relaxed">
                  Tindakan ini akan <strong>menghapus catatan tindak lanjut ini dari database Firebase</strong> secara permanen dan memperbarui status rekomendasi terkait.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1 text-slate-700 text-[11px]">
                <p><strong>Rekomendasi:</strong> {deleteConfirmModal.rec.recNumber}</p>
                <p><strong>Pelapor:</strong> {deleteConfirmModal.fu.submittedBy} ({deleteConfirmModal.fu.picName || '-'})</p>
                <p><strong>Uraian Aksi:</strong> {deleteConfirmModal.fu.responseNotes}</p>
                {deleteConfirmModal.fu.evidenceFileName && (
                  <p><strong>Dokumen Bukti:</strong> {deleteConfirmModal.fu.evidenceFileName}</p>
                )}
                {deleteConfirmModal.fu.evidenceFileUrl && (
                  <p className="truncate"><strong>Link Bukti:</strong> {deleteConfirmModal.fu.evidenceFileUrl}</p>
                )}
              </div>

              <p className="text-[11px] text-slate-600 font-medium">
                Apakah Anda yakin ingin melanjutkan penghapusan permanen ini?
              </p>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setDeleteConfirmModal(null)}
                  className="px-4 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDeleteFollowUp}
                  className="inline-flex items-center gap-1.5 px-4 py-2 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menghapus...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Ya, Hapus Permanen</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Superuser Modal: Konfirmasi Hapus Rekomendasi */}
      {deleteRecModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-rose-200 overflow-hidden">
            <div className="px-6 py-4 bg-rose-800 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-200" />
                Hapus Rekomendasi & Riwayat Tindak Lanjut
              </h3>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteRecModal(null)}
                className="text-rose-200 hover:text-white font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1.5 text-rose-950">
                <p className="font-bold">Konfirmasi Penghapusan Butir Rekomendasi:</p>
                <p className="text-[11px] leading-relaxed">
                  Menghapus rekomendasi ini akan menghapus butir rekomendasi beserta seluruh catatan riwayat tindak lanjut unit dari database Firebase secara permanen.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1 text-slate-700 text-[11px]">
                <p className="font-bold font-mono text-slate-900">{deleteRecModal.recNumber}</p>
                <p className="line-clamp-2">{deleteRecModal.description}</p>
                <p><strong>Unit:</strong> {deleteRecModal.unitName || '-'}</p>
              </div>

              <p className="text-[11px] text-slate-600 font-medium">
                Tindakan ini tidak dapat dibatalkan. Lanjutkan?
              </p>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setDeleteRecModal(null)}
                  className="px-4 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDeleteRecommendation}
                  className="inline-flex items-center gap-1.5 px-4 py-2 font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menghapus...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Rekomendasi</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
