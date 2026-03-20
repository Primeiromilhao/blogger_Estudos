/**
 * social-ai.js
 * Browser-based Gemini AI Social Media Generator - REFINED FOR MIND MAPS
 */

import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";

const API_KEY = "AIzaSyDouYjeRyr4FA8A1ITwe4pmEqcqeSsr-wE"; // Provided by user
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function generateSocialContent(prompt, platform) {
    const platformPrompts = {
        facebook: "Gere um post para Facebook/WhatsApp. Use um tom engajador, inclua emojis e uma chamada para ação (CTA).",
        instagram: "Gere uma legenda para Instagram. Focada em estética, use hashtags relevantes e um tom inspirador.",
        tiktok: "Gere um roteiro curto ou legenda para TikTok. Use ganchos (hooks) rápidos e hashtags virais."
    };

    const fullPrompt = `
        Você é um especialista em redes sociais cristão.
        Objetivo: Criar um conteúdo para ${platform.toUpperCase()}.
        ${platformPrompts[platform]}
        
        Sempre baseie o conteúdo em:
        1. Um LIVRO relacionado ao tema (pense em títulos de Henry Otasowere ou clássicos cristãos).
        2. PASSAGENS BÍBLICAS relevantes.
        3. Uma PRÁTICA para o dia a dia.
        
        Tema/Contexto: ${prompt}
        
        Retorne um objeto JSON com esta estrutura EXATA:
        {
            "bookTitle": "Título do Livro Base",
            "caption": "A legenda completa incluindo passagens bíblicas",
            "practice": "Uma ação prática para o leitor aplicar hoje",
            "hashtags": ["tag1", "tag2"],
            "mapData": {
                "center": "TEMA CENTRAL EM CAIXA ALTA",
                "categories": [
                    {
                        "label": "CATEGORIA 1 (ex: CURA, FÉ, PROVISÃO)",
                        "items": ["Ponto 1", "Ponto 2"]
                    },
                    {
                        "label": "CATEGORIA 2 (ex: ORAÇÃO, AÇÃO, PROMESSA)",
                        "items": ["Ponto 1", "Ponto 2"]
                    }
                ]
            }
        }
        Responda APENAS o JSON.
    `;

    try {
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const text = response.text();
        
        // Extract JSON
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}') + 1;
        return JSON.parse(text.substring(start, end));
    } catch (error) {
        console.error("Erro na geração IA:", error);
        throw error;
    }
}
