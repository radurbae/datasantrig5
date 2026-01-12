let catatanData = [];
let santriData = [];
let editingId = null;

const SUBCATEGORY_MAP = {
    OPPM: ['Bagian', 'Rayon', 'Klub', 'Kursus'],
    KGGP: ['Bagian', 'POT', 'Kontingen'],
    Instansi: ['ITQAN', 'FP2WS', 'JMQ', 'JMH', 'DQPOS', 'LAB KMI'],
    Kepanitiaan: ['Panitia 1', 'Panitia 2', 'Panitia 3']
};

function getHijriAcademicYear() {
    try {
        const parts = new Intl.DateTimeFormat('id-ID-u-ca-islamic', { year: 'numeric' }).formatToParts(new Date());
        const yearPart = parts.find(p => p.type === 'year');
        const year = yearPart ? parseInt(yearPart.value, 10) : null;
        if (year) return `${year}-${year + 1}`;
    } catch (error) {
        console.warn('Hijri year not supported, fallback to Gregorian');
    }
    const year = new Date().getFullYear();
    return `${year}-${year + 1}`;
}

function normalizeKelas(kelas) {
    return (kelas || '').toString().trim().replace(/\s+/g, ' ');
}

function parseKelasKey(kelas) {
    const normalized = normalizeKelas(kelas).replace(/\s+/g, '');
    const match = normalized.match(/^(\d+)([A-Za-z]+)?$/);
    if (!match) {
        return { num: Number.MAX_SAFE_INTEGER, suffix: normalized || 'zz' };
    }
    return { num: parseInt(match[1], 10), suffix: (match[2] || '').toUpperCase() };
}

function getKmiOptions() {
    const kelasList = [...new Set(santriData.map(s => normalizeKelas(s.kelas)).filter(Boolean))];
    kelasList.sort((a, b) => {
        const aKey = parseKelasKey(a);
        const bKey = parseKelasKey(b);
        if (aKey.num !== bKey.num) return aKey.num - bKey.num;
        return aKey.suffix.localeCompare(bKey.suffix, 'id');
    });
    return kelasList.length ? kelasList : ['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'];
}

function populateSantriSelect() {
    const select = document.getElementById('catatan-santri');
    if (!select) return;
    select.innerHTML = '<option value="">Pilih Santri</option>' + santriData.map(s => `
        <option value="${s.id}">${s.nama} (${s.kelas || '-'})</option>
    `).join('');
}

function populateSubcategory(category) {
    const select = document.getElementById('catatan-subkategori');
    if (!select) return;
    let options = [];
    if (category === 'KMI') {
        options = getKmiOptions();
    } else {
        options = SUBCATEGORY_MAP[category] || [];
    }
    select.innerHTML = '<option value="">Pilih Sub Kategori</option>' +
        options.map(opt => `<option value="${opt}">${opt}</option>`).join('');
}

function resetForm() {
    editingId = null;
    document.getElementById('catatan-form').reset();
    document.getElementById('catatan-tahun').value = getHijriAcademicYear();
    document.getElementById('catatan-mode').textContent = '';
    document.getElementById('catatan-cancel').style.display = 'none';
    document.getElementById('catatan-submit').textContent = 'Simpan';
    populateSubcategory('');
}

function attachSantriNames() {
    const map = new Map(santriData.map(s => [s.id, s]));
    catatanData = catatanData.map(item => ({
        ...item,
        santri_name: map.get(item.santri_id)?.nama || '-'
    }));
}

function renderTable() {
    const tbody = document.getElementById('catatan-tbody');
    if (!tbody) return;

    if (catatanData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Belum ada data catatan.</td></tr>';
        return;
    }

    const isAdmin = window.currentUserRole === 'admin';
    tbody.innerHTML = catatanData.map((item, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${item.santri_name || '-'}</td>
            <td>${item.kategori || '-'}</td>
            <td>${item.sub_kategori || '-'}</td>
            <td>${item.keterangan || '-'}</td>
            <td>${item.tahun_ajaran || '-'}</td>
            ${isAdmin ? `
            <td>
                <button class="btn btn-secondary" onclick="editCatatan('${item.id}')">Edit</button>
                <button class="btn btn-danger" onclick="deleteCatatanItem('${item.id}')">Hapus</button>
            </td>
            ` : ''}
        </tr>
    `).join('');
}

async function loadData() {
    santriData = await getAllSantri();
    catatanData = await getCatatan();
    attachSantriNames();
    populateSantriSelect();
    renderTable();
    populateSubcategory(document.getElementById('catatan-kategori').value);
}

window.editCatatan = (id) => {
    const item = catatanData.find(p => p.id === id);
    if (!item) return;
    editingId = id;
    document.getElementById('catatan-santri').value = item.santri_id;
    document.getElementById('catatan-kategori').value = item.kategori || '';
    populateSubcategory(item.kategori);
    document.getElementById('catatan-subkategori').value = item.sub_kategori || '';
    document.getElementById('catatan-keterangan').value = item.keterangan || '';
    document.getElementById('catatan-tahun').value = item.tahun_ajaran || getHijriAcademicYear();
    document.getElementById('catatan-mode').textContent = 'Mode: Edit';
    document.getElementById('catatan-cancel').style.display = 'inline-flex';
    document.getElementById('catatan-submit').textContent = 'Update';
};

window.deleteCatatanItem = async (id) => {
    if (!confirm('Hapus data catatan ini?')) return;
    const success = await deleteCatatan(id);
    if (success) {
        await loadData();
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    const role = await requireAuth();
    if (!role) return;

    document.getElementById('catatan-tahun').value = getHijriAcademicYear();
    if (role !== 'admin') {
        document.getElementById('catatan-form').style.display = 'none';
        document.getElementById('catatan-readonly').style.display = 'block';
    }

    await loadData();

    document.getElementById('catatan-cancel').addEventListener('click', resetForm);
    document.getElementById('catatan-kategori').addEventListener('change', (e) => {
        populateSubcategory(e.target.value);
    });

    document.getElementById('catatan-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        if (role !== 'admin') return;

        const payload = {
            santri_id: document.getElementById('catatan-santri').value,
            kategori: document.getElementById('catatan-kategori').value,
            sub_kategori: document.getElementById('catatan-subkategori').value,
            keterangan: document.getElementById('catatan-keterangan').value.trim(),
            tahun_ajaran: document.getElementById('catatan-tahun').value.trim()
        };

        if (!payload.santri_id || !payload.kategori || !payload.sub_kategori || !payload.keterangan || !payload.tahun_ajaran) {
            alert('Lengkapi semua field.');
            return;
        }

        if (editingId) {
            await updateCatatan(editingId, payload);
        } else {
            await insertCatatan(payload);
        }
        await loadData();
        resetForm();
    });
});
