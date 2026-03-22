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

    // --- CSS ---    const styles = `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600&family=Cinzel:wght@700&display=swap');

        #nj-chat-widget {
            position: fixed;
            bottom: 30px;
            right: 30px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            font-family: 'Outfit', sans-serif;
        }
        #nj-chat-bubble {
            width: 80px;
            height: 80px;
            cursor: pointer;
            transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            position: relative;
            filter: drop-shadow(0 10px 30px rgba(184, 134, 11, 0.5));
            animation: floating 3s ease-in-out infinite;
        }
        @keyframes floating {
            0%, 100% { transform: translateY(0) rotate(0); }
            50% { transform: translateY(-10px) rotate(5deg); }
        }
        #nj-chat-bubble img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }
        #nj-chat-bubble::after {
            content: "";
            position: absolute;
            inset: -5px;
            border-radius: 50%;
            border: 2px solid rgba(184, 134, 11, 0.3);
            animation: pulse-ring 2s infinite;
        }
        @keyframes pulse-ring {
            0% { transform: scale(1); opacity: 0.8; }
            100% { transform: scale(1.3); opacity: 0; }
        }
        #nj-chat-bubble:hover { transform: scale(1.15) translateY(-5px); }

        #nj-chat-window {
            width: 420px;
            height: 650px;
            background: rgba(18, 33, 58, 0.7);
            backdrop-filter: blur(30px) saturate(180%);
            -webkit-backdrop-filter: blur(30px) saturate(180%);
            border-radius: 35px;
            box-shadow: 0 30px 100px rgba(0,0,0,0.6);
            margin-bottom: 30px;
            display: none;
            flex-direction: column;
            overflow: hidden;
            border: 1px solid rgba(255,255,255,0.15);
            animation: slideIn 0.6s cubic-bezier(0.23, 1, 0.32, 1);
        }
        @keyframes slideIn { 
            from { opacity: 0; transform: translateY(50px) scale(0.9); } 
            to { opacity: 1; transform: translateY(0) scale(1); } 
        }

        .nj-chat-header {
            padding: 30px;
            background: rgba(255,255,255,0.05);
            color: #fff;
            display: flex;
            align-items: center;
            gap: 18px;
            position: relative;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .nj-chat-header .bot-avatar {
            width: 55px;
            height: 55px;
            background: linear-gradient(135deg, rgba(184,134,11,0.2), rgba(255,255,255,0.1));
            border-radius: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid rgba(184,134,11,0.4);
            box-shadow: 0 0 20px rgba(184,134,11,0.2);
        }
        .nj-chat-header .bot-avatar img { width: 45px; height: 45px; }
        .nj-chat-header h4 { margin: 0; font-size: 1.3rem; color: #D4A017; font-family: 'Cinzel', serif; letter-spacing: 1.5px; text-shadow: 0 2px 5px rgba(0,0,0,0.3); }
        .nj-chat-header span { font-size: 0.85rem; color: rgba(255,255,255,0.5); font-weight: 300; }

        .nj-chat-messages {
            flex-grow: 1;
            padding: 30px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 25px;
            background: transparent;
        }
        .nj-chat-messages::-webkit-scrollbar { width: 4px; }
        .nj-chat-messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }

        .msg {
            padding: 18px 25px;
            border-radius: 25px;
            font-size: 1rem;
            line-height: 1.7;
            max-width: 88%;
            word-wrap: break-word;
            position: relative;
            box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }
        .msg-bot {
            background: rgba(255, 255, 255, 0.95);
            align-self: flex-start;
            border-bottom-left-radius: 5px;
            color: #12213A;
            border: 1px solid rgba(255,255,255,0.5);
        }
        .msg-user {
            background: linear-gradient(135deg, #B8860B, #8B6508);
            color: #fff;
            align-self: flex-end;
            border-bottom-right-radius: 5px;
            box-shadow: 0 15px 30px rgba(184,134,11,0.3);
        }
        
        .msg-bot .book-card {
            margin-top: 20px;
            border-radius: 25px;
            overflow: hidden;
            background: #fff;
            box-shadow: 0 20px 50px rgba(0,0,0,0.15);
            border: 1px solid #f5f5f5;
            transition: all 0.4s ease;
        }
        .msg-bot .book-card:hover { transform: translateY(-8px) scale(1.02); }
        .msg-bot .book-card img {
            width: 100%;
            height: auto;
            display: block;
        }
        .msg-bot .book-card .card-content {
            padding: 15px;
            text-align: center;
        }
        .msg-bot .book-card a {
            display: inline-block;
            background: linear-gradient(135deg, #12213A, #1A2A6C);
            color: #fff;
            text-align: center;
            padding: 10px 25px;
            text-decoration: none;
            border-radius: 25px;
            font-weight: 600;
            font-size: 0.85rem;
            margin-top: 10px;
            box-shadow: 0 5px 15px rgba(18,33,58,0.3);
        }

        .nj-chat-input {
            padding: 20px 25px;
            background: rgba(255,255,255,0.7);
            backdrop-filter: blur(10px);
            border-top: 1px solid rgba(0,0,0,0.05);
            display: flex;
            gap: 12px;
        }
        .nj-chat-input input {
            flex-grow: 1;
            border: 1px solid rgba(0,0,0,0.1);
            border-radius: 15px;
            padding: 12px 18px;
            outline: none;
            font-size: 1rem;
            background: #fff;
            transition: all 0.3s ease;
            box-shadow: inset 0 2px 5px rgba(0,0,0,0.02);
        }
        .nj-chat-input input:focus { border-color: #B8860B; box-shadow: 0 0 0 4px rgba(184,134,11,0.1); }
        .nj-chat-input button {
            background: linear-gradient(135deg, #B8860B, #8B6508);
            color: #fff;
            border: none;
            border-radius: 15px;
            padding: 0 25px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s ease;
            box-shadow: 0 5px 15px rgba(184,134,11,0.3);
        }
        .nj-chat-input button:hover { transform: scale(1.05); box-shadow: 0 8px 20px rgba(184,134,11,0.4); }

        .affiliate-disclaimer {
            font-size: 0.7rem;
            color: #999;
            text-align: center;
            padding: 8px;
            background: rgba(255,255,255,0.5);
        }
        .typing {
            font-style: italic;
            font-size: 0.8rem;
            color: #B8860B;
            display: none;
            padding: 5px 25px;
            font-weight: 400;
        }
    `;
    const styleTag = document.createElement('style');
    styleTag.innerHTML = styles;
    document.head.appendChild(styleTag);

    // Dynamic path for the robot icon
    const getBaseUrl = () => {
        const scripts = document.getElementsByTagName('script');
        for (let s of scripts) {
            if (s.src.includes('gemini-widget.js')) {
                return s.src.replace('gemini-widget.js', '');
            }
        }
        return '';
    };
    const baseUrl = getBaseUrl();
    const robotImgUrl = baseUrl + 'robot_elite.png';

    const robotIcon = `<img src="${robotImgUrl}" alt="Bot">`;

    // --- HTML ---
    const widgetHtml = `
        <div id="nj-chat-widget">
            <div id="nj-chat-window">
                <div class="nj-chat-header">
                    <div class="bot-avatar">${robotIcon}</div>
                    <div>
                        <h4>Sábio da Nova Jerusalém</h4>
                        <span>Assistente de Elite Ativo</span>
                    </div>
                </div>
                <div class="nj-chat-messages" id="nj-msg-container">
                    <div class="msg msg-bot">Graça e Paz! Eu sou o assistente oficial da Escola Bíblica. Estou pronto para tirar suas dúvidas sobre a Bíblia e sugerir livros para seu crescimento espiritual. Como posso ajudar?</div>
                </div>
                <div id="nj-typing" class="typing">O Sábio está consultando as escrituras...</div>
                <div class="nj-chat-input">
                    <input type="text" id="nj-input" placeholder="Digite sua dúvida bíblica...">
                    <button id="nj-send">Enviar</button>
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
