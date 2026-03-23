const fetch = require('node-fetch');

async function testProxy() {
    const url = "https://aquamarine-taffy-690347.netlify.app/.netlify/functions/gemini-proxy";
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: "Test message",
                model: "gemini-1.5-flash",
                systemInstruction: "Test"
            })
        });
        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Test Failed:", error);
    }
}

testProxy();
