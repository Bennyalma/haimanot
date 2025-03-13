// התחברות לשרת Socket.IO
const socket = io();

// אלמנטים מה-DOM
const chatContainer = document.querySelector('.chat-container');
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendMessage');
const chatToggle = document.getElementById('chatToggle');
const chatBadge = document.querySelector('.chat-badge');
const chatClose = document.querySelector('.chat-close');

// משתנים גלובליים
let unreadMessages = 0;
let chatOpen = false;

// פונקציות עזר
function formatTime(date) {
    return new Intl.DateTimeFormat('he-IL', {
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

function createMessageElement(message, isSent = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isSent ? 'message-sent' : 'message-received'}`;
    
    const content = document.createElement('p');
    content.textContent = message.text;
    
    const time = document.createElement('small');
    time.textContent = formatTime(new Date(message.timestamp));
    
    messageDiv.appendChild(content);
    messageDiv.appendChild(time);
    
    return messageDiv;
}

function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function updateUnreadBadge() {
    if (unreadMessages > 0) {
        chatBadge.style.display = 'flex';
        chatBadge.textContent = unreadMessages;
    } else {
        chatBadge.style.display = 'none';
    }
}

// אירועי לחיצה
chatToggle.addEventListener('click', (e) => {
    e.preventDefault();
    chatOpen = !chatOpen;
    chatContainer.classList.toggle('show', chatOpen);
    
    if (chatOpen) {
        unreadMessages = 0;
        updateUnreadBadge();
        messageInput.focus();
    }
});

chatClose.addEventListener('click', () => {
    chatOpen = false;
    chatContainer.classList.remove('show');
});

// שליחת הודעה
function sendMessage() {
    const text = messageInput.value.trim();
    if (!text) return;
    
    const message = {
        text,
        timestamp: new Date(),
        userId: localStorage.getItem('userId') || 'guest'
    };
    
    socket.emit('chat message', message);
    
    // הוספת ההודעה לצ'אט
    chatMessages.appendChild(createMessageElement(message, true));
    scrollToBottom();
    
    // ניקוי שדה הקלט
    messageInput.value = '';
}

sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// אירועי Socket.IO
socket.on('chat message', (message) => {
    chatMessages.appendChild(createMessageElement(message));
    
    if (!chatOpen) {
        unreadMessages++;
        updateUnreadBadge();
    }
    
    scrollToBottom();
});

socket.on('previous messages', (messages) => {
    chatMessages.innerHTML = '';
    messages.forEach(message => {
        const isSent = message.userId === (localStorage.getItem('userId') || 'guest');
        chatMessages.appendChild(createMessageElement(message, isSent));
    });
    scrollToBottom();
});

// התחברות ראשונית
socket.on('connect', () => {
    if (!localStorage.getItem('userId')) {
        localStorage.setItem('userId', `user_${Date.now()}`);
    }
    socket.emit('get previous messages');
}); 