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

    // 3. Mobile Hamburger Menu Logic
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

    // 4. Discussion Board Chat Logic
    const chatForm = document.getElementById('chatForm');
    const chatContainer = document.querySelector('.chat-container');

    if (chatForm && chatContainer) {
        chatForm.addEventListener('submit', function(e) {
            e.preventDefault(); // Prevents the page from refreshing
            
            const inputField = chatForm.querySelector('input');
            const messageText = inputField.value.trim();

            if (messageText !== "") {
                // 1. Get the current time for the timestamp
                const now = new Date();
                let hours = now.getHours();
                let minutes = now.getMinutes();
                const ampm = hours >= 12 ? 'PM' : 'AM';
                hours = hours % 12;
                hours = hours ? hours : 12; 
                minutes = minutes < 10 ? '0' + minutes : minutes;
                const timeString = `Today at ${hours}:${minutes} ${ampm}`;

                // 2. Create the new chat message HTML element
                const newMessage = document.createElement('div');
                newMessage.classList.add('chat-message', 'sent'); // 'sent' aligns it to the right
                
                newMessage.innerHTML = `
                    <div class="chat-bubble">
                        <div class="chat-meta">
                            <span class="chat-author">You</span>
                            <span class="chat-time">${timeString}</span>
                        </div>
                        <p>${messageText}</p>
                    </div>
                    <div class="chat-avatar user-av" style="background: #3b82f6;">ME</div>
                `;

                // 3. Add the new message to the chat window
                chatContainer.appendChild(newMessage);

                // 4. Clear the input box
                inputField.value = '';

                // 5. Automatically scroll to the bottom to see the new message
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
        });
    }

    const yearElement = document.getElementById('current-year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }

    const homeSearchForm = document.getElementById('homeSearchForm');
    const homeSearchInput = document.getElementById('homeSearchInput');
    const homeSearchType = document.getElementById('homeSearchType');
    const itemCards = document.querySelectorAll('.item-card');

    if (homeSearchForm && homeSearchInput && homeSearchType && itemCards.length) {
        homeSearchForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const query = homeSearchInput.value.trim().toLowerCase();
            const selectedType = homeSearchType.value;

            let found = false;
            itemCards.forEach(card => {
                const title = card.querySelector('h3')?.textContent.toLowerCase() || '';
                const location = card.querySelector('.location')?.textContent.toLowerCase() || '';
                const badge = card.querySelector('.card-badge')?.textContent.toLowerCase() || '';

                const matchesQuery = !query || title.includes(query) || location.includes(query);
                const matchesType = !selectedType || badge === selectedType;
                const visible = matchesQuery && matchesType;

                card.style.display = visible ? 'block' : 'none';
                if (visible) found = true;
            });

            const noResults = document.getElementById('home-no-results');
            if (noResults) {
                noResults.style.display = found ? 'none' : 'block';
            }
        });
    }

    const loginForm = document.getElementById('loginForm');
    const loginFeedback = document.getElementById('loginFeedback');
    const passwordInput = document.getElementById('password');
    const togglePasswordButtons = document.querySelectorAll('.toggle-password');

    if (loginForm) {
        const setFeedback = (message, type) => {
            if (!loginFeedback) return;
            loginFeedback.textContent = message;
            loginFeedback.classList.toggle('error', type === 'error');
            loginFeedback.classList.toggle('success', type === 'success');
        };

        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const email = loginForm.email.value.trim();
            const password = loginForm.password.value.trim();
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!email || !password) {
                setFeedback('Please enter both email and password.', 'error');
                if (!email) {
                    document.getElementById('email').focus();
                } else {
                    passwordInput?.focus();
                }
                return;
            }

            if (!emailPattern.test(email)) {
                setFeedback('Enter a valid university email address.', 'error');
                document.getElementById('email').focus();
                return;
            }

            if (password.length < 8) {
                setFeedback('Password must be at least 8 characters.', 'error');
                passwordInput?.focus();
                return;
            }

            setFeedback('Login successful. Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 800);
        });
    }

    if (togglePasswordButtons.length) {
        togglePasswordButtons.forEach(button => {
            const passwordField = button.closest('.password-field');
            const input = passwordField?.querySelector('input');
            const icon = button.querySelector('i');

            if (!input || !icon) return;

            button.addEventListener('click', () => {
                const isPasswordVisible = input.type === 'text';
                input.type = isPasswordVisible ? 'password' : 'text';
                icon.classList.toggle('fa-eye', isPasswordVisible);
                icon.classList.toggle('fa-eye-slash', !isPasswordVisible);
                button.setAttribute('aria-label', isPasswordVisible ? 'Show password' : 'Hide password');
            });
        });
    }

});