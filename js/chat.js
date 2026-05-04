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
                
                newMessage.innerHTML = `
                    <div class="chat-bubble">
                        <div class="chat-meta">
                            <span class="chat-author">You</span>
                            <span class="chat-time">${timeString}</span>
                        </div>
                        <p>${messageText}</p>
                    </div>
                    <div class="chat-avatar user-av" style="background: #3b82f6;">ME</div>
                `;

                chatContainer.appendChild(newMessage);
                inputField.value = '';
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
        });
    }
}
