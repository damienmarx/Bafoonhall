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
        retries++;
        if (retries === maxRetries) {
          // On the last retry, if it's still a 429, we throw a special error
          throw new Error("RATE_LIMIT_EXCEEDED");
        }
        // Exponential backoff with jitter
        const delay = Math.pow(2, retries) * 3000 + Math.random() * 1000;
        console.warn(`Rate limited (429). Retry ${retries}/${maxRetries} in ${Math.round(delay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else if (errorMessage.includes("requested entity was not found") || errorMessage.includes("api_key_invalid")) {
        throw new Error("API_KEY_INVALID");
      } else {
        throw error;
      }
    }
  }
  throw new Error("Max retries exceeded");
}

export async function performAdvancedOSINT(target: string, type: string) {
  try {
    const response = await callGeminiWithRetry({
      model: "gemini-3.1-pro-preview",
      contents: `
        NIGHTFURY TRINITY PROTOCOL: QUANTUM ENTANGLEMENT SCAN
        OPERATION: OSINT FUSION
        TARGET: ${target} (${type})
        
        Perform a multi-dimensional intelligence fusion. 
        1. Analyze behavioral patterns and psychological triggers.
        2. Correlate identifiers across platforms (Gaming, Social, Code Repos).
        3. Identify hidden connections and abstract relationships.
        4. Map the digital footprint across 5 temporal dimensions (past activity to future probability).
        
        Return a structured JSON response:
        {
          "psychographic_profile": "Detailed behavioral analysis",
          "correlations": ["List of connected accounts/platforms"],
          "hidden_nodes": ["Abstract connections found"],
          "risk_assessment": "Quantum probability of threat (0-100)",
          "temporal_footprint": "Analysis of activity over time",
          "findings": ["Specific actionable intelligence points"]
        }
      `,
      config: {
        responseMimeType: "application/json",
      },
    });

    if (!response?.text) throw new Error("Empty response from AI");
    const text = response.text.replace(/```json\n?|```/g, '').trim();
    return JSON.parse(text);
  } catch (e: any) {
    console.error("Advanced OSINT Error:", e);
    return { error: e.message || "Advanced OSINT failed", raw: e.toString() };
  }
}

export async function analyzeAdvancedEvasion(payload: string) {
  try {
    const response = await callGeminiWithRetry({
      model: "gemini-3.1-pro-preview",
      contents: `
        SECURITY AUDIT: ADVANCED EVASION DETECTION
        ANALYZE PAYLOAD: ${payload}
        
        Check for the following advanced techniques:
        1. Polymorphic/Metamorphic code structures.
        2. Anti-Debugging (IsDebuggerPresent, timing checks).
        3. Anti-VM/Anti-Sandbox (Artifact detection, registry checks).
        4. Process Injection (DLL injection, Process Hollowing).
        5. Covert Communication (DNS/ICMP Tunneling, Steganography).
        
        Return a structured JSON response:
        {
          "evasion_score": 0-100,
          "techniques_detected": ["List of techniques"],
          "stealth_rating": "Low/Medium/High/Extreme",
          "analysis_details": "Detailed technical breakdown",
          "mitigation": "How to detect and block this specific evasion"
        }
      `,
      config: {
        responseMimeType: "application/json",
      },
    });

    if (!response?.text) throw new Error("Empty response from AI");
    const text = response.text.replace(/```json\n?|```/g, '').trim();
    return JSON.parse(text);
  } catch (e: any) {
    console.error("Evasion Analysis Error:", e);
    return { error: e.message || "Evasion analysis failed", raw: e.toString() };
  }
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

export async function getThreatIntelligence(query: string) {
  try {
    const response = await callGeminiWithRetry({
      model: "gemini-3-flash-preview",
      contents: `Perform a real-time threat intelligence lookup for: "${query}". 
      Search for:
      1. Known malicious activity (botnets, phishing, malware distribution).
      2. Blacklist status (Spamhaus, AlienVault, VirusTotal mentions).
      3. Associated threat actors or campaigns.
      4. Risk score (0-100).
      
      Return a JSON object with:
      - risk_score: number
      - status: "MALICIOUS" | "SUSPICIOUS" | "CLEAN" | "UNKNOWN"
      - findings: string[]
      - campaigns: string[]
      - technical_details: string
      - last_seen: string`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
      },
    });

    if (!response?.text) throw new Error("Empty response from AI");

    const text = response.text.replace(/```json\n?|```/g, '').trim();
    return JSON.parse(text);
  } catch (e: any) {
    console.error("Threat Intel Error:", e);
    return { error: e.message || "Threat lookup failed", raw: e.toString() };
  }
}

export async function getLatestThreatFeed() {
  try {
    const response = await callGeminiWithRetry({
      model: "gemini-3-flash-preview",
      contents: `Fetch the latest 5-10 known malicious IPs or domains currently active in the wild (e.g., from recent security advisories, threat feeds, or news).
      For each item, provide:
      1. Indicator (IP or Domain).
      2. Type (Malware, Phishing, Botnet).
      3. Description of the threat.
      4. Severity (High, Critical).
      
      Return a JSON array of objects.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
      },
    });

    if (!response?.text) throw new Error("Empty response from AI");

    const text = response.text.replace(/```json\n?|```/g, '').trim();
    return JSON.parse(text);
  } catch (e: any) {
    console.error("Threat Feed Error:", e);
    return { error: e.message || "Failed to fetch threat feed", raw: e.toString() };
  }
}
