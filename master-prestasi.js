let prestasiCategories = [];
let prestasiKeteranganOptions = [];
let prestasiKegiatanOptions = [];

let editingPrestasiCategoryId = null;
let editingPrestasiKeteranganId = null;
let editingPrestasiKegiatanId = null;

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
    prestasiCategories = await getPrestasiCategories();
    prestasiKeteranganOptions = await getPrestasiKeteranganOptions();
    prestasiKegiatanOptions = await getPrestasiKegiatanOptions();

    renderPrestasiCategories();
    renderPrestasiKeterangan();
    renderPrestasiKegiatan();
}

function setupFormHandlers() {
    const catForm = document.getElementById('prestasi-category-form');
    if (catForm) {
        catForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('prestasi-category-name').value.trim();
            if (!name) return;
            await handleSubmit({
                confirmMessage: 'Apakah data ini sudah benar?',
                successMessage: 'Data kategori prestasi berhasil disimpan.',
                failureMessage: 'Data kategori prestasi gagal disimpan.',
                run: async () => editingPrestasiCategoryId
                    ? updatePrestasiCategory(editingPrestasiCategoryId, { name })
                    : insertPrestasiCategory({ name }),
                onSuccess: async () => {
                    editingPrestasiCategoryId = null;
                    resetForm('prestasi-category');
                    await loadMasterData();
                }
            });
        });
    }
    const catCancel = document.getElementById('prestasi-category-cancel');
    if (catCancel) catCancel.addEventListener('click', () => {
        editingPrestasiCategoryId = null;
        resetForm('prestasi-category');
    });

    const ketForm = document.getElementById('prestasi-keterangan-form');
    if (ketForm) {
        ketForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const label = document.getElementById('prestasi-keterangan-label').value.trim();
            if (!label) return;
            await handleSubmit({
                confirmMessage: 'Apakah data ini sudah benar?',
                successMessage: 'Data keterangan prestasi berhasil disimpan.',
                failureMessage: 'Data keterangan prestasi gagal disimpan.',
                run: async () => editingPrestasiKeteranganId
                    ? updatePrestasiKeteranganOption(editingPrestasiKeteranganId, { label })
                    : insertPrestasiKeteranganOption({ label }),
                onSuccess: async () => {
                    editingPrestasiKeteranganId = null;
                    resetForm('prestasi-keterangan');
                    await loadMasterData();
                }
            });
        });
    }
    const ketCancel = document.getElementById('prestasi-keterangan-cancel');
    if (ketCancel) ketCancel.addEventListener('click', () => {
        editingPrestasiKeteranganId = null;
        resetForm('prestasi-keterangan');
    });

    const kegForm = document.getElementById('prestasi-kegiatan-form');
    if (kegForm) {
        kegForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const label = document.getElementById('prestasi-kegiatan-label').value.trim();
            if (!label) return;
            await handleSubmit({
                confirmMessage: 'Apakah data ini sudah benar?',
                successMessage: 'Data nama kegiatan berhasil disimpan.',
                failureMessage: 'Data nama kegiatan gagal disimpan.',
                run: async () => editingPrestasiKegiatanId
                    ? updatePrestasiKegiatanOption(editingPrestasiKegiatanId, { label })
                    : insertPrestasiKegiatanOption({ label }),
                onSuccess: async () => {
                    editingPrestasiKegiatanId = null;
                    resetForm('prestasi-kegiatan');
                    await loadMasterData();
                }
            });
        });
    }
    const kegCancel = document.getElementById('prestasi-kegiatan-cancel');
    if (kegCancel) kegCancel.addEventListener('click', () => {
        editingPrestasiKegiatanId = null;
        resetForm('prestasi-kegiatan');
    });
}

function setupTableHandlers() {
    const catTbody = document.getElementById('prestasi-category-tbody');
    if (catTbody) {
        catTbody.addEventListener('click', async (e) => {
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
    }

    const ketTbody = document.getElementById('prestasi-keterangan-tbody');
    if (ketTbody) {
        ketTbody.addEventListener('click', async (e) => {
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
    }

    const kegTbody = document.getElementById('prestasi-kegiatan-tbody');
    if (kegTbody) {
        kegTbody.addEventListener('click', async (e) => {
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
}

document.addEventListener('DOMContentLoaded', async () => {
    const role = await requireAuth(['admin']);
    if (!role) return;

    await loadMasterData();
    setupFormHandlers();
    setupTableHandlers();
});
