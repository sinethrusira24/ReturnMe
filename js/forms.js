import { showToast } from './toast.js';
import { db, auth, storage } from './firebase-config.js';
import { collection, addDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

export function initForms() {
    // Check if user is authenticated on report pages
    const reportPages = ['reportLostForm', 'reportFoundForm'];
    const isReportPage = reportPages.some(id => document.getElementById(id));

    let currentUser = auth.currentUser;

    if (isReportPage) {
        onAuthStateChanged(auth, (user) => {
            currentUser = user;

            if (!user) {
                const mainContent = document.querySelector('main');
                if (mainContent) {
                    mainContent.innerHTML = `
                        <div style="text-align: center; padding: 3rem 2rem;">
                            <h2 style="color: var(--text-dark); margin-bottom: 1rem;">You must be logged in to report items</h2>
                            <p style="color: var(--text-muted); margin-bottom: 2rem;">Please sign in or create an account to continue.</p>
                            <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                                <a href="login.html" style="padding: 0.75rem 1.5rem; background: var(--color-primary); color: white; text-decoration: none; border-radius: 8px; font-weight: 500;">Login</a>
                                <a href="register.html" style="padding: 0.75rem 1.5rem; border: 2px solid var(--color-primary); color: var(--color-primary); text-decoration: none; border-radius: 8px; font-weight: 500;">Sign Up</a>
                            </div>
                        </div>
                    `;
                }
                return;
            }
        });
    }

    async function uploadImageIfPresent(fileInputId) {
        const fileInput = document.getElementById(fileInputId);
        if (fileInput && fileInput.files && fileInput.files[0]) {
            const file = fileInput.files[0];
            const cleanFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
            const storageRef = ref(storage, `reports/${Date.now()}_${cleanFileName}`);
            
            try {
                // Try uploading and getting URL within 8 seconds max
                const uploadTask = async () => {
                    const snapshot = await uploadBytes(storageRef, file);
                    return await getDownloadURL(snapshot.ref);
                };

                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error("Upload timed out. Firebase Storage may not be enabled or there is a CORS issue.")), 8000)
                );
                
                const downloadURL = await Promise.race([ uploadTask(), timeoutPromise ]);
                return downloadURL;
            } catch (error) {
                console.warn("Image upload failed, saving report without image:", error);
                showToast("Image upload failed! Did you enable Firebase Storage in the console? Saving without image...", "warning");
                return null; // Return null so the form still submits successfully without the image
            }
        }
        return null;
    }

    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    function validatePhone(phone) {
        const re = /^\+?[\d\s\-\(\)]{10,}$/;
        return re.test(phone);
    }

    // --- Report Lost Form Handler ---
    const reportLostForm = document.getElementById('reportLostForm');
    if (reportLostForm) {
        reportLostForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const fullName = document.getElementById('fullName')?.value.trim();
            const email = document.getElementById('email')?.value.trim();
            const phone = document.getElementById('phone')?.value.trim();
            const itemName = document.getElementById('itemName')?.value.trim();
            const itemCategory = document.getElementById('itemCategory')?.value;
            const dateLost = document.getElementById('dateLost')?.value;
            const locationLost = document.getElementById('locationLost')?.value.trim();
            const description = document.getElementById('description')?.value.trim();

            if (!fullName || !email || !phone || !itemName || !itemCategory || !dateLost || !locationLost || !description) {
                showToast('Please fill in all required fields.', 'error');
                return;
            }

            if (!validateEmail(email)) {
                showToast('Please enter a valid email address.', 'error');
                return;
            }

            if (!validatePhone(phone)) {
                showToast('Please enter a valid phone number.', 'error');
                return;
            }

            if (description.length < 10) {
                showToast('Description must be at least 10 characters.', 'error');
                return;
            }

            try {
                await auth.authStateReady();
                const user = auth.currentUser;
                if (!user) {
                    showToast('You must be logged in to submit a report.', 'error');
                    window.location.href = 'login.html';
                    return;
                }

                const createdAt = Date.now();
const expireAt = createdAt + (7 * 24 * 60 * 60 * 1000);

                showToast('Uploading and saving report...', 'info');
                const imageUrl = await uploadImageIfPresent('referenceImage');


                await addDoc(collection(db, "reports"), {
                 type: "lost",
                 reporterName: fullName,
                   email: email,
                   phone: phone,
                   itemName: itemName,
                    category: itemCategory,
                  date: dateLost,
                  location: locationLost,
                 description: description,

                    status: "active",

                      imageUrl: imageUrl || null,

                      createdAt: createdAt,
                     expireAt: expireAt,

                  reporterId: user.uid
           });

                showToast('Lost item report submitted successfully!', 'success');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1200);
            } catch (error) {
                console.error("Error adding document: ", error);
                showToast('Failed to submit report. Please try again.', 'error');
            }
        });
    }

    // --- Report Found Form Handler ---
    const reportFoundForm = document.getElementById('reportFoundForm');
    if (reportFoundForm) {
        reportFoundForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const fullName = document.getElementById('fullName')?.value.trim();
            const email = document.getElementById('email')?.value.trim();
            const phone = document.getElementById('phone')?.value.trim();
            const itemName = document.getElementById('itemName')?.value.trim();
            const itemCategory = document.getElementById('itemCategory')?.value;
            const dateFound = document.getElementById('dateFound')?.value;
            const locationFound = document.getElementById('locationFound')?.value.trim();
            const currentStatus = document.getElementById('currentStatus')?.value;
            const description = document.getElementById('description')?.value.trim();

            if (!fullName || !email || !phone || !itemName || !itemCategory || !dateFound || !locationFound || !description) {
                showToast('Please fill in all required fields.', 'error');
                return;
            }

            if (!validateEmail(email)) {
                showToast('Please enter a valid email address.', 'error');
                return;
            }

            if (!validatePhone(phone)) {
                showToast('Please enter a valid phone number.', 'error');
                return;
            }

            if (description.length < 10) {
                showToast('Description must be at least 10 characters.', 'error');
                return;
            }

            try {
                await auth.authStateReady();
                const user = auth.currentUser;
                if (!user) {
                    showToast('You must be logged in to submit a report.', 'error');
                    window.location.href = 'login.html';
                    return;
                }

                showToast('Uploading and saving report...', 'info');
                const imageUrl = await uploadImageIfPresent('foundImage');

                const createdAt = Date.now();
const expireAt = createdAt + (7 * 24 * 60 * 60 * 1000);

                const newReportRef = await addDoc(collection(db, "reports"), {
                    type: "found",
                    reporterName: fullName,
                    email: email,
                    phone: phone,
                    itemName: itemName,
                    category: itemCategory,
                    date: dateFound,
                    location: locationFound,
                    currentStatus: currentStatus || 'with_me',
                    description: description,
                    status: "active",
                    imageUrl: imageUrl || null,
                   createdAt: createdAt,
                   expireAt: expireAt,
                    reporterId: user.uid
                });
                
                // If this found report was linked from a lost item, notify the lost item's owner
                const urlParams = new URLSearchParams(window.location.search);
                const relatedLostId = urlParams.get('relatedLost');
                
                if (relatedLostId) {
                    const lostDocRef = doc(db, "reports", relatedLostId);
                    const lostDoc = await getDoc(lostDocRef);
                    
                    if (lostDoc.exists()) {
                        const lostData = lostDoc.data();
                        if (lostData.reporterId && lostData.reporterId !== user.uid) {
                            await addDoc(collection(db, "users", lostData.reporterId, "notifications"), {
                                type: "match",
                                title: "Someone found your item!",
                                body: `${fullName} has reported finding an item matching your lost '${lostData.itemName}'.`,
                                link: `item-detail.html?id=${newReportRef.id}`,
                                isRead: false,
                                createdAt: Date.now()
                            });
                        }
                    }
                }

                showToast('Found item report submitted successfully!', 'success');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1200);
            } catch (error) {
                console.error("Error adding document: ", error);
                showToast('Failed to submit report. Please try again.', 'error');
            }
        });
    }

    // --- Claim Form Handler ---
    const claimForm = document.getElementById('claimForm');
    if (claimForm) {
        claimForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const fullName = document.getElementById('fullName')?.value.trim();
            const studentId = document.getElementById('studentId')?.value.trim();
            const email = document.getElementById('email')?.value.trim();
            const phone = document.getElementById('phone')?.value.trim();
            const uniqueDetails = document.getElementById('uniqueDetails')?.value.trim();

            const urlParams = new URLSearchParams(window.location.search);
            const itemId = urlParams.get('id');

            if (!fullName || !studentId || !email || !phone || !uniqueDetails) {
                showToast('Please fill in all required fields.', 'error');
                return;
            }

            if (!validateEmail(email)) {
                showToast('Please enter a valid email address.', 'error');
                return;
            }

            if (!validatePhone(phone)) {
                showToast('Please enter a valid phone number.', 'error');
                return;
            }

            if (uniqueDetails.length < 20) {
                showToast('Please provide at least 20 characters of detail.', 'error');
                return;
            }

            try {
                await auth.authStateReady();
                const user = auth.currentUser;
                if (!user) {
                    showToast('You must be logged in to submit a claim.', 'error');
                    window.location.href = 'login.html';
                    return;
                }

                showToast('Uploading and saving claim...', 'info');
                const evidenceUrl = await uploadImageIfPresent('evidenceFile');
                // Fetch founder ID before saving claim
                let founderId = null;
                let itemName = "unknown item";
                if (itemId) {
                    const reportRef = doc(db, "reports", itemId);
                    const reportDoc = await getDoc(reportRef);
                    if (reportDoc.exists()) {
                        const reportData = reportDoc.data();
                        founderId = reportData.reporterId;
                        itemName = reportData.itemName;
                    }
                }

                await addDoc(collection(db, "claims"), {
                    itemId: itemId || "unknown",
                    founderId: founderId,
                    claimantName: fullName,
                    studentId: studentId,
                    email: email,
                    phone: phone,
                    uniqueDetails: uniqueDetails,
                    evidenceUrl: evidenceUrl || null,
                    status: "pending",
                    createdAt: Date.now(),
                    claimantId: user ? user.uid : null
                });
                
                // Notify the founder
                if (founderId && founderId !== user.uid) {
                    await addDoc(collection(db, "users", founderId, "notifications"), {
                        type: "claim",
                        title: "New Claim Request!",
                        body: `${fullName} has submitted a claim for your found '${itemName}'.`,
                        link: `my-profile.html?view=claims`, // UI will handle this
                        isRead: false,
                        createdAt: Date.now()
                    });
                }

                showToast('Claim submitted successfully! The finder will be notified.', 'success');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            } catch (error) {
                console.error("Error adding claim: ", error);
                showToast('Failed to submit claim. Please try again.', 'error');
            }
        });
    }
}
