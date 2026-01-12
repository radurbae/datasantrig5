let catatanData = [];
let santriData = [];
let editingId = null;
let currentPage = 1;
const ITEMS_PER_PAGE = 20;
let labelToIdMap = new Map();
let idToLabelMap = new Map();

const SUBCATEGORY_MAP = {
    OPPM: ['Bagian', 'Rayon', 'Klub', 'Kursus'],
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

function resetForm() {
    editingId = null;
    document.getElementById('catatan-form').reset();
    document.getElementById('catatan-tahun').value = getHijriAcademicYear();
    document.getElementById('catatan-mode').textContent = '';
    document.getElementById('catatan-cancel').style.display = 'none';
    document.getElementById('catatan-submit').textContent = 'Simpan';
    populateSubcategory('');
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
    santriData = await getAllSantri();
    catatanData = await getCatatan();
    santriData.sort(compareSantri);
    populateSantriDatalist();
    updateKelasFilter();
    renderSantriTable();
    populateSubcategory(document.getElementById('catatan-kategori').value);
}

function setFormFromItem(item) {
    editingId = item.id;
    const label = idToLabelMap.get(item.santri_id) || '';
    document.getElementById('catatan-santri-input').value = label;
    document.getElementById('catatan-santri').value = item.santri_id;
    document.getElementById('catatan-kategori').value = item.kategori || '';
    populateSubcategory(item.kategori);
    document.getElementById('catatan-subkategori').value = item.sub_kategori || '';
    document.getElementById('catatan-keterangan').value = item.keterangan || '';
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

    if (role !== 'admin') {
        document.getElementById('catatan-form').style.display = 'none';
        document.getElementById('catatan-readonly').style.display = 'block';
    }

    await loadData();

    document.getElementById('catatan-cancel').addEventListener('click', resetForm);
    document.getElementById('catatan-kategori').addEventListener('change', (e) => {
        populateSubcategory(e.target.value);
    });
    document.getElementById('catatan-santri-input').addEventListener('input', () => {
        const hidden = document.getElementById('catatan-santri');
        if (hidden) hidden.value = '';
    });
    document.getElementById('catatan-santri-input').addEventListener('change', resolveSantriInput);
    document.getElementById('catatan-santri-input').addEventListener('blur', resolveSantriInput);

    document.getElementById('catatan-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        if (role !== 'admin') return;

        resolveSantriInput();
        const payload = {
            santri_id: document.getElementById('catatan-santri').value,
            kategori: document.getElementById('catatan-kategori').value,
            sub_kategori: document.getElementById('catatan-subkategori').value,
            keterangan: document.getElementById('catatan-keterangan').value.trim(),
            tahun_ajaran: document.getElementById('catatan-tahun').value.trim()
        };

        if (!payload.santri_id || !payload.kategori || !payload.sub_kategori || !payload.keterangan || !payload.tahun_ajaran) {
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
