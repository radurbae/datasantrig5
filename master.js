let catatanCategories = [];
let catatanSubcategories = [];
let catatanKeteranganOptions = [];
let prestasiCategories = [];
let prestasiKeteranganOptions = [];
let prestasiKegiatanOptions = [];

let editingCatatanCategoryId = null;
let editingCatatanSubcategoryId = null;
let editingCatatanKeteranganId = null;
let editingPrestasiCategoryId = null;
let editingPrestasiKeteranganId = null;
let editingPrestasiKegiatanId = null;

function escapeHtml(value) {
    return (value || '')
        .toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function resetForm(idPrefix) {
    const form = document.getElementById(`${idPrefix}-form`);
    if (form) form.reset();
    const mode = document.getElementById(`${idPrefix}-mode`);
    const cancel = document.getElementById(`${idPrefix}-cancel`);
    const submit = document.getElementById(`${idPrefix}-submit`);
    if (mode) mode.textContent = '';
    if (cancel) cancel.style.display = 'none';
    if (submit) submit.textContent = 'Simpan';
}

function setEditMode(idPrefix, text) {
    const mode = document.getElementById(`${idPrefix}-mode`);
    const cancel = document.getElementById(`${idPrefix}-cancel`);
    const submit = document.getElementById(`${idPrefix}-submit`);
    if (mode) mode.textContent = text;
    if (cancel) cancel.style.display = 'inline-flex';
    if (submit) submit.textContent = 'Update';
}

function populateCategorySelects() {
    const catatanOptions = '<option value="">Pilih Kategori</option>' +
        catatanCategories.map(item => `<option value="${item.id}">${escapeHtml(item.name)}</option>`).join('');

    const subcategorySelect = document.getElementById('catatan-subcategory-category');
    if (subcategorySelect) {
        const current = subcategorySelect.value;
        subcategorySelect.innerHTML = catatanOptions;
        if (current) subcategorySelect.value = current;
    }

    const keteranganSelect = document.getElementById('catatan-keterangan-category');
    if (keteranganSelect) {
        const current = keteranganSelect.value;
        keteranganSelect.innerHTML = catatanOptions;
        if (current) keteranganSelect.value = current;
    }
}

function renderCatatanCategories() {
    const tbody = document.getElementById('catatan-category-tbody');
    if (!tbody) return;

    if (!catatanCategories.length) {
        tbody.innerHTML = '<tr><td colspan="3" class="empty-state">Belum ada data kategori.</td></tr>';
        return;
    }

    tbody.innerHTML = catatanCategories.map((item, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(item.name)}</td>
            <td>
                <button class="btn btn-secondary" data-action="edit" data-id="${item.id}">Edit</button>
                <button class="btn btn-danger" data-action="delete" data-id="${item.id}">Hapus</button>
            </td>
        </tr>
    `).join('');
}

function renderCatatanSubcategories() {
    const tbody = document.getElementById('catatan-subcategory-tbody');
    if (!tbody) return;

    if (!catatanSubcategories.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Belum ada data sub kategori.</td></tr>';
        return;
    }

    const categoryMap = new Map(catatanCategories.map(item => [item.id, item.name]));

    tbody.innerHTML = catatanSubcategories.map((item, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(categoryMap.get(item.category_id) || '-')}</td>
            <td>${escapeHtml(item.group_name || '-')}</td>
            <td>${escapeHtml(item.name)}</td>
            <td>
                <button class="btn btn-secondary" data-action="edit" data-id="${item.id}">Edit</button>
                <button class="btn btn-danger" data-action="delete" data-id="${item.id}">Hapus</button>
            </td>
        </tr>
    `).join('');
}

function renderCatatanKeterangan() {
    const tbody = document.getElementById('catatan-keterangan-tbody');
    if (!tbody) return;

    if (!catatanKeteranganOptions.length) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-state">Belum ada data keterangan.</td></tr>';
        return;
    }

    const categoryMap = new Map(catatanCategories.map(item => [item.id, item.name]));

    tbody.innerHTML = catatanKeteranganOptions.map((item, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(categoryMap.get(item.category_id) || '-')}</td>
            <td>${escapeHtml(item.label)}</td>
            <td>
                <button class="btn btn-secondary" data-action="edit" data-id="${item.id}">Edit</button>
                <button class="btn btn-danger" data-action="delete" data-id="${item.id}">Hapus</button>
            </td>
        </tr>
    `).join('');
}

function renderPrestasiCategories() {
    const tbody = document.getElementById('prestasi-category-tbody');
    if (!tbody) return;

    if (!prestasiCategories.length) {
        tbody.innerHTML = '<tr><td colspan="3" class="empty-state">Belum ada data kategori prestasi.</td></tr>';
        return;
    }

    tbody.innerHTML = prestasiCategories.map((item, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(item.name)}</td>
            <td>
                <button class="btn btn-secondary" data-action="edit" data-id="${item.id}">Edit</button>
                <button class="btn btn-danger" data-action="delete" data-id="${item.id}">Hapus</button>
            </td>
        </tr>
    `).join('');
}

function renderPrestasiKeterangan() {
    const tbody = document.getElementById('prestasi-keterangan-tbody');
    if (!tbody) return;

    if (!prestasiKeteranganOptions.length) {
        tbody.innerHTML = '<tr><td colspan="3" class="empty-state">Belum ada data keterangan prestasi.</td></tr>';
        return;
    }

    tbody.innerHTML = prestasiKeteranganOptions.map((item, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(item.label)}</td>
            <td>
                <button class="btn btn-secondary" data-action="edit" data-id="${item.id}">Edit</button>
                <button class="btn btn-danger" data-action="delete" data-id="${item.id}">Hapus</button>
            </td>
        </tr>
    `).join('');
}

function renderPrestasiKegiatan() {
    const tbody = document.getElementById('prestasi-kegiatan-tbody');
    if (!tbody) return;

    if (!prestasiKegiatanOptions.length) {
        tbody.innerHTML = '<tr><td colspan="3" class="empty-state">Belum ada data nama kegiatan.</td></tr>';
        return;
    }

    tbody.innerHTML = prestasiKegiatanOptions.map((item, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(item.label)}</td>
            <td>
                <button class="btn btn-secondary" data-action="edit" data-id="${item.id}">Edit</button>
                <button class="btn btn-danger" data-action="delete" data-id="${item.id}">Hapus</button>
            </td>
        </tr>
    `).join('');
}

async function loadMasterData() {
    catatanCategories = await getCatatanCategories();
    catatanSubcategories = await getCatatanSubcategories();
    catatanKeteranganOptions = await getCatatanKeteranganOptions();
    prestasiCategories = await getPrestasiCategories();
    prestasiKeteranganOptions = await getPrestasiKeteranganOptions();
    prestasiKegiatanOptions = await getPrestasiKegiatanOptions();

    populateCategorySelects();
    renderCatatanCategories();
    renderCatatanSubcategories();
    renderCatatanKeterangan();
    renderPrestasiCategories();
    renderPrestasiKeterangan();
    renderPrestasiKegiatan();
}

function setupFormHandlers() {
    document.getElementById('catatan-category-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('catatan-category-name').value.trim();
        if (!name) return;

        if (editingCatatanCategoryId) {
            await updateCatatanCategory(editingCatatanCategoryId, { name });
        } else {
            await insertCatatanCategory({ name });
        }
        editingCatatanCategoryId = null;
        resetForm('catatan-category');
        await loadMasterData();
    });

    document.getElementById('catatan-category-cancel').addEventListener('click', () => {
        editingCatatanCategoryId = null;
        resetForm('catatan-category');
    });

    document.getElementById('catatan-subcategory-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const categoryId = document.getElementById('catatan-subcategory-category').value;
        const groupName = document.getElementById('catatan-subcategory-group').value.trim();
        const name = document.getElementById('catatan-subcategory-name').value.trim();
        if (!categoryId || !name) return;

        const payload = {
            category_id: categoryId,
            group_name: groupName || null,
            name
        };

        if (editingCatatanSubcategoryId) {
            await updateCatatanSubcategory(editingCatatanSubcategoryId, payload);
        } else {
            await insertCatatanSubcategory(payload);
        }
        editingCatatanSubcategoryId = null;
        resetForm('catatan-subcategory');
        await loadMasterData();
    });

    document.getElementById('catatan-subcategory-cancel').addEventListener('click', () => {
        editingCatatanSubcategoryId = null;
        resetForm('catatan-subcategory');
    });

    document.getElementById('catatan-keterangan-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const categoryId = document.getElementById('catatan-keterangan-category').value;
        const label = document.getElementById('catatan-keterangan-label').value.trim();
        if (!categoryId || !label) return;

        const payload = {
            category_id: categoryId,
            label
        };

        if (editingCatatanKeteranganId) {
            await updateCatatanKeteranganOption(editingCatatanKeteranganId, payload);
        } else {
            await insertCatatanKeteranganOption(payload);
        }
        editingCatatanKeteranganId = null;
        resetForm('catatan-keterangan');
        await loadMasterData();
    });

    document.getElementById('catatan-keterangan-cancel').addEventListener('click', () => {
        editingCatatanKeteranganId = null;
        resetForm('catatan-keterangan');
    });

    document.getElementById('prestasi-category-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('prestasi-category-name').value.trim();
        if (!name) return;

        if (editingPrestasiCategoryId) {
            await updatePrestasiCategory(editingPrestasiCategoryId, { name });
        } else {
            await insertPrestasiCategory({ name });
        }
        editingPrestasiCategoryId = null;
        resetForm('prestasi-category');
        await loadMasterData();
    });

    document.getElementById('prestasi-category-cancel').addEventListener('click', () => {
        editingPrestasiCategoryId = null;
        resetForm('prestasi-category');
    });

    document.getElementById('prestasi-keterangan-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const label = document.getElementById('prestasi-keterangan-label').value.trim();
        if (!label) return;

        const payload = { label };

        if (editingPrestasiKeteranganId) {
            await updatePrestasiKeteranganOption(editingPrestasiKeteranganId, payload);
        } else {
            await insertPrestasiKeteranganOption(payload);
        }
        editingPrestasiKeteranganId = null;
        resetForm('prestasi-keterangan');
        await loadMasterData();
    });

    document.getElementById('prestasi-keterangan-cancel').addEventListener('click', () => {
        editingPrestasiKeteranganId = null;
        resetForm('prestasi-keterangan');
    });

    document.getElementById('prestasi-kegiatan-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const label = document.getElementById('prestasi-kegiatan-label').value.trim();
        if (!label) return;

        const payload = { label };

        if (editingPrestasiKegiatanId) {
            await updatePrestasiKegiatanOption(editingPrestasiKegiatanId, payload);
        } else {
            await insertPrestasiKegiatanOption(payload);
        }
        editingPrestasiKegiatanId = null;
        resetForm('prestasi-kegiatan');
        await loadMasterData();
    });

    document.getElementById('prestasi-kegiatan-cancel').addEventListener('click', () => {
        editingPrestasiKegiatanId = null;
        resetForm('prestasi-kegiatan');
    });
}

function setupTableHandlers() {
    document.getElementById('catatan-category-tbody').addEventListener('click', async (e) => {
        const button = e.target.closest('button');
        if (!button) return;
        const id = button.getAttribute('data-id');
        const action = button.getAttribute('data-action');
        if (!id || !action) return;

        if (action === 'edit') {
            const item = catatanCategories.find(entry => entry.id === id);
            if (!item) return;
            document.getElementById('catatan-category-name').value = item.name;
            editingCatatanCategoryId = id;
            setEditMode('catatan-category', 'Mode: Edit');
            return;
        }

        if (action === 'delete') {
            if (!confirm('Hapus kategori ini?')) return;
            await deleteCatatanCategory(id);
            await loadMasterData();
        }
    });

    document.getElementById('catatan-subcategory-tbody').addEventListener('click', async (e) => {
        const button = e.target.closest('button');
        if (!button) return;
        const id = button.getAttribute('data-id');
        const action = button.getAttribute('data-action');
        if (!id || !action) return;

        if (action === 'edit') {
            const item = catatanSubcategories.find(entry => entry.id === id);
            if (!item) return;
            document.getElementById('catatan-subcategory-category').value = item.category_id;
            document.getElementById('catatan-subcategory-group').value = item.group_name || '';
            document.getElementById('catatan-subcategory-name').value = item.name;
            editingCatatanSubcategoryId = id;
            setEditMode('catatan-subcategory', 'Mode: Edit');
            return;
        }

        if (action === 'delete') {
            if (!confirm('Hapus sub kategori ini?')) return;
            await deleteCatatanSubcategory(id);
            await loadMasterData();
        }
    });

    document.getElementById('catatan-keterangan-tbody').addEventListener('click', async (e) => {
        const button = e.target.closest('button');
        if (!button) return;
        const id = button.getAttribute('data-id');
        const action = button.getAttribute('data-action');
        if (!id || !action) return;

        if (action === 'edit') {
            const item = catatanKeteranganOptions.find(entry => entry.id === id);
            if (!item) return;
            document.getElementById('catatan-keterangan-category').value = item.category_id;
            document.getElementById('catatan-keterangan-label').value = item.label;
            editingCatatanKeteranganId = id;
            setEditMode('catatan-keterangan', 'Mode: Edit');
            return;
        }

        if (action === 'delete') {
            if (!confirm('Hapus keterangan ini?')) return;
            await deleteCatatanKeteranganOption(id);
            await loadMasterData();
        }
    });

    document.getElementById('prestasi-category-tbody').addEventListener('click', async (e) => {
        const button = e.target.closest('button');
        if (!button) return;
        const id = button.getAttribute('data-id');
        const action = button.getAttribute('data-action');
        if (!id || !action) return;

        if (action === 'edit') {
            const item = prestasiCategories.find(entry => entry.id === id);
            if (!item) return;
            document.getElementById('prestasi-category-name').value = item.name;
            editingPrestasiCategoryId = id;
            setEditMode('prestasi-category', 'Mode: Edit');
            return;
        }

        if (action === 'delete') {
            if (!confirm('Hapus kategori prestasi ini?')) return;
            await deletePrestasiCategory(id);
            await loadMasterData();
        }
    });

    document.getElementById('prestasi-keterangan-tbody').addEventListener('click', async (e) => {
        const button = e.target.closest('button');
        if (!button) return;
        const id = button.getAttribute('data-id');
        const action = button.getAttribute('data-action');
        if (!id || !action) return;

        if (action === 'edit') {
            const item = prestasiKeteranganOptions.find(entry => entry.id === id);
            if (!item) return;
            document.getElementById('prestasi-keterangan-label').value = item.label;
            editingPrestasiKeteranganId = id;
            setEditMode('prestasi-keterangan', 'Mode: Edit');
            return;
        }

        if (action === 'delete') {
            if (!confirm('Hapus keterangan prestasi ini?')) return;
            await deletePrestasiKeteranganOption(id);
            await loadMasterData();
        }
    });

    document.getElementById('prestasi-kegiatan-tbody').addEventListener('click', async (e) => {
        const button = e.target.closest('button');
        if (!button) return;
        const id = button.getAttribute('data-id');
        const action = button.getAttribute('data-action');
        if (!id || !action) return;

        if (action === 'edit') {
            const item = prestasiKegiatanOptions.find(entry => entry.id === id);
            if (!item) return;
            document.getElementById('prestasi-kegiatan-label').value = item.label;
            editingPrestasiKegiatanId = id;
            setEditMode('prestasi-kegiatan', 'Mode: Edit');
            return;
        }

        if (action === 'delete') {
            if (!confirm('Hapus nama kegiatan ini?')) return;
            await deletePrestasiKegiatanOption(id);
            await loadMasterData();
        }
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    const role = await requireAuth(['admin']);
    if (!role) return;

    await loadMasterData();
    setupFormHandlers();
    setupTableHandlers();
});
