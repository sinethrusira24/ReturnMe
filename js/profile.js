import { auth, db, storage } from './firebase-config.js';
import {
    ref,
    uploadBytes,
    getDownloadURL
}
    from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, getDoc, collection, query, where, onSnapshot, deleteDoc, setDoc, updateDoc, arrayRemove, writeBatch } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { showToast } from './toast.js';
import { sendPasswordResetEmail, deleteUser } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

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
                const preview = document.getElementById("profileImagePreview");
                const letter = document.getElementById("profileAvatarLetter");

                if (userData.profileImage) {

                    preview.src = userData.profileImage;
                    preview.style.display = "block";
                    letter.style.display = "none";

                }
                document.querySelector('.profile-hero-info h1').textContent = userData.fullName || user.displayName || user.email;
                const avatarLetter = document.getElementById("profileAvatarLetter");
                const avatarImage = document.getElementById("profileImagePreview");

                if (userData.profileImage) {

                    avatarImage.src = userData.profileImage;
                    avatarImage.style.display = "block";
                    avatarLetter.style.display = "none";

                } else {

                    avatarLetter.textContent =
                        (userData.fullName || user.displayName || user.email)[0].toUpperCase();

                }
                const emailDisplay = document.getElementById('profileEmailDisplay');
                if (emailDisplay) {
                    emailDisplay.innerHTML = `<i class="fa-solid fa-envelope"></i> ${userData.email || user.email || 'N/A'}`;
                }
                const studentIdDisplay = document.getElementById('profileStudentIdDisplay');
                if (studentIdDisplay) {
                    studentIdDisplay.innerHTML = `<i class="fa-solid fa-id-card"></i> ${userData.studentId || 'Not provided'}`;
                }

                const inputs = document.querySelectorAll('.settings-form input');
                if (inputs[0]) inputs[0].value = userData.fullName || user.displayName || '';
                if (inputs[1]) inputs[1].value = userData.email || user.email || '';
                if (inputs[2]) inputs[2].value = userData.phone || '';
                if (inputs[3]) inputs[3].value = userData.studentId || '';
            } else {
                // Fallback if userDoc is missing
                const heroTitle = document.querySelector('.profile-hero-info h1');
                if (heroTitle) heroTitle.textContent = user.displayName || user.email || 'User';
                const avatarLetter = document.getElementById("profileAvatarLetter");
                if (avatarLetter) {
                    avatarLetter.textContent = (user.displayName || user.email || 'U')[0].toUpperCase();
                    avatarLetter.style.display = "flex";
                }
                const emailDisplay = document.getElementById('profileEmailDisplay');
                if (emailDisplay) {
                    emailDisplay.innerHTML = `<i class="fa-solid fa-envelope"></i> ${user.email || 'N/A'}`;
                }
            }

            // Fetch User Reports
            const reportsGrid = document.querySelector('.profile-reports-grid');
            const reportsQuery = query(collection(db, "reports"), where("reporterId", "==", user.uid));

            function escapeAttribute(value) {
                if (value === null || value === undefined) return '';
                return String(value)
                    .replace(/&/g, '&amp;')
                    .replace(/"/g, '&quot;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;');
            }


            function attachReportActions() {
                reportsGrid.querySelectorAll('.preport-card').forEach(card => {
                    const reportId = card.dataset.id;
                    const removeBtn = card.querySelector('.pbtn-remove');
                    if (removeBtn) {
                        removeBtn.addEventListener('click', async () => {
                            const itemName = card.querySelector('h3')?.textContent || 'this report';
                            if (!confirm(`Are you sure you want to delete "${itemName}"?`)) {
                                return;
                            }

                            try {
                                await deleteDoc(doc(db, "reports", reportId));
                                showToast('Report deleted successfully', 'success');
                            } catch (error) {
                                console.error('Error deleting report:', error);
                                showToast('Failed to delete report', 'error');
                            }
                        });
                    }
                });
            }

            function attachUpdateActions() {
                reportsGrid.querySelectorAll('.pbtn-update').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const card = btn.closest('.preport-card');
                        const reportId = card.dataset.id;
                        window.location.href = `edit-report.html?id=${reportId}`;
                    });
                });

                reportsGrid.querySelectorAll('.pbtn-resolve').forEach(btn => {
                    btn.addEventListener('click', async () => {
                        if (btn.hasAttribute('disabled')) return;
                        const card = btn.closest('.preport-card');
                        const reportId = card.dataset.id;
                        if (!confirm('Mark this report as resolved? It will be hidden from search results.')) return;

                        try {
                            btn.disabled = true;
                            await updateDoc(doc(db, "reports", reportId), {
                                status: "resolved"
                            });
                            showToast('Report marked as resolved!', 'success');
                        } catch (error) {
                            console.error('Error resolving report:', error);
                            showToast('Failed to resolve report', 'error');
                            btn.disabled = false;
                        }
                    });
                });
            }

            try {
                onSnapshot(reportsQuery, (querySnapshot) => {
                    if (!reportsGrid) return;
                    reportsGrid.innerHTML = '';

                    let totalCount = 0;
                    let lostCount = 0;
                    let foundCount = 0;
                    let resolvedCount = 0;

                    const activityTimeline = document.getElementById('activity-timeline');
                    if (activityTimeline) {
                        activityTimeline.innerHTML = '';
                        if (querySnapshot.empty) {
                            activityTimeline.innerHTML = '<p class="no-results" style="text-align: center; color: var(--text-muted); padding: 2rem;">No recent activity found.</p>';
                        } else {
                            // Sort reports by date for timeline
                            const sortedReports = [];
                            querySnapshot.forEach(docSnap => sortedReports.push(docSnap.data()));

                            sortedReports.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

                            sortedReports.forEach(report => {
                                const dateStr = report.createdAt ? new Date(report.createdAt).toLocaleString() : 'Just now';
                                const dotClass = report.type === 'lost' ? 'dot-lost' : 'dot-found';
                                const title = `You reported a ${report.type} item`;
                                const desc = `${report.itemName} - ${report.location}`;

                                activityTimeline.insertAdjacentHTML('beforeend', `
                                    <div class="timeline-item">
                                        <div class="timeline-dot ${dotClass}"></div>
                                        <div class="timeline-card">
                                            <span class="timeline-time">${dateStr}</span>
                                            <h4>${title}</h4>
                                            <p>${desc}</p>
                                        </div>
                                    </div>
                                `);
                            });
                        }
                    }

                    if (querySnapshot.empty) {
                        reportsGrid.innerHTML = '<p style="display: block; grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 2rem;">You haven\'t submitted any reports yet.</p>';
                    } else {
                        querySnapshot.forEach((docSnap) => {
                            const report = docSnap.data();
                            const now = Date.now();

                            if (report.expireAt && report.expireAt < now) {
                                return; // Skip expired reports
                            }
                            totalCount++;
                            if (report.type === 'lost') lostCount++;
                            if (report.type === 'found') foundCount++;
                            if (report.status === 'resolved') resolvedCount++;

                            const dateStr = report.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'Just now';

                            // Calculate remaining days
                            const today = Date.now();

                            const expireAt = report.expireAt ?? (report.createdAt + 7 * 24 * 60 * 60 * 1000);

                            const remainingDays = Math.ceil(
                                (expireAt - today) / (1000 * 60 * 60 * 24)
                            );

                            let expiryText = "";
                            let expiryColor = "";

                            if (remainingDays > 2) {
                                expiryText = `⏳ Expires in ${remainingDays} days`;
                                expiryColor = "#10b981"; // green
                            } else if (remainingDays === 2) {
                                expiryText = "🟡 Expires in 2 days";
                                expiryColor = "#f59e0b"; // orange
                            } else if (remainingDays === 1) {
                                expiryText = "🟠 Expires Tomorrow";
                                expiryColor = "#ea580c";
                            } else if (remainingDays === 0) {
                                expiryText = "🔴 Expires Today";
                                expiryColor = "#dc2626";
                            } else {
                                expiryText = "❌ Expired";
                                expiryColor = "#6b7280";
                            }
                            let icon = report.type === 'lost' ? 'fa-id-card' : 'fa-mobile-screen';
                            if (report.category === 'ids' || report.category === 'documents') icon = 'fa-id-card';
                            if (report.category === 'electronics') icon = 'fa-mobile-screen';
                            if (report.category === 'keys' || report.category === 'accessories') icon = 'fa-key';
                            if (report.category === 'clothing') icon = 'fa-shirt';
                            const imageHTML = report.imageUrl
                                ? `<img src="${escapeAttribute(report.imageUrl)}" alt="${escapeAttribute(report.itemName)}" style="width:100%;height:100%;object-fit:contain;border-radius:10px;">`
                                : `<i class="fa-solid ${icon}"></i>`;

                            let progressLabel = report.status === 'resolved' ? '<i class="fa-solid fa-check"></i> Resolved' : 'Status: Active';
                            let progressClass = report.status === 'resolved' ? 'progress-label resolved-label' : 'progress-label';
                            let progressFillClass = report.status === 'resolved' ? 'progress-fill resolved-fill' : 'progress-fill';
                            let progressWidth = report.status === 'resolved' ? '100%' : '20%';
                            let statusBarBg = report.status === 'resolved' ? 'linear-gradient(90deg, #10b981, #6ee7b7)' : '';
                            let statusBarClass = report.status === 'resolved' ? 'preport-status-bar' : `preport-status-bar status-${report.type}`;

                            const cardHTML = `
                                <div class="preport-card" data-id="${docSnap.id}" data-type="${report.type}">
                                    <div class="${statusBarClass}"style="${statusBarBg ? `background:${statusBarBg};` : ''}"></div>
                                    <div class="preport-header">
                                        <div class="preport-badge badge-${report.type}">${report.type.charAt(0).toUpperCase() + report.type.slice(1)}</div>
                                        <span class="preport-date"><i class="fa-regular fa-clock"></i> ${dateStr}</span>
                                    </div>
                                    <div class="preport-icon-area">${imageHTML}</div>
                                    <div class="preport-body">
                                        <h3>${report.itemName}</h3>
                                        <p><i class="fa-solid fa-location-dot"></i> ${report.location}</p>
                                        <div class="preport-progress">
                                        <p style="margin:8px 0;color:${expiryColor};font-weight:600;">
    ${expiryText}
</p>
                                            <span class="${progressClass}">${progressLabel}</span>
                                            <div class="progress-bar">
                                                <div class="${progressFillClass}" style="width: ${progressWidth}; background: var(--color-${report.type});"></div>
                                            </div>
                                        </div>
                                    </div>
                                   <div class="preport-actions">

    <a href="item-detail.html?id=${docSnap.id}"
       class="pbtn pbtn-view">
        <i class="fa-solid fa-eye"></i>
        View
    </a>

    <button class="pbtn pbtn-update">
        <i class="fa-solid fa-pen"></i>
        Update
    </button>
    
    <button class="pbtn pbtn-resolve" ${report.status === 'resolved' ? 'disabled style="opacity:0.5;"' : ''}>
        <i class="fa-solid fa-check-circle"></i>
        Resolve
    </button>

    <button class="pbtn pbtn-remove">
        <i class="fa-solid fa-trash-can"></i>
        Remove
    </button>

</div>
`;

                            reportsGrid.insertAdjacentHTML('beforeend', cardHTML);

                        });

                        attachReportActions();
                        attachUpdateActions();
                    }


                    // Update Stats
                    const statCards = document.querySelectorAll('.pstat-card');
                    if (statCards.length >= 4) {
                        statCards[0].dataset.count = totalCount;
                        statCards[0].querySelector('.pstat-number').textContent = totalCount;

                        statCards[1].dataset.count = lostCount;
                        statCards[1].querySelector('.pstat-number').textContent = lostCount;

                        statCards[2].dataset.count = foundCount;
                        statCards[2].querySelector('.pstat-number').textContent = foundCount;

                        statCards[3].dataset.count = resolvedCount;
                        statCards[3].querySelector('.pstat-number').textContent = resolvedCount;
                    }

                }, (error) => {
                    console.error("Error listening to profile reports:", error);
                    showToast("Failed to load profile data", "error");
                });
            } catch (error) {
                console.error("Error setting up profile reports listener:", error);
                showToast("Failed to load profile data", "error");
            }

            initProfileUI();

            const imageInput = document.getElementById("profileImageInput");
            const preview = document.getElementById("profileImagePreview");
            const letter = document.getElementById("profileAvatarLetter");

            if (imageInput) {
                imageInput.addEventListener("change", async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;

                    // Show preview immediately
                    preview.src = URL.createObjectURL(file);
                    preview.style.display = "block";
                    letter.style.display = "none";

                    try {
                        showToast("Uploading image...", "info");

                        const storageRef = ref(storage, `profile-images/${user.uid}`);
                        await uploadBytes(storageRef, file);

                        const profileImageUrl = await getDownloadURL(storageRef);

                        await updateDoc(doc(db, "users", user.uid), {
                            profileImage: profileImageUrl
                        });

                        // Update preview with Firebase URL
                        preview.src = profileImageUrl;

                        // Update navbar avatar immediately
                        const navAvatar = document.querySelector(".user-avatar-btn img");
                        if (navAvatar) {
                            navAvatar.src = profileImageUrl;
                        }

                        imageInput.value = "";

                        showToast("Profile image updated!", "success");

                    } catch (error) {
                        console.error("Error uploading image:", error);
                        showToast("Failed to save profile image", "error");
                    }
                });
            }



            // Fetch Inbox
            const inboxList = document.getElementById('inbox-list');
            if (inboxList) {
                const inboxQuery = query(collection(db, "inboxChats"), where("users", "array-contains", user.uid));
                onSnapshot(inboxQuery, (snapshot) => {
                    inboxList.innerHTML = '';
                    if (snapshot.empty) {
                        inboxList.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 2rem;">No messages yet.</p>';
                        return;
                    }

                    // Add Clear All button
                    inboxList.innerHTML = `
                        <div style="display: flex; justify-content: flex-end; margin-bottom: 0.5rem;">
                            <button id="clearAllInboxBtn" style="background: var(--bg-mesh-1); color: var(--text-muted); border: 1px solid rgba(255,255,255,0.1); padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-size: 0.85rem; transition: var(--transition);"><i class="fa-solid fa-trash-can"></i> Clear All</button>
                        </div>
                    `;

                    let chats = [];
                    snapshot.forEach(docSnap => chats.push({ _docId: docSnap.id, ...docSnap.data() }));
                    chats.sort((a, b) => b.updatedAt - a.updatedAt);

                    chats.forEach(chat => {
                        const otherUserId = chat.users.find(id => id !== user.uid) || user.uid;
                        const otherUserName = chat.userNames ? (chat.userNames[otherUserId] || 'User') : 'User';
                        const timeStr = new Date(chat.updatedAt).toLocaleString();

                        const itemHtml = `
                            <div class="inbox-item-container" style="display: grid; grid-template-columns: 1fr 45px; gap: 0.5rem; align-items: center; margin-bottom: 0.5rem;">
                                <a href="personal-chat.html?id=${chat.itemId}&user=${otherUserId}" class="inbox-item" style="margin-bottom: 0;">
                                    <div class="inbox-avatar">${otherUserName[0].toUpperCase()}</div>
                                    <div class="inbox-content">
                                        <div class="inbox-header">
                                            <span class="inbox-name">${otherUserName}</span>
                                            <span class="inbox-time">${timeStr}</span>
                                        </div>
                                        <span class="inbox-item-name">Regarding: ${chat.itemName || 'an item'}</span>
                                        <div class="inbox-message">${chat.lastMessage || 'Sent a message'}</div>
                                    </div>
                                </a>
                                <button class="delete-inbox-btn" data-id="${chat._docId}" aria-label="Clear message" style="background: var(--bg-mesh-1); border: 1px solid rgba(255,255,255,0.1); color: var(--color-lost); border-radius: 50%; width: 45px; height: 45px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s; opacity: 0.8;"><i class="fa-solid fa-trash-can"></i></button>
                            </div>
                        `;
                        inboxList.insertAdjacentHTML('beforeend', itemHtml);
                    });

                    // Event Listeners for Inbox Deletions
                    const clearAllBtn = document.getElementById('clearAllInboxBtn');
                    if (clearAllBtn) {
                        clearAllBtn.addEventListener('click', async () => {
                            if (!confirm("Clear all messages from your Inbox? (The chat history will remain intact)")) return;
                            try {
                                const batch = writeBatch(db);
                                chats.forEach(chat => {
                                    batch.update(doc(db, "inboxChats", chat._docId), { users: arrayRemove(user.uid) });
                                });
                                await batch.commit();
                                showToast('Inbox cleared', 'success');
                            } catch (error) {
                                console.error("Error clearing all messages:", error);
                                showToast('Failed to clear inbox', 'error');
                            }
                        });
                    }

                    document.querySelectorAll('.delete-inbox-btn').forEach(btn => {
                        btn.addEventListener('click', async (e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            if (!confirm("Remove this message from your Inbox?")) return;
                            try {
                                await updateDoc(doc(db, "inboxChats", btn.dataset.id), { users: arrayRemove(user.uid) });
                                showToast('Removed from Inbox', 'success');
                            } catch (error) {
                                console.error("Error clearing message:", error);
                                showToast('Failed to remove message', 'error');
                            }
                        });
                    });

                }, (error) => {
                    console.error("Error fetching inbox:", error);
                });
            }


            // Fetch Incoming Claims
            const claimsList = document.getElementById('claims-list');
            if (claimsList) {
                const claimsQuery = query(collection(db, "claims"), where("founderId", "==", user.uid));
                onSnapshot(claimsQuery, (snapshot) => {
                    claimsList.innerHTML = '';
                    if (snapshot.empty) {
                        claimsList.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 2rem;">No incoming claims yet.</p>';
                        return;
                    }

                    let claims = [];
                    snapshot.forEach(docSnap => {
                        claims.push({ id: docSnap.id, ...docSnap.data() });
                    });
                    claims.sort((a, b) => b.createdAt - a.createdAt);

                    claims.forEach(claim => {
                        const timeStr = new Date(claim.createdAt).toLocaleString();
                        const evidenceHtml = claim.evidenceUrl ? `<a href="${claim.evidenceUrl}" target="_blank" style="color:var(--color-primary);text-decoration:underline;font-size:0.9rem;"><i class="fa-solid fa-image"></i> View Evidence</a>` : '';

                        const itemHtml = `
                            <div class="inbox-item" style="cursor: default;">
                                <div class="inbox-avatar" style="background:var(--color-primary);">${claim.claimantName[0].toUpperCase()}</div>
                                <div class="inbox-content">
                                    <div class="inbox-header">
                                        <span class="inbox-name">${claim.claimantName}</span>
                                        <span class="inbox-time">${timeStr}</span>
                                    </div>
                                    <span class="inbox-item-name"><i class="fa-solid fa-envelope"></i> ${claim.email} | <i class="fa-solid fa-phone"></i> ${claim.phone}</span>
                                    <div class="inbox-message" style="margin-top:0.5rem;">
                                        <strong>Claim Details:</strong> ${claim.uniqueDetails}<br>
                                        ${evidenceHtml}
                                    </div>
                                    <div style="margin-top: 1rem;">
                                        <a href="personal-chat.html?id=${claim.itemId}&user=${claim.claimantId}" class="pbtn pbtn-update" style="text-decoration:none; display:inline-block; padding: 0.5rem 1rem; border-radius: 5px; color: white;">
                                            <i class="fa-solid fa-comment-dots"></i> Message Claimant
                                        </a>
                                    </div>
                                </div>
                            </div>
                        `;
                        claimsList.insertAdjacentHTML('beforeend', itemHtml);
                    });
                }, (error) => {
                    console.error("Error fetching claims:", error);
                });
            }

        } catch (error) {
            console.error("Error loading profile page:", error);
            showToast("Failed to load profile page", "error");
        }
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

        // Automatically activate tab from URL if present
        const urlParams = new URLSearchParams(window.location.search);
        const viewTab = urlParams.get('view');
        if (viewTab) {
            const targetTab = document.querySelector(`.ptab[data-tab="${viewTab}"]`);
            if (targetTab) activateTab(targetTab);
        }

        // --- Filter pills ---
        const pills = document.querySelectorAll('.pill-btn');

        pills.forEach(pill => {
            pill.addEventListener('click', () => {
                pills.forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                const filter = pill.dataset.filter;
                document.querySelectorAll('.preport-card').forEach(card => {
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
                const newPhone = inputs[2]?.value.trim();
                const newStudentId = inputs[3]?.value.trim();

                if (!newName) {
                    showToast("Name cannot be empty", "error");
                    return;
                }

                try {
                    // Update Firestore
                    // Upload profile image if user selected one
                    let profileImage = "";

                    const file = document.getElementById("profileImageInput").files[0];

                    if (file) {

                        const storageRef = ref(storage, `profile-images/${user.uid}`);

                        await uploadBytes(storageRef, file);

                        profileImage = await getDownloadURL(storageRef);

                    }

                    // Data to update
                    const updateData = {
                        fullName: newName,
                        email: newEmail,
                        phone: newPhone,
                        studentId: newStudentId
                    };

                    // Save image URL only if a new image was uploaded
                    if (profileImage) {
                        updateData.profileImage = profileImage;
                    }

                    // Update Firestore
                    await setDoc(doc(db, "users", user.uid), updateData, { merge: true });

                    // Update Auth Profile
                    import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js").then(({ updateProfile }) => {
                        updateProfile(user, { displayName: newName }).catch(e => console.error("Auth profile update failed", e));
                    });

                    // Update UI visually
                    document.querySelector('.profile-hero-info h1').textContent = newName;
                    const avatarLetter = document.getElementById("profileAvatarLetter");
                    const avatarImage = document.getElementById("profileImagePreview");

                    if (profileImage) {

                        avatarImage.src = profileImage;
                        avatarImage.style.display = "block";
                        avatarLetter.style.display = "none";

                    } else {

                        avatarLetter.textContent = newName[0].toUpperCase();

                    }

                    const emailDisplay = document.getElementById('profileEmailDisplay');
                    if (emailDisplay) {
                        emailDisplay.innerHTML = `<i class="fa-solid fa-envelope"></i> ${newEmail || 'N/A'}`;
                    }
                    const studentIdDisplay = document.getElementById('profileStudentIdDisplay');
                    if (studentIdDisplay) {
                        studentIdDisplay.innerHTML = `<i class="fa-solid fa-id-card"></i> ${newStudentId || 'Not provided'}`;
                    }

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

        // --- Profile Share Modal ---
        const shareBtn = document.getElementById('btn-share-profile');
        const shareModal = document.getElementById('shareModal');
        const shareLinkInput = document.getElementById('shareLinkInput');
        const copyShareLinkBtn = document.getElementById('copyShareLinkBtn');
        const shareModalClose = document.getElementById('shareModalClose');
        const shareNowBtn = document.getElementById('shareNowBtn');

        function openShareModal() {
            if (!shareModal || !shareLinkInput) return;
            const shareUrl = `${window.location.origin}${window.location.pathname}`;
            shareLinkInput.value = shareUrl;
            shareModal.classList.add('active');
            setTimeout(() => shareModalClose?.focus(), 100);
        }

        function closeShareModal() {
            if (!shareModal) return;
            shareModal.classList.remove('active');
            shareBtn?.focus();
        }

        async function copyProfileLink() {
            if (!shareLinkInput) return;
            try {
                await navigator.clipboard.writeText(shareLinkInput.value);
                showToast('Profile link copied to clipboard!', 'success');
            } catch (err) {
                console.error('Copy failed:', err);
                showToast('Unable to copy link. Please copy it manually.', 'error');
            }
        }

        async function shareProfileLink() {
            if (!shareLinkInput) return;
            const url = shareLinkInput.value;
            if (navigator.share) {
                try {
                    await navigator.share({
                        title: 'ReturnMe Profile',
                        text: 'Check out my ReturnMe profile:',
                        url
                    });
                } catch (err) {
                    console.error('Share failed:', err);
                }
            } else {
                await copyProfileLink();
            }
        }

        if (shareBtn) {
            shareBtn.addEventListener('click', openShareModal);
        }
        if (copyShareLinkBtn) {
            copyShareLinkBtn.addEventListener('click', copyProfileLink);
        }
        if (shareModalClose) {
            shareModalClose.addEventListener('click', closeShareModal);
        }
        if (shareNowBtn) {
            shareNowBtn.addEventListener('click', shareProfileLink);
        }

        if (shareModal) {
            shareModal.addEventListener('click', (e) => {
                if (e.target === shareModal) closeShareModal();
            });
        }

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
                    onConfirm: async () => {

                        try {

                            await sendPasswordResetEmail(auth, auth.currentUser.email);

                            showToast("Password reset email sent!", "success");

                        } catch (error) {

                            console.error(error);

                            showToast("Failed to send reset email.", "error");

                        }

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
                    onConfirm: async () => {
                        try {
                            const user = auth.currentUser;
                            if (user) {
                                const userRef = doc(db, "users", user.uid);
                                const userSnap = await getDoc(userRef);
                                const userData = userSnap.exists() ? userSnap.data() : null;

                                try {
                                    // Delete user document from Firestore
                                    await deleteDoc(userRef);
                                    
                                    // Try to delete user from Firebase Auth
                                    await deleteUser(user);
                                    
                                    showToast('Account deleted successfully.', 'success');
                                    setTimeout(() => {
                                        window.location.href = 'login.html';
                                    }, 1500);
                                } catch (error) {
                                    // If deleteUser fails, restore the Firestore document
                                    if (userData) {
                                        await setDoc(userRef, userData);
                                    }
                                    throw error; // Re-throw to be handled by outer catch
                                }
                            }
                        } catch (error) {
                            console.error("Error deleting account:", error);
                            if (error.code === 'auth/requires-recent-login') {
                                showToast('Please log in again to delete your account.', 'error');
                                setTimeout(() => {
                                    auth.signOut().then(() => {
                                        window.location.href = 'login.html';
                                    });
                                }, 2000);
                            } else {
                                showToast('Failed to delete account.', 'error');
                            }
                        }
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
