let catatanCategories = [];
let catatanSubcategories = [];
let catatanKeteranganOptions = [];

let editingCatatanCategoryId = null;
let editingCatatanSubcategoryId = null;
let editingCatatanKeteranganId = null;

function escapeHtml(value) {
    return (value || '')
        .toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\"/g, '&quot;')
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

async function handleSubmit({ confirmMessage, successMessage, failureMessage, run, onSuccess }) {
    if (!confirm(confirmMessage)) return false;
    const result = await run();
    if (result) {
        alert(successMessage);
        if (onSuccess) await onSuccess();
        return true;
    }
    alert(failureMessage);
    return false;
}

function populateCategorySelects() {
    const options = '<option value="">Pilih Kategori</option>' +
        catatanCategories.map(item => `<option value="${item.id}">${escapeHtml(item.name)}</option>`).join('');
    const subCat = document.getElementById('catatan-subcategory-category');
    if (subCat) {
        const current = subCat.value;
        subCat.innerHTML = options;
        if (current) subCat.value = current;
    }
    const ketCat = document.getElementById('catatan-keterangan-category');
    if (ketCat) {
        const current = ketCat.value;
        ketCat.innerHTML = options;
        if (current) ketCat.value = current;
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

async function loadMasterData() {
    catatanCategories = await getCatatanCategories();
    catatanSubcategories = await getCatatanSubcategories();
    catatanKeteranganOptions = await getCatatanKeteranganOptions();
    populateCategorySelects();
    renderCatatanCategories();
    renderCatatanSubcategories();
    renderCatatanKeterangan();
}

function setupFormHandlers() {
    const catForm = document.getElementById('catatan-category-form');
    if (catForm) {
        catForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('catatan-category-name').value.trim();
            if (!name) return;
            await handleSubmit({
                confirmMessage: 'Apakah data ini sudah benar?',
                successMessage: 'Data kategori catatan berhasil disimpan.',
                failureMessage: 'Data kategori catatan gagal disimpan.',
                run: async () => editingCatatanCategoryId
                    ? updateCatatanCategory(editingCatatanCategoryId, { name })
                    : insertCatatanCategory({ name }),
                onSuccess: async () => {
                    editingCatatanCategoryId = null;
                    resetForm('catatan-category');
                    await loadMasterData();
                }
            });
        });
    }
    const catCancel = document.getElementById('catatan-category-cancel');
    if (catCancel) catCancel.addEventListener('click', () => {
        editingCatatanCategoryId = null;
        resetForm('catatan-category');
    });

    const subForm = document.getElementById('catatan-subcategory-form');
    if (subForm) {
        subForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const categoryId = document.getElementById('catatan-subcategory-category').value;
            const groupName = document.getElementById('catatan-subcategory-group').value.trim();
            const name = document.getElementById('catatan-subcategory-name').value.trim();
            if (!categoryId || !name) return;
            const payload = { category_id: categoryId, group_name: groupName || null, name };
            await handleSubmit({
                confirmMessage: 'Apakah data ini sudah benar?',
                successMessage: 'Data sub kategori catatan berhasil disimpan.',
                failureMessage: 'Data sub kategori catatan gagal disimpan.',
                run: async () => editingCatatanSubcategoryId
                    ? updateCatatanSubcategory(editingCatatanSubcategoryId, payload)
                    : insertCatatanSubcategory(payload),
                onSuccess: async () => {
                    editingCatatanSubcategoryId = null;
                    resetForm('catatan-subcategory');
                    await loadMasterData();
                }
            });
        });
    }
    const subCancel = document.getElementById('catatan-subcategory-cancel');
    if (subCancel) subCancel.addEventListener('click', () => {
        editingCatatanSubcategoryId = null;
        resetForm('catatan-subcategory');
    });

    const ketForm = document.getElementById('catatan-keterangan-form');
    if (ketForm) {
        ketForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const categoryId = document.getElementById('catatan-keterangan-category').value;
            const label = document.getElementById('catatan-keterangan-label').value.trim();
            if (!categoryId || !label) return;
            const payload = { category_id: categoryId, label };
            await handleSubmit({
                confirmMessage: 'Apakah data ini sudah benar?',
                successMessage: 'Data keterangan catatan berhasil disimpan.',
                failureMessage: 'Data keterangan catatan gagal disimpan.',
                run: async () => editingCatatanKeteranganId
                    ? updateCatatanKeteranganOption(editingCatatanKeteranganId, payload)
                    : insertCatatanKeteranganOption(payload),
                onSuccess: async () => {
                    editingCatatanKeteranganId = null;
                    resetForm('catatan-keterangan');
                    await loadMasterData();
                }
            });
        });
    }
    const ketCancel = document.getElementById('catatan-keterangan-cancel');
    if (ketCancel) ketCancel.addEventListener('click', () => {
        editingCatatanKeteranganId = null;
        resetForm('catatan-keterangan');
    });
}

function setupTableHandlers() {
    const catTbody = document.getElementById('catatan-category-tbody');
    if (catTbody) {
        catTbody.addEventListener('click', async (e) => {
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
    }

    const subTbody = document.getElementById('catatan-subcategory-tbody');
    if (subTbody) {
        subTbody.addEventListener('click', async (e) => {
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
    }

    const ketTbody = document.getElementById('catatan-keterangan-tbody');
    if (ketTbody) {
        ketTbody.addEventListener('click', async (e) => {
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
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const role = await requireAuth(['admin']);
    if (!role) return;

    await loadMasterData();
    setupFormHandlers();
    setupTableHandlers();
});
