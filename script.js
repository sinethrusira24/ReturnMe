// --- Modern Toast Notification System ---
/**
 * Modern Vibrant Toast Notification
 * Displays a colorful, non-blocking notification at the bottom-right.
 * @param {string} message - The text to display.
 * @param {string} type - 'v-info', 'v-success', or 'v-error'.
 */
function triggerVibrantAlert(message, type = 'v-info') {
    const container = document.getElementById('vibrant-toast-container');
    if (!container) {
        console.error("Toast container ('vibrant-toast-container') not found.");
        return;
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `modern-toast ${type}`;
    
    // Assign correct modern icon based on type
    let iconClass = 'fa-circle-info'; // Default: Info
    if (type === 'v-success') iconClass = 'fa-circle-check';
    if (type === 'v-error') iconClass = 'fa-circle-xmark';

    toast.innerHTML = `
        <i class="fa-solid ${iconClass}"></i>
        <span>${message}</span>
    `;

    // Append to container
    container.appendChild(toast);

    // Trigger animation (slight delay for DOM insertion)
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    // Automaticaly remove after 3.5 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        // Wait for animation to finish before removal
        setTimeout(() => {
            if (container.contains(toast)) {
                container.removeChild(toast);
            }
        }, 400); // Matches CSS transition time
    }, 3500);
}
// Active navbar link highlight (UI only, no logic change)
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', function () {
        document.querySelectorAll('.nav-links a').forEach(l => l.classList.remove('active'));
        this.classList.add('active');
    });
});
// Example: Add smooth scrolling for anchor links if you add them later
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    }

    // --- Wire up demo interactions ---
    // Make the direct 'View Details' buttons on cards link to item-detail.html
    const viewDetailBtns = document.querySelectorAll('.modern-view-btn, .modern-action-btn');
    viewDetailBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Let the regular link function continue (or link manually if it's not an <a> tag)
            if (!e.target.closest('a')) {
                window.location.href = 'item-detail.html';
            }
        });
    });

    // Make the login button trigger alert first for demo
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.onsubmit = (e) => {
            e.preventDefault();
            triggerVibrantAlert("Logging you in... Redirecting to dashboard.", "v-success");
            setTimeout(() => { window.location.href = "index.html"; }, 1500);
        };
    }
});