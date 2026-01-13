// Form Page - Input/Edit Data Santri

let editingId = null;

// Initialize form page
document.addEventListener('DOMContentLoaded', async () => {
    const role = await requireAuth(['admin']);
    if (!role) return;
    setupFormListeners();
    checkEditMode();
});

// Check if we're in edit mode (from URL parameter)
async function checkEditMode() {
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');
    
    if (editId) {
        // Wait for Supabase to initialize
        await new Promise(resolve => setTimeout(resolve, 500));
        await loadSantriForEdit(editId);
    }
}

// Setup event listeners for form
function setupFormListeners() {
    const form = document.getElementById('santri-form');
    const cancelBtn = document.getElementById('cancel-btn');

    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', resetForm);
    }
}

// Data operations now handled by db.js (Supabase)
// Functions getSantriData() and saveSantriData() removed
// Use getAllSantri(), insertSantri(), updateSantri() from db.js instead

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();

    const confirmed = confirm('Apakah Data Sudah Benar?');
    if (!confirmed) {
        return;
    }

    // Disable submit button during processing
    const submitBtn = document.getElementById('submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Menyimpan...';

    const errors = validateForm();
    if (errors.length) {
        alert(errors.join('\n'));
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        return;
    }

    const formData = {
        nomorStambuk: document.getElementById('nomor-stambuk').value.trim(),
        nama: document.getElementById('nama').value.trim(),
        ayah: document.getElementById('ayah').value.trim(),
        tempatLahir: document.getElementById('tempat-lahir').value.trim(),
        tanggalLahir: document.getElementById('tanggal-lahir').value,
        daerah: document.getElementById('daerah').value.trim(),
        status: document.getElementById('status').value,
        kelas: document.getElementById('kelas').value.trim(),
        noAbsen: document.getElementById('no-absen').value ? parseInt(document.getElementById('no-absen').value) : null,
        asrama: document.getElementById('asrama').value.trim(),
        konsulat: document.getElementById('konsulat').value.trim()
    };

    try {
        let result;
        
        if (editingId) {
            // Update existing data
            result = await updateSantri(editingId, formData);
            if (result) {
                showNotification('Data berhasil diupdate!', 'success');
                resetForm();
                setTimeout(() => {
                    window.location.href = 'list.html';
                }, 500);
            } else {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        } else {
            // Add new data
            result = await insertSantri(formData);
            if (result) {
                showNotification('Data berhasil ditambahkan!', 'success');
                resetForm();
                setTimeout(() => {
                    window.location.href = 'list.html';
                }, 500);
            } else {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        }
    } catch (error) {
        console.error('Error saving data:', error);
        showNotification('Error menyimpan data: ' + error.message, 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

function validateForm() {
    const errors = [];
    const maxLen = (value, len) => value && value.length > len;
    const nomor = document.getElementById('nomor-stambuk').value.trim();
    const nama = document.getElementById('nama').value.trim();
    const ayah = document.getElementById('ayah').value.trim();
    const tempat = document.getElementById('tempat-lahir').value.trim();
    const tanggal = document.getElementById('tanggal-lahir').value;
    const daerah = document.getElementById('daerah').value.trim();
    const status = document.getElementById('status').value;
    const kelas = document.getElementById('kelas').value.trim();
    const noAbsen = document.getElementById('no-absen').value.trim();

    const stambukPattern = /^[0-9.\\-]{3,50}$/;
    if (!nomor || !stambukPattern.test(nomor)) {
        errors.push('Nomor stambuk harus diisi dan hanya angka/titik.');
    }
    if (!nama || maxLen(nama, 100)) errors.push('Nama harus diisi (maks 100 karakter).');
    if (maxLen(ayah, 100)) errors.push('Nama ayah terlalu panjang (maks 100).');
    if (maxLen(tempat, 50)) errors.push('Tempat lahir terlalu panjang (maks 50).');
    if (!tanggal) errors.push('Tanggal lahir harus diisi.');
    if (!status) errors.push('Status wajib dipilih.');
    if (!kelas || maxLen(kelas, 20)) errors.push('Kelas harus diisi (maks 20).');
    if (noAbsen && isNaN(parseInt(noAbsen, 10))) errors.push('No absen harus berupa angka.');
    if (maxLen(daerah, 100)) errors.push('Daerah terlalu panjang (maks 100).');

    return errors;
}

// Load santri data for editing
async function loadSantriForEdit(id) {
    try {
        const santri = await getSantriById(id);
        
        if (!santri) {
            showNotification('Data tidak ditemukan!', 'error');
            setTimeout(() => {
                window.location.href = 'list.html';
            }, 2000);
            return;
        }

        editingId = id;
        document.getElementById('edit-id').value = id;
        document.getElementById('nomor-stambuk').value = santri.nomorStambuk || '';
        document.getElementById('nama').value = santri.nama || '';
        document.getElementById('ayah').value = santri.ayah || '';
        document.getElementById('tempat-lahir').value = santri.tempatLahir || '';
        document.getElementById('tanggal-lahir').value = santri.tanggalLahir || '';
        document.getElementById('daerah').value = santri.daerah || '';
        document.getElementById('status').value = santri.status || '';
        document.getElementById('kelas').value = santri.kelas || '';
        document.getElementById('no-absen').value = santri.noAbsen || '';
        document.getElementById('asrama').value = santri.asrama || '';
        document.getElementById('konsulat').value = santri.konsulat || '';

        document.getElementById('form-title').textContent = 'Edit Data Santri';
        document.getElementById('submit-btn').textContent = 'Update Data';
        document.getElementById('cancel-btn').style.display = 'inline-block';
    } catch (error) {
        console.error('Error loading santri data:', error);
        showNotification('Error memuat data: ' + error.message, 'error');
    }
}

// Reset form
function resetForm() {
    document.getElementById('santri-form').reset();
    document.getElementById('edit-id').value = '';
    editingId = null;
    document.getElementById('form-title').textContent = 'Tambah Data Santri Baru';
    document.getElementById('submit-btn').textContent = 'Tambah Data';
    document.getElementById('cancel-btn').style.display = 'none';
    
    // Remove edit parameter from URL
    if (window.location.search.includes('edit=')) {
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Remove existing notification if any
    const existing = document.querySelector('.notification');
    if (existing) {
        existing.remove();
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        font-weight: 600;
    `;
    notification.textContent = message;

    // Add animation style if not exists
    if (!document.getElementById('notification-style')) {
        const style = document.createElement('style');
        style.id = 'notification-style';
        style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(400px);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}
