export function initAuth() {
    const loginForm = document.getElementById('loginForm');
    const loginFeedback = document.getElementById('loginFeedback');
    const passwordInput = document.getElementById('password');
    const togglePasswordButtons = document.querySelectorAll('.toggle-password');

    if (loginForm) {
        const setFeedback = (message, type) => {
            if (!loginFeedback) return;
            loginFeedback.textContent = message;
            loginFeedback.classList.toggle('error', type === 'error');
            loginFeedback.classList.toggle('success', type === 'success');
        };

        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const email = loginForm.email.value.trim();
            const password = loginForm.password.value.trim();
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!email || !password) {
                setFeedback('Please enter both email and password.', 'error');
                if (!email) {
                    document.getElementById('email').focus();
                } else {
                    passwordInput?.focus();
                }
                return;
            }

            if (!emailPattern.test(email)) {
                setFeedback('Enter a valid university email address.', 'error');
                document.getElementById('email').focus();
                return;
            }

            if (password.length < 8) {
                setFeedback('Password must be at least 8 characters.', 'error');
                passwordInput?.focus();
                return;
            }

            setFeedback('Login successful. Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 800);
        });
    }

    if (togglePasswordButtons.length) {
        togglePasswordButtons.forEach(button => {
            const passwordField = button.closest('.password-field');
            const input = passwordField?.querySelector('input');
            const icon = button.querySelector('i');

            if (!input || !icon) return;

            button.addEventListener('click', () => {
                const isPasswordVisible = input.type === 'text';
                input.type = isPasswordVisible ? 'password' : 'text';
                icon.classList.toggle('fa-eye', isPasswordVisible);
                icon.classList.toggle('fa-eye-slash', !isPasswordVisible);
                button.setAttribute('aria-label', isPasswordVisible ? 'Show password' : 'Hide password');
            });
        });
    }
}
