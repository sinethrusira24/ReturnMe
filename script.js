/**
 * Modern Toast Notification System
 * Replaces standard alert() with smooth, sliding UI notifications.
 * * @param {string} message - The text to display
 * @param {string} type - 'success', 'info', or 'error'
 */
function triggerAlert(message, type = 'info') {
    const container = document.getElementById('toast-container');
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Assign correct icon based on type
    let iconClass = 'fa-circle-info'; // Default info
    if (type === 'success') iconClass = 'fa-circle-check';
    if (type === 'error') iconClass = 'fa-circle-xmark';

    toast.innerHTML = `
        <i class="fa-solid ${iconClass}" style="color: var(--${type === 'info' ? 'primary' : type}-color);"></i>
        <span>${message}</span>
    `;

    // Append to container
    container.appendChild(toast);

    // Trigger animation (slight delay to allow DOM insertion)
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        // Wait for CSS transition to finish before removing from DOM
        setTimeout(() => {
            if (container.contains(toast)) {
                container.removeChild(toast);
            }
        }, 400);
    }, 3000);
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
    });
});

// --- Form Handling & Validation ---

function handleLogin(event) {
    event.preventDefault(); // Prevent default form submission
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Basic frontend validation simulation
    if (email === "" || password === "") {
        triggerAlert("Please fill in all fields.", "error");
        return;
    }

    if (!email.includes("@")) {
        triggerAlert("Please enter a valid campus email address.", "error");
        return;
    }

    // Simulate successful login
    triggerAlert("Logging you in...", "success");
    
    // In a real app, you would verify with your backend here. 
    // For now, we redirect to the dashboard after a short delay.
    setTimeout(() => {
        window.location.href = "index.html";
    }, 1500);
}

function handleRegister(event) {
    event.preventDefault();

    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const role = document.getElementById('role').value;

    if (role === "") {
        triggerAlert("Please select your role (Student or Staff).", "error");
        return;
    }

    if (password.length < 6) {
        triggerAlert("Password must be at least 6 characters long.", "error");
        return;
    }

    // Simulate successful registration
    triggerAlert("Account created successfully! Redirecting...", "success");

    setTimeout(() => {
        window.location.href = "login.html";
    }, 2000);
}

// Generic form handler for the new pages
function handleFormSubmit(event, successMessage) {
    event.preventDefault(); // Stop page reload
    
    // Show the custom alert
    triggerAlert(successMessage, 'success');

    // Reset the form inputs
    event.target.reset();

    // Optional: Redirect to dashboard after 2 seconds
    setTimeout(() => {
        window.location.href = "index.html";
    }, 2000);
}