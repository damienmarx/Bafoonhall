import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function performOSINT(domain: string) {
  const response = await ai.models.generateContent({
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

  try {
    const text = response.text.replace(/```json\n?|```/g, '').trim();
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse OSINT results:", e);
    return { error: "Failed to parse results", raw: response.text };
  }
}

export async function analyzeVulnerability(payload: string, context: string) {
  const response = await ai.models.generateContent({
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

  try {
    const text = response.text.replace(/```json\n?|```/g, '').trim();
    return JSON.parse(text);
  } catch (e) {
    return { error: "Analysis failed", raw: response.text };
  }
}

export async function correlateUsernames(username: string) {
  const response = await ai.models.generateContent({
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

  try {
    const text = response.text.replace(/```json\n?|```/g, '').trim();
    return JSON.parse(text);
  } catch (e) {
    return { error: "Correlation failed", raw: response.text };
  }
}
