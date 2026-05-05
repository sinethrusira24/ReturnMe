import { showToast } from './toast.js';

export function initForms() {
    // --- Report Lost Form Handler ---
    const reportLostForm = document.getElementById('reportLostForm');
    if (reportLostForm) {
        reportLostForm.addEventListener('submit', function (e) {
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

            showToast('Lost item report submitted successfully!', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1200);
        });
    }

    // --- Report Found Form Handler ---
    const reportFoundForm = document.getElementById('reportFoundForm');
    if (reportFoundForm) {
        reportFoundForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const fullName = document.getElementById('fullName')?.value.trim();
            const email = document.getElementById('email')?.value.trim();
            const phone = document.getElementById('phone')?.value.trim();
            const itemName = document.getElementById('itemName')?.value.trim();
            const itemCategory = document.getElementById('itemCategory')?.value;
            const dateFound = document.getElementById('dateFound')?.value;
            const locationFound = document.getElementById('locationFound')?.value.trim();
            const description = document.getElementById('description')?.value.trim();

            if (!fullName || !email || !phone || !itemName || !itemCategory || !dateFound || !locationFound || !description) {
                showToast('Please fill in all required fields.', 'error');
                return;
            }

            showToast('Found item report submitted successfully!', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1200);
        });
    }

    // --- Claim Form Handler ---
    const claimForm = document.getElementById('claimForm');
    if (claimForm) {
        claimForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const fullName = document.getElementById('fullName')?.value.trim();
            const studentId = document.getElementById('studentId')?.value.trim();
            const email = document.getElementById('email')?.value.trim();
            const phone = document.getElementById('phone')?.value.trim();
            const uniqueDetails = document.getElementById('uniqueDetails')?.value.trim();

            if (!fullName || !studentId || !email || !phone || !uniqueDetails) {
                showToast('Please fill in all required fields.', 'error');
                return;
            }

            showToast('Claim submitted successfully! The finder will be notified.', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        });
    }
}
