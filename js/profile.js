// ===== Profile Page Interactivity =====

document.addEventListener('DOMContentLoaded', () => {

    // --- Animated stat counters ---
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

    // --- Tabs ---
    const tabs = document.querySelectorAll('.ptab');
    const tabContents = document.querySelectorAll('.ptab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            const target = document.getElementById('tab-' + tab.dataset.tab);
            if (target) target.classList.add('active');
        });
    });

    // --- Filter pills ---
    const pills = document.querySelectorAll('.pill-btn');
    const reportCards = document.querySelectorAll('.preport-card');

    pills.forEach(pill => {
        pill.addEventListener('click', () => {
            pills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            const filter = pill.dataset.filter;
            reportCards.forEach(card => {
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

    // --- Save settings toast ---
    const saveBtn = document.querySelector('.btn-save-settings');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            saveBtn.textContent = '✓ Saved!';
            saveBtn.style.background = 'var(--color-found)';
            setTimeout(() => {
                saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Changes';
                saveBtn.style.background = '';
            }, 2000);
        });
    }
});
