import os
import json
import urllib.request
from datetime import datetime, timezone

AFFILIATE_LINKS = {
    "marine_spirits_diagnosis_and_deliverance": "https://amzn.to/4lv1joR",
    "como_destruir_o_altar_satanico": "https://amzn.to/4s8Uj3B",
    "how_to_break_generational_curses": "https://www.amazon.com.br/Break-Generational-Curses-Henry-Otasowere/dp/147755677X/",
    "a_conta_bancaria_espiritual": "https://amzn.to/4doDVrb",
    "the_airdrops_bible": "https://amzn.to/4ryHSwS",
    "power_of_compounding": "https://www.amazon.com.br/POWER-COMPOUNDING-Exponential-Investment-Strategies/dp/B0BW341975/",
    "a_lei_da_contribui\u00e7\u00e3o": "https://www.amazon.com.br/Lei-Contribui\u00e7\u00e3o-Henry-Otasowere/dp/1451560001/",
    "crypto_staking": "https://www.amazon.com.br/Crypto-Staking-Passive-Income-Another/dp/B0BW23B2NB/",
    "a_lei_do_pensamento": "https://amzn.to/4ltwxwJ",
    "the_millionaires_mindset": "https://www.amazon.com.br/Millionaires-Mindset-Reprogram-Passive-Success/dp/B0BYLSCPVJ/",
    "focus": "https://www.amazon.com.br/Focus-Henry-Otasowere/dp/1070917818/",
    "overcoming_the_spirit_of_self_pity": "https://www.amazon.com.br/Overcoming-spirit-self-pity-Henry-Otasowere/dp/B096TL886T/",
    "segredos_de_um_casamento_feliz": "https://amzn.to/4sPX4qE",
    "rei_trate_sua_mulher_como_uma_rainha": "https://amzn.to/4lFAzlN",
    "como_lidar_com_pessoas_dificeis": "https://amzn.to/3NgaL2Z",
    "receita_do_amor": "https://amzn.to/4720BcY",
    "a_chave_mestre_da_oracao": "https://amzn.to/4urhuYJ",
    "a_vida_e_obras_inegaveis_dos_anjos": "https://amzn.to/4smwpll",
    "sos_numbers_for_god": "https://www.amazon.com.br/sos-Numbers-God-Emergency-numbers/dp/1477454187/",
    "uma_caminhada_com_os_anjos": "https://www.amazon.com.br/Uma-Caminhada-Com-OS-Anjos/dp/1546821759/",
    "o_poder_de_um_altar": "https://amzn.to/4sfRw90",
    "deus_terminar_o_que_ele_comecou": "https://amzn.to/4svuqvj",
    "o_homem_de_fe": "https://amzn.to/4lPajFT",
    "salvacao_um_novo_nascimento": "https://www.amazon.com.br/Salva\u00e7\u00e3o-um-novo-nascimento-Portuguese/dp/1453808833/",
    "danca_comigo": "https://www.amazon.com.br/Dan\u00e7a-Comigo-Portuguese-katy-Cipri/dp/B0FCMMLMQB/"
}

STUDY_LINKS = {
    "marine_spirits_diagnosis_and_deliverance": "",
    "como_destruir_o_altar_satanico": "",
    "how_to_break_generational_curses": "",
    "a_conta_bancaria_espiritual": "",
    "the_airdrops_bible": "",
    "power_of_compounding": "",
    "a_lei_da_contribui\u00e7\u00e3o": "",
    "crypto_staking": "",
    "a_lei_do_pensamento": "",
    "the_millionaires_mindset": "",
    "focus": "",
    "overcoming_the_spirit_of_self_pity": "",
    "segredos_de_um_casamento_feliz": "",
    "rei_trate_sua_mulher_como_uma_rainha": "",
    "como_lidar_com_pessoas_dificeis": "",
    "receita_do_amor": "",
    "a_chave_mestre_da_oracao": "",
    "a_vida_e_obras_inegaveis_dos_anjos": "",
    "sos_numbers_for_god": "",
    "uma_caminhada_com_os_anjos": "",
    "o_poder_de_um_altar": "",
    "deus_terminar_o_que_ele_comecou": "",
    "o_homem_de_fe": "",
    "salvacao_um_novo_nascimento": "",
    "danca_comigo": ""
}

def handler(event, context):
    query = event.get('queryStringParameters') or {}
    book = query.get('book')
    study = query.get('study')

    if not book:
        return {'statusCode': 302, 'headers': {'Location': '/'}}

    is_study = study == '1' and book in STUDY_LINKS
    destination = STUDY_LINKS[book] if is_study else AFFILIATE_LINKS.get(book, '/')
    click_type = 'study' if is_study else 'amazon'

    if destination == '/':
        return {'statusCode': 302, 'headers': {'Location': '/'}}

    headers = event.get('headers') or {}
    ip = headers.get('x-forwarded-for', headers.get('client-ip', ''))
    user_agent = headers.get('user-agent', '')
    timestamp = datetime.now(timezone.utc).isoformat()

    sheets_id = os.environ.get('SHEETS_ID')
    google_token = os.environ.get('GOOGLE_API_TOKEN')
    if sheets_id and google_token:
        try:
            url = f"https://sheets.googleapis.com/v4/spreadsheets/{sheets_id}/values/A1:append?valueInputOption=USER_ENTERED"
            data = {"values": [[timestamp, book, click_type, ip, user_agent]]}
            req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'))
            req.add_header('Authorization', f'Bearer {google_token}')
            req.add_header('Content-Type', 'application/json')
            urllib.request.urlopen(req, timeout=2)
        except:
            pass

    ga_id = os.environ.get('GA_MEASUREMENT_ID')
    ga_secret = os.environ.get('GA_API_SECRET')
    if ga_id and ga_secret:
        try:
            url = f"https://www.google-analytics.com/mp/collect?measurement_id={ga_id}&api_secret={ga_secret}"
            data = {
                "client_id": ip or "unknown",
                "events": [{
                    "name": f"click_{click_type}",
                    "params": {"book": book, "type": click_type}
                }]
            }
            req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'))
            req.add_header('Content-Type', 'application/json')
            urllib.request.urlopen(req, timeout=2)
        except:
            pass

    return {
        'statusCode': 302,
        'headers': {'Location': destination}
    }
