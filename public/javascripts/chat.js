// Connect to socket.io WITHOUT authentication parameters
const socket = io();

let currentRoom = 'global-chat';
let typingTimeout;
let isAuthenticated = false;

// Get current user info from the page
const currentUsername = document.body.dataset.username;
const currentUserId = document.body.dataset.userid;

console.log('Current user:', currentUsername, currentUserId);

// DOM elements
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');
const onlineUsersList = document.getElementById('online-users-list');
const onlineCount = document.getElementById('online-count');
const typingIndicator = document.getElementById('typing-indicator');
const typingUsername = document.getElementById('typing-username');
const toggleChat = document.getElementById('toggle-chat');
const chatBody = document.getElementById('chat-body');
const chatFooter = document.getElementById('chat-footer');

// Connection handlers
socket.on('connect', () => {
    console.log('✅ Socket connected:', socket.id);

    // Authenticate after connection
    socket.emit('authenticate', {
        username: currentUsername,
        userId: currentUserId
    });
});

socket.on('authenticated', () => {
    console.log('✅ Authenticated successfully');
    isAuthenticated = true;

    // REMOVED: socket.join('global-chat'); // ❌ This doesn't work on client side

    // Get cafe ID if on cafe page
    const cafeIdElement = document.getElementById('cafeId');
    if (cafeIdElement) {
        currentRoom = `cafe-${cafeIdElement.value}`;
        socket.emit('joinCafe', cafeIdElement.value);
        console.log('Joined room:', currentRoom);
    } else {
        console.log('Using room:', currentRoom);
    }

    // Load chat history
    loadChatHistory(currentRoom);
});

socket.on('connect_error', (error) => {
    console.error('❌ Connection error:', error);
});

socket.on('disconnect', (reason) => {
    console.log('⚠️ Disconnected:', reason);
    isAuthenticated = false;
});

// Toggle chat visibility
toggleChat.addEventListener('click', () => {
    chatBody.classList.toggle('collapsed');
    chatFooter.classList.toggle('collapsed');
    const icon = toggleChat.querySelector('i');
    icon.classList.toggle('fa-chevron-down');
    icon.classList.toggle('fa-chevron-up');
});

// Send message
chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();

    if (text && isAuthenticated) {
        console.log('Sending message:', text);

        socket.emit('chatMessage', {
            text: text,
            room: currentRoom
        });

        chatInput.value = '';
        socket.emit('typing', { room: currentRoom, isTyping: false });
    } else if (!isAuthenticated) {
        console.error('Not authenticated yet');
    }
});

// Typing indicator
chatInput.addEventListener('input', () => {
    if (!isAuthenticated) return;

    socket.emit('typing', { room: currentRoom, isTyping: true });

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        socket.emit('typing', { room: currentRoom, isTyping: false });
    }, 1000);
});

// Receive messages
socket.on('chatMessage', (message) => {
    console.log('📨 Received message:', message);
    addMessage(message);
    scrollToBottom();
});

// Update online users
socket.on('onlineUsers', (users) => {
    console.log('👥 Online users:', users);
    onlineCount.textContent = `${users.length} online`;

    if (users && users.length > 0) {
        onlineUsersList.innerHTML = users.map(user => `
            <div class="online-user">
                <span class="online-dot"></span>
                ${escapeHtml(user.username || 'Unknown')}
            </div>
        `).join('');
    } else {
        onlineUsersList.innerHTML = '<div class="text-muted small">No users online</div>';
    }
});

// Typing indicator
socket.on('userTyping', (data) => {
    if (data.isTyping) {
        typingUsername.textContent = data.username || 'Someone';
        typingIndicator.style.display = 'flex';
        scrollToBottom();
    } else {
        typingIndicator.style.display = 'none';
    }
});

// Helper functions
function addMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message';

    const time = new Date(message.timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });

    // Safely handle potentially undefined values
    const username = message.username || 'Unknown';
    const text = message.text || '';

    messageDiv.innerHTML = `
        <div class="message-header">
            <strong>${escapeHtml(username)}</strong>
            <span class="message-time">${time}</span>
        </div>
        <div class="message-text">${escapeHtml(text)}</div>
    `;

    chatMessages.appendChild(messageDiv);
}

function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function escapeHtml(text) {
    // Handle undefined/null values
    if (!text) return '';

    // Convert to string if not already
    text = String(text);

    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

async function loadChatHistory(room) {
    try {
        const response = await fetch(`/chat/messages/${room}`);
        if (!response.ok) {
            console.log('No chat history available');
            return;
        }
        const messages = await response.json();
        console.log('📜 Loaded messages:', messages);

        if (messages && messages.length > 0) {
            messages.forEach(msg => {
                addMessage({
                    text: msg.text,
                    username: msg.author?.username || 'Unknown',
                    timestamp: msg.timestamp
                });
            });
            scrollToBottom();
        }
    } catch (error) {
        console.log('Could not load chat history:', error);
    }
}