import { db, auth } from './firebase-config.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export async function initItemDetail() {
    // Get item ID from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const itemId = urlParams.get('id');

    if (!itemId) {
        document.querySelector('main').innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--text-muted);">Item not found.</p>';
        return;
    }

    try {
        // Fetch item from Firestore
        const itemDoc = await getDoc(doc(db, "reports", itemId));

        if (!itemDoc.exists()) {
            document.querySelector('main').innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--text-muted);">Item not found.</p>';
            return;
        }

        const item = itemDoc.data();
        const isLost = item.type === 'lost';
        const badgeClass = isLost ? 'badge-lost' : 'badge-found';
        const badgeText = isLost ? 'Lost' : 'Found';

        // Determine icon based on category
        let icon = 'fa-box';
        if (item.category === 'electronics') icon = 'fa-mobile-screen-button';
        if (item.category === 'ids' || item.category === 'documents') icon = 'fa-id-card';
        if (item.category === 'keys' || item.category === 'accessories') icon = 'fa-key';
        if (item.category === 'clothing') icon = 'fa-shirt';

        // Generate reference ID
        const refId = `${isLost ? 'LST' : 'FND'}-${new Date(item.createdAt).getFullYear()}-${String(Math.abs(itemId.charCodeAt(0)) % 999).padStart(3, '0')}`;

        // Format date
        const reportDate = new Date(item.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Get reporter avatar initial
        const reporterInitial = (item.reporterName || 'User')[0].toUpperCase();

        // Build image HTML
        const imageHTML = item.imageUrl 
            ? `<img src="${item.imageUrl}" alt="${item.itemName}" style="width:100%; height:100%; object-fit:cover;">`
            : `<i class="fa-solid ${icon}" style="font-size: 4rem; color: var(--color-primary);"></i>`;

        // Determine action button text and link
        const actionButtonText = isLost ? 'Report Found This Item' : 'Claim This Item';
        const actionButtonClass = isLost ? 'btn-found' : 'btn-found';
        const actionButtonLink = isLost ? `report-found.html?relatedLost=${itemId}` : `claim-item.html?id=${itemId}`;

        // Update the detail card HTML
        const detailCard = document.querySelector('.item-detail-card');
        if (detailCard) {
            detailCard.innerHTML = `
                <div class="item-image-side">
                    <div class="card-badge ${badgeClass}">${badgeText}</div>
                    <div class="main-image-container">
                        ${imageHTML}
                    </div>
                </div>

                <div class="item-info-side">
                    <div class="item-header-info">
                        <div class="header-top-row">
                            <span class="item-reference">Ref ID: #${refId}</span>
                            <button class="btn-share" id="shareBtn" aria-label="Share this listing"><i class="fa-solid fa-share-nodes"></i> Share</button>
                        </div>
                        <h1>${item.itemName}</h1>
                    </div>

                    <div class="reporter-info">
                        <h3>Reported By</h3>
                        <div class="reporter-profile">
                            <div class="reporter-avatar">${reporterInitial}</div>
                            <div class="reporter-details">
                                <span class="reporter-name">${item.reporterName}</span>
                                <a href="tel:${item.phone}" class="reporter-contact"><i class="fa-solid fa-phone"></i> ${item.phone}</a>
                            </div>
                        </div>
                    </div>

                    <ul class="item-metadata">
                        <li>
                            <i class="fa-solid fa-location-dot"></i>
                            <div>
                                <strong>${isLost ? 'Location Lost' : 'Location Found'}</strong>
                                <span>${item.location}</span>
                            </div>
                        </li>
                        <li>
                            <i class="fa-regular fa-calendar"></i>
                            <div>
                                <strong>Date & Time</strong>
                                <span>${reportDate}</span>
                            </div>
                        </li>
                        <li>
                            <i class="fa-solid fa-tag"></i>
                            <div>
                                <strong>Category</strong>
                                <span>${item.category.charAt(0).toUpperCase() + item.category.slice(1)}</span>
                            </div>
                        </li>
                    </ul>

                    <div class="item-description">
                        <h3>Description</h3>
                        <p>${item.description}</p>
                    </div>

                    <div class="item-actions">
                        <a href="${actionButtonLink}" class="btn-action ${actionButtonClass}">
                            <i class="fa-solid fa-${isLost ? 'magnifying-glass' : 'shield-halved'}"></i> ${actionButtonText}
                        </a>
                        <button class="btn-action btn-secondary" id="contactBtn">
                            <i class="fa-solid fa-envelope"></i> Contact Reporter
                        </button>
                    </div>
                </div>
            `;

            // Share button
            document.getElementById('shareBtn')?.addEventListener('click', () => {
                const url = window.location.href;
                if (navigator.share) {
                    navigator.share({ title: item.itemName, url: url });
                } else {
                    alert('Share URL: ' + url);
                }
            });

            // Contact button
            document.getElementById('contactBtn')?.addEventListener('click', () => {
                window.location.href = `mailto:${item.email}?subject=Regarding your ${isLost ? 'lost' : 'found'} item: ${item.itemName}`;
            });
        }

    } catch (error) {
        console.error("Error loading item details:", error);
        document.querySelector('main').innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--text-muted);">Error loading item details. Please try again.</p>';
    }
}
