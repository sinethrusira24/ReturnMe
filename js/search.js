export function initSearch() {
    // ========================
    // HOME PAGE — Quick Search
    // ========================
    const homeSearchForm = document.getElementById('homeSearchForm');
    const homeSearchInput = document.getElementById('homeSearchInput');
    const homeSearchType = document.getElementById('homeSearchType');
    const homeItemCards = document.querySelectorAll('#homeItemGrid .item-card, .item-grid .item-card');

    if (homeSearchForm && homeSearchInput && homeSearchType) {
        homeSearchForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const query = homeSearchInput.value.trim().toLowerCase();
            const selectedType = homeSearchType.value;

            let found = false;
            homeItemCards.forEach(card => {
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

    // =======================================
    // SEARCH LISTINGS PAGE — Filter & Paginate
    // =======================================
    const listingsSearchInput = document.getElementById('listingsSearchInput');
    const listingsStatusFilter = document.getElementById('listingsStatusFilter');
    const listingsCategoryFilter = document.getElementById('listingsCategoryFilter');
    const listingsSearchBtn = document.getElementById('listingsSearchBtn');
    const resultsCount = document.getElementById('resultsCount');
    const noResultsMsg = document.getElementById('listingsNoResults');
    const pagination = document.getElementById('listingsPagination');

    if (!listingsSearchInput) return; // Not on the search page

    const allCards = Array.from(document.querySelectorAll('.item-grid .item-card'));
    const ITEMS_PER_PAGE = 4; // Adjust this for pagination demonstration
    let currentPage = 1;
    let filteredCards = [...allCards];

    function filterCards() {
        const query = listingsSearchInput.value.trim().toLowerCase();
        const statusVal = listingsStatusFilter.value;
        const categoryVal = listingsCategoryFilter.value;

        filteredCards = allCards.filter(card => {
            const title = card.querySelector('h3')?.textContent.toLowerCase() || '';
            const location = card.querySelector('.location')?.textContent.toLowerCase() || '';
            const badge = card.querySelector('.card-badge')?.textContent.trim().toLowerCase() || '';
            const category = card.dataset.category || '';

            const matchesQuery = !query || title.includes(query) || location.includes(query);
            const matchesStatus = statusVal === 'all' || badge === statusVal;
            const matchesCategory = categoryVal === 'all' || category === categoryVal;

            return matchesQuery && matchesStatus && matchesCategory;
        });

        currentPage = 1;
        renderPage();
    }

    function renderPage() {
        const totalPages = Math.max(1, Math.ceil(filteredCards.length / ITEMS_PER_PAGE));
        if (currentPage > totalPages) currentPage = totalPages;

        const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIdx = startIdx + ITEMS_PER_PAGE;

        // Hide all, then show current page
        allCards.forEach(card => {
            card.style.display = 'none';
            card.style.opacity = '0';
            card.style.transform = 'translateY(15px)';
        });

        const visibleCards = filteredCards.slice(startIdx, endIdx);
        visibleCards.forEach((card, i) => {
            card.style.display = '';
            // Staggered animation
            setTimeout(() => {
                card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, i * 80);
        });

        // Update results count
        if (resultsCount) {
            const showing = Math.min(endIdx, filteredCards.length);
            resultsCount.textContent = filteredCards.length === 0
                ? 'No Results'
                : `Showing Results ${startIdx + 1}–${showing} of ${filteredCards.length}`;
        }

        // Toggle no results message
        if (noResultsMsg) {
            noResultsMsg.classList.toggle('visible', filteredCards.length === 0);
        }

        // Render pagination
        renderPagination(totalPages);
    }

    function renderPagination(totalPages) {
        if (!pagination) return;

        pagination.innerHTML = '';

        // Previous button
        const prevBtn = document.createElement('button');
        prevBtn.className = 'page-btn';
        prevBtn.id = 'pagePrev';
        prevBtn.setAttribute('aria-label', 'Previous page');
        prevBtn.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
        prevBtn.disabled = currentPage <= 1;
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) { currentPage--; renderPage(); }
        });
        pagination.appendChild(prevBtn);

        // Page number buttons
        for (let i = 1; i <= totalPages; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `page-btn${i === currentPage ? ' active' : ''}`;
            pageBtn.setAttribute('data-page', i);
            pageBtn.setAttribute('aria-label', `Page ${i}`);
            pageBtn.textContent = i;
            if (i === currentPage) pageBtn.setAttribute('aria-current', 'page');
            pageBtn.addEventListener('click', () => {
                currentPage = i;
                renderPage();
                // Scroll to top of results
                document.querySelector('.item-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
            pagination.appendChild(pageBtn);
        }

        // Next button
        const nextBtn = document.createElement('button');
        nextBtn.className = 'page-btn';
        nextBtn.id = 'pageNext';
        nextBtn.setAttribute('aria-label', 'Next page');
        nextBtn.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
        nextBtn.disabled = currentPage >= totalPages;
        nextBtn.addEventListener('click', () => {
            if (currentPage < totalPages) { currentPage++; renderPage(); }
        });
        pagination.appendChild(nextBtn);
    }

    // Event listeners
    listingsSearchBtn.addEventListener('click', (e) => {
        e.preventDefault();
        filterCards();
    });

    // Real-time filtering as user types
    listingsSearchInput.addEventListener('input', () => {
        filterCards();
    });

    listingsStatusFilter.addEventListener('change', filterCards);
    listingsCategoryFilter.addEventListener('change', filterCards);

    // Initial render
    renderPage();
}
