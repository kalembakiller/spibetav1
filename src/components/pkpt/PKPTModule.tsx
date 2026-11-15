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
  CalendarCheck,
  Plus,
  Edit2,
  Trash2,
  Download,
  Printer,
  Wallet,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { db } from '../../lib/firebase';
import { PKPT, Unit, RiskRegister, RKAItem } from '../../types/audit';
import { useAuth } from '../../context/AuthContext';
import { useFiscalYear } from '../../context/FiscalYearContext';
import { AUDIT_TYPES } from '../../data/initialData';
import { DocumentPrintPreviewModal } from '../common/DocumentPrintPreviewModal';
import { calculateRkaWeightScore } from './RKAModule';

interface PKPTModuleProps {
  onNavigateToAssignment?: (pkptItem: PKPT) => void;
  initialPrefillFromRka?: RKAItem | null;
  onClearPrefillRka?: () => void;
}

const computeCompositePriorityScore = (riskScore: number, rkaWeightScore?: number): number => {
  const safeRisk = Math.min(25, Math.max(1, riskScore || 12));
  const riskComponent = Math.round((safeRisk / 25) * 60); // Bobot 60% dari Risk Score
  if (typeof rkaWeightScore === 'number' && rkaWeightScore > 0) {
    const rkaComponent = Math.round((Math.min(100, rkaWeightScore) / 100) * 40); // Bobot 40% dari RKA
    return Math.min(100, Math.max(1, riskComponent + rkaComponent));
  }
  return Math.min(100, Math.round((safeRisk / 25) * 100));
};

export const PKPTModule: React.FC<PKPTModuleProps> = ({
  onNavigateToAssignment,
  initialPrefillFromRka,
  onClearPrefillRka,
}) => {
  const { userProfile, hasRole } = useAuth();
  const { activeYear, availableYears, addCustomYear } = useFiscalYear();

  const [pkptList, setPkptList] = useState<PKPT[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [risks, setRisks] = useState<RiskRegister[]>([]);
  const [rkaList, setRkaList] = useState<RKAItem[]>([]);

  const [selectedYear, setSelectedYear] = useState<number>(activeYear);
  const [selectedQuarter, setSelectedQuarter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [editingPkpt, setEditingPkpt] = useState<PKPT | null>(null);
  const [isGeneratingFromRka, setIsGeneratingFromRka] = useState(false);

  // Sync with global activeYear selector
  useEffect(() => {
    setSelectedYear(activeYear);
  }, [activeYear]);

  // Form states
  const [formYear, setFormYear] = useState<number>(activeYear);
  const [formTitle, setFormTitle] = useState('');
  const [formUnitId, setFormUnitId] = useState('');
  const [formBusinessProcess, setFormBusinessProcess] = useState('');
  const [formAuditType, setFormAuditType] = useState('Audit Operasional');
  const [formObjective, setFormObjective] = useState('');
  const [formScope, setFormScope] = useState('');
  const [formEstimatedDays, setFormEstimatedDays] = useState<number>(10);
  const [formQuarter, setFormQuarter] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4'>('Q1');
  const [formStatus, setFormStatus] = useState<'Rencana' | 'Berlangsung' | 'Selesai'>('Rencana');
  const [formApprovalStatus, setFormApprovalStatus] = useState<'Draft' | 'Disetujui' | 'Ditolak'>('Draft');
  const [formRiskScore, setFormRiskScore] = useState<number>(12);
  const [formPriorityScore, setFormPriorityScore] = useState<number>(85);
  const [formManualOverrideReason, setFormManualOverrideReason] = useState('');
  const [formRkaId, setFormRkaId] = useState<string>('');

  const isKepalaSPI = hasRole(['KEPALA_SPI', 'ADMIN_SISTEM']);

  useEffect(() => {
    const unsubPkpt = onSnapshot(collection(db, 'pkpt'), (snap) => {
      setPkptList(snap.docs.map((d) => ({ id: d.id, ...d.data() } as PKPT)));
    });

    const unsubUnits = onSnapshot(collection(db, 'units'), (snap) => {
      setUnits(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Unit)));
    });

    const unsubRisks = onSnapshot(collection(db, 'risk_registers'), (snap) => {
      setRisks(snap.docs.map((d) => ({ id: d.id, ...d.data() } as RiskRegister)));
    });

    const unsubRka = onSnapshot(collection(db, 'rka_items'), (snap) => {
      setRkaList(snap.docs.map((d) => ({ id: d.id, ...d.data() } as RKAItem)));
    });

    return () => {
      unsubPkpt();
      unsubUnits();
      unsubRisks();
      unsubRka();
    };
  }, []);

  // Highest residual/inherent risk score for a unit & year
  const getUnitMaxRiskScore = (unitId: string, year: number): number => {
    const matching = risks.filter((r) => r.unitId === unitId && (r.year === year || !year));
    const pool = matching.length > 0 ? matching : risks.filter((r) => r.unitId === unitId);
    if (pool.length === 0) return 12;
    return Math.max(...pool.map((r) => r.residualScore || r.inherentScore || 12));
  };

  // Prefill when navigated directly from RKA Module ("Ke PKPT")
  useEffect(() => {
    if (initialPrefillFromRka) {
      const rkaWeight = calculateRkaWeightScore(
        initialPrefillFromRka.budgetAmount,
        initialPrefillFromRka.strategicPriority
      );
      const maxRisk = getUnitMaxRiskScore(initialPrefillFromRka.unitId, initialPrefillFromRka.year);
      const compositeScore = computeCompositePriorityScore(maxRisk, rkaWeight);

      setEditingPkpt(null);
      setSelectedYear(initialPrefillFromRka.year || activeYear);
      setFormYear(initialPrefillFromRka.year || activeYear);
      setFormRkaId(initialPrefillFromRka.id);
      setFormTitle(`Audit Pelaksanaan & Anggaran: ${initialPrefillFromRka.programName}`);
      setFormUnitId(initialPrefillFromRka.unitId || units[0]?.id || '');
      setFormBusinessProcess(initialPrefillFromRka.category || 'Operasional & Anggaran RKA');
      setFormAuditType(
        initialPrefillFromRka.category === 'Investasi & Infrastruktur'
          ? 'Audit Kepatuhan'
          : 'Audit Operasional'
      );
      setFormObjective(
        `Memastikan ketepatan realisasi anggaran Rp ${(initialPrefillFromRka.budgetAmount || 0).toLocaleString('id-ID')} dan efektivitas program ${initialPrefillFromRka.programName} (${initialPrefillFromRka.code})`
      );
      setFormScope(
        `Pengujian pertanggungjawaban RKA ${initialPrefillFromRka.code}, pencapaian output unit ${initialPrefillFromRka.unitName}, serta kepatuhan SOP pengadaan & keuangan.`
      );
      setFormEstimatedDays(initialPrefillFromRka.strategicPriority === 'Tinggi' ? 14 : 10);
      setFormQuarter(initialPrefillFromRka.targetQuarter || 'Q1');
      setFormStatus('Rencana');
      setFormApprovalStatus(isKepalaSPI ? 'Disetujui' : 'Draft');
      setFormRiskScore(maxRisk);
      setFormPriorityScore(compositeScore);
      setFormManualOverrideReason('');
      setIsModalOpen(true);

      if (onClearPrefillRka) {
        onClearPrefillRka();
      }
    }
  }, [initialPrefillFromRka, units, risks]);

  const yearOptions = useMemo(() => {
    const docYears = pkptList.map((p) => p.year).filter((y) => typeof y === 'number' && y > 0);
    return Array.from(new Set([...availableYears, ...docYears])).sort((a, b) => b - a);
  }, [availableYears, pkptList]);

  const selectedRkaObj = useMemo(
    () => rkaList.find((r) => r.id === formRkaId) || null,
    [rkaList, formRkaId]
  );

  const selectedRkaWeight = selectedRkaObj
    ? calculateRkaWeightScore(selectedRkaObj.budgetAmount, selectedRkaObj.strategicPriority)
    : 0;

  const yearForStats = selectedYear === 0 ? activeYear : selectedYear;
  const rkaForActiveYear = useMemo(
    () => rkaList.filter((r) => selectedYear === 0 || r.year === yearForStats),
    [rkaList, selectedYear, yearForStats]
  );
  const linkedRkaIds = useMemo(
    () => new Set(pkptList.map((p) => p.rkaId).filter(Boolean) as string[]),
    [pkptList]
  );
  const unscheduledPriorityRka = useMemo(
    () =>
      rkaForActiveYear.filter(
        (r) =>
          !linkedRkaIds.has(r.id) &&
          (r.strategicPriority === 'Tinggi' || (r.budgetAmount || 0) >= 100_000_000)
      ),
    [rkaForActiveYear, linkedRkaIds]
  );
  const totalRkaBudgetYear = rkaForActiveYear.reduce((s, r) => s + (r.budgetAmount || 0), 0);

  const openAddModal = () => {
    const targetYr = selectedYear === 0 ? activeYear : selectedYear;
    const defaultUnitId = units[0]?.id || '';
    const maxRisk = getUnitMaxRiskScore(defaultUnitId, targetYr);
    setEditingPkpt(null);
    setFormYear(targetYr);
    setFormRkaId('');
    setFormTitle('Audit Operasional Penurunan Tingkat Kehilangan Air (NRW)');
    setFormUnitId(defaultUnitId);
    setFormBusinessProcess('Transmisi, Distribusi & Pemeliharaan Jaringan');
    setFormAuditType('Audit Operasional');
    setFormObjective('Memberikan assurance atas kepatuhan SOP perbaikan pipa dan akurasi meter induk');
    setFormScope('Jaringan distribusi unit pelayanan Pasaman dan pencatatan volume produksi');
    setFormEstimatedDays(12);
    setFormQuarter('Q1');
    setFormStatus('Rencana');
    setFormApprovalStatus(isKepalaSPI ? 'Disetujui' : 'Draft');
    setFormRiskScore(maxRisk);
    setFormPriorityScore(computeCompositePriorityScore(maxRisk));
    setFormManualOverrideReason('');
    setIsModalOpen(true);
  };

  const openEditModal = (p: PKPT) => {
    setEditingPkpt(p);
    setFormYear(p.year);
    setFormRkaId(p.rkaId || '');
    setFormTitle(p.title);
    setFormUnitId(p.unitId);
    setFormBusinessProcess(p.businessProcess);
    setFormAuditType(p.auditType);
    setFormObjective(p.objective);
    setFormScope(p.scope);
    setFormEstimatedDays(p.estimatedDays);
    setFormQuarter(p.quarter);
    setFormStatus(p.status);
    setFormApprovalStatus(p.approvalStatus);
    setFormRiskScore(p.riskScore);
    setFormPriorityScore(p.priorityScore);
    setFormManualOverrideReason(p.manualOverrideReason || '');
    setIsModalOpen(true);
  };

  const handleSelectRkaInModal = (rkaId: string) => {
    setFormRkaId(rkaId);
    if (!rkaId) {
      setFormPriorityScore(computeCompositePriorityScore(formRiskScore));
      return;
    }
    const rka = rkaList.find((r) => r.id === rkaId);
    if (!rka) return;

    const rkaWeight = calculateRkaWeightScore(rka.budgetAmount, rka.strategicPriority);
    const unitRisk = getUnitMaxRiskScore(rka.unitId || formUnitId, rka.year || formYear);
    setFormRiskScore(unitRisk);
    setFormPriorityScore(computeCompositePriorityScore(unitRisk, rkaWeight));

    if (!editingPkpt) {
      setFormUnitId(rka.unitId || formUnitId);
      setFormQuarter(rka.targetQuarter || formQuarter);
      setFormBusinessProcess(rka.category || formBusinessProcess);
      setFormTitle(`Audit Pelaksanaan & Anggaran: ${rka.programName}`);
      setFormObjective(
        `Memastikan ketepatan realisasi anggaran Rp ${(rka.budgetAmount || 0).toLocaleString('id-ID')} dan efektivitas program ${rka.programName} (${rka.code})`
      );
      setFormScope(
        `Pemeriksaan dokumen pelaksanaan RKA ${rka.code}, kepatuhan prosedur pengadaan, dan ketercapaian output pada ${rka.unitName}.`
      );
    }
  };

  const handleGeneratePkptFromRka = async () => {
    if (unscheduledPriorityRka.length === 0) return;
    if (
      !window.confirm(
        `Tambahkan ${unscheduledPriorityRka.length} program RKA prioritas/material yang belum terjadwal ke dalam daftar PKPT tahun ${yearForStats}?`
      )
    ) {
      return;
    }

    setIsGeneratingFromRka(true);
    try {
      for (let idx = 0; idx < unscheduledPriorityRka.length; idx++) {
        const rka = unscheduledPriorityRka[idx];
        const rkaWeight = calculateRkaWeightScore(rka.budgetAmount, rka.strategicPriority);
        const unitRisk = getUnitMaxRiskScore(rka.unitId, rka.year);
        const priorityScore = computeCompositePriorityScore(unitRisk, rkaWeight);
        const id = `pkpt-rka-${Date.now()}-${idx}`;
        const pkptDoc: PKPT = {
          id,
          year: rka.year || yearForStats,
          title: `Audit Pelaksanaan & Anggaran: ${rka.programName}`,
          unitId: rka.unitId,
          unitName: rka.unitName,
          businessProcess: rka.category,
          riskScore: unitRisk,
          priorityScore,
          priorityRank:
            priorityScore >= 80
              ? 'Prioritas 1 (Krusial)'
              : priorityScore >= 60
              ? 'Prioritas 2'
              : 'Prioritas 3',
          auditType:
            rka.category === 'Investasi & Infrastruktur' ? 'Audit Kepatuhan' : 'Audit Operasional',
          objective: `Evaluasi realisasi anggaran Rp ${(rka.budgetAmount || 0).toLocaleString('id-ID')} dan kepatuhan pelaksanaan ${rka.programName} (${rka.code}).`,
          scope: `Pertanggungjawaban RKA ${rka.code}, efisiensi penggunaan dana, dan kesesuaian fisik/administrasi pada ${rka.unitName}.`,
          estimatedDays: rka.strategicPriority === 'Tinggi' ? 14 : 10,
          quarter: rka.targetQuarter || 'Q1',
          status: 'Rencana',
          approvalStatus: isKepalaSPI ? 'Disetujui' : 'Draft',
          approvedBy: isKepalaSPI ? userProfile?.displayName || 'Kepala SPI' : undefined,
          approvedAt: isKepalaSPI ? new Date().toISOString().slice(0, 10) : undefined,
          rkaId: rka.id,
          rkaCode: rka.code,
          rkaProgramName: rka.programName,
          rkaBudget: rka.budgetAmount,
          rkaWeightScore: rkaWeight,
        };
        await setDoc(doc(db, 'pkpt', id), pkptDoc);
      }
    } catch (err) {
      console.error('Error generating PKPT from RKA:', err);
      alert('Gagal membuat jadwal PKPT otomatis dari RKA.');
    } finally {
      setIsGeneratingFromRka(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const selUnit = units.find((u) => u.id === formUnitId);
    const unitName = selUnit ? selUnit.name : 'Unit Kerja';
    const validYear = isNaN(formYear) ? activeYear : formYear;
    addCustomYear(validYear);

    const pkptData: Omit<PKPT, 'id'> = {
      year: validYear,
      title: formTitle,
      unitId: formUnitId,
      unitName,
      businessProcess: formBusinessProcess,
      auditType: formAuditType,
      objective: formObjective,
      scope: formScope,
      estimatedDays: formEstimatedDays,
      quarter: formQuarter,
      status: formStatus,
      approvalStatus: formApprovalStatus,
      riskScore: formRiskScore,
      priorityScore: formPriorityScore,
      priorityRank:
        formPriorityScore >= 80
          ? 'Prioritas 1 (Krusial)'
          : formPriorityScore >= 60
          ? 'Prioritas 2'
          : 'Prioritas 3',
      manualOverrideReason: formManualOverrideReason,
      ...(formApprovalStatus === 'Disetujui'
        ? {
            approvedBy: userProfile?.displayName || 'Kepala SPI',
            approvedAt: new Date().toISOString().slice(0, 10),
          }
        : {}),
      ...(selectedRkaObj
        ? {
            rkaId: selectedRkaObj.id,
            rkaCode: selectedRkaObj.code,
            rkaProgramName: selectedRkaObj.programName,
            rkaBudget: selectedRkaObj.budgetAmount,
            rkaWeightScore: selectedRkaWeight,
          }
        : {
            rkaId: '',
            rkaCode: '',
            rkaProgramName: '',
            rkaBudget: 0,
            rkaWeightScore: 0,
          }),
    };

    try {
      if (editingPkpt) {
        await updateDoc(doc(db, 'pkpt', editingPkpt.id), pkptData);
      } else {
        const id = 'pkpt-' + Date.now();
        await setDoc(doc(db, 'pkpt', id), { id, ...pkptData });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving PKPT:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Hapus item rencana audit PKPT ini?')) return;
    try {
      await deleteDoc(doc(db, 'pkpt', id));
    } catch (err) {
      console.error('Error deleting PKPT:', err);
    }
  };

  const exportToExcel = () => {
    const dataToExport = filteredPkpt.map((p, idx) => ({
      No: idx + 1,
      Tahun: p.year,
      'Judul Pengawasan': p.title,
      'Unit Kerja / Pemilik Risiko': p.unitName,
      'Proses Bisnis': p.businessProcess,
      'Jenis Audit': p.auditType,
      'Referensi RKA': p.rkaCode ? `${p.rkaCode} - ${p.rkaProgramName}` : '-',
      'Pagu RKA (Rp)': p.rkaBudget || 0,
      'Skor Prioritas': p.priorityScore,
      Peringkat: p.priorityRank || '-',
      Triwulan: p.quarter,
      'Estimasi Hari Kerja': p.estimatedDays,
      'Status Pelaksanaan': p.status,
      'Status Persetujuan': p.approvalStatus,
      'Disetujui Oleh': p.approvedBy || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'PKPT');
    XLSX.writeFile(wb, `PKPT_Tirta_Saiyo_${selectedYear === 0 ? 'Semua' : selectedYear}.xlsx`);
  };

  // Filter & sort by priorityScore descending
  const filteredPkpt = pkptList
    .filter((p) => {
      const matchesYear = selectedYear === 0 || p.year === selectedYear;
      const matchesQuarter = selectedQuarter === 'ALL' || p.quarter === selectedQuarter;
      return matchesYear && matchesQuarter;
    })
    .sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));

  const modalRkaOptions = useMemo(() => {
    return rkaList.filter((r) => r.year === formYear || r.id === formRkaId);
  }, [rkaList, formYear, formRkaId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-emerald-700" />
            Program Kerja Pengawasan Tahunan (PKPT Berbasis Risiko & RKA)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Penetapan prioritas pengawasan tahunan berbasis register risiko, input manual RKA, dan mitigasi korporat
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors shadow-2xs"
            title="Tinjau dan cetak dokumen PKPT resmi dengan pengesahan jabatan"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-700" />
            <span>Cetak Dokumen PKPT</span>
          </button>

          <button
            onClick={exportToExcel}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            <span>Ekspor Excel</span>
          </button>

          {isKepalaSPI && (
            <button
              onClick={openAddModal}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Susun Rencana PKPT</span>
            </button>
          )}
        </div>
      </div>

      {/* RKA Influence Summary & Generator Banner */}
      <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50/60 to-white border border-emerald-200 rounded-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Wallet className="w-4 h-4 text-emerald-700" />
            <span className="text-xs font-extrabold text-emerald-950">
              Integrasi RKA ({selectedYear === 0 ? 'Semua Tahun' : `TA ${yearForStats}`})
            </span>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-white text-emerald-800 border border-emerald-200 rounded-md font-mono">
              Total Pagu RKA: Rp {totalRkaBudgetYear.toLocaleString('id-ID')}
            </span>
          </div>
          <p className="text-[11px] text-emerald-900">
            {rkaForActiveYear.length === 0 ? (
              <>Belum ada item RKA yang diinput untuk tahun ini. Input RKA manual akan otomatis memengaruhi bobot prioritas penyusunan PKPT.</>
            ) : unscheduledPriorityRka.length > 0 ? (
              <>
                Terdapat <strong>{unscheduledPriorityRka.length} program RKA prioritas/material</strong> yang belum dijadwalkan dalam PKPT (dari total {rkaForActiveYear.length} program RKA).
              </>
            ) : (
              <span className="inline-flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                Seluruh program RKA prioritas/material ({rkaForActiveYear.length} item) telah terakomodasi dalam penyusunan PKPT.
              </span>
            )}
          </p>
        </div>

        {isKepalaSPI && unscheduledPriorityRka.length > 0 && (
          <button
            onClick={handleGeneratePkptFromRka}
            disabled={isGeneratingFromRka}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-xs transition-colors shrink-0 disabled:opacity-60"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>
              {isGeneratingFromRka
                ? 'Menyusun PKPT...'
                : `Buat ${unscheduledPriorityRka.length} Usulan PKPT dari RKA`}
            </span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
            className="px-3 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-lg text-slate-800"
          >
            {yearOptions.map((yr) => (
              <option key={yr} value={yr}>
                Tahun {yr}
              </option>
            ))}
            <option value={0}>Semua Tahun</option>
          </select>

          <select
            value={selectedQuarter}
            onChange={(e) => setSelectedQuarter(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800"
          >
            <option value="ALL">Semua Triwulan (Q1 - Q4)</option>
            <option value="Q1">Triwulan I (Q1)</option>
            <option value="Q2">Triwulan II (Q2)</option>
            <option value="Q3">Triwulan III (Q3)</option>
            <option value="Q4">Triwulan IV (Q4)</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Total Objek Pengawasan: <span className="font-bold text-slate-900 tabular-nums">{filteredPkpt.length}</span>
        </div>
      </div>

      {/* PKPT Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4 w-16 text-center">Prioritas</th>
                <th className="py-3 px-4">Judul Objek Pengawasan & Pengaruh RKA</th>
                <th className="py-3 px-4">Pemilik Risiko / Auditee</th>
                <th className="py-3 px-4">Jenis Audit</th>
                <th className="py-3 px-4 text-center">Jadwal & Durasi</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Pengesahan</th>
                <th className="py-3 px-4 text-center w-40">Tindak Lanjut & Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredPkpt.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Belum ada program kerja audit PKPT pada tahun ini.
                  </td>
                </tr>
              ) : (
                filteredPkpt.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs font-mono">
                        {idx + 1}
                      </span>
                      <p className="text-[10px] font-mono font-bold text-slate-500 mt-0.5">
                        {p.priorityScore}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{p.title}</p>
                      <p className="text-[11px] text-slate-500">
                        TA {p.year} · Proses: {p.businessProcess}
                      </p>
                      {p.rkaCode && (
                        <div className="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md">
                          <Wallet className="w-3 h-3 text-emerald-700" />
                          <span>
                            RKA {p.rkaCode}
                            {p.rkaBudget ? ` · Rp ${p.rkaBudget.toLocaleString('id-ID')}` : ''}
                          </span>
                        </div>
                      )}
                      {p.manualOverrideReason && (
                        <p className="text-[10px] text-amber-700 italic mt-0.5">
                          * Override Kepala SPI: {p.manualOverrideReason}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{p.unitName}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 text-[10px] font-semibold text-slate-700 bg-slate-100 rounded-md">
                        {p.auditType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-bold text-slate-900">{p.quarter}</span>
                      <p className="text-[11px] text-slate-400 tabular-nums">{p.estimatedDays} hari kerja</p>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-semibold rounded-md ${
                          p.status === 'Selesai'
                            ? 'bg-emerald-100 text-emerald-800'
                            : p.status === 'Berlangsung'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                          p.approvalStatus === 'Disetujui'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {p.approvalStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        {onNavigateToAssignment && (
                          <button
                            onClick={() => onNavigateToAssignment(p)}
                            className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-300 transition-colors"
                            title="Terbitkan Surat Perintah Tugas (SPT) dari PKPT ini"
                          >
                            <CalendarCheck className="w-3 h-3 text-emerald-700" />
                            <span>Terbitkan SPT</span>
                          </button>
                        )}
                        {isKepalaSPI && (
                          <>
                            <button
                              onClick={() => openEditModal(p)}
                              className="p-1 text-slate-500 hover:text-emerald-700 rounded-md transition-colors"
                              title="Edit PKPT"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(p.id)}
                              className="p-1 text-slate-500 hover:text-rose-600 rounded-md transition-colors"
                              title="Hapus PKPT"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit PKPT */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-[#0d3824] to-[#105234] text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">
                {editingPkpt ? 'Ubah Rencana Kerja PKPT' : 'Penyusunan Rencana Audit Tahunan (PKPT)'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-emerald-200 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              {/* Referensi RKA (Mempengaruhi Skor Prioritas) */}
              <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-2">
                <label className="block font-bold text-emerald-950 flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-emerald-700" />
                  <span>Referensi Program RKA (Mempengaruhi Skor Prioritas PKPT)</span>
                </label>
                <select
                  value={formRkaId}
                  onChange={(e) => handleSelectRkaInModal(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg font-medium text-slate-800"
                >
                  <option value="">-- Tidak Terkait Item RKA Spesifik (Hanya Basis Risiko) --</option>
                  {modalRkaOptions.map((r) => (
                    <option key={r.id} value={r.id}>
                      [{r.code}] {r.programName} — Rp {(r.budgetAmount || 0).toLocaleString('id-ID')} ({r.strategicPriority})
                    </option>
                  ))}
                </select>
                {selectedRkaObj && (
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-emerald-900 pt-1">
                    <span>
                      Pagu RKA: <strong className="font-mono">Rp {(selectedRkaObj.budgetAmount || 0).toLocaleString('id-ID')}</strong>
                    </span>
                    <span>·</span>
                    <span>
                      Bobot RKA (40%): <strong className="font-mono">{selectedRkaWeight}/100</strong>
                    </span>
                    <span>·</span>
                    <span>
                      Skor Risiko Unit (60%): <strong className="font-mono">{formRiskScore}/25</strong>
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Judul Kegiatan / Objek Audit</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-600 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pemilik Risiko / Auditee</label>
                  <select
                    value={formUnitId}
                    onChange={(e) => {
                      const uid = e.target.value;
                      setFormUnitId(uid);
                      const unitRisk = getUnitMaxRiskScore(uid, formYear);
                      setFormRiskScore(unitRisk);
                      setFormPriorityScore(
                        computeCompositePriorityScore(unitRisk, selectedRkaObj ? selectedRkaWeight : undefined)
                      );
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jenis Pemeriksaan</label>
                  <select
                    value={formAuditType}
                    onChange={(e) => setFormAuditType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    {AUDIT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Proses Bisnis Terkait</label>
                <input
                  type="text"
                  required
                  value={formBusinessProcess}
                  onChange={(e) => setFormBusinessProcess(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tujuan Pemeriksaan</label>
                <textarea
                  rows={2}
                  required
                  value={formObjective}
                  onChange={(e) => setFormObjective(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ruang Lingkup Pemeriksaan</label>
                <textarea
                  rows={2}
                  required
                  value={formScope}
                  onChange={(e) => setFormScope(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tahun</label>
                  <input
                    type="number"
                    min={2020}
                    max={2100}
                    value={formYear}
                    onChange={(e) => setFormYear(parseInt(e.target.value, 10) || activeYear)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Triwulan</label>
                  <select
                    value={formQuarter}
                    onChange={(e) => setFormQuarter(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                  >
                    <option value="Q1">Q1</option>
                    <option value="Q2">Q2</option>
                    <option value="Q3">Q3</option>
                    <option value="Q4">Q4</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Estimasi Hari</label>
                  <input
                    type="number"
                    value={formEstimatedDays}
                    onChange={(e) => setFormEstimatedDays(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Skor Risiko (1-25)</label>
                  <input
                    type="number"
                    min={1}
                    max={25}
                    value={formRiskScore}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10) || 1;
                      setFormRiskScore(val);
                      setFormPriorityScore(
                        computeCompositePriorityScore(val, selectedRkaObj ? selectedRkaWeight : undefined)
                      );
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Skor Prioritas</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={formPriorityScore}
                    onChange={(e) => setFormPriorityScore(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status Pelaksanaan</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                  >
                    <option value="Rencana">Rencana</option>
                    <option value="Berlangsung">Sedang Berlangsung</option>
                    <option value="Selesai">Selesai</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status Pengesahan Kepala SPI</label>
                  <select
                    value={formApprovalStatus}
                    onChange={(e) => setFormApprovalStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                  >
                    <option value="Draft">Draft Usulan</option>
                    <option value="Disetujui">Disetujui Kepala SPI</option>
                    <option value="Ditolak">Ditolak</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Alasan Penyesuaian / Override Manual (Jika Ada)</label>
                <input
                  type="text"
                  value={formManualOverrideReason}
                  onChange={(e) => setFormManualOverrideReason(e.target.value)}
                  placeholder="Instruksi khusus Direktur / perubahan regulasi mendadak..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm"
                >
                  Simpan Rencana PKPT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Print Modal with Fitur Jabatan */}
      {isPrintModalOpen && (
        <DocumentPrintPreviewModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          documentTitle="PROGRAM KERJA PENGAWASAN TAHUNAN (PKPT) BERBASIS RISIKO & RKA"
          documentSubtitle={`Tahun Anggaran ${selectedYear === 0 ? 'Multi Tahun' : selectedYear}`}
          documentNumber={`PKPT/SPI-PTS/${selectedYear === 0 ? activeYear : selectedYear}`}
          initialSignatory1Role="Kepala Satuan Pengawasan Intern"
          initialSignatory2Role="Direktur Perumda Air Minum Tirta Saiyo"
          defaultShowSignatory2={true}
        >
          {() => (
            <div className="space-y-5 text-xs font-serif leading-relaxed">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 grid grid-cols-3 gap-3 font-sans text-xs">
                <div>
                  <p className="text-slate-500">Tahun Anggaran:</p>
                  <p className="font-bold text-slate-900">{selectedYear === 0 ? 'Semua Tahun' : selectedYear}</p>
                </div>
                <div>
                  <p className="text-slate-500">Jumlah Penugasan Pengawasan:</p>
                  <p className="font-bold text-emerald-800">{filteredPkpt.length} Objek Pengawasan</p>
                </div>
                <div>
                  <p className="text-slate-500">Total Hari Kerja Pemeriksaan:</p>
                  <p className="font-bold text-slate-800">{filteredPkpt.reduce((a, b) => a + (b.estimatedDays || 0), 0)} Hari Pemeriksaan</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 font-sans uppercase tracking-wider text-xs border-b border-slate-300 pb-1">
                  Matriks Rencana Pengawasan Intern Berbasis Risiko & RKA:
                </h4>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] border-collapse border border-slate-300 font-sans">
                    <thead>
                      <tr className="bg-slate-100 font-bold text-slate-800 border-b border-slate-300">
                        <th className="p-2 border border-slate-300 w-8 text-center">No</th>
                        <th className="p-2 border border-slate-300">Pemilik Risiko, Objek Pengawasan & Ref. RKA</th>
                        <th className="p-2 border border-slate-300 w-28">Jenis Audit</th>
                        <th className="p-2 border border-slate-300 w-16 text-center">Jadwal</th>
                        <th className="p-2 border border-slate-300 w-16 text-center">Durasi</th>
                        <th className="p-2 border border-slate-300 w-20 text-center">Skor Prioritas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredPkpt.map((p, idx) => (
                        <tr key={p.id}>
                          <td className="p-2 border border-slate-300 text-center font-bold">{idx + 1}</td>
                          <td className="p-2 border border-slate-300">
                            <p className="font-bold text-slate-900">{p.title}</p>
                            <p className="text-[10px] text-slate-600">
                              Unit: {p.unitName} · Proses: {p.businessProcess}
                            </p>
                            {p.rkaCode && (
                              <p className="text-[10px] text-emerald-800 font-semibold">
                                Ref RKA: {p.rkaCode} (Rp {(p.rkaBudget || 0).toLocaleString('id-ID')})
                              </p>
                            )}
                          </td>
                          <td className="p-2 border border-slate-300">{p.auditType}</td>
                          <td className="p-2 border border-slate-300 text-center font-bold text-emerald-800">{p.quarter}</td>
                          <td className="p-2 border border-slate-300 text-center">{p.estimatedDays} Hari</td>
                          <td className="p-2 border border-slate-300 text-center font-mono font-bold text-slate-800">
                            {p.priorityScore}
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
    </div>
  );
};
