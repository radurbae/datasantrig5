async function waitForSupabaseClient(retries = 30) {
    if (typeof window === 'undefined') return null;
    if (window.supabaseClient) return window.supabaseClient;
    if (retries <= 0) return null;
    await new Promise(resolve => setTimeout(resolve, 100));
    return waitForSupabaseClient(retries - 1);
}

async function getSession() {
    const client = await waitForSupabaseClient();
    if (!client) return null;
    const { data } = await client.auth.getSession();
    return data?.session || null;
}

async function getUserProfile(userId) {
    const client = await waitForSupabaseClient();
    if (!client) return { role: 'user', waliKelas: '' };
    const { data, error } = await client
        .from('profiles')
        .select('role, wali_kelas')
        .eq('id', userId)
        .single();
    if (error) {
        console.warn('Role tidak ditemukan, fallback ke user:', error.message);
        return { role: 'user', waliKelas: '' };
    }
    return {
        role: data?.role || 'user',
        waliKelas: data?.wali_kelas || ''
    };
}

function applyRoleUI(role, waliKelas) {
    const isAdmin = role === 'admin';
    const isWali = role === 'wali_kelas';
    document.querySelectorAll('[data-admin-only]').forEach(el => {
        el.style.display = isAdmin ? '' : 'none';
    });
    if (isWali) {
        const restricted = ['overview.html', 'form.html', 'master.html', 'master-prestasi.html', 'master-catatan.html', 'bulk-naik-kelas.html'];
        document.querySelectorAll('.sidebar-nav a').forEach(link => {
            const href = link.getAttribute('href') || '';
            if (restricted.includes(href)) {
                link.style.display = 'none';
            }
        });
    }
    const roleLabel = document.querySelector('[data-role-label]');
    if (roleLabel) {
        if (isWali && waliKelas) {
            roleLabel.textContent = `Role: wali kelas ${waliKelas}`;
        } else {
            roleLabel.textContent = role ? `Role: ${role}` : '';
        }
    }
}

function setupSidebarToggle() {
    const toggleBtn = document.querySelector('.sidebar-toggle');
    const shell = document.querySelector('.app-shell');
    if (!toggleBtn || !shell) return;
    toggleBtn.addEventListener('click', () => {
        shell.classList.toggle('sidebar-collapsed');
    });
}

async function setupLogoutLink() {
    const logoutLink = document.querySelector('[data-logout]');
    if (!logoutLink) return;
    logoutLink.addEventListener('click', async (e) => {
        e.preventDefault();
        const client = await waitForSupabaseClient();
        if (client) {
            await client.auth.signOut();
        }
        window.location.href = 'login.html';
    });
}

async function requireAuth(allowedRoles) {
    const session = await getSession();
    if (!session) {
        window.location.href = 'login.html';
        return null;
    }
    const profile = await getUserProfile(session.user.id);
    const role = profile.role;
    window.currentUserRole = role;
    window.currentUserKelas = profile.waliKelas;
    applyRoleUI(role, profile.waliKelas);
    setupSidebarToggle();
    await setupLogoutLink();
    if (Array.isArray(allowedRoles) && !allowedRoles.includes(role)) {
        window.location.href = 'list.html';
        return null;
    }
    return role;
}
