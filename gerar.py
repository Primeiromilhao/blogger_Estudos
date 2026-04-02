import os
import json
import re
import sys
import codecs
import time
import urllib.request
import urllib.parse
from pathlib import Path

# Configuração da IA (Google Gen AI SDK Novo)
try:
    from google import genai
except ImportError:
    print("ERRO: O pacote 'google-genai' não está instalado.")
    print("Por favor, instale com: pip install google-genai")
    sys.exit(1)

# Configuração de Pastas
BASE_DIR = Path(__file__).parent
POSTS_DIR = BASE_DIR / "posts"
INSTA_DIR = POSTS_DIR / "instagram"
FB_DIR = POSTS_DIR / "facebook"
TEMPLATE_PATH = POSTS_DIR / "templates" / "instagram_template.html"
BOOKS_JSON = BASE_DIR / "books.json"

# API KEY (Tenta do script anterior ou env)
# API KEY (⚠️ IMPORTANTE: Obtenha uma nova chave em: https://aistudio.google.com/app/api-keys)
API_KEY = "AIzaSyBGgKsxcJPemFQQTc6XBjmDM3FYO5L4MJ8" 

def slugify(text):
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')

def ask_ai_for_content(theme, books_list):
    """ Usa o Google Gen AI para gerar todo o conteúdo de uma vez """
    client = genai.Client(api_key=API_KEY)
    model_id = 'gemini-1.5-flash'
    
    prompt = f"""Você é um criador de conteúdo cristão de elite.
Tema: {theme}
Livros disponíveis na biblioteca: {books_list}

  "hook": "Um gancho inicial de 3 segundos para o Facebook.",
  "ig_mind_map": {{
    "center": "TEMA CENTRAL",
    "nodes": ["Bíblia: Ref", "Prática: Ação", "Manual: Livro"]
  }},
  "fb_visual_caption": "Legenda curta e visual com emojis para o Facebook."
}}

Responda APENAS o JSON puro, sem markdown. Adicione no final da legenda do Facebook o aviso: "Como associado da Amazon, recebo por compras qualificadas."
"""

    response = client.models.generate_content(model=model_id, contents=prompt)
    raw = response.text
    # Limpeza básica do JSON
    raw = re.sub(r'```json|```', '', raw).strip()
    return json.loads(raw)

def verify_bible_verse(reference, translation='almeida'):
    """ Busca o texto oficial na API para garantir precisão """
    try:
        url = f"https://bible-api.com/{urllib.parse.quote(reference)}?translation={translation}"
        print(f"[BIBLE-API] Verificando {reference} ({translation})...")
        with urllib.request.urlopen(url) as response:
            data = json.loads(response.read().decode())
            return data.get('text', '').strip()
    except Exception as e:
        print(f"[BIBLE-WARN] Falha ao verificar {reference}: {e}")
        return None

def create_social_posts(topic, data, book_link, book_cover=None):
    slug = slugify(topic)
    disclaimer = "\n\n(Como associado da Amazon, recebo por compras qualificadas.)"
    
    # 1. Legenda Facebook (Visual e Curta)
    fb_content = f"""🔥 {topic.upper()}
------------------------------------------

{data['fb_visual_caption']}

📖 BÍBLIA:
"{data['verse_pt']}"
— {data['ref']}

📚 MANUAL DO DIA:
👉 {book_link}

#Bíblia #Fé #EscolaBíblica #{slug.replace('-', '')}
{disclaimer}
"""
    
    fb_file = FB_DIR / f"post-{slug}.txt"
    with open(fb_file, "w", encoding="utf-8") as f:
        f.write(fb_content)
    
    # 2. Mapa Mental Instagram (Estilo Profissional)
    if TEMPLATE_PATH.exists():
        with open(TEMPLATE_PATH, "r", encoding="utf-8") as f:
            html = f.read()
        
        html = html.replace("{{TOPIC}}", topic)
        html = html.replace("{{VERSE}}", f"{data['ref']}: {data['verse_pt']}")
        html = html.replace("{{BOOK}}", data['book_name'])
        html = html.replace("{{PRACTICE}}", data['practice'])
        
        # Adiciona capa se existir
        if book_cover:
            html = html.replace("{{COVER_URL}}", book_cover)
        
        temp_html = POSTS_DIR / "templates" / f"temp-{slug}.html"
        with open(temp_html, "w", encoding="utf-8") as f:
            f.write(html)
        
        return fb_file, temp_html
    return fb_file, None

if __name__ == "__main__":
    if sys.platform == "win32":
        sys.stdout = codecs.getwriter("utf-8")(sys.stdout.detach())

    print("-" * 45)
    print("GERADOR DE POSTS 100% AUTOMÁTICO (IA)")
    print("-" * 45)
    
    tema = input("Digite o TEMA do post: ")
    print("\n[AGUARDE] A IA está analisando a Bíblia, traduzindo e mapeando livros...")
    
    try:
        # Carrega lista de livros para a IA escolher
        books_str = ""
        if BOOKS_JSON.exists():
            with open(BOOKS_JSON, "r", encoding="utf-8") as f:
                books = json.load(f)
                books_str = ", ".join([b['title'] for b in books[:30]]) # Top 30 para o prompt
        
        ai_data = ask_ai_for_content(tema, books_str)

        # Verificação Oficial da Bíblia (Evita alucinação da IA)
        official_kjv = verify_bible_verse(ai_data['ref'], 'kjv')
        if official_kjv: ai_data['verse_kjv'] = official_kjv
        
        official_pt = verify_bible_verse(ai_data['ref'], 'almeida')
        if official_pt: ai_data['verse_pt'] = official_pt
        
        # Link do livro escolhido e Capa
        final_link = "https://rumoanovajerusalem.github.io/blogger_Estudos/#biblioteca"
        book_cover = "https://rumoanovajerusalem.github.io/blogger_Estudos/img/default-book.jpg"
        
        if BOOKS_JSON.exists():
            with open(BOOKS_JSON, "r", encoding="utf-8") as f:
                books_data = json.load(f)
                for b in books_data:
                    if b['title'].lower() in ai_data['book_name'].lower():
                        final_link = b.get('affiliate_link', final_link)
                        # Busca capa na library.json se necessário (simplificado aqui)
                        break

        fb_path, html_path = create_social_posts(tema, ai_data, final_link, book_cover)
        
        print("\n✅ SUCESSO ABSOLUTO!")
        if fb_path: print(f"1. Legenda em PT/EN: {fb_path.name}")
        if html_path: print(f"2. Mapa Mental (Insta): {html_path.name}")
        print("\nAgora é só copiar o texto e tirar o print do HTML!")
    except Exception as e:
        print(f"\nErro no processo: {e}")
    print("-" * 45)
