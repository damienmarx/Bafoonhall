import { GoogleGenAI } from "@google/genai";

// Helper to get the API key and initialize GoogleGenAI
async function getAIInstance() {
  // Use process.env.API_KEY if available (this is what the platform injects after selection)
  // Fallback to process.env.GEMINI_API_KEY (the default key)
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  return new GoogleGenAI({ apiKey });
}

async function callGeminiWithRetry(params: any, maxRetries = 3) {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      const ai = await getAIInstance();
      return await ai.models.generateContent(params);
    } catch (error: any) {
      const errorStr = JSON.stringify(error).toLowerCase();
      const errorMessage = (error.message || "").toLowerCase();
      const isRateLimit = 
        errorMessage.includes("429") || 
        errorMessage.includes("resource_exhausted") ||
        errorStr.includes("429") ||
        errorStr.includes("resource_exhausted") ||
        error.status === "RESOURCE_EXHAUSTED";

      if (isRateLimit) {
        // If we hit a rate limit, we should check if the user has selected a key.
        // If not, we might want to inform them, but for now, we'll just retry with backoff.
        retries++;
        if (retries === maxRetries) {
          // On the last retry, if it's still a 429, we throw a special error
          // that the UI can catch to prompt for an API key.
          throw new Error("RATE_LIMIT_EXCEEDED");
        }
        const delay = Math.pow(2, retries) * 2000 + Math.random() * 1000;
        console.warn(`Rate limited (429). Retry ${retries}/${maxRetries} in ${Math.round(delay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else if (error.message?.includes("Requested entity was not found")) {
        // This error can occur if the API key is invalid or the project is not found.
        // The instructions say to reset the key selection state and prompt for a key.
        throw new Error("API_KEY_INVALID");
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

export async function auditKenoSeed(seed: string) {
  try {
    const response = await callGeminiWithRetry({
      model: "gemini-3-flash-preview",
      contents: `Analyze this Keno RNG seed for cryptographic weaknesses: ${seed}. 
      Provide a JSON response with:
      1. entropy_score (0-100)
      2. vulnerability_type
      3. predicted_numbers (array of 8 numbers between 1-40)
      4. technical_finding
      5. impact_assessment
      6. mitigation_steps`,
      config: { responseMimeType: "application/json" }
    });

    if (!response?.text) throw new Error("Empty response from AI");

    const text = response.text.replace(/```json\n?|```/g, '').trim();
    return JSON.parse(text);
  } catch (e: any) {
    console.error("Keno Audit Error:", e);
    return { error: e.message || "Keno audit failed", raw: e.toString() };
  }
}
