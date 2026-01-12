// Database Service Layer - Supabase Operations
// File ini menangani semua operasi database untuk data santri

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

async function getRaportMentalByMonth(monthDate) {
    try {
        const client = getSupabaseClient();
        if (!client) return [];
        const { data, error } = await client
            .from('raport_mental')
            .select('*')
            .eq('month', monthDate);
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
            .upsert(payload, { onConflict: 'santri_id,month' })
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
 * Get all santri data from Supabase
 * @returns {Promise<Array>} Array of santri data (converted to camelCase)
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
        
        // Convert from Supabase format (snake_case) to app format (camelCase)
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
 * Get single santri by ID
 * @param {string} id - Santri ID
 * @returns {Promise<Object|null>} Santri data (converted to camelCase) or null
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
        
        // Convert from Supabase format to app format
        return convertFromSupabase(data);
    } catch (error) {
        console.error('Error in getSantriById:', error);
        return null;
    }
}

/**
 * Insert new santri data
 * @param {Object} santriData - Santri data object (camelCase)
 * @returns {Promise<Object|null>} Created santri data (camelCase) or null
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
        
        // Prepare data for Supabase (map camelCase to snake_case)
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
            konsulat: santriData.konsulat || null
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
        
        // Convert back to camelCase format
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
 * Update existing santri data
 * @param {string} id - Santri ID
 * @param {Object} santriData - Updated santri data (camelCase)
 * @returns {Promise<Object|null>} Updated santri data (camelCase) or null
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
        
        // Prepare data for Supabase (map camelCase to snake_case)
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
        
        // Convert back to camelCase format
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
 * Delete santri by ID
 * @param {string} id - Santri ID
 * @returns {Promise<boolean>} Success status
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

// Prestasi Santri
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

// Catatan Santri
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

/**
 * Convert Supabase data (snake_case) to app format (camelCase)
 * @param {Object} supabaseData - Data from Supabase
 * @returns {Object} Converted data
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
        createdAt: supabaseData.created_at,
        updatedAt: supabaseData.updated_at
    };
}

/**
 * Convert array of Supabase data to app format
 * @param {Array} supabaseDataArray - Array of data from Supabase
 * @returns {Array} Array of converted data
 */
function convertArrayFromSupabase(supabaseDataArray) {
    if (!Array.isArray(supabaseDataArray)) return [];
    return supabaseDataArray.map(convertFromSupabase).filter(item => item !== null);
}

// Helper function for notifications (fallback if not defined)
if (typeof showNotification === 'undefined') {
    window.showNotification = function(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);
        alert(message);
    };
}
