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
let currentMonthValue = '';
let currentWeekValue = '';
let viewMonthValue = '';
let viewWeekValue = '';

function getMonthValue() {
    const input = document.getElementById('raport-month');
    return input?.value || '';
}

function getWeekValue() {
    const input = document.getElementById('raport-week');
    return input?.value || '';
}

function toMonthDate(monthValue) {
    if (!monthValue) return null;
    return `${monthValue}-01`;
}

function toWeekNumber(weekValue) {
    const week = parseInt(weekValue, 10);
    if (!Number.isFinite(week)) return null;
    if (week < 1) return 1;
    if (week > 4) return 4;
    return week;
}

function getCurrentWeekValue() {
    const today = new Date();
    const day = today.getDate();
    if (day <= 7) return '1';
    if (day <= 14) return '2';
    if (day <= 21) return '3';
    return '4';
}

function normalizeKelas(kelas) {
    return (kelas || '').toString().trim().replace(/\s+/g, ' ');
}

function normalizeKelasKey(kelas) {
    return (kelas || '').toString().trim().replace(/\s+/g, '').toUpperCase();
}

function getWaliKelasKey() {
    return normalizeKelasKey(window.currentUserKelas || '');
}

function escapeCell(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\"/g, '&quot;')
        .replace(/'/g, '&#039;');
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

function isReportComplete(report) {
    if (!report) return false;
    return RAPORT_CATEGORIES.every(cat => {
        const score = report[`${cat.key}_score`];
        const note = report[`${cat.key}_note`];
        return score && note;
    });
}

function getCategoryStatus(max, value) {
    if (!value) return '';
    const rule = CATEGORY_RULES[max];
    if (!rule) return '';
    if (value >= rule.baik[0] && value <= rule.baik[1]) return 'Baik';
    if (value >= rule.sedang[0] && value <= rule.sedang[1]) return 'Sedang';
    if (value >= rule.kurang[0] && value <= rule.kurang[1]) return 'Kurang';
    return '';
}

function getTotalPredicate(total) {
    if (!total) return '';
    if (total >= 351 && total <= 500) return 'Baik';
    if (total >= 151 && total <= 350) return 'Sedang';
    if (total >= 1 && total <= 150) return 'Kurang';
    return '';
}

function exportToExcel(rows, filename) {
    const header = [
        'No',
        'Nama',
        'Kelas',
        'No Absen',
        'Bulan',
        'Minggu',
        'Status Raport',
        'Total Poin',
        'Predikat Total',
        ...RAPORT_CATEGORIES.flatMap(cat => [
            `${cat.label} (Skor)`,
            `${cat.label} (Alasan)`,
            `${cat.label} (Predikat)`
        ])
    ];

    const tableRows = [
        `<tr>${header.map(col => `<th>${escapeCell(col)}</th>`).join('')}</tr>`,
        ...rows.map(row => `<tr>${row.map(cell => `<td>${escapeCell(cell)}</td>`).join('')}</tr>`)
    ].join('');

    const html = `
        <html>
            <head><meta charset="UTF-8"></head>
            <body>
                <table>${tableRows}</table>
            </body>
        </html>
    `;

    const blob = new Blob([`\ufeff${html}`], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

function buildExportRows(targetSantri) {
    const reportMap = new Map(reportData.map(r => [r.santri_id, r]));
    return targetSantri.map((s, index) => {
        const report = reportMap.get(s.id);
        const status = isReportComplete(report) ? 'Sudah' : 'Belum';
        let totalPoints = 0;
        RAPORT_CATEGORIES.forEach(cat => {
            const value = report ? report[`${cat.key}_score`] : null;
            if (typeof value === 'number') {
                totalPoints += value;
            }
        });
        const totalPredicate = getTotalPredicate(totalPoints);
        const predikatClass = totalPredicate
            ? `predikat-pill predikat-${totalPredicate.toLowerCase()}`
            : 'predikat-pill';
        const cells = [
            index + 1,
            s.nama || '-',
            normalizeKelas(s.kelas) || '-',
            s.noAbsen ?? '-',
            viewMonthValue,
            viewWeekValue,
            status,
            totalPoints || '',
            totalPredicate
        ];
        RAPORT_CATEGORIES.forEach(cat => {
            const score = report ? report[`${cat.key}_score`] ?? '' : '';
            const note = report ? report[`${cat.key}_note`] ?? '' : '';
            const predikat = score ? getCategoryStatus(cat.max, score) : '';
            cells.push(score);
            cells.push(note);
            cells.push(predikat);
        });
        return cells;
    });
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
        <details class="report-item" data-key="${cat.key}">
            <summary>
                <div class="report-item-title">${cat.label}</div>
                <div class="report-item-meta">
                    <span class="report-badge" id="${cat.key}-badge">-</span>
                    <span class="report-saved" id="${cat.key}-saved">Belum</span>
                </div>
            </summary>
            <div class="report-item-body">
                <div class="report-input-row">
                    <label class="report-field-label" for="${cat.key}-score">Skor</label>
                    <input type="number" id="${cat.key}-score" min="1" max="${cat.max}" placeholder="1-${cat.max}">
                    <span class="report-max">Maks ${cat.max}</span>
                </div>
                <label class="report-field-label" for="${cat.key}-note">Alasan/Kegiatan</label>
                <textarea id="${cat.key}-note" rows="3" placeholder="Tuliskan alasan penilaian atau kegiatan yang menunjukkan skor ini"></textarea>
                <div class="report-item-actions">
                    <small class="report-hint">Kategori otomatis</small>
                    <button type="button" class="btn btn-secondary report-save" data-key="${cat.key}">Simpan Kategori</button>
                </div>
            </div>
        </details>
    `).join('');

    RAPORT_CATEGORIES.forEach(cat => {
        const scoreInput = document.getElementById(`${cat.key}-score`);
        const badge = document.getElementById(`${cat.key}-badge`);
        if (scoreInput && badge) {
            scoreInput.addEventListener('input', () => {
                const value = parseInt(scoreInput.value, 10);
                badge.textContent = getCategoryLabel(cat.max, value);
                updateProgress();
            });
        }
        const noteInput = document.getElementById(`${cat.key}-note`);
        if (noteInput) {
            noteInput.addEventListener('input', updateProgress);
        }
    });
}

function setFormDisabled(disabled) {
    document.querySelectorAll('#raport-form input, #raport-form textarea, #raport-form button')
        .forEach(el => {
            if (el.id === 'raport-month' || el.id === 'raport-week' || el.id === 'filter-kelas' || el.id === 'santri-select') return;
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
        const saved = document.getElementById(`${cat.key}-saved`);
        const scoreValue = report ? report[`${cat.key}_score`] : '';
        const noteValue = report ? report[`${cat.key}_note`] : '';
        if (scoreInput) scoreInput.value = scoreValue || '';
        if (noteInput) noteInput.value = noteValue || '';
        if (badge) badge.textContent = getCategoryLabel(cat.max, scoreValue);
        if (saved) saved.textContent = scoreValue && noteValue ? 'Tersimpan' : 'Belum';
    });
    updateProgress();
}

function updateMonthLabel() {
    const label = document.getElementById('month-label');
    if (label) {
        label.textContent = `Bulan: ${viewMonthValue} • Minggu: ${viewWeekValue}`;
    }
}

function updateCompletionSummary() {
    const summary = document.getElementById('completion-summary');
    if (!summary) return;
    summary.textContent = `Rekap pengisian bulan ${viewMonthValue} minggu ${viewWeekValue}.`;
}

async function loadReports() {
    reportData = await getRaportMentalByMonth(toMonthDate(viewMonthValue), toWeekNumber(viewWeekValue));
}

function setupMonthDefault() {
    const monthInput = document.getElementById('raport-month');
    if (!monthInput) return;
    const now = new Date();
    const monthValue = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    monthInput.value = monthValue;
    monthInput.min = monthValue;
    monthInput.max = monthValue;
}

function setupWeekDefault() {
    const weekInput = document.getElementById('raport-week');
    if (!weekInput) return;
    const weekValue = getCurrentWeekValue();
    weekInput.value = weekValue;
    Array.from(weekInput.options).forEach(option => {
        option.disabled = option.value !== weekValue;
    });
}

function setupViewPeriodInputs() {
    const monthPrimary = document.getElementById('raport-view-month');
    const monthSecondary = document.getElementById('raport-view-month-secondary');
    const weekPrimary = document.getElementById('raport-view-week');
    const weekSecondary = document.getElementById('raport-view-week-secondary');
    const storedMonth = localStorage.getItem('raportViewMonth');
    const storedWeek = localStorage.getItem('raportViewWeek');

    viewMonthValue = storedMonth || currentMonthValue;
    viewWeekValue = String(toWeekNumber(storedWeek || currentWeekValue) || currentWeekValue);

    const applyValues = () => {
        [monthPrimary, monthSecondary].forEach(input => {
            if (input) input.value = viewMonthValue;
        });
        [weekPrimary, weekSecondary].forEach(input => {
            if (input) input.value = viewWeekValue;
        });
    };

    const handleChange = async (nextMonth, nextWeek) => {
        viewMonthValue = nextMonth || viewMonthValue || currentMonthValue;
        const weekCandidate = nextWeek || viewWeekValue || currentWeekValue;
        viewWeekValue = String(toWeekNumber(weekCandidate) || currentWeekValue);
        localStorage.setItem('raportViewMonth', viewMonthValue);
        localStorage.setItem('raportViewWeek', viewWeekValue);
        applyValues();
        await loadReports();
        updateMonthLabel();
        updateCompletionSummary();
        const params = new URLSearchParams(window.location.search);
        const kelas = params.get('kelas');
        const santriId = params.get('santri');
        if (!kelas) {
            renderKelasGrid();
        } else if (kelas && !santriId) {
            renderSantriList(kelas);
        }
    };

    [monthPrimary, monthSecondary].forEach(input => {
        if (!input) return;
        input.value = viewMonthValue;
        input.addEventListener('change', async () => {
            await handleChange(input.value, null);
        });
    });

    [weekPrimary, weekSecondary].forEach(input => {
        if (!input) return;
        input.value = viewWeekValue;
        input.addEventListener('change', async () => {
            await handleChange(null, input.value);
        });
    });
}

function getReportPayload(santriId) {
    const month = getMonthValue();
    const week = getWeekValue();
    if (!santriId || !month || !week) return null;

    const payload = {
        santri_id: santriId,
        month: toMonthDate(month),
        week: toWeekNumber(week)
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
    let hasAny = false;
    for (const cat of RAPORT_CATEGORIES) {
        const score = payload[`${cat.key}_score`];
        const note = payload[`${cat.key}_note`];
        if (score || note) {
            hasAny = true;
            if (!score || score < 1 || score > cat.max) {
                return `Nilai ${cat.label} harus diisi 1-${cat.max}.`;
            }
            if (!note) {
                return `Kegiatan/alasan untuk ${cat.label} harus diisi.`;
            }
        }
    }
    if (!hasAny) {
        return 'Isi minimal satu kategori.';
    }
    return null;
}

function validateCategory(cat) {
    const score = parseInt(document.getElementById(`${cat.key}-score`)?.value, 10);
    const note = document.getElementById(`${cat.key}-note`)?.value.trim();
    if (!score || score < 1 || score > cat.max) {
        return `Nilai ${cat.label} harus diisi 1-${cat.max}.`;
    }
    if (!note) {
        return `Kegiatan/alasan untuk ${cat.label} harus diisi.`;
    }
    return null;
}

function buildCategoryPayload(santriId, cat) {
    const month = getMonthValue();
    const week = getWeekValue();
    if (!santriId || !month || !week) return null;
    const score = parseInt(document.getElementById(`${cat.key}-score`)?.value, 10);
    const note = document.getElementById(`${cat.key}-note`)?.value.trim();
    return {
        santri_id: santriId,
        month: toMonthDate(month),
        week: toWeekNumber(week),
        [`${cat.key}_score`]: Number.isFinite(score) ? score : null,
        [`${cat.key}_note`]: note || null
    };
}

function updateProgress() {
    const total = RAPORT_CATEGORIES.length;
    let filled = 0;
    RAPORT_CATEGORIES.forEach(cat => {
        const score = parseInt(document.getElementById(`${cat.key}-score`)?.value, 10);
        const note = document.getElementById(`${cat.key}-note`)?.value.trim();
        if (score && note) filled += 1;
    });
    const percent = Math.round((filled / total) * 100);
    const bar = document.getElementById('progress-bar');
    const text = document.getElementById('progress-text');
    if (bar) bar.style.width = `${percent}%`;
    if (text) text.textContent = `${filled}/${total} kategori terisi (${percent}%)`;
}

function renderKelasGrid() {
    const grid = document.getElementById('kelas-grid');
    if (!grid) return;
    if (santriData.length === 0) {
        grid.innerHTML = '<div class="overview-empty">Belum ada data santri.</div>';
        return;
    }
    const kelasGroups = {};
    santriData.forEach(s => {
        const kelas = normalizeKelas(s.kelas) || 'Tidak diketahui';
        if (!kelasGroups[kelas]) kelasGroups[kelas] = [];
        kelasGroups[kelas].push(s);
    });

    const kelasList = Object.keys(kelasGroups).sort((a, b) => {
        const aKey = parseKelasKey(a);
        const bKey = parseKelasKey(b);
        if (aKey.num !== bKey.num) return aKey.num - bKey.num;
        return aKey.suffix.localeCompare(bKey.suffix, 'id');
    });

    const completeIds = new Set(reportData.filter(isReportComplete).map(r => r.santri_id));
    grid.innerHTML = kelasList.map(kelas => {
        const total = kelasGroups[kelas].length;
        const completed = kelasGroups[kelas].filter(s => completeIds.has(s.id)).length;
        const percent = total ? Math.round((completed / total) * 100) : 0;
        return `
            <a class="kelas-card" href="raport.html?kelas=${encodeURIComponent(kelas)}">
                <div class="kelas-card-title">${kelas}</div>
                <div class="kelas-card-meta">${completed} / ${total} santri</div>
                <div class="kelas-card-percent">${percent}%</div>
            </a>
        `;
    }).join('');
}

function renderSantriList(kelas) {
    const section = document.getElementById('raport-santri');
    const tbody = document.getElementById('santri-tbody');
    const title = document.getElementById('kelas-title');
    const subtitle = document.getElementById('kelas-subtitle');
    if (!section || !tbody) return;

    const kelasKey = normalizeKelasKey(kelas);
    const filtered = santriData.filter(s => normalizeKelasKey(s.kelas) === kelasKey);
    if (title) title.textContent = `Kelas ${kelas}`;
    if (subtitle) subtitle.textContent = `Bulan ${viewMonthValue} • Minggu ${viewWeekValue}`;

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Belum ada data.</td></tr>';
        return;
    }
    const reportMap = new Map(reportData.map(r => [r.santri_id, r]));
    tbody.innerHTML = filtered.map((s, index) => {
        const report = reportMap.get(s.id);
        let totalPoints = 0;
        RAPORT_CATEGORIES.forEach(cat => {
            const value = report ? report[`${cat.key}_score`] : null;
            if (typeof value === 'number') {
                totalPoints += value;
            }
        });
        const totalPredicate = getTotalPredicate(totalPoints);
        const predikatClass = totalPredicate
            ? `predikat-pill predikat-${totalPredicate.toLowerCase()}`
            : 'predikat-pill';
        const statusText = isReportComplete(report) ? 'Sudah' : 'Belum';
        const statusClass = isReportComplete(report) ? 'status-done' : 'status-pending';
        return `
        <tr>
            <td>${index + 1}</td>
            <td>${s.nama}</td>
            <td>${s.noAbsen ?? '-'}</td>
            <td>
                <span class="status-pill ${statusClass}">
                    ${statusText}
                </span>
            </td>
            <td><span class="${predikatClass}">${totalPredicate || '-'}</span></td>
            <td>
                <a class="btn btn-secondary" href="raport.html?kelas=${encodeURIComponent(kelas)}&santri=${s.id}">
                    ${report ? 'Edit' : 'Input'}
                </a>
            </td>
        </tr>
        `;
    }).join('');
}

function renderForm(santriId, kelas) {
    const santri = santriData.find(s => s.id === santriId);
    const title = document.getElementById('santri-title');
    const subtitle = document.getElementById('santri-subtitle');
    if (title) title.textContent = santri ? `Raport ${santri.nama}` : 'Form Raport Mental';
    if (subtitle) subtitle.textContent = santri ? `Kelas ${normalizeKelas(santri.kelas)} • Bulan ${currentMonthValue} • Minggu ${currentWeekValue}` : '';

    const existing = reportData.find(r => r.santri_id === santriId);
    fillForm(existing || null);
    const modeEl = document.getElementById('report-mode');
    if (modeEl) {
        modeEl.textContent = existing ? 'Mode: Edit' : 'Mode: Input';
    }

    const monthInput = document.getElementById('raport-month');
    const lock = document.getElementById('month-lock');
    const weekInput = document.getElementById('raport-week');
    const weekLock = document.getElementById('week-lock');
    if (monthInput) {
        monthInput.value = currentMonthValue;
    }
    if (lock) {
        lock.textContent = 'Input hanya untuk bulan berjalan.';
    }
    if (weekInput) {
        weekInput.value = currentWeekValue;
    }
    if (weekLock) {
        weekLock.textContent = 'Input hanya untuk minggu berjalan.';
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    currentRole = await requireAuth();
    if (!currentRole) return;

    buildFields();
    setupMonthDefault();
    setupWeekDefault();
    currentMonthValue = getMonthValue();
    currentWeekValue = getWeekValue() || getCurrentWeekValue();
    viewMonthValue = currentMonthValue;
    viewWeekValue = currentWeekValue;
    updateMonthLabel();
    setupViewPeriodInputs();

    santriData = (await getAllSantri()).filter(s => (s.status || '').toLowerCase() === 'aktif');
    const waliKelasKey = getWaliKelasKey();
    if (currentRole === 'wali_kelas' && waliKelasKey) {
        santriData = santriData.filter(s => normalizeKelasKey(s.kelas) === waliKelasKey);
    }
    santriData.sort(sortSantri);
    await loadReports();
    updateCompletionSummary();

    const params = new URLSearchParams(window.location.search);
    const kelas = params.get('kelas');
    const santriId = params.get('santri');

    if (currentRole === 'wali_kelas' && kelas && normalizeKelasKey(kelas) !== getWaliKelasKey()) {
        window.location.href = 'raport.html';
        return;
    }

    if (!kelas) {
        renderKelasGrid();
    } else if (kelas && !santriId) {
        document.getElementById('raport-classes').style.display = 'none';
        document.getElementById('raport-santri').style.display = 'block';
        renderSantriList(kelas);
    } else {
        document.getElementById('raport-classes').style.display = 'none';
        document.getElementById('raport-form-section').style.display = 'block';
        renderForm(santriId, kelas);
    }

    const downloadAllBtn = document.getElementById('download-all');
    if (downloadAllBtn) {
        downloadAllBtn.addEventListener('click', () => {
            const rows = buildExportRows(santriData);
            const filename = `raport-mental-${viewMonthValue}-minggu-${viewWeekValue}-semua.xls`;
            exportToExcel(rows, filename);
        });
    }

    const downloadClassBtn = document.getElementById('download-class');
    if (downloadClassBtn) {
        downloadClassBtn.addEventListener('click', () => {
            if (!kelas) return;
            const target = santriData.filter(s => normalizeKelasKey(s.kelas) === normalizeKelasKey(kelas));
            const safeKelas = normalizeKelas(kelas).replace(/\s+/g, '-');
            const filename = `raport-mental-${viewMonthValue}-minggu-${viewWeekValue}-${safeKelas}.xls`;
            exportToExcel(buildExportRows(target), filename);
        });
    }

    const canEdit = currentRole === 'admin' || currentRole === 'wali_kelas';
    const form = document.getElementById('raport-form');
    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!canEdit) {
            alert('Hanya admin atau wali kelas yang dapat mengisi raport.');
            return;
        }
        const confirmed = confirm('Apakah Data Sudah Benar?');
        if (!confirmed) return;

        const payload = getReportPayload(santriId);
        if (!payload) {
            alert('Lengkapi data terlebih dahulu.');
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
            renderForm(santriId, kelas);
            alert('Raport berhasil disimpan.');
        }
    });

    document.querySelectorAll('.report-save').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (!canEdit) {
                alert('Hanya admin atau wali kelas yang dapat mengisi raport.');
                return;
            }
            const key = btn.dataset.key;
            const cat = RAPORT_CATEGORIES.find(item => item.key === key);
            if (!cat) return;
            const error = validateCategory(cat);
            if (error) {
                alert(error);
                return;
            }
            const payload = buildCategoryPayload(santriId, cat);
            if (!payload) {
                alert('Lengkapi data terlebih dahulu.');
                return;
            }
            const saved = await upsertRaportMental(payload);
            if (saved) {
                await loadReports();
                renderForm(santriId, kelas);
                alert('Kategori berhasil disimpan.');
            }
        });
    });

    setFormDisabled(!canEdit);
    const modeEl = document.getElementById('report-mode');
    if (modeEl && !canEdit) {
        modeEl.textContent = 'Mode: Lihat';
    }
});
