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

async function getUserRole(userId) {
    const client = await waitForSupabaseClient();
    if (!client) return 'user';
    const { data, error } = await client
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
    if (error) {
        console.warn('Role tidak ditemukan, fallback ke user:', error.message);
        return 'user';
    }
    return data?.role || 'user';
}

function applyRoleUI(role) {
    const isAdmin = role === 'admin';
    document.querySelectorAll('[data-admin-only]').forEach(el => {
        el.style.display = isAdmin ? '' : 'none';
    });
    const roleLabel = document.querySelector('[data-role-label]');
    if (roleLabel) {
        roleLabel.textContent = role ? `Role: ${role}` : '';
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
    const role = await getUserRole(session.user.id);
    window.currentUserRole = role;
    applyRoleUI(role);
    setupSidebarToggle();
    await setupLogoutLink();
    if (Array.isArray(allowedRoles) && !allowedRoles.includes(role)) {
        window.location.href = 'list.html';
        return null;
    }
    return role;
}
