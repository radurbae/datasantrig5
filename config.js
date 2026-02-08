// Konfigurasi Supabase
// Ganti pakai URL dan API key project Supabase kamu
// Ambil di: https://app.supabase.com/project/YOUR_PROJECT/settings/api

// Konfigurasi runtime Supabase. Coba pakai env.js (window.__SUPABASE_URL/ANON_KEY),
// kalau gak ada, pakai nilai default project biar halaman tetap jalan.
const FALLBACK_SUPABASE_URL = 'https://gxscphibhxovimjeljlm.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4c2NwaGliaHhvdmltamVsamxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5OTg1MjcsImV4cCI6MjA4MzU3NDUyN30.d5_CtN4YZjg30Tpp80Nz-7SuHHpcY3rk5pNzDvNij-Y';

const SUPABASE_CONFIG = {
    url: typeof window !== 'undefined' && window.__SUPABASE_URL ? window.__SUPABASE_URL : FALLBACK_SUPABASE_URL,
    anonKey: typeof window !== 'undefined' && window.__SUPABASE_ANON_KEY ? window.__SUPABASE_ANON_KEY : FALLBACK_SUPABASE_ANON_KEY
};

function isConfigAvailable() {
    return Boolean(SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey);
}

// Nama tabel
const TABLE_NAME = 'santri';

// Biar konfigurasi bisa dipakai skrip lain lewat global
if (typeof window !== 'undefined') {
    window.SUPABASE_CONFIG = SUPABASE_CONFIG;
    window.TABLE_NAME = TABLE_NAME;
}

// Klien Supabase di-init setelah library kebaca
// Wajib pasang: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
let supabaseClient = null;

// Inisialisasi klien Supabase
function initSupabase() {
    // Cek library Supabase udah kebaca belum
    if (typeof window.supabase === 'undefined') {
        console.error('Supabase client library not loaded! Make sure to include the Supabase JS library.');
        return null;
    }
    
    // Cek konfigurasi udah keisi belum
    if (!isConfigAvailable()) {
        console.error('Supabase tidak dikonfigurasi.');
        return null;
    }
    
    // Inisialisasi klien Supabase
    // Library Supabase bikin variabel global bernama supabase
    // Kita pakai window.supabase.createClient buat bikin klien
    try {
        supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        window.supabaseClient = supabaseClient;
        console.log('Supabase initialized successfully');
        return supabaseClient;
    } catch (error) {
        console.error('Error initializing Supabase:', error);
        return null;
    }
}

// Inisialisasi pas halaman dibuka
if (typeof document !== 'undefined') {
    // Tunggu library Supabase kebaca
    function tryInit() {
        if (typeof window.supabase !== 'undefined') {
            initSupabase();
        } else {
            // Coba lagi sebentar
            setTimeout(tryInit, 100);
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', tryInit);
    } else {
        tryInit();
    }
}
