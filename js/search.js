import { db } from './firebase-config.js';
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export async function initSearch() {
    let allReports = [];

    // Fetch reports from Firestore
    try {
        const q = query(collection(db, "reports"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            allReports.push({ id: doc.id, ...doc.data() });
        });
    } catch (error) {
        console.error("Error fetching reports: ", error);
    }

    function escapeAttribute(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    // Helper to generate Card HTML
    function createCardHTML(report) {
        const isLost = report.type === 'lost';
        const badgeClass = isLost ? 'badge-lost' : 'badge-found';
        const badgeText = isLost ? 'Lost' : 'Found';
        
        // Pick an icon based on category or default
        let icon = 'fa-box';
        if (report.category === 'electronics') icon = 'fa-mobile-screen-button';
        if (report.category === 'ids' || report.category === 'documents') icon = 'fa-id-card';
        if (report.category === 'keys' || report.category === 'accessories') icon = 'fa-key';
        if (report.category === 'clothing') icon = 'fa-shirt';
        
        // Add image if exists, else icon
        const imageHTML = report.imageUrl 
            ? `<img src="${escapeAttribute(report.imageUrl)}" alt="${escapeAttribute(report.itemName)}" style="width:100%; height:100%; object-fit:cover;">` 
            : `<i class="fa-solid ${icon}"></i>`;

        return `
            <div class="item-card" data-category="${report.category}" data-status="${report.type}">
                <div class="card-badge ${badgeClass}">${badgeText}</div>
                <div class="card-image">
                    ${imageHTML}
                </div>
                <div class="card-body">
                    <h3>${report.itemName}</h3>
                    <p class="location"><i class="fa-solid fa-location-dot"></i> ${report.location}</p>
                    <p class="date"><i class="fa-regular fa-calendar"></i> ${report.date}</p>
                    <a href="item-detail.html?id=${report.id}" class="btn-card ${isLost ? '' : 'card-btn-found'}">${isLost ? 'View Details' : 'Claim Item'}</a>
                </div>
            </div>
        `;
    }

    // ========================
    // HOME PAGE — Quick Search
    // ========================
    const homeSearchForm = document.getElementById('homeSearchForm');
    const homeSearchInput = document.getElementById('homeSearchInput');
    const homeSearchType = document.getElementById('homeSearchType');
    const homeItemGrid = document.querySelector('.search-home ~ main .item-grid');

    if (homeItemGrid) {
        // Render latest 4 items on home page initially
        homeItemGrid.innerHTML = allReports.slice(0, 4).map(createCardHTML).join('');

        if (homeSearchForm && homeSearchInput && homeSearchType) {
            homeSearchForm.addEventListener('submit', function (e) {
                e.preventDefault();

                const queryStr = homeSearchInput.value.trim().toLowerCase();
                const selectedType = homeSearchType.value;

                const filtered = allReports.filter(report => {
                    const title = report.itemName?.toLowerCase() || '';
                    const location = report.location?.toLowerCase() || '';
                    const type = report.type || '';

                    const matchesQuery = !queryStr || title.includes(queryStr) || location.includes(queryStr);
                    const matchesType = !selectedType || type === selectedType;
                    return matchesQuery && matchesType;
                });

                homeItemGrid.innerHTML = filtered.slice(0, 4).map(createCardHTML).join('');
                
                const noResults = document.getElementById('home-no-results');
                if (noResults) {
                    noResults.style.display = filtered.length ? 'none' : 'block';
                }
            });
        }
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
    const listingsItemGrid = document.querySelector('main .item-grid');

    if (!listingsSearchInput || !listingsItemGrid) return; // Not on the search page

    const ITEMS_PER_PAGE = 8;
    let currentPage = 1;
    let filteredReports = [...allReports];

    function filterCards() {
        const queryStr = listingsSearchInput.value.trim().toLowerCase();
        const statusVal = listingsStatusFilter.value;
        const categoryVal = listingsCategoryFilter.value;

        filteredReports = allReports.filter(report => {
            const title = report.itemName?.toLowerCase() || '';
            const location = report.location?.toLowerCase() || '';
            const type = report.type || '';
            const category = report.category || '';

            const matchesQuery = !queryStr || title.includes(queryStr) || location.includes(queryStr);
            const matchesStatus = statusVal === 'all' || type === statusVal;
            const matchesCategory = categoryVal === 'all' || category === categoryVal;

            return matchesQuery && matchesStatus && matchesCategory;
        });

        currentPage = 1;
        renderPage();
    }

    function renderPage() {
        const totalPages = Math.max(1, Math.ceil(filteredReports.length / ITEMS_PER_PAGE));
        if (currentPage > totalPages) currentPage = totalPages;

        const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIdx = startIdx + ITEMS_PER_PAGE;

        const visibleReports = filteredReports.slice(startIdx, endIdx);
        listingsItemGrid.innerHTML = visibleReports.map(createCardHTML).join('');

        // Apply staggering animation
        const renderedCards = listingsItemGrid.querySelectorAll('.item-card');
        renderedCards.forEach((card, i) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(15px)';
            setTimeout(() => {
                card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, i * 80);
        });

        // Update results count
        if (resultsCount) {
            const showing = Math.min(endIdx, filteredReports.length);
            resultsCount.textContent = filteredReports.length === 0
                ? 'No Results'
                : `Showing Results ${filteredReports.length > 0 ? startIdx + 1 : 0}–${showing} of ${filteredReports.length}`;
        }

        // Toggle no results message
        if (noResultsMsg) {
            noResultsMsg.classList.toggle('visible', filteredReports.length === 0);
        }

        renderPagination(totalPages);
    }

    function renderPagination(totalPages) {
        if (!pagination) return;

        pagination.innerHTML = '';

        const prevBtn = document.createElement('button');
        prevBtn.className = 'page-btn';
        prevBtn.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
        prevBtn.disabled = currentPage <= 1;
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) { currentPage--; renderPage(); }
        });
        pagination.appendChild(prevBtn);

        for (let i = 1; i <= totalPages; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `page-btn${i === currentPage ? ' active' : ''}`;
            pageBtn.textContent = i;
            pageBtn.addEventListener('click', () => {
                currentPage = i;
                renderPage();
                document.querySelector('.page-header')?.scrollIntoView({ behavior: 'smooth' });
            });
            pagination.appendChild(pageBtn);
        }

        const nextBtn = document.createElement('button');
        nextBtn.className = 'page-btn';
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

    listingsSearchInput.addEventListener('input', () => {
        filterCards();
    });

    listingsStatusFilter.addEventListener('change', filterCards);
    listingsCategoryFilter.addEventListener('change', filterCards);

    // Initial render
    renderPage();
}
