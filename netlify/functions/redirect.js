// netlify/functions/redirect.js
const https = require('https');

// ---- CONFIGURAÇÕES ----
// 1. Google Sheets onde os logs serão gravados
const SHEETS_ID = process.env.SHEETS_ID;
const SHEETS_RANGE = 'Logs!A:E'; // Aba "Logs" colunas: Timestamp, Book, Type, IP, UA
const GOOGLE_API_TOKEN = process.env.GOOGLE_API_TOKEN;

// 2. Google Analytics 4 Measurement Protocol
const GA4_MEASUREMENT_ID = process.env.GA4_MEASUREMENT_ID; // ex: G-XXXXXXXXXX
const GA4_API_SECRET = process.env.GA4_API_SECRET;

// 3. Dicionário de links de afiliado
const AFFILIATE_LINKS = {
    "marine_spirits": "https://amzn.to/4lvlvj0R",
    "altar_satanico": "https://amzn.to/4s8Uj3B",
    "generational_curses": "https://amzn.to/41sKj9h",
    "conta_bancaria_espiritual": "https://amzn.to/4dVjX2L",
    "airdrops_bible": "https://amzn.to/3CQXyJk",
    "power_of_compounding": "https://amzn.to/4mRwT9K",
    "lei_contribuicao": "https://amzn.to/4fN2pXs",
    "crypto_staking": "https://amzn.to/4kWjR7M",
    "lei_pensamento": "https://amzn.to/4h3YzPq",
    "millionaire_mindset": "https://amzn.to/4k9Lm2N",
    "focus": "https://amzn.to/3JvXqR4",
    "self_pity": "https://amzn.to/4m8ZtK5",
    "casamento_feliz": "https://amzn.to/4h9YwL3",
    "rei_rainha": "https://amzn.to/4f2XnQ8",
    "pessoas_dificeis": "https://amzn.to/4lVjW2R",
    "receita_amor": "https://amzn.to/4720BcY",
    "chave_mestre_oracao": "https://amzn.to/4urhuYj",
    "vida_anjos": "https://amzn.to/4smwPl1",
    "sos_numbers": "https://www.amazon.com.br/sos-Numbers-God-Emergency-numbers/dp/1477454187/",
    "caminhada_anjos": "https://www.amazon.com.br/Uma-Caminhada-Com-Os-Anjos/dp/1546821759/",
    "poder_altar": "https://amzn.to/4sfRw90",
    "deus_terminar": "https://amzn.to/4svuqvJ",
    "homem_fe": "https://amzn.to/41PajFT",
    "novo_nascimento": "https://www.amazon.com.br/Salvacao-um-novo-nascimento-Portuguese/dp/1453808833/",
    "danca_comigo": "https://www.amazon.com.br/Danca-Comigo-Portuguese-Katy-Cipri/dp/B0FCMMLMQB/",
    "restaurar": "https://amzn.to/4xqA_jX1mKArbWgSCcxv" 
};

const STUDY_LINKS = {
    "restaurar_pdf": "https://drive.google.com/file/d/1xqA_jX1mKArbWgSCcxv_H3-KF29ambSC/view?usp=drive_link",
    "marinho_pdf": "https://drive.google.com/file/d/13qkhZumCwSRlUbYBvvgrZbOA_tselT6S/view?usp=drive_link",
    "eternidade_pdf1": "https://drive.google.com/file/d/1SLAaLZ5e_5T3r95uC1I1qm2Cz9JZUrwp/view?usp=drive_link",
    "eternidade_pdf2": "https://drive.google.com/file/d/1yEenSDCkR_J8zWqc6TcLGmxJFoV__23i/view?usp=drive_link"
};

const DEFAULT_DESTINATION = "https://rumoanovajerusalem.github.io/blogger_Estudos/#biblioteca";

// Função de utilidade para fazer POST
const doPost = (url, headers, body) => {
    return new Promise((resolve) => {
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            method: 'POST',
            headers: {
                ...headers,
                'Content-Length': Buffer.byteLength(body)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
        });

        req.on('error', (e) => {
            console.error('Erro no POST HTTP:', e);
            resolve({ statusCode: 500 });
        });

        req.write(body);
        req.end();
    });
};

exports.handler = async (event, context) => {
    const params = event.queryStringParameters || {};
    const book = params.book;
    const isStudy = params.study === '1';

    // 1. Determina o destino
    let dest = DEFAULT_DESTINATION;
    if (book) {
        if (isStudy) {
            dest = STUDY_LINKS[book] || DEFAULT_DESTINATION;
        } else {
            dest = AFFILIATE_LINKS[book] || DEFAULT_DESTINATION;
        }
    }

    // 2. Extrai dados do request (para logs)
    const ip = event.headers['x-forwarded-for'] ? event.headers['x-forwarded-for'].split(',')[0] : '';
    const ua = event.headers['user-agent'] || '';
    const timestamp = new Date().toISOString();
    const type = isStudy ? 'study' : 'amazon';

    // Dispara chamadas externas em background Promise.allSettled para não travar redirect
    const promises = [];

    // --- A. Grava no Google Sheets ---
    if (SHEETS_ID && GOOGLE_API_TOKEN) {
        const logRow = [timestamp, book || 'unknown', type, ip, ua];
        const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEETS_ID}/values/${encodeURIComponent(SHEETS_RANGE)}:append?valueInputOption=RAW`;
        const sheetsBody = JSON.stringify({ values: [logRow] });
        
        promises.push(doPost(sheetsUrl, {
            "Authorization": `Bearer ${GOOGLE_API_TOKEN}`,
            "Content-Type": "application/json"
        }, sheetsBody).catch(e => console.error("Erro Sheets:", e)));
    }

    // --- B. Dispara evento no GA4 ---
    if (GA4_MEASUREMENT_ID && GA4_API_SECRET) {
        // Gera um client_id pseudo-aleatório baseado no IP ou pega de cookie se existisse (mas em redirect direto é dificil ler cookie de outro domínio)
        const clientId = ip || Math.random().toString(36).substring(2, 15);
        
        const ga4Url = `https://www.google-analytics.com/mp/collect?measurement_id=${GA4_MEASUREMENT_ID}&api_secret=${GA4_API_SECRET}`;
        const ga4Body = JSON.stringify({
            client_id: clientId,
            events: [{
                name: 'affiliate_redirect_click',
                params: {
                    book_id: book || 'unknown',
                    redirect_type: type,
                    destination_url: dest
                }
            }]
        });

        promises.push(doPost(ga4Url, {
            "Content-Type": "application/json"
        }, ga4Body).catch(e => console.error("Erro GA4:", e)));
    }

    // Aguarda apenas um tempo curto (ex: 1s max) para tentar não atrasar muito o redirect do usuário, 
    // Netlify Functions espera até a função terminar, então é bom esperar as promises.
    if (promises.length > 0) {
        try {
            // Em node.js serverless é recomendável await para que o container não feche conexões inacabadas
            await Promise.allSettled(promises);
        } catch (e) {
            console.error("Erro nas promises de logging", e);
        }
    }

    // 3. Resposta de redirecionamento HTTP 302
    return {
        statusCode: 302,
        headers: {
            "Location": dest,
            "Cache-Control": "no-store, max-age=0"
        },
        body: "Redirecting..."
    };
};
