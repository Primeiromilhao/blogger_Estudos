import requests
import json
import os

# Configurações do Ollama
OLLAMA_URL = "http://localhost:11434/api/generate"
DEFAULT_MODEL = "llama3.2"

def processar_pedido(prompt, model=DEFAULT_MODEL):
    """
    Processa um pedido via Ollama local.
    Pode ser expandido para suportar Groq ou Gemini no futuro.
    """
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.7,
            "top_p": 0.9
        }
    }
    
    print(f"[*] Chamando Ollama ({model})...")
    
    try:
        response = requests.post(OLLAMA_URL, json=payload, timeout=60)
        response.raise_for_status()
        data = response.json()
        
        return {
            "resposta": data.get("response", ""),
            "provedor": "Ollama",
            "modelo": model
        }
    except Exception as e:
        print(f"[!] Erro ao chamar Ollama: {e}")
        return {
            "resposta": f"Erro técnico: {str(e)}",
            "provedor": "Erro",
            "modelo": model
        }

if __name__ == "__main__":
    # Teste rápido
    teste = processar_pedido("Olá, quem és tu?")
    print(json.dumps(teste, indent=2))
