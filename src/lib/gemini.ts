import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function callGeminiWithRetry(params: any, maxRetries = 3) {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      return await ai.models.generateContent(params);
    } catch (error: any) {
      const isRateLimit = 
        error.message?.includes("429") || 
        error.status === "RESOURCE_EXHAUSTED" ||
        JSON.stringify(error).includes("429");

      if (isRateLimit) {
        retries++;
        if (retries === maxRetries) throw error;
        const delay = Math.pow(2, retries) * 2000 + Math.random() * 1000;
        console.warn(`Rate limited (429). Retry ${retries}/${maxRetries} in ${Math.round(delay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
  throw new Error("Max retries exceeded");
}

export async function performOSINT(domain: string) {
  try {
    const response = await callGeminiWithRetry({
      model: "gemini-3-flash-preview",
      contents: `Perform a comprehensive OSINT analysis on the domain: ${domain}. 
      Focus on:
      1. Subdomains and Infrastructure.
      2. Social media presence and associated usernames.
      3. Technology stack (CMS, servers, frameworks).
      4. Publicly available contact information or emails.
      5. Recent security-related mentions or breaches.
      
      Return the results in a structured JSON format suitable for a dashboard.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
      },
    });

    if (!response?.text) throw new Error("Empty response from AI");

    const text = response.text.replace(/```json\n?|```/g, '').trim();
    return JSON.parse(text);
  } catch (e: any) {
    console.error("OSINT Error:", e);
    return { error: e.message || "Failed to perform OSINT", raw: e.toString() };
  }
}

export async function analyzeVulnerability(payload: string, context: string) {
  try {
    const response = await callGeminiWithRetry({
      model: "gemini-3-flash-preview",
      contents: `Analyze the following security test vector for potential impact on a chat box:
      Payload: ${payload}
      Context: ${context}
      
      Provide:
      1. Vulnerability Type (XSS, CSS Injection, etc.).
      2. Severity (Low, Medium, High, Critical).
      3. Potential Impact.
      4. Mitigation Strategy.`,
      config: {
        responseMimeType: "application/json",
      },
    });

    if (!response?.text) throw new Error("Empty response from AI");

    const text = response.text.replace(/```json\n?|```/g, '').trim();
    return JSON.parse(text);
  } catch (e: any) {
    console.error("Vulnerability Analysis Error:", e);
    return { error: e.message || "Analysis failed", raw: e.toString() };
  }
}

export async function correlateUsernames(username: string) {
  try {
    const response = await callGeminiWithRetry({
      model: "gemini-3-flash-preview",
      contents: `Find connections and cross-correlate the username "${username}" across various platforms (GitHub, Twitter, LinkedIn, Forums, etc.) related to runehall.com. 
      Identify:
      1. Platform presence.
      2. Associated aliases.
      3. Potential real-world identity links.
      4. Activity patterns.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
      },
    });

    if (!response?.text) throw new Error("Empty response from AI");

    const text = response.text.replace(/```json\n?|```/g, '').trim();
    return JSON.parse(text);
  } catch (e: any) {
    console.error("Correlation Error:", e);
    return { error: e.message || "Correlation failed", raw: e.toString() };
  }
}
