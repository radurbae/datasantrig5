document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('login-form');
    const errorBox = document.getElementById('login-error');

    const session = await getSession();
    if (session) {
        window.location.href = 'overview.html';
        return;
    }

    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (errorBox) {
            errorBox.textContent = '';
            errorBox.style.display = 'none';
        }

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const submitBtn = document.getElementById('login-submit');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Masuk...';

        try {
            const client = await waitForSupabaseClient();
            if (!client) throw new Error('Supabase belum siap');
            const { error } = await client.auth.signInWithPassword({ email, password });
            if (error) throw error;
            window.location.href = 'overview.html';
        } catch (err) {
            if (errorBox) {
                errorBox.textContent = err.message || 'Gagal login';
                errorBox.style.display = 'block';
            } else {
                alert(err.message || 'Gagal login');
            }
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
});
