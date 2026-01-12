let santriId = null;
let santriData = null;
let prestasiData = [];
let prestasiCategories = [];
let prestasiKeteranganOptions = [];
let editingId = null;

const FALLBACK_PRESTASI_CATEGORIES = ['OPPM', 'KGGP', 'Instansi', 'KMI', 'Antar Kampus'];
const FALLBACK_PRESTASI_KETERANGAN = ['Juara 1', 'Juara 2', 'Juara 3', 'Harapan 1', 'Harapan 2', 'Harapan 3', 'Pengikut'];

function statusClassName(status) {
    return (status || '').toLowerCase().replace(/\s+/g, '-');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (e) {
        return dateString;
    }
}

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

async function loadMasterData() {
    const categories = await getPrestasiCategories();
    const keterangan = await getPrestasiKeteranganOptions();

    prestasiCategories = categories.length ? categories.map(item => item.name) : FALLBACK_PRESTASI_CATEGORIES;
    prestasiKeteranganOptions = keterangan.length ? keterangan.map(item => item.label) : FALLBACK_PRESTASI_KETERANGAN;
}

function populatePrestasiSelects() {
    const kategoriSelect = document.getElementById('prestasi-kategori');
    const keteranganSelect = document.getElementById('prestasi-keterangan');

    if (kategoriSelect) {
        const current = kategoriSelect.value;
        kategoriSelect.innerHTML = '<option value="">Pilih Kategori</option>' +
            prestasiCategories.map(item => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`).join('');
        if (current && prestasiCategories.includes(current)) {
            kategoriSelect.value = current;
        }
    }

    if (keteranganSelect) {
        const current = keteranganSelect.value;
        keteranganSelect.innerHTML = '<option value="">Pilih Keterangan</option>' +
            prestasiKeteranganOptions.map(item => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`).join('');
        if (current && prestasiKeteranganOptions.includes(current)) {
            keteranganSelect.value = current;
        }
    }
}

function showError() {
    document.getElementById('loading-state').style.display = 'none';
    document.getElementById('detail-content').style.display = 'none';
    document.getElementById('error-state').style.display = 'block';
}

function displaySantriDetail() {
    const loadingState = document.getElementById('loading-state');
    const errorState = document.getElementById('error-state');
    const detailContent = document.getElementById('detail-content');

    loadingState.style.display = 'none';
    errorState.style.display = 'none';
    detailContent.style.display = 'block';

    document.getElementById('detail-nama').textContent = santriData.nama || '-';
    document.getElementById('detail-nama-lengkap').innerHTML = `<strong>${escapeHtml(santriData.nama || '-')}</strong>`;
    document.getElementById('detail-nomor-stambuk').textContent = santriData.nomorStambuk || '-';
    document.getElementById('detail-ayah').textContent = santriData.ayah || '-';
    document.getElementById('detail-tempat-lahir').textContent = santriData.tempatLahir || '-';
    document.getElementById('detail-tanggal-lahir').textContent = formatDate(santriData.tanggalLahir);
    document.getElementById('detail-daerah').textContent = santriData.daerah || '-';
    document.getElementById('detail-kelas').textContent = santriData.kelas || '-';
    document.getElementById('detail-no-absen').textContent = santriData.noAbsen || '-';
    document.getElementById('detail-asrama').textContent = santriData.asrama || '-';
    document.getElementById('detail-konsulat').textContent = santriData.konsulat || '-';

    const status = santriData.status || '-';
    const statusClass = statusClassName(status);
    document.getElementById('detail-status').textContent = status;
    document.getElementById('detail-status').className = `badge badge-${statusClass}`;
    document.getElementById('detail-status-value').innerHTML = `<span class="badge badge-${statusClass}">${escapeHtml(status)}</span>`;

    document.getElementById('detail-created').textContent = formatDate(santriData.createdAt);

    if (santriData.updatedAt && santriData.updatedAt !== santriData.createdAt) {
        document.getElementById('detail-updated').textContent = formatDate(santriData.updatedAt);
        document.getElementById('detail-updated-item').style.display = 'grid';
    } else {
        document.getElementById('detail-updated-item').style.display = 'none';
    }
}

function resetForm() {
    editingId = null;
    document.getElementById('prestasi-form').reset();
    document.getElementById('prestasi-tahun').value = getHijriAcademicYear();
    document.getElementById('prestasi-mode').textContent = '';
    document.getElementById('prestasi-cancel').style.display = 'none';
    document.getElementById('prestasi-submit').textContent = 'Simpan';
    populatePrestasiSelects();
}

function renderTable() {
    const tbody = document.getElementById('prestasi-tbody');
    if (!tbody) return;

    const isAdmin = window.currentUserRole === 'admin';
    const actionHeader = document.getElementById('prestasi-aksi');
    if (actionHeader) {
        actionHeader.style.display = isAdmin ? '' : 'none';
    }

    if (prestasiData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Belum ada data prestasi.</td></tr>';
        return;
    }

    tbody.innerHTML = prestasiData.map((item, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(item.nama_kegiatan || '-')}</td>
            <td>${escapeHtml(item.keterangan || '-')}</td>
            <td>${escapeHtml(item.kategori_kegiatan || '-')}</td>
            <td>${escapeHtml(item.tahun_ajaran || '-')}</td>
            <td style="${isAdmin ? '' : 'display:none;'}">
                <button class="btn btn-secondary" data-action="edit" data-id="${item.id}">Edit</button>
                <button class="btn btn-danger" data-action="delete" data-id="${item.id}">Hapus</button>
            </td>
        </tr>
    `).join('');
}

async function loadData() {
    try {
        santriData = await getSantriById(santriId);
        if (!santriData) {
            showError();
            return;
        }
        await loadMasterData();
        prestasiData = (await getPrestasi()).filter(item => item.santri_id === santriId);
        populatePrestasiSelects();
        displaySantriDetail();
        renderTable();
    } catch (error) {
        console.error('Error loading data:', error);
        showError();
    }
}

function setFormFromItem(item) {
    editingId = item.id;
    document.getElementById('prestasi-kegiatan').value = item.nama_kegiatan || '';
    document.getElementById('prestasi-keterangan').value = item.keterangan || '';
    document.getElementById('prestasi-kategori').value = item.kategori_kegiatan || '';
    document.getElementById('prestasi-tahun').value = item.tahun_ajaran || getHijriAcademicYear();
    document.getElementById('prestasi-mode').textContent = 'Mode: Edit';
    document.getElementById('prestasi-cancel').style.display = 'inline-flex';
    document.getElementById('prestasi-submit').textContent = 'Update';
}

async function deletePrestasiItem(id) {
    if (!confirm('Hapus data prestasi ini?')) return;
    const success = await deletePrestasi(id);
    if (success) {
        await loadData();
    }
}

function handleTableClick(event) {
    const button = event.target.closest('button');
    if (!button) return;
    const id = button.getAttribute('data-id');
    const action = button.getAttribute('data-action');
    if (!id || !action) return;

    if (action === 'edit') {
        const item = prestasiData.find(p => p.id === id);
        if (item) {
            setFormFromItem(item);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        return;
    }

    if (action === 'delete') {
        deletePrestasiItem(id);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const role = await requireAuth();
    if (!role) return;

    const params = new URLSearchParams(window.location.search);
    santriId = params.get('santri');
    if (!santriId) {
        showError();
        return;
    }

    document.getElementById('prestasi-tahun').value = getHijriAcademicYear();

    if (role !== 'admin') {
        document.getElementById('prestasi-form').style.display = 'none';
        document.getElementById('prestasi-readonly').style.display = 'block';
        const actionHeader = document.getElementById('prestasi-aksi');
        if (actionHeader) actionHeader.style.display = 'none';
    }

    await new Promise(resolve => setTimeout(resolve, 500));
    await loadData();

    document.getElementById('prestasi-cancel').addEventListener('click', resetForm);
    document.getElementById('prestasi-tbody').addEventListener('click', handleTableClick);

    document.getElementById('prestasi-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        if (role !== 'admin') return;

        const payload = {
            santri_id: santriId,
            nama_kegiatan: document.getElementById('prestasi-kegiatan').value.trim(),
            keterangan: document.getElementById('prestasi-keterangan').value,
            kategori_kegiatan: document.getElementById('prestasi-kategori').value,
            tahun_ajaran: document.getElementById('prestasi-tahun').value.trim()
        };

        if (!payload.nama_kegiatan || !payload.keterangan || !payload.kategori_kegiatan || !payload.tahun_ajaran) {
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
