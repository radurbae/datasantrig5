let prestasiData = [];
let santriData = [];
let prestasiCategories = [];
let prestasiKeteranganOptions = [];
let prestasiKegiatanOptions = [];
let editingId = null;
let currentPage = 1;
const ITEMS_PER_PAGE = 20;
let labelToIdMap = new Map();
let idToLabelMap = new Map();

const FALLBACK_PRESTASI_CATEGORIES = ['OPPM', 'KGGP', 'Instansi', 'KMI', 'Antar Kampus'];
const FALLBACK_PRESTASI_KETERANGAN = ['Juara 1', 'Juara 2', 'Juara 3', 'Harapan 1', 'Harapan 2', 'Harapan 3', 'Pengikut'];

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
    const datalist = document.getElementById('prestasi-santri-list');
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

function populateKegiatanSelect() {
    const select = document.getElementById('prestasi-kegiatan');
    if (!select) return;
    const current = select.value;
    select.innerHTML = '<option value="">Pilih Nama Kegiatan</option>' +
        prestasiKegiatanOptions.map(item => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`).join('');
    if (current && prestasiKegiatanOptions.includes(current)) {
        select.value = current;
    }
}

function resolveSantriInput() {
    const input = document.getElementById('prestasi-santri-input');
    const hidden = document.getElementById('prestasi-santri');
    if (!input || !hidden) return;
    const key = (input.value || '').trim().toLowerCase();
    hidden.value = labelToIdMap.get(key) || '';
}

async function loadMasterData() {
    const categories = await getPrestasiCategories();
    const keterangan = await getPrestasiKeteranganOptions();
    const kegiatan = await getPrestasiKegiatanOptions();

    prestasiCategories = categories.length ? categories.map(item => item.name) : FALLBACK_PRESTASI_CATEGORIES;
    prestasiKeteranganOptions = keterangan.length ? keterangan.map(item => item.label) : FALLBACK_PRESTASI_KETERANGAN;
    prestasiKegiatanOptions = kegiatan.length ? kegiatan.map(item => item.label) : [];
}

function populatePrestasiSelects() {
    const kategoriSelect = document.getElementById('prestasi-kategori');
    const keteranganSelect = document.getElementById('prestasi-keterangan');
    const filterSelect = document.getElementById('prestasi-filter-kategori');

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

    if (filterSelect) {
        const current = filterSelect.value;
        filterSelect.innerHTML = '<option value="">Semua Kategori</option>' +
            prestasiCategories.map(item => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`).join('');
        if (current && prestasiCategories.includes(current)) {
            filterSelect.value = current;
        }
    }

    populateKegiatanSelect();
}

function resetForm() {
    editingId = null;
    document.getElementById('prestasi-form').reset();
    document.getElementById('prestasi-tahun').value = getHijriAcademicYear();
    document.getElementById('prestasi-mode').textContent = '';
    document.getElementById('prestasi-cancel').style.display = 'none';
    document.getElementById('prestasi-submit').textContent = 'Simpan';
    const hidden = document.getElementById('prestasi-santri');
    if (hidden) hidden.value = '';
    populatePrestasiSelects();
}

function buildPrestasiMap() {
    const map = new Map();
    prestasiData.forEach(item => {
        const list = map.get(item.santri_id) || [];
        list.push(item);
        map.set(item.santri_id, list);
    });
    return map;
}

function getFilters() {
    return {
        search: (document.getElementById('prestasi-search')?.value || '').trim().toLowerCase(),
        kelas: document.getElementById('prestasi-filter-kelas')?.value || '',
        status: document.getElementById('prestasi-filter-status')?.value || '',
        kategori: document.getElementById('prestasi-filter-kategori')?.value || ''
    };
}

function filterSantri() {
    const { search, kelas, status, kategori } = getFilters();
    const prestasiMap = buildPrestasiMap();
    return santriData.filter(santri => {
        const matchesSearch = !search ||
            (santri.nama && santri.nama.toLowerCase().includes(search)) ||
            (santri.kelas && santri.kelas.toLowerCase().includes(search)) ||
            (santri.nomorStambuk && String(santri.nomorStambuk).toLowerCase().includes(search));

        const matchesKelas = !kelas || santri.kelas === kelas;
        const matchesStatus = !status || santri.status === status;
        let matchesKategori = true;
        if (kategori) {
            const entries = prestasiMap.get(santri.id) || [];
            matchesKategori = entries.some(entry => entry.kategori_kegiatan === kategori);
        }
        return matchesSearch && matchesKelas && matchesStatus && matchesKategori;
    });
}

function updateKelasFilter() {
    const select = document.getElementById('prestasi-filter-kelas');
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
    const tbody = document.getElementById('prestasi-santri-tbody');
    if (!tbody) return;
    const filtered = filterSantri();
    const totalCount = document.getElementById('prestasi-total-count');
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

    const pageInfo = document.getElementById('prestasi-page-info');
    if (pageInfo) pageInfo.textContent = `Halaman ${currentPage}`;
    const prev = document.getElementById('prestasi-prev');
    const next = document.getElementById('prestasi-next');
    if (prev) prev.disabled = currentPage <= 1;
    if (next) next.disabled = currentPage >= totalPages;
}

async function loadData() {
    santriData = await getAllSantri();
    prestasiData = await getPrestasi();
    santriData.sort(compareSantri);
    await loadMasterData();
    populateSantriDatalist();
    updateKelasFilter();
    populatePrestasiSelects();
    renderSantriTable();
}

function setFormFromItem(item) {
    editingId = item.id;
    const label = idToLabelMap.get(item.santri_id) || '';
    document.getElementById('prestasi-santri-input').value = label;
    document.getElementById('prestasi-santri').value = item.santri_id;
    document.getElementById('prestasi-kegiatan').value = item.nama_kegiatan || '';
    document.getElementById('prestasi-keterangan').value = item.keterangan || '';
    document.getElementById('prestasi-kategori').value = item.kategori_kegiatan || '';
    document.getElementById('prestasi-tahun').value = item.tahun_ajaran || getHijriAcademicYear();
    document.getElementById('prestasi-mode').textContent = 'Mode: Edit';
    document.getElementById('prestasi-cancel').style.display = 'inline-flex';
    document.getElementById('prestasi-submit').textContent = 'Update';
}

function handleTableClick(event) {
    const button = event.target.closest('button');
    if (!button) return;
    const id = button.getAttribute('data-id');
    const action = button.getAttribute('data-action');
    if (!id || !action) return;

    if (action === 'detail') {
        window.location.href = `prestasi-detail.html?santri=${encodeURIComponent(id)}`;
        return;
    }

    if (action === 'edit') {
        const item = prestasiData.find(p => p.id === id);
        if (item) {
            setFormFromItem(item);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }
}

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
    document.getElementById('prestasi-santri-input').addEventListener('input', () => {
        const hidden = document.getElementById('prestasi-santri');
        if (hidden) hidden.value = '';
    });
    document.getElementById('prestasi-santri-input').addEventListener('change', resolveSantriInput);
    document.getElementById('prestasi-santri-input').addEventListener('blur', resolveSantriInput);

    document.getElementById('prestasi-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        if (role !== 'admin') return;

        if (!confirm('Apakah data ini sudah benar?')) return;

        resolveSantriInput();
        const payload = {
            santri_id: document.getElementById('prestasi-santri').value,
            nama_kegiatan: document.getElementById('prestasi-kegiatan').value,
            keterangan: document.getElementById('prestasi-keterangan').value.trim() || null,
            kategori_kegiatan: document.getElementById('prestasi-kategori').value,
            tahun_ajaran: document.getElementById('prestasi-tahun').value.trim()
        };

        if (!payload.santri_id || !payload.nama_kegiatan || !payload.kategori_kegiatan || !payload.tahun_ajaran) {
            alert('Lengkapi semua field dengan memilih santri dari daftar.');
            return;
        }

        if (!prestasiKegiatanOptions.length) {
            alert('Daftar nama kegiatan belum diisi. Tambahkan di Master Data.');
            return;
        }

        let success = false;
        if (editingId) {
            success = !!(await updatePrestasi(editingId, payload));
        } else {
            success = !!(await insertPrestasi(payload));
        }

        if (success) {
            alert('Data prestasi berhasil disimpan.');
            await loadData();
            resetForm();
        } else {
            alert('Data prestasi gagal disimpan.');
        }
    });

    document.getElementById('prestasi-search').addEventListener('input', () => {
        currentPage = 1;
        renderSantriTable();
    });
    document.getElementById('prestasi-filter-kelas').addEventListener('change', () => {
        currentPage = 1;
        renderSantriTable();
    });
    document.getElementById('prestasi-filter-status').addEventListener('change', () => {
        currentPage = 1;
        renderSantriTable();
    });
    document.getElementById('prestasi-filter-kategori').addEventListener('change', () => {
        currentPage = 1;
        renderSantriTable();
    });

    document.getElementById('prestasi-prev').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage -= 1;
            renderSantriTable();
        }
    });
    document.getElementById('prestasi-next').addEventListener('click', () => {
        currentPage += 1;
        renderSantriTable();
    });

    document.getElementById('prestasi-santri-tbody').addEventListener('click', handleTableClick);
});
