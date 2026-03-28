import React, { useState } from 'react';
import { User, Search, Link, Activity, Loader2, ExternalLink, ShieldCheck } from 'lucide-react';
import { correlateUsernames } from '../lib/gemini';

export function IdentityModule() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [username, setUsername] = useState('');

  const runCorrelation = async () => {
    setLoading(true);
    const results = await correlateUsernames(username);
    setData(results);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-ink pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight uppercase italic serif">IDENTITY CORRELATION</h2>
          <p className="text-xs opacity-60">Cross-platform username analysis for runehall.com connections</p>
        </div>
        <User className="w-8 h-8 text-ink" />
      </div>

      <div className="flex gap-4 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
          <input 
            type="text" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter target username..."
            className="w-full border border-ink p-3 pl-10 text-sm font-mono bg-white focus:outline-none shadow-sm"
          />
        </div>
        <button 
          onClick={runCorrelation}
          disabled={loading || !username}
          className="bg-ink text-bg px-6 py-3 text-sm font-bold hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link className="w-4 h-4" />}
          CORRELATE
        </button>
      </div>

      {loading && (
        <div className="terminal-card">
          <p className="animate-pulse">Searching for "{username}" across platforms...</p>
          <p className="text-xs mt-2 opacity-70">Querying GitHub, Twitter, LinkedIn...</p>
          <p className="text-xs opacity-70">Checking forum databases...</p>
          <p className="text-xs opacity-70">Analyzing alias connections...</p>
        </div>
      )}

      {data && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Identity Summary Section */}
          <div className="border border-ink p-6 bg-ink text-bg shadow-sm col-span-full">
            <div className="flex items-center gap-2 mb-4 border-b border-bg/20 pb-2">
              <ShieldCheck className="w-5 h-5 text-green-400" />
              <h3 className="col-header text-bg">Identity Summary</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <p className="text-[10px] uppercase opacity-50 mb-1 font-mono">Primary Name</p>
                <p className="text-lg font-bold italic serif">
                  {data.identity_links?.find((l: any) => l.type.toLowerCase().includes('name'))?.value || 'Unknown'}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase opacity-50 mb-1 font-mono">Primary Email</p>
                <p className="text-sm font-mono">
                  {data.identity_links?.find((l: any) => l.type.toLowerCase().includes('email'))?.value || 'Not Found'}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase opacity-50 mb-1 font-mono">Active Platforms</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {data.platforms?.filter((p: any) => p.status?.toLowerCase() === 'active' || !p.status)
                    .slice(0, 3)
                    .map((p: any, i: number) => (
                      <span key={i} className="text-[10px] bg-bg/10 border border-bg/20 px-2 py-1 uppercase font-mono">
                        {p.name}
                      </span>
                    )) || <span className="text-[10px] opacity-50 italic">None identified</span>
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Platform Presence */}
          <div className="border border-ink p-6 bg-white shadow-sm md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5" />
              <h3 className="col-header">Platform Presence</h3>
            </div>
            <div className="space-y-4">
              {data.platforms?.map((platform: any, i: number) => (
                <div key={i} className="flex justify-between items-center border-b border-bg pb-3">
                  <div>
                    <p className="text-sm font-bold">{platform.name}</p>
                    <p className="text-xs opacity-60">{platform.status || 'Active'}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] uppercase font-mono opacity-50">Score: {platform.relevance || 'High'}</span>
                    <a href={platform.url} target="_blank" className="text-ink hover:opacity-50">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Identity Links */}
          <div className="border border-ink p-6 bg-white shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-5 h-5" />
              <h3 className="col-header">Identity Links</h3>
            </div>
            <div className="space-y-4">
              {data.identity_links?.map((link: any, i: number) => (
                <div key={i} className="p-3 bg-bg/20 border border-bg">
                  <p className="text-[10px] uppercase opacity-50">{link.type}</p>
                  <p className="text-xs font-bold">{link.value}</p>
                  <p className="text-[10px] mt-1 italic opacity-60">Confidence: {link.confidence}%</p>
                </div>
              ))}
            </div>
          </div>

          {/* Analysis Summary */}
          <div className="border border-ink p-6 bg-white shadow-sm col-span-full">
            <h3 className="col-header mb-4">Correlation Analysis</h3>
            <p className="text-xs leading-relaxed opacity-80 font-mono">
              {data.analysis_summary || 'No detailed analysis summary available.'}
            </p>
          </div>
        </div>
      )}

      {!data && !loading && (
        <div className="flex flex-col items-center justify-center py-20 opacity-20">
          <User className="w-16 h-16 mb-4" />
          <p className="font-mono text-sm uppercase tracking-widest">Enter a username to begin correlation</p>
        </div>
      )}
    </div>
  );
}
