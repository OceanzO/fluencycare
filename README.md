# Flunify

> **find your rhythm**  
> **Website Digital untuk Asesmen Kelancaran Bicara**  
> Prototipe digital terstruktur untuk dokumentasi observasi gagap (*stuttering*), perekaman sampel bicara, dan perhitungan otomatis persentase suku kata yang mengalami gagap (%SS).

---

## Ringkasan Produk

**Flunify** (*find your rhythm*) dirancang untuk membantu terapis wicara dan mahasiswa Terapi Wicara mendokumentasikan proses asesmen kelancaran bicara secara efisien dalam satu platform terpadu. Aplikasi ini menggabungkan pencatatan riwayat keluhan, observasi klinis terstruktur, perekaman audio langsung dari peramban, serta penghitungan formula %SS secara konsisten dan siap cetak.

---

## Fitur Utama

| ID | Fitur | Deskripsi |
| :--- | :--- | :--- |
| **F00** | **Autentikasi & Role-Based View** | Halaman login klinis, Mode Demo instan, dan pergantian peran Terapis / Admin |
| **F01** | **Dashboard Terapis** | Metrik statistik asesmen, tren %SS terbaru, dan akses cepat pembuatan asesmen baru |
| **F02** | **Formulir Asesmen** | Input terstruktur dengan kode anonim klien, usia, tanggal, dan riwayat keluhan |
| **F03** | **Observasi Kelancaran** | Checklist tugas bicara dan karakteristik ketidaklancaran (*sound repetition*, *blocking*, dll.) |
| **F07** | **Perekam Audio Sampel Bicara** | Perekaman suara melalui MediaRecorder API dengan visualizer dan kontrol putar ulang |
| **F08** | **Pencatatan Suku Kata & %SS** | Kalkulasi real-time formula %SS dengan validasi ketat (mencegah pembagian nol) |
| **F04 & F05** | **Riwayat & Detail Asesmen** | Pencarian kode klien, filter tanggal, dan peninjauan kembali seluruh data rekaman |
| **F06** | **Cetak & Ekspor Laporan** | Tampilan ramah cetak (*Print CSS*) untuk rekam asesmen |
| **ADM** | **Panel Admin** | Manajemen akun pengguna (terapis, mahasiswa, admin) dan kustomisasi master data |

---

## Rumus %SS (Percent Syllables Stuttered)

$$\%SS = \left( \frac{\text{Jumlah suku kata yang mengalami gagap}}{\text{Jumlah seluruh suku kata}} \right) \times 100$$

*Sistem dilengkapi validasi otomatis yang mencegah pembagian dengan angka nol, nilai negatif, atau jumlah suku kata gagap yang melampaui jumlah total suku kata.*

---

## Palet Warna Klinis (Soft Clinical Blue)

* **Primary Blue:** `#4267B2` *(Aksi utama & navigasi)*
* **Light Blue:** `#E8F0FF` *(Aksen & kartu sorotan)*
* **Navy:** `#243B67` *(Tipografi judul & teks penting)*
* **Soft Background:** `#F5F7FB` *(Latar belakang halaman)*
* **White:** `#FFFFFF` *(Latar formulir & kartu)*
* **Success Green:** `#2F806A` *(Status tersimpan & validasi berhasil)*

---

## Tech Stack & Arsitektur

* **Frontend:** [Next.js (App Router)](https://nextjs.org/) + TypeScript + Tailwind CSS v4
* **Database & Storage:** [Supabase](https://supabase.com/) (PostgreSQL + Supabase Storage Bucket `audio_samples`)
* **Audio Capture:** HTML5 MediaRecorder API
* **Deployment:** [Vercel](https://vercel.com/)

---

## Memulai Pengembangan Lokal (Getting Started)

### 1. Prasyarat
* Node.js versi 18+ atau LTS terbaru
* Akun Supabase (opsional untuk tahap awal; aplikasi otomatis berjalan dalam **Mode Demo** bila kredensial belum diisi)

### 2. Kloning Repositori
```bash
git clone https://github.com/OceanzO/flunify.git
cd flunify
npm install
npm run dev
```

Akses `http://localhost:3000` di peramban Anda. Gunakan tombol **"Demo Terapis"** atau **"Demo Admin"** di halaman login untuk langsung mencoba semua fitur tanpa konfigurasi database.
