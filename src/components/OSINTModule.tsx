import React, { useState, useEffect } from 'react';
import { Search, Globe, Server, Share2, Mail, ShieldCheck, Loader2 } from 'lucide-react';
import { performOSINT } from '../lib/gemini';

export function OSINTModule() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  const runScan = async () => {
    setLoading(true);
    const results = await performOSINT('runehall.com');
    setData(results);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-ink pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">OSINT ANALYSIS</h2>
          <p className="text-xs opacity-60">Open Source Intelligence gathering for runehall.com</p>
        </div>
        <button 
          onClick={runScan}
          disabled={loading}
          className="bg-ink text-bg px-4 py-2 text-sm font-bold flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          RUN FULL SCAN
        </button>
      </div>

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
  );
}
