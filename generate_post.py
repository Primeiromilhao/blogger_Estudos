import json, os, re

json_data = '''{
  "topic": "A Graça que Perdoa os Pecados",
  "summary": "A graça de Deus é um dom gratuito que não pode ser comprado, justificando-nos pelo sangue de Cristo na cruz. É esse perdão genuíno que nos liberta definitivamente das correntes da culpa e da acusação, permitindo-nos recomeçar.",
  "recommendedBook": {
    "title": "A Graça Salvadora",
    "coverUrl": "assets/covers/graca-salvadora.jpg",
    "pageUrl": "https://rumoanovajerusalem.github.io/blogger_Estudos/studies/graca-salvadora/index.html"
  },
  "biblicalPassage": {
    "reference": "Efésios 2:8",
    "text": "Porque pela graça sois salvos, por meio da fé; e isto não vem de vós, é dom de Deus."
  },
  "practicalExample": "Quando errar, em vez de se esconder por vergonha, confesse sinceramente a Deus. Aproxime-se com confiança do Seu trono para receber misericórdia e ajuda no momento de necessidade."
}'''

post = json.loads(json_data)

try:
    with open('src/templates/post.html', 'r', encoding='utf-8') as f:
        template = f.read()
except Exception as e:
    print(f"Error reading template: {e}")
    exit(1)

try:
    with open('src/templates/theme-neon.css', 'r', encoding='utf-8') as f:
        css = f.read()
except:
    css = ''

sections = f'''
        <h2 class="neon-purple">Resumo</h2>
        <p>{post["summary"]}</p>
        
        <h2 class="neon-purple">Recomendação de Estudo</h2>
        <div class="book-card" style="display:flex; gap:20px; margin:20px 0; padding:20px; background:rgba(255,255,255,0.05); border-radius:12px; border:1px solid rgba(139,92,246,0.3);">
            <img src="{post["recommendedBook"]["coverUrl"]}" alt="Capa" style="max-width:120px; border-radius:8px;">
            <div>
                <h3>{post["recommendedBook"]["title"]}</h3>
                <a href="{post["recommendedBook"]["pageUrl"]}" class="action-btn" style="display:inline-block; margin-top:10px; padding:8px 16px; background:var(--primary); color:#fff; text-decoration:none; border-radius:6px; font-weight:bold;">Acessar Estudo Completo</a>
            </div>
        </div>

        <h2 class="neon-purple">A Palavra</h2>
        <blockquote class="bible-verse">
            <span class="quote-mark">“</span>
            {post["biblicalPassage"]["text"]}
            <footer>— {post["biblicalPassage"]["reference"]}</footer>
        </blockquote>

        <h2 class="neon-purple">Aplicação Prática</h2>
        <p>{post["practicalExample"]}</p>
'''

html = template.replace('<link rel="stylesheet" href="theme-neon.css">', f'<style>{css}</style>')
html = html.replace('{{TITLE}}', post['topic'])
html = html.replace('{{META_DESC}}', post['summary'][:150])
html = html.replace('{{COVER_URL}}', post['recommendedBook']['coverUrl'])
html = html.replace('{{COVER_ALT}}', post['topic'])
html = html.replace('{{PAGE_URL}}', 'index.html')
html = html.replace('{{LOGO_URL}}', 'assets/images/logo.png')
html = html.replace('{{DATE}}', '2023-10-27')
html = html.replace('{{FORMATTED_DATE}}', '27 de Outubro de 2023')
html = html.replace('{{INTRO}}', f'<p>Bem-vindo ao estudo sobre <strong>{post["topic"]}</strong>. Este material foi cuidadosamente preparado com base em nossos estudos cristãos.</p>')
html = html.replace('{{SECTIONS_HTML}}', sections)
html = html.replace('{{CONCLUSION}}', f'Esperamos que esta reflexão baseada no livro <em>{post["recommendedBook"]["title"]}</em> tenha abençoado sua vida.')

# Mind Map Data
map_data = {
    'center': post['topic'],
    'branches': [
        {'label': 'Referência', 'ref': post['biblicalPassage']['reference']},
        {'label': 'Livro Base', 'ref': post['recommendedBook']['title']},
        {'label': 'Ação Prática', 'ref': 'Ver conteúdo'}
    ]
}
html = html.replace('{{MAP_DATA_JSON}}', json.dumps(map_data))
html = html.replace('{{PREV_URL}}', '#')
html = html.replace('{{NEXT_URL}}', '#')
html = html.replace('<source srcset="{{COVER_URL_AVIF}}" type="image/avif">', '')
html = html.replace('<source srcset="{{COVER_URL_WEBP}}" type="image/webp">', '')

slug = re.sub(r'[^a-z0-9]+', '-', post['topic'].lower()).strip('-')
output_path = f'posts/post-ia-{slug}.html'
with open(output_path, 'w', encoding='utf-8') as f:
    f.write(html)
print(f'Criado {output_path}')
