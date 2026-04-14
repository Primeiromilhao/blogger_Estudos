// gemini-widget.js - Sábio da Nova Jerusalém
// Versão: 4.0.0 (Motor: Groq llama3 | Abas: Chat, Estudos, Biblioteca)

(function() {
    'use strict';

    window.initializeGeminiChatbot = function(options = {}) {

        const CONFIG = {
            faqPath:         options.jsonConfigUrl || 'chatbot/faq_library.json',
            booksPath:       options.booksUrl      || 'books_categorized.json',
            bibleApi:        'https://bible-api.com',
            bibleTranslation:'almeida',
            maxResults:      5,

            // ── GROQ CONFIG ─────────────────────────────────────────────────────
            // Chave pública de cliente (CORS permitido pela Groq para browsers)
            // Substitua pelo valor real em groq.com/keys
            groqApiKey:  options.groqApiKey || 'SUA_CHAVE_GROQ_AQUI',
            groqModel:   'llama3-8b-8192',
            groqEndpoint:'https://api.groq.com/openai/v1/chat/completions',
            // ────────────────────────────────────────────────────────────────────
        };

        const STOPWORDS = ['o','a','os','as','um','uma','de','da','do','das','dos',
            'em','no','na','nos','nas','por','para','com','sem','sobre','sob',
            'que','qual','quais','como','quando','onde','porque','é','são',
            'foi','foram','ser','estar','eu','voce'];

        let knowledgeBase = { faq: [], books: [] };
        let activeTab = 'chat';
        let isOpen = false;
        let isLoading = false;

        // ── CSS ─────────────────────────────────────────────────────────────────
        const styles = `
            @import url('https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;1,400&family=Inter:wght@300;400;500;600&display=swap');
            * { margin:0; padding:0; box-sizing:border-box; }
            :host {
                --gold:   #D4AF37;
                --gold-l: #F4E8C1;
                --navy:   #0a1628;
                --glass:  rgba(10,22,40,0.92);
                --border: rgba(212,175,55,0.3);
                --txt:    #f0f0f0;
                --txt-m:  #b0b0b0;
                --groq:   #F55036;
            }
            .sabio-widget { position:fixed; bottom:25px; right:25px; z-index:10000; font-family:'Inter',sans-serif; }

            .sabio-bubble {
                width:70px; height:70px; border-radius:50%;
                background:linear-gradient(135deg,var(--gold) 0%,#B8860B 100%);
                border:2px solid var(--gold-l);
                box-shadow:0 5px 25px rgba(212,175,55,0.4);
                cursor:pointer; display:flex; align-items:center; justify-content:center;
                transition:all .4s cubic-bezier(.175,.885,.32,1.275);
                font-size:35px; color:#fff;
            }
            .sabio-bubble:hover { transform:scale(1.1) rotate(5deg); }
            .sabio-bubble.active { transform:rotate(45deg); background:#c82333; border-color:#ff6b6b; }

            .sabio-chat-window {
                position:absolute; bottom:85px; right:0;
                width:430px; height:690px; max-height:87vh;
                background:var(--glass); backdrop-filter:blur(25px);
                border:1px solid var(--border); border-radius:25px;
                box-shadow:0 20px 60px rgba(0,0,0,.6);
                display:flex; flex-direction:column;
                opacity:0; transform:translateY(20px) scale(.95);
                pointer-events:none;
                transition:all .4s cubic-bezier(.16,1,.3,1); overflow:hidden;
            }
            .sabio-chat-window.open { opacity:1; transform:translateY(0) scale(1); pointer-events:all; }

            /* HEADER BADGE */
            .sabio-header {
                display:flex; align-items:center; gap:8px;
                padding:12px 18px 0;
                font-size:11px; color:var(--groq);
                font-weight:600; letter-spacing:.5px;
            }
            .badge-groq {
                background:var(--groq); color:#fff;
                padding:2px 7px; border-radius:20px;
                font-size:10px; font-weight:700;
            }

            /* ABAS */
            .sabio-tabs { display:flex; background:rgba(0,0,0,.2); border-bottom:1px solid var(--border); }
            .sabio-tab {
                flex:1; padding:13px; text-align:center; cursor:pointer;
                color:var(--txt-m); font-size:12.5px; font-weight:500;
                transition:all .3s; display:flex; flex-direction:column; align-items:center; gap:3px;
            }
            .sabio-tab.active { color:var(--gold); background:rgba(212,175,55,.1); border-bottom:3px solid var(--gold); }

            /* CONTEÚDO */
            .sabio-content { flex:1; overflow-y:auto; display:none; padding:18px; }
            .sabio-content.active { display:flex; flex-direction:column; }
            .sabio-messages { flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:14px; }

            /* MENSAGENS */
            .message { max-width:90%; padding:12px 16px; border-radius:18px; line-height:1.55; font-size:15px; }
            .message.user { align-self:flex-end; background:var(--gold); color:#fff; border-bottom-right-radius:4px; }
            .message.bot  { align-self:flex-start; background:rgba(255,255,255,.08); color:var(--txt); border-bottom-left-radius:4px; font-family:'Crimson Text',serif; font-size:16px; }
            .message.error { background:rgba(245,80,54,.15); border:1px solid rgba(245,80,54,.3); }

            /* BÍBLIA */
            .bible-verse {
                background:rgba(212,175,55,.15); border-left:4px solid var(--gold);
                padding:12px; margin-bottom:12px; border-radius:0 10px 10px 0;
                font-style:italic; font-size:15px;
            }
            .bible-verse strong { display:block; color:var(--gold); font-style:normal; font-size:11px; margin-bottom:5px; text-transform:uppercase; letter-spacing:1px; }

            /* GROQ BADGE NA RESPOSTA */
            .groq-badge { font-size:10px; color:var(--groq); font-style:normal; float:right; margin-top:6px; opacity:.7; }

            /* ESTUDOS */
            .study-item { background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.1); padding:14px; border-radius:12px; margin-bottom:10px; cursor:pointer; transition:all .2s; }
            .study-item:hover { background:rgba(212,175,55,.1); border-color:var(--gold); }
            .study-item h4 { color:var(--gold); font-size:14px; margin-bottom:5px; }
            .study-item p  { color:var(--txt-m); font-size:12px; line-height:1.4; }

            /* BIBLIOTECA */
            .book-item { display:flex; gap:14px; background:rgba(255,255,255,.03); padding:14px; border-radius:14px; margin-bottom:14px; border:1px solid rgba(255,255,255,.06); transition:border .2s; }
            .book-item:hover { border-color:rgba(212,175,55,.3); }
            .book-cover { width:68px; height:98px; background:#222; border-radius:6px; flex-shrink:0; object-fit:cover; }
            .book-info  { flex:1; display:flex; flex-direction:column; justify-content:space-between; }
            .book-info h4 { color:var(--gold); font-size:13px; margin-bottom:4px; line-height:1.3; }
            .book-info p  { color:var(--txt-m); font-size:11px; }
            .amazon-btn { background:#FF9900; color:#000; text-decoration:none; padding:6px 12px; border-radius:6px; font-size:12px; font-weight:700; text-align:center; display:inline-block; margin-top:6px; }

            /* INPUT */
            .sabio-input-area { padding:14px 18px; background:rgba(0,0,0,.3); border-top:1px solid var(--border); display:flex; gap:10px; align-items:center; }
            .sabio-input { flex:1; background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.12); border-radius:20px; padding:10px 15px; color:#fff; outline:none; font-size:14px; }
            .sabio-input::placeholder { color:rgba(255,255,255,.35); }
            .sabio-input:focus { border-color:var(--gold); }
            .sabio-send { background:var(--gold); border:none; width:40px; height:40px; border-radius:50%; color:#fff; cursor:pointer; font-size:18px; display:flex; align-items:center; justify-content:center; transition:background .2s; flex-shrink:0; }
            .sabio-send:hover { background:#c9a227; }

            .typing-indicator { font-size:12px; color:var(--groq); margin-top:8px; font-style:italic; padding-left:2px; }

            /* MOBILE */
            @media (max-width:480px) {
                .sabio-widget { bottom:15px; right:15px; }
                .sabio-chat-window { width:calc(100vw - 30px); height:80vh; right:0; bottom:75px; border-radius:20px; }
                .sabio-bubble { width:60px; height:60px; font-size:28px; }
                .sabio-tab { padding:10px 5px; font-size:11px; }
                .message { max-width:95%; font-size:14px; }
            }
            @media (max-height:600px) { .sabio-chat-window { height:88vh; } }
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
                this.addMessage('bot', '✦ Graça e Paz! Sou o Sábio da Nova Jerusalém — agora com inteligência <strong>Groq</strong>. Faça sua pergunta bíblica ou busque um livro.');
                this.populateStudies();
                this.populateLibrary();
            }

            render() {
                this.shadow.innerHTML += `
                    <div class="sabio-widget">
                        <div class="sabio-bubble" id="toggleBtn">📖</div>
                        <div class="sabio-chat-window" id="window">

                            <div class="sabio-header">
                                <span>⚡ Motor</span>
                                <span class="badge-groq">GROQ</span>
                                <span style="color:var(--txt-m); font-weight:400">llama3-8b-8192</span>
                            </div>

                            <div class="sabio-tabs">
                                <div class="sabio-tab active" data-tab="chat"><span>💬</span>Chat</div>
                                <div class="sabio-tab" data-tab="estudos"><span>📝</span>Estudos</div>
                                <div class="sabio-tab" data-tab="biblioteca"><span>📚</span>Livros</div>
                            </div>

                            <!-- Chat -->
                            <div class="sabio-content active" id="tab-chat">
                                <div class="sabio-messages" id="messages"></div>
                                <div id="typing" class="typing-indicator" style="display:none">⚡ Groq está processando...</div>
                                <div class="sabio-input-area">
                                    <input type="text" class="sabio-input" id="userInput" placeholder="Sua dúvida bíblica ou nome do livro...">
                                    <button class="sabio-send" id="sendBtn">➤</button>
                                </div>
                            </div>

                            <!-- Estudos -->
                            <div class="sabio-content" id="tab-estudos">
                                <h3 style="color:var(--gold);margin-bottom:14px;font-size:15px">📝 Estudos Bíblicos</h3>
                                <div id="list-estudos"></div>
                            </div>

                            <!-- Biblioteca -->
                            <div class="sabio-content" id="tab-biblioteca">
                                <h3 style="color:var(--gold);margin-bottom:14px;font-size:15px">📚 Biblioteca Recomendada</h3>
                                <div id="list-biblioteca"></div>
                            </div>

                        </div>
                    </div>
                `;

                this.toggleBtn    = this.shadow.querySelector('#toggleBtn');
                this.window       = this.shadow.querySelector('#window');
                this.input        = this.shadow.querySelector('#userInput');
                this.sendBtn      = this.shadow.querySelector('#sendBtn');
                this.msgContainer = this.shadow.querySelector('#messages');
                this.typing       = this.shadow.querySelector('#typing');

                this.toggleBtn.onclick = () => {
                    isOpen = !isOpen;
                    this.window.classList.toggle('open', isOpen);
                    this.toggleBtn.classList.toggle('active', isOpen);
                    if (isOpen && activeTab === 'chat') this.input.focus();
                };
                this.sendBtn.onclick    = () => this.handleSend();
                this.input.onkeypress   = (e) => { if (e.key === 'Enter') this.handleSend(); };
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

            // ── LOAD DATA ────────────────────────────────────────────────────────
            async loadData() {
                try {
                    const [faqRes, booksRes] = await Promise.all([
                        fetch(CONFIG.faqPath).then(r => r.json()).catch(() => ({ questions: [] })),
                        fetch(CONFIG.booksPath).then(r => r.json()).catch(() => [])
                    ]);
                    knowledgeBase.faq   = faqRes.questions || faqRes || [];
                    // books_categorized.json é array de { category, books:[] }
                    // Achata para lista simples de livros
                    if (Array.isArray(booksRes) && booksRes[0] && booksRes[0].books) {
                        knowledgeBase.books = booksRes.flatMap(cat => cat.books.map(b => ({ ...b, category: cat.category })));
                    } else {
                        knowledgeBase.books = Array.isArray(booksRes) ? booksRes : (booksRes.books || []);
                    }
                    console.log('[Sábio] FAQ carregado:', knowledgeBase.faq.length, '| Livros:', knowledgeBase.books.length);
                } catch (e) {
                    console.error('[Sábio] Erro ao carregar dados:', e);
                }
            }

            // ── POPULATE STUDIES ─────────────────────────────────────────────────
            populateStudies() {
                const container = this.shadow.querySelector('#list-estudos');
                if (!container || !knowledgeBase.faq.length) return;
                container.innerHTML = knowledgeBase.faq.map(item => `
                    <div class="study-item" data-q="${this.escAttr(item.question)}">
                        <h4>${item.question}</h4>
                        <p>${item.answer.substring(0, 90)}...</p>
                    </div>
                `).join('');
                container.querySelectorAll('.study-item').forEach(el => {
                    el.onclick = () => {
                        this.shadow.querySelector('[data-tab="chat"]').click();
                        this.input.value = el.dataset.q;
                        this.handleSend();
                    };
                });
            }

            // ── POPULATE LIBRARY ─────────────────────────────────────────────────
            populateLibrary() {
                const container = this.shadow.querySelector('#list-biblioteca');
                if (!container) return;
                if (!knowledgeBase.books.length) {
                    container.innerHTML = '<p style="text-align:center;color:#666;font-size:13px;margin-top:20px">A carregar livros...</p>';
                    return;
                }
                container.innerHTML = knowledgeBase.books.map(b => `
                    <div class="book-item">
                        <img class="book-cover" src="${b.cover || ''}" alt="${b.title}"
                             onerror="this.style.background='#2a2a3a';this.src=''">
                        <div class="book-info">
                            <div>
                                <h4>${b.title}</h4>
                                <p>${b.category || 'Recomendado'}</p>
                            </div>
                            <a href="${b.affiliate_link || b.amazonUrl || '#'}" target="_blank" class="amazon-btn">🛒 Ver na Amazon</a>
                        </div>
                    </div>
                `).join('');
            }

            // ── SEND HANDLER ─────────────────────────────────────────────────────
            async handleSend() {
                const text = this.input.value.trim();
                if (!text || isLoading) return;
                this.input.value = '';
                this.addMessage('user', text);
                this.typing.style.display = 'block';
                isLoading = true;

                try {
                    await this.processQuery(text);
                } finally {
                    this.typing.style.display = 'none';
                    isLoading = false;
                }
            }

            // ── MAIN QUERY PROCESSOR ─────────────────────────────────────────────
            async processQuery(query) {
                // 1. Buscar versículos relevantes na Bíblia
                const scriptures = await this.fetchBibleVerses(query);

                // 2. Buscar livros relevantes (busca local)
                const relevantBooks = this.searchBooks(query);

                // 3. Montar contexto para o Groq
                const faqContext = knowledgeBase.faq
                    .map(f => `P: ${f.question}\nR: ${f.answer}`)
                    .join('\n\n');

                const bookContext = relevantBooks.length
                    ? '\n\nLIVROS RELACIONADOS:\n' + relevantBooks.map(b => `- "${b.title}" → ${b.affiliate_link || ''}`).join('\n')
                    : '';

                const bibleContext = scriptures.length
                    ? '\n\nVERSÍCULOS ENCONTRADOS:\n' + scriptures.map(s => `${s.ref}: "${s.text.trim()}"`).join('\n')
                    : '';

                const systemPrompt = `Você é o Sábio da Nova Jerusalém — um assistente bíblico sábio e amoroso, especializado em estudos teológicos cristãos. Responda SEMPRE em Português de Portugal.

Regras:
1. Baseie-se sempre nas Escrituras. Cite versículos bíblicos quando relevante.
2. Use o conteúdo da FAQ como base de conhecimento.
3. Se o utilizador perguntar sobre um livro, recomende-o com o link da Amazon.
4. Seja conciso (máximo 4 parágrafos). Use formatação simples.
5. Termine sempre com uma bênção ou versículo motivador.

CONHECIMENTO DA FAQ:
${faqContext}
${bookContext}
${bibleContext}`;

                const response = await this.callGroq(systemPrompt, query);

                // 4. Construir HTML da resposta
                let html = '';
                if (scriptures.length) {
                    scriptures.forEach(s => {
                        html += `<div class="bible-verse"><strong>📖 ${s.ref}</strong>${s.text.trim()}</div>`;
                    });
                }
                html += `<div>${this.formatText(response)}</div>`;
                if (relevantBooks.length) {
                    html += `<br><div style="font-size:13px; color:rgba(212,175,55,.8)">📚 Livros relacionados: ${relevantBooks.slice(0,2).map(b => `<a href="${b.affiliate_link || '#'}" target="_blank" style="color:var(--gold)">${b.title}</a>`).join(', ')}</div>`;
                }
                html += `<div class="groq-badge">⚡ via Groq</div>`;

                this.addMessage('bot', html, true);
            }

            // ── GROQ API CALL ────────────────────────────────────────────────────
            async callGroq(systemPrompt, userQuery) {
                if (CONFIG.groqApiKey === 'SUA_CHAVE_GROQ_AQUI') {
                    // Modo offline: usa FAQ local
                    return this.fallbackLocal(userQuery);
                }

                try {
                    const res = await fetch(CONFIG.groqEndpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${CONFIG.groqApiKey}`
                        },
                        body: JSON.stringify({
                            model: CONFIG.groqModel,
                            messages: [
                                { role: 'system', content: systemPrompt },
                                { role: 'user',   content: userQuery }
                            ],
                            temperature: 0.7,
                            max_tokens:  800
                        })
                    });

                    if (!res.ok) {
                        const err = await res.json().catch(() => ({}));
                        throw new Error(err.error?.message || `HTTP ${res.status}`);
                    }

                    const data = await res.json();
                    return data.choices?.[0]?.message?.content || 'Não recebi resposta do Groq.';

                } catch (e) {
                    console.error('[Sábio/Groq] Erro:', e.message);
                    return this.fallbackLocal(userQuery);
                }
            }

            // ── FALLBACK LOCAL (sem API key ou erro de rede) ──────────────────────
            fallbackLocal(query) {
                const norm = this.normalize(query);
                const tokens = norm.split(/\s+/).filter(t => t.length > 2 && !STOPWORDS.includes(t));
                let best = null, bestScore = 0;
                for (const item of knowledgeBase.faq) {
                    let score = 0;
                    const qn = this.normalize(item.question);
                    if (qn.includes(norm)) score += 10;
                    tokens.forEach(t => { if (qn.includes(t)) score += 2; if (this.normalize(item.answer).includes(t)) score += 1; });
                    if (score > bestScore) { bestScore = score; best = item; }
                }
                if (best && bestScore > 1) return best.answer;
                return 'Não encontrei estudos sobre este tema na nossa base. Configure a chave Groq para respostas com IA completa, ou contacte-nos em leituradacuraportugal@gmail.com 🙏';
            }

            // ── BIBLE FETCH ──────────────────────────────────────────────────────
            async fetchBibleVerses(text) {
                const regex = /\b(\d?\s*[a-zA-ZçÇãÃõÕáÁéÉíÍóÓúÚ]+)\s+(\d+):(\d+)(?:-(\d+))?\b/g;
                const refs = [];
                let match;
                while ((match = regex.exec(text)) !== null) {
                    refs.push(`${match[1].trim()} ${match[2]}:${match[3]}${match[4] ? '-' + match[4] : ''}`);
                }
                const results = [];
                for (const ref of [...new Set(refs)].slice(0, 2)) {
                    try {
                        const r = await fetch(`${CONFIG.bibleApi}/${encodeURIComponent(ref)}?translation=${CONFIG.bibleTranslation}`);
                        const d = await r.json();
                        if (d.text) results.push({ ref: d.reference, text: d.text });
                    } catch (_) {}
                }
                return results;
            }

            // ── BOOK SEARCH (local) ──────────────────────────────────────────────
            searchBooks(query) {
                const norm = this.normalize(query);
                return knowledgeBase.books
                    .map(b => ({ ...b, score: this.normalize(b.title).split('').filter((_, i) => norm.includes(this.normalize(b.title)[i])).length }))
                    .filter(b => {
                        const bn = this.normalize(b.title);
                        return norm.split(/\s+/).some(t => t.length > 3 && bn.includes(t));
                    })
                    .slice(0, 3);
            }

            // ── HELPERS ──────────────────────────────────────────────────────────
            addMessage(type, text, html = false) {
                const div = document.createElement('div');
                div.className = `message ${type}`;
                if (html) div.innerHTML = text;
                else      div.innerHTML = text; // permite bold na boas-vindas
                this.msgContainer.appendChild(div);
                this.msgContainer.scrollTop = this.msgContainer.scrollHeight;
            }

            normalize(t)   { return t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\w\s]/g,'').trim(); }
            formatText(t)  { return t.replace(/\n/g,'<br>').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>'); }
            escAttr(s)     { return s.replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
        }

        new SabioWidget();
    };
})();
