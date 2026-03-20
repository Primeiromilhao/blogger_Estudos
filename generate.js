/**
 * generate.js
 * ------------
 * 1️⃣ Lê a biblioteca (data/library.json)
 * 2️⃣ Para cada livro, cria o prompt e chama Gemini
 * 3️⃣ Recebe o JSON de conteúdo + mapData
 * 4️⃣ Preenche o template HTML (tema neon, barra de progresso, TOC, mapa etc.)
 * 5️⃣ Salva o arquivo na raiz de blogger_Estudos
 * 6️⃣ Atualiza os links “Anterior/Próximo”
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import prettier from 'prettier';
import slugify from 'slugify';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* -------------------------------------------------
   Configurações
   ------------------------------------------------- */
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error('⚠️  GEMINI_API_KEY não está definido em .env');
  // Se rodar no GitHub Actions, vai dar erro aqui se não configurar o secret.
}

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
const model = genAI ? genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' }) : null;

/* Paths */
const LIBRARY_PATH = path.join(__dirname, 'data', 'library.json');
const TEMPLATE_DIR = path.join(__dirname, 'src', 'templates');
const TEMPLATE_PATH = path.join(TEMPLATE_DIR, 'post.html');
const THEME_CSS_PATH = path.join(TEMPLATE_DIR, 'theme-neon.css');
const OUT_DIR = __dirname; // Mantendo a estrutura original onde os HTMLs ficam na raiz de blogger_Estudos

/* -------------------------------------------------
   Funções auxiliares
   ------------------------------------------------- */
function formatDateISO(date = new Date()) {
  return date.toISOString().split('T')[0];
}

function formatDateHuman(date = new Date()) {
  const opts = { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo' };
  return date.toLocaleDateString('pt-BR', opts);
}

function metaDescription(text) {
  const plain = (text || '').replace(/\s+/g, ' ').trim();
  return plain.length > 155 ? plain.slice(0, 152) + '...' : plain;
}

function buildSectionsHTML(sections) {
  if (!sections) return '';
  return sections
    .map(sec => {
      const verseHtml = sec.verse
        ? `<blockquote class="verse"><p>${sec.verse.text}</p><footer>— <cite>${sec.verse.ref}</cite></footer></blockquote>`
        : '';
      return `<h2>${sec.heading}</h2>\n<p>${sec.content}</p>\n${verseHtml}`;
    })
    .join('\n');
}

function buildPrompt(book) {
  const { title, cover, coverAlt, intro, passages } = book;
  const passageList = passages?.length 
    ? passages.map(p => `- ${p.ref} – ${p.text}`).join('\n')
    : "- (IA: escolha passagens bíblicas relevantes sobre este tema)";

  return `
Você é um estudioso da Bíblia que cria posts de estudo bíblico.
A partir das informações abaixo, gere **um único objeto JSON** que contenha tudo que eu preciso para montar a página.

--- Dados do Livro ---
Título: ${title}
Descrição: ${intro}

Passagens Base (priorize estas):
${passageList}

--- Requisitos do JSON ---
{
  "title": "...",                     
  "intro": "...",                     
  "sections": [                       
    {
      "heading": "1. <palavra-chave>",
      "content": "Parágrafo explicativo...",
      "verse": {                        
        "text": "...",                 
        "ref": "..."
      }
    }
  ],
  "mapData": {                         
    "center": "${title.toUpperCase()}",
    "branches": [
      { "label": "Ref 1", "ref": "Capítulo:Versículo" }
    ]
  },
  "conclusion": "Texto de encerramento curto."
}
Responda APENAS com o JSON.
`;
}

async function callGemini(prompt) {
  if (!model) {
    console.log('API Key não encontrada. Gerando dados dummy para teste...');
    return {
      title: "Título Exemplo",
      intro: "Esta é uma introdução exemplo.",
      sections: [{ heading: "Ponto 1", content: "Conteúdo exemplo.", verse: { text: "João 3:16", ref: "João 3:16" } }],
      mapData: { center: "CENTRO", branches: [{ label: "Ref", ref: "Ref" }] },
      conclusion: "Fim."
    };
  }

  const result = await model.generateContent(prompt);
  const raw = await result.response.text();

  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}') + 1;
  const jsonStr = raw.substring(start, end);

  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error('❌ Erro parse JSON Gemini:', raw);
    throw e;
  }
}

async function renderHTML(post, book, fileName, prevFile, nextFile, themeCss) {
  const dateISO = formatDateISO();
  const humanDate = formatDateHuman();
  const metaDesc = metaDescription(post.intro);
  const baseUrl = 'https://primeiromilhao.github.io/blogger_Estudos';
  const pageUrl = `${baseUrl}/${fileName}`;
  const logoUrl = `${baseUrl}/img/logo.png`;

  const coverUrl = book.cover.startsWith('http') ? book.cover : `assets/covers/${book.cover}`;
  const coverBase = coverUrl.replace(/\.(jpe?g|png)$/i, '');
  
  // Placeholders
  const placeholders = {
    '{{TITLE}}': post.title,
    '{{META_DESC}}': metaDesc,
    '{{COVER_URL}}': coverUrl,
    '{{COVER_URL_AVIF}}': `${coverBase}.avif`,
    '{{COVER_URL_WEBP}}': `${coverBase}.webp`,
    '{{COVER_ALT}}': book.coverAlt || `Capa do livro ${book.title}`,
    '{{PAGE_URL}}': pageUrl,
    '{{DATE}}': dateISO,
    '{{FORMATTED_DATE}}': humanDate,
    '{{INTRO}}': post.intro,
    '{{SECTIONS_HTML}}': buildSectionsHTML(post.sections),
    '{{CONCLUSION}}': post.conclusion || '',
    '{{PREV_URL}}': prevFile ? `./${prevFile}` : '#',
    '{{NEXT_URL}}': nextFile ? `./${nextFile}` : '#',
    '{{LOGO_URL}}': logoUrl,
    '{{MAP_DATA_JSON}}': JSON.stringify(post.mapData || {}, null, 2)
  };

  let templateHtml = await fs.readFile(TEMPLATE_PATH, 'utf8');
  
  for (const [k, v] of Object.entries(placeholders)) {
    templateHtml = templateHtml.split(k).join(v);
  }

  // Inject CSS
  templateHtml = templateHtml.replace(
    '<link rel="stylesheet" href="theme-neon.css">',
    `<style>\n${themeCss}\n</style>`
  );

  return prettier.format(templateHtml, { parser: 'html' });
}

/* -------------------------------------------------
   Fluxo principal
   ------------------------------------------------- */
async function main() {
  const library = await fs.readJson(LIBRARY_PATH);
  const books = library.books;
  const themeCss = await fs.readFile(THEME_CSS_PATH, 'utf8');

  const generatedFiles = [];

  for (let i = 0; i < books.length; i++) {
    const book = books[i];
    const fileName = `${book.id}.html`;
    console.log(`🔎 Gerando: ${book.title} -> ${fileName}`);

    try {
      const prompt = buildPrompt(book);
      const post = await callGemini(prompt);
      
      const html = await renderHTML(post, book, fileName, null, null, themeCss);
      await fs.writeFile(path.join(OUT_DIR, fileName), html, 'utf8');
      
      generatedFiles.push(fileName);
      console.log(`✅ Salvo: ${fileName}`);
    } catch (e) {
      console.error(`⚡ Falha em ${book.title}:`, e.message);
    }
  }

  // Segunda passada para links prev/next
  console.log('\n🔗 Atualizando links de navegação...');
  for (let i = 0; i < generatedFiles.length; i++) {
    const file = generatedFiles[i];
    const prev = i > 0 ? generatedFiles[i - 1] : null;
    const next = i < generatedFiles.length - 1 ? generatedFiles[i + 1] : null;
    
    let html = await fs.readFile(path.join(OUT_DIR, file), 'utf8');
    html = html.replace('href="#"', `href="./${prev || '#'}"`) // Simplificado
               .replace('href="#"', `href="./${next || '#'}"`); // Assume ordem PREV então NEXT
    
    // Como o replace simple pode falhar se o template mudar, vamos usar algo mais robusto se precisar.
    // Mas por agora serve para o template fornecido.
  }

  console.log('\n🎉 Concluído!');
}

main().catch(console.error);
