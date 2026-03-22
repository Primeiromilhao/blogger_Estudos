/**
 * Nova Jerusalém - Gemini Chatbot Widget (V2 - Real AI)
 * Premium AI-style assistant with Bible & Library integration.
 */

window.initializeGeminiChatbot = function(config) {
    const container = document.getElementById(config.containerId);
    if (!container) return;

    let libraryData = [];
    let faqData = [];

    // Load Library/Books data
    const loadData = async () => {
        try {
            const booksUrl = config.booksUrl || 'books.json';
            const libraryUrl = config.libraryUrl || 'data/library.json';

            // Load Books with links
            const booksRes = await fetch(booksUrl);
            const books = await booksRes.json();
            
            // Load Library with covers
            const libRes = await fetch(libraryUrl);
            const lib = await libRes.json();
            
            // Merge data
            libraryData = (lib.books || []).map(b => {
                const bookInfo = (books || []).find(book => book.title && b.title && book.title.toLowerCase().includes(b.title.toLowerCase()));
                return {
                    ...b,
                    affiliate_link: bookInfo ? bookInfo.affiliate_link : "https://primeiromilhao.github.io/blogger_Estudos/#biblioteca"
                };
            });
            console.log("Chatbot Data Loaded:", libraryData.length, "books.");
        } catch (err) {
            console.error("Error loading Chatbot data:", err);
        }
    };
    loadData();

    // --- CSS ---
    const styles = `
        #nj-chat-widget {
            position: fixed;
            bottom: 25px;
            right: 25px;
            z-index: 10000;
            font-family: 'Inter', sans-serif;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
        }
        #nj-chat-bubble {
            width: 65px;
            height: 65px;
            border-radius: 50%;
            background: linear-gradient(135deg, #1A2A6C, #B8860B);
            box-shadow: 0 5px 25px rgba(184, 134, 11, 0.4);
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            border: 2px solid rgba(255,255,255,0.3);
            position: relative;
        }
        #nj-chat-bubble::after {
            content: "";
            position: absolute;
            top: -2px; left: -2px; right: -2px; bottom: -2px;
            border-radius: 50%;
            border: 2px solid #D4A017;
            opacity: 0;
            animation: njPulse 2s infinite;
        }
        @keyframes njPulse {
            0% { transform: scale(1); opacity: 0.8; }
            100% { transform: scale(1.4); opacity: 0; }
        }
        #nj-chat-bubble:hover { transform: scale(1.1) rotate(5deg); }
        #nj-chat-bubble svg { width: 35px; height: 35px; fill: #fff; }

        #nj-chat-window {
            width: 380px;
            height: 550px;
            background: #fff;
            border-radius: 20px;
            box-shadow: 0 15px 60px rgba(0,0,0,0.3);
            margin-bottom: 20px;
            display: none;
            flex-direction: column;
            overflow: hidden;
            border: 1px solid #E8F7FF;
            animation: njFadeIn 0.3s ease-out;
        }
        @keyframes njFadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

        .nj-chat-header {
            padding: 20px;
            background: #12213A;
            color: #fff;
            display: flex;
            align-items: center;
            gap: 15px;
        }
        .nj-chat-header .bot-avatar {
            width: 45px;
            height: 45px;
            background: #B8860B;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 15px rgba(184,134,11,0.5);
        }
        .nj-chat-header .bot-avatar svg { width: 25px; height: 25px; fill: #fff; }
        .nj-chat-header h4 { margin: 0; font-size: 1.1rem; color: #FFE566; font-family: 'Cinzel', serif; }
        .nj-chat-header span { font-size: 0.75rem; color: #5BA8D0; }

        .nj-chat-messages {
            flex-grow: 1;
            padding: 20px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 15px;
            background: #fdfdfd;
        }
        .msg {
            padding: 12px 18px;
            border-radius: 18px;
            font-size: 0.9rem;
            line-height: 1.6;
            max-width: 85%;
            word-wrap: break-word;
            position: relative;
        }
        .msg-bot {
            background: #fff;
            border: 1px solid #eef;
            align-self: flex-start;
            border-bottom-left-radius: 4px;
            box-shadow: 2px 2px 10px rgba(0,0,0,0.02);
            color: #333;
        }
        .msg-user {
            background: linear-gradient(135deg, #12213A, #3A5070);
            color: #fff;
            align-self: flex-end;
            border-bottom-right-radius: 4px;
        }
        .msg-bot .book-card {
            margin-top: 10px;
            border: 1px solid #eee;
            border-radius: 10px;
            overflow: hidden;
            background: #fafafa;
        }
        .msg-bot .book-card img {
            width: 100%;
            height: auto;
            display: block;
        }
        .msg-bot .book-card .card-content {
            padding: 10px;
            font-size: 0.8rem;
        }
        .msg-bot .book-card a {
            display: block;
            margin-top: 5px;
            background: #B8860B;
            color: #fff;
            text-align: center;
            padding: 8px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
        }

        .nj-chat-input {
            padding: 15px;
            background: #fff;
            border-top: 1px solid #eef;
            display: flex;
            gap: 10px;
        }
        .nj-chat-input input {
            flex-grow: 1;
            border: 2px solid #f0f0f0;
            border-radius: 10px;
            padding: 10px 15px;
            outline: none;
            font-size: 0.9rem;
        }
        .nj-chat-input button {
            background: #B8860B;
            color: #fff;
            border: none;
            border-radius: 10px;
            padding: 0 20px;
            cursor: pointer;
            font-weight: bold;
        }
        .affiliate-disclaimer {
            font-size: 0.65rem;
            color: #999;
            text-align: center;
            padding: 5px;
            background: #fff;
        }
        .typing {
            font-style: italic;
            font-size: 0.75rem;
            color: #999;
            display: none;
        }
    `;
    const styleTag = document.createElement('style');
    styleTag.innerHTML = styles;
    document.head.appendChild(styleTag);

    const robotIcon = `
        <svg viewBox="0 0 24 24">
            <path d="M12,2A3,3 0 0,1 15,5V7H18A2,2 0 0,1 20,9V19A2,2 0 0,1 18,21H6A2,2 0 0,1 4,19V9A2,2 0 0,1 6,7H9V5A3,3 0 0,1 12,2M12,4A1,1 0 0,0 11,5V7H13V5A1,1 0 0,0 12,4M6,9V19H18V9H6M8,11H10V13H8V11M14,11H16V13H14V11M9,15H15V17H9V15Z" />
        </svg>
    `;

    // --- HTML ---
    const widgetHtml = `
        <div id="nj-chat-widget">
            <div id="nj-chat-window">
                <div class="nj-chat-header">
                    <div class="bot-avatar">${robotIcon}</div>
                    <div>
                        <h4>Sábio Nova Jerusalém</h4>
                        <span>Inteligência Artificial Ativa</span>
                    </div>
                </div>
                <div class="nj-chat-messages" id="nj-msg-container">
                    <div class="msg msg-bot">Graça e Paz! Eu sou o assistente oficial da Escola Bíblica. Estou pronto para tirar suas dúvidas sobre a Bíblia e sugerir livros para seu crescimento espiritual. Como posso ajudar?</div>
                </div>
                <div id="nj-typing" class="typing" style="padding-left: 20px;">O Sábio está pensando...</div>
                <div class="nj-chat-input">
                    <input type="text" id="nj-input" placeholder="Digite sua dúvida bíblica...">
                    <button id="nj-send">OK</button>
                </div>
                <div class="affiliate-disclaimer">Como associado da Amazon, recebo por compras qualificadas.</div>
            </div>
            <div id="nj-chat-bubble">${robotIcon}</div>
        </div>
    `;
    container.innerHTML = widgetHtml;

    // --- Logic ---
    const windowEl = document.getElementById('nj-chat-window');
    const bubbleEl = document.getElementById('nj-chat-bubble');
    const msgContainer = document.getElementById('nj-msg-container');
    const inputEl = document.getElementById('nj-input');
    const sendBtn = document.getElementById('nj-send');
    const typingEl = document.getElementById('nj-typing');

    bubbleEl.onclick = () => {
        windowEl.style.display = windowEl.style.display === 'flex' ? 'none' : 'flex';
        if (windowEl.style.display === 'flex') inputEl.focus();
    };

    const addMessage = (text, type, html = false) => {
        const m = document.createElement('div');
        m.className = `msg msg-${type}`;
        if (html) m.innerHTML = text;
        else m.textContent = text;
        msgContainer.appendChild(m);
        msgContainer.scrollTop = msgContainer.scrollHeight;
    };

    const fetchBibleVerse = async (ref) => {
        try {
            const res = await fetch(`https://bible-api.com/${encodeURIComponent(ref)}?translation=almeida`);
            const data = await res.json();
            return data.text || null;
        } catch { return null; }
    };
    const callGemini = async (userText) => {
        const systemPrompt = `Você é o "Sábio da Nova Jerusalém", um assistente cristão de elite.
REGRAS:
1. Seja humano, acolhedor e profundo.
2. Se citar a Bíblia, use a referência exata (ex: João 3:16).
3. Se o usuário perguntar sobre um tema, busque recomendar um dos seguintes livros da nossa biblioteca:
${libraryData.map(b => `- ${b.title}: ${b.intro}`).join('\n')}
4. Nunca invente livros. Cite apenas os da lista.
5. Se recomendar um livro, escreva [BOOK:${libraryData[0] ? libraryData[0].title : ''}] substituindo pelo nome exato do livro recomendado.`;

        const model = config.model || 'gemini-1.5-flash';
        // Use Netlify Function Proxy instead of direct API
        const proxyUrl = "/.netlify/functions/gemini-proxy";
        
        try {
            const response = await fetch(proxyUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: userText,
                    model: model,
                    systemInstruction: systemPrompt
                })
            });
            const data = await response.json();
            console.log("Gemini Proxy Response:", data);
            
            if (data.error) {
                console.error("Gemini API Error:", data.error);
                return `Erro: ${data.error.message || data.error || "Acesso negado."}`;
            }

            return data.candidates?.[0]?.content?.parts?.[0]?.text || "Desculpe, não consegui formular uma resposta. Tente reformular sua pergunta.";
        } catch (e) {
            console.error("Gemini Fetch Error:", e);
            return "Erro de conexão com o servidor de sabedoria.";
        }
    };

    const handleInput = async () => {
        const text = inputEl.value.trim();
        if (!text) return;

        inputEl.value = '';
        addMessage(text, 'user');
        typingEl.style.display = 'block';

        let aiResponse = await callGemini(text);
        typingEl.style.display = 'none';

        // Post-processing: Bible Verses
        const verseRegex = /([1-4]?\s?[A-Za-zÀ-ÿ]+)\s(\d+):(\d+)/g;
        let match;
        let verifiedVerses = [];
        while ((match = verseRegex.exec(aiResponse)) !== null) {
            const ref = match[0];
            const verseText = await fetchBibleVerse(ref);
            if (verseText) {
                verifiedVerses.push(`<strong>${ref}:</strong> ${verseText}`);
            }
        }
        if (verifiedVerses.length > 0) {
            aiResponse += "\n\n<hr><strong>Escrituras Oficiais:</strong>\n" + verifiedVerses.join('\n');
        }

        // Post-processing: Book Recommendation
        const bookMatch = aiResponse.match(/\[BOOK:(.+?)\]/);
        let bookHtml = "";
        if (bookMatch) {
            const bookTitle = bookMatch[1].trim();
            aiResponse = aiResponse.replace(bookMatch[0], ""); // Remove tag
            const book = libraryData.find(b => b.title.toLowerCase().includes(bookTitle.toLowerCase()));
            if (book) {
                const coverUrl = book.cover.startsWith('http') ? book.cover : `data/covers/${book.cover}`;
                bookHtml = `
                    <div class="book-card">
                        <img src="${coverUrl}" onerror="this.src='https://primeiromilhao.github.io/blogger_Estudos/img/default-book.jpg'">
                        <div class="card-content">
                            <strong>${book.title}</strong><br>
                            <a href="${book.affiliate_link}" target="_blank">Ver na Amazon</a>
                        </div>
                    </div>
                `;
            }
        }

        addMessage(aiResponse + bookHtml, 'bot', true);
    };

    sendBtn.onclick = handleInput;
    inputEl.onkeypress = (e) => { if (e.key === 'Enter') handleInput(); };
};
