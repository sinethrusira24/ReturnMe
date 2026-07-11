import { showToast } from './toast.js';
import { auth, db } from './firebase-config.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, onAuthStateChanged, signOut, sendPasswordResetEmail, sendEmailVerification } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, setDoc, deleteDoc, collection, query, where, orderBy, onSnapshot, getDocs, writeBatch } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export function initAuth() {
    // UI Updates based on Auth State
    onAuthStateChanged(auth, (user) => {
        const navProfile = document.querySelector('.nav-profile');
        const mobileLinks = document.querySelectorAll('.mobile-only');

        if (user) {
            // User is signed in
            if (navProfile) {
                // If user object has a displayName, we can use the first letter for avatar
                const initials = user.displayName ? user.displayName.charAt(0).toUpperCase() : '<i class="fa-solid fa-user"></i>';
                
                navProfile.innerHTML = `
                    <div class="notification-container" style="position: relative; display: flex; align-items: center; margin-right: 1rem;">
                        <div class="notification-btn" id="notificationBtn" aria-label="Notifications" role="button" tabindex="0" style="cursor: pointer; position: relative; color: var(--text-dark); font-size: 1.2rem; transition: var(--transition);">
                            <i class="fa-solid fa-bell"></i>
                            <span class="notification-badge" id="notificationBadge" style="display: none; position: absolute; top: -5px; right: -5px; background: var(--color-lost); color: white; font-size: 0.65rem; font-weight: bold; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transform: scale(0);">0</span>
                        </div>
                        <div class="profile-dropdown" id="notificationDropdown" style="width: 320px; right: -50px;">
                            <div class="notification-header" style="padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1); font-weight: 600; display: flex; justify-content: space-between; align-items: center;">
                                <span>Notifications</span>
                                <button id="clearAllNotifs" style="background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 0.8rem; display: none;"><i class="fa-solid fa-trash-can"></i> Clear All</button>
                            </div>
                            <div class="notification-list" id="notificationList" style="max-height: 350px; overflow-y: auto; padding: 0.5rem 0;">
                                <p class="no-notifications" style="text-align: center; padding: 1rem; color: var(--text-muted); font-size: 0.9rem;">No new notifications</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="user-avatar-btn" id="userAvatarBtn" aria-label="User menu" role="button" tabindex="0">
                        ${initials}
                    </div>
                    <div class="profile-dropdown" id="profileDropdown">
                        <a href="my-profile.html"><i class="fa-solid fa-circle-user"></i> My Profile</a>
                        <a href="report-lost.html"><i class="fa-solid fa-magnifying-glass"></i> Report Lost</a>
                        <a href="report-found.html"><i class="fa-solid fa-box-open"></i> Report Found</a>
                        <hr>
                        <button id="btnLogout"><i class="fa-solid fa-right-from-bracket"></i> Logout</button>
                    </div>
                `;
                navProfile.style.opacity = '1';
                navProfile.style.visibility = 'visible';

                // Add Dropdown Toggle Logic
                const avatarBtn = document.getElementById('userAvatarBtn');
                const profileDropdown = document.getElementById('profileDropdown');
                
                const notifBtn = document.getElementById('notificationBtn');
                const notifDropdown = document.getElementById('notificationDropdown');
                const notifBadge = document.getElementById('notificationBadge');
                
                // Fetch Notifications
                const notifQuery = query(collection(db, "users", user.uid, "notifications"), orderBy("createdAt", "desc"));
                onSnapshot(notifQuery, (snapshot) => {
                    const list = document.getElementById('notificationList');
                    if (!list) return;
                    
                    let unreadCount = 0;
                    let notifHtml = '';
                    
                    if (snapshot.empty) {
                        notifHtml = '<p class="no-notifications" style="text-align: center; padding: 1rem; color: var(--text-muted); font-size: 0.9rem;">No new notifications</p>';
                    } else {
                        snapshot.forEach(docSnap => {
                            const data = docSnap.data();
                            if (!data.isRead) unreadCount++;
                            
                            const timeStr = new Date(data.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                            notifHtml += `
                                <div class="notif-item-container" style="display: grid; grid-template-columns: 1fr 40px; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05);">
                                    <a href="${data.link || '#'}" class="notif-item ${data.isRead ? 'read' : 'unread'}" style="display: block; padding: 0.8rem 1rem; text-decoration: none; overflow: hidden; transition: background 0.2s;">
                                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.2rem;">
                                            <strong style="color: ${data.isRead ? 'var(--text-muted)' : 'var(--white)'}; font-size: 0.85rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${data.title}</strong>
                                            <span style="color: var(--text-muted); font-size: 0.7rem; flex-shrink: 0; margin-left: 0.5rem;">${timeStr}</span>
                                        </div>
                                        <div style="color: var(--text-muted); font-size: 0.8rem; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${data.body}</div>
                                    </a>
                                    <button class="delete-notif-btn" data-id="${docSnap.id}" aria-label="Delete notification" style="background: none; border: none; color: var(--color-lost); cursor: pointer; padding: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; opacity: 0.7; transition: opacity 0.2s;"><i class="fa-solid fa-trash-can"></i></button>
                                </div>
                            `;
                        });
                    }
                    
                    list.innerHTML = notifHtml;
                    
                    const clearAllBtn = document.getElementById('clearAllNotifs');
                    if (clearAllBtn) {
                        clearAllBtn.style.display = snapshot.empty ? 'none' : 'block';
                    }

                    // Attach delete listeners
                    document.querySelectorAll('.delete-notif-btn').forEach(btn => {
                        btn.addEventListener('click', async (e) => {
                            e.stopPropagation();
                            try {
                                await deleteDoc(doc(db, "users", user.uid, "notifications", btn.dataset.id));
                            } catch (error) {
                                console.error("Error deleting notification:", error);
                            }
                        });
                    });
                    
                    if (unreadCount > 0) {
                        notifBadge.style.display = 'flex';
                        notifBadge.style.transform = 'scale(1)';
                        notifBadge.textContent = unreadCount;
                    } else {
                        notifBadge.style.transform = 'scale(0)';
                        setTimeout(() => notifBadge.style.display = 'none', 200);
                    }
                });

                if (avatarBtn && profileDropdown && notifBtn && notifDropdown) {
                    avatarBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        notifDropdown.classList.remove('active');
                        profileDropdown.classList.toggle('active');
                    });
                    
                    notifBtn.addEventListener('click', async (e) => {
                        e.stopPropagation();
                        profileDropdown.classList.remove('active');
                        const isOpening = !notifDropdown.classList.contains('active');
                        notifDropdown.classList.toggle('active');
                        
                        if (isOpening) {
                            try {
                                const unreadQuery = query(collection(db, "users", user.uid, "notifications"), where("isRead", "==", false));
                                const unreadSnap = await getDocs(unreadQuery);
                                if (!unreadSnap.empty) {
                                    const batch = writeBatch(db);
                                    unreadSnap.forEach(docSnap => {
                                        batch.update(docSnap.ref, { isRead: true });
                                    });
                                    await batch.commit();
                                }
                            } catch (error) {
                                console.error("Error marking notifications as read:", error);
                            }
                        }
                    });
                    
                    // Allow keyboard toggle
                    avatarBtn.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            notifDropdown.classList.remove('active');
                            profileDropdown.classList.toggle('active');
                        }
                    });
                    
                    document.addEventListener('click', (e) => {
                        if (!profileDropdown.contains(e.target) && !avatarBtn.contains(e.target)) {
                            profileDropdown.classList.remove('active');
                        }
                        if (!notifDropdown.contains(e.target) && !notifBtn.contains(e.target)) {
                            notifDropdown.classList.remove('active');
                        }
                    });
                    
                    const clearAllBtn = document.getElementById('clearAllNotifs');
                    if (clearAllBtn) {
                        clearAllBtn.addEventListener('click', async (e) => {
                            e.stopPropagation();
                            if (!confirm("Are you sure you want to clear all notifications?")) return;
                            try {
                                const q = query(collection(db, "users", user.uid, "notifications"));
                                const snap = await getDocs(q);
                                const batch = writeBatch(db);
                                snap.forEach(docSnap => {
                                    batch.delete(docSnap.ref);
                                });
                                await batch.commit();
                                showToast('All notifications cleared', 'success');
                            } catch (error) {
                                console.error("Error clearing notifications:", error);
                                showToast('Failed to clear notifications', 'error');
                            }
                        });
                    }
                }

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

                if (!userCredential.user.emailVerified) {
                    await sendEmailVerification(userCredential.user);
                    await signOut(auth);
                    showToast('We just sent a new verification link to your email. Please verify before logging in.', 'warning');
                    return;
                }

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

    const forgotPasswordBtn = document.querySelector('.forgot-password');
    if (forgotPasswordBtn) {
        forgotPasswordBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('email');
            if (!emailInput) return;
            const email = emailInput.value.trim();
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!email || !emailPattern.test(email)) {
                showToast('Please enter a valid email address to reset your password.', 'warning');
                emailInput.focus();
                return;
            }

            try {
                await sendPasswordResetEmail(auth, email);
                showToast('Password reset link sent to your email!', 'success');
            } catch (error) {
                console.error("Password Reset Error:", error.code, error.message);
                if (error.code === 'auth/user-not-found') {
                    showToast('No account found with this email.', 'error');
                } else {
                    showToast('Failed to send reset email. Please try again.', 'error');
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

                // Send email verification
                await sendEmailVerification(user);
                
                // Sign out immediately so they must verify their email before logging in
                await signOut(auth);

                showToast('Account created! Please check your email to verify your account.', 'success');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2500);

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
