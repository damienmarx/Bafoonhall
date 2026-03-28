import React from 'react';
import { HelpCircle, Info, Shield, Globe, MessageSquare, User, Terminal, Zap } from 'lucide-react';

export function HelpModule() {
  const sections = [
    {
      title: "OVERVIEW",
      icon: <Zap className="w-5 h-5" />,
      description: "The central command center. Provides a high-level summary of critical findings, audit progress across all modules, and real-time system logs.",
      usage: "Use this to quickly identify the most severe vulnerabilities and monitor the overall health of the audit sequence."
    },
    {
      title: "OSINT ANALYSIS",
      icon: <Globe className="w-5 h-5" />,
      description: "Open Source Intelligence gathering. Scans for subdomains, social media footprints, and technology stacks associated with the target domain.",
      usage: "Click 'RUN FULL SCAN' to initiate intelligence gathering. Results can be exported to CSV for external reporting."
    },
    {
      title: "CHAT SECURITY",
      icon: <MessageSquare className="w-5 h-5" />,
      description: "Specialized testing for chat box vulnerabilities. Focuses on Cross-Site Scripting (XSS) and CSS Injection vectors.",
      usage: "Select a test vector or enter a custom payload. The AI engine will analyze the payload's impact and suggest mitigation strategies."
    },
    {
      title: "IDENTITY CORRELATION",
      icon: <User className="w-5 h-5" />,
      description: "Cross-platform identity mapping. Correlates usernames across social networks, forums, and developer platforms to build a comprehensive target profile.",
      usage: "Enter a known username to begin correlation. The summary section highlights primary identities and most active platforms."
    },
    {
      title: "KENO AUDIT",
      icon: <Shield className="w-5 h-5" />,
      description: "Cryptographic RNG auditing. Simulates seed cracking and predictive draw mapping to identify weaknesses in game fairness algorithms.",
      usage: "Monitor the 'PRNG CRACK' simulation to understand how predictable patterns can be exploited in time-seeded generators."
    },
    {
      title: "LIVE WIRE (INTERCEPTOR)",
      icon: <Terminal className="w-5 h-5" />,
      description: "Real-time network traffic analysis. Intercepts WSS (WebSocket) streams by bypassing TLS fingerprinting to monitor live site activity.",
      usage: "Click 'ESTABLISH WIRE' to begin interception. High-value targets (Whales) and suspicious chat activity are automatically flagged."
    }
  ];

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="border-b border-ink pb-4">
        <h2 className="text-2xl font-bold tracking-tight uppercase italic serif flex items-center gap-3">
          <HelpCircle className="w-6 h-6" />
          Audit Suite Documentation
        </h2>
        <p className="text-sm opacity-60 mt-1">Comprehensive guide to the Runehall Security Audit Suite modules and capabilities.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section, i) => (
          <div key={i} className="border border-ink p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4 text-ink">
              {section.icon}
              <h3 className="font-bold uppercase tracking-wider">{section.title}</h3>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] uppercase font-bold opacity-40 mb-1">Purpose</p>
                <p className="text-sm leading-relaxed">{section.description}</p>
              </div>
              <div className="bg-bg/30 p-3 border-l-2 border-ink">
                <p className="text-[10px] uppercase font-bold opacity-40 mb-1">Usage Guide</p>
                <p className="text-xs italic">{section.usage}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="terminal-card mt-12">
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-4 h-4" />
          <span className="text-xs font-bold uppercase">Security Disclaimer</span>
        </div>
        <p className="text-[10px] leading-relaxed opacity-80 font-mono">
          This suite is intended for authorized security auditing purposes only. 
          Unauthorized use against systems without explicit permission is strictly prohibited. 
          All intercepted data is processed in-memory and subject to local confidentiality protocols.
        </p>
      </div>
    </div>
  );
}
