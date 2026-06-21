import { db, auth } from './firebase-config.js';
import { collection, addDoc, query, orderBy, onSnapshot, getDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { showToast } from './toast.js';

export function initChat() {
    const chatForm = document.getElementById('chatForm');
    const chatContainer = document.getElementById('chatContainer');

    if (!chatForm || !chatContainer) return;

    const urlParams = new URLSearchParams(window.location.search);
    const itemId = urlParams.get('id');

    if (!itemId) return;

    let reportOwnerId = null;
    let reportOwnerName = null;

    // Fetch report to know the owner
    getDoc(doc(db, "reports", itemId)).then(docSnap => {
        if (docSnap.exists()) {
            reportOwnerId = docSnap.data().reporterId;
            reportOwnerName = docSnap.data().reporterName || 'Anonymous';
        }
    });

    const messagesRef = collection(db, "reports", itemId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    onSnapshot(q, (snapshot) => {
        chatContainer.innerHTML = '';
        snapshot.forEach((doc) => {
            const msg = doc.data();
            renderMessage(msg);
        });
        chatContainer.scrollTop = chatContainer.scrollHeight;
    });

    chatForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const inputField = chatForm.querySelector('input');
        const messageText = inputField.value.trim();

        if (!messageText) return;
        
        const user = auth.currentUser;
        if (!user) {
            showToast('You must be logged in to post a message.', 'error');
            return;
        }

        try {
            await addDoc(messagesRef, {
                text: messageText,
                senderId: user.uid,
                senderName: user.displayName || user.email.split('@')[0],
                createdAt: Date.now()
            });
            inputField.value = '';
        } catch (error) {
            console.error("Error sending message:", error);
            showToast('Failed to send message.', 'error');
        }
    });

    function renderMessage(msg) {
        const user = auth.currentUser;
        const isMe = user && user.uid === msg.senderId;
        const isOwner = reportOwnerId && msg.senderId === reportOwnerId;

        const date = msg.createdAt ? new Date(msg.createdAt) : new Date();
        let hours = date.getHours();
        let minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; 
        minutes = minutes < 10 ? '0' + minutes : minutes;
        
        // Simple day formatting
        const isToday = new Date().toDateString() === date.toDateString();
        const dateStr = isToday ? 'Today' : date.toLocaleDateString();
        const timeString = `${dateStr} at ${hours}:${minutes} ${ampm}`;

        const newMessage = document.createElement('div');
        newMessage.classList.add('chat-message', isMe ? 'sent' : 'received');
        
        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble';

        const meta = document.createElement('div');
        meta.className = 'chat-meta';
        
        let authorHtml = `<span class="chat-author">${isMe ? 'You' : msg.senderName}</span>`;
        if (isOwner && !isMe) {
            authorHtml = `<span class="chat-author reporter-badge">${msg.senderName} (Finder)</span>`;
        } else if (isOwner && isMe) {
            authorHtml = `<span class="chat-author reporter-badge">You (Finder)</span>`;
        }

        meta.innerHTML = `
            ${authorHtml}
            <span class="chat-time">${timeString}</span>
        `;

        const msgP = document.createElement('p');
        msgP.textContent = msg.text;

        bubble.appendChild(meta);
        bubble.appendChild(msgP);

        const avatar = document.createElement('div');
        avatar.className = `chat-avatar ${isOwner ? 'reporter-av' : 'user-av'}`;
        if (isMe) avatar.style.background = '#3b82f6';
        avatar.textContent = isMe ? 'ME' : (msg.senderName[0] || 'U').toUpperCase();

        if (isMe) {
            newMessage.appendChild(bubble);
            newMessage.appendChild(avatar);
        } else {
            newMessage.appendChild(avatar);
            newMessage.appendChild(bubble);
        }

        chatContainer.appendChild(newMessage);
    }
}
