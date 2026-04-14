// gemini-widget.js - Sábio da Nova Jerusalém
// Versão: 5.0.0 (Motor: Ollama local | Fallback: FAQ offline)

(function () {
    'use strict';

    window.initializeGeminiChatbot = function (options = {}) {

        const CONFIG = {
            faqPath:          options.jsonConfigUrl || 'chatbot/faq_library.json',
            booksPath:        options.booksUrl      || 'books_categorized.json',
            bibleApi:         'https://bible-api.com',
            bibleTranslation: 'almeida',

            // ── OLLAMA (local) ───────────────────────────────────────────────────
            // Ollama expõe uma API OpenAI-compatível em localhost:11434
            // Para funcionar no browser: definir OLLAMA_ORIGINS=*   (já feito no START_CLÁUDIO_TURBO.bat)
            ollamaEndpoint: options.ollamaEndpoint || 'http://localhost:11434/api/chat',
            ollamaModel:    options.ollamaModel    || 'llama3.2:1b',
            // ────────────────────────────────────────────────────────────────────
        };

        const STOPWORDS = ['o','a','os','as','um','uma','de','da','do','das','dos',
            'em','no','na','nos','nas','por','para','com','sem','sobre','sob',
            'que','qual','quais','como','quando','onde','porque','é','são',
            'foi','foram','ser','estar','eu','voce'];

        let kb = { faq: [], books: [] };
        let ollamaOnline = false; // será verificado no init
        let activeTab = 'chat';
        let isOpen = false;
        let isLoading = false;

        // ── ESTILOS ────────────────────────────────────────────────────────────
        const styles = `
            @import url('https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;1,400&family=Inter:wght@300;400;500;600&display=swap');
            * { margin:0; padding:0; box-sizing:border-box; }
            :host {
                --gold:  #D4AF37; --gold-l: #F4E8C1;
                --glass: rgba(10,22,40,0.93); --border: rgba(212,175,55,0.3);
                --txt:   #f0f0f0; --txt-m: #b0b0b0;
                --olive: #7CB342;  /* cor Ollama */
            }

            .sabio-widget { position:fixed; bottom:25px; right:25px; z-index:10000; font-family:'Inter',sans-serif; }

            .sabio-bubble {
                width:70px; height:70px; border-radius:50%;
                background:linear-gradient(135deg,var(--gold),#B8860B);
                border:2px solid var(--gold-l);
                box-shadow:0 5px 25px rgba(212,175,55,.45);
                cursor:pointer; display:flex; align-items:center; justify-content:center;
                transition:all .4s cubic-bezier(.175,.885,.32,1.275);
                font-size:34px; color:#fff;
            }
            .sabio-bubble:hover  { transform:scale(1.1) rotate(5deg); }
            .sabio-bubble.active { transform:rotate(45deg); background:#c82333; border-color:#ff6b6b; }

            .sabio-chat-window {
                position:absolute; bottom:85px; right:0;
                width:430px; height:690px; max-height:88vh;
                background:var(--glass); backdrop-filter:blur(25px);
                border:1px solid var(--border); border-radius:25px;
                box-shadow:0 20px 60px rgba(0,0,0,.65);
                display:flex; flex-direction:column;
                opacity:0; transform:translateY(20px) scale(.95);
                pointer-events:none;
                transition:all .4s cubic-bezier(.16,1,.3,1); overflow:hidden;
            }
            .sabio-chat-window.open { opacity:1; transform:translateY(0) scale(1); pointer-events:all; }

            /* STATUS HEADER */
            .sabio-header {
                display:flex; align-items:center; gap:8px;
                padding:10px 18px 0; font-size:11px; font-weight:600; letter-spacing:.4px;
            }
            .badge-motor {
                padding:2px 8px; border-radius:20px;
                font-size:10px; font-weight:700; color:#fff;
            }
            .badge-online  { background:var(--olive); }
            .badge-offline { background:#888; }
            .status-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
            .dot-on  { background:var(--olive); box-shadow:0 0 4px var(--olive); }
            .dot-off { background:#888; }

            /* ABAS */
            .sabio-tabs { display:flex; background:rgba(0,0,0,.2); border-bottom:1px solid var(--border); }
            .sabio-tab  {
                flex:1; padding:13px; text-align:center; cursor:pointer;
                color:var(--txt-m); font-size:12px; font-weight:500;
                transition:all .3s; display:flex; flex-direction:column; align-items:center; gap:3px;
            }
            .sabio-tab.active { color:var(--gold); background:rgba(212,175,55,.1); border-bottom:3px solid var(--gold); }

            /* CONTEÚDO */
            .sabio-content { flex:1; overflow-y:auto; display:none; padding:16px; flex-direction:column; }
            .sabio-content.active { display:flex; }
            .sabio-messages { flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:13px; }

            /* MENSAGENS */
            .message { max-width:90%; padding:11px 15px; border-radius:18px; line-height:1.55; font-size:15px; }
            .message.user { align-self:flex-end; background:var(--gold); color:#fff; border-bottom-right-radius:4px; }
            .message.bot  { align-self:flex-start; background:rgba(255,255,255,.08); color:var(--txt); border-bottom-left-radius:4px; font-family:'Crimson Text',serif; font-size:16px; }

            /* BÍBLIA */
            .bible-verse {
                background:rgba(212,175,55,.14); border-left:4px solid var(--gold);
                padding:11px; margin-bottom:11px; border-radius:0 10px 10px 0;
                font-style:italic; font-size:15px;
            }
            .bible-verse strong { display:block; color:var(--gold); font-style:normal; font-size:10px; margin-bottom:4px; text-transform:uppercase; letter-spacing:1px; }

            /* BADGE Motor */
            .motor-badge { font-size:10px; color:var(--olive); float:right; margin-top:5px; opacity:.75; font-style:normal; }
            .motor-badge.offline { color:#888; }

            /* ESTUDOS */
            .study-item { background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.1); padding:13px; border-radius:12px; margin-bottom:9px; cursor:pointer; transition:all .2s; }
            .study-item:hover { background:rgba(212,175,55,.1); border-color:var(--gold); }
            .study-item h4 { color:var(--gold); font-size:13.5px; margin-bottom:4px; }
            .study-item p  { color:var(--txt-m); font-size:11.5px; line-height:1.4; }

            /* BIBLIOTECA */
            .book-item { display:flex; gap:13px; background:rgba(255,255,255,.03); padding:13px; border-radius:14px; margin-bottom:13px; border:1px solid rgba(255,255,255,.06); transition:border .2s; }
            .book-item:hover { border-color:rgba(212,175,55,.3); }
            .book-cover { width:66px; height:96px; background:#1a1a2e; border-radius:6px; flex-shrink:0; object-fit:cover; }
            .book-info  { flex:1; display:flex; flex-direction:column; justify-content:space-between; }
            .book-info h4 { color:var(--gold); font-size:13px; margin-bottom:3px; line-height:1.3; }
            .book-info p  { color:var(--txt-m); font-size:11px; }
            .amazon-btn { background:#FF9900; color:#000; text-decoration:none; padding:6px 11px; border-radius:6px; font-size:11px; font-weight:700; text-align:center; display:inline-block; margin-top:5px; }

            /* INPUT */
            .sabio-input-area { padding:13px 16px; background:rgba(0,0,0,.3); border-top:1px solid var(--border); display:flex; gap:9px; align-items:center; }
            .sabio-input { flex:1; background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.11); border-radius:20px; padding:10px 15px; color:#fff; outline:none; font-size:14px; }
            .sabio-input::placeholder { color:rgba(255,255,255,.32); }
            .sabio-input:focus { border-color:var(--gold); }
            .sabio-send { background:var(--gold); border:none; width:40px; height:40px; border-radius:50%; color:#fff; cursor:pointer; font-size:17px; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:background .2s; }
            .sabio-send:hover { background:#bda020; }

            .typing-indicator { font-size:12px; color:var(--olive); margin-top:7px; font-style:italic; }

            /* AVISO OLLAMA OFFLINE */
            .offline-banner { background:rgba(255,200,0,.1); border:1px solid rgba(255,200,0,.25); border-radius:10px; padding:10px 13px; font-size:12px; color:#ffd740; margin-bottom:12px; line-height:1.5; }

            /* MOBILE */
            @media (max-width:480px) {
                .sabio-widget { bottom:15px; right:15px; }
                .sabio-chat-window { width:calc(100vw - 28px); height:82vh; right:0; bottom:73px; border-radius:20px; }
                .sabio-bubble { width:60px; height:60px; font-size:27px; }
                .message { max-width:95%; font-size:14px; }
            }
            @media (max-height:600px) { .sabio-chat-window { height:90vh; } }
        `;

        // ── WIDGET ────────────────────────────────────────────────────────────
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
                await Promise.all([this.loadData(), this.checkOllama()]);
                this.setupTabs();
                this.updateStatusUI();

                const welcome = ollamaOnline
                    ? '✦ Graça e Paz! Sou o Sábio da Nova Jerusalém — motor <strong>Ollama local</strong> activo. Faça sua pergunta bíblica!'
                    : '✦ Graça e Paz! Estou no modo offline (FAQ). Inicie o Ollama para respostas com IA completa. Como posso ajudar?';
                this.addMessage('bot', welcome);
                this.populateStudies();
                this.populateLibrary();
            }

            // ── VERIFICAR OLLAMA ─────────────────────────────────────────────
            async checkOllama() {
                try {
                    const r = await fetch('http://localhost:11434/', {
                        method: 'GET', signal: AbortSignal.timeout(2000)
                    });
                    ollamaOnline = r.ok || r.status === 200 || r.type === 'opaque';
                } catch (_) {
                    ollamaOnline = false;
                }
            }

            updateStatusUI() {
                const dot   = this.shadow.getElementById('status-dot');
                const badge = this.shadow.getElementById('status-badge');
                const model = this.shadow.getElementById('status-model');
                if (!dot) return;
                if (ollamaOnline) {
                    dot.className   = 'status-dot dot-on';
                    badge.className = 'badge-motor badge-online';
                    badge.textContent = 'OLLAMA';
                    model.textContent = CONFIG.ollamaModel;
                    model.style.color = 'var(--olive)';
                } else {
                    dot.className   = 'status-dot dot-off';
                    badge.className = 'badge-motor badge-offline';
                    badge.textContent = 'OFFLINE';
                    model.textContent = 'FAQ local';
                    model.style.color = '#888';
                }
            }

            // ── RENDER ───────────────────────────────────────────────────────
            render() {
                this.shadow.innerHTML += `
                <div class="sabio-widget">
                    <div class="sabio-bubble" id="toggleBtn">📖</div>
                    <div class="sabio-chat-window" id="window">

                        <div class="sabio-header">
                            <span id="status-dot" class="status-dot dot-off"></span>
                            <span id="status-badge" class="badge-motor badge-offline">A verificar...</span>
                            <span id="status-model" style="color:#888; font-weight:400; font-size:10px"></span>
                        </div>

                        <div class="sabio-tabs">
                            <div class="sabio-tab active" data-tab="chat"><span>💬</span>Chat</div>
                            <div class="sabio-tab" data-tab="estudos"><span>📝</span>Estudos</div>
                            <div class="sabio-tab" data-tab="biblioteca"><span>📚</span>Livros</div>
                        </div>

                        <!-- Chat -->
                        <div class="sabio-content active" id="tab-chat">
                            <div class="sabio-messages" id="messages"></div>
                            <div id="typing" class="typing-indicator" style="display:none">🦙 Ollama está a processar...</div>
                            <div class="sabio-input-area">
                                <input type="text" class="sabio-input" id="userInput" placeholder="Questão bíblica ou nome do livro...">
                                <button class="sabio-send" id="sendBtn">➤</button>
                            </div>
                        </div>

                        <!-- Estudos -->
                        <div class="sabio-content" id="tab-estudos">
                            <h3 style="color:var(--gold);margin-bottom:13px;font-size:15px">📝 Estudos Bíblicos</h3>
                            <div id="list-estudos"></div>
                        </div>

                        <!-- Biblioteca -->
                        <div class="sabio-content" id="tab-biblioteca">
                            <h3 style="color:var(--gold);margin-bottom:13px;font-size:15px">📚 Biblioteca Recomendada</h3>
                            <div id="list-biblioteca"></div>
                        </div>

                    </div>
                </div>`;

                this.toggleBtn    = this.shadow.querySelector('#toggleBtn');
                this.window       = this.shadow.querySelector('#window');
                this.input        = this.shadow.querySelector('#userInput');
                this.sendBtn      = this.shadow.querySelector('#sendBtn');
                this.msgContainer = this.shadow.querySelector('#messages');
                this.typing       = this.shadow.querySelector('#typing');

                this.toggleBtn.onclick  = () => {
                    isOpen = !isOpen;
                    this.window.classList.toggle('open', isOpen);
                    this.toggleBtn.classList.toggle('active', isOpen);
                    if (isOpen && activeTab === 'chat') this.input.focus();
                };
                this.sendBtn.onclick  = () => this.handleSend();
                this.input.onkeypress = (e) => { if (e.key === 'Enter') this.handleSend(); };
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

            // ── CARREGAR DADOS ───────────────────────────────────────────────
            async loadData() {
                try {
                    const [faqRes, booksRes] = await Promise.all([
                        fetch(CONFIG.faqPath).then(r => r.json()).catch(() => ({ questions: [] })),
                        fetch(CONFIG.booksPath).then(r => r.json()).catch(() => [])
                    ]);
                    kb.faq = faqRes.questions || faqRes || [];
                    // books_categorized.json → achata categorias
                    if (Array.isArray(booksRes) && booksRes[0]?.books) {
                        kb.books = booksRes.flatMap(cat => cat.books.map(b => ({ ...b, category: cat.category })));
                    } else {
                        kb.books = Array.isArray(booksRes) ? booksRes : (booksRes.books || []);
                    }
                } catch (e) { console.error('[Sábio] Erro dados:', e); }
            }

            // ── POPULAR ESTUDOS ──────────────────────────────────────────────
            populateStudies() {
                const c = this.shadow.querySelector('#list-estudos');
                if (!c || !kb.faq.length) return;
                c.innerHTML = kb.faq.map(f => `
                    <div class="study-item" data-q="${this.esc(f.question)}">
                        <h4>${f.question}</h4>
                        <p>${f.answer.substring(0, 90)}...</p>
                    </div>`).join('');
                c.querySelectorAll('.study-item').forEach(el => {
                    el.onclick = () => {
                        this.shadow.querySelector('[data-tab="chat"]').click();
                        this.input.value = el.dataset.q;
                        this.handleSend();
                    };
                });
            }

            // ── POPULAR BIBLIOTECA ───────────────────────────────────────────
            populateLibrary() {
                const c = this.shadow.querySelector('#list-biblioteca');
                if (!c) return;
                if (!kb.books.length) {
                    c.innerHTML = '<p style="text-align:center;color:#555;font-size:13px;margin-top:20px">A carregar livros...</p>';
                    return;
                }
                c.innerHTML = kb.books.map(b => `
                    <div class="book-item">
                        <img class="book-cover" src="${b.cover||''}" alt="${b.title}"
                             onerror="this.style.background='#1a1a2e';this.removeAttribute('src')">
                        <div class="book-info">
                            <div>
                                <h4>${b.title}</h4>
                                <p>${b.category || 'Recomendado'}</p>
                            </div>
                            <a href="${b.affiliate_link||b.amazonUrl||'#'}" target="_blank" class="amazon-btn">🛒 Ver na Amazon</a>
                        </div>
                    </div>`).join('');
            }

            // ── ENVIO ────────────────────────────────────────────────────────
            async handleSend() {
                const text = this.input.value.trim();
                if (!text || isLoading) return;
                this.input.value = '';
                this.addMessage('user', text);
                this.typing.style.display = 'block';
                isLoading = true;
                try   { await this.processQuery(text); }
                finally { this.typing.style.display = 'none'; isLoading = false; }
            }

            // ── MOTOR DE RESPOSTA ────────────────────────────────────────────
            async processQuery(query) {
                // 1. Buscar versículos na query
                const scriptures = await this.fetchBibleVerses(query);

                // 2. Livros relevantes (busca local)
                const relevantBooks = this.searchBooks(query);

                // -── Construir contexto FAQ ──────────────────────────────────
                const faqCtx = kb.faq.map(f => `P: ${f.question}\nR: ${f.answer}`).join('\n\n');
                const bookCtx = relevantBooks.length
                    ? '\n\nLIVROS RELACIONADOS:\n' + relevantBooks.map(b => `- "${b.title}": ${b.affiliate_link||''}`).join('\n')
                    : '';
                const bibleCtx = scriptures.length
                    ? '\n\nVERSÍCULOS:\n' + scriptures.map(s => `${s.ref}: "${s.text.trim()}"`).join('\n')
                    : '';

                const systemPrompt = `És o Sábio da Nova Jerusalém — assistente bíblico sábio e amoroso. Responde SEMPRE em Português de Portugal.

Regras:
1. Baseia-te sempre nas Escrituras e cita versículos.
2. Usa o contexto do FAQ como conhecimento base.
3. Se perguntarem sobre livros, recomenda com o link da Amazon.
4. Sê conciso (máximo 4 parágrafos). Usa linguagem simples.
5. Termina sempre com uma bênção ou versículo motivador.

CONHECIMENTO DO FAQ:
${faqCtx}${bookCtx}${bibleCtx}`;

                // 3. Chamar Ollama ou fallback
                let response, usedOllama = false;
                if (ollamaOnline) {
                    try {
                        response   = await this.callOllama(systemPrompt, query);
                        usedOllama = true;
                    } catch (e) {
                        console.warn('[Sábio] Ollama falhou, usando FAQ:', e.message);
                        response = this.fallbackFAQ(query);
                    }
                } else {
                    response = this.fallbackFAQ(query);
                }

                // 4. Montar HTML
                let html = '';
                if (scriptures.length) {
                    scriptures.forEach(s => {
                        html += `<div class="bible-verse"><strong>📖 ${s.ref}</strong>${s.text.trim()}</div>`;
                    });
                }
                html += `<div>${this.fmt(response)}</div>`;
                if (relevantBooks.length) {
                    const links = relevantBooks.slice(0,2).map(b =>
                        `<a href="${b.affiliate_link||'#'}" target="_blank" style="color:var(--gold)">${b.title}</a>`
                    ).join(', ');
                    html += `<br><div style="font-size:12px;color:rgba(212,175,55,.75)">📚 ${links}</div>`;
                }
                html += usedOllama
                    ? `<div class="motor-badge">🦙 Ollama local</div>`
                    : `<div class="motor-badge offline">📖 FAQ offline</div>`;

                this.addMessage('bot', html, true);
            }

            // ── OLLAMA API ───────────────────────────────────────────────────
            // Usa a API nativa /api/chat (suporta streaming — aqui modo não-stream)
            async callOllama(systemPrompt, userQuery) {
                const res = await fetch(CONFIG.ollamaEndpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model:  CONFIG.ollamaModel,
                        stream: false,
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user',   content: userQuery }
                        ],
                        options: { temperature: 0.7, num_predict: 600 }
                    }),
                    signal: AbortSignal.timeout(30000)
                });
                if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
                const data = await res.json();
                return data.message?.content || data.response || 'Ollama não retornou resposta.';
            }

            // ── FALLBACK FAQ ─────────────────────────────────────────────────
            fallbackFAQ(query) {
                const norm   = this.norm(query);
                const tokens = norm.split(/\s+/).filter(t => t.length > 2 && !STOPWORDS.includes(t));
                let best = null, bestScore = 0;
                for (const item of kb.faq) {
                    let score = 0;
                    const qn = this.norm(item.question);
                    const an = this.norm(item.answer);
                    if (qn.includes(norm)) score += 10;
                    tokens.forEach(t => {
                        if (qn.includes(t)) score += 2;
                        if (an.includes(t)) score += 1;
                    });
                    if (score > bestScore) { bestScore = score; best = item; }
                }
                if (best && bestScore > 1) return best.answer;
                return 'Não encontrei estudos sobre este tema na nossa base.\n\nPara respostas completas com IA, inicie o Ollama com o comando:\n\n**ollama serve**\n\nOu contacte-nos: leituradacuraportugal@gmail.com 🙏';
            }

            // ── FETCH BÍBLIA ─────────────────────────────────────────────────
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
                        if (d.text) results.push({ ref: d.reference, text: d.text });
                    } catch (_) {}
                }
                return results;
            }

            // ── BUSCA DE LIVROS LOCAL ────────────────────────────────────────
            searchBooks(query) {
                const n = this.norm(query);
                const tokens = n.split(/\s+/).filter(t => t.length > 3);
                return kb.books.filter(b => {
                    const bn = this.norm(b.title);
                    return tokens.some(t => bn.includes(t));
                }).slice(0, 2);
            }

            // ── HELPERS ──────────────────────────────────────────────────────
            addMessage(type, text, html = false) {
                const div = document.createElement('div');
                div.className = `message ${type}`;
                if (html) div.innerHTML = text;
                else      div.innerHTML = text;
                this.msgContainer.appendChild(div);
                this.msgContainer.scrollTop = this.msgContainer.scrollHeight;
            }
            norm(t) { return t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\w\s]/g,'').trim(); }
            fmt(t)  { return t.replace(/\n/g,'<br>').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>'); }
            esc(s)  { return s.replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
        }

        new SabioWidget();
    };
})();
