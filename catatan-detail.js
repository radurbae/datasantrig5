let santriId = null;
let santriData = null;
let allSantri = [];
let catatanData = [];
let catatanCategories = [];
let catatanSubcategories = [];
let catatanKeteranganOptions = [];
let editingId = null;

const FALLBACK_CATATAN_CATEGORIES = ['OPPM', 'KGGP', 'Instansi', 'KMI', 'Kepanitiaan'];
const FALLBACK_OPPM_GROUPS = {
    Bagian: [
        'Ketua OPPM',
        'Sekretaris Pusat',
        'Bendahara Pusat',
        'Keamanan',
        'Pengajaran',
        "Ta'mir Masjid",
        'Penggerak Bahasa',
        'Olahraga',
        'Penerangan',
        'Koperasi Pelajar',
        'Koperasi Warung Pelajar',
        'Koperasi Dapur',
        'Penatu',
        'Kesenian',
        'Keterampilan',
        'Kesehatan',
        'Bersih Lingkungan',
        'Pertamanan',
        'Fotografi',
        'Penerimaan Tamu',
        'Perpustakaan'
    ],
    Rayon: ['Ghaza 1', 'Ghaza 2', 'Santiniketan', 'Syanggit', 'Mekkah', 'Mesir', 'Riyadh'],
    Klub: [
        'Samba FC',
        'Etihad FC',
        'Soccer FC',
        'Bima FC',
        'Eternal FAC',
        'Forious FAC',
        'Emirates FAC',
        'Libero FAC',
        'Boeing BBC',
        'Pioneer BBC',
        "D'Legend BC",
        'Blaze VBC'
    ],
    Kursus: ['Gastrada', 'Art Gallery', 'X-Tidaq', 'Alshodaq', 'Vodcom', 'Markaz Khot', 'MBBND']
};
const FALLBACK_OPPM_KETERANGAN = ['Ketua', 'Sekretaris', 'Bendahara', 'Anggota'];
const FALLBACK_SUBCATEGORIES = {
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

function buildFallbackSubcategories() {
    const items = [];
    Object.entries(FALLBACK_OPPM_GROUPS).forEach(([group, names]) => {
        names.forEach(name => {
            items.push({ categoryName: 'OPPM', groupName: group, name });
        });
    });
    Object.entries(FALLBACK_SUBCATEGORIES).forEach(([categoryName, names]) => {
        names.forEach(name => {
            items.push({ categoryName, groupName: '', name });
        });
    });
    return items;
}

async function loadMasterData() {
    const categoryData = await getCatatanCategories();
    const subcategoryData = await getCatatanSubcategories();
    const keteranganData = await getCatatanKeteranganOptions();

    if (categoryData.length) {
        catatanCategories = categoryData.map(item => ({ id: item.id, name: item.name }));
    } else {
        catatanCategories = FALLBACK_CATATAN_CATEGORIES.map(name => ({ id: null, name }));
    }

    const categoryById = new Map(catatanCategories.filter(c => c.id).map(c => [c.id, c.name]));
    if (subcategoryData.length) {
        catatanSubcategories = subcategoryData.map(item => ({
            id: item.id,
            categoryId: item.category_id,
            categoryName: categoryById.get(item.category_id) || 'Unknown',
            groupName: item.group_name || '',
            name: item.name
        }));
    } else {
        catatanSubcategories = buildFallbackSubcategories();
    }

    if (keteranganData.length) {
        catatanKeteranganOptions = keteranganData.map(item => ({
            id: item.id,
            categoryId: item.category_id,
            categoryName: categoryById.get(item.category_id) || 'Unknown',
            label: item.label
        }));
    } else {
        catatanKeteranganOptions = FALLBACK_OPPM_KETERANGAN.map(label => ({
            id: null,
            categoryId: null,
            categoryName: 'OPPM',
            label
        }));
    }
}

function populateCategorySelect() {
    const select = document.getElementById('catatan-kategori');
    if (!select) return;
    const current = select.value;
    select.innerHTML = '<option value="">Pilih Kategori</option>' +
        catatanCategories.map(item => `<option value="${escapeHtml(item.name)}">${escapeHtml(item.name)}</option>`).join('');
    if (current && catatanCategories.some(item => item.name === current)) {
        select.value = current;
    }
}

function populateSubcategoryGroup(categoryName, preferredGroup) {
    const field = document.getElementById('catatan-subkategori-group-field');
    const select = document.getElementById('catatan-subkategori-group');
    if (!field || !select) return '';

    const groups = [...new Set(catatanSubcategories
        .filter(item => item.categoryName === categoryName)
        .map(item => item.groupName)
        .filter(group => group))];

    if (!groups.length) {
        field.style.display = 'none';
        select.innerHTML = '<option value="">Pilih Jenis</option>';
        select.required = false;
        return '';
    }

    field.style.display = 'block';
    select.required = true;
    select.innerHTML = '<option value="">Pilih Jenis</option>' +
        groups.map(group => `<option value="${escapeHtml(group)}">${escapeHtml(group)}</option>`).join('');
    if (preferredGroup && groups.includes(preferredGroup)) {
        select.value = preferredGroup;
    } else if (!select.value && groups.length === 1) {
        select.value = groups[0];
    }

    return select.value;
}

function populateSubcategorySelect(categoryName, groupName, preferredSubcategory) {
    const select = document.getElementById('catatan-subkategori');
    if (!select) return;

    let options = [];
    const hasMasterSubcategories = catatanSubcategories.some(item => item.categoryName === categoryName);
    if (categoryName === 'KMI' && !hasMasterSubcategories) {
        options = getKmiOptions();
    } else {
        options = catatanSubcategories
            .filter(item => item.categoryName === categoryName)
            .filter(item => !groupName || item.groupName === groupName)
            .map(item => item.name);
    }

    select.innerHTML = '<option value="">Pilih Sub Kategori</option>' +
        options.map(opt => `<option value="${escapeHtml(opt)}">${escapeHtml(opt)}</option>`).join('');

    if (preferredSubcategory && options.includes(preferredSubcategory)) {
        select.value = preferredSubcategory;
    }
}

function populateKeteranganSelect(categoryName, preferredValue) {
    const textInput = document.getElementById('catatan-keterangan-text');
    const selectInput = document.getElementById('catatan-keterangan-select');
    if (!textInput || !selectInput) return;

    const options = catatanKeteranganOptions
        .filter(item => item.categoryName === categoryName)
        .map(item => item.label);

    if (options.length) {
        selectInput.style.display = 'block';
        textInput.style.display = 'none';
        selectInput.required = true;
        textInput.required = false;
        selectInput.innerHTML = '<option value="">Pilih Keterangan</option>' +
            options.map(opt => `<option value="${escapeHtml(opt)}">${escapeHtml(opt)}</option>`).join('');
        if (preferredValue && options.includes(preferredValue)) {
            selectInput.value = preferredValue;
        } else {
            selectInput.value = '';
        }
        textInput.value = '';
    } else {
        selectInput.style.display = 'none';
        textInput.style.display = 'block';
        selectInput.required = false;
        textInput.required = true;
        selectInput.innerHTML = '<option value="">Pilih Keterangan</option>';
        textInput.value = preferredValue || '';
    }
}

function getKeteranganValue(categoryName) {
    const textInput = document.getElementById('catatan-keterangan-text');
    const selectInput = document.getElementById('catatan-keterangan-select');
    if (!textInput || !selectInput) return '';

    const hasOptions = catatanKeteranganOptions.some(item => item.categoryName === categoryName);
    if (hasOptions) {
        return selectInput.value;
    }
    return textInput.value.trim();
}

function findGroupForSubcategory(categoryName, subcategoryName) {
    const match = catatanSubcategories.find(item => item.categoryName === categoryName && item.name === subcategoryName);
    return match ? match.groupName : '';
}

function updateCategoryDependentFields(categoryName, preferredSubcategory, preferredKeterangan) {
    const groupName = populateSubcategoryGroup(categoryName, findGroupForSubcategory(categoryName, preferredSubcategory));
    populateSubcategorySelect(categoryName, groupName, preferredSubcategory);
    populateKeteranganSelect(categoryName, preferredKeterangan);
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
    updateCategoryDependentFields('', '', '');
}

function renderTable() {
    const tbody = document.getElementById('catatan-tbody');
    if (!tbody) return;

    const isAdmin = window.currentUserRole === 'admin' || window.currentUserRole === 'wali_kelas';
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
        if (window.currentUserRole === 'wali_kelas') {
            const waliKelas = (window.currentUserKelas || '').toString().trim().toLowerCase();
            const santriKelas = (santriData.kelas || '').toString().trim().toLowerCase();
            if (waliKelas && santriKelas !== waliKelas) {
                showError();
                return;
            }
        }
        allSantri = (await getAllSantri()).filter(s => (s.status || '').toLowerCase() === 'aktif');
        if (window.currentUserRole === 'wali_kelas') {
            const waliKelas = (window.currentUserKelas || '').toString().trim().toLowerCase();
            if (waliKelas) {
                allSantri = allSantri.filter(s => (s.kelas || '').toString().trim().toLowerCase() === waliKelas);
            }
        }
        await loadMasterData();
        catatanData = (await getCatatan()).filter(item => item.santri_id === santriId);
        populateCategorySelect();
        updateCategoryDependentFields(document.getElementById('catatan-kategori').value, '', '');
        displaySantriDetail();
        renderTable();
    } catch (error) {
        console.error('Error loading data:', error);
        showError();
    }
}

function setFormFromItem(item) {
    editingId = item.id;
    document.getElementById('catatan-kategori').value = item.kategori || '';
    updateCategoryDependentFields(item.kategori || '', item.sub_kategori || '', item.keterangan || '');
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

    const canEdit = role === 'admin' || role === 'wali_kelas';
    if (!canEdit) {
        document.getElementById('catatan-form').style.display = 'none';
        document.getElementById('catatan-readonly').style.display = 'block';
        const actionHeader = document.getElementById('catatan-aksi');
        if (actionHeader) actionHeader.style.display = 'none';
    }

    await new Promise(resolve => setTimeout(resolve, 500));
    await loadData();

    document.getElementById('catatan-cancel').addEventListener('click', resetForm);
    document.getElementById('catatan-kategori').addEventListener('change', (e) => {
        updateCategoryDependentFields(e.target.value, '', '');
    });
    document.getElementById('catatan-subkategori-group').addEventListener('change', () => {
        const category = document.getElementById('catatan-kategori').value;
        const group = document.getElementById('catatan-subkategori-group').value;
        populateSubcategorySelect(category, group, '');
    });
    document.getElementById('catatan-tbody').addEventListener('click', handleTableClick);

    document.getElementById('catatan-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!canEdit) return;

        const kategori = document.getElementById('catatan-kategori').value;
        const payload = {
            santri_id: santriId,
            kategori,
            sub_kategori: document.getElementById('catatan-subkategori').value,
            keterangan: getKeteranganValue(kategori) || null,
            tahun_ajaran: document.getElementById('catatan-tahun').value.trim()
        };

        if (!payload.kategori || !payload.sub_kategori || !payload.tahun_ajaran) {
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
