export function initSearch() {
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
}
