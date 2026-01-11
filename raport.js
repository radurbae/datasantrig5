const RAPORT_CATEGORIES = [
    { key: 'kepondokmodernan', label: 'Kepondokmodernan', max: 50 },
    { key: 'dedikasi', label: 'Dedikasi', max: 50 },
    { key: 'kedewasaan', label: 'Kedewasaan', max: 50 },
    { key: 'inisiatif', label: 'Inisiatif', max: 40 },
    { key: 'komunikasi', label: 'Komunikasi', max: 40 },
    { key: 'daya_tanggap', label: 'Daya Tanggap / Kepekaan', max: 30 },
    { key: 'ketaatan', label: 'Ketaatan', max: 30 },
    { key: 'bacaan_quran', label: 'Bacaan Al-Qur’an / Hafalan', max: 30 },
    { key: 'kepemimpinan', label: 'Kepemimpinan', max: 30 },
    { key: 'motivasi', label: 'Motivasi / Kemauan', max: 25 },
    { key: 'kesehatan', label: 'Kesehatan', max: 25 },
    { key: 'disiplin', label: 'Disiplin', max: 25 },
    { key: 'ibadah', label: 'Ibadah', max: 25 },
    { key: 'sopan_santun', label: 'Sopan Santun', max: 25 },
    { key: 'kesegeraan', label: 'Kesegeraan', max: 25 }
];

const CATEGORY_RULES = {
    50: { baik: [36, 50], sedang: [16, 35], kurang: [1, 15] },
    40: { baik: [26, 40], sedang: [11, 25], kurang: [1, 10] },
    30: { baik: [21, 30], sedang: [11, 20], kurang: [1, 10] },
    25: { baik: [16, 25], sedang: [6, 15], kurang: [1, 5] }
};

let santriData = [];
let reportData = [];
let currentRole = 'user';

function getMonthValue() {
    const input = document.getElementById('raport-month');
    return input?.value || '';
}

function toMonthDate(monthValue) {
    if (!monthValue) return null;
    return `${monthValue}-01`;
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

function sortSantri(a, b) {
    const aKey = parseKelasKey(a.kelas);
    const bKey = parseKelasKey(b.kelas);
    if (aKey.num !== bKey.num) return aKey.num - bKey.num;
    if (aKey.suffix !== bKey.suffix) return aKey.suffix.localeCompare(bKey.suffix, 'id');
    const aAbsen = typeof a.noAbsen === 'number' ? a.noAbsen : Number.MAX_SAFE_INTEGER;
    const bAbsen = typeof b.noAbsen === 'number' ? b.noAbsen : Number.MAX_SAFE_INTEGER;
    if (aAbsen !== bAbsen) return aAbsen - bAbsen;
    return (a.nama || '').localeCompare(b.nama || '', 'id');
}

function getCategoryLabel(max, value) {
    if (!value) return '-';
    const rule = CATEGORY_RULES[max];
    if (!rule) return '-';
    if (value >= rule.baik[0] && value <= rule.baik[1]) return 'Baik';
    if (value >= rule.sedang[0] && value <= rule.sedang[1]) return 'Sedang';
    if (value >= rule.kurang[0] && value <= rule.kurang[1]) return 'Kurang';
    return '-';
}

function buildFields() {
    const container = document.getElementById('report-fields');
    if (!container) return;
    container.innerHTML = RAPORT_CATEGORIES.map(cat => `
        <div class="report-field">
            <label for="${cat.key}-score">${cat.label}</label>
            <div class="report-input-row">
                <input type="number" id="${cat.key}-score" min="1" max="${cat.max}" placeholder="1-${cat.max}">
                <span class="report-badge" id="${cat.key}-badge">-</span>
            </div>
            <textarea id="${cat.key}-note" rows="2" placeholder="Kegiatan/alasan penilaian"></textarea>
            <small class="report-hint">Skor 1-${cat.max} • Kategori otomatis</small>
        </div>
    `).join('');

    RAPORT_CATEGORIES.forEach(cat => {
        const scoreInput = document.getElementById(`${cat.key}-score`);
        const badge = document.getElementById(`${cat.key}-badge`);
        if (scoreInput && badge) {
            scoreInput.addEventListener('input', () => {
                const value = parseInt(scoreInput.value, 10);
                badge.textContent = getCategoryLabel(cat.max, value);
            });
        }
    });
}

function setFormDisabled(disabled) {
    document.querySelectorAll('#raport-form input, #raport-form textarea, #raport-form button')
        .forEach(el => {
            if (el.id === 'raport-month' || el.id === 'filter-kelas' || el.id === 'santri-select') return;
            el.disabled = disabled;
        });
    const submitBtn = document.getElementById('raport-submit');
    if (submitBtn) {
        submitBtn.style.display = disabled ? 'none' : 'inline-flex';
    }
}

function fillForm(report) {
    RAPORT_CATEGORIES.forEach(cat => {
        const scoreInput = document.getElementById(`${cat.key}-score`);
        const noteInput = document.getElementById(`${cat.key}-note`);
        const badge = document.getElementById(`${cat.key}-badge`);
        const scoreValue = report ? report[`${cat.key}_score`] : '';
        const noteValue = report ? report[`${cat.key}_note`] : '';
        if (scoreInput) scoreInput.value = scoreValue || '';
        if (noteInput) noteInput.value = noteValue || '';
        if (badge) badge.textContent = getCategoryLabel(cat.max, scoreValue);
    });
}

function updateSantriSelect() {
    const kelasFilter = document.getElementById('filter-kelas')?.value || '';
    const santriSelect = document.getElementById('santri-select');
    if (!santriSelect) return;

    const filtered = kelasFilter
        ? santriData.filter(s => normalizeKelas(s.kelas) === kelasFilter)
        : santriData;

    santriSelect.innerHTML = '<option value="">Pilih Santri</option>' + filtered.map(s => `
        <option value="${s.id}">${s.nama} (${normalizeKelas(s.kelas) || '-'})</option>
    `).join('');
}

function updateKelasOptions() {
    const kelasSelect = document.getElementById('filter-kelas');
    if (!kelasSelect) return;
    const kelasList = [...new Set(santriData.map(s => normalizeKelas(s.kelas)).filter(Boolean))];
    kelasList.sort((a, b) => {
        const aKey = parseKelasKey(a);
        const bKey = parseKelasKey(b);
        if (aKey.num !== bKey.num) return aKey.num - bKey.num;
        return aKey.suffix.localeCompare(bKey.suffix, 'id');
    });
    kelasSelect.innerHTML = '<option value="">Semua Kelas</option>' +
        kelasList.map(k => `<option value="${k}">${k}</option>`).join('');
}

function updateCompletionSummary() {
    const summary = document.getElementById('completion-summary');
    const kelasFilter = document.getElementById('filter-kelas')?.value || '';
    if (!summary) return;

    const month = getMonthValue();
    if (!month) {
        summary.textContent = 'Pilih bulan untuk melihat rekap.';
        return;
    }

    const filteredSantri = kelasFilter
        ? santriData.filter(s => normalizeKelas(s.kelas) === kelasFilter)
        : santriData;

    const total = filteredSantri.length;
    const filledIds = new Set(reportData.map(r => r.santri_id));
    const filled = filteredSantri.filter(s => filledIds.has(s.id)).length;
    const percent = total ? Math.round((filled / total) * 100) : 0;

    summary.textContent = `Terisi ${filled} dari ${total} santri (${percent}%)`;
}

function renderStatusTable() {
    const tbody = document.getElementById('report-tbody');
    if (!tbody) return;
    const kelasFilter = document.getElementById('filter-kelas')?.value || '';
    const filteredSantri = kelasFilter
        ? santriData.filter(s => normalizeKelas(s.kelas) === kelasFilter)
        : santriData;

    if (filteredSantri.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-state">Belum ada data.</td></tr>';
        return;
    }

    const filledIds = new Set(reportData.map(r => r.santri_id));
    tbody.innerHTML = filteredSantri.map((s, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${s.nama}</td>
            <td>${normalizeKelas(s.kelas) || '-'}</td>
            <td>
                <span class="status-pill ${filledIds.has(s.id) ? 'status-done' : 'status-pending'}">
                    ${filledIds.has(s.id) ? 'Sudah' : 'Belum'}
                </span>
            </td>
        </tr>
    `).join('');
}

async function loadReports() {
    const month = getMonthValue();
    if (!month) {
        reportData = [];
        updateCompletionSummary();
        renderStatusTable();
        return;
    }
    reportData = await getRaportMentalByMonth(toMonthDate(month));
    updateCompletionSummary();
    renderStatusTable();
}

function setupMonthDefault() {
    const monthInput = document.getElementById('raport-month');
    if (!monthInput) return;
    const now = new Date();
    const monthValue = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    monthInput.value = monthValue;
}

function getReportPayload() {
    const santriId = document.getElementById('santri-select')?.value;
    const month = getMonthValue();
    if (!santriId || !month) return null;

    const payload = {
        santri_id: santriId,
        month: toMonthDate(month)
    };

    RAPORT_CATEGORIES.forEach(cat => {
        const score = parseInt(document.getElementById(`${cat.key}-score`)?.value, 10);
        const note = document.getElementById(`${cat.key}-note`)?.value.trim();
        payload[`${cat.key}_score`] = Number.isFinite(score) ? score : null;
        payload[`${cat.key}_note`] = note || null;
    });

    return payload;
}

function validatePayload(payload) {
    for (const cat of RAPORT_CATEGORIES) {
        const score = payload[`${cat.key}_score`];
        const note = payload[`${cat.key}_note`];
        if (!score || score < 1 || score > cat.max) {
            return `Nilai ${cat.label} harus diisi 1-${cat.max}.`;
        }
        if (!note) {
            return `Kegiatan/alasan untuk ${cat.label} harus diisi.`;
        }
    }
    return null;
}

async function handleSantriChange() {
    const santriId = document.getElementById('santri-select')?.value;
    if (!santriId) {
        fillForm(null);
        return;
    }
    const month = getMonthValue();
    if (!month) return;
    const existing = reportData.find(r => r.santri_id === santriId);
    fillForm(existing || null);
    const modeEl = document.getElementById('report-mode');
    if (modeEl) {
        modeEl.textContent = existing ? 'Mode: Edit' : 'Mode: Input';
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    currentRole = await requireAuth();
    if (!currentRole) return;

    buildFields();
    setupMonthDefault();

    santriData = await getAllSantri();
    santriData.sort(sortSantri);
    updateKelasOptions();
    updateSantriSelect();
    await loadReports();
    updateCompletionSummary();

    document.getElementById('raport-month')?.addEventListener('change', async () => {
        await loadReports();
        handleSantriChange();
    });

    document.getElementById('filter-kelas')?.addEventListener('change', () => {
        updateSantriSelect();
        updateCompletionSummary();
        renderStatusTable();
        handleSantriChange();
    });

    document.getElementById('santri-select')?.addEventListener('change', handleSantriChange);

    const form = document.getElementById('raport-form');
    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (currentRole !== 'admin') {
            alert('Hanya admin yang dapat mengisi raport.');
            return;
        }
        const confirmed = confirm('Apakah Data Sudah Benar?');
        if (!confirmed) return;

        const payload = getReportPayload();
        if (!payload) {
            alert('Pilih santri dan bulan terlebih dahulu.');
            return;
        }
        const error = validatePayload(payload);
        if (error) {
            alert(error);
            return;
        }
        const submitBtn = document.getElementById('raport-submit');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Menyimpan...';

        const saved = await upsertRaportMental(payload);
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;

        if (saved) {
            await loadReports();
            handleSantriChange();
            alert('Raport berhasil disimpan.');
        }
    });

    setFormDisabled(currentRole !== 'admin');
    const modeEl = document.getElementById('report-mode');
    if (modeEl && currentRole !== 'admin') {
        modeEl.textContent = 'Mode: Lihat';
    }
});
