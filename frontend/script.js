// Client-side Application State
let userProfile = null;
let chatHistory = [];

// Determine the API base URL dynamically.
// If the user opened index.html directly from their file system (file:///), direct requests to the Express server at http://localhost:5000.
// Otherwise, use relative URLs.
const API_BASE = window.location.protocol === 'file:' ? 'http://localhost:5000' : '';


/* --- Initialization & Intersection Observers --- */
document.addEventListener('DOMContentLoaded', () => {
    const reveals = document.querySelectorAll('.reveal');
    
    const observerOptions = {
        root: null,
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    reveals.forEach(element => {
        revealObserver.observe(element);
    });
});

/* --- Dynamic AI Synthesis Logic --- */
async function generateIdentity(event) {
    event.preventDefault();

    // Elements Capture
    const nameInput = document.getElementById('username');
    const ageInput = document.getElementById('age');
    const goalInput = document.getElementById('goal');
    const struggleInput = document.getElementById('struggle');
    const timelineInput = document.getElementById('timeline');
    const toneInput = document.getElementById('tone');

    const name = nameInput.value.trim();
    const age = ageInput.value.trim();
    const goal = goalInput.value.trim();
    const struggle = struggleInput.value.trim();
    const timeline = timelineInput.value.trim();
    const tone = toneInput.value;

    const errorBanner = document.getElementById('error-banner');
    const loader = document.getElementById('loader');
    const resultContainer = document.getElementById('result');
    const submitBtn = document.getElementById('submit-btn');
    const loaderText = document.getElementById('loader-text');

    // Reset States
    errorBanner.style.display = 'none';
    submitBtn.disabled = true;

    // Validate inputs
    if (!name || !age || !goal || !struggle || !timeline) {
        errorBanner.innerText = "Please fill out all identity parameters to calibrate.";
        errorBanner.style.display = 'block';
        submitBtn.disabled = false;
        return;
    }

    // Enter Loading State
    loader.style.display = 'block';
    resultContainer.style.display = 'none';

    // Magical Loading Sequential Messages (Apple Dopamine Effect)
    const loadingStages = [
        "Scanning core ambition parameters...",
        "Confronting operational constraints...",
        "Simulating temporal self-alignment matrices...",
        "Generating message from your future self..."
    ];
    
    let stageIdx = 0;
    loaderText.innerText = loadingStages[0];
    const loadingInterval = setInterval(() => {
        stageIdx = (stageIdx + 1) % loadingStages.length;
        loaderText.innerText = loadingStages[stageIdx];
    }, 1500);

    try {
        // API Route Call
        const response = await fetch(`${API_BASE}/api/generate-futureme`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                age,
                goal,
                struggle,
                oneYearVision: timeline,
                tone
            })
        });

        clearInterval(loadingInterval);
        const resData = await response.json();

        if (!response.ok || !resData.success) {
            throw new Error(resData.error || "FutureMe could not respond right now. Try again.");
        }

        const data = resData.data;

        // Render Dynamic UI Elements
        document.getElementById('manifesto-output').innerText = data.message;
        document.getElementById('identity-output').innerText = data.futureIdentity;
        document.getElementById('habit-output').innerText = data.habit;
        document.getElementById('warning-output').innerText = data.warning;
        document.getElementById('mantra-output').innerText = data.mantra;

        // Render Next 3 Moves List
        const movesList = document.getElementById('moves-output');
        movesList.innerHTML = '';
        if (Array.isArray(data.nextMoves)) {
            data.nextMoves.forEach(move => {
                const li = document.createElement('li');
                li.innerText = move;
                movesList.appendChild(li);
            });
        }

        // Cache User Profile and Clear History
        userProfile = { name, age, goal, struggle, oneYearVision: timeline, tone };
        chatHistory = [];

        // Boot and Unlock Chat terminal
        setupChatInterface();

        // Display results
        loader.style.display = 'none';
        resultContainer.style.display = 'block';
        resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        triggerToast("Your FutureMe reflection has been generated!");

    } catch (error) {
        clearInterval(loadingInterval);
        loader.style.display = 'none';
        
        let errorMsg = error.message || String(error);
        if (errorMsg.includes('Failed to fetch') || errorMsg.includes('fetch failed') || errorMsg.includes('NetworkError')) {
            errorMsg = "Unable to connect to the FutureMe backend server. Please verify you have run 'start.bat' or 'node server.js' and that your backend is running successfully at http://localhost:5000.";
        }
        
        errorBanner.innerText = errorMsg;
        errorBanner.style.display = 'block';
        errorBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } finally {
        submitBtn.disabled = false;
    }
}

/* --- Interactive Chat System --- */
function setupChatInterface() {
    const chatInput = document.getElementById('chat-input');
    const chatSend = document.getElementById('chat-send');
    const chatMessages = document.getElementById('chat-messages');
    const chatHeader = document.getElementById('chat-header-status');
    const chatPlaceholder = document.getElementById('chat-placeholder');

    if (!userProfile) return;

    // Enable inputs
    chatInput.disabled = false;
    chatSend.disabled = false;
    chatInput.placeholder = "Ask your FutureMe anything...";
    chatHeader.innerText = `Interface Terminal Session // Active with Future ${userProfile.name}`;

    // Clean placeholder messages
    chatMessages.innerHTML = '';

    // Add Initial temporal welcoming statement
    const openingMsg = `I am here, ${userProfile.name}. I am the version of you who successfully achieved our vision of "${userProfile.oneYearVision}". I've navigated the struggles you're feeling right now, and I can tell you: every effort matters. Ask me anything. Let's build our momentum.`;
    
    appendMessageBubble('futureme', openingMsg);
}

function appendMessageBubble(role, message) {
    const chatMessages = document.getElementById('chat-messages');
    
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${role === 'user' ? 'bubble-user' : 'bubble-future'}`;
    bubble.innerText = message;
    
    chatMessages.appendChild(bubble);
    
    // Auto scroll chat to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function sendChatMessage() {
    const chatInput = document.getElementById('chat-input');
    const chatSend = document.getElementById('chat-send');
    const chatTyping = document.getElementById('chat-typing');
    const question = chatInput.value.trim();

    if (!question || !userProfile) return;

    // Disable inputs while answering
    chatInput.disabled = true;
    chatSend.disabled = true;
    chatInput.value = '';

    // Append user query to UI
    appendMessageBubble('user', question);

    // Show Typing indicator
    chatTyping.style.display = 'block';
    
    const chatMessages = document.getElementById('chat-messages');
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
        const response = await fetch(`${API_BASE}/api/chat-futureme`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userProfile,
                chatHistory,
                question
            })
        });

        const data = await response.json();
        chatTyping.style.display = 'none';

        if (!response.ok || !data.success) {
            throw new Error(data.error || "Temporal line disrupted. Ask again.");
        }

        // Render AI Answer
        appendMessageBubble('futureme', data.reply);

        // Store in Conversational Memory State
        chatHistory.push({ role: 'user', message: question });
        chatHistory.push({ role: 'futureme', message: data.reply });

    } catch (error) {
        chatTyping.style.display = 'none';
        let errorMsg = error.message || String(error);
        if (errorMsg.includes('Failed to fetch') || errorMsg.includes('fetch failed') || errorMsg.includes('NetworkError')) {
            errorMsg = "Temporal line disrupted. Verify the backend Express server is running at http://localhost:5000.";
        }
        appendMessageBubble('futureme', `Connection lost: ${errorMsg}`);
    } finally {
        chatInput.disabled = false;
        chatSend.disabled = false;
        chatInput.focus();
    }
}

function handleChatKey(event) {
    if (event.key === 'Enter') {
        sendChatMessage();
    }
}

/* --- Action Controls --- */
function scrollToCreate() {
    const form = document.getElementById('create');
    form.scrollIntoView({ behavior: 'smooth' });
}

function focusChat() {
    const chatSec = document.getElementById('chat');
    chatSec.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => {
        document.getElementById('chat-input').focus();
    }, 800);
}

function copyResult() {
    if (!userProfile) {
        triggerToast("Please calibrate your FutureMe details first.");
        return;
    }

    const name = userProfile.name;
    const tone = userProfile.tone;
    const manifesto = document.getElementById('manifesto-output').innerText;
    const identity = document.getElementById('identity-output').innerText;
    const habit = document.getElementById('habit-output').innerText;
    const warning = document.getElementById('warning-output').innerText;
    const mantra = document.getElementById('mantra-output').innerText;
    
    // Grab list moves
    const moves = Array.from(document.getElementById('moves-output').children)
        .map((li, idx) => `${idx + 1}. ${li.innerText}`)
        .join('\n');

    const shareContent = `✦ FUTUREME REFLECTION MATRIX ✦
Generated in Nitish's Founder Labs for: ${name} (${userProfile.age} y/o)
Tone calibration: ${tone}

[MESSAGE FROM MY FUTURE SELF]
${manifesto}

[MY FUTURE IDENTITY]
${identity}

[NEXT 3 MOVES]
${moves}

[DAILY HABIT]
${habit}

[FUTUREME WARNING]
${warning}

[DAILY MANTRA]
"${mantra}"

Establish your own alignment loop at FutureMe.
`;

    navigator.clipboard.writeText(shareContent)
        .then(() => {
            triggerToast("Reflection matrix copied to clipboard!");
        })
        .catch(err => {
            console.error("Clipboard copy failed: ", err);
            triggerToast("Copy failed, please select and copy manually.");
        });
}

/* --- Toast Notification Controller --- */
function triggerToast(message) {
    const toast = document.getElementById('toast');
    toast.innerText = message || "Your FutureMe moment is ready to share.";
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}
