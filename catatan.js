let catatanData = [];
let santriData = [];
let catatanCategories = [];
let catatanSubcategories = [];
let catatanKeteranganOptions = [];
let editingId = null;
let currentPage = 1;
const ITEMS_PER_PAGE = 20;
let labelToIdMap = new Map();
let idToLabelMap = new Map();

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

function escapeHtml(value) {
    return (value || '')
        .toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function statusClassName(status) {
    return (status || '').toLowerCase().replace(/\s+/g, '-');
}

function normalizeKelas(kelas) {
    return (kelas || '').toString().trim().replace(/\s+/g, ' ');
}

function getWaliKelas() {
    return normalizeKelas(window.currentUserKelas || '');
}

function parseKelasKey(kelas) {
    const normalized = normalizeKelas(kelas).replace(/\s+/g, '');
    const match = normalized.match(/^(\d+)([A-Za-z]+)?$/);
    if (!match) {
        return { num: Number.MAX_SAFE_INTEGER, suffix: normalized || 'zz' };
    }
    return { num: parseInt(match[1], 10), suffix: (match[2] || '').toUpperCase() };
}

function compareSantri(a, b) {
    const aKey = parseKelasKey(a.kelas);
    const bKey = parseKelasKey(b.kelas);
    if (aKey.num !== bKey.num) return aKey.num - bKey.num;
    const suffixCompare = aKey.suffix.localeCompare(bKey.suffix, 'id');
    if (suffixCompare !== 0) return suffixCompare;
    const aAbsen = parseInt(a.noAbsen, 10);
    const bAbsen = parseInt(b.noAbsen, 10);
    if (!Number.isNaN(aAbsen) && !Number.isNaN(bAbsen) && aAbsen !== bAbsen) {
        return aAbsen - bAbsen;
    }
    return (a.nama || '').localeCompare(b.nama || '', 'id');
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

function buildSantriLabel(santri) {
    const kelas = santri.kelas || '-';
    const identity = santri.nomorStambuk || santri.id.slice(0, 8);
    return `${santri.nama} (${kelas}) - #${identity}`;
}

function populateSantriDatalist() {
    const datalist = document.getElementById('catatan-santri-list');
    if (!datalist) return;
    labelToIdMap = new Map();
    idToLabelMap = new Map();
    const options = santriData.map(santri => {
        const label = buildSantriLabel(santri);
        labelToIdMap.set(label.toLowerCase(), santri.id);
        idToLabelMap.set(santri.id, label);
        return `<option value="${escapeHtml(label)}"></option>`;
    }).join('');
    datalist.innerHTML = options;
}

function resolveSantriInput() {
    const input = document.getElementById('catatan-santri-input');
    const hidden = document.getElementById('catatan-santri');
    if (!input || !hidden) return;
    const key = (input.value || '').trim().toLowerCase();
    hidden.value = labelToIdMap.get(key) || '';
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

function populateFilterKategori() {
    const select = document.getElementById('catatan-filter-kategori');
    if (!select) return;
    const current = select.value;
    select.innerHTML = '<option value=\"\">Semua Kategori</option>' +
        catatanCategories.map(item => `<option value=\"${escapeHtml(item.name)}\">${escapeHtml(item.name)}</option>`).join('');
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

function resetForm() {
    editingId = null;
    document.getElementById('catatan-form').reset();
    document.getElementById('catatan-tahun').value = getHijriAcademicYear();
    document.getElementById('catatan-mode').textContent = '';
    document.getElementById('catatan-cancel').style.display = 'none';
    document.getElementById('catatan-submit').textContent = 'Simpan';
    updateCategoryDependentFields('', '', '');
    const hidden = document.getElementById('catatan-santri');
    if (hidden) hidden.value = '';
}

function buildCatatanMap() {
    const map = new Map();
    catatanData.forEach(item => {
        const list = map.get(item.santri_id) || [];
        list.push(item);
        map.set(item.santri_id, list);
    });
    return map;
}

function getFilters() {
    return {
        search: (document.getElementById('catatan-search')?.value || '').trim().toLowerCase(),
        kelas: document.getElementById('catatan-filter-kelas')?.value || '',
        status: document.getElementById('catatan-filter-status')?.value || '',
        kategori: document.getElementById('catatan-filter-kategori')?.value || ''
    };
}

function filterSantri() {
    const { search, kelas, status, kategori } = getFilters();
    const catatanMap = buildCatatanMap();
    return santriData.filter(santri => {
        const matchesSearch = !search ||
            (santri.nama && santri.nama.toLowerCase().includes(search)) ||
            (santri.kelas && santri.kelas.toLowerCase().includes(search)) ||
            (santri.nomorStambuk && String(santri.nomorStambuk).toLowerCase().includes(search));

        const matchesKelas = !kelas || santri.kelas === kelas;
        const matchesStatus = !status || santri.status === status;
        let matchesKategori = true;
        if (kategori) {
            const entries = catatanMap.get(santri.id) || [];
            matchesKategori = entries.some(entry => entry.kategori === kategori);
        }
        return matchesSearch && matchesKelas && matchesStatus && matchesKategori;
    });
}

function updateKelasFilter() {
    const select = document.getElementById('catatan-filter-kelas');
    if (!select) return;
    const current = select.value;
    const kelasList = [...new Set(santriData.map(s => s.kelas).filter(Boolean))];
    kelasList.sort((a, b) => {
        const aKey = parseKelasKey(a);
        const bKey = parseKelasKey(b);
        if (aKey.num !== bKey.num) return aKey.num - bKey.num;
        return aKey.suffix.localeCompare(bKey.suffix, 'id');
    });
    select.innerHTML = '<option value="">Semua Kelas</option>' +
        kelasList.map(k => `<option value="${escapeHtml(k)}">${escapeHtml(k)}</option>`).join('');
    if (current && kelasList.includes(current)) {
        select.value = current;
    }
    const waliKelas = getWaliKelas();
    if (window.currentUserRole === 'wali_kelas' && waliKelas) {
        select.value = waliKelas;
        select.disabled = true;
    }
}

function renderSantriTable() {
    const tbody = document.getElementById('catatan-santri-tbody');
    if (!tbody) return;
    const filtered = filterSantri();
    const totalCount = document.getElementById('catatan-total-count');
    if (totalCount) {
        totalCount.textContent = `Total: ${filtered.length} santri`;
    }

    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    if (currentPage > totalPages) currentPage = totalPages;
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const items = filtered.slice(start, start + ITEMS_PER_PAGE);

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Belum ada data santri.</td></tr>';
    } else {
        tbody.innerHTML = items.map((santri, index) => {
            const statusClass = `badge-${statusClassName(santri.status)}`;
            return `
            <tr>
                <td>${start + index + 1}</td>
                <td>${escapeHtml(santri.nama || '-')}</td>
                <td>${escapeHtml(santri.kelas || '-')}</td>
                <td><span class="badge ${statusClass}">${escapeHtml(santri.status || '-')}</span></td>
                <td>
                    <button class="btn btn-info" data-action="detail" data-id="${santri.id}">Detail</button>
                </td>
            </tr>
            `;
        }).join('');
    }

    const pageInfo = document.getElementById('catatan-page-info');
    if (pageInfo) pageInfo.textContent = `Halaman ${currentPage}`;
    const prev = document.getElementById('catatan-prev');
    const next = document.getElementById('catatan-next');
    if (prev) prev.disabled = currentPage <= 1;
    if (next) next.disabled = currentPage >= totalPages;
}

async function loadData() {
    santriData = (await getAllSantri()).filter(s => (s.status || '').toLowerCase() === 'aktif');
    const waliKelas = getWaliKelas();
    if (window.currentUserRole === 'wali_kelas' && waliKelas) {
        santriData = santriData.filter(s => normalizeKelas(s.kelas) === waliKelas);
    }
    catatanData = await getCatatan();
    if (window.currentUserRole === 'wali_kelas' && santriData.length) {
        const allowedIds = new Set(santriData.map(s => s.id));
        catatanData = catatanData.filter(item => allowedIds.has(item.santri_id));
    }
    santriData.sort(compareSantri);
    await loadMasterData();
    populateSantriDatalist();
    updateKelasFilter();
    populateCategorySelect();
    populateFilterKategori();
    updateCategoryDependentFields(document.getElementById('catatan-kategori').value, '', '');
    renderSantriTable();
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

function handleTableClick(event) {
    const button = event.target.closest('button');
    if (!button) return;
    const id = button.getAttribute('data-id');
    const action = button.getAttribute('data-action');
    if (!id || !action) return;

    if (action === 'detail') {
        window.location.href = `catatan-detail.html?santri=${encodeURIComponent(id)}`;
        return;
    }

    if (action === 'edit') {
        const item = catatanData.find(p => p.id === id);
        if (item) {
            setFormFromItem(item);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const role = await requireAuth();
    if (!role) return;

    document.getElementById('catatan-tahun').value = getHijriAcademicYear();

    const canEdit = role === 'admin' || role === 'wali_kelas';
    if (!canEdit) {
        document.getElementById('catatan-form').style.display = 'none';
        document.getElementById('catatan-readonly').style.display = 'block';
    }

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
    document.getElementById('catatan-santri-input').addEventListener('input', () => {
        const hidden = document.getElementById('catatan-santri');
        if (hidden) hidden.value = '';
    });
    document.getElementById('catatan-santri-input').addEventListener('change', resolveSantriInput);
    document.getElementById('catatan-santri-input').addEventListener('blur', resolveSantriInput);

    document.getElementById('catatan-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!canEdit) return;

        resolveSantriInput();
        const kategori = document.getElementById('catatan-kategori').value;
        const payload = {
            santri_id: document.getElementById('catatan-santri').value,
            kategori,
            sub_kategori: document.getElementById('catatan-subkategori').value,
            keterangan: getKeteranganValue(kategori) || null,
            tahun_ajaran: document.getElementById('catatan-tahun').value.trim()
        };

        if (!payload.santri_id || !payload.kategori || !payload.sub_kategori || !payload.tahun_ajaran) {
            alert('Lengkapi semua field dengan memilih santri dari daftar.');
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

    document.getElementById('catatan-search').addEventListener('input', () => {
        currentPage = 1;
        renderSantriTable();
    });
    document.getElementById('catatan-filter-kelas').addEventListener('change', () => {
        currentPage = 1;
        renderSantriTable();
    });
    document.getElementById('catatan-filter-status').addEventListener('change', () => {
        currentPage = 1;
        renderSantriTable();
    });
    document.getElementById('catatan-filter-kategori').addEventListener('change', () => {
        currentPage = 1;
        renderSantriTable();
    });

    document.getElementById('catatan-prev').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage -= 1;
            renderSantriTable();
        }
    });
    document.getElementById('catatan-next').addEventListener('click', () => {
        currentPage += 1;
        renderSantriTable();
    });

    document.getElementById('catatan-santri-tbody').addEventListener('click', handleTableClick);
});
