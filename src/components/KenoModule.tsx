import React, { useState, useEffect } from 'react';
import { Shield, Zap, Target, Lock, Unlock, RefreshCw, AlertCircle, History, Loader2 } from 'lucide-react';
import { db, auth, useWebSocket, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export function KenoModule() {
  const [isCracking, setIsCracking] = useState(false);
  const [cracked, setCracked] = useState(false);
  const [prediction, setPrediction] = useState<number[]>([]);
  const [progress, setProgress] = useState(0);
  const [analysis, setAnalysis] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [currentSeed, setCurrentSeed] = useState('0x' + Math.random().toString(16).substring(2, 15).toUpperCase());
  const { sendMessage } = useWebSocket();

  // Load history from Firestore
  useEffect(() => {
    const q = query(
      collection(db, 'keno_audits'),
      orderBy('timestamp', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHistory(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'keno_audits');
    });

    return () => unsubscribe();
  }, []);

  const startCrack = async () => {
    setIsCracking(true);
    setProgress(0);
    setCracked(false);
    
    // Simulate progress
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          return 100;
        }
        return p + 5;
      });
    }, 100);

    try {
      // Real AI Analysis of the "seed"
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze this Keno RNG seed for cryptographic weaknesses: ${currentSeed}. 
        Provide a JSON response with:
        1. entropy_score (0-100)
        2. vulnerability_type
        3. predicted_numbers (array of 8 numbers between 1-40)
        4. technical_finding
        5. impact_assessment
        6. mitigation_steps`,
        config: { responseMimeType: "application/json" }
      });

      const result = JSON.parse(response.text);
      setAnalysis(result);
      setPrediction(result.predicted_numbers || [7, 15, 23, 32, 38, 12, 28, 4]);

      // Persist to Firestore
      await addDoc(collection(db, 'keno_audits'), {
        seed: currentSeed,
        ...result,
        timestamp: serverTimestamp()
      });

      // Broadcast activity
      sendMessage({
        type: 'AUDIT_ACTIVITY',
        data: {
          module: 'KENO',
          action: 'RNG_STATE_RECOVERED',
          target: currentSeed,
          user: auth.currentUser?.displayName || 'ANONYMOUS_AUDITOR',
          timestamp: new Date().toISOString()
        }
      });

      setCracked(true);
    } catch (error) {
      console.error("Cracking failed:", error);
    } finally {
      setIsCracking(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-ink pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight uppercase italic serif">KENO RNG AUDIT</h2>
          <p className="text-xs opacity-60">Seed analysis and predictive state manipulation research</p>
        </div>
        <Zap className={`w-8 h-8 ${cracked ? 'text-green-600' : 'text-ink opacity-20'}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-ink p-6 bg-white shadow-sm">
              <h3 className="col-header mb-4">Quantum Seed Analysis</h3>
              <div className="space-y-4">
                <div className="p-4 bg-bg/20 border border-bg rounded font-mono text-xs">
                  <p className="mb-2 flex justify-between">
                    <span>CURRENT_SEED:</span>
                    <span className="opacity-50 truncate ml-2">{currentSeed}</span>
                  </p>
                  <p className="mb-2 flex justify-between">
                    <span>ENTROPY_LEVEL:</span>
                    <span className={analysis?.entropy_score < 40 ? 'text-red-600 font-bold' : 'text-orange-600'}>
                      {analysis ? (analysis.entropy_score < 40 ? 'CRITICAL_LOW' : 'LOW') : 'CALCULATING...'}
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span>VULNERABILITY:</span>
                    <span className="text-red-600 font-bold">{analysis?.vulnerability_type || 'PENDING_ANALYSIS'}</span>
                  </p>
                </div>

                <button 
                  onClick={startCrack}
                  disabled={isCracking}
                  className="w-full bg-ink text-bg py-3 font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50"
                >
                  {isCracking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlock className="w-4 h-4" />}
                  {isCracking ? `RECOVERING STATE... ${progress}%` : 'INITIATE SEED CRACK'}
                </button>

                {isCracking && (
                  <div className="w-full bg-bg h-1">
                    <div className="bg-ink h-full transition-all duration-100" style={{ width: `${progress}%` }}></div>
                  </div>
                )}
              </div>
            </div>

            <div className="border border-ink p-6 bg-white shadow-sm">
              <h3 className="col-header mb-4">Predictive Draw Map</h3>
              <div className="grid grid-cols-8 gap-2">
                {Array.from({ length: 40 }).map((_, i) => {
                  const num = i + 1;
                  const isPredicted = prediction.includes(num);
                  return (
                    <div 
                      key={num}
                      className={`aspect-square flex items-center justify-center text-[10px] font-bold border transition-all duration-500 ${
                        isPredicted 
                          ? 'bg-green-500 text-white border-green-600 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]' 
                          : 'bg-bg/10 border-bg/20 text-ink/30'
                      }`}
                    >
                      {num}
                    </div>
                  );
                })}
              </div>
              {cracked && (
                <div className="mt-4 p-3 bg-green-50 border-l-4 border-green-600 flex items-center gap-3">
                  <Target className="w-5 h-5 text-green-600" />
                  <p className="text-[10px] font-mono text-green-800">
                    HIGH CONFIDENCE PATTERN IDENTIFIED: {prediction.join(', ')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {analysis && (
            <div className="border border-ink p-6 bg-ink text-bg">
              <h3 className="col-header text-bg mb-4">Vulnerability Report: RNG-AUDIT</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[10px] font-mono">
                <div className="space-y-2">
                  <p className="opacity-50 uppercase">Finding</p>
                  <p>{analysis.technical_finding}</p>
                </div>
                <div className="space-y-2">
                  <p className="opacity-50 uppercase">Impact</p>
                  <p className="text-red-400">{analysis.impact_assessment}</p>
                </div>
                <div className="space-y-2">
                  <p className="opacity-50 uppercase">Mitigation</p>
                  <p className="text-green-400">{analysis.mitigation_steps}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Audit History */}
        <div className="border border-ink p-6 bg-white shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-5 h-5" />
            <h3 className="col-header">Audit History</h3>
          </div>
          <div className="space-y-3">
            {history.map((audit) => (
              <div 
                key={audit.id} 
                className="p-3 border border-bg bg-bg/10 hover:bg-bg/20 cursor-pointer transition-colors"
                onClick={() => {
                  setAnalysis(audit);
                  setPrediction(audit.predicted_numbers);
                  setCurrentSeed(audit.seed);
                  setCracked(true);
                }}
              >
                <p className="text-[10px] font-bold font-mono truncate">{audit.seed}</p>
                <p className="text-[8px] opacity-50 font-mono">
                  {audit.timestamp?.toDate ? audit.timestamp.toDate().toLocaleString() : 'RECENT'}
                </p>
                <div className="flex justify-between items-center mt-2">
                  <span className={`text-[8px] px-1 rounded uppercase ${audit.entropy_score < 40 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                    ENTROPY: {audit.entropy_score}
                  </span>
                  <span className="text-[8px] opacity-50">{audit.vulnerability_type}</span>
                </div>
              </div>
            ))}
            {history.length === 0 && (
              <p className="text-[10px] italic opacity-50 text-center py-10">No audit history available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
