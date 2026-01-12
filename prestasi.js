let prestasiData = [];
let santriData = [];
let editingId = null;

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

function populateSantriSelect() {
    const select = document.getElementById('prestasi-santri');
    if (!select) return;
    select.innerHTML = '<option value="">Pilih Santri</option>' + santriData.map(s => `
        <option value="${s.id}">${s.nama} (${s.kelas || '-'})</option>
    `).join('');
}

function resetForm() {
    editingId = null;
    document.getElementById('prestasi-form').reset();
    document.getElementById('prestasi-tahun').value = getHijriAcademicYear();
    document.getElementById('prestasi-mode').textContent = '';
    document.getElementById('prestasi-cancel').style.display = 'none';
    document.getElementById('prestasi-submit').textContent = 'Simpan';
}

function renderTable() {
    const tbody = document.getElementById('prestasi-tbody');
    if (!tbody) return;

    if (prestasiData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Belum ada data prestasi.</td></tr>';
        return;
    }

    const isAdmin = window.currentUserRole === 'admin';
    tbody.innerHTML = prestasiData.map((item, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${item.santri_name || '-'}</td>
            <td>${item.nama_kegiatan || '-'}</td>
            <td>${item.keterangan || '-'}</td>
            <td>${item.kategori_kegiatan || '-'}</td>
            <td>${item.tahun_ajaran || '-'}</td>
            ${isAdmin ? `
            <td>
                <button class="btn btn-secondary" onclick="editPrestasi('${item.id}')">Edit</button>
                <button class="btn btn-danger" onclick="deletePrestasiItem('${item.id}')">Hapus</button>
            </td>
            ` : ''}
        </tr>
    `).join('');
}

function attachSantriNames() {
    const map = new Map(santriData.map(s => [s.id, s]));
    prestasiData = prestasiData.map(item => ({
        ...item,
        santri_name: map.get(item.santri_id)?.nama || '-'
    }));
}

async function loadData() {
    santriData = await getAllSantri();
    prestasiData = await getPrestasi();
    attachSantriNames();
    populateSantriSelect();
    renderTable();
}

window.editPrestasi = (id) => {
    const item = prestasiData.find(p => p.id === id);
    if (!item) return;
    editingId = id;
    document.getElementById('prestasi-santri').value = item.santri_id;
    document.getElementById('prestasi-kegiatan').value = item.nama_kegiatan || '';
    document.getElementById('prestasi-keterangan').value = item.keterangan || '';
    document.getElementById('prestasi-kategori').value = item.kategori_kegiatan || '';
    document.getElementById('prestasi-tahun').value = item.tahun_ajaran || getHijriAcademicYear();
    document.getElementById('prestasi-mode').textContent = 'Mode: Edit';
    document.getElementById('prestasi-cancel').style.display = 'inline-flex';
    document.getElementById('prestasi-submit').textContent = 'Update';
};

window.deletePrestasiItem = async (id) => {
    if (!confirm('Hapus data prestasi ini?')) return;
    const success = await deletePrestasi(id);
    if (success) {
        await loadData();
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    const role = await requireAuth();
    if (!role) return;

    document.getElementById('prestasi-tahun').value = getHijriAcademicYear();
    if (role !== 'admin') {
        document.getElementById('prestasi-form').style.display = 'none';
        document.getElementById('prestasi-readonly').style.display = 'block';
    }

    await loadData();

    document.getElementById('prestasi-cancel').addEventListener('click', resetForm);

    document.getElementById('prestasi-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        if (role !== 'admin') return;

        const payload = {
            santri_id: document.getElementById('prestasi-santri').value,
            nama_kegiatan: document.getElementById('prestasi-kegiatan').value.trim(),
            keterangan: document.getElementById('prestasi-keterangan').value,
            kategori_kegiatan: document.getElementById('prestasi-kategori').value,
            tahun_ajaran: document.getElementById('prestasi-tahun').value.trim()
        };

        if (!payload.santri_id || !payload.nama_kegiatan || !payload.keterangan || !payload.kategori_kegiatan || !payload.tahun_ajaran) {
            alert('Lengkapi semua field.');
            return;
        }

        if (editingId) {
            await updatePrestasi(editingId, payload);
        } else {
            await insertPrestasi(payload);
        }
        await loadData();
        resetForm();
    });
});
