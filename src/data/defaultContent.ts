import { LearningMaterial } from '../types';

export const DEFAULT_MATERIAL: LearningMaterial = {
  id: 'mat-smk-tkj-01',
  topic: 'Dasar-Dasar Jaringan Komputer & Perangkat Keras',
  subject: 'Teknik Komputer dan Jaringan / PPLG',
  targetGrade: 'Kelas X / XI SMK',
  summaryPoints: [
    'IP Address & Subnetting: Alamat logika 32-bit (IPv4) yang menjadi identitas unik setiap perangkat pada jaringan TCP/IP.',
    'Perangkat Aktif Jaringan: Switch menghubungkan perangkat dalam satu subnet berbasis MAC address, sedangkan Router menghubungkan antar jaringan berbeda.',
    'Media Transmisi Data: Kabel UTP (konektor RJ-45 standar T568A/T568B) untuk media tembaga, dan Fiber Optic untuk transfer data berkecepatan tinggi via gelombang cahaya.',
    'Model Referensi Komunikasi: Model OSI (7 Layer) dan TCP/IP (4 Layer) membagi standarisasi proses pengiriman paket data dari aplikasi ke sinyal fisik.',
    'Layanan & Protokol Server: DHCP memberikan IP otomatis kepada klien, DNS memetakan nama domain ke alamat IP, dan Firewall mengamankan lalu lintas data.',
  ],
  detailedContent: `Selamat datang di modul pembelajaran interaktif dasar jaringan komputer!
Jaringan komputer adalah sekumpulan perangkat otonom yang saling terhubung untuk berbagi sumber daya, data, dan komunikasi.
Dalam dunia industri dan sertifikasi keahlian SMK, pemahaman mendalam tentang komponen jaringan, sistem pengalamatan IP, dan protokol komunikasi merupakan fondasi utama sebelum melakukan perancangan dan troubleshooting jaringan nyata.

Pelajari dengan saksama seluruh poin di atas. Uji ketangkasan dan pemahaman Anda melalui level tantangan permainan bertingkat berikut untuk meraih Sertifikat Kelulusan Resmi!`,
  levels: [
    {
      levelNumber: 1,
      title: 'Level 1: Pasangan Istilah Jaringan (Kartu Memori)',
      type: 'memory',
      description: 'Buka dan cocokkan pasangan kartu antara Istilah Perangkat/Konsep Jaringan dengan Fungsinya. Anda wajib menuntaskan semua pasangan kartu dengan benar untuk membuka Level 2!',
      pairs: [
        {
          id: 'p1',
          term: 'Router',
          definition: 'Perangkat jaringan yang menghubungkan dan merutekan data antar subnet atau jaringan berbeda',
          clue: 'Bekerja pada Layer 3 (Network Layer) model OSI',
        },
        {
          id: 'p2',
          term: 'Switch',
          definition: 'Penghubung banyak perangkat dalam satu LAN lokal berbasis pembacaan MAC Address',
          clue: 'Bekerja pada Layer 2 (Data Link Layer)',
        },
        {
          id: 'p3',
          term: 'IP Address',
          definition: 'Alamat identitas logika numerik unik setiap host dalam jaringan komputer TCP/IP',
          clue: 'Contohnya 192.168.1.1',
        },
        {
          id: 'p4',
          term: 'DNS Server',
          definition: 'Layanan penerjemah nama domain ramah manusia menjadi alamat IP numerik mesin',
          clue: 'Mengubah smkbisa.sch.id menjadi alamat IP server',
        },
        {
          id: 'p5',
          term: 'DHCP Server',
          definition: 'Protokol yang mendistribusikan konfigurasi IP Address otomatis ke komputer klien',
          clue: 'Klien tidak perlu setting IP secara manual',
        },
        {
          id: 'p6',
          term: 'Firewall',
          definition: 'Sistem pengamanan yang memfilter dan mengawasi paket lalu lintas data keluar-masuk',
          clue: 'Mencegah akses ilegal dari jaringan luar',
        },
      ],
    },
    {
      levelNumber: 2,
      title: 'Level 2: Klasifikasi Komponen & Protokol (Drag & Drop)',
      type: 'dragdrop',
      description: 'Pasangkan setiap pernyataan di kolom kiri ke kotak definisi yang tepat di kolom kanan. Dapatkan 100% jawaban benar untuk membuka Level 3!',
      pairs: [
        {
          id: 'dd1',
          term: 'Kabel UTP Cat6',
          definition: 'Kabel tembaga 4 pasang terpilin dengan konektor RJ-45 berkecepatan hingga 1 Gbps',
          clue: 'Biasa digunakan untuk instalasi LAN gedung sekolah',
        },
        {
          id: 'dd2',
          term: 'Topologi Star',
          definition: 'Rancangan fisik terpusat di mana seluruh workstation terhubung langsung ke Switch/Hub',
          clue: 'Jika satu kabel klien putus, jaringan lain tidak terganggu',
        },
        {
          id: 'dd3',
          term: 'Protokol HTTPS',
          definition: 'Protokol transmisi data halaman web yang dienkripsi dengan SSL/TLS pada port 443',
          clue: 'Menampilkan ikon gembok aman pada browser',
        },
        {
          id: 'dd4',
          term: 'Perintah PING',
          definition: 'Utilitas baris perintah berbasis ICMP untuk menguji latensi dan keterjangkauan host',
          clue: 'Digunakan untuk cek reply koneksi di Command Prompt',
        },
        {
          id: 'dd5',
          term: 'Subnet Mask /24',
          definition: 'Netmask 255.255.255.0 yang menyediakan ruang alamat hingga 254 host komputer',
          clue: 'Prefix default untuk jaringan kelas C',
        },
      ],
    },
    {
      levelNumber: 3,
      title: 'Level 3: Troubleshooting & Media Transmisi (Tantangan Final)',
      type: 'dragdrop',
      description: 'Level pamungkas! Pasangkan kasus troubleshooting dan implementasi jaringan fisik berikut secara tepat untuk meraih Gelar Kelulusan & Sertifikat Digital!',
      pairs: [
        {
          id: 'p3_1',
          term: 'Kabel Straight-Through',
          definition: 'Susunan urutan pin kabel yang sama di kedua ujung untuk menghubungkan PC ke Switch',
          clue: 'Menghubungkan dua perangkat berbeda fungsi',
        },
        {
          id: 'p3_2',
          term: 'Kabel Crossover',
          definition: 'Susunan kabel dengan pin pengirim dan penerima bersilangan untuk PC ke PC langsung',
          clue: 'Menghubungkan dua perangkat sejenis tanpa perantara',
        },
        {
          id: 'p3_3',
          term: 'Default Gateway',
          definition: 'Alamat interface router yang menjadi pintu keluar paket menuju jaringan internet luar',
          clue: 'Wajib diisi di pengaturan TCP/IP komputer',
        },
        {
          id: 'p3_4',
          term: 'MAC Address',
          definition: 'Alamat fisik perangkat keras permanen 48-bit heksadesimal yang dicetak pabrik pada NIC',
          clue: 'Alamat fisik permanen tidak berubah',
        },
        {
          id: 'p3_5',
          term: 'Fiber Optic',
          definition: 'Media kabel kaca pemantul pulsa cahaya dengan imunitas total terhadap interferensi elektromagnetik',
          clue: 'Digunakan untuk backbone antar gedung atau ISP',
        },
      ],
    },
  ],
  updatedAt: new Date().toISOString(),
};
