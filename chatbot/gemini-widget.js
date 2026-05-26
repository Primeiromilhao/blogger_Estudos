// gemini-widget.js — Sábio da Nova Jerusalém
// Versão: 7.0.0 (Conselheiro Humano + Almeida PT + Memória + Recomendação Inteligente)
//
// MELHORIAS DESTA VERSÃO:
// • Português europeu natural, caloroso, sem mecanicismos
// • Bíblia em Almeida (português) por defeito — KJV apenas para inglês
// • Deteção semântica de temas (não precisa o utilizador citar versículo)
// • Memória de conversa (últimas 6 mensagens) → contexto humano real
// • Recomendação de livros com scoring por tema + sinónimos
// • Fallback robusto se IA falhar
// • Saudações naturais variadas por hora do dia
// • Persistência de sessão (localStorage)

(function () {
    'use strict';

    window.initializeGeminiChatbot = function (options = {}) {

        const CONFIG = {
            faqPath:          options.jsonConfigUrl || 'chatbot/faq_library.json',
            booksPath:        options.booksUrl      || 'books_categorized.json',
            bibleApi:         'https://bible-api.com',
            bibleTranslation: 'almeida',   // João Ferreira de Almeida (PT)
            bibleFallbackEn:  'kjv',       // só usada se a pergunta for em inglês
            // ── POLLINATIONS (gratuito) ──
            aiEndpoint:       'https://text.pollinations.ai/',
            aiModel:          'openai',
            aiTimeoutMs:      25000,
            // ── OLLAMA local (fallback) ──
            ollamaEndpoint:   'http://localhost:11434/api/generate',
            ollamaModel:      'llama3.2',
            // ── MEMÓRIA ──
            maxHistory:       6,
            storageKey:       'sabio_nj_history_v7',
        };

        const STOPWORDS = ['o','a','os','as','um','uma','de','da','do','das','dos',
            'em','no','na','nos','nas','por','para','com','sem','sobre','que',
            'qual','como','quando','onde','porque','é','são','foi','ser','estar','eu','voce','você',
            'me','meu','minha','meus','minhas','seu','sua','seus','suas','isso','isto','este','esta',
            'the','of','and','to','in','is','it','for','on','my','i','you','we','your'];

        // ── DICIONÁRIO DE TEMAS → versículos + livros sugeridos ───────────────
        // Quando o utilizador menciona qualquer destes termos, puxamos automaticamente
        // os versículos certos da Almeida E os livros relacionados.
        const TEMAS = [
            {
                keywords: ['oração','orar','rezar','intercessão','intercessao','prayer','pray'],
                verses: ['Filipenses 4:6-7','Tiago 5:16','Mateus 6:6','1 Tessalonicenses 5:17'],
                bookKeywords: ['chave mestre','oração','prayer'],
            },
            {
                keywords: ['espírito marinho','espirito marinho','marinhos','mami wata','sereia','sonho erótico','sonhos eroticos','marine spirit'],
                verses: ['Salmos 18:16','Êxodo 14:21','Isaías 43:2','Apocalipse 21:1'],
                bookKeywords: ['marine','marinho','mami wata'],
            },
            {
                keywords: ['altar satânico','altar satanico','altar','feitiço','feitico','macumba','despacho','ocultismo'],
                verses: ['Deuteronômio 12:3','Êxodo 34:13','2 Reis 23:15','Juízes 6:25-26'],
                bookKeywords: ['altar','destruir'],
            },
            {
                keywords: ['maldição','maldicao','curse','geração','geracao','herança família','heranca familia','hereditária','hereditaria','generational'],
                verses: ['Gálatas 3:13','Êxodo 20:5','Ezequiel 18:20','Provérbios 26:2'],
                bookKeywords: ['generational','maldição','quebrar','curse'],
            },
            {
                keywords: ['prosperidade','dinheiro','finanças','financas','riqueza','escassez','pobreza','wealth','money'],
                verses: ['Malaquias 3:10','Provérbios 10:22','Filipenses 4:19','Deuteronômio 8:18','3 João 1:2'],
                bookKeywords: ['prosperidade','conta bancária','airdrop','compounding','millionaire','riqueza','contribuição','lei'],
            },
            {
                keywords: ['casamento','matrimônio','matrimonio','marido','esposa','mulher','rainha','marriage','spouse','sexo','intimidade'],
                verses: ['Efésios 5:25','Provérbios 18:22','1 Coríntios 7:3','Hebreus 13:4','Provérbios 31:10'],
                bookKeywords: ['casamento','rainha','mulher','marido','amor','intimidade'],
            },
            {
                keywords: ['anjo','anjos','angel','arcanjo','querubim','serafim','guardião','guardiao'],
                verses: ['Salmos 91:11','Hebreus 1:14','Daniel 10:13','Salmos 34:7'],
                bookKeywords: ['anjos','anjo','angel'],
            },
            {
                keywords: ['medo','ansiedade','depressão','depressao','aflição','aflicao','tristeza','desespero','fear','anxiety','depression'],
                verses: ['Isaías 41:10','Salmos 23:4','Filipenses 4:6-7','2 Timóteo 1:7','Salmos 34:18'],
                bookKeywords: ['medo','aflição','depressão','self-pity','fracasso','focus'],
            },
            {
                keywords: ['solidão','solidao','sozinho','sozinha','abandonado','lonely','alone'],
                verses: ['Hebreus 13:5','Salmos 27:10','Mateus 28:20','Deuteronômio 31:8'],
                bookKeywords: ['amor','focus'],
            },
            {
                keywords: ['perdão','perdao','arrependimento','culpa','forgive','repent','sin','pecado'],
                verses: ['1 João 1:9','Mateus 6:14','Salmos 51:10','Isaías 1:18'],
                bookKeywords: ['salvação','altar','testemunho'],
            },
            {
                keywords: ['cura','doença','doenca','enfermidade','heal','sick','sickness'],
                verses: ['Isaías 53:5','Tiago 5:14-15','Salmos 103:3','Êxodo 15:26'],
                bookKeywords: ['cura','sangue','jesus'],
            },
            {
                keywords: ['nova jerusalém','nova jerusalem','apocalipse','eternidade','céu','ceu','heaven','jerusalem'],
                verses: ['Apocalipse 21:1-4','Apocalipse 22:1-2','João 14:2-3','Hebreus 11:16'],
                bookKeywords: ['eternidade','jerusalém'],
            },
            {
                keywords: ['salvação','salvacao','novo nascimento','converter','salvation','born again'],
                verses: ['João 3:16','Romanos 10:9','Atos 4:12','2 Coríntios 5:17'],
                bookKeywords: ['salvação','novo nascimento'],
            },
            {
                keywords: ['pensamento','mente','mind','thought','foco','focus','distração','distracao'],
                verses: ['Filipenses 4:8','Romanos 12:2','2 Coríntios 10:5','Provérbios 23:7'],
                bookKeywords: ['pensamento','mente','focus','mindset','distração'],
            },
            {
                keywords: ['testemunho','testimony','poder de deus','milagre','miracle'],
                verses: ['Apocalipse 12:11','Salmos 107:2','Marcos 5:19'],
                bookKeywords: ['testemunho'],
            },
            {
                keywords: ['pessoas difíceis','dificeis','inimigos','perseguição','perseguicao','difficult people'],
                verses: ['Romanos 12:18','Mateus 5:44','Provérbios 15:1','Romanos 12:21'],
                bookKeywords: ['pessoas difíceis','dificeis'],
            },
        ];

        let kb = { faq: [], books: [], categories: null };
        let history = [];        // memória da conversa: [{role, content}]
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

            .sabio-widget {
                position: fixed; bottom: 24px; right: 24px;
                z-index: 2147483647; font-family: 'Inter', sans-serif;
            }

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

            .notif-badge {
                position: absolute; top: -4px; right: -4px;
                width: 16px; height: 16px; border-radius: 50%;
                background: #ff4444; border: 2px solid white;
                font-size: 9px; color: white; font-weight: 700;
                display: flex; align-items: center; justify-content: center;
            }

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
            .hdr-reset {
                background: rgba(255,255,255,.08); color: var(--txt-m);
                border: 1px solid rgba(255,255,255,.1);
                padding: 5px 10px; border-radius: 14px; font-size: 10.5px;
                cursor: pointer; transition: all .2s;
            }
            .hdr-reset:hover { background: rgba(212,175,55,.15); color: var(--gold); }

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

            .sabio-content { flex: 1; overflow-y: auto; display: none; padding: 18px; flex-direction: column; }
            .sabio-content.active { display: flex; }
            .sabio-content::-webkit-scrollbar { width: 4px; }
            .sabio-content::-webkit-scrollbar-thumb { background: rgba(212,175,55,.3); border-radius: 4px; }

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
            .message.bot p { margin-bottom: 8px; }
            .message.bot p:last-child { margin-bottom: 0; }

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

            .book-chip {
                display: inline-flex; align-items: center; gap: 5px;
                background: rgba(212,175,55,.1); border: 1px solid rgba(212,175,55,.25);
                border-radius: 8px; padding: 5px 10px; font-size: 11.5px;
                color: var(--gold); text-decoration: none; margin-top: 8px; margin-right: 4px;
                transition: background .2s;
            }
            .book-chip:hover { background: rgba(212,175,55,.2); }

            .reco-box {
                margin-top: 14px; padding: 11px 13px;
                background: linear-gradient(135deg, rgba(212,175,55,.08), rgba(212,175,55,.03));
                border: 1px solid rgba(212,175,55,.25);
                border-radius: 14px;
            }
            .reco-title {
                font-size: 10.5px; font-weight: 700; color: var(--gold);
                text-transform: uppercase; letter-spacing: .12em;
                margin-bottom: 8px; font-family: 'Inter', sans-serif;
            }
            .reco-card {
                display: flex; gap: 10px; align-items: center;
                background: rgba(0,0,0,.25); padding: 8px;
                border-radius: 10px; margin-bottom: 6px;
                text-decoration: none; transition: all .2s;
                border: 1px solid transparent;
            }
            .reco-card:hover { background: rgba(212,175,55,.12); border-color: rgba(212,175,55,.35); transform: translateX(2px); }
            .reco-card:last-child { margin-bottom: 0; }
            .reco-cover {
                width: 38px; height: 56px; object-fit: cover;
                border-radius: 4px; flex-shrink: 0;
                background: linear-gradient(135deg,#1a1a2e,#2a2a4e);
            }
            .reco-info { flex: 1; min-width: 0; }
            .reco-info h5 { color: var(--gold); font-size: 12px; line-height: 1.3; margin-bottom: 2px; font-family: 'Inter', sans-serif; font-weight: 600; }
            .reco-info p  { color: var(--txt-m); font-size: 10px; line-height: 1.3; font-family: 'Inter', sans-serif; }
            .reco-cta { color: #FF9900; font-size: 10.5px; font-weight: 700; font-family: 'Inter', sans-serif; white-space: nowrap; }

            .ai-badge { font-size: 9.5px; color: var(--ai); float: right; margin-top: 6px; opacity: .75; font-family: 'Inter', sans-serif; }

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

            .study-item {
                background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.08);
                padding: 13px 15px; border-radius: 13px; margin-bottom: 9px;
                cursor: pointer; transition: all .2s;
            }
            .study-item:hover { background: rgba(212,175,55,.1); border-color: rgba(212,175,55,.4); transform: translateX(3px); }
            .study-item h4 { color: var(--gold); font-size: 13.5px; margin-bottom: 4px; line-height: 1.3; }
            .study-item p  { color: var(--txt-m); font-size: 11.5px; line-height: 1.45; }

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
            .sabio-send:disabled { opacity: .4; cursor: not-allowed; transform: none; }

            .quick-suggestions {
                display: flex; gap: 6px; flex-wrap: wrap; padding: 8px 0 12px;
            }
            .quick-btn {
                background: rgba(212,175,55,.1); border: 1px solid rgba(212,175,55,.2);
                border-radius: 16px; padding: 5px 11px; font-size: 11px;
                color: var(--gold); cursor: pointer; transition: all .2s; white-space: nowrap;
            }
            .quick-btn:hover { background: rgba(212,175,55,.2); border-color: var(--gold); }

            @media (max-width: 500px) {
                .sabio-widget { bottom: 20px; left: 14px; right: auto; }
                .sabio-chat-window { width: calc(100vw - 28px); height: 84vh; left: 0; bottom: 78px; border-radius: 22px; }
                .sabio-bubble { width: 60px; height: 60px; font-size: 28px; }
            }
            @media (max-height: 640px) { .sabio-chat-window { height: 90vh; } }
        `;

        // ── WIDGET CLASS ─────────────────────────────────────────────────────────
        class SabioWidget {
            constructor() {
                this.host   = document.createElement('div');
                this.shadow = this.host.attachShadow({ mode: 'open' });
                this.host.style.zIndex = "2147483647";
                this.host.style.position = "relative";
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
                this.loadHistory();
                if (!history.length) {
                    this.addBotMessage(this.openingGreeting(), false);
                } else {
                    // Restaurar histórico visualmente
                    history.forEach(h => {
                        if (h.role === 'user') this.addUserMessage(h.content, false);
                        else this.addBotMessage(h.content, false);
                    });
                }
                this.populateStudies();
                this.populateLibrary();
            }

            // ── SAUDAÇÃO HUMANA POR HORA ─────────────────────────────────────────
            openingGreeting() {
                const h = new Date().getHours();
                let saudacao;
                if (h < 6)       saudacao = 'Boa noite, querida alma';
                else if (h < 12) saudacao = 'Bom dia, irmão(ã) querido(a)';
                else if (h < 19) saudacao = 'Boa tarde, paz seja contigo';
                else             saudacao = 'Boa noite, que o Senhor te console';

                const variantes = [
                    `${saudacao}. Sou o <strong>Sábio da Nova Jerusalém</strong>. Estou aqui para ouvir-te, partilhar a Palavra contigo e ajudar-te a encontrar o livro certo para esta fase da tua vida. Conta-me — o que pesa no teu coração hoje?`,
                    `${saudacao}. Que bom ter-te aqui. Podes falar comigo como falas com um amigo de longa data. Tens uma dúvida bíblica? Uma luta espiritual? Precisas de orientação sobre que livro ler? Estou contigo.`,
                    `${saudacao}. Antes de mais, respira fundo. A Palavra de Deus tem resposta para o que estás a sentir. Diz-me em poucas palavras o que te trouxe aqui e vamos encontrar luz juntos.`,
                ];
                return variantes[Math.floor(Math.random() * variantes.length)];
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

                        <div class="sabio-hdr">
                            <div class="hdr-avatar">📖</div>
                            <div class="hdr-info">
                                <div class="hdr-name">Sábio da Nova Jerusalém</div>
                                <div class="hdr-sub">
                                    <div class="online-dot"></div>
                                    <span>Conselheiro bíblico • Almeida PT</span>
                                </div>
                            </div>
                            <button class="hdr-reset" id="resetBtn" title="Nova conversa">↻ Nova</button>
                        </div>

                        <div class="sabio-tabs">
                            <div class="sabio-tab active" data-tab="chat"><span>💬</span>Conversa</div>
                            <div class="sabio-tab" data-tab="estudos"><span>📝</span>Estudos</div>
                            <div class="sabio-tab" data-tab="biblioteca"><span>📚</span>Livros</div>
                        </div>

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
                                <div class="quick-btn">🙏 Como vencer o medo?</div>
                                <div class="quick-btn">💰 Bíblia e prosperidade</div>
                                <div class="quick-btn">🛡️ Pesadelos recorrentes</div>
                                <div class="quick-btn">💍 Salvar o meu casamento</div>
                            </div>
                            <div class="sabio-input-area">
                                <input type="text" class="sabio-input" id="userInput" placeholder="Conta-me o que sentes...">
                                <button class="sabio-send" id="sendBtn">➤</button>
                            </div>
                        </div>

                        <div class="sabio-content" id="tab-estudos">
                            <h3 style="color:var(--gold);font-size:14px;margin-bottom:14px;letter-spacing:.05em">📝 ESTUDOS BÍBLICOS</h3>
                            <div id="list-estudos"></div>
                        </div>

                        <div class="sabio-content" id="tab-biblioteca">
                            <h3 style="color:var(--gold);font-size:14px;margin-bottom:6px;letter-spacing:.05em">📚 BIBLIOTECA RECOMENDADA</h3>
                            <p style="color:var(--txt-m);font-size:11px;margin-bottom:12px">Livros selecionados para o teu crescimento espiritual e financeiro.</p>
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
                this.resetBtn     = this.shadow.querySelector('#resetBtn');

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
                this.resetBtn.onclick = () => this.resetConversation();

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

            // ── HISTÓRICO/MEMÓRIA ───────────────────────────────────────────────
            loadHistory() {
                try {
                    const raw = localStorage.getItem(CONFIG.storageKey);
                    if (raw) history = JSON.parse(raw).slice(-CONFIG.maxHistory * 2);
                } catch (_) { history = []; }
            }
            saveHistory() {
                try {
                    localStorage.setItem(CONFIG.storageKey, JSON.stringify(history.slice(-CONFIG.maxHistory * 2)));
                } catch (_) {}
            }
            resetConversation() {
                history = [];
                try { localStorage.removeItem(CONFIG.storageKey); } catch(_){}
                this.msgContainer.innerHTML = '';
                this.addBotMessage(this.openingGreeting(), false);
                this.shadow.querySelector('#quickSuggestions').style.display = 'flex';
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
                             loading="lazy" referrerpolicy="no-referrer"
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
                this.sendBtn.disabled = true;
                isLoading = true;
                try   { await this.processQuery(text); }
                catch (e) {
                    console.error('[Sábio]', e);
                    this.addBotMessage('Peço desculpa, tive uma falha momentânea a ligar-me à minha fonte. Tenta novamente em alguns segundos — estou aqui contigo.');
                }
                finally {
                    this.typingWrap.style.display = 'none';
                    this.sendBtn.disabled = false;
                    isLoading = false;
                    this.input.focus();
                }
            }

            // ── DETETOR DE TEMAS ──────────────────────────────────────────────────
            detectThemes(query) {
                const norm = this.norm(query);
                const matched = [];
                for (const t of TEMAS) {
                    for (const kw of t.keywords) {
                        if (norm.includes(this.norm(kw))) {
                            matched.push(t);
                            break;
                        }
                    }
                }
                return matched;
            }

            // ── PROCESSAMENTO PRINCIPAL ───────────────────────────────────────────
            async processQuery(query) {
                // 1. Detetar temas → versículos por intenção + referências citadas
                const themes = this.detectThemes(query);
                const explicitRefs = this.extractExplicitRefs(query);

                // Reunir versículos: refs explícitas (máx 2) + 1 por tema (máx 2 temas)
                const allRefs = [...explicitRefs];
                themes.slice(0, 2).forEach(t => {
                    if (t.verses && t.verses.length) {
                        const pick = t.verses[Math.floor(Math.random() * t.verses.length)];
                        if (!allRefs.includes(pick)) allRefs.push(pick);
                    }
                });

                const isEnglish = /^[a-zA-Z0-9\s,.\?!'-]+$/.test(query) && !/[áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]/.test(query);
                const translation = isEnglish ? CONFIG.bibleFallbackEn : CONFIG.bibleTranslation;

                const [scriptures, relevantBooks] = await Promise.all([
                    this.fetchBibleVerses(allRefs, translation),
                    Promise.resolve(this.searchBooks(query, themes))
                ]);

                // 2. Construir contexto enxuto para a IA
                const faqCtx = this.relevantFAQ(query, 4).map(f => `P: ${f.question}\nR: ${f.answer}`).join('\n\n');
                const bookCtx = relevantBooks.length
                    ? relevantBooks.slice(0, 4).map(b => `• "${b.title}" — ${b.category || 'Recomendado'} → ${b.affiliate_link || ''}`).join('\n')
                    : kb.books.slice(0, 6).map(b => `• "${b.title}" — ${b.category || ''}`).join('\n');
                const bibleCtx = scriptures.length
                    ? scriptures.map(s => `${s.ref}: "${s.text.trim()}"`).join('\n')
                    : '';

                // 3. Prompt humano, em português europeu, com 4 regras claras
                const systemPrompt = `Tu és o "Sábio da Nova Jerusalém" — um conselheiro cristão experiente, caloroso e profundamente bíblico. Falas português europeu natural (usa "tu", não "você").

REGRAS DE OURO:
1. SEJA HUMANO: começa por validar a emoção/situação da pessoa ("Compreendo...", "Sinto a tua dor...", "Que bom que perguntas isso..."). Nunca arranques com listas frias.
2. SEJA BÍBLICO: liga a resposta a princípios das Escrituras. Se vires versículos no CONTEXTO BÍBLICO, podes citá-los naturalmente DENTRO da resposta (sem repetir o texto completo, basta a referência tipo "como diz o salmista em Salmos 23").
3. SEJA BREVE: 3 a 6 frases curtas. Parágrafos pequenos. Nada de sermões longos.
4. RECOMENDA UM LIVRO COM JEITO: se houver um livro do nosso catálogo verdadeiramente relevante para a dor/dúvida da pessoa, mencionas naturalmente UM (não vários) na última frase, explicando porquê — não como vendedor agressivo, mas como amigo que recomenda. O link da Amazon aparecerá automaticamente abaixo da resposta, NÃO precisas de o colar no texto.
5. NUNCA inventes versículos. Se não tens contexto bíblico, fala de princípios gerais da fé sem citar referências.
6. NUNCA repitas saudações como "Graça e paz" várias vezes na mesma conversa.

CONTEXTO BÍBLICO (versículos relevantes já carregados em ${isEnglish ? 'KJV' : 'Almeida'}):
${bibleCtx || '(nenhum versículo específico desta vez — apoia-te em princípios bíblicos gerais)'}

LIVROS DISPONÍVEIS PARA RECOMENDAR (catálogo da loja):
${bookCtx}

BASE DE CONHECIMENTO DOUTRINÁRIO (responde alinhado com isto):
${faqCtx || '(sem entradas FAQ relevantes — usa conhecimento bíblico geral)'}`;

                // 4. Construir mensagens com memória de conversa
                const messages = [
                    { role: 'system', content: systemPrompt },
                    ...history.slice(-CONFIG.maxHistory).map(h => ({ role: h.role, content: h.content.replace(/<[^>]+>/g, '') })),
                    { role: 'user', content: query },
                ];

                // 5. Chamar IA
                let aiResponse = await this.callAI(messages);
                if (!aiResponse || aiResponse.length < 10) {
                    aiResponse = this.fallbackFAQ(query, themes);
                }

                // 6. Montar HTML final
                let html = '';
                scriptures.forEach(s => {
                    const tag = isEnglish ? '(KJV)' : '(Almeida)';
                    html += `<div class="bible-block"><span class="bible-ref">📖 ${s.ref} ${tag}</span>${s.text.trim()}</div>`;
                });

                html += `<div>${this.fmt(aiResponse)}</div>`;

                // Caixa de recomendação visual (sempre que houver livros relevantes)
                if (relevantBooks.length) {
                    html += `<div class="reco-box">`;
                    html += `<div class="reco-title">📚 Leituras que te podem ajudar</div>`;
                    relevantBooks.slice(0, 2).forEach(b => {
                        const link = b.affiliate_link || '#';
                        const cover = b.cover || '';
                        html += `<a href="${link}" target="_blank" rel="noopener" class="reco-card">
                            <img class="reco-cover" src="${cover}" alt="${this.esc(b.title)}" referrerpolicy="no-referrer"
                                 onerror="this.style.background='linear-gradient(135deg,#1a1a2e,#2a2a4e)';this.removeAttribute('src')">
                            <div class="reco-info">
                                <h5>${this.esc(b.title)}</h5>
                                <p>${b.category || 'Recomendado para ti'}</p>
                            </div>
                            <span class="reco-cta">Ver →</span>
                        </a>`;
                    });
                    html += `</div>`;
                }

                html += `<div class="ai-badge">✦ Conselheiro Bíblico ${isEnglish ? '• KJV' : '• Almeida'}</div>`;

                this.addBotMessage(html);

                // Guardar na memória
                history.push({ role: 'user', content: query });
                history.push({ role: 'assistant', content: aiResponse });
                history = history.slice(-CONFIG.maxHistory * 2);
                this.saveHistory();
            }

            // ── CHAMADA DE IA ────────────────────────────────────────────────────
            async callAI(messages) {
                // Tentativa 1: Pollinations (POST com mensagens)
                try {
                    const controller = new AbortController();
                    const timeout = setTimeout(() => controller.abort(), CONFIG.aiTimeoutMs);

                    const res = await fetch(CONFIG.aiEndpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            messages,
                            model: CONFIG.aiModel,
                            seed: Math.floor(Math.random() * 10000),
                        }),
                        signal: controller.signal,
                    });
                    clearTimeout(timeout);

                    if (res.ok) {
                        const txt = await res.text();
                        if (txt && txt.length > 10 && !txt.toLowerCase().includes('error')) {
                            return txt.trim();
                        }
                    }
                } catch (e) {
                    console.warn('[Sábio] Pollinations falhou:', e.message);
                }

                // Tentativa 2: Ollama local (só funciona se utilizador tiver Ollama)
                try {
                    const sysMsg = messages.find(m => m.role === 'system')?.content || '';
                    const lastUser = messages.filter(m => m.role === 'user').slice(-1)[0]?.content || '';
                    const res = await fetch(CONFIG.ollamaEndpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            model:  CONFIG.ollamaModel,
                            prompt: `Sistema: ${sysMsg}\n\nUtilizador: ${lastUser}\n\nSábio (em português europeu, caloroso, breve):`,
                            stream: false,
                        }),
                        signal: AbortSignal.timeout(15000),
                    });
                    if (res.ok) {
                        const data = await res.json();
                        return (data.response || '').trim();
                    }
                } catch (_) {}

                return null;
            }

            // ── FALLBACK FAQ ──────────────────────────────────────────────────────
            fallbackFAQ(query, themes) {
                const best = this.relevantFAQ(query, 1)[0];
                if (best) {
                    return `Compreendo o que perguntas. ${best.answer}\n\nSe quiseres aprofundar, dá uma vista de olhos no livro recomendado abaixo — pode trazer-te muita luz.`;
                }
                if (themes && themes.length) {
                    return `Sinto a tua pergunta. Embora eu não tenha agora todas as respostas, encorajo-te a abrir a Palavra e meditar nos versículos acima — Deus fala através das Escrituras de forma muito pessoal. Se quiseres, vê também os livros sugeridos abaixo, foram escolhidos a pensar em ti.`;
                }
                return `Obrigado por partilhares isso comigo. Para te dar a melhor orientação, conta-me um pouco mais — é uma dúvida bíblica, uma luta espiritual, ou procuras um livro sobre um tema específico? Estou aqui para te ouvir.`;
            }

            // ── RELEVÂNCIA FAQ ────────────────────────────────────────────────────
            relevantFAQ(query, limit = 3) {
                const norm = this.norm(query);
                const tokens = norm.split(/\s+/).filter(t => t.length > 2 && !STOPWORDS.includes(t));
                const scored = kb.faq.map(item => {
                    let score = 0;
                    const qn = this.norm(item.question);
                    const an = this.norm(item.answer);
                    if (qn.includes(norm)) score += 15;
                    tokens.forEach(t => {
                        if (qn.includes(t)) score += 3;
                        if (an.includes(t)) score += 1;
                    });
                    return { item, score };
                }).filter(x => x.score > 0)
                  .sort((a,b) => b.score - a.score)
                  .slice(0, limit)
                  .map(x => x.item);
                return scored;
            }

            // ── EXTRAIR REFERÊNCIAS BÍBLICAS EXPLÍCITAS ──────────────────────────
            extractExplicitRefs(text) {
                const regex = /\b(\d?\s*[a-zA-ZçÇãÃõÕáÁéÉíÍóÓúÚâÂêÊîÎôÔûÛ]+)\s+(\d+):(\d+)(?:-(\d+))?\b/g;
                const refs = [];
                let m;
                while ((m = regex.exec(text)) !== null) {
                    refs.push(`${m[1].trim()} ${m[2]}:${m[3]}${m[4] ? '-'+m[4] : ''}`);
                }
                return [...new Set(refs)].slice(0, 2);
            }

            // ── BUSCAR VERSÍCULOS NA BIBLE API ───────────────────────────────────
            async fetchBibleVerses(refs, translation) {
                const results = [];
                for (const ref of refs.slice(0, 3)) {
                    try {
                        const r = await fetch(`${CONFIG.bibleApi}/${encodeURIComponent(ref)}?translation=${translation}`);
                        const d = await r.json();
                        if (d?.text) results.push({ ref: d.reference || ref, text: d.text });
                    } catch (_) {}
                }
                return results;
            }

            // ── BUSCA DE LIVROS POR TEMA + TOKEN ─────────────────────────────────
            searchBooks(query, themes) {
                const normQuery = this.norm(query);
                const tokens = normQuery.split(/\s+/).filter(t => t.length > 2 && !STOPWORDS.includes(t));
                const themeBookKeywords = themes.flatMap(t => t.bookKeywords || []);

                // Scoring
                const scored = kb.books.map(b => {
                    const bn = this.norm((b.title || '') + ' ' + (b.subtitle || '') + ' ' + (b.category || ''));
                    let score = 0;
                    tokens.forEach(t => { if (bn.includes(t)) score += 3; });
                    themeBookKeywords.forEach(kw => { if (bn.includes(this.norm(kw))) score += 5; });
                    return { book: b, score };
                }).filter(x => x.score > 0)
                  .sort((a,b) => b.score - a.score);

                if (scored.length) return scored.slice(0, 4).map(x => x.book);

                // Se nada bate, devolve 2 livros aleatórios populares como sugestão suave
                return [];
            }

            // ── DOM HELPERS ───────────────────────────────────────────────────────
            addBotMessage(html, save = true) {
                const wrap = document.createElement('div');
                wrap.className = 'message-wrap';
                wrap.innerHTML = `<div class="msg-avatar msg-av-bot">📖</div><div class="message bot">${html}</div>`;
                this.msgContainer.appendChild(wrap);
                this.msgContainer.scrollTop = this.msgContainer.scrollHeight;
            }

            addUserMessage(text, save = true) {
                const wrap = document.createElement('div');
                wrap.className = 'message-wrap user';
                wrap.innerHTML = `<div class="msg-avatar msg-av-usr">👤</div><div class="message user">${this.esc(text)}</div>`;
                this.msgContainer.appendChild(wrap);
                this.msgContainer.scrollTop = this.msgContainer.scrollHeight;
            }

            norm(t) { return (t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\w\s]/g,' ').replace(/\s+/g,' ').trim(); }
            fmt(t)  {
                // Quebras em parágrafos
                const paragraphs = t.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
                return paragraphs.map(p => {
                    p = p
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                        .replace(/\n/g, '<br>');
                    return `<p>${p}</p>`;
                }).join('');
            }
            esc(s)  { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
        }

        new SabioWidget();
    };
})();
