import React, { useState, useEffect } from 'react';
import { Search, Globe, Server, Share2, Mail, ShieldCheck, Loader2, Download, History, AlertTriangle, Key, Zap, User, Activity, Clock, Network } from 'lucide-react';
import { performOSINT, performAdvancedOSINT } from '../lib/gemini';
import { db, auth, useWebSocket, handleFirestoreError, OperationType, useAuth } from '../lib/firebase';
import { collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp } from 'firebase/firestore';

export function OSINTModule() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [target, setTarget] = useState('runehall.com');
  const [targetType, setTargetType] = useState('domain');
  const [mode, setMode] = useState<'STANDARD' | 'ADVANCED'>('STANDARD');
  const { sendMessage } = useWebSocket();
  const { user, isAuthReady } = useAuth();

  // Load history from Firestore
  useEffect(() => {
    if (!isAuthReady || !user) return;

    const q = query(
      collection(db, 'osint_scans'),
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHistory(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'osint_scans');
    });

    return () => unsubscribe();
  }, [isAuthReady, user]);

  const runScan = async () => {
    if (!target) return;
    setLoading(true);
    try {
      let results;
      if (mode === 'ADVANCED') {
        results = await performAdvancedOSINT(target, targetType);
      } else {
        results = await performOSINT(target);
      }

      const scanData = {
        ...results,
        target,
        targetType,
        mode,
        timestamp: new Date().toISOString()
      };
      
      setData(scanData);

      // Persist to Firestore
      await addDoc(collection(db, 'osint_scans'), {
        ...scanData,
        timestamp: serverTimestamp()
      });

      // Broadcast via WebSocket
      sendMessage({
        type: 'AUDIT_ACTIVITY',
        data: {
          module: 'OSINT',
          action: mode === 'ADVANCED' ? 'QUANTUM_FUSION_COMPLETED' : 'STANDARD_SCAN_COMPLETED',
          target,
          user: auth.currentUser?.displayName || 'ANONYMOUS_AUDITOR',
          timestamp: new Date().toISOString()
        }
      });
    } catch (error: any) {
      console.error("Scan failed:", error);
      if (error.message === 'RATE_LIMIT_EXCEEDED' || error.message === 'API_KEY_INVALID') {
        const message = error.message === 'RATE_LIMIT_EXCEEDED' 
          ? "You've hit the free tier rate limit. Please upgrade your API key in the header to continue."
          : "Your selected API key is invalid. Please re-select a valid key in the header.";
        
        setData({
          error: message,
          isQuotaError: true
        });
      } else {
        setData({ error: "Scan failed. Please try again later." });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!data) return;

    const rows = [];
    
    // Add Subdomains
    if (data.subdomains) {
      data.subdomains.forEach((sub: string) => {
        rows.push(['Subdomain', sub, 'Active']);
      });
    }

    // Add Social Profiles
    if (data.social_profiles) {
      data.social_profiles.forEach((profile: any) => {
        rows.push(['Social Profile', profile.platform, profile.handle, profile.url]);
      });
    }

    // Add Tech Stack
    if (data.tech_stack) {
      data.tech_stack.forEach((tech: any) => {
        rows.push(['Technology', tech.category, tech.name]);
      });
    }

    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Type", "Name/Platform", "Detail/Handle", "URL"].join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `runehall_osint_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-ink pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight uppercase italic serif">OSINT FUSION FRAMEWORK</h2>
          <p className="text-xs opacity-60">Multi-dimensional intelligence gathering and correlation</p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-bg border border-ink p-1">
            <button 
              onClick={() => setMode('STANDARD')}
              className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest transition-colors ${mode === 'STANDARD' ? 'bg-ink text-bg' : 'text-ink hover:bg-ink/10'}`}
            >
              Standard
            </button>
            <button 
              onClick={() => setMode('ADVANCED')}
              className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest transition-colors ${mode === 'ADVANCED' ? 'bg-purple-600 text-white' : 'text-ink hover:bg-purple-600/10'}`}
            >
              Advanced Fusion
            </button>
          </div>
          {data && (
            <button 
              onClick={handleExport}
              className="bg-bg border border-ink text-ink px-4 py-2 text-sm font-bold flex items-center gap-2 hover:bg-ink hover:text-bg transition-colors"
            >
              <Download className="w-4 h-4" />
              EXPORT
            </button>
          )}
        </div>
      </div>

      {/* Target Input Section */}
      <div className="border border-ink p-6 bg-white shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="col-header mb-2 block">Target Indicator</label>
            <div className="flex gap-2">
              <select 
                value={targetType}
                onChange={(e) => setTargetType(e.target.value)}
                className="border border-ink p-2 text-xs font-bold bg-bg/20 focus:outline-none"
              >
                <option value="domain">Domain</option>
                <option value="username">Username</option>
                <option value="email">Email</option>
                <option value="ip">IP Address</option>
              </select>
              <input 
                type="text" 
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder={`Enter ${targetType}...`}
                className="flex-1 border border-ink p-2 text-sm font-mono bg-bg/20 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex items-end">
            <button 
              onClick={runScan}
              disabled={loading || !target}
              className={`w-full md:w-auto px-8 py-2 text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all ${mode === 'ADVANCED' ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.3)]' : 'bg-ink text-bg'}`}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === 'ADVANCED' ? <Zap className="w-4 h-4" /> : <Search className="w-4 h-4" />}
              {mode === 'ADVANCED' ? 'INITIALIZE FUSION' : 'RUN SCAN'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          {loading && (
            <div className={`terminal-card ${mode === 'ADVANCED' ? 'border-purple-600/50' : ''}`}>
              <p className="animate-pulse">{mode === 'ADVANCED' ? 'INITIALIZING QUANTUM ENTANGLEMENT SCAN...' : `Scanning ${target} infrastructure...`}</p>
              <p className="text-xs mt-2 opacity-70">Mapping digital footprint across temporal dimensions...</p>
              <p className="text-xs opacity-70">Correlating identifiers across multi-platform nodes...</p>
              <p className="text-xs opacity-70">Analyzing psychographic behavioral patterns...</p>
            </div>
          )}

          {data && (
            data.error ? (
              <div className={`p-6 border-l-4 ${data.isQuotaError ? 'bg-yellow-50 border-yellow-600' : 'bg-red-50 border-red-600'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className={`w-5 h-5 ${data.isQuotaError ? 'text-yellow-600' : 'text-red-600'}`} />
                  <p className="font-bold text-sm uppercase">{data.isQuotaError ? 'Quota Exceeded' : 'Scan Error'}</p>
                </div>
                <p className="text-xs opacity-80 leading-relaxed mb-4">{data.error}</p>
                {data.isQuotaError && (
                  <button 
                    onClick={() => window.aistudio?.openSelectKey?.()}
                    className="max-w-xs bg-ink text-bg px-6 py-2 text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  >
                    <Key className="w-3 h-3" />
                    Upgrade API Key
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in duration-700">
                {mode === 'ADVANCED' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Psychographic Profile */}
                    <div className="border border-purple-600/30 p-6 bg-white shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-2 opacity-10"><Activity className="w-12 h-12 text-purple-600" /></div>
                      <div className="flex items-center gap-2 mb-4">
                        <User className="w-5 h-5 text-purple-600" />
                        <h3 className="col-header text-purple-600">Psychographic Profile</h3>
                      </div>
                      <p className="text-xs leading-relaxed opacity-80 italic">{data.psychographic_profile}</p>
                    </div>

                    {/* Quantum Correlations */}
                    <div className="border border-purple-600/30 p-6 bg-white shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <Network className="w-5 h-5 text-purple-600" />
                        <h3 className="col-header text-purple-600">Cross-Platform Correlations</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {data.correlations?.map((c: string, i: number) => (
                          <span key={i} className="px-2 py-1 bg-purple-600/10 text-purple-700 text-[10px] font-bold border border-purple-600/20 rounded uppercase">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Temporal Footprint */}
                    <div className="border border-purple-600/30 p-6 bg-white shadow-sm md:col-span-2">
                      <div className="flex items-center gap-2 mb-4">
                        <Clock className="w-5 h-5 text-purple-600" />
                        <h3 className="col-header text-purple-600">Temporal Activity Footprint</h3>
                      </div>
                      <p className="text-xs opacity-80 font-mono bg-bg/10 p-4 border border-bg">{data.temporal_footprint}</p>
                    </div>

                    {/* Actionable Intelligence */}
                    <div className="border border-purple-600/30 p-6 bg-white shadow-sm md:col-span-2">
                      <div className="flex items-center gap-2 mb-4">
                        <Zap className="w-5 h-5 text-purple-600" />
                        <h3 className="col-header text-purple-600">Actionable Intelligence Findings</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {data.findings?.map((f: string, i: number) => (
                          <div key={i} className="p-3 border-l-4 border-purple-600 bg-purple-50 text-xs">
                            {f}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Standard Infrastructure */}
                    <div className="border border-ink p-6 bg-white shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <Server className="w-5 h-5" />
                        <h3 className="col-header">Infrastructure & Subdomains</h3>
                      </div>
                      <div className="space-y-2">
                        {data.subdomains?.map((sub: string, i: number) => (
                          <div key={i} className="data-row">
                            <span className="text-[10px] opacity-50">{String(i + 1).padStart(2, '0')}</span>
                            <span className="data-value text-sm">{sub}</span>
                            <span className="text-[10px] uppercase opacity-50">Active</span>
                            <ShieldCheck className="w-3 h-3 text-green-600 justify-self-end" />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Standard Social */}
                    <div className="border border-ink p-6 bg-white shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <Share2 className="w-5 h-5" />
                        <h3 className="col-header">Social Presence</h3>
                      </div>
                      <div className="space-y-4">
                        {data.social_profiles?.map((profile: any, i: number) => (
                          <div key={i} className="flex justify-between items-center border-b border-bg pb-2">
                            <div>
                              <p className="text-sm font-bold">{profile.platform}</p>
                              <p className="text-xs opacity-60">{profile.handle}</p>
                            </div>
                            <a href={profile.url} target="_blank" className="text-[10px] underline uppercase">View</a>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          )}

          {!data && !loading && (
            <div className="flex flex-col items-center justify-center py-20 opacity-20">
              <Activity className="w-24 h-24 mb-4" />
              <p className="font-mono text-sm uppercase tracking-widest">Awaiting fusion parameters</p>
            </div>
          )}
        </div>

        {/* Scan History */}
        <div className="border border-ink p-6 bg-white shadow-sm lg:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-5 h-5" />
            <h3 className="col-header">Audit Logs</h3>
          </div>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {history.map((scan) => (
              <div 
                key={scan.id} 
                className={`p-3 border border-bg bg-bg/10 hover:bg-bg/20 cursor-pointer transition-colors relative overflow-hidden ${scan.mode === 'ADVANCED' ? 'border-l-4 border-l-purple-600' : ''}`}
                onClick={() => {
                  setData(scan);
                  setMode(scan.mode || 'STANDARD');
                  setTarget(scan.target || scan.domain);
                }}
              >
                <div className="flex justify-between items-start mb-1">
                  <p className="text-xs font-bold font-mono truncate max-w-[120px]">{scan.target || scan.domain}</p>
                  <span className={`text-[8px] px-1 rounded uppercase font-bold ${scan.mode === 'ADVANCED' ? 'bg-purple-600 text-white' : 'bg-ink/10'}`}>
                    {scan.mode || 'STD'}
                  </span>
                </div>
                <p className="text-[10px] opacity-50 font-mono">
                  {scan.timestamp?.toDate ? scan.timestamp.toDate().toLocaleString() : 'RECENT'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
