import React, { useState, useEffect } from 'react';
import { Search, Globe, Server, Share2, Mail, ShieldCheck, Loader2, Download, History } from 'lucide-react';
import { performOSINT } from '../lib/gemini';
import { db, auth, useWebSocket, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp } from 'firebase/firestore';

export function OSINTModule() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const { sendMessage } = useWebSocket();

  // Load history from Firestore
  useEffect(() => {
    const q = query(
      collection(db, 'osint_scans'),
      orderBy('timestamp', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHistory(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'osint_scans');
    });

    return () => unsubscribe();
  }, []);

  const runScan = async () => {
    setLoading(true);
    try {
      const results = await performOSINT('runehall.com');
      const scanData = {
        ...results,
        domain: 'runehall.com',
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
          action: 'FULL_SCAN_COMPLETED',
          target: 'runehall.com',
          user: auth.currentUser?.displayName || 'ANONYMOUS_AUDITOR',
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error("Scan failed:", error);
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
          <h2 className="text-xl font-bold tracking-tight uppercase italic serif">OSINT ANALYSIS</h2>
          <p className="text-xs opacity-60">Open Source Intelligence gathering for runehall.com</p>
        </div>
        <div className="flex gap-2">
          {data && (
            <button 
              onClick={handleExport}
              className="bg-bg border border-ink text-ink px-4 py-2 text-sm font-bold flex items-center gap-2 hover:bg-ink hover:text-bg transition-colors"
            >
              <Download className="w-4 h-4" />
              EXPORT CSV
            </button>
          )}
          <button 
            onClick={runScan}
            disabled={loading}
            className="bg-ink text-bg px-4 py-2 text-sm font-bold flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            RUN FULL SCAN
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          {loading && (
            <div className="terminal-card">
              <p className="animate-pulse">Scanning runehall.com infrastructure...</p>
              <p className="text-xs mt-2 opacity-70">Querying DNS records...</p>
              <p className="text-xs opacity-70">Searching for subdomains...</p>
              <p className="text-xs opacity-70">Analyzing social footprints...</p>
            </div>
          )}

          {data && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Infrastructure */}
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
                  {(!data.subdomains || data.subdomains.length === 0) && (
                    <p className="text-xs italic opacity-50 p-4">No subdomains identified in public records.</p>
                  )}
                </div>
              </div>

              {/* Social & Identity */}
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
                  {(!data.social_profiles || data.social_profiles.length === 0) && (
                    <p className="text-xs italic opacity-50">No social profiles found.</p>
                  )}
                </div>
              </div>

              {/* Tech Stack */}
              <div className="border border-ink p-6 bg-white shadow-sm col-span-full">
                <div className="flex items-center gap-2 mb-4">
                  <Globe className="w-5 h-5" />
                  <h3 className="col-header">Technology Fingerprint</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {data.tech_stack?.map((tech: any, i: number) => (
                    <div key={i} className="p-3 border border-bg bg-bg/20">
                      <p className="text-[10px] uppercase opacity-50">{tech.category}</p>
                      <p className="text-sm font-bold">{tech.name}</p>
                    </div>
                  ))}
                  {(!data.tech_stack || data.tech_stack.length === 0) && (
                    <p className="text-xs italic opacity-50 col-span-full">Technology stack analysis inconclusive.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {!data && !loading && (
            <div className="flex flex-col items-center justify-center py-20 opacity-20">
              <Search className="w-16 h-16 mb-4" />
              <p className="font-mono text-sm uppercase tracking-widest">Awaiting scanner initialization</p>
            </div>
          )}
        </div>

        {/* Scan History */}
        <div className="border border-ink p-6 bg-white shadow-sm lg:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-5 h-5" />
            <h3 className="col-header">Recent Scans</h3>
          </div>
          <div className="space-y-3">
            {history.map((scan) => (
              <div 
                key={scan.id} 
                className="p-3 border border-bg bg-bg/10 hover:bg-bg/20 cursor-pointer transition-colors"
                onClick={() => setData(scan)}
              >
                <p className="text-xs font-bold font-mono">{scan.domain}</p>
                <p className="text-[10px] opacity-50 font-mono">
                  {scan.timestamp?.toDate ? scan.timestamp.toDate().toLocaleString() : 'RECENT'}
                </p>
                <div className="flex gap-2 mt-2">
                  <span className="text-[8px] bg-ink/10 px-1 rounded uppercase">{scan.subdomains?.length || 0} SUBS</span>
                  <span className="text-[8px] bg-ink/10 px-1 rounded uppercase">{scan.tech_stack?.length || 0} TECH</span>
                </div>
              </div>
            ))}
            {history.length === 0 && (
              <p className="text-[10px] italic opacity-50 text-center py-10">No scan history available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
