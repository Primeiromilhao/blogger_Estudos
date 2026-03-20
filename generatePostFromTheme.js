import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* -------------------------------------------------
   CONFIGURAÇÕES
   ------------------------------------------------- */
const REPO_OWNER = 'Primeiromilhao';
const REPO_NAME  = 'blogger_Estudos';
const GITHUB_API = 'https://api.github.com';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GITHUB_TOKEN   = process.env.GITHUB_TOKEN;   // opcional para repo privado

if (!GEMINI_API_KEY) { console.error('⚠️  GEMINI_API_KEY ausente'); process.exit(1); }
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

/* -------------------------------------------------
   FUNÇÕES AUXILIARES
   ------------------------------------------------- */
async function githubFetch(url) {
  const headers = { Accept: 'application/vnd.github.v3+json' };
  if (GITHUB_TOKEN) headers.Authorization = `token ${GITHUB_TOKEN}`;
  
  const res = await fetch(`${GITHUB_API}${url}`, { headers });
  if (!res.ok) {
      if (res.status === 404) return null; // Pasta não encontrada ou vazia
      throw new Error(`GitHub error ${res.status} ${await res.text()}`);
  }
  return await res.json();
}

/* Listar todas as pastas que contêm um livro ou estudo */
async function listContentFolders(basePath) {
  const items = await githubFetch(`/repos/${REPO_OWNER}/${REPO_NAME}/contents/${basePath}`);
  if (!items) return []; // Retorna vazio se a pasta base não existir
  // Filtra apenas diretórios
  return items.filter(i => i.type === 'dir').map(i => i.path);
}

/* Ler meta.json + texto.md de uma pasta */
async function readFolderData(folderPath) {
  const metaUrl = `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${folderPath}/meta.json`;
  const textUrl = `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${folderPath}/texto.md`;

  const [metaResp, textResp] = await Promise.all([githubFetch(metaUrl), githubFetch(textUrl)]);

  if (!metaResp || !textResp) return null; // Pula se faltar algum dos arquivos principais

  // O conteúdo vem base64 – decodifica
  const meta = JSON.parse(Buffer.from(metaResp.content, 'base64').toString('utf8'));
  const texto = Buffer.from(textResp.content, 'base64').toString('utf8');
  return { meta, texto, folderPath };
}

/* -------------------------------------------------
   BUSCA DE RELEVÂNCIA
   ------------------------------------------------- */
/**
 * Retorna os objetos {meta, texto} que contenham a palavra‑chave
 * (case‑insensitive, tolerante a acentos). Limita a N itens.
 */
function filterByKeyword(docs, keyword, limit = 5) {
  const kw = keyword.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const matches = docs.filter(doc => {
    if (!doc) return false;
    const { meta, texto } = doc;
    const searchable = `${meta.title} ${meta.tags?.join(' ')} ${texto}`;
    const norm = searchable.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    return norm.includes(kw);
  });

  // Ordena por tamanho do texto (ex.: itens mais longos tendem a ser mais ricos)
  matches.sort((a, b) => b.texto.length - a.texto.length);
  return matches.slice(0, limit);
}

/* -------------------------------------------------
   MONTAGEM DO PROMPT PARA GEMINI
   ------------------------------------------------- */
function buildGeminiPrompt(topic, matches) {
  // 1️⃣ Cria a parte “knowledge base”
  const knowledge = matches.map((doc, idx) => {
    const { meta, texto, folderPath } = doc;
    return `--- Livro/Estudo ${idx + 1} ---
Título: ${meta.title}
Tags: ${meta.tags?.join(', ') ?? 'sem tags'}
Descrição curta: ${meta.shortDesc ?? '–'}
Contexto Original: ${folderPath}
Capa URL: assets/covers/${meta.cover}
Texto (até 1500 caracteres):
${texto.slice(0, 1500).replace(/\r?\n/g, ' ')}
--- fim do material ${idx + 1} ---`;
  }).join('\n\n');

  // 2️⃣ Prompt completo (system + user)
  const systemMsg = `Você é um estudioso da Bíblia que tem acesso a uma lista de livros e estudos cristãos (ver “knowledge base”).  
Seu objetivo é, a partir do tema que o usuário fornecer, gerar:

1. **Resumo conceitual** que conecte o tema ao ensinamento bíblico.  
2. **Recomendação de um livro** (título, capa, link interno – use a URL relativa ao repositório \`https://primeiromilhao.github.io/blogger_Estudos/{Contexto Original}/index.html\`) que melhor aborda o assunto.  
3. **Passagem bíblica** que legitime a recomendação (citação completa + referência).  
4. **Exemplo prático** de como aplicar esse princípio no cotidiano (máximo 3 frases).  

**Saída deve ser JSON** no seguinte formato (SEM MARKDOWN, SEM TEXTOS EXTRAS):

{
  "topic": "…",
  "summary": "…",
  "recommendedBook": {
    "title": "…",
    "coverUrl": "…",
    "pageUrl": "…"
  },
  "biblicalPassage": {
    "reference": "…",
    "text": "…"
  },
  "practicalExample": "…"
}

Importante:
Use exatamente as informações que aparecem na "knowledge base"; não invente títulos ou passagens que não existam.
Se houver mais de um livro adequado, escolha o que tem maior comprimento de texto.
Caso nenhuma passagem bíblica direta corresponda ao tema, indique a passagem que mais se aproxima semanticamente.
Não inclua comentários, explicações adicionais ou markup markdown (\`\`\`json). APENAS O JSON PURO.

Agora, gere a resposta para o seguinte tema: "${topic}".`;

  const userMsg = `knowledge base:\n${knowledge}`;

  return { systemMsg, userMsg };
}

/* -------------------------------------------------
   CHAMADA À GEMINI
   ------------------------------------------------- */
async function askGemini(systemMsg, userMsg) {
  const result = await model.generateContent([
    { role: 'user', parts: [{ text: systemMsg + '\n\n' + userMsg }] }
  ]);

  const raw = result.response.text();

  // O modelo costuma envolver a resposta em json – limpa tudo que não for JSON.
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}') + 1;
  const jsonStr = raw.substring(start, end);
  return JSON.parse(jsonStr);
}

/* -------------------------------------------------
   FUNÇÃO PRINCIPAL – ENTRYPOINT
   ------------------------------------------------- */
export async function generatePostFromTheme(userTheme) {
  // 1️⃣ Busca todos os livros + studies
  console.log(`Buscando material no GitHub para o tema: "${userTheme}"...`);
  const bookFolders = await listContentFolders('books');
  const studyFolders = await listContentFolders('studies');
  const allFolders = [...bookFolders, ...studyFolders];

  if (allFolders.length === 0) {
      throw new Error("Nenhum diretório (books/ ou studies/) encontrado no repositório.");
  }

  // 2️⃣ Lê meta e texto de cada folder
  console.log(`Lendo dados de ${allFolders.length} pastas...`);
  const docs = await Promise.all(allFolders.map(p => readFolderData(p)));

  // Remove pastas inválidas/sem arquivos requeridos
  const validDocs = docs.filter(d => d !== null);

  // 3️⃣ Filtra pelos que mencionam o tema (máx 5)
  const relevant = filterByKeyword(validDocs, userTheme, 5);
  if (relevant.length === 0) {
    throw new Error(`Nenhum livro ou estudo encontrado no repositório relacionado ao tema "${userTheme}".`);
  }

  console.log(`Encontrados ${relevant.length} materiais relevantes. Enviando para o Gemini...`);

  // 4️⃣ Monta prompt + chama Gemini
  const { systemMsg, userMsg } = buildGeminiPrompt(userTheme, relevant);
  const answer = await askGemini(systemMsg, userMsg);
  
  return answer;
}

/* -------------------------------------------------
   EXEMPLO DE USO (CLI)
   ------------------------------------------------- */
if (import.meta.url === `file://${process.argv[1]}`) {
  // Executado diretamente via: node generatePostFromTheme.js "Perdão"
  const theme = process.argv[2];
  if (!theme) {
    console.error('Uso: node generatePostFromTheme.js "tema desejado"');
    process.exit(1);
  }
  
  generatePostFromTheme(theme)
    .then(res => {
      console.log('\n=== Resposta Gemini (JSON) ===');
      console.log(JSON.stringify(res, null, 2));
    })
    .catch(err => {
        console.error('\n❌ Erro:', err.message);
        process.exit(1);
    });
}
