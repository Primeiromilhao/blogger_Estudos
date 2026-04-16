import json
import os

def audit_books():
    books_file = 'books.json'
    cat_file = 'books_categorized.json'
    
    if not os.path.exists(books_file) or not os.path.exists(cat_file):
        print("Files missing")
        return

    with open(books_file, 'r', encoding='utf-8') as f:
        all_books = json.load(f)
        
    with open(cat_file, 'r', encoding='utf-8') as f:
        categorized = json.load(f)

    categorized_titles = set()
    for cat in categorized:
        for book in cat['books']:
            categorized_titles.add(book['title'].lower().strip())

    missing = []
    for book in all_books:
        title = book['title'].lower().strip()
        if title not in categorized_titles:
            missing.append(book)

    if missing:
        print(f"Found {len(missing)} missing books:")
        for b in missing:
            print(f"- {b['title']}")
            # We should add them to an "Other" category or distribute them
            # For now, let's just create a temporary category "Outros Tesouros Proféticos"
            # Actually, let's try to match them:
            
    else:
        print("All books are categorized.")

audit_books()
