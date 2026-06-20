import { db, auth } from './firebase-config.js';
import { collection, addDoc, query, where, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

export function initChat() {
    const chatForm = document.getElementById('chatForm');
    const chatContainer = document.querySelector('.chat-container');

    if (!chatForm || !chatContainer) return;

    // Get item ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const itemId = urlParams.get('id');

    if (!itemId) {
        chatContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted);">No item selected for chat.</p>';
        return;
    }

    let currentUserId = null;
    let currentUserName = null;

    // Check auth state
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUserId = user.uid;
            currentUserName = user.displayName || user.email.split('@')[0];
        }
    });

    // Load messages from Firestore in real-time
    const messagesRef = collection(db, 'chats');
    const q = query(
        messagesRef,
        where('itemId', '==', itemId),
        orderBy('timestamp', 'asc')
    );

    onSnapshot(q, (snapshot) => {
        chatContainer.innerHTML = ''; // Clear previous messages
        snapshot.forEach((doc) => {
            const msg = doc.data();
            const isOwn = msg.userId === currentUserId;
            
            const messageDiv = document.createElement('div');
            messageDiv.classList.add('chat-message', isOwn ? 'sent' : 'received');

            const bubble = document.createElement('div');
            bubble.className = 'chat-bubble';

            const meta = document.createElement('div');
            meta.className = 'chat-meta';
            const timeStr = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            meta.innerHTML = `
                <span class="chat-author">${msg.senderName || 'Anonymous'}</span>
                <span class="chat-time">${timeStr}</span>
            `;

            const msgP = document.createElement('p');
            msgP.textContent = msg.text;

            bubble.appendChild(meta);
            bubble.appendChild(msgP);

            const avatar = document.createElement('div');
            avatar.className = 'chat-avatar';
            avatar.style.background = isOwn ? '#3b82f6' : '#10b981';
            avatar.textContent = (msg.senderName || 'User')[0].toUpperCase();

            messageDiv.appendChild(bubble);
            messageDiv.appendChild(avatar);

            chatContainer.appendChild(messageDiv);
        });
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }, (error) => {
        console.error('Error loading messages:', error);
        chatContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted);">Unable to load chat.</p>';
    });

    // Send message
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const inputField = chatForm.querySelector('input');
        const messageText = inputField.value.trim();

        if (!messageText) {
            alert('Please enter a message');
            return;
        }

        if (!currentUserId) {
            alert('Please log in to send messages');
            return;
        }

        try {
            await addDoc(collection(db, 'chats'), {
                itemId: itemId,
                userId: currentUserId,
                senderName: currentUserName,
                text: messageText,
                timestamp: Date.now()
            });
            inputField.value = '';
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message. Please try again.');
        }
    });
}
