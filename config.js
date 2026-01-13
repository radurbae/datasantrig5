// Supabase Configuration
// Ganti dengan URL dan API Key dari project Supabase Anda
// Dapatkan dari: https://app.supabase.com/project/YOUR_PROJECT/settings/api

// Supabase runtime config. Akan mencoba pakai env.js (window.__SUPABASE_URL/ANON_KEY),
// jika tidak ada, fallback ke nilai default project agar halaman tetap berjalan.
const FALLBACK_SUPABASE_URL = 'https://gxscphibhxovimjeljlm.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4c2NwaGliaHhvdmltamVsamxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5OTg1MjcsImV4cCI6MjA4MzU3NDUyN30.d5_CtN4YZjg30Tpp80Nz-7SuHHpcY3rk5pNzDvNij-Y';

const SUPABASE_CONFIG = {
    url: typeof window !== 'undefined' && window.__SUPABASE_URL ? window.__SUPABASE_URL : FALLBACK_SUPABASE_URL,
    anonKey: typeof window !== 'undefined' && window.__SUPABASE_ANON_KEY ? window.__SUPABASE_ANON_KEY : FALLBACK_SUPABASE_ANON_KEY
};

function isConfigAvailable() {
    return Boolean(SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey);
}

// Table name
const TABLE_NAME = 'santri';

// Expose config to global scope for other scripts
if (typeof window !== 'undefined') {
    window.SUPABASE_CONFIG = SUPABASE_CONFIG;
    window.TABLE_NAME = TABLE_NAME;
}

// Supabase client will be initialized after library loads
// Make sure to include: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
let supabaseClient = null;

// Initialize Supabase client
function initSupabase() {
    // Check if Supabase library is loaded
    if (typeof window.supabase === 'undefined') {
        console.error('Supabase client library not loaded! Make sure to include the Supabase JS library.');
        return null;
    }
    
    // Check if configuration is set
    if (!isConfigAvailable()) {
        console.error('Supabase tidak dikonfigurasi.');
        return null;
    }
    
    // Initialize Supabase client
    // Supabase JS library creates supabase as a global variable
    // We use window.supabase.createClient to create the client
    try {
        supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        window.supabaseClient = supabaseClient;
        console.log('✅ Supabase initialized successfully');
        return supabaseClient;
    } catch (error) {
        console.error('Error initializing Supabase:', error);
        return null;
    }
}

// Initialize on page load
if (typeof document !== 'undefined') {
    // Wait for Supabase library to load
    function tryInit() {
        if (typeof window.supabase !== 'undefined') {
            initSupabase();
        } else {
            // Retry after a short delay
            setTimeout(tryInit, 100);
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', tryInit);
    } else {
        tryInit();
    }
}
