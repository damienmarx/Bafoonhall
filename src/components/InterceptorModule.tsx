import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Activity, Wifi, WifiOff, Search, Eye, AlertCircle } from 'lucide-react';

interface LogEntry {
  id: string;
  type: 'BET' | 'CHAT' | 'SYSTEM';
  user: string;
  content: string;
  time: string;
}

export function InterceptorModule() {
  const [isActive, setIsActive] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const toggleActive = () => {
    setIsActive(!isActive);
    if (!isActive) {
      setLogs([{
        id: 'init',
        type: 'SYSTEM',
        user: 'NIGHTFURY',
        content: 'Bypassing TLS fingerprinting... Socket wiretap established.',
        time: new Date().toLocaleTimeString()
      }]);
    }
  };

  useEffect(() => {
    if (!isActive) return;

    const users = ['MrGetDough', 'pigeon12', 'southern_G', 'labdiendeels', 'Mini_Soda'];
    const actions = [
      { type: 'BET' as const, content: (u: string) => `Placed bet: ${Math.floor(Math.random() * 500)}M GP on Keno` },
      { type: 'CHAT' as const, content: (u: string) => `Mentioned external comms: discord.gg/${Math.random().toString(36).substring(7)}` },
      { type: 'BET' as const, content: (u: string) => `Won ${Math.floor(Math.random() * 1000)}M GP on Kraken's Hunger` }
    ];

    const interval = setInterval(() => {
      const user = users[Math.floor(Math.random() * users.length)];
      const action = actions[Math.floor(Math.random() * actions.length)];
      
      setLogs(prev => [
        {
          id: Math.random().toString(),
          type: action.type,
          user,
          content: action.content(user),
          time: new Date().toLocaleTimeString()
        },
        ...prev.slice(0, 49)
      ]);
    }, 2000);

    return () => clearInterval(interval);
  }, [isActive]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-ink pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight uppercase italic serif">LIVE WIRE INTERCEPTOR</h2>
          <p className="text-xs opacity-60">Real-time WSS stream analysis and TLS fingerprint bypass</p>
        </div>
        <button 
          onClick={toggleActive}
          className={`px-4 py-2 text-xs font-bold flex items-center gap-2 border ${
            isActive ? 'bg-red-600 text-white border-red-700' : 'bg-ink text-bg border-ink'
          }`}
        >
          {isActive ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
          {isActive ? 'TERMINATE TAP' : 'ESTABLISH WIRE'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col h-[500px]">
          <div className="terminal-card flex-1 overflow-auto flex flex-col-reverse p-0">
            <div className="p-4 space-y-2 font-mono text-[10px] md:text-xs">
              {logs.map((log) => (
                <div key={log.id} className="flex gap-3 border-b border-green-900/10 pb-1">
                  <span className="opacity-30 shrink-0">{log.time}</span>
                  <span className={`font-bold shrink-0 ${
                    log.type === 'BET' ? 'text-blue-400' : 
                    log.type === 'CHAT' ? 'text-yellow-400' : 
                    'text-green-400'
                  }`}>
                    [{log.type}]
                  </span>
                  <span className="text-white shrink-0">{log.user}:</span>
                  <span className="opacity-80 break-all">{log.content}</span>
                </div>
              ))}
              {!isActive && (
                <div className="h-full flex flex-col items-center justify-center opacity-20 py-20">
                  <Terminal className="w-12 h-12 mb-4" />
                  <p className="uppercase tracking-widest">Awaiting socket connection</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="border border-ink p-6 bg-white shadow-sm">
            <h3 className="col-header mb-4">Tap Configuration</h3>
            <div className="space-y-3 text-[10px] font-mono">
              <div className="flex justify-between border-b border-bg pb-1">
                <span className="opacity-50">ENDPOINT</span>
                <span className="truncate ml-4">wss://api.runehall.com/...</span>
              </div>
              <div className="flex justify-between border-b border-bg pb-1">
                <span className="opacity-50">TLS_SPOOF</span>
                <span>CHROME_120</span>
              </div>
              <div className="flex justify-between border-b border-bg pb-1">
                <span className="opacity-50">ENCRYPTION</span>
                <span>AES-256-GCM</span>
              </div>
            </div>
          </div>

          <div className="border border-ink p-6 bg-white shadow-sm">
            <h3 className="col-header mb-4">High-Value Targets</h3>
            <div className="space-y-2">
              {logs.filter(l => l.type === 'BET').slice(0, 5).map((log, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-bg/20 border border-bg rounded">
                  <div className="flex items-center gap-2">
                    <Eye className="w-3 h-3 opacity-50" />
                    <span className="text-[10px] font-bold">{log.user}</span>
                  </div>
                  <span className="text-[10px] text-blue-600 font-mono">TRACKING</span>
                </div>
              ))}
              {logs.filter(l => l.type === 'BET').length === 0 && (
                <p className="text-[10px] italic opacity-50">No active targets identified.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
