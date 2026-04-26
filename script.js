// --- DOM Event Listeners ---
// This wrapper ensures the HTML is fully loaded before JS tries to interact with it
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Highlight active link based on current page URL
    const currentLocation = location.href;
    const navLinks = document.querySelectorAll('.nav-links a');
    
    navLinks.forEach(link => {
        if(currentLocation.includes(link.getAttribute('href'))) {
            // Remove 'active' from all links, then add it to the matching one
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        }
    });

    // 2. Smooth scrolling for any anchor links (links starting with '#')
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            
            // Only attempt scroll if it's a valid ID
            if(targetId !== "#") {
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

});

// --- Mobile Hamburger Menu Logic ---
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinksContainer = document.querySelector('.nav-links');
    const mobileMenuIcon = document.querySelector('.mobile-menu-btn i');

    if (mobileMenuBtn && navLinksContainer) {
        mobileMenuBtn.addEventListener('click', () => {
            // Toggle the menu visibility
            navLinksContainer.classList.toggle('mobile-active');
            
            // Swap the icon between hamburger (bars) and close (xmark)
            if (navLinksContainer.classList.contains('mobile-active')) {
                mobileMenuIcon.classList.remove('fa-bars');
                mobileMenuIcon.classList.add('fa-xmark');
            } else {
                mobileMenuIcon.classList.remove('fa-xmark');
                mobileMenuIcon.classList.add('fa-bars');
            }
        });
    }