// Detail Page - Display Complete Biodata of Santri

let santriId = null;
let santriData = null;

function statusClassName(status) {
    return (status || '').toLowerCase().replace(/\s+/g, '-');
}

// Initialize detail page
document.addEventListener('DOMContentLoaded', async () => {
    const role = await requireAuth();
    if (!role) return;
    // Get ID from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    santriId = urlParams.get('id');
    
    if (!santriId) {
        showError();
        return;
    }
    
    // Wait for Supabase to initialize
    await new Promise(resolve => setTimeout(resolve, 500));
    await loadSantriData();
});

// Load santri data from Supabase
async function loadSantriData() {
    try {
        santriData = await getSantriById(santriId);
        
        if (!santriData) {
            showError();
            return;
        }
        
        displaySantriDetail();
    } catch (error) {
        console.error('Error loading santri data:', error);
        showError();
    }
}

// Display santri detail
function displaySantriDetail() {
    const loadingState = document.getElementById('loading-state');
    const errorState = document.getElementById('error-state');
    const detailContent = document.getElementById('detail-content');
    
    loadingState.style.display = 'none';
    errorState.style.display = 'none';
    detailContent.style.display = 'block';
    
    // Format date
    const formatDate = (dateString) => {
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
    };
    
    // Display data
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
    
    // Status with badge
    const status = santriData.status || '-';
    const statusClass = statusClassName(status);
    document.getElementById('detail-status').textContent = status;
    document.getElementById('detail-status').className = `badge badge-${statusClass}`;
    document.getElementById('detail-status-value').innerHTML = `<span class="badge badge-${statusClass}">${escapeHtml(status)}</span>`;
    
    // Dates
    document.getElementById('detail-created').textContent = formatDate(santriData.createdAt);
    
    if (santriData.updatedAt && santriData.updatedAt !== santriData.createdAt) {
        document.getElementById('detail-updated').textContent = formatDate(santriData.updatedAt);
        document.getElementById('detail-updated-item').style.display = 'grid';
    } else {
        document.getElementById('detail-updated-item').style.display = 'none';
    }

    renderKelasHistory(formatDate);
}

function parseRiwayatKelas(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) return parsed;
        } catch (error) {
            return [];
        }
    }
    return [];
}

function renderKelasHistory(formatDate) {
    const container = document.getElementById('detail-history-list');
    if (!container) return;
    const history = parseRiwayatKelas(santriData.riwayatKelas);
    if (!history.length) {
        container.innerHTML = '<div class="overview-empty">Belum ada riwayat kelas.</div>';
        return;
    }
    container.innerHTML = history.map(entry => {
        const from = entry.from || '-';
        const to = entry.to || '-';
        const dateText = formatDate(entry.date);
        return `
            <div class="overview-row">
                <span>${escapeHtml(from)} -> ${escapeHtml(to)}</span>
                <strong>${escapeHtml(dateText)}</strong>
            </div>
        `;
    }).join('');
}

// Show error state
function showError() {
    const loadingState = document.getElementById('loading-state');
    const errorState = document.getElementById('error-state');
    const detailContent = document.getElementById('detail-content');
    
    loadingState.style.display = 'none';
    detailContent.style.display = 'none';
    errorState.style.display = 'block';
}

// Edit santri
function editSantri() {
    if (santriId) {
        window.location.href = `form.html?edit=${santriId}`;
    }
}

// Delete santri
async function deleteSantri() {
    if (!confirm('Apakah Anda yakin ingin menghapus data santri ini?')) {
        return;
    }
    
    try {
        const success = await deleteSantriById(santriId);
        
        if (success) {
            showNotification('Data berhasil dihapus!', 'success');
            
            // Redirect to list after 1 second
            setTimeout(() => {
                window.location.href = 'list.html';
            }, 1000);
        }
    } catch (error) {
        console.error('Error deleting data:', error);
        showNotification('Error menghapus data: ' + error.message, 'error');
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const existing = document.querySelector('.notification');
    if (existing) {
        existing.remove();
    }

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

// Escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
