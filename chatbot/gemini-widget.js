// gemini-widget.js - Sábio da Nova Jerusalém
// Versão: 6.0.0 (Motor: Pollinations.ai — 100% gratuito, sem API key, disponível para todos)

(function () {
    'use strict';

    window.initializeGeminiChatbot = function (options = {}) {

        const CONFIG = {
            faqPath:          options.jsonConfigUrl || 'chatbot/faq_library.json',
            booksPath:        options.booksUrl      || 'books_categorized.json',
            bibleApi:         'https://bible-api.com',
            bibleTranslation: 'almeida',
            // ── POLLINATIONS.AI ─────────────────────────────────────────────────
            // Completamente gratuito, sem registo, sem API key.
            // Funciona de qualquer browser em qualquer dispositivo.
            aiEndpoint: 'https://text.pollinations.ai/openai',
            aiModel:    'openai',       // opções: openai | openai-large | mistral | llama
            // ────────────────────────────────────────────────────────────────────
        };

        const STOPWORDS = ['o','a','os','as','um','uma','de','da','do','das','dos',
            'em','no','na','nos','nas','por','para','com','sem','sobre','que',
            'qual','como','quando','onde','porque','é','são','foi','ser','estar','eu','voce'];

        let kb = { faq: [], books: [] };
        let activeTab = 'chat';
        let isOpen    = false;
        let isLoading = false;

        // ── ESTILOS ─────────────────────────────────────────────────────────────
        const styles = `
            @import url('https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;1,400&family=Inter:wght@300;400;500;600&display=swap');
            *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
            :host {
                --gold:   #D4AF37;
                --gold-l: #F4E8C1;
                --navy:   #0a1628;
                --glass:  rgba(10,22,40,0.93);
                --border: rgba(212,175,55,0.28);
                --txt:    #f0f4ff;
                --txt-m:  #a0a8c0;
                --ai:     #4DB8FF;
            }

            /* ── WIDGET WRAPPER ── */
            .sabio-widget {
                position: fixed; bottom: 24px; right: 24px;
                z-index: 10000; font-family: 'Inter', sans-serif;
            }

            /* ── TOGGLE BUBBLE ── */
            .sabio-bubble {
                width: 68px; height: 68px; border-radius: 50%;
                background: linear-gradient(135deg, #D4AF37, #B8860B);
                border: 2.5px solid var(--gold-l);
                box-shadow: 0 6px 28px rgba(212,175,55,0.45), 0 0 0 0 rgba(212,175,55,0.4);
                cursor: pointer; display: flex; align-items: center; justify-content: center;
                transition: all .4s cubic-bezier(.175,.885,.32,1.275);
                font-size: 32px; color: #fff; user-select: none;
                animation: pulse-bubble 3s ease-in-out infinite;
            }
            @keyframes pulse-bubble {
                0%, 100% { box-shadow: 0 6px 28px rgba(212,175,55,.45), 0 0 0 0 rgba(212,175,55,.3); }
                50%       { box-shadow: 0 6px 28px rgba(212,175,55,.45), 0 0 0 10px rgba(212,175,55,0); }
            }
            .sabio-bubble:hover  { transform: scale(1.1) rotate(5deg); animation: none; }
            .sabio-bubble.active { transform: rotate(45deg); background: #b02020; border-color: #ff8080; animation: none; }

            /* ── NOTIFICATION BADGE ── */
            .notif-badge {
                position: absolute; top: -4px; right: -4px;
                width: 16px; height: 16px; border-radius: 50%;
                background: #ff4444; border: 2px solid white;
                font-size: 9px; color: white; font-weight: 700;
                display: flex; align-items: center; justify-content: center;
            }

            /* ── CHAT WINDOW ── */
            .sabio-chat-window {
                position: absolute; bottom: 82px; right: 0;
                width: 440px; height: 700px; max-height: 88vh;
                background: var(--glass); backdrop-filter: blur(28px) saturate(1.4);
                border: 1px solid var(--border); border-radius: 28px;
                box-shadow: 0 24px 72px rgba(0,0,0,.7), 0 0 0 1px rgba(212,175,55,.08);
                display: flex; flex-direction: column;
                opacity: 0; transform: translateY(24px) scale(.93);
                pointer-events: none;
                transition: all .42s cubic-bezier(.16,1,.3,1); overflow: hidden;
            }
            .sabio-chat-window.open {
                opacity: 1; transform: translateY(0) scale(1); pointer-events: all;
            }

            /* ── HEADER ── */
            .sabio-hdr {
                display: flex; align-items: center; gap: 10px;
                padding: 16px 20px 10px;
                border-bottom: 1px solid rgba(255,255,255,.06);
            }
            .hdr-avatar {
                width: 36px; height: 36px; border-radius: 50%;
                background: linear-gradient(135deg,#D4AF37,#B8860B);
                display: flex; align-items: center; justify-content: center;
                font-size: 18px; flex-shrink: 0;
            }
            .hdr-info { flex: 1; }
            .hdr-name { font-size: 14px; font-weight: 600; color: var(--gold); line-height: 1; }
            .hdr-sub  { font-size: 10.5px; color: var(--txt-m); margin-top: 2px; display: flex; align-items: center; gap: 5px; }
            .online-dot { width: 6px; height: 6px; border-radius: 50%; background: #4ade80; box-shadow: 0 0 5px #4ade80; flex-shrink: 0; }

            /* ── ABAS ── */
            .sabio-tabs {
                display: flex; background: rgba(0,0,0,.25);
                border-bottom: 1px solid rgba(255,255,255,.06);
            }
            .sabio-tab {
                flex: 1; padding: 12px 6px; text-align: center; cursor: pointer;
                color: var(--txt-m); font-size: 11.5px; font-weight: 500;
                transition: all .3s; display: flex; flex-direction: column;
                align-items: center; gap: 3px; letter-spacing: .01em;
            }
            .sabio-tab span { font-size: 17px; }
            .sabio-tab.active {
                color: var(--gold); background: rgba(212,175,55,.1);
                border-bottom: 2.5px solid var(--gold);
            }
            .sabio-tab:hover:not(.active) { color: var(--txt); background: rgba(255,255,255,.04); }

            /* ── CONTEÚDO ── */
            .sabio-content { flex: 1; overflow-y: auto; display: none; padding: 18px; flex-direction: column; }
            .sabio-content.active { display: flex; }
            .sabio-content::-webkit-scrollbar { width: 4px; }
            .sabio-content::-webkit-scrollbar-thumb { background: rgba(212,175,55,.3); border-radius: 4px; }

            /* ── MENSAGENS ── */
            .sabio-messages { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 14px; padding-bottom: 4px; }
            .sabio-messages::-webkit-scrollbar { width: 3px; }
            .sabio-messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,.1); }

            .message-wrap { display: flex; gap: 8px; align-items: flex-end; max-width: 92%; }
            .message-wrap.user { align-self: flex-end; flex-direction: row-reverse; }
            .msg-avatar { width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 14px; }
            .msg-av-bot { background: linear-gradient(135deg,#D4AF37,#8B6914); }
            .msg-av-usr { background: linear-gradient(135deg,#4DB8FF,#1a6faa); }

            .message {
                padding: 11px 15px; border-radius: 18px; line-height: 1.6;
                font-size: 14.5px; max-width: 100%;
            }
            .message.user {
                background: linear-gradient(135deg, var(--ai), #1a6faa);
                color: #fff; border-bottom-right-radius: 5px;
            }
            .message.bot {
                background: rgba(255,255,255,.09); color: var(--txt);
                border-bottom-left-radius: 5px;
                font-family: 'Crimson Text', serif; font-size: 15.5px;
                border: 1px solid rgba(255,255,255,.08);
            }

            /* BÍBLIA BLOCK */
            .bible-block {
                background: rgba(212,175,55,.12);
                border-left: 3px solid var(--gold);
                padding: 10px 13px; margin-bottom: 10px;
                border-radius: 0 10px 10px 0;
                font-style: italic; font-size: 14px; color: var(--txt);
            }
            .bible-ref {
                display: block; color: var(--gold); font-style: normal;
                font-size: 10px; font-weight: 600; text-transform: uppercase;
                letter-spacing: 1px; margin-bottom: 4px;
            }

            /* BOOK SUGESTÃO */
            .book-chip {
                display: inline-flex; align-items: center; gap: 5px;
                background: rgba(212,175,55,.1); border: 1px solid rgba(212,175,55,.25);
                border-radius: 8px; padding: 5px 10px; font-size: 11.5px;
                color: var(--gold); text-decoration: none; margin-top: 8px; margin-right: 4px;
                transition: background .2s;
            }
            .book-chip:hover { background: rgba(212,175,55,.2); }

            /* AI BADGE */
            .ai-badge { font-size: 9.5px; color: var(--ai); float: right; margin-top: 6px; opacity: .75; }

            /* TYPING ── */
            .typing-wrap { display: flex; gap: 8px; align-items: center; padding: 4px 0; }
            .typing-dots { display: flex; gap: 4px; }
            .typing-dots span {
                width: 6px; height: 6px; border-radius: 50%;
                background: var(--gold); opacity: .5;
                animation: blink 1.4s ease-in-out infinite;
            }
            .typing-dots span:nth-child(2) { animation-delay: .2s; }
            .typing-dots span:nth-child(3) { animation-delay: .4s; }
            @keyframes blink { 0%,80%,100% { opacity:.2; transform:scale(.9); } 40% { opacity:1; transform:scale(1); } }

            /* ESTUDOS */
            .study-item {
                background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.08);
                padding: 13px 15px; border-radius: 13px; margin-bottom: 9px;
                cursor: pointer; transition: all .2s;
            }
            .study-item:hover { background: rgba(212,175,55,.1); border-color: rgba(212,175,55,.4); transform: translateX(3px); }
            .study-item h4 { color: var(--gold); font-size: 13.5px; margin-bottom: 4px; line-height: 1.3; }
            .study-item p  { color: var(--txt-m); font-size: 11.5px; line-height: 1.45; }

            /* BIBLIOTECA */
            .book-section-label {
                font-size: 10px; font-weight: 600; text-transform: uppercase;
                letter-spacing: .15em; color: var(--txt-m);
                border-bottom: 1px solid rgba(255,255,255,.07);
                padding-bottom: 6px; margin: 14px 0 10px;
            }
            .book-item {
                display: flex; gap: 12px;
                background: rgba(255,255,255,.04); padding: 12px;
                border-radius: 14px; margin-bottom: 11px;
                border: 1px solid rgba(255,255,255,.06);
                transition: all .2s;
            }
            .book-item:hover { background: rgba(212,175,55,.07); border-color: rgba(212,175,55,.3); }
            .book-cover {
                width: 62px; height: 90px; object-fit: cover;
                border-radius: 6px; flex-shrink: 0;
                background: linear-gradient(135deg,#1a1a2e,#2a2a4e);
            }
            .book-info { flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
            .book-info h4 { color: var(--gold); font-size: 12.5px; line-height: 1.35; margin-bottom: 3px; }
            .book-info p  { color: var(--txt-m); font-size: 10.5px; }
            .amazon-btn {
                display: inline-block; background: linear-gradient(135deg,#FF9900,#e68900);
                color: #000; font-weight: 700; font-size: 11px;
                padding: 5px 10px; border-radius: 6px; text-decoration: none;
                margin-top: 6px; transition: opacity .2s;
            }
            .amazon-btn:hover { opacity: .85; }

            /* INPUT */
            .sabio-input-area {
                padding: 13px 16px 14px;
                background: rgba(0,0,0,.35);
                border-top: 1px solid rgba(255,255,255,.06);
                display: flex; gap: 9px; align-items: center;
            }
            .sabio-input {
                flex: 1; background: rgba(255,255,255,.07);
                border: 1px solid rgba(255,255,255,.1); border-radius: 22px;
                padding: 10px 16px; color: var(--txt); outline: none;
                font-size: 13.5px; font-family: 'Inter', sans-serif;
                transition: border-color .25s;
            }
            .sabio-input::placeholder { color: rgba(255,255,255,.28); }
            .sabio-input:focus { border-color: rgba(212,175,55,.5); }
            .sabio-send {
                width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0;
                background: linear-gradient(135deg,var(--gold),#B8860B);
                border: none; color: #fff; cursor: pointer; font-size: 16px;
                display: flex; align-items: center; justify-content: center;
                transition: all .2s; box-shadow: 0 3px 12px rgba(212,175,55,.3);
            }
            .sabio-send:hover { transform: scale(1.08); box-shadow: 0 5px 18px rgba(212,175,55,.45); }
            .sabio-send:active { transform: scale(.95); }

            /* SUGESTÕES RÁPIDAS */
            .quick-suggestions {
                display: flex; gap: 6px; flex-wrap: wrap; padding: 8px 0 12px;
            }
            .quick-btn {
                background: rgba(212,175,55,.1); border: 1px solid rgba(212,175,55,.2);
                border-radius: 16px; padding: 5px 11px; font-size: 11px;
                color: var(--gold); cursor: pointer; transition: all .2s; white-space: nowrap;
            }
            .quick-btn:hover { background: rgba(212,175,55,.2); border-color: var(--gold); }

            /* MOBILE */
            @media (max-width: 500px) {
                .sabio-widget { bottom: 14px; right: 14px; }
                .sabio-chat-window { width: calc(100vw - 28px); height: 84vh; right: 0; bottom: 78px; border-radius: 22px; }
                .sabio-bubble { width: 60px; height: 60px; font-size: 28px; }
            }
            @media (max-height: 640px) { .sabio-chat-window { height: 90vh; } }
        `;

        // ── WIDGET CLASS ─────────────────────────────────────────────────────────
        class SabioWidget {
            constructor() {
                this.host   = document.createElement('div');
                this.shadow = this.host.attachShadow({ mode: 'open' });
                document.body.appendChild(this.host);
                this.init();
            }

            async init() {
                const styleEl = document.createElement('style');
                styleEl.textContent = styles;
                this.shadow.appendChild(styleEl);
                this.render();
                await this.loadData();
                this.setupTabs();
                this.addBotMessage('✦ Graça e Paz! Sou o <strong>Sábio da Nova Jerusalém</strong>. Posso responder questões bíblicas, ajudá-lo a encontrar livros e partilhar estudos. Como posso servir?');
                this.populateStudies();
                this.populateLibrary();
            }

            // ── RENDER ───────────────────────────────────────────────────────────
            render() {
                this.shadow.innerHTML += `
                <div class="sabio-widget">
                    <div style="position:relative; display:inline-block;">
                        <div class="sabio-bubble" id="toggleBtn">📖</div>
                        <div class="notif-badge" id="notifBadge">1</div>
                    </div>
                    <div class="sabio-chat-window" id="window">

                        <!-- HEADER -->
                        <div class="sabio-hdr">
                            <div class="hdr-avatar">📖</div>
                            <div class="hdr-info">
                                <div class="hdr-name">Sábio da Nova Jerusalém</div>
                                <div class="hdr-sub">
                                    <div class="online-dot"></div>
                                    <span>IA disponível • Escola Bíblica Online</span>
                                </div>
                            </div>
                        </div>

                        <!-- ABAS -->
                        <div class="sabio-tabs">
                            <div class="sabio-tab active" data-tab="chat"><span>💬</span>Chat</div>
                            <div class="sabio-tab" data-tab="estudos"><span>📝</span>Estudos</div>
                            <div class="sabio-tab" data-tab="biblioteca"><span>📚</span>Livros</div>
                        </div>

                        <!-- ABA CHAT -->
                        <div class="sabio-content active" id="tab-chat">
                            <div class="sabio-messages" id="messages"></div>
                            <div id="typingWrap" style="display:none; padding:4px 0;">
                                <div class="typing-wrap">
                                    <div class="msg-avatar msg-av-bot">📖</div>
                                    <div class="typing-dots">
                                        <span></span><span></span><span></span>
                                    </div>
                                </div>
                            </div>
                            <div class="quick-suggestions" id="quickSuggestions">
                                <div class="quick-btn">🛡️ Espíritos Marinhos</div>
                                <div class="quick-btn">💰 Prosperidade Bíblica</div>
                                <div class="quick-btn">🙏 Como orar melhor?</div>
                                <div class="quick-btn">📖 O que é a eternidade?</div>
                            </div>
                            <div class="sabio-input-area">
                                <input type="text" class="sabio-input" id="userInput" placeholder="Faça sua pergunta bíblica...">
                                <button class="sabio-send" id="sendBtn">➤</button>
                            </div>
                        </div>

                        <!-- ABA ESTUDOS -->
                        <div class="sabio-content" id="tab-estudos">
                            <h3 style="color:var(--gold);font-size:14px;margin-bottom:14px;letter-spacing:.05em">📝 ESTUDOS BÍBLICOS DISPONÍVEIS</h3>
                            <div id="list-estudos"></div>
                        </div>

                        <!-- ABA BIBLIOTECA -->
                        <div class="sabio-content" id="tab-biblioteca">
                            <h3 style="color:var(--gold);font-size:14px;margin-bottom:6px;letter-spacing:.05em">📚 BIBLIOTECA RECOMENDADA</h3>
                            <p style="color:var(--txt-m);font-size:11px;margin-bottom:12px">Livros seleccionados para o seu crescimento espiritual e financeiro.</p>
                            <div id="list-biblioteca"></div>
                        </div>

                    </div>
                </div>`;

                this.bubble       = this.shadow.querySelector('#toggleBtn').parentElement;
                this.toggleBtn    = this.shadow.querySelector('#toggleBtn');
                this.notifBadge   = this.shadow.querySelector('#notifBadge');
                this.window       = this.shadow.querySelector('#window');
                this.input        = this.shadow.querySelector('#userInput');
                this.sendBtn      = this.shadow.querySelector('#sendBtn');
                this.msgContainer = this.shadow.querySelector('#messages');
                this.typingWrap   = this.shadow.querySelector('#typingWrap');

                this.toggleBtn.onclick = () => {
                    isOpen = !isOpen;
                    this.window.classList.toggle('open', isOpen);
                    this.toggleBtn.classList.toggle('active', isOpen);
                    if (isOpen) {
                        this.notifBadge.style.display = 'none';
                        if (activeTab === 'chat') this.input.focus();
                    }
                };

                this.sendBtn.onclick  = () => this.handleSend();
                this.input.onkeypress = (e) => { if (e.key === 'Enter') this.handleSend(); };

                // Quick suggestions
                this.shadow.querySelectorAll('.quick-btn').forEach(btn => {
                    btn.onclick = () => {
                        this.input.value = btn.textContent.replace(/^[^\s]+\s/, '');
                        this.handleSend();
                        this.shadow.querySelector('#quickSuggestions').style.display = 'none';
                    };
                });
            }

            setupTabs() {
                const tabs = this.shadow.querySelectorAll('.sabio-tab');
                tabs.forEach(tab => {
                    tab.onclick = () => {
                        activeTab = tab.dataset.tab;
                        tabs.forEach(t => t.classList.remove('active'));
                        tab.classList.add('active');
                        this.shadow.querySelectorAll('.sabio-content').forEach(c => c.classList.remove('active'));
                        this.shadow.getElementById(`tab-${activeTab}`).classList.add('active');
                    };
                });
            }

            // ── CARREGAR DADOS ────────────────────────────────────────────────────
            async loadData() {
                try {
                    const [faqRes, booksRes] = await Promise.allSettled([
                        fetch(CONFIG.faqPath).then(r => r.json()),
                        fetch(CONFIG.booksPath).then(r => r.json())
                    ]);
                    kb.faq = (faqRes.status === 'fulfilled' ? (faqRes.value.questions || faqRes.value || []) : []);
                    const br = booksRes.status === 'fulfilled' ? booksRes.value : [];
                    // Suporta tanto books_categorized.json (array de cats) como books.json (array plano)
                    if (Array.isArray(br) && br.length && br[0]?.books) {
                        kb.books = br.flatMap(cat => cat.books.map(b => ({ ...b, category: cat.category })));
                        kb.categories = br;
                    } else {
                        kb.books = Array.isArray(br) ? br : [];
                        kb.categories = null;
                    }
                } catch (e) { console.error('[Sábio]', e); }
            }

            // ── POPULAR ESTUDOS ───────────────────────────────────────────────────
            populateStudies() {
                const c = this.shadow.querySelector('#list-estudos');
                if (!c || !kb.faq.length) { c && (c.innerHTML = '<p style="color:var(--txt-m);font-size:13px">A carregar estudos...</p>'); return; }
                c.innerHTML = kb.faq.map(f => `
                    <div class="study-item" data-q="${this.esc(f.question)}">
                        <h4>${f.question}</h4>
                        <p>${f.answer.substring(0, 95)}...</p>
                    </div>`).join('');
                c.querySelectorAll('.study-item').forEach(el => {
                    el.onclick = () => {
                        this.shadow.querySelector('[data-tab="chat"]').click();
                        this.input.value = el.dataset.q;
                        this.handleSend();
                    };
                });
            }

            // ── POPULAR BIBLIOTECA ────────────────────────────────────────────────
            populateLibrary() {
                const c = this.shadow.querySelector('#list-biblioteca');
                if (!c) return;
                if (!kb.books.length) {
                    c.innerHTML = '<p style="color:var(--txt-m);font-size:13px">A carregar livros...</p>';
                    return;
                }
                if (kb.categories) {
                    // Exibe por categorias
                    c.innerHTML = kb.categories.map(cat => `
                        <div class="book-section-label">${cat.icon || '📚'} ${cat.category}</div>
                        ${cat.books.map(b => this.bookItemHTML(b)).join('')}
                    `).join('');
                } else {
                    c.innerHTML = kb.books.map(b => this.bookItemHTML(b)).join('');
                }
            }

            bookItemHTML(b) {
                const link = b.affiliate_link || b.amazonUrl || '#';
                return `
                    <div class="book-item">
                        <img class="book-cover" src="${b.cover || ''}" alt="${this.esc(b.title)}"
                             loading="lazy"
                             onerror="this.style.background='linear-gradient(135deg,#1a1a2e,#2a2a4e)';this.removeAttribute('src')">
                        <div class="book-info">
                            <div>
                                <h4>${b.title}</h4>
                                <p>${b.category || 'Recomendado'}</p>
                            </div>
                            <a href="${link}" target="_blank" rel="noopener" class="amazon-btn">🛒 Ver na Amazon</a>
                        </div>
                    </div>`;
            }

            // ── ENVIO ─────────────────────────────────────────────────────────────
            async handleSend() {
                const text = this.input.value.trim();
                if (!text || isLoading) return;
                this.input.value = '';
                this.shadow.querySelector('#quickSuggestions').style.display = 'none';
                this.addUserMessage(text);
                this.typingWrap.style.display = 'block';
                isLoading = true;
                try   { await this.processQuery(text); }
                finally { this.typingWrap.style.display = 'none'; isLoading = false; }
            }

            // ── PROCESSAMENTO ─────────────────────────────────────────────────────
            async processQuery(query) {
                const [scriptures, relevantBooks] = await Promise.all([
                    this.fetchBibleVerses(query),
                    Promise.resolve(this.searchBooks(query))
                ]);

                const faqCtx = kb.faq.slice(0, 15).map(f => `P: ${f.question}\nR: ${f.answer}`).join('\n\n');
                const bookCtx = relevantBooks.length
                    ? '\n\nLIVROS RELACIONADOS:\n' + relevantBooks.map(b => `- "${b.title}" → ${b.affiliate_link || ''}`).join('\n')
                    : '';
                const bibleCtx = scriptures.length
                    ? '\n\nVERSÍCULOS ENCONTRADOS:\n' + scriptures.map(s => `${s.ref}: "${s.text.trim()}"`).join('\n')
                    : '';

                const systemPrompt = `És o Sábio da Nova Jerusalém — assistente bíblico sábio, amoroso e ungido. Respondes SEMPRE em Português de Portugal com graciosidade pastoral.

Regras:
1. Baseia as respostas nas Escrituras. Cita versículos bíblicos sempre que relevante.
2. Usa o conhecimento da FAQ como base principal.
3. Quando o utilizador perguntar sobre livros, recomenda com o link Amazon.
4. Sê conciso mas completo (3-4 parágrafos). Usa Markdown simples (negrito **texto**).
5. Termina SEMPRE com uma bênção ou versículo motivador curto.
6. Nunca inventes versículos — se não saben, diz que não encontras.

CONHECIMENTO DA FAQ:
${faqCtx}${bookCtx}${bibleCtx}`;

                const response = await this.callAI(systemPrompt, query);

                // Montar HTML
                let html = '';
                // Versículos da Bíblia
                if (scriptures.length) {
                    scriptures.forEach(s => {
                        html += `<div class="bible-block"><span class="bible-ref">📖 ${s.ref}</span>${s.text.trim()}</div>`;
                    });
                }
                // Resposta da IA
                html += `<div>${this.fmt(response)}</div>`;
                // Livros sugeridos
                if (relevantBooks.length) {
                    html += `<div style="margin-top:10px">`;
                    relevantBooks.slice(0, 3).forEach(b => {
                        html += `<a href="${b.affiliate_link || '#'}" target="_blank" rel="noopener" class="book-chip">📚 ${b.title}</a>`;
                    });
                    html += `</div>`;
                }
                html += `<div class="ai-badge">✦ Nova Jerusalém IA</div>`;

                this.addBotMessage(html);
            }

            // ── POLLINATIONS.AI ───────────────────────────────────────────────────
            async callAI(systemPrompt, userQuery) {
                try {
                    const res = await fetch(CONFIG.aiEndpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            model:    CONFIG.aiModel,
                            private:  true,
                            messages: [
                                { role: 'system', content: systemPrompt },
                                { role: 'user',   content: userQuery }
                            ],
                            temperature: 0.7,
                            max_tokens:  800
                        }),
                        signal: AbortSignal.timeout(25000)
                    });
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    const data = await res.json();
                    return data.choices?.[0]?.message?.content || data.text || '';
                } catch (e) {
                    console.warn('[Sábio/AI] Usando FAQ local:', e.message);
                    return this.fallbackFAQ(userQuery);
                }
            }

            // ── FALLBACK FAQ ──────────────────────────────────────────────────────
            fallbackFAQ(query) {
                const norm   = this.norm(query);
                const tokens = norm.split(/\s+/).filter(t => t.length > 2 && !STOPWORDS.includes(t));
                let best = null, bestScore = 0;
                for (const item of kb.faq) {
                    let score = 0;
                    const qn = this.norm(item.question), an = this.norm(item.answer);
                    if (qn.includes(norm)) score += 10;
                    tokens.forEach(t => { if (qn.includes(t)) score += 2; if (an.includes(t)) score += 1; });
                    if (score > bestScore) { bestScore = score; best = item; }
                }
                if (best && bestScore > 1) return best.answer;
                return 'Não encontrei estudos específicos sobre este tema. Contacte-nos em **leituradacuraportugal@gmail.com** e respondemos com prazer. 🙏';
            }

            // ── FETCH VERSÍCULOS ──────────────────────────────────────────────────
            async fetchBibleVerses(text) {
                const regex = /\b(\d?\s*[a-zA-ZçÇãÃõÕáÁéÉíÍóÓúÚ]+)\s+(\d+):(\d+)(?:-(\d+))?\b/g;
                const refs = []; let m;
                while ((m = regex.exec(text)) !== null)
                    refs.push(`${m[1].trim()} ${m[2]}:${m[3]}${m[4] ? '-'+m[4] : ''}`);
                const results = [];
                for (const ref of [...new Set(refs)].slice(0, 2)) {
                    try {
                        const r = await fetch(`${CONFIG.bibleApi}/${encodeURIComponent(ref)}?translation=${CONFIG.bibleTranslation}`);
                        const d = await r.json();
                        if (d?.text) results.push({ ref: d.reference, text: d.text });
                    } catch (_) {}
                }
                return results;
            }

            // ── BUSCA DE LIVROS LOCAL ─────────────────────────────────────────────
            searchBooks(query) {
                const tokens = this.norm(query).split(/\s+/).filter(t => t.length > 3);
                if (!tokens.length) return [];
                return kb.books.filter(b => {
                    const bn = this.norm(b.title);
                    return tokens.some(t => bn.includes(t));
                }).slice(0, 3);
            }

            // ── DOM HELPERS ───────────────────────────────────────────────────────
            addBotMessage(html) {
                const wrap = document.createElement('div');
                wrap.className = 'message-wrap';
                wrap.innerHTML = `<div class="msg-avatar msg-av-bot">📖</div><div class="message bot">${html}</div>`;
                this.msgContainer.appendChild(wrap);
                this.msgContainer.scrollTop = this.msgContainer.scrollHeight;
            }

            addUserMessage(text) {
                const wrap = document.createElement('div');
                wrap.className = 'message-wrap user';
                wrap.innerHTML = `<div class="msg-avatar msg-av-usr">👤</div><div class="message user">${this.esc(text)}</div>`;
                this.msgContainer.appendChild(wrap);
                this.msgContainer.scrollTop = this.msgContainer.scrollHeight;
            }

            norm(t) { return t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\w\s]/g,'').trim(); }
            fmt(t)  {
                return t
                    .replace(/\n\n/g, '</p><p>')
                    .replace(/\n/g, '<br>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>');
            }
            esc(s)  { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
        }

        new SabioWidget();
    };
})();
