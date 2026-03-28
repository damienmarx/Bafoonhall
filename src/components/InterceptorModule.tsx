import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Activity, Wifi, WifiOff, Search, Eye, AlertCircle, Shield, User, Globe } from 'lucide-react';
import { useWebSocket } from '../lib/firebase';

interface LogEntry {
  id: string;
  type: 'SECURITY' | 'OSINT' | 'IDENTITY' | 'SYSTEM';
  user: string;
  content: string;
  time: string;
  target?: string;
}

export function InterceptorModule() {
  const [isActive, setIsActive] = useState(true);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const { lastMessage } = useWebSocket();

  useEffect(() => {
    if (!isActive || !lastMessage) return;

    try {
      if (lastMessage.type === 'AUDIT_ACTIVITY') {
        const { module, action, target, user, timestamp } = lastMessage.data;
        
        const newLog: LogEntry = {
          id: Math.random().toString(),
          type: module as any,
          user: user,
          content: `${action} on ${target}`,
          time: new Date(timestamp).toLocaleTimeString(),
          target: target
        };

        setLogs(prev => [newLog, ...prev.slice(0, 49)]);
      } else if (lastMessage.type === 'NEW_SECURITY_FINDING') {
        const { type, severity, payload, user } = lastMessage.data;
        const newLog: LogEntry = {
          id: Math.random().toString(),
          type: 'SECURITY',
          user: user || 'ANONYMOUS',
          content: `Vulnerability Found: ${type} (${severity}) - Payload: ${payload.substring(0, 20)}...`,
          time: new Date().toLocaleTimeString()
        };
        setLogs(prev => [newLog, ...prev.slice(0, 49)]);
      }
    } catch (e) {
      console.error("Error processing websocket message:", e);
    }
  }, [lastMessage, isActive]);

  const toggleActive = () => {
    setIsActive(!isActive);
    if (!isActive) {
      setLogs(prev => [{
        id: 'init-' + Date.now(),
        type: 'SYSTEM',
        user: 'SYSTEM',
        content: 'Re-establishing live wiretap... Listening for suite activity.',
        time: new Date().toLocaleTimeString()
      }, ...prev]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-ink pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight uppercase italic serif">LIVE WIRE INTERCEPTOR</h2>
          <p className="text-xs opacity-60">Real-time suite activity monitor and audit stream</p>
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
                    log.type === 'SECURITY' ? 'text-red-400' : 
                    log.type === 'OSINT' ? 'text-blue-400' : 
                    log.type === 'IDENTITY' ? 'text-yellow-400' :
                    'text-green-400'
                  }`}>
                    [{log.type}]
                  </span>
                  <span className="text-white shrink-0">{log.user}:</span>
                  <span className="opacity-80 break-all">{log.content}</span>
                </div>
              ))}
              {logs.length === 0 && isActive && (
                <div className="h-full flex flex-col items-center justify-center opacity-20 py-20">
                  <Activity className="w-12 h-12 mb-4 animate-pulse" />
                  <p className="uppercase tracking-widest">Listening for live audit events...</p>
                </div>
              )}
              {!isActive && (
                <div className="h-full flex flex-col items-center justify-center opacity-20 py-20">
                  <WifiOff className="w-12 h-12 mb-4" />
                  <p className="uppercase tracking-widest">Wiretap offline</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="border border-ink p-6 bg-white shadow-sm">
            <h3 className="col-header mb-4">Active Audit Stream</h3>
            <div className="space-y-3 text-[10px] font-mono">
              <div className="flex justify-between border-b border-bg pb-1">
                <span className="opacity-50">STATUS</span>
                <span className={isActive ? 'text-green-600 font-bold' : 'text-red-600'}>
                  {isActive ? 'INTERCEPTING' : 'OFFLINE'}
                </span>
              </div>
              <div className="flex justify-between border-b border-bg pb-1">
                <span className="opacity-50">SOURCE</span>
                <span>INTERNAL_WSS_BUS</span>
              </div>
              <div className="flex justify-between border-b border-bg pb-1">
                <span className="opacity-50">EVENT_COUNT</span>
                <span>{logs.length}</span>
              </div>
            </div>
          </div>

          <div className="border border-ink p-6 bg-white shadow-sm">
            <h3 className="col-header mb-4">Recent Targets</h3>
            <div className="space-y-2">
              {logs.filter(l => l.target).slice(0, 5).map((log, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-bg/20 border border-bg rounded">
                  <div className="flex items-center gap-2">
                    {log.type === 'OSINT' ? <Globe className="w-3 h-3" /> : <User className="w-3 h-3" />}
                    <span className="text-[10px] font-bold truncate max-w-[100px]">{log.target}</span>
                  </div>
                  <span className="text-[8px] opacity-50 uppercase">{log.type}</span>
                </div>
              ))}
              {logs.filter(l => l.target).length === 0 && (
                <p className="text-[10px] italic opacity-50 text-center py-4">No targets intercepted yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
