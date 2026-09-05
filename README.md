# Jadwal Kuliah

Situs statis (HTML/CSS/JS biasa, tanpa backend) untuk menampilkan jadwal kuliah
per jurusan dan kelas, plus halaman admin terpisah untuk mengisi datanya.

## Struktur file

```
index.html    -> halaman publik: pilih jurusan -> pilih kelas (jika TI) -> lihat jadwal
admin.html    -> halaman admin: login, tambah/ubah/hapus jadwal, ekspor jadwal.json
style.css     -> gaya bersama kedua halaman
app.js        -> logika halaman publik
admin.js      -> logika halaman admin
jadwal.json   -> data jadwal yang dibaca oleh index.html
```

## Alur pemakaian

**Halaman publik (`index.html`)**
1. Muncul dua pilihan jurusan: *Teknik Informatika* dan *Sistem Informasi*.
2. Klik **Teknik Informatika** → muncul pilihan **Kelas A** / **Kelas B** → klik salah satu → jadwal muncul.
3. Klik **Sistem Informasi** → jadwal langsung muncul (karena hanya ada satu kelas).

**Halaman admin (`admin.html`)**
1. Login pakai password (default: `admin123` — **wajib diganti**, lihat di bawah).
2. Isi form: jurusan, kelas (khusus TI), mata kuliah, dosen pengampu, ruangan, hari, jam mulai/selesai.
3. Data yang disimpan lewat form otomatis tersimpan di *browser* admin (localStorage), supaya bisa diedit berkali-kali sebelum dipublikasikan.
4. Klik **Unduh jadwal.json** untuk mengunduh file data terbaru.
5. Unggah/ganti (`replace`) file `jadwal.json` di repository GitHub dengan file hasil unduhan tadi, lalu commit & push.
6. Situs publik (`index.html`) otomatis membaca `jadwal.json` yang baru setelah GitHub Pages selesai build ulang (biasanya 1–2 menit).

> Kenapa harus diunduh & diunggah manual? Karena ini situs statis tanpa server/database — perubahan yang disimpan lewat admin.html hanya tersimpan di browser admin itu sendiri, tidak otomatis terlihat oleh pengunjung lain. Mengganti `jadwal.json` di repo adalah cara datanya benar-benar "dipublikasikan".

Kalau admin membuka `admin.html` lagi nanti dan browsernya sama, data yang tersimpan di localStorage akan otomatis muncul lagi. Kalau ganti perangkat/browser, gunakan tombol **Impor jadwal.json** untuk memuat file `jadwal.json` yang sedang aktif di repo sebagai titik awal edit.

## Mengganti password admin

Password dicek di sisi browser dalam bentuk hash SHA-256 (bukan teks polos),
supaya tidak langsung terbaca di kode sumber. Tapi karena ini situs statis publik,
ini **bukan keamanan yang kuat** — cukup untuk mencegah orang iseng, bukan untuk data rahasia.

Cara ganti:
1. Buka console browser (F12), lalu jalankan:
   ```js
   crypto.subtle.digest('SHA-256', new TextEncoder().encode('password-baru-kamu'))
     .then(b => console.log([...new Uint8Array(b)].map(x => x.toString(16).padStart(2,'0')).join('')))
   ```
2. Salin hasil hash yang muncul.
3. Buka `admin.js`, ganti nilai `ADMIN_PASSWORD_HASH` dengan hash baru tersebut.

## Menjalankan / mengetes secara lokal

Karena `app.js` memuat `jadwal.json` lewat `fetch()`, membuka `index.html`
langsung sebagai file (`file://`) bisa diblokir browser (CORS). Jalankan lewat
server lokal sederhana, contoh:

```bash
# di dalam folder proyek ini
python3 -m http.server 8000
```

lalu buka `http://localhost:8000` di browser.

## Deploy ke GitHub Pages

1. Buat repository baru di GitHub, lalu upload semua file di folder ini (bisa lewat
   web GitHub "Add file → Upload files", atau lewat `git push`).
2. Di repo, buka **Settings → Pages**.
3. Pilih **Source: Deploy from a branch**, branch `main`, folder `/ (root)`, lalu **Save**.
4. Tunggu 1–2 menit, situs akan aktif di `https://<username>.github.io/<nama-repo>/`.
5. Untuk update jadwal selanjutnya: edit lewat `admin.html` → unduh `jadwal.json` →
   upload/replace file itu di repo → tunggu build ulang selesai.
