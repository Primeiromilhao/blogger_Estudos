import os
import json
import glob
import sys
import google.generativeai as genai

def run_tests():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("Required environment variable GEMINI_API_KEY is not set.")
        sys.exit(1)

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-1.5-pro')

    faq_files = glob.glob('chatbot/faq_*.json')
    if not faq_files:
        print("No faq_*.json files found in the chatbot/ directory.")
        return

    for file_path in faq_files:
        print(f"\n--- Testing {file_path} ---")
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                faqs = json.load(f)
            
            for item in faqs:
                question = item.get("question", "")
                expected_answer = item.get("answer", "")
                
                if not question or not expected_answer:
                    continue
                
                # We can inject some context, but as requested: "you can just send the question"
                response = model.generate_content(question)
                actual_answer = response.text
                
                expected_prefix = expected_answer[:30].strip()
                
                if expected_prefix in actual_answer:
                    print(f"[PASS] {question}")
                else:
                    print(f"[FAIL] {question}")
        except Exception as e:
            print(f"Error testing {file_path}: {e}")

if __name__ == "__main__":
    run_tests()
