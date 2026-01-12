let santriId = null;
let santriData = null;
let allSantri = [];
let catatanData = [];
let editingId = null;

const SUBCATEGORY_MAP = {
    OPPM: ['Bagian', 'Rayon', 'Klub', 'Kursus'],
    KGGP: ['Bagian', 'POT', 'Kontingen'],
    Instansi: ['ITQAN', 'FP2WS', 'JMQ', 'JMH', 'DQPOS', 'LAB KMI'],
    Kepanitiaan: ['Panitia 1', 'Panitia 2', 'Panitia 3']
};

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
    const kelasList = [...new Set(allSantri.map(s => normalizeKelas(s.kelas)).filter(Boolean))];
    kelasList.sort((a, b) => {
        const aKey = parseKelasKey(a);
        const bKey = parseKelasKey(b);
        if (aKey.num !== bKey.num) return aKey.num - bKey.num;
        return aKey.suffix.localeCompare(bKey.suffix, 'id');
    });
    return kelasList.length ? kelasList : ['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'];
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
        options.map(opt => `<option value="${escapeHtml(opt)}">${escapeHtml(opt)}</option>`).join('');
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
    document.getElementById('catatan-form').reset();
    document.getElementById('catatan-tahun').value = getHijriAcademicYear();
    document.getElementById('catatan-mode').textContent = '';
    document.getElementById('catatan-cancel').style.display = 'none';
    document.getElementById('catatan-submit').textContent = 'Simpan';
    populateSubcategory('');
}

function renderTable() {
    const tbody = document.getElementById('catatan-tbody');
    if (!tbody) return;

    const isAdmin = window.currentUserRole === 'admin';
    const actionHeader = document.getElementById('catatan-aksi');
    if (actionHeader) {
        actionHeader.style.display = isAdmin ? '' : 'none';
    }

    if (catatanData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Belum ada data catatan.</td></tr>';
        return;
    }

    tbody.innerHTML = catatanData.map((item, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(item.kategori || '-')}</td>
            <td>${escapeHtml(item.sub_kategori || '-')}</td>
            <td>${escapeHtml(item.keterangan || '-')}</td>
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
        allSantri = await getAllSantri();
        catatanData = (await getCatatan()).filter(item => item.santri_id === santriId);
        displaySantriDetail();
        populateSubcategory(document.getElementById('catatan-kategori').value);
        renderTable();
    } catch (error) {
        console.error('Error loading data:', error);
        showError();
    }
}

function setFormFromItem(item) {
    editingId = item.id;
    document.getElementById('catatan-kategori').value = item.kategori || '';
    populateSubcategory(item.kategori);
    document.getElementById('catatan-subkategori').value = item.sub_kategori || '';
    document.getElementById('catatan-keterangan').value = item.keterangan || '';
    document.getElementById('catatan-tahun').value = item.tahun_ajaran || getHijriAcademicYear();
    document.getElementById('catatan-mode').textContent = 'Mode: Edit';
    document.getElementById('catatan-cancel').style.display = 'inline-flex';
    document.getElementById('catatan-submit').textContent = 'Update';
}

async function deleteCatatanItem(id) {
    if (!confirm('Hapus data catatan ini?')) return;
    const success = await deleteCatatan(id);
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
        const item = catatanData.find(p => p.id === id);
        if (item) {
            setFormFromItem(item);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        return;
    }

    if (action === 'delete') {
        deleteCatatanItem(id);
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

    document.getElementById('catatan-tahun').value = getHijriAcademicYear();

    if (role !== 'admin') {
        document.getElementById('catatan-form').style.display = 'none';
        document.getElementById('catatan-readonly').style.display = 'block';
        const actionHeader = document.getElementById('catatan-aksi');
        if (actionHeader) actionHeader.style.display = 'none';
    }

    await new Promise(resolve => setTimeout(resolve, 500));
    await loadData();

    document.getElementById('catatan-cancel').addEventListener('click', resetForm);
    document.getElementById('catatan-kategori').addEventListener('change', (e) => {
        populateSubcategory(e.target.value);
    });
    document.getElementById('catatan-tbody').addEventListener('click', handleTableClick);

    document.getElementById('catatan-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        if (role !== 'admin') return;

        if (!confirm('Apakah data sudah benar?')) return;

        const payload = {
            santri_id: santriId,
            kategori: document.getElementById('catatan-kategori').value,
            sub_kategori: document.getElementById('catatan-subkategori').value,
            keterangan: document.getElementById('catatan-keterangan').value.trim(),
            tahun_ajaran: document.getElementById('catatan-tahun').value.trim()
        };

        if (!payload.kategori || !payload.sub_kategori || !payload.keterangan || !payload.tahun_ajaran) {
            alert('Lengkapi semua field.');
            return;
        }

        if (editingId) {
            await updateCatatan(editingId, payload);
        } else {
            await insertCatatan(payload);
        }
        alert('Data catatan berhasil disimpan.');
        await loadData();
        resetForm();
    });
});
