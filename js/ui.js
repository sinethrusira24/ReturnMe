export function initUI() {
    // 1. Highlight active link based on current page URL
    const currentLocation = location.href;
    const navLinks = document.querySelectorAll('.nav-links a');
    
    navLinks.forEach(link => {
        if(currentLocation.includes(link.getAttribute('href'))) {
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        }
    });

    // 2. Smooth scrolling for any anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
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

    // 3. Mobile Hamburger Menu Logic
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinksContainer = document.querySelector('.nav-links');
    const mobileMenuIcon = document.querySelector('.mobile-menu-btn i');

    if (mobileMenuBtn && navLinksContainer) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinksContainer.classList.toggle('mobile-active');
            if (navLinksContainer.classList.contains('mobile-active')) {
                mobileMenuIcon.classList.remove('fa-bars');
                mobileMenuIcon.classList.add('fa-xmark');
            } else {
                mobileMenuIcon.classList.remove('fa-xmark');
                mobileMenuIcon.classList.add('fa-bars');
            }
        });
    }

    // 4. Update Current Year in Footer
    const yearElement = document.getElementById('current-year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
}
