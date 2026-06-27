import { showToast } from './toast.js';
import { auth, db } from './firebase-config.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export function initAuth() {
    // UI Updates based on Auth State
    onAuthStateChanged(auth, (user) => {
        const navProfile = document.querySelector('.nav-profile');
        const mobileLinks = document.querySelectorAll('.mobile-only');

        if (user) {
            // User is signed in
            if (navProfile) {
                navProfile.innerHTML = `
                    <a href="my-profile.html" class="btn-profile"><i class="fa-solid fa-user"></i> Profile</a>
                    <button id="btnLogout" class="btn-profile" style="cursor: pointer;">Logout</button>
                `;
                navProfile.style.opacity = '1';
                navProfile.style.visibility = 'visible';
                document.getElementById('btnLogout')?.addEventListener('click', async () => {
                    try {
                        await signOut(auth);
                        showToast('Logged out successfully', 'success');
                        setTimeout(() => window.location.href = 'index.html', 1000);
                    } catch (error) {
                        console.error('Error logging out', error);
                    }
                });
            }
            if (mobileLinks.length >= 2) {
                mobileLinks[0].innerHTML = `<a href="my-profile.html">Profile</a>`;
                mobileLinks[1].innerHTML = `<a href="#" id="mobileBtnLogout">Logout</a>`;
                document.getElementById('mobileBtnLogout')?.addEventListener('click', async (e) => {
                    e.preventDefault();
                    try {
                        await signOut(auth);
                        showToast('Logged out successfully', 'success');
                        setTimeout(() => window.location.href = 'index.html', 1000);
                    } catch (error) {
                        console.error('Error logging out', error);
                    }
                });
            }
        } else {
            // User is signed out
            const protectedPages = ['report-lost.html', 'report-found.html', 'my-profile.html', 'claim-item.html'];
            const currentPage = window.location.pathname.split('/').pop();
            
            if (protectedPages.includes(currentPage)) {
                window.location.href = 'login.html';
                return;
            }

            if (navProfile) {
                navProfile.innerHTML = `
                    <a href="login.html" class="btn-profile">Login</a>
                    <a href="register.html" class="btn-profile">Sign Up</a>
                `;
                navProfile.style.opacity = '1';
                navProfile.style.visibility = 'visible';
            }
            if (mobileLinks.length >= 2) {
                mobileLinks[0].innerHTML = `<a href="login.html">Login</a>`;
                mobileLinks[1].innerHTML = `<a href="register.html">Sign Up</a>`;
            }
        }
    });

    // Intercept clicks on protected links
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link) {
            const href = link.getAttribute('href');
            if (href) {
                const protectedPages = ['report-lost.html', 'report-found.html', 'my-profile.html', 'claim-item.html'];
                const isProtected = protectedPages.some(page => href.includes(page));
                // Only redirect if auth is fully initialized and user is null
                if (isProtected && auth.currentUser === null) {
                    e.preventDefault();
                    window.location.href = 'login.html';
                }
            }
        }
    });

    const loginForm = document.getElementById('loginForm');
    const passwordInput = document.getElementById('password');
    const togglePasswordButtons = document.querySelectorAll('.toggle-password');

    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const email = loginForm.email.value.trim();
            const password = loginForm.password.value.trim();
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!email || !password) {
                showToast('Please enter both email and password.', 'error');
                return;
            }

            if (!emailPattern.test(email)) {
                showToast('Enter a valid email address.', 'error');
                return;
            }

            try {
                // Firebase Login
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                showToast('Login successful. Redirecting...', 'success');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 800);
            } catch (error) {
                console.error("Login Error:", error.code, error.message);
                if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                    showToast('Invalid email or password.', 'error');
                } else {
                    showToast('Failed to login. Please try again.', 'error');
                }
            }
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

    // --- Registration Form Handler ---
    const registerForm = document.getElementById('registerForm');

    if (registerForm) {
        registerForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const fullName = document.getElementById('fullName')?.value.trim();
            const studentId = document.getElementById('studentId')?.value.trim();
            const email = registerForm.email.value.trim();
            const password = registerForm.password.value.trim();
            const confirmPassword = document.getElementById('confirmPassword')?.value.trim();
            const terms = document.getElementById('terms')?.checked;
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!fullName || !studentId || !email || !password || !confirmPassword) {
                showToast('Please fill in all required fields.', 'error');
                return;
            }

            if (!emailPattern.test(email)) {
                showToast('Enter a valid university email address.', 'error');
                document.getElementById('email').focus();
                return;
            }

            if (password.length < 8) {
                showToast('Password must be at least 8 characters.', 'error');
                document.getElementById('password').focus();
                return;
            }

            if (password !== confirmPassword) {
                showToast('Passwords do not match.', 'error');
                document.getElementById('confirmPassword').focus();
                return;
            }

            if (!terms) {
                showToast('You must agree to the Terms of Service.', 'error');
                return;
            }

            try {
                // Firebase Registration
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // Update Auth Profile
                await updateProfile(user, {
                    displayName: fullName
                });

                // Save extra user data to Firestore
                await setDoc(doc(db, "users", user.uid), {
                    fullName: fullName,
                    studentId: studentId,
                    email: email,
                    createdAt: new Date()
                });

                showToast('Account created successfully! Redirecting...', 'success');
                setTimeout(() => {
                    window.location.href = 'index.html'; // Or login.html
                }, 1200);

            } catch (error) {
                console.error("Registration Error:", error.code, error.message);
                if (error.code === 'auth/email-already-in-use') {
                    showToast('Email is already in use.', 'error');
                } else {
                    showToast(`Failed: ${error.code || error.message}`, 'error');
                }
            }
        });
    }
}
