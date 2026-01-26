let santriData = [];
let selectableSantri = [];
let currentSelection = null;

function normalizeText(value) {
    return (value || '').toString().trim().toLowerCase().replace(/\s+/g, ' ');
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

function getKelasNumber(kelas) {
    const match = normalizeKelas(kelas).match(/^(\d+)/);
    if (!match) return null;
    const num = parseInt(match[1], 10);
    return Number.isFinite(num) ? num : null;
}

function isFinalClass(kelas) {
    return getKelasNumber(kelas) === 6;
}

function formatOption(label, value) {
    return `<option value="${value}">${label}</option>`;
}

function updateManualResult(message, tone = 'info') {
    const result = document.getElementById('bulk-manual-result');
    if (!result) return;
    result.textContent = message || '';
    result.style.color = tone === 'error' ? '#b91c1c' : '';
}

function updateCsvResult(message, tone = 'info') {
    const result = document.getElementById('bulk-csv-result');
    if (!result) return;
    result.textContent = message || '';
    result.style.color = tone === 'error' ? '#b91c1c' : '';
}

function buildSantriLookup() {
    const lookup = new Map();
    santriData.forEach(item => {
        const key = `${normalizeText(item.nama)}|${normalizeText(item.kelas)}`;
        if (!lookup.has(key)) {
            lookup.set(key, []);
        }
        lookup.get(key).push(item);
    });
    return lookup;
}

function populateClassOptions() {
    const select = document.getElementById('bulk-current-class');
    if (!select) return;
    const classes = [...new Set(selectableSantri.map(item => normalizeKelas(item.kelas)).filter(Boolean))];
    classes.sort((a, b) => {
        const aKey = parseKelasKey(a);
        const bKey = parseKelasKey(b);
        if (aKey.num !== bKey.num) return aKey.num - bKey.num;
        return aKey.suffix.localeCompare(bKey.suffix, 'id');
    });
    select.innerHTML = '<option value="">Pilih kelas</option>' + classes.map(cls => formatOption(cls, cls)).join('');
}

function populateSantriOptions(kelas) {
    const select = document.getElementById('bulk-current-santri');
    if (!select) return;
    const filtered = selectableSantri.filter(item => {
        if (normalizeKelas(item.kelas) !== kelas) return false;
        return true;
    });
    select.innerHTML = '<option value="">Pilih santri</option>' +
        filtered.map(item => formatOption(item.nama, item.id)).join('');
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

function buildRiwayatEntry(fromClass, toClass) {
    return {
        from: fromClass || '-',
        to: toClass || '-',
        date: new Date().toISOString()
    };
}

function applyRiwayatKelas(santri, fromClass, toClass) {
    const history = parseRiwayatKelas(santri.riwayatKelas);
    history.push(buildRiwayatEntry(fromClass, toClass));
    return history;
}

function setManualInputsState(isFinal) {
    const newClassInput = document.getElementById('bulk-new-class');
    const newAbsenInput = document.getElementById('bulk-new-absen');
    if (newClassInput) {
        newClassInput.value = isFinal ? 'Alumni' : '';
        newClassInput.readOnly = isFinal;
    }
    if (newAbsenInput) {
        newAbsenInput.value = isFinal ? '' : '';
        newAbsenInput.readOnly = isFinal;
    }
}

function handleManualSelection() {
    const santriSelect = document.getElementById('bulk-current-santri');
    const selectedId = santriSelect?.value || '';
    currentSelection = selectableSantri.find(item => item.id === selectedId) || null;
    const isFinal = currentSelection ? isFinalClass(currentSelection.kelas) : false;
    setManualInputsState(isFinal);
}

async function submitManualPromotion(e) {
    e.preventDefault();
    updateManualResult('');
    if (!currentSelection) {
        updateManualResult('Pilih santri terlebih dahulu.', 'error');
        return;
    }
    const newClassInput = document.getElementById('bulk-new-class');
    const newAbsenInput = document.getElementById('bulk-new-absen');
    const targetClass = (newClassInput?.value || '').trim();
    const targetAbsen = (newAbsenInput?.value || '').trim();

    const finalClass = isFinalClass(currentSelection.kelas) ? 'Alumni' : targetClass;
    if (!finalClass) {
        updateManualResult('Kelas baru harus diisi.', 'error');
        return;
    }
    const confirmed = confirm(`Konfirmasi naik kelas untuk ${currentSelection.nama}?`);
    if (!confirmed) return;

    const updated = { ...currentSelection };
    updated.kelas = finalClass;
    updated.riwayatKelas = applyRiwayatKelas(currentSelection, currentSelection.kelas, finalClass);
    if (isFinalClass(currentSelection.kelas)) {
        updated.status = 'Alumni';
    }
    if (targetAbsen) {
        const absenVal = Number(targetAbsen);
        if (Number.isFinite(absenVal)) {
            updated.noAbsen = absenVal;
        }
    }

    const saved = await updateSantri(currentSelection.id, updated);
    if (saved) {
        updateManualResult(`Data ${currentSelection.nama} berhasil diperbarui.`);
        await refreshData();
        resetManualForm();
    } else {
        updateManualResult('Gagal memperbarui data santri.', 'error');
    }
}

function resetManualForm() {
    const form = document.getElementById('bulk-manual-form');
    if (form) form.reset();
    const santriSelect = document.getElementById('bulk-current-santri');
    if (santriSelect) santriSelect.innerHTML = '<option value="">Pilih santri</option>';
    setManualInputsState(false);
    currentSelection = null;
}

function parseCsv(text) {
    const rows = [];
    let row = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i += 1) {
        const char = text[i];
        const nextChar = text[i + 1];

        if (char === '\"') {
            if (inQuotes && nextChar === '\"') {
                current += '\"';
                i += 1;
            } else {
                inQuotes = !inQuotes;
            }
            continue;
        }

        if (char === ',' && !inQuotes) {
            row.push(current);
            current = '';
            continue;
        }

        if ((char === '\\n' || char === '\\r') && !inQuotes) {
            if (current !== '' || row.length) {
                row.push(current);
                rows.push(row.map(cell => cell.trim()));
            }
            row = [];
            current = '';
            if (char === '\\r' && nextChar === '\\n') i += 1;
            continue;
        }

        current += char;
    }

    if (current !== '' || row.length) {
        row.push(current);
        rows.push(row.map(cell => cell.trim()));
    }
    return rows.filter(rowItem => rowItem.some(cell => cell.trim() !== ''));
}

function normalizeHeader(value) {
    return normalizeText(value).replace(/[^a-z0-9]+/g, ' ');
}

function resolveCsvIndexes(headers) {
    const indexMap = {};
    headers.forEach((header, index) => {
        const normalized = normalizeHeader(header);
        if (normalized.includes('nama') && normalized.includes('santri')) indexMap.nama = index;
        if (normalized.includes('kelas sebelumnya') || normalized.includes('kelas lama')) indexMap.kelasLama = index;
        if (normalized.includes('absen kelas baru') || normalized.includes('absen baru')) indexMap.absenBaru = index;
        if (normalized.includes('kelas baru')) indexMap.kelasBaru = index;
    });
    return indexMap;
}

async function processCsvMapping() {
    const fileInput = document.getElementById('bulk-csv-file');
    const file = fileInput?.files?.[0];
    if (!file) {
        updateCsvResult('Pilih file CSV terlebih dahulu.', 'error');
        return;
    }
    const text = await file.text();
    const rows = parseCsv(text);
    if (!rows.length) {
        updateCsvResult('File CSV kosong.', 'error');
        return;
    }

    let startIndex = 0;
    let indexes = {};
    if (rows.length) {
        const headerRow = rows[0];
        indexes = resolveCsvIndexes(headerRow);
        if (Object.keys(indexes).length >= 2) {
            startIndex = 1;
        } else {
            indexes = { nama: 0, kelasLama: 1, absenBaru: 2, kelasBaru: 3 };
        }
    }

    const lookup = buildSantriLookup();
    let successCount = 0;
    const errors = [];

    for (let i = startIndex; i < rows.length; i += 1) {
        const row = rows[i];
        const nama = row[indexes.nama] || '';
        const kelasLama = row[indexes.kelasLama] || '';
        const absenBaru = row[indexes.absenBaru] || '';
        const kelasBaru = row[indexes.kelasBaru] || '';

        if (!nama || !kelasLama) {
            errors.push(`Baris ${i + 1}: Nama atau kelas sebelumnya kosong.`);
            continue;
        }

        const key = `${normalizeText(nama)}|${normalizeText(kelasLama)}`;
        const matches = lookup.get(key) || [];
        if (matches.length === 0) {
            errors.push(`Baris ${i + 1}: Santri tidak ditemukan (${nama} - ${kelasLama}).`);
            continue;
        }
        if (matches.length > 1) {
            errors.push(`Baris ${i + 1}: Duplikat santri (${nama} - ${kelasLama}).`);
            continue;
        }
        const santri = matches[0];
        const finalClass = isFinalClass(kelasLama) ? 'Alumni' : kelasBaru;
        if (!finalClass) {
            errors.push(`Baris ${i + 1}: Kelas baru kosong.`);
            continue;
        }

        const updated = { ...santri };
        updated.kelas = finalClass;
        updated.riwayatKelas = applyRiwayatKelas(santri, santri.kelas || kelasLama, finalClass);
        if (isFinalClass(kelasLama)) {
            updated.status = 'Alumni';
        }
        const absenVal = Number(absenBaru);
        if (Number.isFinite(absenVal)) {
            updated.noAbsen = absenVal;
        }

        const saved = await updateSantri(santri.id, updated);
        if (saved) {
            successCount += 1;
        } else {
            errors.push(`Baris ${i + 1}: Gagal update (${nama}).`);
        }
    }

    await refreshData();
    if (errors.length) {
        updateCsvResult(`Selesai: ${successCount} berhasil, ${errors.length} gagal. ${errors.slice(0, 3).join(' | ')}${errors.length > 3 ? ' ...' : ''}`, 'error');
    } else {
        updateCsvResult(`Semua data berhasil diproses (${successCount} baris).`);
    }
}

async function refreshData() {
    santriData = await getAllSantri();
    selectableSantri = santriData.filter(item => normalizeText(item.status) !== 'alumni');
    populateClassOptions();
}

function setupManualHandlers() {
    const classSelect = document.getElementById('bulk-current-class');
    const santriSelect = document.getElementById('bulk-current-santri');
    const form = document.getElementById('bulk-manual-form');
    const resetBtn = document.getElementById('bulk-manual-reset');

    if (classSelect) {
        classSelect.addEventListener('change', () => {
            const kelas = normalizeKelas(classSelect.value);
            populateSantriOptions(kelas);
            currentSelection = null;
            setManualInputsState(false);
        });
    }

    if (santriSelect) {
        santriSelect.addEventListener('change', handleManualSelection);
    }

    if (form) {
        form.addEventListener('submit', submitManualPromotion);
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            resetManualForm();
            updateManualResult('');
        });
    }
}

function setupCsvHandlers() {
    const uploadArea = document.getElementById('bulk-upload-area');
    const fileInput = document.getElementById('bulk-csv-file');
    const fileInfo = document.getElementById('bulk-file-info');
    const fileName = document.getElementById('bulk-file-name');
    const fileSize = document.getElementById('bulk-file-size');
    const processBtn = document.getElementById('bulk-csv-process');
    const clearBtn = document.getElementById('bulk-csv-clear');

    const showFileInfo = (file) => {
        if (!fileInfo || !fileName || !fileSize) return;
        fileName.textContent = file.name;
        fileSize.textContent = `${Math.round(file.size / 1024)} KB`;
        fileInfo.style.display = 'block';
    };

    if (uploadArea && fileInput) {
        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('drag-over');
        });
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            if (e.dataTransfer.files.length) {
                fileInput.files = e.dataTransfer.files;
                showFileInfo(e.dataTransfer.files[0]);
            }
        });
        fileInput.addEventListener('change', () => {
            if (fileInput.files.length) {
                showFileInfo(fileInput.files[0]);
            }
        });
    }

    if (processBtn) {
        processBtn.addEventListener('click', async () => {
            updateCsvResult('');
            await processCsvMapping();
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (fileInput) fileInput.value = '';
            if (fileInfo) fileInfo.style.display = 'none';
            updateCsvResult('');
        });
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const role = await requireAuth(['admin']);
    if (!role) return;
    await refreshData();
    setupManualHandlers();
    setupCsvHandlers();
});
