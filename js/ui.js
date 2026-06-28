export function initUI() {
    // Auto-inject missing structural elements
    if (!document.querySelector('.mobile-overlay')) {
        const overlay = document.createElement('div');
        overlay.className = 'mobile-overlay';
        const navContainer = document.querySelector('.nav-container');
        if(navContainer) {
            navContainer.insertBefore(overlay, document.querySelector('.mobile-menu-btn'));
        }
    }
    
    const navLinksContainerElement = document.querySelector('.nav-links');
    if (navLinksContainerElement && !document.querySelector('.nav-indicator')) {
        const indicator = document.createElement('div');
        indicator.className = 'nav-indicator';
        navLinksContainerElement.appendChild(indicator);
    }

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
    const mobileOverlay = document.querySelector('.mobile-overlay');

    if (mobileMenuBtn && navLinksContainer) {
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
        
        const toggleMenu = () => {
            const isOpen = navLinksContainer.classList.toggle('mobile-active');
            mobileMenuBtn.setAttribute('aria-expanded', String(isOpen));
            if(mobileOverlay) mobileOverlay.classList.toggle('active', isOpen);
            
            if (isOpen) {
                mobileMenuIcon.classList.remove('fa-bars');
                mobileMenuIcon.classList.add('fa-xmark');
            } else {
                mobileMenuIcon.classList.remove('fa-xmark');
                mobileMenuIcon.classList.add('fa-bars');
            }
        };

        mobileMenuBtn.addEventListener('click', toggleMenu);
        if(mobileOverlay) mobileOverlay.addEventListener('click', toggleMenu);

        navLinksContainer.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                if (navLinksContainer.classList.contains('mobile-active')) {
                    toggleMenu();
                }
            });
        });
    }

    // Smart Navbar logic
    let lastScrollY = window.scrollY;
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', () => {
        if (!navbar) return;
        const currentScrollY = window.scrollY;
        
        if (currentScrollY > 50) {
            navbar.classList.add('navbar-shrunk');
        } else {
            navbar.classList.remove('navbar-shrunk');
        }
        
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
            navbar.classList.add('navbar-hidden');
        } else {
            navbar.classList.remove('navbar-hidden');
        }
        
        lastScrollY = currentScrollY;
    });

    // Animated indicator logic
    const navLinksList = document.querySelectorAll('.nav-links li:not(.mobile-only)');
    const indicator = document.querySelector('.nav-indicator');
    
    if (navLinksList.length && indicator && window.innerWidth > 768) {
        const updateIndicator = (el) => {
            const rect = el.getBoundingClientRect();
            const parentRect = el.parentElement.getBoundingClientRect();
            indicator.style.width = `${rect.width}px`;
            indicator.style.transform = `translateX(${rect.left - parentRect.left}px)`;
            indicator.style.opacity = '1';
        };
        
        navLinksList.forEach(li => {
            li.addEventListener('mouseenter', (e) => {
                updateIndicator(e.currentTarget);
            });
        });
        
        document.querySelector('.nav-links').addEventListener('mouseleave', () => {
            const activeLink = document.querySelector('.nav-links a.active');
            if (activeLink) {
                updateIndicator(activeLink.parentElement);
            } else {
                indicator.style.opacity = '0';
            }
        });
        
        // Initialize position
        setTimeout(() => {
            const activeLink = document.querySelector('.nav-links a.active');
            if (activeLink) {
                updateIndicator(activeLink.parentElement);
            }
        }, 100);
        
        window.addEventListener('resize', () => {
            if (window.innerWidth <= 768) {
                indicator.style.opacity = '0';
            } else {
                const activeLink = document.querySelector('.nav-links a.active');
                if (activeLink) {
                    updateIndicator(activeLink.parentElement);
                }
            }
        });
    }

    // 4. Update Current Year in Footer
    const yearElement = document.getElementById('current-year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }

    // 5. Share Button Logic
    const shareBtn = document.getElementById('shareBtn');
    if (shareBtn) {
        shareBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(window.location.href);
                
                // We'll dynamically import showToast to avoid circular dependencies 
                // if ui.js is imported in many places
                import('./toast.js').then(module => {
                    module.showToast('Link copied to clipboard!', 'success');
                });
            } catch (err) {
                console.error('Failed to copy: ', err);
            }
        });
    }
}
