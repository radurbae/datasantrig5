// List Page - Display and Manage Santri Data

let santriData = [];
let filteredData = [];
let currentPage = 1;
const PAGE_SIZE = 50;

function statusClassName(status) {
    return (status || '').toLowerCase().replace(/\s+/g, '-');
}

function normalizeKelasValue(kelas) {
    return (kelas || '').toString().trim().replace(/\s+/g, ' ');
}

function getWaliKelas() {
    return normalizeKelasValue(window.currentUserKelas || '');
}

// Initialize list page
document.addEventListener('DOMContentLoaded', async () => {
    const role = await requireAuth();
    if (!role) return;
    setupEventListeners();
    // Wait for Supabase to initialize
    await new Promise(resolve => setTimeout(resolve, 500));
    await loadData();
    renderTable();
    updateFilterOptions();
});

function parseKelasKey(kelas) {
    const value = (kelas || '').toString().trim().replace(/\s+/g, '');
    const match = value.match(/^(\d+)([A-Za-z]+)?$/);
    if (!match) {
        return { num: Number.MAX_SAFE_INTEGER, suffix: value || 'zz' };
    }
    return { num: parseInt(match[1], 10), suffix: (match[2] || '').toUpperCase() };
}

function sortByKelasAndAbsen(a, b) {
    const aKey = parseKelasKey(a.kelas);
    const bKey = parseKelasKey(b.kelas);
    if (aKey.num !== bKey.num) return aKey.num - bKey.num;
    if (aKey.suffix !== bKey.suffix) return aKey.suffix.localeCompare(bKey.suffix, 'id');

    const aAbsen = typeof a.noAbsen === 'number' ? a.noAbsen : Number.MAX_SAFE_INTEGER;
    const bAbsen = typeof b.noAbsen === 'number' ? b.noAbsen : Number.MAX_SAFE_INTEGER;
    if (aAbsen !== bAbsen) return aAbsen - bAbsen;

    return (a.nama || '').localeCompare(b.nama || '', 'id');
}

// Load data from Supabase
async function loadData() {
    try {
        santriData = await getAllSantri();
        const waliKelas = getWaliKelas();
        if (window.currentUserRole === 'wali_kelas' && waliKelas) {
            santriData = santriData.filter(s => normalizeKelasValue(s.kelas) === waliKelas);
        }
        santriData.sort(sortByKelasAndAbsen);
        filteredData = [...santriData];
        currentPage = 1;
        updateFilterOptions();
        applyDefaultStatusFilter();
    } catch (error) {
        console.error('Error loading data:', error);
        showNotification('Error memuat data: ' + error.message, 'error');
        santriData = [];
        filteredData = [];
    }
}

// Setup event listeners
function setupEventListeners() {
    const searchInput = document.getElementById('search-input');
    const filterKelas = document.getElementById('filter-kelas');
    const filterDaerah = document.getElementById('filter-daerah');
    const filterStatus = document.getElementById('filter-status');

    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
    
    if (filterKelas) {
        filterKelas.addEventListener('change', handleFilter);
    }
    
    if (filterDaerah) {
        filterDaerah.addEventListener('change', handleFilter);
    }
    
    if (filterStatus) {
        filterStatus.addEventListener('change', handleFilter);
    }

    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage -= 1;
                renderTable();
            }
        });
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));
            if (currentPage < totalPages) {
                currentPage += 1;
                renderTable();
            }
        });
    }
}

function applyDefaultStatusFilter() {
    const statusSelect = document.getElementById('filter-status');
    if (statusSelect && !statusSelect.value) {
        statusSelect.value = 'Aktif';
    }
    const waliKelas = getWaliKelas();
    const filterKelas = document.getElementById('filter-kelas');
    if (window.currentUserRole === 'wali_kelas' && filterKelas && waliKelas) {
        filterKelas.value = waliKelas;
        filterKelas.disabled = true;
    }
    applyFilters('');
}

// Render table
function renderTable() {
    const tbody = document.getElementById('santri-tbody');
    
    if (!tbody) return;

    if (filteredData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Tidak ada data santri yang sesuai filter.</td></tr>';
        updateStats();
        updatePagination();
        return;
    }

    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const pageItems = filteredData.slice(startIndex, startIndex + PAGE_SIZE);
    const isAdmin = window.currentUserRole === 'admin';
    tbody.innerHTML = pageItems.map((santri, index) => {
        const statusClass = `badge-${statusClassName(santri.status)}`;
        const adminButtons = isAdmin ? `
                        <button class="btn btn-warning" onclick="editSantri('${santri.id}')">Edit</button>
                        <button class="btn btn-danger" onclick="deleteSantri('${santri.id}')">Hapus</button>
        ` : '';
        return `
            <tr>
                <td>${startIndex + index + 1}</td>
                <td><strong>${escapeHtml(santri.nama || '-')}</strong></td>
                <td>${escapeHtml(santri.kelas || '-')}</td>
                <td>${escapeHtml(santri.daerah || '-')}</td>
                <td><span class="badge ${statusClass}">${escapeHtml(santri.status || '-')}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-info" onclick="viewDetail('${santri.id}')">Detail</button>
                        ${adminButtons}
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    updateStats();
    updatePagination();
}

// Edit santri - redirect to form page
function editSantri(id) {
    window.location.href = `form.html?edit=${id}`;
}

// Delete santri
async function deleteSantri(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus data santri ini?')) {
        return;
    }

    try {
        const success = await deleteSantriById(id);
        
        if (success) {
            showNotification('Data berhasil dihapus!', 'success');
            // Reload data from Supabase
            await loadData();
        }
    } catch (error) {
        console.error('Error deleting data:', error);
        showNotification('Error menghapus data: ' + error.message, 'error');
    }
}

// View detail - redirect to detail page
function viewDetail(id) {
    window.location.href = `detail.html?id=${id}`;
}

// Handle search
function handleSearch() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase().trim();
    applyFilters(searchTerm);
}

// Handle filter
function handleFilter() {
    const searchTerm = document.getElementById('search-input')?.value.toLowerCase().trim() || '';
    applyFilters(searchTerm);
}

// Apply all filters
function applyFilters(searchTerm = '') {
    const filterKelas = document.getElementById('filter-kelas')?.value || '';
    const filterDaerah = document.getElementById('filter-daerah')?.value || '';
    const filterStatus = document.getElementById('filter-status')?.value || '';

    filteredData = santriData.filter(santri => {
        // Search filter
        const matchesSearch = !searchTerm || 
            (santri.nama && santri.nama.toLowerCase().includes(searchTerm)) ||
            (santri.kelas && santri.kelas.toLowerCase().includes(searchTerm)) ||
            (santri.daerah && santri.daerah.toLowerCase().includes(searchTerm)) ||
            (santri.konsulat && santri.konsulat.toLowerCase().includes(searchTerm)) ||
            (santri.nomorStambuk && santri.nomorStambuk.toLowerCase().includes(searchTerm));

        // Kelas filter
        const matchesKelas = !filterKelas || (santri.kelas && santri.kelas === filterKelas);

        // Daerah filter
        const matchesDaerah = !filterDaerah || (santri.daerah && santri.daerah === filterDaerah);

        // Status filter
        const matchesStatus = !filterStatus || (santri.status && santri.status === filterStatus);

        return matchesSearch && matchesKelas && matchesDaerah && matchesStatus;
    });

    currentPage = 1;
    renderTable();
}

// Update filter options
function updateFilterOptions() {
    const kelas = [...new Set(santriData.map(s => s.kelas).filter(Boolean))].sort();
    const daerah = [...new Set(santriData.map(s => s.daerah).filter(Boolean))].sort();

    const kelasSelect = document.getElementById('filter-kelas');
    const daerahSelect = document.getElementById('filter-daerah');

    if (!kelasSelect || !daerahSelect) return;

    // Update kelas options
    const currentKelas = kelasSelect.value;
    kelasSelect.innerHTML = '<option value="">Semua Kelas</option>' +
        kelas.map(k => `<option value="${escapeHtml(k)}">${escapeHtml(k)}</option>`).join('');
    if (kelas.includes(currentKelas)) {
        kelasSelect.value = currentKelas;
    }

    // Update daerah options
    const currentDaerah = daerahSelect.value;
    daerahSelect.innerHTML = '<option value="">Semua Daerah</option>' +
        daerah.map(d => `<option value="${escapeHtml(d)}">${escapeHtml(d)}</option>`).join('');
    if (daerah.includes(currentDaerah)) {
        daerahSelect.value = currentDaerah;
    }
}

// Update stats
function updateStats() {
    const total = santriData.length;
    const filtered = filteredData.length;
    const statsText = filtered === total 
        ? `Total: ${total} santri`
        : `Menampilkan: ${filtered} dari ${total} santri`;
    
    const statsElement = document.getElementById('total-count');
    if (statsElement) {
        statsElement.textContent = statsText;
    }
}

function updatePagination() {
    const pageInfo = document.getElementById('page-info');
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));

    if (currentPage > totalPages) currentPage = totalPages;

    if (pageInfo) {
        pageInfo.textContent = `Halaman ${currentPage} dari ${totalPages}`;
    }
    if (prevBtn) {
        prevBtn.disabled = currentPage <= 1;
    }
    if (nextBtn) {
        nextBtn.disabled = currentPage >= totalPages;
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
window.viewDetail = viewDetail;
