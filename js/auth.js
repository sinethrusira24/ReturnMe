import { showToast } from './toast.js';

export function initAuth() {
    const loginForm = document.getElementById('loginForm');
    const passwordInput = document.getElementById('password');
    const togglePasswordButtons = document.querySelectorAll('.toggle-password');

    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const email = loginForm.email.value.trim();
            const password = loginForm.password.value.trim();
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!email || !password) {
                showToast('Please enter both email and password.', 'error');
                if (!email) {
                    document.getElementById('email').focus();
                } else {
                    passwordInput?.focus();
                }
                return;
            }

            if (!emailPattern.test(email)) {
                showToast('Enter a valid university email address.', 'error');
                document.getElementById('email').focus();
                return;
            }

            if (password.length < 8) {
                showToast('Password must be at least 8 characters.', 'error');
                passwordInput?.focus();
                return;
            }

            showToast('Login successful. Redirecting...', 'success');
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
