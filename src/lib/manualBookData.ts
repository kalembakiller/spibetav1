export interface ManualTable {
  caption?: string;
  headers: string[];
  rows: string[][];
}

export interface ManualSubSection {
  title: string;
  paragraphs: string[];
  bullets?: string[];
  callout?: {
    title: string;
    text: string;
  };
  table?: ManualTable;
}

export interface ManualChapter {
  id: string;
  number: string;
  title: string;
  summary: string;
  subsections: ManualSubSection[];
}

export const MANUAL_BOOK_CHAPTERS: ManualChapter[] = [
  {
    id: 'bab-1',
    number: 'BAB I',
    title: 'Pendahuluan, Arsitektur Sistem & Hak Akses Pengguna (RBAC)',
    summary:
      'Gambaran umum aplikasi pengawasan intern berbasis risiko, struktur peran pengguna, tata cara masuk sistem (login), dan pengelolaan keamanan akses.',
    subsections: [
      {
        title: '1.1 Tujuan dan Ruang Lingkup Aplikasi',
        paragraphs: [
          'Sistem Informasi Pengawasan Intern (SPI SMART) adalah platform terpadu yang dirancang untuk mendukung seluruh siklus tata kelola pengawasan intern berbasis risiko (Risk-Based Internal Auditing), mulai dari pemetaan Pemilik Risiko, penyusunan Register Risiko 5x5, input Rencana Kerja dan Anggaran (RKA), penyusunan PKPT, pelaksanaan audit (SPT, PKA, KKA, LHA), hingga pemantauan tindak lanjut rekomendasi oleh unit kerja.',
          'Aplikasi terhubung secara real-time dengan basis data awan (Cloud Firestore) sehingga setiap pembaruan data dapat dipantau langsung oleh pimpinan, tim pemeriksa, dan unit kerja sesuai kewenangan masing-masing.',
        ],
      },
      {
        title: '1.2 Matriks Peran & Hak Akses Pengguna (Role-Based Access Control)',
        paragraphs: [
          'Setiap pengguna memiliki peran (role) yang menentukan menu dan tindakan yang dapat dilakukan di dalam aplikasi:',
        ],
        table: {
          caption: 'Tabel 1.1 Matriks Peran dan Kewenangan Menu Utama',
          headers: ['Peran (Role)', 'Cakupan Akses Utama', 'Kewenangan Khusus'],
          rows: [
            [
              'KEPALA_SPI / ADMIN_SISTEM (Super User)',
              'Seluruh modul perencanaan, pelaksanaan audit, temuan, investigasi, regulasi, dan tata kelola sistem.',
              'Persetujuan akun baru, persetujuan PKPT & LHA, sinkronisasi LHA ke Temuan 5C otomatis, hapus bukti tindak lanjut, input kategori RKA manual, ubah logo & tanda tangan digital.',
            ],
            [
              'AUDITOR',
              'Dashboard Peta Risiko 5x5, Register Risiko Korporat, dan Tindak Lanjut Rekomendasi (sesuai pembatasan portal non-admin) atau penugasan terkait.',
              'Melihat sebaran risiko korporat dan memantau progres tindak lanjut unit kerja.',
            ],
            [
              'DIREKTUR / DEWAN_PENGAWAS',
              'Dashboard Peta Risiko Korporat (Heat Map 5x5), Register Risiko 5x5, dan pemantauan Tindak Lanjut.',
              'Pemantauan eksekutif risiko residual tertinggi dan status penyelesaian rekomendasi.',
            ],
            [
              'AUDITEE (Unit Kerja)',
              'Dashboard Peta Risiko Korporat, Register Risiko Unit Kerja Sendiri, dan Tindak Lanjut Rekomendasi Unit Kerja Sendiri.',
              'Menginput & memperbarui risiko unit kerjanya saja, serta melaporkan aksi perbaikan & tautan (link) bukti tindak lanjut unitnya saja.',
            ],
          ],
        },
      },
      {
        title: '1.3 Tata Cara Masuk Sistem (Login) & Pendaftaran Akun',
        paragraphs: [
          'Pengguna dapat masuk ke aplikasi melalui halaman Login menggunakan salah satu dari dua metode resmi:',
        ],
        bullets: [
          'Login Kredensial Akun: Masukkan Username atau Email serta Kata Sandi yang telah diaktifkan oleh Kepala SPI / Admin Sistem.',
          'Login dengan Google: Klik tombol Masuk dengan Google. Pengguna baru yang mendaftar via Google akan berstatus Menunggu Persetujuan (Pending) hingga diaktifkan dan ditetapkan unit kerjanya oleh Kepala SPI pada menu Manajemen Pengguna.',
          'Ganti Kata Sandi & Profil: Klik nama/ikon profil di pojok kanan atas bilah atas (Navbar) untuk memperbarui nama tampilan atau mengganti kata sandi secara mandiri.',
        ],
      },
    ],
  },
  {
    id: 'bab-2',
    number: 'BAB II',
    title: 'Navigasi Utama & Pengaturan Tahun Anggaran (Multi-Tahun)',
    summary:
      'Cara menavigasi antarmuka aplikasi dan menggunakan pemilih Tahun Anggaran global agar aplikasi dapat dipakai untuk tahun-tahun berikutnya.',
    subsections: [
      {
        title: '2.1 Struktur Antarmuka Utama',
        paragraphs: [
          'Layar aplikasi terbagi menjadi tiga komponen utama: Bilah Samping Kiri (Sidebar) untuk berpindah antar modul, Bilah Atas (Navbar) untuk melihat judul halaman, pemilih Tahun Anggaran, notifikasi akun baru, Asisten AI SPI, dan profil pengguna, serta Area Kerja Utama di bagian tengah.',
        ],
      },
      {
        title: '2.2 Penggunaan Fitur Multi-Tahun untuk Tahun Berikutnya',
        paragraphs: [
          'Aplikasi mendukung penuh penggunaan lintas tahun untuk perencanaan, pencatatan risiko, penganggaran, dan pengawasan di tahun-tahun mendatang (2026, 2027, 2028, 2029, dan seterusnya).',
        ],
        bullets: [
          'Pemilih Tahun Global (Navbar): Di pojok kanan atas terdapat dropdown "Tahun". Mengubah tahun di sini akan otomatis menyinkronkan filter tahun pada Dashboard, Input RKA Manual, PKPT, Program SPI, Register Risiko, RCSA, dan Temuan Audit.',
          'Menambah Tahun Baru (+ Tambah Tahun Lain...): Pilih opsi "+ Tambah Tahun Lain..." pada dropdown Tahun di Navbar, lalu masukkan angka tahun yang diinginkan (misalnya 2030). Tahun tersebut akan tersimpan otomatis dan langsung aktif.',
          'Filter "Semua Tahun": Pada tiap modul tersedia pilihan "Semua Tahun" untuk melihat rekapitulasi historis lintas tahun anggaran sekaligus.',
          'Input Tahun pada Formulir: Setiap form tambah/ubah data (RKA, PKPT, Register Risiko, RCSA, Temuan 5C, Program SPI) memiliki kolom Tahun sehingga operator dapat menyusun rencana kerja tahun berikutnya jauh sebelum tahun berjalan dimulai.',
        ],
        callout: {
          title: 'Catatan Praktis Penyusunan Tahun Berikutnya',
          text: 'Untuk mulai menyusun RKA dan PKPT tahun berikutnya (misal 2027 atau 2028), cukup pilih tahun tersebut pada pemilih Tahun di Navbar, lalu input RKA dan PKPT seperti biasa.',
        },
      },
    ],
  },
  {
    id: 'bab-3',
    number: 'BAB III',
    title: 'Pemilik Risiko, Register Risiko 5x5 & Penilaian RCSA Unit',
    summary:
      'Panduan lengkap pemetaan struktur pemilik risiko, pengisian register risiko berstandar Matriks 5x5 SPIP/ISO 31000, serta penilaian mandiri kontrol unit (RCSA).',
    subsections: [
      {
        title: '3.1 Modul Pemilik Risiko',
        paragraphs: [
          'Modul Pemilik Risiko (pada bagian Perencanaan Berbasis Risiko) berfungsi mencatat seluruh unit kerja, bidang operasional, pimpinan, dan unit pelayanan yang menjadi pemilik risiko sekaligus objek pengawasan.',
        ],
        bullets: [
          'Klik "Tambah Pemilik Risiko" untuk mendaftarkan unit kerja baru beserta kode singkat, kategori struktur, nama kepala/penanggung jawab, lokasi wilayah, dan status aktif.',
          'Gunakan tombol "Ekspor Excel" untuk mengunduh daftar lengkap Pemilik Risiko dalam format .xlsx.',
        ],
      },
      {
        title: '3.2 Modul Register Risiko Korporat (Matriks 5x5)',
        paragraphs: [
          'Register Risiko digunakan oleh Unit Kerja (Auditee) maupun Tim SPI untuk mendokumentasikan sasaran unit, peristiwa risiko, akar penyebab 5M (Man, Money, Material, Machine, Methode), dampak, pengendalian berjalan, serta rencana mitigasi.',
          'Bagi pengguna dengan peran AUDITEE, kolom Unit Kerja terkunci otomatis sesuai unit kerjanya masing-masing sehingga setiap unit hanya dapat mengisi dan mengubah risiko unitnya sendiri.',
        ],
        table: {
          caption: 'Tabel 3.1 Skala Tingkat Risiko Matriks 5x5 (Skor = Kemungkinan x Dampak)',
          headers: ['Rentang Skor', 'Tingkat Risiko', 'Tindakan / Respon Tata Kelola'],
          rows: [
            ['20 - 25', 'Sangat Tinggi (Ekstrem)', 'Prioritas mitigasi Direksi / tindakan darurat & prioritas utama audit PKPT.'],
            ['12 - 16', 'Tinggi', 'Mitigasi aktif oleh Kepala Unit & pemantauan intensif bulanan.'],
            ['5 - 10', 'Sedang', 'Pengendalian berkala triwulanan sesuai SOP yang berlaku.'],
            ['3 - 4', 'Rendah', 'Pemantauan berkala oleh unit kerja pelaksana.'],
            ['1 - 2', 'Sangat Rendah', 'Risiko dapat diterima (Risk Acceptance) dengan pengawasan rutin.'],
          ],
        },
        bullets: [
          'Skor Inheren vs Skor Residual: Aplikasi otomatis menghitung Skor Inheren (sebelum kontrol) dan Skor Residual (setelah memperhitungkan efektivitas kontrol yang ada).',
          'Buku Panduan 5x5: Klik tombol "Buku Panduan 5x5" pada Dashboard atau Register Risiko untuk membuka panduan khusus kaidah perumusan risiko.',
          'Evaluasi Kaidah SPI: Kepala SPI / Admin dapat memberikan catatan evaluasi pada setiap usulan risiko unit kerja dengan status "Sesuai Kaidah" atau "Perlu Perbaikan Kaidah".',
          'Integrasi ke Heat Map Dashboard: Sebaran risiko residual tampil interaktif pada Peta Risiko 5x5 di Dashboard. Mengklik salah satu kotak matriks akan memfilter daftar risiko di bawahnya.',
        ],
      },
      {
        title: '3.3 Modul Penilaian Sendiri Risiko & Kontrol Unit (RCSA)',
        paragraphs: [
          'Modul RCSA memfasilitasi unit kerja untuk menilai efektivitas pengendalian internalnya sendiri (skor 1-5) secara berkala per tahun anggaran, yang kemudian dibandingkan dan direviu oleh SPI.',
        ],
        bullets: [
          'Klik "Isi Lembar RCSA Unit", pilih unit kerja dan tahun penilaian, isi aktivitas yang dinilai, potensi risiko, pengendalian berjalan, penilaian mandiri, serta dokumen pendukung.',
          'Staf SPI dapat menekan tombol "Reviu SPI" pada baris RCSA untuk memasukkan Skor Audit Aktual SPI (1-5), catatan evaluasi, dan menetapkan status "Direviu SPI" atau "Disetujui".',
        ],
      },
    ],
  },
  {
    id: 'bab-4',
    number: 'BAB IV',
    title: 'Self Assessment Kinerja BUMD & Maturitas SPIP Terpadu',
    summary:
      'Tata cara melakukan penilaian mandiri indikator kinerja (Keuangan, Pelayanan, Operasional, SDM) dan maturitas 5 unsur SPIP, serta analisis diagnostik AI.',
    subsections: [
      {
        title: '4.1 Struktur Penilaian & Cara Penggunaan',
        paragraphs: [
          'Modul Self Assessment SPIP menggabungkan dua kerangka penilaian: (1) Indikator Kinerja BUMD Air Minum (4 aspek: Keuangan, Pelayanan, Operasional, SDM) dan (2) Maturitas 5 Unsur SPIP (Lingkungan Pengendalian, Penilaian Risiko, Kegiatan Pengendalian, Informasi & Komunikasi, dan Pemantauan).',
        ],
        bullets: [
          'Menambah Penilaian Tahun Berikutnya: Klik tombol "+ Tahun Baru" lalu masukkan tahun anggaran yang diinginkan untuk membuat dokumen asesmen tahun baru.',
          'Mengedit Nilai & Verifikasi: Aktifkan mode edit untuk memperbarui capaian target/aktual, skor indikator (1-5), referensi bukti, rencana perbaikan, serta catatan verifikasi SPI.',
          'Analisis Diagnostik AI: Pada tab Diagnostik AI, klik tombol analisis untuk menghasilkan ringkasan eksekutif dan rekomendasi strategis berdasarkan skor aktual.',
          'Cetak Resmi: Klik "Cetak Dokumen" untuk mencetak hasil Self Assessment lengkap dengan tanda tangan pejabat.',
        ],
      },
    ],
  },
  {
    id: 'bab-5',
    number: 'BAB V',
    title: 'Input RKA Manual & Pengaruhnya Terhadap Penyusunan PKPT',
    summary:
      'Panduan lengkap modul Input RKA Manual, fitur khusus Super User untuk input Bidang/Kategori Program secara manual, perhitungan bobot materialitas, dan penyusunan PKPT berbasis risiko + RKA.',
    subsections: [
      {
        title: '5.1 Pengelolaan Data RKA (Rencana Kerja dan Anggaran)',
        paragraphs: [
          'Modul "Input RKA Manual" memungkinkan pencatatan program kerja beserta pagu anggaran dan realisasinya per Pemilik Risiko / Unit Kerja untuk setiap tahun anggaran.',
        ],
        bullets: [
          'Klik "Input RKA Manual" untuk mengisi Tahun Anggaran, Kode Rekening/Program (misal RKA-2027-001), Target Triwulan (Q1-Q4), Nama Program, Pemilik Risiko/Unit, Bidang/Kategori Program, Pagu Anggaran (Rp), Realisasi (Rp), Prioritas Strategis (Tinggi/Sedang/Rendah), Status RKA, dan PIC.',
          'Ekspor & Cetak: Tersedia tombol "Ekspor Excel" dan "Cetak RKA" untuk dokumentasi anggaran resmi.',
        ],
      },
      {
        title: '5.2 Fitur Khusus Super User: Input Bidang / Kategori Program Manual',
        paragraphs: [
          'Super User (KEPALA_SPI / ADMIN_SISTEM) memiliki kewenangan penuh untuk menambahkan Bidang / Kategori Program secara manual di luar 6 kategori standar bawaan sistem, melalui dua cara:',
        ],
        bullets: [
          'Cara 1 — Langsung Saat Input/Edit RKA: Di sebelah label "Bidang / Kategori Program" pada modal RKA, klik "+ Input Manual" (atau pilih "+ Input Bidang / Kategori Manual..." di dropdown). Ketikkan nama bidang baru sesuai kebutuhan (misal: "Digitalisasi Layanan & IT"). Centang opsi "Simpan bidang ini ke daftar pilihan RKA" agar tersimpan permanen di Firestore (rka_categories) dan muncul pada dropdown maupun filter di masa mendatang.',
          'Cara 2 — Modal "Kelola Bidang / Kategori": Klik tombol "Kelola Bidang / Kategori" di bagian header modul RKA. Di sini Super User dapat menambah beberapa kategori baru sekaligus maupun menghapus kategori tambahan yang tidak lagi dipakai tanpa merusak data RKA yang sudah ada.',
        ],
      },
      {
        title: '5.3 Rumus Pengaruh RKA Terhadap Skor Prioritas PKPT',
        paragraphs: [
          'Setiap item RKA yang diinput secara otomatis menghasilkan Bobot Materialitas RKA (skala 0 sampai 100) yang dihitung dari kombinasi Prioritas Strategis (Tinggi = 55, Sedang = 35, Rendah = 20) ditambah Bobot Pagu Anggaran (mulai dari +8 hingga +45 untuk pagu >= Rp 1 Miliar).',
          'Saat menyusun PKPT yang dikaitkan dengan item RKA, Skor Prioritas PKPT dihitung secara transparan menggunakan rumus komposit:',
        ],
        callout: {
          title: 'Rumus Komposit Prioritas PKPT Berbasis Risiko & RKA',
          text: 'Skor Prioritas PKPT (1-100) = (60% x Profil Skor Risiko Unit) + (40% x Bobot Materialitas RKA). Jika PKPT tidak dikaitkan ke item RKA tertentu, skor dihitung 100% dari Skor Risiko.',
        },
        bullets: [
          'Kirim Langsung dari RKA ke PKPT: Pada tabel RKA, klik tombol "Ke PKPT ->" pada baris program yang belum terjadwal. Sistem akan langsung membuka modul PKPT dengan judul, unit, triwulan, tujuan audit, pagu, dan skor prioritas terisi otomatis.',
          'Generator Otomatis di PKPT: Pada modul Penyusunan PKPT terdapat banner "Integrasi RKA". Jika masih ada RKA Prioritas Tinggi atau bernilai material (>= Rp 100 Juta) yang belum masuk PKPT, klik tombol "Buat Usulan PKPT dari RKA" untuk menjadwalkannya sekaligus.',
          'Pilih Referensi RKA di Modal PKPT: Saat membuat atau mengedit PKPT secara manual, gunakan kotak "Referensi Program RKA" di bagian atas modal untuk menautkan RKA dan memperbarui skor prioritas PKPT secara otomatis.',
          'Tindak Lanjut ke SPT: Setelah PKPT disetujui Kepala SPI, klik "Terbitkan SPT" pada baris PKPT untuk langsung membuat Surat Perintah Tugas.',
        ],
      },
      {
        title: '5.4 Modul Program Kerja Tahunan Kapabilitas SPI (Non-Audit)',
        paragraphs: [
          'Digunakan untuk mencatat dan memantau program penguatan internal SPI di luar penugasan audit (misal: pembaruan Piagam Audit, pelatihan/sertifikasi auditor, sosialisasi tata kelola) lengkap dengan filter tahun, anggaran RKA SPI, realisasi, dan cetak dokumen.',
        ],
      },
    ],
  },
  {
    id: 'bab-6',
    number: 'BAB VI',
    title: 'Siklus Pelaksanaan Audit: Surat Tugas, PKA, KKA & LHA',
    summary:
      'Panduan alur kerja pelaksanaan pemeriksaan lapangan mulai dari penerbitan Surat Perintah Tugas (SPT), Program Audit (PKA), Kertas Kerja (KKA), hingga Laporan Hasil Audit (LHA).',
    subsections: [
      {
        title: '6.1 Surat Tugas & Tim (SPT)',
        paragraphs: [
          'Penugasan audit dimulai dari penerbitan Surat Perintah Tugas (SPT). SPT dapat dibuat langsung dari PKPT (melalui tombol "Terbitkan SPT") atau diinput baru melalui tombol tambah SPT.',
        ],
        bullets: [
          'Isi Nomor Surat (mengikuti tahun aktif), Dasar Penugasan, Objek & Unit Auditee, Jenis Audit, Pengendali Teknis, Ketua Tim, Anggota Tim, Tujuan, Ruang Lingkup, serta Tanggal Mulai & Selesai.',
          'Gunakan tombol aksi di baris SPT untuk menavigasi langsung ke PKA, KKA, LHA, Temuan 5C, atau mencetak naskah resmi SPT.',
        ],
      },
      {
        title: '6.2 Program Audit (PKA)',
        paragraphs: [
          'PKA merinci langkah-langkah kerja pemeriksaan untuk setiap SPT: tujuan pengujian, risiko yang diuji, kontrol yang dinilai, prosedur pemeriksaan, dokumen yang dibutuhkan, metode uji, ukuran sampel, pelaksana, dan referensi KKA.',
        ],
      },
      {
        title: '6.3 Kertas Kerja Audit (KKA)',
        paragraphs: [
          'KKA merupakan dokumen pembuktian hasil pengujian substantif auditor beserta kesimpulan dan referensi silang.',
        ],
        bullets: [
          'Alur Status KKA: Draft -> Submitted -> Reviewed -> Approved (Kunci/Lock dokumen agar tidak berubah pasca review).',
          'Eskalasi ke Temuan 5C: Apabila pada KKA ditemukan penyimpangan material, auditor dapat menekan tombol eskalasi untuk membawa draf temuan langsung ke modul Temuan Audit (5C).',
        ],
      },
      {
        title: '6.4 Laporan Hasil Audit (LHA) & Sinkronisasi Otomatis ke Temuan 5C',
        paragraphs: [
          'Modul LHA menyusun laporan hasil pengawasan terstruktur dalam 5 tab editor: Informasi Umum & Ruang Lingkup, Ringkasan Eksekutif, Evaluasi Pengendalian Intern, Kesimpulan & Rekomendasi, serta Komitmen & Pengesahan.',
        ],
        bullets: [
          'Asistensi AI SPI: Tersedia tombol bantu AI untuk merangkum KKA dan menyusun narasi draf LHA per bagian maupun seluruh bagian sekaligus.',
          'Alur Persetujuan LHA: Draft -> Review Pengendali Teknis -> Persetujuan Kepala SPI -> Final / Diterbitkan ke Direktur.',
          'Masukkan ke Temuan Audit (5C) Secara Otomatis: Kepala SPI memiliki tombol khusus pada LHA untuk mengekstrak ringkasan temuan dan rekomendasi strategis dari LHA langsung menjadi catatan resmi pada modul Temuan Audit (5C) dan Tindak Lanjut Rekomendasi tanpa harus mengetik ulang satu per satu.',
        ],
      },
    ],
  },
  {
    id: 'bab-7',
    number: 'BAB VII',
    title: 'Temuan Audit (5C) & Pemantauan Tindak Lanjut Rekomendasi',
    summary:
      'Pencatatan matriks temuan 5C, pelaporan bukti aksi tindak lanjut berbasis tautan (link) oleh Unit Kerja, verifikasi SPI, serta penghapusan oleh Super User.',
    subsections: [
      {
        title: '7.1 Matriks Temuan Audit (5C)',
        paragraphs: [
          'Setiap temuan audit didokumentasikan berdasarkan 5 unsur (5C): Condition (Kondisi), Criteria (Kriteria), Cause (Sebab), Consequence (Akibat/Dampak termasuk estimasi Potensi Kerugian dalam Rupiah), serta Corrective Action/Recommendation (Rekomendasi Perbaikan).',
        ],
        bullets: [
          'Filter & Rekap: Filter berdasarkan Tahun Anggaran dan Tingkat Risiko (Kritis, Tinggi, Sedang, Rendah) dengan kalkulasi otomatis total potensi kerugian.',
          'Tambahkan satu atau beberapa Rekomendasi beserta PIC Unit Kerja, Target Tanggal Penyelesaian, dan Indikator Keberhasilan di dalam tiap temuan.',
          'Ekspor ke Excel atau Cetak Matriks Temuan LHA lengkap melalui tombol Cetak.',
        ],
      },
      {
        title: '7.2 Pemantauan Tindak Lanjut Rekomendasi (Alur Unit Kerja & SPI)',
        paragraphs: [
          'Modul Tindak Lanjut Rekomendasi dirancang dengan pemisahan akses yang jelas antara Unit Kerja (Auditee) dan Tim SPI:',
        ],
        bullets: [
          'Tampilan Khusus Unit Kerja (Auditee): Akun Unit Kerja hanya dapat melihat rekomendasi temuan yang ditujukan kepada unit kerjanya sendiri (unit kerja lain tidak ditampilkan). Unit kerja mengklik "Laporkan Bukti Aksi", mengisi catatan penjelasan perbaikan, langkah aksi, persentase progres, tanggal aksi, dan menempelkan Tautan / Link Bukti Aksi (misal tautan Google Drive, cloud dokumen, atau foto dokumentasi online).',
          'Keunggulan Sistem Link Bukti: Pengisian bukti aksi menggunakan tautan URL sehingga penyimpanan database Firebase tetap ringan, cepat, dan gratis tanpa membebani kuota file storage.',
          'Verifikasi oleh Auditor / Kepala SPI: Tim SPI membuka tautan bukti yang dilaporkan unit kerja, melakukan pemeriksaan kesesuaian, lalu memverifikasi status menjadi "Selesai", "Dalam Proses", atau "Tidak Dapat Ditindaklanjuti" disertai catatan verifikasi.',
          'Fitur Hapus oleh Super User: Kepala SPI / Super User memiliki tombol hapus pada laporan tindak lanjut maupun item rekomendasi untuk membersihkan data uji coba atau laporan yang salah kirim hingga tuntas dari database Firestore.',
        ],
      },
    ],
  },
  {
    id: 'bab-8',
    number: 'BAB VIII',
    title: 'Audit Investigatif & Review Produk Hukum',
    summary:
      'Pengelolaan kasus indikasi kecurangan (fraud) bersifat rahasia serta pemantauan kepatuhan peraturan dan SOP perusahaan.',
    subsections: [
      {
        title: '8.1 Modul Audit Investigatif & Penanganan Indikasi Fraud',
        paragraphs: [
          'Modul ini dibatasi untuk peran pengawasan/pimpinan (Kepala SPI, Auditor, Admin Sistem, Direktur) guna mencatat laporan pengaduan atau indikasi penyimpangan secara terstruktur: nomor kasus, sumber informasi, tanggal terima, unit terkait, dugaan modus, estimasi kerugian, kronologi, analisis awal, keputusan, dan ketua tim investigasi.',
        ],
        bullets: [
          'Pantau progres penanganan mulai dari tahap Registrasi -> Penelaahan -> Audit Investigatif -> Laporan Akhir -> Selesai.',
          'Gunakan tombol Cetak untuk menghasilkan Berita Acara / Laporan Penelaahan Kasus rahasia.',
        ],
      },
      {
        title: '8.2 Modul Review Produk Hukum & Kepatuhan Regulasi',
        paragraphs: [
          'Digunakan untuk menginventarisasi produk hukum internal maupun eksternal (UU/PP/Permen, Peraturan Direksi, SOP, SK Direksi, Standar Audit, dan Perjanjian/Kontrak) serta mengidentifikasi pasal/klausul berisiko beserta rekomendasi revisi oleh SPI.',
        ],
      },
    ],
  },
  {
    id: 'bab-9',
    number: 'BAB IX',
    title: 'Tata Kelola Sistem, Jabatan & TTD Digital, serta Cetak Dokumen',
    summary:
      'Pengaturan logo dan identitas instansi, manajemen pengguna, master unit kerja, pengelolaan pejabat & tanda tangan digital, serta opsi cetak dokumen resmi.',
    subsections: [
      {
        title: '9.1 Logo & Identitas Kantor (Branding Aplikasi)',
        paragraphs: [
          'Melalui menu "Logo & Identitas Kantor" (atau tombol cepat "Logo & Identitas" di Navbar), Kepala SPI / Admin Sistem dapat menyesuaikan identitas aplikasi agar sesuai dengan instansi pengguna:',
        ],
        bullets: [
          'Unggah logo resmi instansi (PNG/JPG/SVG/WebP maksimal 2 MB) atau gunakan ikon perisai dengan pilihan warna tema.',
          'Ubah Nama Aplikasi, Tagline, Nama Lengkap Instansi, Nama Singkat, Alamat, Telepon, Email, dan Website yang otomatis tampil di Sidebar, halaman Login, dan Kop Surat Cetak Digital.',
        ],
      },
      {
        title: '9.2 Manajemen Pengguna, Master Unit Kerja & Ekspor/Impor Database',
        paragraphs: [
          'Pada "Manajemen Pengguna", Super User menyetujui akun baru (Approve/Reject), menentukan peran (KEPALA_SPI, AUDITOR, DIREKTUR, DEWAN_PENGAWAS, AUDITEE, ADMIN_SISTEM), serta menetapkan unit kerja untuk akun Auditee agar pembatasan data per unit berjalan akurat.',
          'Pada "Master Unit & Wilayah", Admin mengelola daftar unit pelayanan dan bidang kantor pusat beserta status keaktifannya.',
        ],
        bullets: [
          'Ekspor & Impor Database (Khusus Super User): Melalui tombol "Ekspor Database" / "Impor Database" pada kartu Super User di Manajemen Pengguna maupun tombol cepat "Ekspor DB" / "Impor DB" di bagian bawah Sidebar, Kepala SPI / Admin Sistem dapat mencadangkan seluruh 20 koleksi Firestore ke file JSON dan memulihkannya kembali dengan mode aman Gabung & Perbarui (Merge) atau Timpa Penuh (Replace).',
        ],
      },
      {
        title: '9.3 Fitur Jabatan & Tanda Tangan Digital Pejabat',
        paragraphs: [
          'Menu "Fitur Jabatan & TTD" menyimpan daftar pejabat penandatangan resmi dokumen pengawasan (Nama, NIP, Jabatan, Unit/Bagian, dan Tanda Tangan Digital).',
        ],
        bullets: [
          'Tiga Metode Tanda Tangan Digital: Saat menambah atau mengedit pejabat, Admin/Kepala SPI dapat (1) Menggambar tanda tangan langsung di kanvas digital, (2) Mengunggah file gambar scan tanda tangan (PNG transparan/JPG), atau (3) Menghasilkan Stempel Verifikasi QR / Token Naskah Dinas Resmi.',
          'Tanda tangan digital yang tersimpan otomatis muncul pada blok pengesahan ketika mencetak PKPT, SPT, LHA, Matriks Temuan, RKA, maupun Program SPI.',
        ],
      },
      {
        title: '9.4 Pratinjau Cetak Resmi & Ekspor Dokumen (.PDF / .DOC)',
        paragraphs: [
          'Setiap tombol Cetak di seluruh modul akan membuka jendela Pratinjau Cetak Resmi dengan opsi fleksibel:',
        ],
        bullets: [
          'Pilihan Kop Surat: "Mode Manual" (menyisakan ruang kosong bagian atas yang dapat diatur ketinggiannya dalam cm untuk dicetak langsung di atas kertas berkop fisik perusahaan) atau "Mode Digital" (mencetak kop surat lengkap berisi logo & alamat instansi dari pengaturan Branding).',
          'Pengaturan Penandatangan: Pilih 1 hingga 3 pejabat penandatangan dari daftar Jabatan & TTD, ubah lokasi dan tanggal surat, serta aktifkan/nonaktifkan tampilan tanda tangan digital.',
          'Simpan ke PDF atau Word: Klik tombol Cetak dan pilih "Save as PDF" / "Simpan sebagai PDF" pada dialog printer browser, atau klik "Ekspor Word (.doc)" untuk menyunting lanjut di Microsoft Word.',
        ],
      },
    ],
  },
  {
    id: 'bab-10',
    number: 'BAB X',
    title: 'Panduan Alur Kerja Cepat (End-to-End) & Tanya Jawab (FAQ)',
    summary:
      'Ringkasan urutan operasional tahunan dari awal tahun hingga penutupan temuan audit serta solusi cepat atas kendala yang sering ditemui.',
    subsections: [
      {
        title: '10.1 Alur Kerja Pengawasan Tahunan (End-to-End Workflow)',
        paragraphs: [
          'Agar pemanfaatan aplikasi berjalan optimal setiap tahun anggaran, ikuti urutan tahapan berikut:',
        ],
        table: {
          caption: 'Tabel 10.1 Alur Operasional Lengkap SPI SMART Sepanjang Tahun',
          headers: ['Tahap', 'Modul Terkait', 'Pelaku Utama', 'Keluaran (Output)'],
          rows: [
            ['1. Persiapan Tahun & Unit', 'Navbar (Tahun), Pemilik Risiko, Jabatan & TTD', 'Kepala SPI / Admin', 'Tahun anggaran aktif ditetapkan; unit pemilik risiko & pejabat penandatangan siap.'],
            ['2. Pemetaan Risiko & RCSA', 'Register Risiko 5x5, RCSA Unit', 'Unit Kerja (Auditee) & SPI', 'Profil risiko inheren/residual 5x5 per unit kerja tervalidasi SPI.'],
            ['3. Input RKA & Penyusunan PKPT', 'Input RKA Manual, Penyusunan PKPT', 'Kepala SPI / Admin', 'Pagu RKA & bidang terinput; PKPT tersusun berdasarkan 60% Risiko + 40% Bobot RKA.'],
            ['4. Penugasan & Pelaksanaan', 'Surat Tugas (SPT), PKA, KKA', 'Kepala SPI & Tim Auditor', 'SPT terbit, langkah uji PKA dijalankan, dan bukti terdokumentasi di KKA.'],
            ['5. Pelaporan & Temuan 5C', 'LHA & Temuan Audit (5C)', 'Tim Auditor & Kepala SPI', 'LHA disahkan; temuan 5C & rekomendasi otomatis masuk matriks tindak lanjut.'],
            ['6. Tindak Lanjut Unit', 'Tindak Lanjut Rekomendasi', 'Unit Kerja & SPI', 'Unit melaporkan tautan bukti aksi; SPI memverifikasi hingga status Selesai.'],
          ],
        },
      },
      {
        title: '10.2 Tanya Jawab & Solusi Cepat (FAQ)',
        paragraphs: [
          'Berikut beberapa pertanyaan umum terkait operasional aplikasi:',
        ],
        bullets: [
          'T: Bagaimana jika aplikasi ingin digunakan untuk tahun depan (misal 2027, 2028, atau seterusnya)? J: Klik pemilih Tahun di Navbar atas, pilih tahun yang tersedia atau klik "+ Tambah Tahun Lain..." untuk memasukkan tahun berapa pun. Seluruh filter modul akan otomatis menyesuaikan.',
          'T: Mengapa akun Unit Kerja (Auditee) hanya melihat sedikit menu dan hanya temuan unitnya saja? J: Demi keamanan tata kelola dan kerahasiaan antar unit, akun Auditee memang dibatasi hanya pada Peta Risiko 5x5, Register Risiko unitnya, dan Tindak Lanjut Rekomendasi unit kerjanya sendiri.',
          'T: Mengapa unit kerja diminta mengisi link saat melapor bukti tindak lanjut? J: Sistem menggunakan tautan URL (misal link Google Drive instansi atau penyimpanan awan internal) agar lampiran foto/PDF beresolusi tinggi tetap dapat diakses SPI tanpa membuat ukuran database membengkak.',
          'T: Bagaimana cara Super User menambah Bidang/Kategori RKA di luar pilihan yang tersedia? J: Pada modal Input RKA klik "+ Input Manual" di atas kolom Bidang/Kategori Program, atau gunakan tombol "Kelola Bidang / Kategori" di halaman RKA.',
          'T: Di mana saya bisa mengunduh Manual Book ini dalam bentuk PDF? J: Klik tombol "Manual Book (PDF)" di menu samping kiri atau Navbar atas, lalu klik tombol "Unduh File PDF (.pdf)".',
        ],
      },
    ],
  },
];
