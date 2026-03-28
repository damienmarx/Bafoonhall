/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Shield, Search, User, Terminal, AlertTriangle, Activity, Globe, MessageSquare } from 'lucide-react';
import { OSINTModule } from './components/OSINTModule';
import { SecurityModule } from './components/SecurityModule';
import { IdentityModule } from './components/IdentityModule';
import { KenoModule } from './components/KenoModule';
import { InterceptorModule } from './components/InterceptorModule';

type Tab = 'OSINT' | 'SECURITY' | 'IDENTITY' | 'OVERVIEW' | 'KENO' | 'INTERCEPTOR';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('OVERVIEW');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'OVERVIEW', label: 'OVERVIEW', icon: <Activity className="w-4 h-4" /> },
    { id: 'OSINT', label: 'OSINT', icon: <Globe className="w-4 h-4" /> },
    { id: 'SECURITY', label: 'CHAT SECURITY', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'IDENTITY', label: 'IDENTITY', icon: <User className="w-4 h-4" /> },
    { id: 'KENO', label: 'KENO AUDIT', icon: <Shield className="w-4 h-4" /> },
    { id: 'INTERCEPTOR', label: 'LIVE WIRE', icon: <Terminal className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      {/* Header */}
      <header className="border-b border-ink p-4 md:p-6 flex justify-between items-center bg-ink text-bg sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 md:w-8 md:h-8" />
          <h1 className="text-lg md:text-2xl font-bold tracking-tighter uppercase italic serif truncate">Runehall Audit</h1>
        </div>
        <div className="hidden md:flex items-center gap-4 text-xs font-mono opacity-70">
          <span>STATUS: ACTIVE</span>
          <span>DOMAIN: RUNEHALL.COM</span>
        </div>
        <button 
          className="md:hidden p-2 border border-bg/20 rounded"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <Terminal className="w-5 h-5" />
        </button>
      </header>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-ink text-bg border-b border-bg/20 p-4 space-y-2 animate-in fade-in slide-in-from-top-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsMenuOpen(false);
              }}
              className={`w-full text-left p-3 text-xs font-mono flex items-center gap-3 border border-bg/10 ${activeTab === item.id ? 'bg-bg text-ink' : ''}`}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </div>
      )}

      {/* Desktop Navigation */}
      <nav className="hidden md:flex border-b border-ink bg-bg px-6 overflow-x-auto no-scrollbar">
        {navItems.map((item) => (
          <button 
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`nav-item flex items-center gap-2 whitespace-nowrap ${activeTab === item.id ? 'active' : ''}`}
          >
            {item.icon} {item.label}
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 overflow-auto">
        {activeTab === 'OVERVIEW' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <div className="terminal-card col-span-full">
              <div className="flex items-center gap-2 mb-4 border-b border-green-900/50 pb-2">
                <Terminal className="w-4 h-4" />
                <span>SYSTEM_LOG_INITIALIZED</span>
              </div>
              <div className="space-y-1 font-mono text-[10px] md:text-xs">
                <p className="opacity-80">[{new Date().toISOString()}] Initializing audit sequence for runehall.com...</p>
                <p className="opacity-80">[{new Date().toISOString()}] Loading OSINT modules...</p>
                <p className="opacity-80">[{new Date().toISOString()}] Preparing XSS/CSS test vectors...</p>
                <p className="opacity-80">[{new Date().toISOString()}] Quantum prediction engine online.</p>
              </div>
            </div>

            <div className="border border-ink p-4 md:p-6 bg-white shadow-sm">
              <h3 className="col-header mb-4">Critical Findings</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-red-50 border-l-4 border-red-600">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-1" />
                  <div>
                    <p className="font-bold text-xs md:text-sm">RNG Vulnerability</p>
                    <p className="text-[10px] md:text-xs opacity-70">Keno seed generation shows predictable patterns.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-yellow-50 border-l-4 border-yellow-600">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-1" />
                  <div>
                    <p className="font-bold text-xs md:text-sm">Socket Interception</p>
                    <p className="text-[10px] md:text-xs opacity-70">Live WSS stream lacks TLS fingerprint hardening.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-ink p-4 md:p-6 bg-white shadow-sm">
              <h3 className="col-header mb-4">Audit Progress</h3>
              <div className="space-y-4">
                {[
                  { label: 'OSINT', val: 85 },
                  { label: 'SECURITY', val: 60 },
                  { label: 'IDENTITY', val: 45 },
                  { label: 'KENO', val: 30 }
                ].map((p) => (
                  <div key={p.label}>
                    <div className="flex justify-between text-[10px] font-mono mb-1">
                      <span>{p.label}</span>
                      <span>{p.val}%</span>
                    </div>
                    <div className="w-full bg-bg h-1.5">
                      <div className="bg-ink h-full transition-all duration-1000" style={{ width: `${p.val}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-ink p-4 md:p-6 bg-white shadow-sm">
              <h3 className="col-header mb-4">Target Information</h3>
              <div className="space-y-2 text-[10px] md:text-sm font-mono">
                <div className="flex justify-between border-b border-bg pb-1">
                  <span className="opacity-50">DOMAIN</span>
                  <span>runehall.com</span>
                </div>
                <div className="flex justify-between border-b border-bg pb-1">
                  <span className="opacity-50">IP_ADDR</span>
                  <span>104.21.74.122</span>
                </div>
                <div className="flex justify-between border-b border-bg pb-1">
                  <span className="opacity-50">WAF</span>
                  <span>CLOUDFLARE</span>
                </div>
                <div className="flex justify-between border-b border-bg pb-1">
                  <span className="opacity-50">SSL_CERT</span>
                  <span>VALID</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'OSINT' && <OSINTModule />}
        {activeTab === 'SECURITY' && <SecurityModule />}
        {activeTab === 'IDENTITY' && <IdentityModule />}
        {activeTab === 'KENO' && <KenoModule />}
        {activeTab === 'INTERCEPTOR' && <InterceptorModule />}
      </main>

      {/* Footer */}
      <footer className="border-t border-ink p-4 bg-ink text-bg text-[10px] font-mono flex justify-between">
        <span>&copy; 2026 RUNEHALL SECURITY AUDIT SUITE</span>
        <span>CONFIDENTIAL // AUTHORIZED ACCESS ONLY</span>
      </footer>
    </div>
  );
}

