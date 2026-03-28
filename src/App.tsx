/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Shield, Search, User, Terminal, AlertTriangle, Activity, Globe, MessageSquare } from 'lucide-react';
import { OSINTModule } from './components/OSINTModule';
import { SecurityModule } from './components/SecurityModule';
import { IdentityModule } from './components/IdentityModule';

type Tab = 'OSINT' | 'SECURITY' | 'IDENTITY' | 'OVERVIEW';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('OVERVIEW');

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-ink p-6 flex justify-between items-center bg-ink text-bg">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8" />
          <h1 className="text-2xl font-bold tracking-tighter uppercase italic serif">Runehall Security Audit</h1>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono opacity-70">
          <span>STATUS: ACTIVE</span>
          <span>DOMAIN: RUNEHALL.COM</span>
          <span>VER: 1.0.0-PRO</span>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b border-ink bg-bg flex px-6">
        <button 
          onClick={() => setActiveTab('OVERVIEW')}
          className={`nav-item flex items-center gap-2 ${activeTab === 'OVERVIEW' ? 'active' : ''}`}
        >
          <Activity className="w-4 h-4" /> OVERVIEW
        </button>
        <button 
          onClick={() => setActiveTab('OSINT')}
          className={`nav-item flex items-center gap-2 ${activeTab === 'OSINT' ? 'active' : ''}`}
        >
          <Globe className="w-4 h-4" /> OSINT
        </button>
        <button 
          onClick={() => setActiveTab('SECURITY')}
          className={`nav-item flex items-center gap-2 ${activeTab === 'SECURITY' ? 'active' : ''}`}
        >
          <MessageSquare className="w-4 h-4" /> CHAT SECURITY
        </button>
        <button 
          onClick={() => setActiveTab('IDENTITY')}
          className={`nav-item flex items-center gap-2 ${activeTab === 'IDENTITY' ? 'active' : ''}`}
        >
          <User className="w-4 h-4" /> IDENTITY CORRELATION
        </button>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">
        {activeTab === 'OVERVIEW' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="terminal-card col-span-full">
              <div className="flex items-center gap-2 mb-4 border-b border-green-900/50 pb-2">
                <Terminal className="w-4 h-4" />
                <span>SYSTEM_LOG_INITIALIZED</span>
              </div>
              <p className="mb-2 text-xs opacity-80">[{new Date().toISOString()}] Initializing audit sequence for runehall.com...</p>
              <p className="mb-2 text-xs opacity-80">[{new Date().toISOString()}] Loading OSINT modules...</p>
              <p className="mb-2 text-xs opacity-80">[{new Date().toISOString()}] Preparing XSS/CSS test vectors for chat box potential...</p>
              <p className="mb-2 text-xs opacity-80">[{new Date().toISOString()}] Ready for execution.</p>
            </div>

            <div className="border border-ink p-6 bg-white shadow-sm">
              <h3 className="col-header mb-4">Critical Findings</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-red-50 border-l-4 border-red-600">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-1" />
                  <div>
                    <p className="font-bold text-sm">Pending OSINT Scan</p>
                    <p className="text-xs opacity-70">Full domain scan required to identify subdomains and infrastructure.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-yellow-50 border-l-4 border-yellow-600">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-1" />
                  <div>
                    <p className="font-bold text-sm">Chat Box Vulnerability</p>
                    <p className="text-xs opacity-70">Potential for CSS/XSS injection in real-time chat modules.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-ink p-6 bg-white shadow-sm">
              <h3 className="col-header mb-4">Audit Progress</h3>
              <div className="space-y-4">
                <div className="w-full bg-bg h-2">
                  <div className="bg-ink h-full" style={{ width: '35%' }}></div>
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span>OSINT</span>
                  <span>35%</span>
                </div>
                <div className="w-full bg-bg h-2">
                  <div className="bg-ink h-full" style={{ width: '10%' }}></div>
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span>SECURITY</span>
                  <span>10%</span>
                </div>
                <div className="w-full bg-bg h-2">
                  <div className="bg-ink h-full" style={{ width: '5%' }}></div>
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span>IDENTITY</span>
                  <span>5%</span>
                </div>
              </div>
            </div>

            <div className="border border-ink p-6 bg-white shadow-sm">
              <h3 className="col-header mb-4">Target Information</h3>
              <div className="space-y-2 text-sm font-mono">
                <div className="flex justify-between border-b border-bg pb-1">
                  <span className="opacity-50">DOMAIN</span>
                  <span>runehall.com</span>
                </div>
                <div className="flex justify-between border-b border-bg pb-1">
                  <span className="opacity-50">IP_ADDR</span>
                  <span>SCANNING...</span>
                </div>
                <div className="flex justify-between border-b border-bg pb-1">
                  <span className="opacity-50">SERVER</span>
                  <span>ANALYZING...</span>
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
      </main>

      {/* Footer */}
      <footer className="border-t border-ink p-4 bg-ink text-bg text-[10px] font-mono flex justify-between">
        <span>&copy; 2026 RUNEHALL SECURITY AUDIT SUITE</span>
        <span>CONFIDENTIAL // AUTHORIZED ACCESS ONLY</span>
      </footer>
    </div>
  );
}

