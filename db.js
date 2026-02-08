// Lapisan layanan basis data buat operasi Supabase
// File ini ngurus semua operasi basis data santri

const DEFAULT_TABLE_NAME = 'santri';

function getTableName() {
    if (typeof window !== 'undefined' && window.TABLE_NAME) {
        return window.TABLE_NAME;
    }
    console.warn('TABLE_NAME tidak ditemukan, memakai default:', DEFAULT_TABLE_NAME);
    return DEFAULT_TABLE_NAME;
}

function getSupabaseClient() {
    if (typeof window !== 'undefined' && window.supabaseClient) {
        return window.supabaseClient;
    }
    console.error('Supabase client belum terinisialisasi');
    return null;
}

async function getRaportMentalByMonth(monthDate, weekNumber) {
    try {
        const client = getSupabaseClient();
        if (!client) return [];
        let query = client
            .from('raport_mental')
            .select('*')
            .eq('month', monthDate);
        if (Number.isFinite(weekNumber)) {
            query = query.eq('week', weekNumber);
        }
        const { data, error } = await query;
        if (error) {
            console.error('Error fetching raport mental:', error);
            return [];
        }
        return data || [];
    } catch (error) {
        console.error('Error in getRaportMentalByMonth:', error);
        return [];
    }
}

async function upsertRaportMental(payload) {
    try {
        const client = getSupabaseClient();
        if (!client) return null;
        const { data, error } = await client
            .from('raport_mental')
            .upsert(payload, { onConflict: 'santri_id,month,week' })
            .select()
            .single();
        if (error) {
            console.error('Error saving raport mental:', error);
            if (typeof showNotification !== 'undefined') {
                showNotification('Error menyimpan raport: ' + error.message, 'error');
            }
            return null;
        }
        return data;
    } catch (error) {
        console.error('Error in upsertRaportMental:', error);
        return null;
    }
}

/**
 * Ambil semua data santri dari Supabase
 * @returns {Promise<Array>} Daftar data santri (udah jadi camelCase)
 */
async function getAllSantri() {
    try {
        const client = getSupabaseClient();
        if (!client) return [];

        const tableName = getTableName();
        if (!tableName) return [];
        
        const { data, error } = await client
            .from(tableName)
            .select('*')
            .order('kelas', { ascending: true })
            .order('nama', { ascending: true });
        
        if (error) {
            console.error('Error fetching data:', error);
            if (typeof showNotification !== 'undefined') {
                showNotification('Error memuat data: ' + error.message, 'error');
            }
            return [];
        }
        
        // Ubah dari format Supabase (snake_case) ke format aplikasi (camelCase)
        return convertArrayFromSupabase(data || []);
    } catch (error) {
        console.error('Error in getAllSantri:', error);
        if (typeof showNotification !== 'undefined') {
            showNotification('Error memuat data: ' + error.message, 'error');
        }
        return [];
    }
}

/**
 * Ambil satu data santri dari ID
 * @param {string} id - ID santri
 * @returns {Promise<Object|null>} Data santri (udah jadi camelCase) atau null
 */
async function getSantriById(id) {
    try {
        const client = getSupabaseClient();
        if (!client) return null;

        const tableName = getTableName();
        if (!tableName) return null;
        
        const { data, error } = await client
            .from(tableName)
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) {
            console.error('Error fetching santri:', error);
            return null;
        }
        
        // Ubah dari format Supabase ke format aplikasi
        return convertFromSupabase(data);
    } catch (error) {
        console.error('Error in getSantriById:', error);
        return null;
    }
}

/**
 * Tambah data santri baru
 * @param {Object} santriData - Objek data santri (camelCase)
 * @returns {Promise<Object|null>} Data santri yang kebuat (camelCase) atau null
 */
async function insertSantri(santriData) {
    try {
        const client = getSupabaseClient();
        if (!client) {
            if (typeof showNotification !== 'undefined') {
                showNotification('Error: Supabase belum dikonfigurasi', 'error');
            }
            return null;
        }

        const tableName = getTableName();
        if (!tableName) {
            if (typeof showNotification !== 'undefined') {
                showNotification('Error: TABLE_NAME tidak ditemukan', 'error');
            }
            return null;
        }
        
        // Siapin data buat Supabase (map camelCase ke snake_case)
        const dataToInsert = {
            nomor_stambuk: santriData.nomorStambuk || null,
            nama: santriData.nama || null,
            ayah: santriData.ayah || null,
            tempat_lahir: santriData.tempatLahir || null,
            tanggal_lahir: santriData.tanggalLahir || null,
            daerah: santriData.daerah || null,
            status: santriData.status || null,
            kelas: santriData.kelas || null,
            no_absen: santriData.noAbsen || null,
            asrama: santriData.asrama || null,
            konsulat: santriData.konsulat || null,
            riwayat_kelas: santriData.riwayatKelas || null
        };
        
        const { data, error } = await client
            .from(tableName)
            .insert([dataToInsert])
            .select()
            .single();
        
        if (error) {
            console.error('Error inserting data:', error);
            if (typeof showNotification !== 'undefined') {
                showNotification('Error menyimpan data: ' + error.message, 'error');
            }
            return null;
        }
        
        // Balikin lagi ke format camelCase
        return convertFromSupabase(data);
    } catch (error) {
        console.error('Error in insertSantri:', error);
        if (typeof showNotification !== 'undefined') {
            showNotification('Error menyimpan data: ' + error.message, 'error');
        }
        return null;
    }
}

/**
 * Update data santri yang udah ada
 * @param {string} id - ID santri
 * @param {Object} santriData - Data santri yang diupdate (camelCase)
 * @returns {Promise<Object|null>} Data santri yang ke-update (camelCase) atau null
 */
async function updateSantri(id, santriData) {
    try {
        const client = getSupabaseClient();
        if (!client) {
            if (typeof showNotification !== 'undefined') {
                showNotification('Error: Supabase belum dikonfigurasi', 'error');
            }
            return null;
        }

        const tableName = getTableName();
        if (!tableName) {
            if (typeof showNotification !== 'undefined') {
                showNotification('Error: TABLE_NAME tidak ditemukan', 'error');
            }
            return null;
        }
        
        // Siapin data buat Supabase (map camelCase ke snake_case)
        const dataToUpdate = {
            nomor_stambuk: santriData.nomorStambuk || null,
            nama: santriData.nama || null,
            ayah: santriData.ayah || null,
            tempat_lahir: santriData.tempatLahir || null,
            tanggal_lahir: santriData.tanggalLahir || null,
            daerah: santriData.daerah || null,
            status: santriData.status || null,
            kelas: santriData.kelas || null,
            no_absen: santriData.noAbsen || null,
            asrama: santriData.asrama || null,
            konsulat: santriData.konsulat || null,
            updated_at: new Date().toISOString()
        };

        if (Object.prototype.hasOwnProperty.call(santriData, 'riwayatKelas')) {
            dataToUpdate.riwayat_kelas = santriData.riwayatKelas;
        }
        
        const { data, error } = await client
            .from(tableName)
            .update(dataToUpdate)
            .eq('id', id)
            .select()
            .single();
        
        if (error) {
            console.error('Error updating data:', error);
            if (typeof showNotification !== 'undefined') {
                showNotification('Error mengupdate data: ' + error.message, 'error');
            }
            return null;
        }
        
        // Balikin lagi ke format camelCase
        return convertFromSupabase(data);
    } catch (error) {
        console.error('Error in updateSantri:', error);
        if (typeof showNotification !== 'undefined') {
            showNotification('Error mengupdate data: ' + error.message, 'error');
        }
        return null;
    }
}

/**
 * Hapus data santri dari ID
 * @param {string} id - ID santri
 * @returns {Promise<boolean>} Status berhasil atau nggak
 */
async function deleteSantriById(id) {
    try {
        const client = getSupabaseClient();
        if (!client) {
            if (typeof showNotification !== 'undefined') {
                showNotification('Error: Supabase belum dikonfigurasi', 'error');
            }
            return false;
        }

        const tableName = getTableName();
        if (!tableName) {
            if (typeof showNotification !== 'undefined') {
                showNotification('Error: TABLE_NAME tidak ditemukan', 'error');
            }
            return false;
        }
        
        const { error } = await client
            .from(tableName)
            .delete()
            .eq('id', id);
        
        if (error) {
            console.error('Error deleting data:', error);
            if (typeof showNotification !== 'undefined') {
                showNotification('Error menghapus data: ' + error.message, 'error');
            }
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Error in deleteSantriById:', error);
        if (typeof showNotification !== 'undefined') {
            showNotification('Error menghapus data: ' + error.message, 'error');
        }
        return false;
    }
}

// Data prestasi santri
async function getPrestasi() {
    try {
        const client = getSupabaseClient();
        if (!client) return [];
        const { data, error } = await client
            .from('prestasi_santri')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) {
            console.error('Error fetching prestasi:', error);
            return [];
        }
        return data || [];
    } catch (error) {
        console.error('Error in getPrestasi:', error);
        return [];
    }
}

async function insertPrestasi(payload) {
    try {
        const client = getSupabaseClient();
        if (!client) return null;
        const { data, error } = await client
            .from('prestasi_santri')
            .insert([payload])
            .select()
            .single();
        if (error) {
            console.error('Error inserting prestasi:', error);
            return null;
        }
        return data;
    } catch (error) {
        console.error('Error in insertPrestasi:', error);
        return null;
    }
}

async function updatePrestasi(id, payload) {
    try {
        const client = getSupabaseClient();
        if (!client) return null;
        const { data, error } = await client
            .from('prestasi_santri')
            .update(payload)
            .eq('id', id)
            .select()
            .single();
        if (error) {
            console.error('Error updating prestasi:', error);
            return null;
        }
        return data;
    } catch (error) {
        console.error('Error in updatePrestasi:', error);
        return null;
    }
}

async function deletePrestasi(id) {
    try {
        const client = getSupabaseClient();
        if (!client) return false;
        const { error } = await client
            .from('prestasi_santri')
            .delete()
            .eq('id', id);
        if (error) {
            console.error('Error deleting prestasi:', error);
            return false;
        }
        return true;
    } catch (error) {
        console.error('Error in deletePrestasi:', error);
        return false;
    }
}

// Data catatan santri
async function getCatatan() {
    try {
        const client = getSupabaseClient();
        if (!client) return [];
        const { data, error } = await client
            .from('catatan_santri')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) {
            console.error('Error fetching catatan:', error);
            return [];
        }
        return data || [];
    } catch (error) {
        console.error('Error in getCatatan:', error);
        return [];
    }
}

async function insertCatatan(payload) {
    try {
        const client = getSupabaseClient();
        if (!client) return null;
        const { data, error } = await client
            .from('catatan_santri')
            .insert([payload])
            .select()
            .single();
        if (error) {
            console.error('Error inserting catatan:', error);
            return null;
        }
        return data;
    } catch (error) {
        console.error('Error in insertCatatan:', error);
        return null;
    }
}

async function updateCatatan(id, payload) {
    try {
        const client = getSupabaseClient();
        if (!client) return null;
        const { data, error } = await client
            .from('catatan_santri')
            .update(payload)
            .eq('id', id)
            .select()
            .single();
        if (error) {
            console.error('Error updating catatan:', error);
            return null;
        }
        return data;
    } catch (error) {
        console.error('Error in updateCatatan:', error);
        return null;
    }
}

async function deleteCatatan(id) {
    try {
        const client = getSupabaseClient();
        if (!client) return false;
        const { error } = await client
            .from('catatan_santri')
            .delete()
            .eq('id', id);
        if (error) {
            console.error('Error deleting catatan:', error);
            return false;
        }
        return true;
    } catch (error) {
        console.error('Error in deleteCatatan:', error);
        return false;
    }
}

async function getCatatanCategories() {
    try {
        const client = getSupabaseClient();
        if (!client) return [];
        const { data, error } = await client
            .from('catatan_categories')
            .select('*')
            .order('name', { ascending: true });
        if (error) {
            console.error('Error fetching catatan categories:', error);
            return [];
        }
        return data || [];
    } catch (error) {
        console.error('Error in getCatatanCategories:', error);
        return [];
    }
}

async function insertCatatanCategory(payload) {
    try {
        const client = getSupabaseClient();
        if (!client) return null;
        const { data, error } = await client
            .from('catatan_categories')
            .insert([payload])
            .select()
            .single();
        if (error) {
            console.error('Error inserting catatan category:', error);
            return null;
        }
        return data;
    } catch (error) {
        console.error('Error in insertCatatanCategory:', error);
        return null;
    }
}

async function updateCatatanCategory(id, payload) {
    try {
        const client = getSupabaseClient();
        if (!client) return null;
        const { data, error } = await client
            .from('catatan_categories')
            .update(payload)
            .eq('id', id)
            .select()
            .single();
        if (error) {
            console.error('Error updating catatan category:', error);
            return null;
        }
        return data;
    } catch (error) {
        console.error('Error in updateCatatanCategory:', error);
        return null;
    }
}

async function deleteCatatanCategory(id) {
    try {
        const client = getSupabaseClient();
        if (!client) return false;
        const { error } = await client
            .from('catatan_categories')
            .delete()
            .eq('id', id);
        if (error) {
            console.error('Error deleting catatan category:', error);
            return false;
        }
        return true;
    } catch (error) {
        console.error('Error in deleteCatatanCategory:', error);
        return false;
    }
}

async function getCatatanSubcategories() {
    try {
        const client = getSupabaseClient();
        if (!client) return [];
        const { data, error } = await client
            .from('catatan_subcategories')
            .select('*')
            .order('group_name', { ascending: true })
            .order('name', { ascending: true });
        if (error) {
            console.error('Error fetching catatan subcategories:', error);
            return [];
        }
        return data || [];
    } catch (error) {
        console.error('Error in getCatatanSubcategories:', error);
        return [];
    }
}

async function insertCatatanSubcategory(payload) {
    try {
        const client = getSupabaseClient();
        if (!client) return null;
        const { data, error } = await client
            .from('catatan_subcategories')
            .insert([payload])
            .select()
            .single();
        if (error) {
            console.error('Error inserting catatan subcategory:', error);
            return null;
        }
        return data;
    } catch (error) {
        console.error('Error in insertCatatanSubcategory:', error);
        return null;
    }
}

async function updateCatatanSubcategory(id, payload) {
    try {
        const client = getSupabaseClient();
        if (!client) return null;
        const { data, error } = await client
            .from('catatan_subcategories')
            .update(payload)
            .eq('id', id)
            .select()
            .single();
        if (error) {
            console.error('Error updating catatan subcategory:', error);
            return null;
        }
        return data;
    } catch (error) {
        console.error('Error in updateCatatanSubcategory:', error);
        return null;
    }
}

async function deleteCatatanSubcategory(id) {
    try {
        const client = getSupabaseClient();
        if (!client) return false;
        const { error } = await client
            .from('catatan_subcategories')
            .delete()
            .eq('id', id);
        if (error) {
            console.error('Error deleting catatan subcategory:', error);
            return false;
        }
        return true;
    } catch (error) {
        console.error('Error in deleteCatatanSubcategory:', error);
        return false;
    }
}

async function getCatatanKeteranganOptions() {
    try {
        const client = getSupabaseClient();
        if (!client) return [];
        const { data, error } = await client
            .from('catatan_keterangan_options')
            .select('*')
            .order('label', { ascending: true });
        if (error) {
            console.error('Error fetching catatan keterangan options:', error);
            return [];
        }
        return data || [];
    } catch (error) {
        console.error('Error in getCatatanKeteranganOptions:', error);
        return [];
    }
}

async function insertCatatanKeteranganOption(payload) {
    try {
        const client = getSupabaseClient();
        if (!client) return null;
        const { data, error } = await client
            .from('catatan_keterangan_options')
            .insert([payload])
            .select()
            .single();
        if (error) {
            console.error('Error inserting catatan keterangan option:', error);
            return null;
        }
        return data;
    } catch (error) {
        console.error('Error in insertCatatanKeteranganOption:', error);
        return null;
    }
}

async function updateCatatanKeteranganOption(id, payload) {
    try {
        const client = getSupabaseClient();
        if (!client) return null;
        const { data, error } = await client
            .from('catatan_keterangan_options')
            .update(payload)
            .eq('id', id)
            .select()
            .single();
        if (error) {
            console.error('Error updating catatan keterangan option:', error);
            return null;
        }
        return data;
    } catch (error) {
        console.error('Error in updateCatatanKeteranganOption:', error);
        return null;
    }
}

async function deleteCatatanKeteranganOption(id) {
    try {
        const client = getSupabaseClient();
        if (!client) return false;
        const { error } = await client
            .from('catatan_keterangan_options')
            .delete()
            .eq('id', id);
        if (error) {
            console.error('Error deleting catatan keterangan option:', error);
            return false;
        }
        return true;
    } catch (error) {
        console.error('Error in deleteCatatanKeteranganOption:', error);
        return false;
    }
}

async function getPrestasiCategories() {
    try {
        const client = getSupabaseClient();
        if (!client) return [];
        const { data, error } = await client
            .from('prestasi_categories')
            .select('*')
            .order('name', { ascending: true });
        if (error) {
            console.error('Error fetching prestasi categories:', error);
            return [];
        }
        return data || [];
    } catch (error) {
        console.error('Error in getPrestasiCategories:', error);
        return [];
    }
}

async function insertPrestasiCategory(payload) {
    try {
        const client = getSupabaseClient();
        if (!client) return null;
        const { data, error } = await client
            .from('prestasi_categories')
            .insert([payload])
            .select()
            .single();
        if (error) {
            console.error('Error inserting prestasi category:', error);
            return null;
        }
        return data;
    } catch (error) {
        console.error('Error in insertPrestasiCategory:', error);
        return null;
    }
}

async function updatePrestasiCategory(id, payload) {
    try {
        const client = getSupabaseClient();
        if (!client) return null;
        const { data, error } = await client
            .from('prestasi_categories')
            .update(payload)
            .eq('id', id)
            .select()
            .single();
        if (error) {
            console.error('Error updating prestasi category:', error);
            return null;
        }
        return data;
    } catch (error) {
        console.error('Error in updatePrestasiCategory:', error);
        return null;
    }
}

async function deletePrestasiCategory(id) {
    try {
        const client = getSupabaseClient();
        if (!client) return false;
        const { error } = await client
            .from('prestasi_categories')
            .delete()
            .eq('id', id);
        if (error) {
            console.error('Error deleting prestasi category:', error);
            return false;
        }
        return true;
    } catch (error) {
        console.error('Error in deletePrestasiCategory:', error);
        return false;
    }
}

async function getPrestasiKeteranganOptions() {
    try {
        const client = getSupabaseClient();
        if (!client) return [];
        const { data, error } = await client
            .from('prestasi_keterangan_options')
            .select('*')
            .order('label', { ascending: true });
        if (error) {
            console.error('Error fetching prestasi keterangan options:', error);
            return [];
        }
        return data || [];
    } catch (error) {
        console.error('Error in getPrestasiKeteranganOptions:', error);
        return [];
    }
}

async function getPrestasiKegiatanOptions() {
    try {
        const client = getSupabaseClient();
        if (!client) return [];
        const { data, error } = await client
            .from('prestasi_kegiatan_options')
            .select('*')
            .order('label', { ascending: true });
        if (error) {
            console.error('Error fetching prestasi kegiatan options:', error);
            return [];
        }
        return data || [];
    } catch (error) {
        console.error('Error in getPrestasiKegiatanOptions:', error);
        return [];
    }
}

async function insertPrestasiKegiatanOption(payload) {
    try {
        const client = getSupabaseClient();
        if (!client) return null;
        const { data, error } = await client
            .from('prestasi_kegiatan_options')
            .insert([payload])
            .select()
            .single();
        if (error) {
            console.error('Error inserting prestasi kegiatan option:', error);
            return null;
        }
        return data;
    } catch (error) {
        console.error('Error in insertPrestasiKegiatanOption:', error);
        return null;
    }
}

async function updatePrestasiKegiatanOption(id, payload) {
    try {
        const client = getSupabaseClient();
        if (!client) return null;
        const { data, error } = await client
            .from('prestasi_kegiatan_options')
            .update(payload)
            .eq('id', id)
            .select()
            .single();
        if (error) {
            console.error('Error updating prestasi kegiatan option:', error);
            return null;
        }
        return data;
    } catch (error) {
        console.error('Error in updatePrestasiKegiatanOption:', error);
        return null;
    }
}

async function deletePrestasiKegiatanOption(id) {
    try {
        const client = getSupabaseClient();
        if (!client) return false;
        const { error } = await client
            .from('prestasi_kegiatan_options')
            .delete()
            .eq('id', id);
        if (error) {
            console.error('Error deleting prestasi kegiatan option:', error);
            return false;
        }
        return true;
    } catch (error) {
        console.error('Error in deletePrestasiKegiatanOption:', error);
        return false;
    }
}

async function insertPrestasiKeteranganOption(payload) {
    try {
        const client = getSupabaseClient();
        if (!client) return null;
        const { data, error } = await client
            .from('prestasi_keterangan_options')
            .insert([payload])
            .select()
            .single();
        if (error) {
            console.error('Error inserting prestasi keterangan option:', error);
            return null;
        }
        return data;
    } catch (error) {
        console.error('Error in insertPrestasiKeteranganOption:', error);
        return null;
    }
}

async function updatePrestasiKeteranganOption(id, payload) {
    try {
        const client = getSupabaseClient();
        if (!client) return null;
        const { data, error } = await client
            .from('prestasi_keterangan_options')
            .update(payload)
            .eq('id', id)
            .select()
            .single();
        if (error) {
            console.error('Error updating prestasi keterangan option:', error);
            return null;
        }
        return data;
    } catch (error) {
        console.error('Error in updatePrestasiKeteranganOption:', error);
        return null;
    }
}

async function deletePrestasiKeteranganOption(id) {
    try {
        const client = getSupabaseClient();
        if (!client) return false;
        const { error } = await client
            .from('prestasi_keterangan_options')
            .delete()
            .eq('id', id);
        if (error) {
            console.error('Error deleting prestasi keterangan option:', error);
            return false;
        }
        return true;
    } catch (error) {
        console.error('Error in deletePrestasiKeteranganOption:', error);
        return false;
    }
}

/**
 * Ubah data Supabase (snake_case) ke format aplikasi (camelCase)
 * @param {Object} supabaseData - Data dari Supabase
 * @returns {Object} Data hasil konversi
 */
function convertFromSupabase(supabaseData) {
    if (!supabaseData) return null;
    
    return {
        id: supabaseData.id,
        nomorStambuk: supabaseData.nomor_stambuk,
        nama: supabaseData.nama,
        ayah: supabaseData.ayah,
        tempatLahir: supabaseData.tempat_lahir,
        tanggalLahir: supabaseData.tanggal_lahir,
        daerah: supabaseData.daerah,
        status: supabaseData.status,
        kelas: supabaseData.kelas,
        noAbsen: supabaseData.no_absen,
        asrama: supabaseData.asrama,
        konsulat: supabaseData.konsulat,
        riwayatKelas: supabaseData.riwayat_kelas,
        createdAt: supabaseData.created_at,
        updatedAt: supabaseData.updated_at
    };
}

/**
 * Ubah array data Supabase ke format aplikasi
 * @param {Array} supabaseDataArray - Daftar data dari Supabase
 * @returns {Array} Daftar data hasil konversi
 */
function convertArrayFromSupabase(supabaseDataArray) {
    if (!Array.isArray(supabaseDataArray)) return [];
    return supabaseDataArray.map(convertFromSupabase).filter(item => item !== null);
}

// Fungsi helper buat notifikasi (cadangan kalau belum ada)
if (typeof showNotification === 'undefined') {
    window.showNotification = function(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);
        alert(message);
    };
}
