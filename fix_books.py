"""
Fix broken book entries in books_categorized.json and books.json.
- Updates affiliate_link to verified live Amazon Brazil URLs
- Updates cover URLs to current m.media-amazon.com URLs
- Preserves the renatabrasi0d-20 affiliate tag where present
- Removes 'Precisa de ajuda?' which is no longer available on Amazon
"""
import json
import os

AFFILIATE_TAG = "renatabrasi0d-20"

# Verified replacements: title -> (new_asin, new_cover_url)
FIXES = {
    "Saia Do Canto Da Vida":                       ("1500158232", "https://m.media-amazon.com/images/I/41OULV9Pt0L._SY445_SX342_ML2_.jpg"),
    "Força para continuar quando há atraso":       ("150032003X", "https://m.media-amazon.com/images/I/41cmkkXXsyL._SY445_SX342_ML2_.jpg"),
    "Como sair da aflição":                        ("1500328332", "https://m.media-amazon.com/images/I/41AR8ZmsCsL._SY445_SX342_ML2_.jpg"),
    "Quando tudo parece impossível":               ("1500415979", "https://m.media-amazon.com/images/I/41Pr6ZuIkAL._SY445_SX342_ML2_.jpg"),
    "Praise your way to Breakthrough":             ("1522827684", "https://m.media-amazon.com/images/I/41+5+BOt9+L._SY445_SX342_ML2_.jpg"),
    "Prosperidade Total Na Vida":                  ("1500134570", "https://m.media-amazon.com/images/I/41U-BAHzl2L._SY445_SX342_ML2_.jpg"),
    "Fortalecidos pelo sangue de Jesus":           ("1500410322", "https://m.media-amazon.com/images/I/41dQpQuggmL._SY445_SX342_ML2_.jpg"),
    "A boca a porta para o sucesso ou fracasso":   ("1502743663", "https://m.media-amazon.com/images/I/415wtWf+CoL._SY445_SX342_ML2_.jpg"),
    "Segura aquilo que você tem":                  ("1500210927", "https://m.media-amazon.com/images/I/412tn4cRjhL._SY445_SX342_ML2_.jpg"),
    "Praise your gateway to Breakthrough":         ("1522946675", "https://m.media-amazon.com/images/I/41uhUSKvlnL._SY445_SX342_ML2_.jpg"),
    "Como eliminar o volume da vida":              ("1500148849", "https://m.media-amazon.com/images/I/51KAk9Us1VL._SY445_SX342_ML2_.jpg"),
    "Quem influencia os seus pensamentos":         ("1502559692", "https://m.media-amazon.com/images/I/41PDlE6k5XL._SY445_SX342_ML2_.jpg"),
    "Dissipador Da Vergonha":                      ("1500318574", "https://m.media-amazon.com/images/I/41x7tDKMPHL._SY445_SX342_ML2_.jpg"),
    "O poder do testemunho":                       ("1502791137", "https://m.media-amazon.com/images/I/41jkzoCCqlL._SY445_SX342_ML2_.jpg"),
    "A Lei Que Regula a Abundancia":               ("1500345822", "https://m.media-amazon.com/images/I/418dOjzbeEL._SY445_SX342_ML2_.jpg"),
    "God is still working on me":                  ("1072458098", "https://m.media-amazon.com/images/I/51a3NzpOZaL._SY445_SX342_ML2_.jpg"),
    "Perseguir, ultrapassar e recuperar tudo":     ("1523893621", "https://m.media-amazon.com/images/I/41eWx9tRMQL._SY445_SX342_ML2_.jpg"),
    "crowned and not cast out":                    ("144996446X", "https://m.media-amazon.com/images/I/41cWY-wlFaL._SY445_SX342_ML2_.jpg"),
    "O que é ser patrocinador?":                   ("1545520623", "https://m.media-amazon.com/images/I/41Pyh3LiriL._SY445_SX342_ML2_.jpg"),
    "Superando o medo do Fracasso":                ("150026539X", "https://m.media-amazon.com/images/I/41rAQVloz1L._SY445_SX342_ML2_.jpg"),
    "VOCE É O Produto Dos Seus Pensamentos":       ("1500264938", "https://m.media-amazon.com/images/I/41ljHIvfxiL._SY445_SX342_ML2_.jpg"),
}

# Books to remove entirely (no longer available on Amazon)
REMOVE_TITLES = {"Precisa de ajuda?"}


def fix_book(book):
    title = book.get("title", "").strip()
    if title in FIXES:
        asin, cover = FIXES[title]
        book["affiliate_link"] = f"https://www.amazon.com.br/dp/{asin}/?tag={AFFILIATE_TAG}"
        book["cover"] = cover
        return True
    return False


def main():
    base = os.path.dirname(__file__)

    # ── books_categorized.json ──
    cat_path = os.path.join(base, "books_categorized.json")
    with open(cat_path, "r", encoding="utf-8") as f:
        cats = json.load(f)

    fixed = 0
    removed = 0
    for cat in cats:
        new_books = []
        for b in cat.get("books", []):
            if b.get("title", "").strip() in REMOVE_TITLES:
                removed += 1
                continue
            if fix_book(b):
                fixed += 1
            new_books.append(b)
        cat["books"] = new_books

    with open(cat_path, "w", encoding="utf-8") as f:
        json.dump(cats, f, ensure_ascii=False, indent=2)
    print(f"books_categorized.json: fixed {fixed} books, removed {removed} books")

    # ── books.json ──
    books_path = os.path.join(base, "books.json")
    with open(books_path, "r", encoding="utf-8") as f:
        books = json.load(f)

    fixed2 = 0
    removed2 = 0
    new_books = []
    for b in books:
        if b.get("title", "").strip() in REMOVE_TITLES:
            removed2 += 1
            continue
        if fix_book(b):
            fixed2 += 1
        new_books.append(b)

    with open(books_path, "w", encoding="utf-8") as f:
        json.dump(new_books, f, ensure_ascii=False, indent=2)
    print(f"books.json: fixed {fixed2} books, removed {removed2} books")


if __name__ == "__main__":
    main()
