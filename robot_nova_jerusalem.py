import os
import json
import time
import re
import sys
import requests
import subprocess
import markdown
import pypdf

try:
    from bridge import processar_pedido
except ImportError:
    def processar_pedido(p): return {"resposta": "Erro: bridge.py nÃ£o encontrado", "provedor": "Erro", "modelo": "N/A"}

from selenium import webdriver
from selenium.webdriver.edge.service import Service
from selenium.webdriver.edge.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# Importando módulos do cérebro de manutenção (pasta agents)
from agents.self_healing import diagnosticar_erro
from agents.auth_handler import verificar_necessidade_login, realizar_login_google, realizar_login_facebook
from agents.alerter import notificar_falha_critica

# Força o Python a mostrar os prints imediatamente na tela preta
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(line_buffering=True)

# ==========================================
# CONFIGURAÇÕES
# ==========================================
GEMINI_API_KEY = "AIzaSyDXlzlmjEnRmo_-ywN9TlKrawKHnCbuod8"
EDGE_USER_DATA = r"C:\Users\Utilizador\AppData\Local\Microsoft\Edge\User Data"
REPO_PATH = os.getcwd() # Caminho dinâmico para evitar erros de diretório
HISTORY_FILE = os.path.join(REPO_PATH, "posted_history.json")
BLOGGER_POST_URL = "https://www.blogger.com/blog/posts/6105085440625695277"

# Conexão com IA será feita via bridge.py
print("[*] Robot configurado para usar a Ponte Híbrida (Groq/Ollama).")

def load_history():
    if os.path.exists(HISTORY_FILE):
        with open(HISTORY_FILE, "r") as f:
            return json.load(f)
    return {"posted_books": [], "posted_files": []}

def save_history(history):
    with open(HISTORY_FILE, "w") as f:
        json.dump(history, f, indent=2)

def extract_text_from_pdf(pdf_path):
    try:
        reader = pypdf.PdfReader(pdf_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text
    except Exception as e:
        print(f"Erro ao ler PDF {pdf_path}: {e}")
        return ""

def extract_text_from_html(html_path):
    try:
        with open(html_path, "r", encoding="utf-8") as f:
            content = f.read()
        # Limpeza básica de tags HTML
        text = re.sub(r'<[^>]+>', '', content)
        return text
    except Exception as e:
        print(f"Erro ao ler HTML {html_path}: {e}")
        return ""

def select_content():
    history = load_history()
    
    # 1. Carregar livros
    books_file = os.path.join(REPO_PATH, "books.json")
    with open(books_file, "r", encoding="utf-8") as f:
        books = json.load(f)
        
    import random
    
    # 2. Procurar material pronto em 'posts'
    posts_dir = os.path.join(REPO_PATH, "posts")
    if os.path.exists(posts_dir):
        available_files = [f for f in os.listdir(posts_dir) if f.endswith(".md") and f not in history["posted_files"]]
        if available_files:
            random.shuffle(available_files) # Embaralhar para evitar repetitividade
            file = available_files[0]
            # Tentar encontrar o livro relacionado pelo nome do arquivo
            book = None
            for b in books:
                slug = re.sub(r'[^a-z0-9]+', '_', b["title"].lower())
                if slug in file.lower():
                    book = b
                    break
            
            if book:
                return {"type": "ready_md", "file": file, "path": os.path.join(posts_dir, file), "book": book}

    # 3. Procurar livros pendentes
    # Usar um set para busca rÃ¡pida e garantir que sÃ³ pegamos o que nunca foi postado
    posted_set = set(history["posted_books"])
    available_books = [b for b in books if b["title"] not in posted_set]
    
    if available_books:
        # Dar prioridade a livros que tÃªm tÃtulo em PortuguÃªs no JSON se houver
        random.shuffle(available_books)
        return {"type": "generate", "book": available_books[0]}
            
    return None

def generate_article(content_info):
    import markdown
    book = content_info["book"]
    
    if content_info["type"] == "ready_md":
        with open(content_info["path"], "r", encoding="utf-8") as f:
            raw_content = f.read()
            
        # Remover metadados --- se existirem no topo (regex mais robusta)
        import re
        content = re.sub(r'(?s)^\s*---.*?---\s*', '', raw_content).strip()
        
        # Converter para HTML
        import markdown
        html_body = markdown.markdown(content, extensions=['extra', 'tables', 'fenced_code'])
        
        # Preparar Imagem da Capa (sempre do books.json que tem URLs válidas)
        full_html = ""
        if "cover" in book and book["cover"]:
            full_html += f"""
            <div style="text-align: center; margin-bottom: 30px;">
                <a href="{book['affiliate_link']}" target="_blank">
                    <img src="{book["cover"]}" alt="Capa do Livro {book['title']}" style="max-width: 300px; height: auto; border: 1px solid #ddd; padding: 5px; border-radius: 5px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                </a>
                <p style="font-size: 0.9em; color: #666; margin-top: 10px;"><i>Capa do Livro: {book['title']}</i></p>
            </div><br>
            """
        full_html += html_body
        return book["title"], full_html
    
def fixar_anuncio_obrigatorio(html_body, book):
    """ Garante que os convites para a igreja e links de venda apareçam SEMPRE no fim do post. """
    anuncio = f"""
    <br><hr><br>
    <div style="background-color: #f9f9f9; padding: 20px; border-radius: 10px; border: 1px solid #eee;">
        <h2 style="color: #2c3e50; text-align: center;">🙏 Convite Especial: Igreja Ministério Voz da Cura</h2>
        <p style="text-align: center;">Venha fortalecer a sua fé e estar connosco presencialmente numa das nossas reuniões!</p>
        <p style="text-align: center; font-weight: bold; font-size: 1.1em;">
            📍 Rua Diogo Brandão 63, Porto, Portugal.
        </p>
        <div style="text-align: center; margin-top: 20px;">
            <p><strong>Conheça a nossa vitrine e loja online Nova Jerusalém:</strong></p>
            <p>
                📖 <a href="https://primeiromilhao.github.io/blogger_Estudos/#biblioteca">Biblioteca Profética</a> | 
                📘 <a href="https://www.facebook.com/bibliotecaprofetica">Facebook Biblioteca</a> | 
                🛡️ <a href="https://www.facebook.com/gracaperfeitaoficial">Graça Perfeita</a>
            </p>
        </div>
        <div style="margin-top: 20px; border-top: 1px dotted #ccc; padding-top: 10px; text-align: center; color: #666; font-size: 0.9em;">
            <p>🛒 <strong>Adquira o livro "{book['title']}" na Amazon:</strong> <a href="{book['affiliate_link']}">{book['affiliate_link']}</a></p>
            <p><i>Como associado da Amazon, as suas compras qualificadas apoiam este ministério.</i></p>
        </div>
    </div>
    """
    return html_body + anuncio

def generate_article(content_info):
    import markdown
    book = content_info["book"]
    
    if content_info["type"] == "ready_md":
        # ... logic for ready_md remains or simplified
        pass

    # GERAÇÃO IA DE ALTA PERFORMANCE (Style 2.0 - PORTUGUÊS OBRIGATÓRIO)
    # Traduzir o título primeiro para garantir consistência
    prompt_titulo = f"Traduza o título '{book['title']}' para um título de blog atraente e profundo em Português de Portugal. Responda APENAS o título traduzido."
    res_titulo = processar_pedido(prompt_titulo)
    titulo_pt = res_titulo['resposta'].replace("TITULO:", "").strip()
    
    prompt = f"""
    Crie um artigo de blog MAGNÉTICO e DINÂMICO para o portal "Leitura Profética" em PORTUGUÊS DE PORTUGAL.
    TEMA CENTRAL: Livro "{titulo_pt}" (Original: {book['title']})
    LINK DE VENDAS (Amazon): {book['affiliate_link']}
    
    DIRETRIZES DE CONTEÚDO:
    1. HOOK DE IMPACTO: Comece com uma pergunta curiosa que prenda o leitor.
    2. NARRATIVA ENVOLVENTE: Explique o conceito do livro de forma entusiasmada e espiritual.
    3. EXPERIÊNCIA PRÁTICA: Seção "⚡ NA PRÁTICA: Como resolver isso hoje?"
    4. CURIOSIDADE: Frase instigante para o post de amanhã.
    
    REGRAS DE FORMATAÇÃO:
    - HTML limpo (<h2>, <p>, <strong>, <br>).
    - Parágrafos curtos e emojis estratégicos.
    """
    
    try:
        resultado = processar_pedido(prompt)
        content = resultado.get("resposta", "")
        print(f"[IA] Artigo em Português gerado com sucesso!")
    except Exception as e:
        print(f"[!] Erro na IA. Usando fallback.")
        content = f"<p>Descubra o poder da fé através do livro {titulo_pt}.</p>"
    
    html_body = markdown.markdown(content, extensions=['extra', 'tables', 'fenced_code'])
    
    # Adicionar imagem da capa se houver
    full_html = ""
    if "cover" in book and book["cover"]:
        full_html += f'<div style="text-align: center;"><img src="{book["cover"]}" style="max-width:300px; border-radius:10px;"></div><br>'
        
    # INJEÇÃO FORÇADA DE CTAs (O SEGREDO DA SUCESSO)
    full_html = fixar_anuncio_obrigatorio(full_html + html_body, book)
    
    return titulo_pt, full_html

def post_to_blogger(title, content):
    print(f"Iniciando postagem no Blogger: {title}")
    try:
        options = Options()
        options.add_argument(f"user-data-dir={EDGE_USER_DATA}")
        options.add_argument("--profile-directory=Default")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-gpu")
        options.add_argument("--remote-debugging-port=9222")
        
        driver = webdriver.Edge(options=options)
        wait = WebDriverWait(driver, 30)
    
        def limpar_rascunhos_antigos():
            """ Localiza e elimina rascunhos pendentes na lista do Blogger """
            print("[*] Iniciando faxina de rascunhos antigos...")
            try:
                # Seleciona linhas que contenham o estado 'Rascunho' ou 'Draft'
                rascunhos = driver.find_elements(By.XPATH, "//div[contains(@id, 'manage')]//div[@role='listitem'][contains(., 'Rascunho') or contains(., 'Draft')]")
                if rascunhos:
                    print(f"[!] Detetados {len(rascunhos)} rascunhos. Limpando ambiente...")
                    for r in rascunhos:
                        try:
                            # Tenta encontrar o ícone de lixeira dentro da linha do rascunho
                            lixeira = r.find_element(By.XPATH, ".//div[contains(@aria-label, 'Eliminar') or contains(@aria-label, 'Delete')]")
                            driver.execute_script("arguments[0].click();", lixeira)
                            time.sleep(2)
                            # Confirmar eliminação no popup
                            confirmar = wait.until(EC.element_to_be_clickable((By.XPATH, "//div[@role='dialog']//span[contains(text(), 'Eliminar') or contains(text(), 'Delete')]")))
                            driver.execute_script("arguments[0].click();", confirmar)
                            time.sleep(3)
                        except: pass
                    print("[OK] Ambiente limpo.")
                else:
                    print("[OK] Nenhum rascunho bloqueante encontrado.")
            except Exception as e:
                print(f"[!] Aviso durante a limpeza: {e}")
        
        # --- CICLO DE AUTO-RECUPERAÇÃO (Máximo 2 tentativas) ---
        tentativa = 1
        max_tentativas = 2
        
        while tentativa <= max_tentativas:
            try:
                print(f"[70%] Navegando para o Blogger... (Tentativa {tentativa}/{max_tentativas})")
                driver.get("https://www.blogger.com/blog/posts/6105085440625695277")
                time.sleep(8)
                
                # 1. Verificar se já estamos logados (Modo Híbrido)
                necessidade = verificar_necessidade_login(driver)
                if necessidade == "google":
                    print("[AUTH] Sessão não encontrada. Tentando login automático...")
                    if not realizar_login_google(driver, "blogger"):
                        print("[!] Login automático falhou. Tentando diagnóstico de IA...")
                        diagnostico = diagnosticar_erro(driver, "Falha no login Google")
                        if diagnostico.get("acao") == "LOGIN_REQUIRED":
                            raise Exception("Manual login required or Google blocked automation.")
                
                # Re-verifica se entrou no Dashboard
                if "blogger.com/blog/posts" not in driver.current_url:
                    driver.get("https://www.blogger.com/blog/posts/6105085440625695277")
                    time.sleep(5)
                
                # 2. Limpeza de Rascunhos antes de começar
                if tentativa == 1:
                    limpar_rascunhos_antigos()
            
                print("[80%] Dashboard detetado. Preparando nova postagem...")
                # Lógica agressiva para encontrar e clicar no botão "Nova Postagem"
                button_clicked = False
                selectors = [
                    "//span[contains(text(), 'Nova postagem') or contains(text(), 'New post')]",
                    "//div[contains(text(), 'Nova postagem')]",
                    "//*[contains(@aria-label, 'Nova postagem') or contains(@aria-label, 'Criar')]",
                    "//div[@role='button'][contains(., 'Nova postagem')]",
                    "//a[contains(@href, 'post/edit')]"
                ]
                
                for root_xpath in selectors:
                    try:
                        elements = driver.find_elements(By.XPATH, root_xpath)
                        for el in elements:
                            if el.is_displayed() or el.is_enabled():
                                driver.execute_script("arguments[0].click();", el)
                                button_clicked = True
                                print(f"Botão clicado usando seletor: {root_xpath}")
                                break
                    except:
                        pass
                    if button_clicked:
                        break
                        
                if not button_clicked:
                    print("[!] Falha extrema ao clicar. Tentando URL forçada de criação...")
                    driver.get("https://www.blogger.com/blog/post/create/6105085440625695277")
                    
                time.sleep(5)
                
                # Título - Forçar limpeza e foco antes de digitar
                print("[85%] Localizando caixa de título...")
                title_box = wait.until(EC.element_to_be_clickable((By.XPATH, "//input[@type='text' and (contains(@aria-label, 'itulo') or contains(@placeholder, 'itulo') or contains(@aria-label, 'Title') or contains(@placeholder, 'Title'))] | //*[@aria-label='Título' or @aria-label='Title']")))
                driver.execute_script("arguments[0].scrollIntoView();", title_box)
                title_box.click()
                time.sleep(1)
                driver.execute_script("arguments[0].value = '';", title_box)
                driver.execute_script("arguments[0].dispatchEvent(new Event('input', { bubbles: true }));", title_box)
                title_box.send_keys(title)
                
                # Tentar mudar para modo HTML para garantir que o código seja inserido corretamente
                print("[90%] Preparando editor (Modo HTML)...")
                try:
                    # Tenta clicar no botão de alternância de modo
                    mode_toggle = wait.until(EC.element_to_be_clickable((By.XPATH, "//*[contains(@aria-label, 'visualiza') or contains(@aria-label, 'View') or contains(@class, 'editor-toolbar-button')]")))
                    driver.execute_script("arguments[0].click();", mode_toggle)
                    time.sleep(2)
                    
                    # Escolhe "Visualização em HTML" - Seletor mais amplo
                    html_option = wait.until(EC.element_to_be_clickable((By.XPATH, "//span[contains(text(), 'HTML')] | //div[contains(text(), 'HTML')] | //*[@data-value='html'] | //li[contains(., 'HTML')]")))
                    driver.execute_script("arguments[0].click();", html_option)
                    print("[91%] Editor alterado para modo HTML.")
                    time.sleep(3)
                except Exception as e:
                    print(f"[!] Aviso: Dificuldade em alternar modo ({e}). Tentando injeção direta no editor ativo.")
        
                # Inserção de conteúdo via injeção direta de JavaScript de Alta Precisão
                print("[92%] Escrevendo artigo (Injeção de Código)...")
                try:
                    driver.execute_script("""
                        var content = arguments[0];
                        var injected = false;
                        
                        // Prioridade 1: CodeMirror (Coração do Editor do Blogger no modo HTML)
                        var cmElement = document.querySelector('.CodeMirror');
                        if (cmElement && cmElement.CodeMirror) {
                            cmElement.CodeMirror.setValue(content);
                            cmElement.CodeMirror.focus();
                            injected = true;
                            console.log('Injetado via CodeMirror API');
                        }
                        
                        // Prioridade 2: Textarea do Editor HTML (se o objeto CodeMirror não estiver acessível)
                        if (!injected) {
                            var ta = document.querySelector('.CodeMirror textarea') || document.querySelector('textarea.editor-textarea');
                            if (ta) {
                                ta.value = content;
                                ta.dispatchEvent(new Event('input', { bubbles: true }));
                                injected = true;
                                console.log('Injetado via Textarea');
                            }
                        }
                        
                        // Prioridade 3: Compose Mode (Modo Visual - Último recurso)
                        if (!injected) {
                            var editor = document.querySelector('div[role="textbox"]') || document.querySelector('#hosting-iframe');
                            if (editor) {
                                if (editor.tagName === 'IFRAME') {
                                    try {
                                        var doc = editor.contentDocument || editor.contentWindow.document;
                                        doc.body.innerHTML = content;
                                    } catch(e) {}
                                } else {
                                    editor.innerHTML = content;
                                }
                                injected = true;
                                console.log('Injetado via InnerHTML');
                            }
                        }
                        return injected;
                    """, content)
                except Exception as e:
                    print(f"[!] Erro na injeção via JS: {e}. Tentando fallback simples...")
                    try:
                        editable = wait.until(EC.presence_of_element_located((By.XPATH, "//textarea | //div[@role='textbox']")))
                        editable.send_keys(content)
                    except: pass
                    
                time.sleep(5)
        
                # PASSO OBRIGATÓRIO: Salvar antes de publicar (evita rascunhos vazios)
                print("[93%] Salvando rascunho...")
                try:
                    save_btn = driver.find_element(By.XPATH, "//div[contains(@aria-label, 'Salvar') or contains(@aria-label, 'Save')] | //span[contains(text(), 'Salvar') or contains(text(), 'Save')]")
                    driver.execute_script("arguments[0].click();", save_btn)
                    time.sleep(3)
                except:
                    print("[!] Aviso: Não foi possível clicar em 'Salvar', tentando prosseguir direto para publicação.")
        
                time.sleep(3)
                
                time.sleep(3)
                
                # Publicar (Botão Principal - Focando no ícone de seta laranja se necessário)
                print("[96%] Iniciando publicação...")
                pub_clicked = False
                for pub_xpath in [
                    "//div[@role='button' and contains(@aria-label, 'Publicar')]",
                    "//div[@role='button'][@aria-label='Publicar']",
                    "//div[contains(@class, 'VfPpkd-LgbsBe') and @aria-label='Publicar']",
                    "//div[contains(@class, 'editor-publish-button')]",
                    "//div[contains(@class, 'publishBuffer')]",
                    "//span[contains(text(), 'Publicar') or contains(text(), 'Publish')]",
                    "//div[@role='button']//div[contains(@class, 'icon-publish') or contains(@class, 'send-icon')]",
                    "//div[@role='button' and @data-tooltip='Publicar']",
                    "//*[contains(@aria-label, 'ublish') or contains(@aria-label, 'ublicar')]"
                ]:
                    try:
                        publish_btn = wait.until(EC.element_to_be_clickable((By.XPATH, pub_xpath)))
                        driver.execute_script("arguments[0].scrollIntoView();", publish_btn)
                        driver.execute_script("arguments[0].click();", publish_btn)
                        pub_clicked = True
                        print(f"Clique no botão de publicar (Seta Laranja) via: {pub_xpath}")
                        break
                    except: pass
                
                if not pub_clicked:
                    print("[!] Erro: Não foi possível encontrar o botão Publicar.")
                    driver.save_screenshot("erro_botao_publicar.png")
                    # TENTATIVA DESESPERADA: Clique por coordenadas ou Enter no rastro
                    try:
                        driver.find_element(By.TAG_NAME, 'body').send_keys(Keys.CONTROL + Keys.ENTER)
                        print("[FALLBACK] Tentativa de publicar via CTRL+ENTER")
                    except: pass
                    return False
        
                time.sleep(5)
                
                # Tentar confirmar publicação (o diálogo que aparece depois)
                print("[97%] Confirmando publicação...")
                confirm_clicked = False
                for confirm_xpath in [
                    "//button//span[contains(text(), 'Confirmar') or contains(text(), 'Confirm')]",
                    "//*[contains(translate(text(), 'abcdefghijklmnopqrstuvwxyz', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'), 'CONFIRMAR')]",
                    "//div[@role='button']//span[contains(text(), 'Confirmar')]",
                    "//div[@role='button' and @aria-label='Confirmar']",
                    "//span[text()='Confirmar']"
                ]:
                    try:
                        # O diálogo pode demorar a aparecer
                        confirm_btn = WebDriverWait(driver, 10).until(EC.element_to_be_clickable((By.XPATH, confirm_xpath)))
                        driver.execute_script("arguments[0].click();", confirm_btn)
                        confirm_clicked = True
                        print(f"Confirmação clicada via: {confirm_xpath}")
                        break
                    except: pass
                
                if not confirm_clicked:
                    print("[98%] Tentativa final de confirmação por texto direto...")
                    try:
                        # Tenta encontrar qualquer botão que contenha "Confirmar" em maiúsculas ou minúsculas
                        confirm_btns = driver.find_elements(By.XPATH, "//div[@role='button']//span[contains(translate(text(), 'abcdefghijklmnopqrstuvwxyz', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'), 'CONFIRMAR')]")
                        for btn in confirm_btns:
                            if btn.is_displayed():
                                driver.execute_script("arguments[0].click();", btn)
                                confirm_clicked = True
                                print("Confirmação forçada via texto clicada.")
                                break
                    except: pass
        
                if not confirm_clicked:
                    print("[!] Aviso: Botão de confirmar publicação não encontrado. Tentando salvar rascunho como fallback.")
                
                # Tirar um rastro da tela final para verificaÃ§Ã£o visual
                driver.save_screenshot(os.path.join(os.getcwd(), "rastro_final_postagem.png"))
                
                # Verificação final: esperar o retorno à lista de posts e checar se não é rascunho
                time.sleep(10)
                driver.get("https://www.blogger.com/blog/posts/6105085440625695277") # Recarrega a lista
                time.sleep(8)
                
                try:
                    # Verifica se o primeiro item da lista ainda diz "Rascunho" ou "Draft"
                    time.sleep(10)
                    items = driver.find_elements(By.XPATH, "//div[contains(@id, 'manage') or contains(@class, 'blog-post-list')]//div[@role='listitem'] | //div[contains(@class, 'blog-post-list-item')]")
                    if items:
                        first_post = items[0]
                        if "Rascunho" in first_post.text or "Draft" in first_post.text or "Focus" in first_post.text:
                            print("[!] Detectado rascunho ou pendÃªncia. ForÃ§ando PUBLICAÃ‡ÃƒO PELA LISTA...")
                            # Tenta clicar no ícone de publicar (aviãozinho)
                            try:
                                pub_icon = first_post.find_element(By.XPATH, ".//*[contains(@aria-label, 'Publicar') or contains(@aria-label, 'Publish')]")
                                driver.execute_script("arguments[0].click();", pub_icon)
                                time.sleep(3)
                                # Confirmar
                                for path in ["//*[contains(text(), 'CONFIRMAR')]", "//button//span[contains(text(), 'Confirmar')]"]:
                                    try:
                                        btn = driver.find_element(By.XPATH, path)
                                        if btn.is_displayed():
                                            driver.execute_script("arguments[0].click();", btn)
                                            print("PublicaÃ§Ã£o confirmada via lista.")
                                            break
                                    except: pass
                            except:
                                print("Ãcone de publicaÃ§Ã£o direta nÃ£o encontrado.")
                except Exception as e:
                    print(f"[!] Erro na publicaÃ§Ã£o via lista: {e}")
        
                print("[100%] PROCESSO CONCLUÍDO NO BLOGGER.")
                return True
            except Exception as e:
                print(f"\n[!] ERRO NA TENTATIVA {tentativa}: {e}")
                driver.save_screenshot(f"erro_tentativa_{tentativa}.png")
                
                if tentativa < max_tentativas:
                    print("[*] Chamando Cérebro de Manutenção para diagnosticar...")
                    diagnostico = diagnosticar_erro(driver, str(e))
                    
                    if diagnostico.get("acao") == "LOGIN_REQUIRED":
                        realizar_login_google(driver, "blogger")
                    elif diagnostico.get("acao") == "REFRESH":
                        driver.refresh()
                    elif diagnostico.get("acao") == "RETRY_AFTER_WAIT":
                        time.sleep(diagnostico.get("tempo_espera", 10))
                    
                    tentativa += 1
                    time.sleep(5)
                    continue
                else:
                    print("[CRÍTICO] Limite de tentativas atingido. Notificando proprietários...")
                    notificar_falha_critica("Blogger (Nova Jerusalém)", str(e), f"erro_tentativa_{tentativa}.png")
                    return False
                    
        return False
    finally:
        try: driver.quit()
        except: pass

def limpar_conflitos_navegador():
    """ Encerra instâncias do Edge que possam travar o perfil do Selenium """
    print("[*] Garantindo caminho limpo: Verificando se o Edge está aberto...")
    try:
        os.system("taskkill /F /IM msedge.exe /T >nul 2>&1")
        time.sleep(3)
        print("[OK] Conflitos de navegador limpos.")
    except:
        pass

def main():
    limpar_conflitos_navegador()
    print("[10%] Iniciando escaneamento de arquivos...")
    content_info = select_content()
    
    if not content_info:
        print("[!] Nenhum conteúdo novo encontrado para postar hoje.")
        return
        
    print(f"[30%] Livro selecionado: {content_info['book']['title']}")
    print("[50%] Gerando conteúdo atraente com Gemini IA...")
    title, body = generate_article(content_info)
    
    print("[60%] Conteúdo pronto. Iniciando processo de postagem via Selenium...")
    if post_to_blogger(title, body):
        history = load_history()
        history["posted_books"].append(content_info["book"]["title"])
        if content_info["type"] == "ready_md":
            history["posted_files"].append(content_info["file"])
        save_history(history)
        print("------------------------------------------------------")
        print("RESULTADO: SUCESSO NO BLOG!")
        print(f"LIVRO: {content_info['book']['title']}")
        print("------------------------------------------------------")
        
        # ACIONAR SEQUÊNCIA DE PUBLICIDADE AUTOMÁTICA
        print("[FLUXO 2] ACIONANDO ROBÔ DO FACEBOOK (ANÚNCIOS AGRESSIVOS)...")
        try:
            subprocess.Popen(["python", "monitor_blog_pro.py", "--once"], cwd=os.path.dirname(os.path.abspath(__file__)))
            print("[OK] Robô do Facebook iniciado.")
        except Exception as e:
            print(f"[!] Erro no gatilho Facebook: {e}")

        print("[FLUXO 3] ACIONANDO ROBÔ DE E-MAIL MARKETING (VIVOBRUNO26)...")
        try:
            tema_estudo = content_info['book']['title']
            subprocess.Popen(["python", "promo_robot.py", tema_estudo], cwd=os.path.dirname(os.path.abspath(__file__)))
            print("[OK] Robô de E-mail iniciado.")
        except Exception as e:
            print(f"[!] Erro no gatilho E-mail: {e}")
    else:
        print("------------------------------------------------------")
        print("RESULTADO: FALHA NA POSTAGEM")
        print("Verifique os erros acima para diagnosticar.")
        print("------------------------------------------------------")

if __name__ == "__main__":
    main()
