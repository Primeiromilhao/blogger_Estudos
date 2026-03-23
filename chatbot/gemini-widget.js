// gemini-widget.js - Sábio da Nova Jerusalém
// Versão: 3.0.0 (Abas: Chat, Estudos, Biblioteca | Bíblia primeiro)

(function() {
    'use strict';

    // Configurações
    const CONFIG = {
        faqPath: 'chatbot/faq_library.json',
        booksPath: 'books.json',
        libraryPath: 'data/library.json',
        bibleApi: 'https://bible-api.com',
        bibleTranslation: 'almeida',
        affiliateTag: 'primeiromilhao-20',
        maxResults: 5
    };

    const STOPWORDS = ['o', 'a', 'os', 'as', 'um', 'uma', 'de', 'da', 'do', 'das', 'dos', 'em', 'no', 'na', 'nos', 'nas', 'por', 'para', 'com', 'sem', 'sobre', 'sob', 'que', 'qual', 'quais', 'como', 'quando', 'onde', 'porque', 'porquê', 'é', 'são', 'foi', 'foram', 'ser', 'estar', 'eu', 'voce'];

    let knowledgeBase = { faq: [], books: [] };
    let activeTab = 'chat';
    let isOpen = false;
    let isLoading = false;

    // CSS (Glassmorphism + Abas)
    const styles = `
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;1,400&family=Inter:wght@300;400;500;600&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        :host {
            --gold-primary: #D4AF37;
            --gold-light: #F4E8C1;
            --blue-dark: #0a1628;
            --glass-bg: rgba(10, 22, 40, 0.9);
            --glass-border: rgba(212, 175, 55, 0.3);
            --text-primary: #f0f0f0;
            --text-secondary: #b0b0b0;
        }
        
        .sabio-widget {
            position: fixed;
            bottom: 25px;
            right: 25px;
            z-index: 10000;
            font-family: 'Inter', sans-serif;
        }
        
        .sabio-bubble {
            width: 70px;
            height: 70px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--gold-primary) 0%, #B8860B 100%);
            border: 2px solid var(--gold-light);
            box-shadow: 0 5px 25px rgba(212, 175, 55, 0.4);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            font-size: 35px;
            color: white;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        
        .sabio-bubble:hover { transform: scale(1.1) rotate(5deg); }
        .sabio-bubble.active { transform: rotate(45deg); background: #c82333; border-color: #ff6b6b; }
        
        .sabio-chat-window {
            position: absolute;
            bottom: 85px;
            right: 0;
            width: 420px;
            height: 680px;
            max-height: 85vh;
            background: var(--glass-bg);
            backdrop-filter: blur(25px);
            border: 1px solid var(--glass-border);
            border-radius: 25px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.6);
            display: flex;
            flex-direction: column;
            opacity: 0;
            transform: translateY(20px) scale(0.95);
            pointer-events: none;
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            overflow: hidden;
        }
        
        .sabio-chat-window.open { opacity: 1; transform: translateY(0) scale(1); pointer-events: all; }
        
        /* Navegação por Abas */
        .sabio-tabs {
            display: flex;
            background: rgba(0,0,0,0.2);
            border-bottom: 1px solid var(--glass-border);
        }
        
        .sabio-tab {
            flex: 1;
            padding: 15px;
            text-align: center;
            cursor: pointer;
            color: var(--text-secondary);
            font-size: 13px;
            font-weight: 500;
            transition: all 0.3s;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
        }
        
        .sabio-tab i { font-size: 18px; }
        .sabio-tab.active {
            color: var(--gold-primary);
            background: rgba(212, 175, 55, 0.1);
            border-bottom: 3px solid var(--gold-primary);
        }
        
        /* Conteúdo das Abas */
        .sabio-content { flex: 1; overflow-y: auto; display: none; padding: 20px; }
        .sabio-content.active { display: flex; flex-direction: column; }
        
        /* Estilos do Chat */
        .sabio-messages { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 15px; }
        .message { max-width: 90%; padding: 12px 16px; border-radius: 18px; line-height: 1.5; font-size: 15px; }
        .message.user { align-self: flex-end; background: var(--gold-primary); color: white; border-bottom-right-radius: 4px; }
        .message.bot { align-self: flex-start; background: rgba(255,255,255,0.08); color: var(--text-primary); border-bottom-left-radius: 4px; font-family: 'Crimson Text', serif; font-size: 16px; }
        
        /* Bíblia Primeiro Estilo */
        .bible-verse {
            background: rgba(212, 175, 55, 0.15);
            border-left: 4px solid var(--gold-primary);
            padding: 12px;
            margin-bottom: 12px;
            border-radius: 0 10px 10px 0;
            font-style: italic;
            font-size: 15px;
        }
        .bible-verse strong { display: block; color: var(--gold-primary); font-style: normal; font-size: 12px; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 1px; }

        /* Lista de Estudos */
        .study-item {
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
            padding: 15px;
            border-radius: 12px;
            margin-bottom: 10px;
            cursor: pointer;
            transition: all 0.2s;
        }
        .study-item:hover { background: rgba(212, 175, 55, 0.1); border-color: var(--gold-primary); }
        .study-item h4 { color: var(--gold-primary); font-size: 15px; margin-bottom: 5px; }
        .study-item p { color: var(--text-secondary); font-size: 13px; line-height: 1.4; }

        /* Biblioteca Estilo */
        .book-item {
            display: flex;
            gap: 15px;
            background: rgba(255,255,255,0.03);
            padding: 15px;
            border-radius: 15px;
            margin-bottom: 15px;
            border: 1px solid rgba(255,255,255,0.05);
        }
        .book-cover { width: 70px; height: 100px; background: #222; border-radius: 5px; flex-shrink: 0; object-fit: cover; }
        .book-info { flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
        .book-info h4 { color: var(--gold-primary); font-size: 14px; margin-bottom: 5px; }
        .amazon-btn { 
            background: #FF9900; color: #000; text-decoration: none; padding: 6px 12px; 
            border-radius: 6px; font-size: 12px; font-weight: 700; text-align: center;
        }
        
        /* Input Area */
        .sabio-input-area { padding: 15px 20px; background: rgba(0,0,0,0.3); border-top: 1px solid var(--glass-border); display: flex; gap: 10px; }
        .sabio-input { flex: 1; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 10px 15px; color: white; outline: none; }
        .sabio-send { background: var(--gold-primary); border: none; width: 40px; height: 40px; border-radius: 50%; color: white; cursor: pointer; display:flex; align-items:center; justify-content:center; }

        .typing-indicator { font-size: 12px; color: var(--gold-primary); margin-top: 10px; font-style: italic; }

        /* Responsividade (Mobile & Tablet) */
        @media (max-width: 768px) {
            .sabio-chat-window {
                width: 380px;
                right: 0;
            }
        }
        
        @media (max-width: 480px) {
            .sabio-widget {
                bottom: 15px;
                right: 15px;
            }
            .sabio-chat-window {
                width: calc(100vw - 30px);
                height: 78vh;
                right: 0;
                bottom: 75px;
                border-radius: 20px;
            }
            .sabio-bubble {
                width: 60px;
                height: 60px;
                font-size: 30px;
            }
            .sabio-tab {
                padding: 10px 5px;
                font-size: 12px;
            }
            .message {
                max-width: 95%;
                font-size: 14px;
                padding: 10px 14px;
            }
        }
        
        @media (max-height: 600px) {
            .sabio-chat-window {
                height: 85vh;
            }
        }
    `;


    class SabioWidget {
        constructor() {
            this.host = document.createElement('div');
            this.shadow = this.host.attachShadow({ mode: 'open' });
            document.body.appendChild(this.host);
            this.init();
        }

        async init() {
            const styleSheet = document.createElement('style');
            styleSheet.textContent = styles;
            this.shadow.appendChild(styleSheet);
            
            this.render();
            await this.loadData();
            this.setupTabs();
            this.addMessage('bot', 'Graça e Paz! Sou o Sábio da Nova Jerusalém. Como posso ajudar seu crescimento hoje?');
            this.populateStudies();
            this.populateLibrary();
        }

        render() {
            this.shadow.innerHTML += `
                <div class="sabio-widget">
                    <div class="sabio-bubble" id="toggleBtn">📖</div>
                    <div class="sabio-chat-window" id="window">
                        <div class="sabio-tabs">
                            <div class="sabio-tab active" data-tab="chat"><span>💬</span>Chat</div>
                            <div class="sabio-tab" data-tab="estudos"><span>📝</span>Estudos</div>
                            <div class="sabio-tab" data-tab="biblioteca"><span>📚</span>Livros</div>
                        </div>
                        
                        <!-- Aba Chat -->
                        <div class="sabio-content active" id="tab-chat">
                            <div class="sabio-messages" id="messages"></div>
                            <div id="typing" class="typing-indicator" style="display:none">O Sábio está consultando as escrituras...</div>
                            <div class="sabio-input-area">
                                <input type="text" class="sabio-input" id="userInput" placeholder="Sua dúvida bíblica...">
                                <button class="sabio-send" id="sendBtn">➤</button>
                            </div>
                        </div>
                        
                        <!-- Aba Estudos -->
                        <div class="sabio-content" id="tab-estudos">
                            <h3 style="color:var(--gold-primary); margin-bottom:15px; font-size:16px">Estudos Bíblicos Disponíveis</h3>
                            <div id="list-estudos"></div>
                        </div>
                        
                        <!-- Aba Biblioteca -->
                        <div class="sabio-content" id="tab-biblioteca">
                            <h3 style="color:var(--gold-primary); margin-bottom:15px; font-size:16px">Biblioteca Recomendada</h3>
                            <div id="list-biblioteca"></div>
                        </div>
                    </div>
                </div>
            `;
            
            this.toggleBtn = this.shadow.getElementById('toggleBtn');
            this.window = this.shadow.getElementById('window');
            this.input = this.shadow.getElementById('userInput');
            this.sendBtn = this.shadow.getElementById('sendBtn');
            this.msgContainer = this.shadow.getElementById('messages');
            this.typing = this.shadow.getElementById('typing');
            
            this.toggleBtn.onclick = () => {
                isOpen = !isOpen;
                this.window.classList.toggle('open', isOpen);
                this.toggleBtn.classList.toggle('active', isOpen);
                if (isOpen && activeTab === 'chat') this.input.focus();
            };
            
            this.sendBtn.onclick = () => this.handleAction();
            this.input.onkeypress = (e) => { if (e.key === 'Enter') this.handleAction(); };
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

        async loadData() {
            try {
                const [faqRes, booksRes] = await Promise.all([
                    fetch(CONFIG.faqPath).then(r => r.json()).catch(() => ({questions:[]})),
                    fetch(CONFIG.booksPath).then(r => r.json()).catch(() => [])
                ]);
                knowledgeBase.faq = faqRes.questions || faqRes;
                knowledgeBase.books = Array.isArray(booksRes) ? booksRes : (booksRes.books || []);
            } catch (e) {
                console.error("Erro ao carregar dados", e);
            }
        }

        populateStudies() {
            const container = this.shadow.getElementById('list-estudos');
            container.innerHTML = knowledgeBase.faq.map(item => `
                <div class="study-item" onclick="this.parentNode.dispatchEvent(new CustomEvent('ask', {detail: '${item.question.replace(/'/g, "\\'")}'}))">
                    <h4>${item.question}</h4>
                    <p>${item.answer.substring(0, 80)}...</p>
                </div>
            `).join('');
            
            container.addEventListener('ask', (e) => {
                this.shadow.querySelector('[data-tab="chat"]').click();
                this.input.value = e.detail;
                this.handleAction();
            });
        }

        populateLibrary() {
            const container = this.shadow.getElementById('list-biblioteca');
            container.innerHTML = knowledgeBase.books.map(b => `
                <div class="book-item">
                    <img class="book-cover" src="${b.cover && b.cover.startsWith('http') ? b.cover : 'data/covers/' + (b.cover || 'default.jpg')}" onerror="this.src='https://primeiromilhao.github.io/blogger_Estudos/img/default-book.jpg'">
                    <div class="book-info">
                        <div>
                            <h4>${b.title}</h4>
                            <p style="font-size:11px; color:#999">${b.author || 'Escola Bíblica'}</p>
                        </div>
                        <a href="${b.amazonUrl || b.affiliate_link || '#'}" target="_blank" class="amazon-btn">🛒 Ver na Amazon</a>
                    </div>
                </div>
            `).join('');
        }

        async handleAction() {
            const text = this.input.value.trim();
            if (!text || isLoading) return;
            
            this.input.value = '';
            this.addMessage('user', text);
            this.typing.style.display = 'block';
            isLoading = true;
            
            setTimeout(async () => {
                await this.processQuery(text);
                this.typing.style.display = 'none';
                isLoading = false;
            }, 1000);
        }

        async processQuery(query) {
            const normalized = this.normalize(query);
            const tokens = normalized.split(/\s+/).filter(t => t.length > 2 && !STOPWORDS.includes(t));
            
            let bestMatch = null;
            let bestScore = 0;
            
            for (const item of knowledgeBase.faq) {
                let score = 0;
                const qNorm = this.normalize(item.question);
                if (qNorm.includes(normalized)) score += 10;
                tokens.forEach(t => { if (qNorm.includes(t)) score += 2; });
                
                if (score > bestScore) {
                    bestScore = score;
                    bestMatch = item;
                }
            }
            
            if (bestMatch && bestScore > 2) {
                // PRIMEIRO: Extrair e buscar Bíblia
                const scriptures = await this.extractScriptures(bestMatch.answer);
                
                // SEGUNDO: Montar HTML (Bíblia ANTES do Estudo)
                let finalHtml = "";
                if (scriptures.length > 0) {
                    scriptures.forEach(s => {
                        finalHtml += `<div class="bible-verse"><strong>📖 ESCRITURA MANUAL #1 (${s.ref}):</strong>${s.text}</div>`;
                    });
                }
                
                finalHtml += `<div class="study-text"><strong>📝 ESTUDO COMPLEMENTAR:</strong><br>${this.formatText(bestMatch.answer)}</div>`;
                
                if (bestMatch.links) {
                    finalHtml += `<br><small>Saiba mais: ${bestMatch.links.map(l => `<a href="${l}" style="color:var(--gold-primary)" target="_blank">${l}</a>`).join(', ')}</small>`;
                }
                
                this.addMessage('bot', finalHtml, true);
            } else {
                const fallback = `Ainda não encontrei registros bíblicos ou estudos sobre este tema específico.<br><br>Por favor, <strong>envie sua dúvida</strong> para nosso manual de suporte:<br>✉️ <a href="mailto:leituradacuraportugal@gmail.com" style="color:var(--gold-primary)">leituradacuraportugal@gmail.com</a>`;
                this.addMessage('bot', fallback, true);
            }
        }

        async extractScriptures(text) {
            const refs = [];
            const regex = /\b(\d?\s*[a-zA-ZçÇãÃõÕáÁéÉíÍóÓúÚôÔ]+)\s+(\d+):(\d+)(?:-(\d+))?\b/g;
            let match;
            while ((match = regex.exec(text)) !== null) {
                refs.push(`${match[1].trim()} ${match[2]}:${match[3]}${match[4] ? '-' + match[4] : ''}`);
            }
            
            const results = [];
            for (const ref of [...new Set(refs)]) {
                try {
                    const res = await fetch(`${CONFIG.bibleApi}/${encodeURIComponent(ref)}?translation=${CONFIG.bibleTranslation}`);
                    const data = await res.json();
                    if (data.text) results.push({ ref: data.reference, text: data.text });
                } catch (e) {}
            }
            return results;
        }

        addMessage(type, text, html = false) {
            const div = document.createElement('div');
            div.className = `message ${type}`;
            if (html) div.innerHTML = text;
            else div.textContent = text;
            this.msgContainer.appendChild(div);
            this.msgContainer.scrollTop = this.msgContainer.scrollHeight;
        }

        normalize(t) { return t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s]/g, '').trim(); }
        formatText(t) { return t.replace(/\n/g, '<br>'); }
    }

    new SabioWidget();
})();
