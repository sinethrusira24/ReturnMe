import { db, auth } from './firebase-config.js';
import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export async function initItemDetail() {
    // Get item ID from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const itemId = urlParams.get('id');

    if (!itemId) {
        document.querySelector('main').innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--text-muted);">Item not found.</p>';
        return;
    }

    const itemRef = doc(db, "reports", itemId);

    function renderItem(item) {
        const isLost = item.type === 'lost';
        const badgeClass = isLost ? 'badge-lost' : 'badge-found';
        const badgeText = isLost ? 'Lost' : 'Found';

        let icon = 'fa-box';
        if (item.category === 'electronics') icon = 'fa-mobile-screen-button';
        if (item.category === 'ids' || item.category === 'documents') icon = 'fa-id-card';
        if (item.category === 'keys' || item.category === 'accessories') icon = 'fa-key';
        if (item.category === 'clothing') icon = 'fa-shirt';

        const refId = `${isLost ? 'LST' : 'FND'}-${new Date(item.createdAt).getFullYear()}-${String(Math.abs(itemId.charCodeAt(0)) % 999).padStart(3, '0')}`;
        const reportDate = new Date(item.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const reporterInitial = (item.reporterName || 'User')[0].toUpperCase();
        let images = [];
        if (item.images && item.images.length > 0) {
            images = item.images;
        } else if (item.imageUrl) {
            images = [item.imageUrl];
        }

        let imageHTML = '';
        let swipeHint = '';
        if (images.length > 0) {
            if (images.length === 1) {
                imageHTML = `<div class="image-showcase"><img src="${images[0]}" alt="${item.itemName}" class="detail-image"></div>`;
            } else {
                imageHTML = `<div class="image-carousel">` + 
                    images.map(img => `<div class="carousel-slide"><img src="${img}" alt="${item.itemName}" class="detail-image"></div>`).join('') +
                    `</div>`;
                swipeHint = `<div class="swipe-hint"><i class="fa-solid fa-arrows-left-right"></i> Swipe to see more</div>`;
            }
        } else {
            imageHTML = `<div class="placeholder-icon-container"><i class="fa-solid ${icon}"></i></div>`;
        }

        const actionButtonText = isLost ? 'Report Found This Item' : 'Claim This Item';
        const actionButtonClass = isLost ? 'btn-found' : 'btn-found';
        const actionButtonLink = isLost ? `report-found.html?relatedLost=${itemId}` : `claim-item.html?id=${itemId}`;

        const detailCard = document.querySelector('.item-detail-card');
        if (detailCard) {
            detailCard.innerHTML = `
                <div class="item-image-card">
                    <div class="status-badge ${badgeClass}">${badgeText}</div>
                    ${imageHTML}
                    ${swipeHint}
                </div>

                <div class="item-info-card">
                    <div class="content-header">
                        <div class="header-tags">
                            <span class="ref-tag">#${refId}</span>
                            <span class="category-tag"><i class="fa-solid fa-tag"></i> ${item.category.charAt(0).toUpperCase() + item.category.slice(1)}</span>
                        </div>
                        <button class="btn-share-icon" id="shareBtn" aria-label="Share this listing"><i class="fa-solid fa-share-nodes"></i></button>
                    </div>
                    <h1 class="item-title">${item.itemName}</h1>

                    <div class="quick-facts">
                        <div class="fact-item">
                            <div class="fact-icon"><i class="fa-solid fa-location-dot"></i></div>
                            <div class="fact-text">
                                <span class="fact-label">${isLost ? 'Lost At' : 'Found At'}</span>
                                <span class="fact-value">${item.location}</span>
                            </div>
                        </div>
                        <div class="fact-item">
                            <div class="fact-icon"><i class="fa-regular fa-calendar"></i></div>
                            <div class="fact-text">
                                <span class="fact-label">Date & Time</span>
                                <span class="fact-value">${reportDate}</span>
                            </div>
                        </div>
                    </div>

                    <div class="item-story">
                        <h3>Description</h3>
                        <p>${item.description}</p>
                    </div>

                    <div class="interaction-footer">
                        <div class="user-brief">
                            <div class="user-avatar">${reporterInitial}</div>
                            <div class="user-info">
                                <span class="user-name">${item.reporterName}</span>
                                <a href="tel:${item.phone}" class="user-phone"><i class="fa-solid fa-phone"></i> ${item.phone}</a>
                            </div>
                        </div>
                        <div class="action-group">
                            <a href="${actionButtonLink}" class="btn-primary-action ${actionButtonClass}">
                                <i class="fa-solid fa-${isLost ? 'magnifying-glass' : 'shield-halved'}"></i> 
                                <span>${actionButtonText}</span>
                            </a>
                            <button class="btn-icon-secondary" id="contactBtn" title="Chat Privately">
                                <i class="fa-solid fa-comments"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;

            document.getElementById('shareBtn')?.addEventListener('click', () => {
                const url = window.location.href;
                if (navigator.share) {
                    navigator.share({ title: item.itemName, url: url });
                } else {
                    alert('Share URL: ' + url);
                }
            });

            document.getElementById('contactBtn')?.addEventListener('click', () => {
                window.location.href = `personal-chat.html?id=${itemId}`;
            });
        }
    }

    try {
        onSnapshot(itemRef, (itemDoc) => {
            if (!itemDoc.exists()) {
                document.querySelector('main').innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--text-muted);">Item not found.</p>';
                return;
            }
            renderItem(itemDoc.data());
        }, (error) => {
            console.error("Error listening to item details:", error);
            document.querySelector('main').innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--text-muted);">Error loading item details. Please try again.</p>';
        });
    } catch (error) {
        console.error("Error setting up item listener:", error);
        document.querySelector('main').innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--text-muted);">Error loading item details. Please try again.</p>';
    }

}
