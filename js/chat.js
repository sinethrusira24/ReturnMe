import { db, auth, storage } from './firebase-config.js';
import { collection, addDoc, query, orderBy, onSnapshot, getDoc, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
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

        let authorHtml = '';
        if (!isMe) {
            let authorName = msg.senderName;
            let badge = '';
            if (isOwner) badge = ' (Finder)';
            authorHtml = `<div class="chat-author ${isOwner ? 'reporter-badge' : ''}">${authorName}${badge}</div>`;
        }

        bubble.innerHTML = `
            ${authorHtml}
            <div class="chat-text">${msg.text}</div>
            <div class="chat-time" style="text-align: right; font-size: 0.65rem; margin-top: 4px; color: rgba(255,255,255,0.6);">${timeString}</div>
        `;

        newMessage.appendChild(bubble);
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
    const otherUserParam = urlParams.get('user');

    if (!itemId) return;

    let reportOwnerId = null;
    let reportOwnerName = 'Finder';
    let itemName = 'this item';
    let currentUser = null;
    let targetUserId = null;
    let targetUserName = 'User';
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

        let authorHtml = '';
        if (!isMe) {
            let authorName = msg.senderName;
            let badge = '';
            if (isOwner) badge = ' (Finder)';
            authorHtml = `<div class="chat-author ${isOwner ? 'reporter-badge' : ''}">${authorName}${badge}</div>`;
        }

        bubble.innerHTML = `
            ${authorHtml}
            <div class="chat-text">${msg.text}</div>
            ${msg.imageUrl ? `<div class="chat-image-container" style="margin-top: 0.5rem; border-radius: 0.5rem; overflow: hidden; max-width: 300px;"><img src="${msg.imageUrl}" alt="Shared photo proof" style="width: 100%; height: auto; display: block; cursor: pointer;" onclick="window.open('${msg.imageUrl}', '_blank')"></div>` : ''}
            <div class="chat-time" style="text-align: right; font-size: 0.65rem; margin-top: 4px; color: rgba(255,255,255,0.6);">${timeString}</div>
        `;

        newMessage.appendChild(bubble);
        chatContainer.appendChild(newMessage);
    }

    function initializePrivateChat() {
        if (chatInitialized) return;
        if (!currentUser || !reportOwnerId) return;
        if (currentUser.uid === reportOwnerId && !otherUserParam) {
            infoText.textContent = 'You are the reporter for this item. Waiting for others to contact you.';
            targetUserId = currentUser.uid; // fallback
        } else {
            targetUserId = otherUserParam || reportOwnerId;
            infoText.textContent = `Secure direct chat for ${itemName}.`;
        }

        const chatId = getChatId(currentUser.uid, targetUserId);
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
                const currentUserName = currentUser.displayName || currentUser.email.split('@')[0];
                await addDoc(messagesRef, {
                    text: messageText,
                    senderId: currentUser.uid,
                    senderName: currentUserName,
                    createdAt: Date.now()
                });
                
                await setDoc(doc(db, "inboxChats", chatId), {
                    chatId: chatId,
                    itemId: itemId,
                    itemName: itemName,
                    users: [currentUser.uid, targetUserId],
                    userNames: {
                        [currentUser.uid]: currentUserName,
                        [targetUserId]: targetUserName
                    },
                    lastMessage: messageText,
                    updatedAt: Date.now()
                }, { merge: true });
                
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

                    const currentUserName = currentUser.displayName || currentUser.email.split('@')[0];
                    await addDoc(messagesRef, {
                        text: messageText || '[Photo proof shared]',
                        imageUrl: imageUrl,
                        senderId: currentUser.uid,
                        senderName: currentUserName,
                        createdAt: Date.now()
                    });
                    
                    await setDoc(doc(db, "inboxChats", chatId), {
                        chatId: chatId,
                        itemId: itemId,
                        itemName: itemName,
                        users: [currentUser.uid, targetUserId],
                        userNames: {
                            [currentUser.uid]: currentUserName,
                            [targetUserId]: targetUserName
                        },
                        lastMessage: messageText || '[Photo]',
                        updatedAt: Date.now()
                    }, { merge: true });
                    
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
        
        targetUserId = otherUserParam || reportOwnerId;
        
        // Try to get target user's name
        if (targetUserId === reportOwnerId) {
            targetUserName = reportOwnerName;
            headerTitle.textContent = `Private chat with ${targetUserName}`;
        } else {
            getDoc(doc(db, "users", targetUserId)).then(uSnap => {
                if(uSnap.exists()) {
                    targetUserName = uSnap.data().fullName || 'User';
                    headerTitle.textContent = `Private chat with ${targetUserName}`;
                }
            });
        }

        infoText.textContent = `Secure direct chat for ${itemName}.`;

        if (currentUser) {
            initializePrivateChat();
        }
    }).catch((error) => {
        console.error('Error loading private chat info:', error);
        updateChatNotice('Unable to load chat details. Please try again later.');
    });
}
