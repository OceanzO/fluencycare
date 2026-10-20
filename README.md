# FluencyCare

> **Website Digital untuk Asesmen Kelancaran Bicara**  
> Prototipe digital terstruktur untuk dokumentasi observasi gagap (*stuttering*), perekaman sampel bicara, dan perhitungan otomatis persentase suku kata yang mengalami gagap (%SS).

---

## Ringkasan Produk

**FluencyCare** dirancang untuk membantu terapis wicara dan mahasiswa Terapi Wicara mendokumentasikan proses asesmen kelancaran bicara secara efisien dalam satu platform terpadu. Aplikasi ini menggabungkan pencatatan riwayat keluhan, observasi klinis, perekaman audio langsung dari peramban, serta penghitungan formula %SS secara konsisten dan siap cetak.

---

## Fitur Utama

| ID | Fitur | Deskripsi |
| :--- | :--- | :--- |
| **F01** | **Dashboard** | Ringkasan statistik asesmen dan akses cepat pembuatan asesmen baru |
| **F02** | **Formulir Asesmen** | Input data terstruktur: kode klien, usia, tanggal asesmen, dan riwayat keluhan |
| **F03** | **Observasi Kelancaran** | Checklist tugas bicara dan karakteristik ketidaklancaran (*sound/syllable repetition*, *prolongation*, *blocking*, dll.) |
| **F07** | **Perekam Audio Sampel Bicara** | Perekaman suara melalui MediaRecorder API dengan kontrol putar ulang (*playback*) |
| **F08** | **Pencatatan Suku Kata & %SS** | Penghitungan otomatis formula %SS secara *real-time* dengan validasi input |
| **F04 & F05** | **Riwayat & Detail Asesmen** | Pencarian kode klien, filter tanggal, dan peninjauan kembali seluruh data rekaman |
| **F06** | **Cetak & Ekspor Laporan** | Tampilan ramah cetak (*Print CSS*) untuk dokumentasi rekam asesmen |

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

* **Frontend:** [Next.js (App Router)](https://nextjs.org/) + TypeScript + CSS/Tailwind
* **Database & Storage:** [Supabase](https://supabase.com/) (PostgreSQL + Supabase Storage Bucket untuk audio)
* **Audio Capture:** HTML5 MediaRecorder API
* **Deployment:** [Vercel](https://vercel.com/)

---

## Memulai Pengembangan Lokal (Getting Started)

### 1. Prasyarat
* Node.js versi 18+ atau LTS terbaru
* Akun Supabase (untuk database dan storage)

### 2. Kloning Repositori
```bash
git clone https://github.com/OceanzO/fluencycare.git
cd fluencycare
