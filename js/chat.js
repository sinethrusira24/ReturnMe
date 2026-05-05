export function initChat() {
    const chatForm = document.getElementById('chatForm');
    const chatContainer = document.querySelector('.chat-container');

    if (chatForm && chatContainer) {
        chatForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const inputField = chatForm.querySelector('input');
            const messageText = inputField.value.trim();

            if (messageText !== "") {
                const now = new Date();
                let hours = now.getHours();
                let minutes = now.getMinutes();
                const ampm = hours >= 12 ? 'PM' : 'AM';
                hours = hours % 12;
                hours = hours ? hours : 12; 
                minutes = minutes < 10 ? '0' + minutes : minutes;
                const timeString = `Today at ${hours}:${minutes} ${ampm}`;

                const newMessage = document.createElement('div');
                newMessage.classList.add('chat-message', 'sent');
                
                // Build message safely using DOM methods to prevent XSS
                const bubble = document.createElement('div');
                bubble.className = 'chat-bubble';

                const meta = document.createElement('div');
                meta.className = 'chat-meta';
                meta.innerHTML = `
                    <span class="chat-author">You</span>
                    <span class="chat-time">${timeString}</span>
                `;

                const msgP = document.createElement('p');
                msgP.textContent = messageText;

                bubble.appendChild(meta);
                bubble.appendChild(msgP);

                const avatar = document.createElement('div');
                avatar.className = 'chat-avatar user-av';
                avatar.style.background = '#3b82f6';
                avatar.textContent = 'ME';

                newMessage.appendChild(bubble);
                newMessage.appendChild(avatar);

                chatContainer.appendChild(newMessage);
                inputField.value = '';
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
        });
    }
}
