const STATUS_ORDER = [
    'Aktif',
    'Mengundurkan Diri',
    'Istirahat',
    'Skorsing',
    'Pindah Kampus',
    'Dikeluarkan'
];
const ASRAMA_ORDER = [
    'Ghaza 1',
    'Ghaza 2',
    'Syanggit',
    'Santiniketan',
    'Mekkah',
    'Mesir',
    'Riyadh'
];
const ASRAMA_LOOKUP = ASRAMA_ORDER.reduce((acc, name) => {
    acc[name.toLowerCase()] = name;
    return acc;
}, {});

function statusClassName(status) {
    return (status || '').toLowerCase().replace(/\s+/g, '-');
}

function parseDateSafe(dateValue) {
    if (!dateValue) return null;
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return null;
    return date;
}

function formatBirthdayDate(date) {
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'long' });
}

function normalizeKelas(kelas) {
    return (kelas || '').toString().trim().replace(/\s+/g, ' ');
}

function normalizeAsrama(asrama) {
    return (asrama || '').toString().trim();
}

function resolveAsrama(asrama) {
    const normalized = normalizeAsrama(asrama);
    if (!normalized) return null;
    return ASRAMA_LOOKUP[normalized.toLowerCase()] || null;
}

function parseKelasKey(kelas) {
    const normalized = normalizeKelas(kelas).replace(/\s+/g, '');
    const match = normalized.match(/^(\d+)([A-Za-z]+)?$/);
    if (!match) {
        return { num: Number.MAX_SAFE_INTEGER, suffix: normalized || 'zz' };
    }
    return { num: parseInt(match[1], 10), suffix: (match[2] || '').toUpperCase() };
}

function getKelasGroup(kelas) {
    const normalized = normalizeKelas(kelas);
    if (!normalized) return 'Tidak diketahui';
    const intMatch = normalized.match(/^(\d+)\s*int\b/i);
    if (intMatch) return `${intMatch[1]} Int`;
    const numMatch = normalized.match(/^(\d+)/);
    if (numMatch) return numMatch[1];
    return 'Tidak diketahui';
}

function groupCounts(data, keyFn) {
    const counts = {};
    data.forEach(item => {
        const key = keyFn(item) || 'Tidak diketahui';
        counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
}

function renderStatusSummary(data) {
    const summaryEl = document.getElementById('status-summary');
    const totalEl = document.getElementById('status-total');
    if (!summaryEl || !totalEl) return;

    totalEl.textContent = `Total: ${data.length}`;
    const counts = groupCounts(data, item => item.status || 'Tidak diketahui');

    const entries = [
        ...STATUS_ORDER.map(status => [status, counts[status] || 0]),
        ...Object.entries(counts).filter(([status]) => !STATUS_ORDER.includes(status))
    ];

    summaryEl.innerHTML = entries.map(([status, count]) => {
        const badgeClass = `badge badge-${statusClassName(status)}`;
        return `
            <div class="overview-item">
                <span class="${badgeClass}">${status}</span>
                <strong>${count}</strong>
            </div>
        `;
    }).join('');
}

function renderAdvancedSummary(data, type) {
    const summaryEl = document.getElementById('advanced-summary');
    if (!summaryEl) return;

    const activeData = data.filter(item => item.status === 'Aktif');
    let counts = {};
    if (type === 'angkatan') {
        const grouped = {};
        activeData.forEach(item => {
            const kelasLabel = normalizeKelas(item.kelas) || 'Tidak diketahui';
            const group = getKelasGroup(kelasLabel);
            if (!grouped[group]) grouped[group] = {};
            grouped[group][kelasLabel] = (grouped[group][kelasLabel] || 0) + 1;
        });

        const groupEntries = Object.entries(grouped).sort((a, b) => {
            if (a[0] === 'Tidak diketahui') return 1;
            if (b[0] === 'Tidak diketahui') return -1;
            return a[0].localeCompare(b[0], 'id', { numeric: true });
        });

        summaryEl.innerHTML = groupEntries.map(([group, subcounts]) => {
            const total = Object.values(subcounts).reduce((sum, val) => sum + val, 0);
            const subs = Object.entries(subcounts).sort((a, b) => {
                const aKey = parseKelasKey(a[0]);
                const bKey = parseKelasKey(b[0]);
                if (aKey.num !== bKey.num) return aKey.num - bKey.num;
                return aKey.suffix.localeCompare(bKey.suffix, 'id', { numeric: true });
            });
            const subRows = subs.map(([label, count]) => `
                <div class="overview-row overview-subrow">
                    <span>${label}</span>
                    <strong>${count}</strong>
                </div>
            `).join('');
            return `
                <div class="overview-group">
                    <div class="overview-row overview-group-row">
                        <span>${group}</span>
                        <strong>${total}</strong>
                    </div>
                    <div class="overview-sublist">
                        ${subRows}
                    </div>
                </div>
            `;
        }).join('');
        return;
    } else if (type === 'kelas') {
        counts = groupCounts(activeData, item => normalizeKelas(item.kelas) || 'Tidak diketahui');
    } else if (type === 'konsulat') {
        counts = groupCounts(activeData, item => item.konsulat || 'Tidak diketahui');
    } else if (type === 'asrama') {
        counts = ASRAMA_ORDER.reduce((acc, name) => {
            acc[name] = 0;
            return acc;
        }, {});
        activeData.forEach(item => {
            const asrama = resolveAsrama(item.asrama);
            if (asrama) counts[asrama] += 1;
        });
    }

    if (type === 'asrama') {
        summaryEl.innerHTML = ASRAMA_ORDER.map(name => `
            <div class="overview-row">
                <span>${name}</span>
                <strong>${counts[name] || 0}</strong>
            </div>
        `).join('');
        return;
    }

    const sorted = Object.entries(counts).sort((a, b) => {
        if (type === 'konsulat') {
            return a[0].toString().trim().localeCompare(b[0].toString().trim(), 'id', { sensitivity: 'base', numeric: true });
        }
        if (type !== 'kelas') return b[1] - a[1];
        const parse = (label) => {
            const match = label.match(/^(\d+)\s*-?\s*([A-Za-z]*)/);
            if (!match) return { num: Number.MAX_SAFE_INTEGER, suffix: label };
            return { num: parseInt(match[1], 10), suffix: match[2] || '' };
        };
        const aKey = parse(a[0]);
        const bKey = parse(b[0]);
        if (aKey.num !== bKey.num) return aKey.num - bKey.num;
        return aKey.suffix.localeCompare(bKey.suffix, 'id', { numeric: true });
    });
    if (sorted.length === 0) {
        summaryEl.innerHTML = '<div class="overview-empty">Belum ada data.</div>';
        return;
    }

    summaryEl.innerHTML = sorted.map(([label, count]) => `
        <div class="overview-row">
            <span>${label}</span>
            <strong>${count}</strong>
        </div>
    `).join('');
}

function renderBirthdayAlert(data) {
    const alertEl = document.getElementById('birthday-alert');
    const totalEl = document.getElementById('birthday-total');
    if (!alertEl || !totalEl) return;

    const today = new Date();
    const todayMonth = today.getMonth();
    const todayDate = today.getDate();

    const birthdays = data.filter(item => {
        const date = parseDateSafe(item.tanggalLahir);
        return date && date.getMonth() === todayMonth && date.getDate() === todayDate;
    }).map(item => {
        const date = parseDateSafe(item.tanggalLahir);
        const age = date ? today.getFullYear() - date.getFullYear() : null;
        return {
            name: item.nama || '-',
            kelas: item.kelas || '-',
            age
        };
    });

    totalEl.textContent = `${birthdays.length} santri`;
    if (birthdays.length === 0) {
        alertEl.innerHTML = '<div class="overview-empty">Tidak ada santri yang berulang tahun hari ini.</div>';
        return;
    }

    alertEl.innerHTML = birthdays.map(item => `
        <div class="birthday-item">
            <div>
                <strong>${item.name}</strong>
                <span class="birthday-meta">Kelas: ${item.kelas}</span>
            </div>
            <span class="birthday-age">${item.age ? item.age + ' tahun' : '-'}</span>
        </div>
    `).join('');
}

function renderBirthdayMonth(data) {
    const listEl = document.getElementById('birthday-month-list');
    const totalEl = document.getElementById('birthday-month-total');
    if (!listEl || !totalEl) return;

    const today = new Date();
    const thisMonth = today.getMonth();

    const birthdays = data.filter(item => item.status === 'Aktif').map(item => {
        const date = parseDateSafe(item.tanggalLahir);
        if (!date || date.getMonth() !== thisMonth) return null;
        if (date.getDate() <= today.getDate()) return null;
        return {
            name: item.nama || '-',
            kelas: item.kelas || '-',
            date
        };
    }).filter(Boolean).sort((a, b) => a.date.getDate() - b.date.getDate());

    totalEl.textContent = `${birthdays.length} santri`;
    if (birthdays.length === 0) {
        listEl.innerHTML = '<div class="overview-empty">Tidak ada santri yang berulang tahun bulan ini.</div>';
        return;
    }

    listEl.innerHTML = birthdays.map(item => `
        <div class="birthday-item">
            <div>
                <strong>${item.name}</strong>
                <span class="birthday-meta">Kelas: ${item.kelas}</span>
            </div>
            <span class="birthday-date">${formatBirthdayDate(item.date)}</span>
        </div>
    `).join('');
}

function setupTabs(data) {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(btn => btn.classList.remove('active'));
            tab.classList.add('active');
            renderAdvancedSummary(data, tab.dataset.summary);
        });
    });
    const defaultTab = document.querySelector('.tab-btn.active');
    if (defaultTab) {
        renderAdvancedSummary(data, defaultTab.dataset.summary);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const role = await requireAuth();
    if (!role) return;

    const data = await getAllSantri();
    renderStatusSummary(data);
    renderBirthdayAlert(data);
    renderBirthdayMonth(data);
    setupTabs(data);
});
