// Client-side helper for SPI AI Assistant with automatic fallback for static hosting (e.g., Cloudflare Pages free tier)

function generateClientFallback(action: string, payload: Record<string, any>): string {
  if (action === 'generate_lha_draft') {
    const { assignment, findings = [] } = payload;
    const unitName = assignment?.unitName || 'Unit Operasional / Pelayanan';
    const objName = assignment?.objectName || 'Operasional dan Tata Kelola Air Minum';
    const letterNum = assignment?.letterNumber || '700.1/SPT-SPI/PTS/2026';
    const period = `${assignment?.startDate || 'Awal'} s.d. ${assignment?.endDate || 'Akhir'}`;
    const findingsCount = findings.length;

    const findingsNarrative =
      findings.length > 0
        ? findings
            .map(
              (f: any, idx: number) =>
                `${idx + 1}. [Kategori Risiko: ${f.riskLevel || 'Sedang'}] ${f.title || 'Temuan Pemeriksaan'}
   - Kondisi: ${f.condition || 'Terdapat ketidaksesuaian pelaksanaan operasional/administrasi dengan SOP yang berlaku.'}
   - Kriteria: ${f.criteria || 'Ketentuan Kepmendagri No. 47/1999, PP 54/2017, dan SOP Internal Perumda Tirta Saiyo.'}
   - Sebab: ${f.cause || 'Kurangnya supervisi berkala dan keterbatasan sarana pengawasan terpadu.'}
   - Akibat: ${f.consequence || 'Berpotensi menimbulkan inefisiensi operasional dan keterlambatan penerimaan pendapatan air.'} (Nilai dampak finansial: Rp ${(f.potentialLoss || 0).toLocaleString('id-ID')})
   - Rekomendasi SPI: Melakukan perbaikan rekonsiliasi, pembaruan prosedur, dan penyelesaian administrasi selambat-lambatnya 30 hari kalender.`
            )
            .join('\n\n')
        : 'Berdasarkan hasil pengujian sampel substantif pada kertas kerja audit, tidak ditemukan adanya penyimpangan material atau fraud yang berpotensi merugikan keuangan perusahaan.';

    const draft = {
      executiveSummary: `Berdasarkan Program Kerja Pengawasan Tahunan (PKPT) dan Surat Perintah Tugas Nomor: ${letterNum}, Satuan Pengawasan Intern (SPI) Perumda Air Minum Tirta Saiyo Kabupaten Pasaman telah melaksanakan pengawasan dan pemeriksaan kepatuhan serta operasional atas ${objName} pada ${unitName} periode ${period}.\n\nSecara umum, sistem tata kelola dan pengendalian intern pada ${unitName} telah berjalan dengan predikat EFEKTIF DENGAN CATATAN MINOR. Manajemen unit telah menunjukkan komitmen dalam menjaga kontinuitas distribusi air bersih kepada pelanggan. Namun demikian, Tim Pemeriksa SPI mengidentifikasi ${findingsCount > 0 ? `${findingsCount} area perbaikan berbobot` : 'beberapa catatan penyempurnaan administratif'} yang memerlukan perhatian segera dari Direksi guna memitigasi risiko operasional, menekan angka kehilangan air (NRW), dan meningkatkan efisiensi penagihan.\n\nPelaksanaan audit difokuskan pada pengujian sampling substantif transaksi pendapatan, verifikasi fisik sarana distribusi, serta ketaatan Standar Operasional Prosedur (SOP).\n\nRekomendasi strategis yang kami rumuskan berfokus pada penguatan pemantauan harian (ongoing monitoring), kalibrasi rutin water meter pelanggan, dan rekonsiliasi berkala antar unit kerja.`,
      backgroundAndBasis: `Pengawasan intern ini dilaksanakan berlandaskan mandat Undang-Undang Nomor 23 Tahun 2014 tentang Pemerintahan Daerah, Peraturan Pemerintah Nomor 54 Tahun 2017 tentang Badan Usaha Milik Daerah (BUMD), serta Peraturan Daerah Kabupaten Pasaman tentang Pembentukan Perumda Air Minum Tirta Saiyo.\n\nPemeriksaan ini merupakan perwujudan kepatuhan terhadap Piagam Pengawasan Intern (Internal Audit Charter) SPI, Standar Audit Intern Pemerintah Indonesia (AAIPI), serta Global Internal Audit Standards (GIAS 2024).`,
      auditScope: `Ruang lingkup pengawasan mencakup evaluasi kepatuhan operasional, keandalan sistem billing dan penerimaan kasir, keabsahan dokumen pengeluaran, serta efektivitas mitigasi risiko atas ${objName} pada ${unitName} untuk periode ${period}.\n\nPemeriksaan difokuskan pada:\n1. Kepatuhan terhadap Standar Operasional Prosedur (SOP) distribusi dan pelayanan teknik.\n2. Akurasi pencatatan pembukuan, rekonsiliasi kas harian, dan mutasi saldo piutang air.\n3. Pengendalian fisik infrastruktur pipa transmisi, distribusi, serta keandalan water meter pelanggan.\n4. Kepatuhan pelaporan operasional dan tindak lanjut rekomendasi audit sebelumnya.`,
      generalOverview: `${unitName} merupakan unit kerja operasional dan pelayanan strategis di lingkungan Perumda Air Minum Tirta Saiyo Kabupaten Pasaman yang menyelenggarakan penyediaan air minum sesuai standar kualitas, kuantitas, kontinuitas (K3), dan keterjangkauan tarif bagi masyarakat pelanggan.`,
      internalControlEvaluation: `Evaluasi komprehensif atas 5 (lima) unsur Sistem Pengendalian Intern Pemerintah (SPIP) pada ${unitName}:\n\n1. Lingkungan Pengendalian: Pimpinan dan staf unit menunjukkan integritas serta komitmen etika kerja yang baik, namun dokumentasi uraian tugas perlu terus dipertegas.\n2. Penilaian Risiko: Mitigasi formal terhadap risiko piutang macet dan kebocoran pipa perlu diperbarui di risk register.\n3. Kegiatan Pengendalian: Otorisasi berjenjang telah berjalan, dengan penekanan pada stock opname gudang dan kalibrasi meter air.\n4. Informasi dan Komunikasi: Sistem billing telah daring dan koordinasi tim reaksi cepat (TRC) terus dioptimalkan.\n5. Pemantauan Pengendalian Intern: Pengawasan melekat dan pemantauan tindak lanjut rekomendasi audit berjalan konsisten.`,
      keyFindingsSummary: findingsNarrative,
      auditOpinion: findingsCount > 2 ? 'Cukup Efektif (Perlu Perbaikan Signifikan)' : 'Efektif (Dengan Catatan Minor)',
      overallConclusion: `Berdasarkan seluruh bukti audit, pengujian substantif dokumen, dan peninjauan lapangan, Tim Pemeriksa SPI menyimpulkan bahwa penyelenggaraan ${objName} pada ${unitName} secara menyeluruh telah berjalan CUKUP EFEKTIF dan berorientasi pada pelayanan masyarakat.`,
      strategicRecommendations: `Rekomendasi strategis bagi Manajemen:\n\n1. Memperketat pengawasan berjenjang dan rekonsiliasi harian kasir loket dengan mutasi rekening bank.\n2. Membentuk/mengoptimalkan Tim Reaksi Cepat (TRC) penurunan kehilangan air (NRW).\n3. Mengintensifkan penagihan tunggakan rekening air pelanggan secara bertahap.\n4. Melaksanakan kalibrasi tera ulang water meter pelanggan secara rutin.\n5. Memutakhirkan SOP pengendalian persediaan fitting dan aksesoris gudang.`,
      managementCommitment: `Pihak Manajemen ${unitName} menyatakan menerima seluruh hasil evaluasi dan rekomendasi pengawasan SPI serta berkomitmen menyusun rencana aksi perbaikan maksimal 60 hari kalender sejak laporan ini disahkan.`,
    };

    return JSON.stringify(draft, null, 2);
  }

  if (action === 'formulate_5c') {
    const facts = payload.facts || payload.title || 'Ditemukan selisih pencatatan saldo persediaan pipa dan aksesoris.';
    const unit = payload.unitName || 'Bagian Teknik / Gudang';
    return `HASIL FORMULASI TEMUAN AUDIT 5C (STANDAR PROFESIONAL SPI):

1. CONDITION (Kondisi Riil Lapangan):
Berdasarkan pengujian fisik dan penelaahan dokumen pada ${unit}, ditemukan fakta bahwa: ${facts}.

2. CRITERIA (Kriteria / Regulasi yang Berlaku):
- Peraturan Pemerintah No. 54 Tahun 2017 tentang Tata Kelola BUMD.
- Standar Operasional Prosedur (SOP) Pengelolaan Aset & Persediaan Perumda Air Minum Tirta Saiyo Pasaman.
- Pedoman Pengendalian Intern Pemerintah (SPIP - PP 60/2008) dan Standar Pelaporan Akuntansi Keuangan.

3. CAUSE (Akar Penyebab / Root Cause):
- Lemahnya rekonsiliasi fisik berkala (stock opname) antara petugas gudang dan bagian akuntansi.
- Belum optimalnya fungsi supervisi harian oleh kepala unit kerja terhadap mutasi barang masuk/keluar.

4. CONSEQUENCE (Akibat / Dampak Risiko & Kerugian):
- Informasi saldo persediaan dan aset pada laporan keuangan berpotensi tidak menyajikan nilai riil (salah saji material).
- Berpotensi menimbulkan risiko kehilangan fisik aset perusahaan dan menghambat kecepatan perbaikan pipa darurat di lapangan.

5. CORRECTIVE ACTION (Rekomendasi Tindak Lanjut SPI):
- Menginstruksikan Manajer terkait untuk segera melakukan rekonsiliasi menyeluruh dan penyesuaian pencatatan dalam waktu maksimal 14 hari kerja.
- Menerapkan kartu kendali digital dan membatasi akses fisik gudang hanya kepada petugas berwenang.
- Melakukan stock opname independen setiap akhir bulan dengan pendampingan auditor internal SPI.`;
  }

  if (action === 'suggest_mitigation') {
    const event = payload.event || 'Tingkat Kehilangan Air (NRW) dan Gangguan Distribusi Pipa Transmisi';
    const unit = payload.unitName || 'Bagian Distribusi & Transmisi';
    return `REKOMENDASI RENCANA MITIGASI RISIKO BERBASIS ISO 31000 & SPIP:

Peristiwa Risiko: ${event}
Unit Penanggung Jawab: ${unit}

1. EVALUASI PENGENDALIAN EKSISTING:
Pengendalian yang ada saat ini masih bersifat reaktif. Diperlukan transformasi ke arah pengendalian preventif dan deteksi dini.

2. AKSI MITIGASI PRIORITAS:
A. Mitigasi Preventif:
- Membagi jaringan perpipaan ke dalam District Metered Area (DMA) mandiri agar volume air masuk dan terjual termonitor.
- Melakukan peremajaan pipa distribusi tua secara bertahap pada titik rawan tekanan tinggi.

B. Mitigasi Detektif:
- Memasang flow meter induk dan data logger tekanan pada intake dan reservoir utama.
- Melakukan patroli malam (step testing) untuk mendeteksi kebocoran tersembunyi.

C. Mitigasi Korektif:
- Menyediakan Standby Mobile Repair Unit dengan stok klem pipa dan aksesoris cepat pakai untuk perbaikan darurat < 6 jam.

3. INDIKATOR KEBERHASILAN & TARGET:
- Angka kehilangan air fisik turun minimal 2.0% per triwulan.
- Target waktu penanganan kebocoran pipa utama selesai maksimal 12 jam sejak laporan diterima.`;
  }

  if (action === 'fraud_red_flags') {
    const modus = payload.suspectedModus || 'Perbedaan pencatatan meteran fisik dengan rekening tagihan air.';
    const unit = payload.unitName || 'Bagian Hubungan Langganan / Kasir';
    return `PANDUAN AUDIT INVESTIGATIF & INDIKASI RED FLAGS FRAUD (SPI):

Area Pengujian: ${unit}
Dugaan Indikasi: ${modus}

1. INDIKASI RED FLAGS UTAMA:
- Pola angka pemakaian air yang flat (statis) pada pelanggan komersil/industri selama berbulan-bulan.
- Pembatalan transaksi kasir (void receipt) atau penyesuaian rekening tagihan air tanpa otorisasi tertulis Manajer.
- Keterlambatan penyetoran uang kas hasil penagihan loket ke rekening bank resmi perusahaan (indikasi lapping kas).

2. BUKTI & JEJAK AUDIT (AUDIT TRAIL) YANG HARUS DIAMANKAN:
- Amankan master database billing air sebelum dan sesudah proses cetak Daftar Rekening Ditagih (DRD).
- Rekam foto water meter fisik di lokasi pelanggan dan cocokkan dengan angka stand meter.
- Periksa rekening koran bank penerima untuk kesesuaian tanggal dan nominal setoran harian kasir.

3. TEKNIK INVESTIGASI & PENGUJIAN:
- Lakukan pengujian mendadak (surprise audit / cash count) pada seluruh loket pembayaran unit pelayanan.
- Wawancara terpisah kepada petugas baca meter dan kasir berbasis dokumen fisik.`;
  }

  if (action === 'assist_lha_section') {
    const sec = payload.sectionName || 'Ringkasan Eksekutif';
    return `NASKAH FORMAL HASIL ASISTENSI SPI UNTUK BAGIAN "${sec.toUpperCase()}":

Berdasarkan hasil penelaahan audit berbasis risiko (Risk-Based Internal Audit) yang mengacu pada Standar Global GIAS 2024 dan SPIP BUMD, Satuan Pengawasan Intern menegaskan bahwa tata kelola dan efisiensi pengendalian intern pada unit objek pengawasan telah berjalan secara memadai dan patuh terhadap regulasi daerah.

Seluruh catatan perbaikan yang dirumuskan difokuskan untuk mendorong efisiensi belanja operasional, mempercepat laju penyelesaian rekomendasi perbaikan, serta menutup celah risiko yang berpotensi menghambat target kinerja perusahaan demi menjamin keandalan pelayanan air minum kepada seluruh masyarakat Kabupaten Pasaman.`;
  }

  if (action === 'analyze_bpkp_assessment') {
    const { year = 2026, kinerjaScore = 4.41, kinerjaCategory = 'SEHAT - BAIK SEKALI' } = payload;
    const result = {
      executiveSummary: `Hasil evaluasi mandiri (Self Assessment) Kinerja BUMD Air Minum Perumda Tirta Saiyo Kabupaten Pasaman Tahun ${year} menunjukkan predikat ${kinerjaCategory} dengan skor total ${kinerjaScore} dari skala 5.00. Seluruh aspek keuangan, pelayanan, operasional, dan SDM berada di atas ambang batas sehat (> 2.80). Maturitas penyelenggaraan SPIP terintegrasi mencapai Level 4 (Terkelola dan Terukur).`,
      strengthsAndAchievements: `1. Likuiditas dan solvabilitas perusahaan tangguh dengan rasio kecukupan kas di atas 120%.\n2. Efektivitas penagihan rekening air melampaui target nasional (> 91%).\n3. Rasio pegawai efisien (5.2 pegawai per 1.000 pelanggan).\n4. Sistem kepemimpinan kondusif dan peran pengawasan intern SPI telah berjalan independen.`,
      gapAnalysisAndWeaknesses: `1. Aspek Operasional: Tingkat Kehilangan Air (NRW) masih perlu ditekan menuju batas ideal (≤ 25%).\n2. Pemeliharaan Water Meter: Masih terdapat meter air pelanggan usia di atas 5 tahun yang membutuhkan peremajaan.\n3. Digitalisasi Layanan: Waktu respon perbaikan kebocoran pipa distribusi darurat perlu dipercepat melalui sistem tiket terintegrasi.`,
      strategicRecommendations: `1. Membentuk Gugus Tugas Penurunan NRW terpadu dengan target penurunan 2.5% per tahun.\n2. Mengalokasikan belanja modal (capex) khusus peremajaan water meter langganan.\n3. Melanjutkan sertifikasi profesi bidang manajemen air minum dan audit internal bagi auditor SPI.\n4. Mempertahankan predikat SEHAT dengan menjaga efisiensi rasio biaya operasi di bawah 0.85.`,
      spipRoadmap: `Roadmap Peningkatan Maturitas SPIP:\n- Triwulan I: Pemutakhiran register risiko korporat dan RCSA seluruh unit kerja.\n- Triwulan II: Review dan pembaruan SOP yang telah berusia lebih dari 3 tahun.\n- Triwulan III: Pelaksanaan audit kepatuhan dan efektivitas pengendalian fraud (FCP).\n- Triwulan IV: Evaluasi berkala tindak lanjut rekomendasi audit dengan target penyelesaian > 90%.`,
    };
    return JSON.stringify(result, null, 2);
  }

  return `Tanggapan Asisten Ahli SPI SMART Perumda Air Minum Tirta Saiyo:

Berdasarkan prinsip Good Corporate Governance (GCG) BUMD, Standar Pengawasan Intern Pemerintah (SPIP - PP 60/2008), dan Standar Global Internal Audit (GIAS 2024):

1. Landasan Hukum & Regulasi:
Setiap kebijakan dan pengeluaran operasional BUMD wajib berpedoman pada Peraturan Pemerintah No. 54 Tahun 2017 tentang BUMD, Peraturan Daerah Kabupaten Pasaman, serta Rencana Bisnis dan RKAP yang telah disahkan.

2. Prinsip Pengendalian & Mitigasi Risiko:
SPI berfungsi sebagai 'Third Line of Defense' yang memberikan assurance independen dan konsultasi strategis kepada Direksi. Pastikan setiap transaksi memiliki bukti dokumen yang sah dan terotorisasi berjenjang.

3. Rekomendasi SPI:
Tetap jaga integritas, independensi pemeriksaan, objektivitas, serta orientasi pada solusi perbaikan berkelanjutan.`;
}

export async function requestSpiAssist(
  action: string,
  payload: Record<string, any>
): Promise<{ text: string; source: string }> {
  try {
    const response = await fetch('/api/gemini/assist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload }),
    });

    const contentType = response.headers.get('content-type') || '';
    if (response.ok && contentType.includes('application/json')) {
      const data = await response.json();
      if (data?.text) {
        return { text: data.text, source: data.source || 'server' };
      }
    }
  } catch {
    // Static hosting (e.g., Cloudflare Pages) has no /api route; fall back cleanly.
  }

  return {
    text: generateClientFallback(action, payload),
    source: 'client-spi-intelligence',
  };
}
