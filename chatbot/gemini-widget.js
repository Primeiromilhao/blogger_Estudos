/**
 * Nova Jerusalém - Gemini Chatbot Widget
 * Premium AI-style assistant for Bible studies.
 */

window.initializeGeminiChatbot = function(config) {
    const container = document.getElementById(config.containerId);
    if (!container) return;

    // Load FAQ data
    let faqData = [];
    if (config.jsonConfigUrl) {
        fetch(config.jsonConfigUrl)
            .then(res => res.json())
            .then(data => {
                faqData = data.questions || [];
                // If it's a simple list (books), we treat it as FAQ
                if (data.books) {
                    faqData = data.books.map(b => ({
                        question: b.title,
                        answer: b.description + " Autor: " + b.author + ". Compre aqui: " + b.affiliate_link
                    }));
                }
            })
            .catch(err => console.error("Erro ao carregar FAQ do Robô:", err));
    }

    // --- CSS ---
    const styles = `
        #nj-chat-widget {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 10000;
            font-family: 'Inter', sans-serif;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
        }
        #nj-chat-bubble {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, #B8860B, #D4A017);
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            border: 2px solid rgba(255,255,255,0.2);
        }
        #nj-chat-bubble:hover { transform: scale(1.1) rotate(5deg); }
        #nj-chat-window {
            width: 350px;
            height: 500px;
            background: rgba(255,255,255,0.98);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(91,168,208,0.2);
            border-radius: 20px;
            box-shadow: 0 15px 50px rgba(0,0,0,0.2);
            margin-bottom: 15px;
            display: none;
            flex-direction: column;
            overflow: hidden;
            animation: njSlideUp 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
        }
        @keyframes njSlideUp { from { opacity: 0; transform: translateY(30px) scale(0.9); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .nj-chat-header {
            padding: 20px;
            background: #12213A;
            color: #fff;
            display: flex;
            align-items: center;
            gap: 12px;
            border-bottom: 2px solid #5BA8D0;
        }
        .nj-chat-header h4 { margin: 0; font-size: 1rem; font-family: 'Cinzel', serif; letter-spacing: 1px; color: #FFE566; }
        .nj-chat-header span { font-size: 0.75rem; opacity: 0.8; }
        .nj-chat-messages {
            flex-grow: 1;
            padding: 15px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 12px;
            background: #F8FDFF;
            scrollbar-width: thin;
        }
        .msg { padding: 10px 14px; border-radius: 15px; font-size: 0.85rem; line-height: 1.5; max-width: 85%; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
        .msg-bot { background: #fff; color: #12213A; align-self: flex-start; border-bottom-left-radius: 2px; border: 1px solid #E8F7FF; }
        .msg-user { background: linear-gradient(135deg, #5BA8D0, #3A5070); color: #fff; align-self: flex-end; border-bottom-right-radius: 2px; }
        .nj-chat-input {
            padding: 15px;
            border-top: 1px solid #eee;
            display: flex;
            gap: 10px;
            background: #fff;
        }
        .nj-chat-input input {
            flex-grow: 1;
            border: 1.5px solid #E8F7FF;
            border-radius: 10px;
            padding: 8px 12px;
            outline: none;
            font-size: 0.85rem;
            transition: border-color 0.2s;
        }
        .nj-chat-input input:focus { border-color: #5BA8D0; }
        .nj-chat-input button {
            background: #B8860B;
            color: #fff;
            border: none;
            border-radius: 10px;
            padding: 6px 15px;
            cursor: pointer;
            transition: background 0.2s;
        }
        .nj-chat-input button:hover { background: #D4A017; }
        .nj-chat-suggestions {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 5px;
            padding: 5px 0;
        }
        .suggestion-pill {
            font-size: 0.73rem;
            background: #fff;
            color: #5BA8D0;
            border: 1px solid #5BA8D0;
            padding: 4px 12px;
            border-radius: 999px;
            cursor: pointer;
            white-space: nowrap;
            transition: all 0.2s;
        }
        .suggestion-pill:hover { background: #5BA8D0; color: #fff; }
    `;
    const styleTag = document.createElement('style');
    styleTag.innerHTML = styles;
    document.head.appendChild(styleTag);

    // --- HTML ---
    const widgetHtml = `
        <div id="nj-chat-widget">
            <div id="nj-chat-window">
                <div class="nj-chat-header">
                    <div style="width:35px;height:35px;background:#B8860B;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 0 10px rgba(255,229,102,0.3)">😇</div>
                    <div>
                        <h4>Sábio Nova Jerusalém</h4>
                        <span>Assistente Sábio • Ativo</span>
                    </div>
                </div>
                <div class="nj-chat-messages" id="nj-msg-container">
                    <div class="msg msg-bot">Graça e Paz! Eu sou o assistente oficial da Escola Bíblica. Como posso iluminar o seu estudo hoje?</div>
                </div>
                <div class="nj-chat-input">
                    <input type="text" id="nj-input" placeholder="Pergunte sobre um livro ou tema...">
                    <button id="nj-send">Enviar</button>
                </div>
            </div>
            <div id="nj-chat-bubble">😇</div>
        </div>
    `;
    container.innerHTML = widgetHtml;

    // --- LOGIC ---
    const windowEl = document.getElementById('nj-chat-window');
    const bubbleEl = document.getElementById('nj-chat-bubble');
    const msgContainer = document.getElementById('nj-msg-container');
    const inputEl = document.getElementById('nj-input');
    const sendBtn = document.getElementById('nj-send');

    bubbleEl.onclick = () => {
        const isOpening = windowEl.style.display !== 'flex';
        windowEl.style.display = isOpening ? 'flex' : 'none';
        if (isOpening) {
            inputEl.focus();
            setTimeout(renderSuggestions, 200);
        }
    };

    function addMessage(text, type) {
        const m = document.createElement('div');
        m.className = `msg msg-${type}`;
        m.textContent = text;
        msgContainer.appendChild(m);
        msgContainer.scrollTop = msgContainer.scrollHeight;
    }

    function renderSuggestions() {
        if (!faqData.length) return;
        
        // Remove old suggestions
        document.querySelectorAll('.nj-chat-suggestions').forEach(el => el.remove());

        const sDiv = document.createElement('div');
        sDiv.className = 'nj-chat-suggestions';
        
        // Get 3 interesting questions or titles
        const items = faqData.slice(0, 3);
        items.forEach(item => {
            const p = document.createElement('div');
            p.className = 'suggestion-pill';
            p.textContent = item.question.length > 30 ? item.question.substring(0,27) + "..." : item.question;
            p.onclick = () => handleInput(item.question);
            sDiv.appendChild(p);
        });
        
        msgContainer.appendChild(sDiv);
        msgContainer.scrollTop = msgContainer.scrollHeight;
    }

    function handleInput(text) {
        if (!text) return;
        addMessage(text, 'user');
        
        // Remove suggestions
        document.querySelectorAll('.nj-chat-suggestions').forEach(el => el.remove());

        // Simple Keyword Match
        // Melhorado: Busca por palavras-chave mais flexível
        const match = faqData.find(q => {
            const qClean = q.question.toLowerCase();
            const textClean = text.toLowerCase();
            
            // 1. Match exato ou inclusão total
            if (qClean.includes(textClean) || textClean.includes(qClean)) return true;
            
            // 2. Match por palavras-chave (ignora palavras curtas)
            const keywords = textClean.split(/\s+/).filter(w => w.length > 3);
            if (keywords.length > 0 && keywords.every(kw => qClean.includes(kw) || q.answer.toLowerCase().includes(kw))) {
                return true;
            }
            
            return false;
        });

        setTimeout(() => {
            if (match) {
                // If answer has a link, we might want to make it clickable, but textContent is safer.
                // For premium feel, use innerHTML for the answer if it contains "http"
                const m = document.createElement('div');
                m.className = 'msg msg-bot';
                if (match.answer.includes('http')) {
                    m.innerHTML = match.answer.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" style="color:#B8860B;font-weight:bold;text-decoration:underline;">Ver na Amazon</a>');
                } else {
                    m.textContent = match.answer;
                }
                msgContainer.appendChild(m);
            } else {
                addMessage("Excelente busca! Eu conheço sobre todos os livros na nossa biblioteca. Tente perguntar sobre temas como 'Espíritos Marinhos', 'Eternidade' ou 'Airdrops'. Como posso ajudar mais?", 'bot');
            }
            msgContainer.scrollTop = msgContainer.scrollHeight;
            setTimeout(renderSuggestions, 300);
        }, 800);
    }

    sendBtn.onclick = () => {
        const val = inputEl.value.trim();
        handleInput(val);
        inputEl.value = '';
    };

    inputEl.onkeypress = (e) => {
        if (e.key === 'Enter') sendBtn.click();
    };
};
