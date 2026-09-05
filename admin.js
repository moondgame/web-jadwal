// admin.js — logika halaman admin (admin.html)
//
// CATATAN KEAMANAN:
// Ini adalah situs statis (tanpa server/backend), jadi pengecekan password
// dilakukan di sisi browser (dibandingkan sebagai hash SHA-256, bukan teks
// polos). Ini CUKUP untuk mencegah orang iseng, tapi BUKAN keamanan yang
// kuat — siapa pun yang membaca kode sumber di GitHub bisa melihat hash-nya.
// Jangan gunakan untuk data yang benar-benar rahasia/sensitif.
//
// Ganti password default dengan mengubah ADMIN_PASSWORD_HASH di bawah.
// Cara membuat hash baru: buka console browser lalu jalankan
//   crypto.subtle.digest('SHA-256', new TextEncoder().encode('password-baru'))
//     .then(b => console.log([...new Uint8Array(b)].map(x => x.toString(16).padStart(2,'0')).join('')))

const ADMIN_PASSWORD_HASH = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9'; // = "admin123"
const SESSION_KEY = 'jadwal_admin_session';
const STORAGE_KEY = 'jadwal_admin_data';

const HARI_LIST = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

let data = [];
let editingId = null;

const loginScreen = document.getElementById('loginScreen');
const adminScreen = document.getElementById('adminScreen');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');

const entryForm = document.getElementById('entryForm');
const jurusanSelect = document.getElementById('f_jurusan');
const kelasField = document.getElementById('kelasField');
const kelasSelect = document.getElementById('f_kelas');
const dataTableBody = document.getElementById('dataTableBody');
const formTitle = document.getElementById('formTitle');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const statusPill = document.getElementById('statusPill');
const importInput = document.getElementById('importInput');

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const pw = document.getElementById('passwordInput').value;
  const hash = await sha256(pw);
  if (hash === ADMIN_PASSWORD_HASH) {
    sessionStorage.setItem(SESSION_KEY, '1');
    loginError.textContent = '';
    enterAdmin();
  } else {
    loginError.textContent = 'Password salah. Coba lagi.';
  }
});

logoutBtn.addEventListener('click', () => {
  sessionStorage.removeItem(SESSION_KEY);
  location.reload();
});

async function enterAdmin() {
  loginScreen.style.display = 'none';
  adminScreen.style.display = 'block';
  await loadInitialData();
  renderTable();
}

async function loadInitialData() {
  const cached = localStorage.getItem(STORAGE_KEY);
  if (cached) {
    data = JSON.parse(cached);
    return;
  }
  try {
    const res = await fetch('jadwal.json', { cache: 'no-store' });
    data = res.ok ? await res.json() : [];
  } catch {
    data = [];
  }
}

function persistLocal() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  flashStatus('Tersimpan di browser ini.');
}

function flashStatus(msg) {
  statusPill.textContent = msg;
  setTimeout(() => { if (statusPill.textContent === msg) statusPill.textContent = ''; }, 3000);
}

jurusanSelect.addEventListener('change', updateKelasVisibility);
function updateKelasVisibility() {
  const isTI = jurusanSelect.value === 'TI';
  kelasField.style.display = isTI ? 'flex' : 'none';
  kelasSelect.required = isTI;
  if (!isTI) kelasSelect.value = '';
}
updateKelasVisibility();

entryForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const entry = {
    id: editingId || String(Date.now()),
    jurusan: jurusanSelect.value,
    kelas: jurusanSelect.value === 'TI' ? kelasSelect.value : null,
    mataKuliah: document.getElementById('f_matkul').value.trim(),
    dosen: document.getElementById('f_dosen').value.trim(),
    ruangan: document.getElementById('f_ruangan').value.trim(),
    hari: document.getElementById('f_hari').value,
    jamMulai: document.getElementById('f_jamMulai').value,
    jamSelesai: document.getElementById('f_jamSelesai').value,
  };

  if (editingId) {
    data = data.map(d => (d.id === editingId ? entry : d));
  } else {
    data.push(entry);
  }

  persistLocal();
  resetForm();
  renderTable();
});

cancelEditBtn.addEventListener('click', resetForm);

function resetForm() {
  editingId = null;
  entryForm.reset();
  updateKelasVisibility();
  formTitle.textContent = 'Tambah Jadwal';
  cancelEditBtn.style.display = 'none';
}

function startEdit(id) {
  const item = data.find(d => d.id === id);
  if (!item) return;
  editingId = id;
  jurusanSelect.value = item.jurusan;
  updateKelasVisibility();
  kelasSelect.value = item.kelas || '';
  document.getElementById('f_matkul').value = item.mataKuliah;
  document.getElementById('f_dosen').value = item.dosen;
  document.getElementById('f_ruangan').value = item.ruangan;
  document.getElementById('f_hari').value = item.hari;
  document.getElementById('f_jamMulai').value = item.jamMulai;
  document.getElementById('f_jamSelesai').value = item.jamSelesai;
  formTitle.textContent = 'Ubah Jadwal';
  cancelEditBtn.style.display = 'inline-flex';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteEntry(id) {
  if (!confirm('Hapus jadwal ini?')) return;
  data = data.filter(d => d.id !== id);
  persistLocal();
  renderTable();
}

function renderTable() {
  if (data.length === 0) {
    dataTableBody.innerHTML = `<tr><td colspan="7" style="color:var(--paper-dim);">Belum ada data jadwal.</td></tr>`;
    return;
  }
  const sorted = [...data].sort((a, b) =>
    a.jurusan.localeCompare(b.jurusan) ||
    (a.kelas || '').localeCompare(b.kelas || '') ||
    HARI_LIST.indexOf(a.hari) - HARI_LIST.indexOf(b.hari) ||
    a.jamMulai.localeCompare(b.jamMulai)
  );

  dataTableBody.innerHTML = sorted.map(item => `
    <tr>
      <td><span class="tag ${item.jurusan === 'TI' ? 'tag--ti' : 'tag--si'}">${item.jurusan === 'TI' ? 'Teknik Informatika' : 'Sistem Informasi'}</span></td>
      <td>${item.kelas ? `Kelas ${item.kelas}` : '—'}</td>
      <td>${escapeHtml(item.mataKuliah)}</td>
      <td>${escapeHtml(item.dosen)}</td>
      <td>${escapeHtml(item.ruangan)}</td>
      <td>${item.hari}, ${item.jamMulai}–${item.jamSelesai}</td>
      <td>
        <div class="row-actions">
          <button class="btn btn--ghost btn--small" data-edit="${item.id}">Ubah</button>
          <button class="btn btn--danger btn--small" data-delete="${item.id}">Hapus</button>
        </div>
      </td>
    </tr>`).join('');

  dataTableBody.querySelectorAll('[data-edit]').forEach(btn =>
    btn.addEventListener('click', () => startEdit(btn.dataset.edit)));
  dataTableBody.querySelectorAll('[data-delete]').forEach(btn =>
    btn.addEventListener('click', () => deleteEntry(btn.dataset.delete)));
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

// --- impor / ekspor ---
document.getElementById('exportBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'jadwal.json';
  a.click();
  URL.revokeObjectURL(url);
  flashStatus('jadwal.json diunduh — unggah/replace file ini di repo GitHub untuk mempublikasikan.');
});

importInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (!Array.isArray(parsed)) throw new Error('format tidak sesuai');
      data = parsed;
      persistLocal();
      renderTable();
      flashStatus('Data berhasil diimpor.');
    } catch {
      alert('File JSON tidak valid.');
    }
  };
  reader.readAsText(file);
  importInput.value = '';
});

// --- cek sesi saat halaman dibuka ---
if (sessionStorage.getItem(SESSION_KEY) === '1') {
  enterAdmin();
}
