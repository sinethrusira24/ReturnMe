import { showToast } from './toast.js';
import { db, auth, storage } from './firebase-config.js';
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

export function initForms() {
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

            try {
                await auth.authStateReady();
                const user = auth.currentUser;
                if (!user) {
                    showToast('You must be logged in to submit a report.', 'error');
                    window.location.href = 'login.html';
                    return;
                }

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
                    createdAt: Date.now(), // Use local timestamp to prevent sync delays
                    reporterId: user ? user.uid : null
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

                await addDoc(collection(db, "reports"), {
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
                    createdAt: Date.now(), // Use local timestamp to prevent sync delays
                    reporterId: user ? user.uid : null
                });

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
                await addDoc(collection(db, "claims"), {
                    itemId: itemId || "unknown",
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
