import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { collection, query, where, getDocs, doc, getDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { showToast } from './toast.js';

// ===== Profile Page Interactivity =====

document.addEventListener('DOMContentLoaded', () => {
    // Hide main content until auth is verified
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.classList.add('loading');
    }

    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        try {
            // Show main content after auth is verified
            if (mainContent) {
                mainContent.classList.remove('loading');
            }

            // Fetch User Data
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                document.querySelector('.profile-hero-info h1').textContent = userData.fullName || user.email;
                document.querySelector('.profile-avatar-lg').textContent = (userData.fullName || user.email)[0].toUpperCase();
                
                const inputs = document.querySelectorAll('.settings-form input');
                if (inputs[0]) inputs[0].value = userData.fullName || '';
                if (inputs[1]) inputs[1].value = user.email || '';
                if (inputs[2]) inputs[2].value = userData.studentId || '';
            }

            // Fetch User Reports
            const q = query(collection(db, "reports"), where("reporterId", "==", user.uid));
            const querySnapshot = await getDocs(q);
            
            const reportsGrid = document.querySelector('.profile-reports-grid');
            if (reportsGrid) {
                reportsGrid.innerHTML = ''; // Clear dummy reports
                
                let totalCount = 0;
                let lostCount = 0;
                let foundCount = 0;

                if (querySnapshot.empty) {
                    reportsGrid.innerHTML = '<p class="no-results" style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 2rem;">You haven\'t submitted any reports yet.</p>';
                } else {
                    querySnapshot.forEach((docSnap) => {
                        const report = docSnap.data();
                        totalCount++;
                        if (report.type === 'lost') lostCount++;
                        if (report.type === 'found') foundCount++;

                        function escapeAttribute(value) {
                            return String(value)
                                .replace(/&/g, '&amp;')
                                .replace(/"/g, '&quot;')
                                .replace(/</g, '&lt;')
                                .replace(/>/g, '&gt;');
                        }

                        const dateStr = report.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'Just now';
                        let icon = report.type === 'lost' ? 'fa-id-card' : 'fa-mobile-screen';
                        if (report.category === 'ids' || report.category === 'documents') icon = 'fa-id-card';
                        if (report.category === 'electronics') icon = 'fa-mobile-screen';
                        if (report.category === 'keys' || report.category === 'accessories') icon = 'fa-key';
                        if (report.category === 'clothing') icon = 'fa-shirt';
                        const imageHTML = report.imageUrl 
                            ? `<img src="${escapeAttribute(report.imageUrl)}" alt="${escapeAttribute(report.itemName)}" style="width:100%;height:100%;object-fit:cover;border-radius:10px;">`
                            : `<i class="fa-solid ${icon}"></i>`;

                        const cardHTML = `
                            <div class="preport-card" data-id="${docSnap.id}" data-type="${report.type}">
                                <div class="preport-status-bar status-${report.type}"></div>
                                <div class="preport-header">
                                    <div class="preport-badge badge-${report.type}">${report.type.charAt(0).toUpperCase() + report.type.slice(1)}</div>
                                    <span class="preport-date"><i class="fa-regular fa-clock"></i> ${dateStr}</span>
                                </div>
                                <div class="preport-icon-area">${imageHTML}</div>
                                <div class="preport-body">
                                    <h3>${report.itemName}</h3>
                                    <p><i class="fa-solid fa-location-dot"></i> ${report.location}</p>
                                    <div class="preport-progress">
                                        <span class="progress-label">Status: Active</span>
                                        <div class="progress-bar">
                                            <div class="progress-fill" style="width: 20%; background: var(--color-${report.type});"></div>
                                        </div>
                                    </div>
                                </div>
                                <div class="preport-actions">
                                    <a href="item-detail.html?id=${docSnap.id}" class="pbtn pbtn-view"><i class="fa-solid fa-eye"></i> View</a>
                                    <button class="pbtn pbtn-remove"><i class="fa-solid fa-trash-can"></i> Remove</button>
                                </div>
                            </div>
                        `;
                        reportsGrid.insertAdjacentHTML('beforeend', cardHTML);

                        // Add remove button handler
                        setTimeout(() => {
                            const removeBtn = reportsGrid.querySelector(`[data-id="${docSnap.id}"]`)?.querySelector('.pbtn-remove');
                            if (removeBtn) {
                                removeBtn.addEventListener('click', async () => {
                                    if (!confirm(`Are you sure you want to delete "${report.itemName}"?`)) {
                                        return;
                                    }
                                    try {
                                        await deleteDoc(doc(db, "reports", docSnap.id));
                                        showToast('Report deleted successfully', 'success');
                                        setTimeout(() => window.location.reload(), 800);
                                    } catch (error) {
                                        console.error('Error deleting report:', error);
                                        showToast('Failed to delete report', 'error');
                                    }
                                });
                            }
                        }, 100);
                    });
                }

                // Update Stats
                const statCards = document.querySelectorAll('.pstat-card');
                if (statCards.length >= 3) {
                    statCards[0].dataset.count = totalCount;
                    statCards[1].dataset.count = lostCount;
                    statCards[2].dataset.count = foundCount;
                }
            }
        } catch (error) {
            console.error("Error fetching profile data:", error);
            showToast("Failed to load profile data", "error");
        }

        initProfileUI();
    });

    function initProfileUI() {    // --- Animated stat counters ---
    const statCards = document.querySelectorAll('.pstat-card');
    const animateCount = (el, target) => {
        let current = 0;
        const duration = 1200;
        const step = Math.max(1, Math.floor(duration / (target || 1)));
        const numEl = el.querySelector('.pstat-number');
        const timer = setInterval(() => {
            current++;
            numEl.textContent = current;
            if (current >= target) {
                clearInterval(timer);
                numEl.textContent = target;
            }
        }, step);
    };

    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = parseInt(entry.target.dataset.count) || 0;
                animateCount(entry.target, target);
                statsObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    statCards.forEach(card => statsObserver.observe(card));

    // --- Tabs with ARIA keyboard navigation ---
    const tabs = document.querySelectorAll('.ptab');
    const tabContents = document.querySelectorAll('.ptab-content');

    function activateTab(tab) {
        tabs.forEach(t => {
            t.classList.remove('active');
            t.setAttribute('aria-selected', 'false');
            t.setAttribute('tabindex', '-1');
        });
        tabContents.forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        tab.setAttribute('tabindex', '0');
        tab.focus();
        const target = document.getElementById('tab-' + tab.dataset.tab);
        if (target) target.classList.add('active');
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => activateTab(tab));

        // Keyboard navigation: Arrow keys to move between tabs
        tab.addEventListener('keydown', (e) => {
            const tabArray = Array.from(tabs);
            const index = tabArray.indexOf(tab);
            let newIndex;

            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                newIndex = (index + 1) % tabArray.length;
                activateTab(tabArray[newIndex]);
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                newIndex = (index - 1 + tabArray.length) % tabArray.length;
                activateTab(tabArray[newIndex]);
            } else if (e.key === 'Home') {
                e.preventDefault();
                activateTab(tabArray[0]);
            } else if (e.key === 'End') {
                e.preventDefault();
                activateTab(tabArray[tabArray.length - 1]);
            }
        });
    });

    // --- Filter pills ---
    const pills = document.querySelectorAll('.pill-btn');
    const reportCards = document.querySelectorAll('.preport-card');

    pills.forEach(pill => {
        pill.addEventListener('click', () => {
            pills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            const filter = pill.dataset.filter;
            reportCards.forEach(card => {
                if (filter === 'all' || card.dataset.type === filter) {
                    card.style.display = '';
                    card.style.animation = 'fadeTabIn 0.4s ease';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });

    // --- Staggered card entrance ---
    const allCards = document.querySelectorAll('.preport-card, .timeline-item');
    allCards.forEach((card, i) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = `opacity 0.5s ease ${i * 0.1}s, transform 0.5s ease ${i * 0.1}s`;
    });
    requestAnimationFrame(() => {
        allCards.forEach(card => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        });
    });

    // --- Save settings toast & Firebase Sync ---
    const saveBtn = document.querySelector('.btn-save-settings');
    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            const user = auth.currentUser;
            if (!user) return;

            const inputs = document.querySelectorAll('.settings-form input');
            const newName = inputs[0]?.value.trim();
            const newEmail = inputs[1]?.value.trim();
            const newStudentId = inputs[2]?.value.trim();

            if (!newName) {
                showToast("Name cannot be empty", "error");
                return;
            }

            try {
                // Update Firestore
                await updateDoc(doc(db, "users", user.uid), {
                    fullName: newName,
                    email: newEmail,
                    studentId: newStudentId
                });

                // Update UI visually
                document.querySelector('.profile-hero-info h1').textContent = newName;
                document.querySelector('.profile-avatar-lg').textContent = newName[0].toUpperCase();

                saveBtn.textContent = '✓ Saved!';
                saveBtn.style.background = 'var(--color-found)';
                setTimeout(() => {
                    saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Changes';
                    saveBtn.style.background = '';
                }, 2000);
                
                showToast("Profile updated successfully!", "success");
            } catch (error) {
                console.error("Error updating profile:", error);
                showToast("Failed to save changes.", "error");
            }
        });
    }

    // --- Edit Profile → Navigate to Settings tab ---
    const editProfileBtn = document.getElementById('btn-edit-profile');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', () => {
            const settingsTab = document.querySelector('.ptab[data-tab="settings"]');
            if (settingsTab) {
                activateTab(settingsTab);
                // Smooth scroll to the tabs section
                const tabsContainer = document.querySelector('.profile-tabs');
                if (tabsContainer) {
                    tabsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
                // Focus the first input in settings after a short delay
                setTimeout(() => {
                    const firstInput = document.querySelector('#tab-settings input');
                    if (firstInput) firstInput.focus();
                }, 500);
            }
        });
    }

    // ========================================
    // CONFIRMATION MODAL SYSTEM
    // ========================================
    const modal = document.getElementById('confirmModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalDesc = document.getElementById('modalDesc');
    const modalIcon = document.getElementById('modalIcon');
    const modalIconI = document.getElementById('modalIconI');
    const modalConfirm = document.getElementById('modalConfirm');
    const modalCancel = document.getElementById('modalCancel');
    let previousFocus = null;

    function showModal({ title, description, iconClass, iconType, confirmText, confirmClass, onConfirm }) {
        if (!modal) return;
        modalTitle.textContent = title;
        modalDesc.textContent = description;
        modalIconI.className = `fa-solid ${iconClass}`;
        modalIcon.className = `modal-icon modal-icon-${iconType}`;

        // Store the element that triggered the modal for focus restoration
        previousFocus = document.activeElement;

        // Remove old listener by cloning the confirm button
        const currentConfirm = document.getElementById('modalConfirm');
        const newConfirm = currentConfirm.cloneNode(true);
        // Update the cloned button's text and styling
        newConfirm.textContent = confirmText;
        newConfirm.className = `modal-btn ${confirmClass}`;
        currentConfirm.replaceWith(newConfirm);

        newConfirm.addEventListener('click', () => {
            hideModal();
            if (onConfirm) onConfirm();
        });

        modal.classList.add('active');

        // Trap focus inside modal
        setTimeout(() => {
            document.getElementById('modalCancel').focus();
        }, 100);
    }

    function hideModal() {
        if (!modal) return;
        modal.classList.remove('active');
        // Restore focus to the element that opened the modal
        if (previousFocus) {
            previousFocus.focus();
            previousFocus = null;
        }
    }

    // Cancel button
    if (modalCancel) {
        modalCancel.addEventListener('click', hideModal);
    }

    // Close modal on overlay click
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) hideModal();
        });

        // Close modal on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                hideModal();
            }
        });
    }

    // --- Wire up Remove buttons ---
    document.querySelectorAll('.pbtn-remove').forEach(btn => {
        btn.addEventListener('click', () => {
            const card = btn.closest('.preport-card');
            const itemName = card?.querySelector('h3')?.textContent || 'this report';
            showModal({
                title: 'Remove Report?',
                description: `Are you sure you want to remove "${itemName}"? This action cannot be undone.`,
                iconClass: 'fa-trash-can',
                iconType: 'danger',
                confirmText: 'Remove',
                confirmClass: 'modal-btn modal-btn-danger',
                onConfirm: () => {
                    card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.9)';
                    setTimeout(() => card.remove(), 400);
                    showToast(`"${itemName}" has been removed.`, 'success');
                }
            });
        });
    });

    // --- Wire up Resolve buttons ---
    document.querySelectorAll('.pbtn-resolve').forEach(btn => {
        btn.addEventListener('click', () => {
            const card = btn.closest('.preport-card');
            const itemName = card?.querySelector('h3')?.textContent || 'this item';
            showModal({
                title: 'Mark as Resolved?',
                description: `Confirm that "${itemName}" has been successfully returned to its owner.`,
                iconClass: 'fa-circle-check',
                iconType: 'info',
                confirmText: 'Mark Resolved',
                confirmClass: 'modal-btn modal-btn-confirm',
                onConfirm: () => {
                    // Update the card visually
                    const progressLabel = card.querySelector('.progress-label');
                    const progressFill = card.querySelector('.progress-fill');
                    const statusBar = card.querySelector('.preport-status-bar');
                    if (progressLabel) {
                        progressLabel.className = 'progress-label resolved-label';
                        progressLabel.innerHTML = '<i class="fa-solid fa-check"></i> Resolved';
                    }
                    if (progressFill) {
                        progressFill.className = 'progress-fill resolved-fill';
                        progressFill.style.width = '100%';
                    }
                    if (statusBar) {
                        statusBar.className = 'preport-status-bar';
                        statusBar.style.background = 'linear-gradient(90deg, #10b981, #6ee7b7)';
                    }
                    btn.remove();
                    showToast(`"${itemName}" marked as resolved!`, 'success');
                }
            });
        });
    });

    // --- Wire up Archive buttons ---
    document.querySelectorAll('.pbtn-archive').forEach(btn => {
        btn.addEventListener('click', () => {
            const card = btn.closest('.preport-card');
            const itemName = card?.querySelector('h3')?.textContent || 'this report';
            showModal({
                title: 'Archive Report?',
                description: `Archive "${itemName}"? You can view archived items later.`,
                iconClass: 'fa-box-archive',
                iconType: 'warning',
                confirmText: 'Archive',
                confirmClass: 'modal-btn modal-btn-warning',
                onConfirm: () => {
                    card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                    card.style.opacity = '0.4';
                    card.style.transform = 'scale(0.95)';
                    card.style.pointerEvents = 'none';
                    showToast(`"${itemName}" has been archived.`, 'success');
                }
            });
        });
    });

    // --- Wire up Change Password button ---
    const changePasswordBtn = document.querySelector('.btn-account-action:not(.btn-danger)');
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', () => {
            showModal({
                title: 'Change Password',
                description: 'A password reset link will be sent to your registered email address.',
                iconClass: 'fa-key',
                iconType: 'info',
                confirmText: 'Send Reset Link',
                confirmClass: 'modal-btn modal-btn-confirm',
                onConfirm: () => {
                    showToast('Password reset link sent to your email!', 'success');
                }
            });
        });
    }

    // --- Wire up Delete Account button ---
    const deleteAccountBtn = document.querySelector('.btn-account-action.btn-danger');
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', () => {
            showModal({
                title: 'Delete Account?',
                description: 'This will permanently delete your account and all associated data. This action is irreversible.',
                iconClass: 'fa-trash-can',
                iconType: 'danger',
                confirmText: 'Delete Forever',
                confirmClass: 'modal-btn modal-btn-danger',
                onConfirm: () => {
                    showToast('Account deletion requested. You will receive a confirmation email.', 'warning');
                }
            });
        });
    }

    // --- Helper: show toast (inline since profile.js is not a module) ---
    function showToast(message, type = 'info') {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        let iconClass = 'fa-info-circle';
        if (type === 'success') iconClass = 'fa-check-circle';
        if (type === 'error') iconClass = 'fa-circle-xmark';
        if (type === 'warning') iconClass = 'fa-triangle-exclamation';
        toast.innerHTML = `<i class="fa-solid ${iconClass}"></i><span>${message}</span>`;
        container.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    } // End of initProfileUI()
});
