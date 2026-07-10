import { db, auth, storage } from './firebase-config.js';
import { collection, addDoc, query, orderBy, onSnapshot, getDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
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

export function initPrivateChat() {
    const chatForm = document.getElementById('chatForm');
    const chatContainer = document.getElementById('chatContainer');
    const headerTitle = document.getElementById('privateChatHeaderTitle');
    const infoText = document.getElementById('privateChatInfo');

    if (!chatForm || !chatContainer) return;

    const urlParams = new URLSearchParams(window.location.search);
    const itemId = urlParams.get('id');

    if (!itemId) return;

    let reportOwnerId = null;
    let reportOwnerName = 'Finder';
    let itemName = 'this item';
    let currentUser = null;
    let chatReady = false;
    let chatInitialized = false;

    function updateChatNotice(message) {
        chatContainer.innerHTML = `<div class="chat-notice" style="text-align:center; padding:2rem; color:var(--text-muted);">${message}</div>`;
    }

    function getChatId(userA, userB) {
        return [userA, userB].sort().join('_');
    }

    function renderMessage(msg) {
        const user = currentUser;
        const isMe = user && user.uid === msg.senderId;
        const isOwner = reportOwnerId && msg.senderId === reportOwnerId;

        const date = msg.createdAt ? new Date(msg.createdAt) : new Date();
        let hours = date.getHours();
        let minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        minutes = minutes < 10 ? '0' + minutes : minutes;

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

        if (msg.imageUrl) {
            const imgContainer = document.createElement('div');
            imgContainer.style.cssText = 'margin-top: 0.5rem; border-radius: 0.5rem; overflow: hidden; max-width: 300px;';
            const img = document.createElement('img');
            img.src = msg.imageUrl;
            img.alt = 'Shared photo proof';
            img.style.cssText = 'width: 100%; height: auto; display: block; cursor: pointer;';
            img.addEventListener('click', () => {
                window.open(msg.imageUrl, '_blank');
            });
            imgContainer.appendChild(img);
            bubble.appendChild(imgContainer);
        }

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

    function initializePrivateChat() {
        if (chatInitialized) return;
        if (!currentUser || !reportOwnerId) return;
        if (currentUser.uid === reportOwnerId) {
            infoText.textContent = 'You are the reporter for this item. Messages here remain private to this chat.';
        } else {
            infoText.textContent = `Secure direct chat with ${reportOwnerName}.`;
        }

        const chatId = getChatId(currentUser.uid, reportOwnerId || currentUser.uid);
        const messagesRef = collection(db, "reports", itemId, "privateChats", chatId, "messages");
        const q = query(messagesRef, orderBy("createdAt", "asc"));

        onSnapshot(q, (snapshot) => {
            chatContainer.innerHTML = '';
            if (snapshot.empty) {
                updateChatNotice('No private messages yet. Send the first secure message.');
            } else {
                snapshot.forEach((doc) => {
                    const msg = doc.data();
                    renderMessage(msg);
                });
            }
            chatContainer.scrollTop = chatContainer.scrollHeight;
        });

        chatForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const inputField = chatForm.querySelector('input');
            const messageText = inputField.value.trim();
            if (!messageText) return;
            if (!currentUser) {
                showToast('Please log in to send a private message.', 'error');
                return;
            }

            try {
                await addDoc(messagesRef, {
                    text: messageText,
                    senderId: currentUser.uid,
                    senderName: currentUser.displayName || currentUser.email.split('@')[0],
                    createdAt: Date.now()
                });
                inputField.value = '';
            } catch (error) {
                console.error('Error sending private message:', error);
                showToast('Failed to send private message.', 'error');
            }
        });

        // Handle image uploads
        const chatImageBtn = document.getElementById('chatImageBtn');
        const chatImageInput = document.getElementById('chatImageInput');

        if (chatImageBtn && chatImageInput) {
            chatImageBtn.addEventListener('click', (e) => {
                e.preventDefault();
                chatImageInput.click();
            });

            chatImageInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                if (!file.type.startsWith('image/')) {
                    showToast('Please select an image file.', 'error');
                    return;
                }

                const maxSize = 5 * 1024 * 1024;
                if (file.size > maxSize) {
                    showToast('Image size must be under 5MB.', 'error');
                    return;
                }

                chatImageBtn.disabled = true;
                chatImageBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
                showToast('Uploading image...', 'info');

                try {
                    const timestamp = Date.now();
                    const fileName = `${currentUser.uid}_${timestamp}_${file.name}`;
                    const storageRef = ref(storage, `chat-proofs/${itemId}/${fileName}`);
                    
                    await uploadBytes(storageRef, file);
                    const imageUrl = await getDownloadURL(storageRef);

                    const inputField = chatForm.querySelector('input[type="text"]');
                    const messageText = inputField.value.trim();

                    await addDoc(messagesRef, {
                        text: messageText || '[Photo proof shared]',
                        imageUrl: imageUrl,
                        senderId: currentUser.uid,
                        senderName: currentUser.displayName || currentUser.email.split('@')[0],
                        createdAt: Date.now()
                    });
                    
                    inputField.value = '';
                    chatImageInput.value = '';
                    showToast('Photo shared successfully!', 'success');
                } catch (error) {
                    console.error('Error uploading image:', error);
                    showToast('Failed to upload image. Please try again.', 'error');
                } finally {
                    chatImageBtn.disabled = false;
                    chatImageBtn.innerHTML = '<i class="fa-solid fa-image"></i>';
                }
            });
        }

        chatInitialized = true;
    }

    auth.onAuthStateChanged((user) => {
        currentUser = user;
        if (currentUser && reportOwnerId) {
            initializePrivateChat();
        } else if (!currentUser) {
            updateChatNotice('Please log in to open a private chat with the reporter.');
        }
    });

    getDoc(doc(db, "reports", itemId)).then(docSnap => {
        if (!docSnap.exists()) {
            updateChatNotice('Item not found or chat unavailable.');
            return;
        }

        reportOwnerId = docSnap.data().reporterId;
        reportOwnerName = docSnap.data().reporterName || 'Finder';
        itemName = docSnap.data().itemName || itemName;
        headerTitle.textContent = `Private chat with ${reportOwnerName}`;
        infoText.textContent = `Secure direct chat for ${itemName}.`;

        if (currentUser) {
            initializePrivateChat();
        }
    }).catch((error) => {
        console.error('Error loading private chat info:', error);
        updateChatNotice('Unable to load chat details. Please try again later.');
    });
}
