// Database Santri Management System

// State management
let santriData = [];
let editingId = null;
let filteredData = [];

function statusClassName(status) {
    return (status || '').toLowerCase().replace(/\s+/g, '-');
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupEventListeners();
    renderTable();
    updateFilterOptions();
});

// Load data from localStorage
function loadData() {
    const stored = localStorage.getItem('santriData');
    santriData = stored ? JSON.parse(stored) : [];
    filteredData = [...santriData];
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('santriData', JSON.stringify(santriData));
    updateFilterOptions();
    updateStats();
}

// Setup event listeners
function setupEventListeners() {
    const form = document.getElementById('santri-form');
    const cancelBtn = document.getElementById('cancel-btn');
    const searchInput = document.getElementById('search-input');
    const filterRayon = document.getElementById('filter-rayon');
    const filterKelas = document.getElementById('filter-kelas');
    const filterStatus = document.getElementById('filter-status');
    const modal = document.getElementById('detail-modal');
    const closeModal = document.querySelector('.close');

    form.addEventListener('submit', handleFormSubmit);
    cancelBtn.addEventListener('click', resetForm);
    searchInput.addEventListener('input', handleSearch);
    filterRayon.addEventListener('change', handleFilter);
    filterKelas.addEventListener('change', handleFilter);
    filterStatus.addEventListener('change', handleFilter);
    closeModal.addEventListener('click', () => {
        modal.classList.remove('show');
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });
}

// Handle form submission
function handleFormSubmit(e) {
    e.preventDefault();

    const formData = {
        id: editingId || Date.now().toString(),
        nama: document.getElementById('nama').value.trim(),
        kelas: document.getElementById('kelas').value.trim(),
        rayon: document.getElementById('rayon').value.trim(),
        daerah: document.getElementById('daerah').value.trim(),
        tempatLahir: document.getElementById('tempat-lahir').value.trim(),
        tanggalLahir: document.getElementById('tanggal-lahir').value,
        alamat: document.getElementById('alamat').value.trim(),
        noHp: document.getElementById('no-hp').value.trim(),
        namaOrtu: document.getElementById('nama-ortu').value.trim(),
        noHpOrtu: document.getElementById('no-hp-ortu').value.trim(),
        tanggalMasuk: document.getElementById('tanggal-masuk').value,
        status: document.getElementById('status').value,
        createdAt: editingId 
            ? santriData.find(s => s.id === editingId)?.createdAt || new Date().toISOString()
            : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    if (editingId) {
        // Update existing data
        const index = santriData.findIndex(s => s.id === editingId);
        if (index !== -1) {
            santriData[index] = formData;
        }
    } else {
        // Add new data
        santriData.push(formData);
    }

    saveData();
    renderTable();
    resetForm();
    showNotification(editingId ? 'Data berhasil diupdate!' : 'Data berhasil ditambahkan!', 'success');
}

// Reset form
function resetForm() {
    document.getElementById('santri-form').reset();
    document.getElementById('edit-id').value = '';
    editingId = null;
    document.getElementById('form-title').textContent = 'Tambah Data Santri Baru';
    document.getElementById('submit-btn').textContent = 'Tambah Data';
    document.getElementById('cancel-btn').style.display = 'none';
}

// Render table
function renderTable() {
    const tbody = document.getElementById('santri-tbody');
    
    if (filteredData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Tidak ada data santri yang sesuai filter.</td></tr>';
        updateStats();
        return;
    }

    tbody.innerHTML = filteredData.map((santri, index) => {
        const statusClass = `badge-${statusClassName(santri.status)}`;
        return `
            <tr>
                <td>${index + 1}</td>
                <td><strong>${escapeHtml(santri.nama)}</strong></td>
                <td>${escapeHtml(santri.kelas)}</td>
                <td>${escapeHtml(santri.rayon)}</td>
                <td>${escapeHtml(santri.daerah)}</td>
                <td><span class="badge ${statusClass}">${escapeHtml(santri.status)}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-info" onclick="showDetail('${santri.id}')">Detail</button>
                        <button class="btn btn-warning" onclick="editSantri('${santri.id}')">Edit</button>
                        <button class="btn btn-danger" onclick="deleteSantri('${santri.id}')">Hapus</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    updateStats();
}

// Edit santri
function editSantri(id) {
    const santri = santriData.find(s => s.id === id);
    if (!santri) return;

    editingId = id;
    document.getElementById('edit-id').value = id;
    document.getElementById('nama').value = santri.nama || '';
    document.getElementById('kelas').value = santri.kelas || '';
    document.getElementById('rayon').value = santri.rayon || '';
    document.getElementById('daerah').value = santri.daerah || '';
    document.getElementById('tempat-lahir').value = santri.tempatLahir || '';
    document.getElementById('tanggal-lahir').value = santri.tanggalLahir || '';
    document.getElementById('alamat').value = santri.alamat || '';
    document.getElementById('no-hp').value = santri.noHp || '';
    document.getElementById('nama-ortu').value = santri.namaOrtu || '';
    document.getElementById('no-hp-ortu').value = santri.noHpOrtu || '';
    document.getElementById('tanggal-masuk').value = santri.tanggalMasuk || '';
    document.getElementById('status').value = santri.status || 'Aktif';

    document.getElementById('form-title').textContent = 'Edit Data Santri';
    document.getElementById('submit-btn').textContent = 'Update Data';
    document.getElementById('cancel-btn').style.display = 'inline-block';

    // Scroll to form
    document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
}

// Delete santri
function deleteSantri(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus data santri ini?')) {
        return;
    }

    const index = santriData.findIndex(s => s.id === id);
    if (index !== -1) {
        santriData.splice(index, 1);
        saveData();
        renderTable();
        showNotification('Data berhasil dihapus!', 'success');
    }
}

// Show detail modal
function showDetail(id) {
    const santri = santriData.find(s => s.id === id);
    if (!santri) return;

    const modal = document.getElementById('detail-modal');
    const content = document.getElementById('detail-content');

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    content.innerHTML = `
        <div class="detail-grid">
            <div class="detail-item">
                <span class="detail-label">Nama Lengkap:</span>
                <span class="detail-value"><strong>${escapeHtml(santri.nama)}</strong></span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Kelas:</span>
                <span class="detail-value">${escapeHtml(santri.kelas)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Rayon:</span>
                <span class="detail-value">${escapeHtml(santri.rayon)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Daerah Asal:</span>
                <span class="detail-value">${escapeHtml(santri.daerah)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Tempat Lahir:</span>
                <span class="detail-value">${escapeHtml(santri.tempatLahir || '-')}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Tanggal Lahir:</span>
                <span class="detail-value">${formatDate(santri.tanggalLahir)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Alamat:</span>
                <span class="detail-value">${escapeHtml(santri.alamat || '-')}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Nomor HP:</span>
                <span class="detail-value">${escapeHtml(santri.noHp || '-')}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Nama Orang Tua/Wali:</span>
                <span class="detail-value">${escapeHtml(santri.namaOrtu || '-')}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">No. HP Orang Tua/Wali:</span>
                <span class="detail-value">${escapeHtml(santri.noHpOrtu || '-')}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Tanggal Masuk Pondok:</span>
                <span class="detail-value">${formatDate(santri.tanggalMasuk)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Status:</span>
                <span class="detail-value">
                    <span class="badge badge-${santri.status.toLowerCase()}">${escapeHtml(santri.status)}</span>
                </span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Dibuat:</span>
                <span class="detail-value">${formatDate(santri.createdAt)}</span>
            </div>
            ${santri.updatedAt && santri.updatedAt !== santri.createdAt ? `
            <div class="detail-item">
                <span class="detail-label">Diupdate:</span>
                <span class="detail-value">${formatDate(santri.updatedAt)}</span>
            </div>
            ` : ''}
        </div>
        <div style="margin-top: 20px; display: flex; gap: 10px;">
            <button class="btn btn-warning" onclick="editSantri('${santri.id}'); document.getElementById('detail-modal').classList.remove('show');">
                Edit Data
            </button>
            <button class="btn btn-danger" onclick="deleteSantri('${santri.id}'); document.getElementById('detail-modal').classList.remove('show');">
                Hapus Data
            </button>
        </div>
    `;

    modal.classList.add('show');
}

// Handle search
function handleSearch() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase().trim();
    applyFilters(searchTerm);
}

// Handle filter
function handleFilter() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase().trim();
    applyFilters(searchTerm);
}

// Apply all filters
function applyFilters(searchTerm = '') {
    const filterRayon = document.getElementById('filter-rayon').value;
    const filterKelas = document.getElementById('filter-kelas').value;
    const filterStatus = document.getElementById('filter-status').value;

    filteredData = santriData.filter(santri => {
        // Search filter
        const matchesSearch = !searchTerm || 
            santri.nama.toLowerCase().includes(searchTerm) ||
            santri.kelas.toLowerCase().includes(searchTerm) ||
            santri.rayon.toLowerCase().includes(searchTerm) ||
            santri.daerah.toLowerCase().includes(searchTerm) ||
            (santri.alamat && santri.alamat.toLowerCase().includes(searchTerm));

        // Rayon filter
        const matchesRayon = !filterRayon || santri.rayon === filterRayon;

        // Kelas filter
        const matchesKelas = !filterKelas || santri.kelas === filterKelas;

        // Status filter
        const matchesStatus = !filterStatus || santri.status === filterStatus;

        return matchesSearch && matchesRayon && matchesKelas && matchesStatus;
    });

    renderTable();
}

// Update filter options
function updateFilterOptions() {
    const rayons = [...new Set(santriData.map(s => s.rayon).filter(Boolean))].sort();
    const kelas = [...new Set(santriData.map(s => s.kelas).filter(Boolean))].sort();

    const rayonSelect = document.getElementById('filter-rayon');
    const kelasSelect = document.getElementById('filter-kelas');

    // Update rayon options
    const currentRayon = rayonSelect.value;
    rayonSelect.innerHTML = '<option value="">Semua Rayon</option>' +
        rayons.map(r => `<option value="${escapeHtml(r)}">${escapeHtml(r)}</option>`).join('');
    if (rayons.includes(currentRayon)) {
        rayonSelect.value = currentRayon;
    }

    // Update kelas options
    const currentKelas = kelasSelect.value;
    kelasSelect.innerHTML = '<option value="">Semua Kelas</option>' +
        kelas.map(k => `<option value="${escapeHtml(k)}">${escapeHtml(k)}</option>`).join('');
    if (kelas.includes(currentKelas)) {
        kelasSelect.value = currentKelas;
    }
}

// Update stats
function updateStats() {
    const total = santriData.length;
    const filtered = filteredData.length;
    const statsText = filtered === total 
        ? `Total: ${total} santri`
        : `Menampilkan: ${filtered} dari ${total} santri`;
    document.getElementById('total-count').textContent = statsText;
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
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
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make functions available globally for onclick handlers
window.editSantri = editSantri;
window.deleteSantri = deleteSantri;
window.showDetail = showDetail;
