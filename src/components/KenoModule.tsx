import React, { useState, useEffect } from 'react';
import { Shield, Zap, Target, Lock, Unlock, RefreshCw, AlertCircle } from 'lucide-react';

export function KenoModule() {
  const [isCracking, setIsCracking] = useState(false);
  const [cracked, setCracked] = useState(false);
  const [prediction, setPrediction] = useState<number[]>([]);
  const [progress, setProgress] = useState(0);

  const startCrack = () => {
    setIsCracking(true);
    setProgress(0);
    setCracked(false);
  };

  useEffect(() => {
    if (isCracking && progress < 100) {
      const timer = setTimeout(() => setProgress(p => p + 2), 50);
      return () => clearTimeout(timer);
    } else if (progress >= 100) {
      setIsCracking(false);
      setCracked(true);
      setPrediction([7, 15, 23, 32, 38, 12, 28, 4]);
    }
  }, [isCracking, progress]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-ink pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight uppercase italic serif">KENO RNG AUDIT</h2>
          <p className="text-xs opacity-60">Seed analysis and predictive state manipulation research</p>
        </div>
        <Zap className={`w-8 h-8 ${cracked ? 'text-green-600' : 'text-ink opacity-20'}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-ink p-6 bg-white shadow-sm">
          <h3 className="col-header mb-4">Quantum Seed Analysis</h3>
          <div className="space-y-4">
            <div className="p-4 bg-bg/20 border border-bg rounded font-mono text-xs">
              <p className="mb-2">CURRENT_SEED: <span className="opacity-50">0x742E4D6c9dF6a...</span></p>
              <p className="mb-2">ENTROPY_LEVEL: <span className="text-orange-600">LOW</span></p>
              <p>VULNERABILITY: <span className="text-red-600 font-bold">PRNG_PREDICTABLE</span></p>
            </div>

            <button 
              onClick={startCrack}
              disabled={isCracking}
              className="w-full bg-ink text-bg py-3 font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50"
            >
              {isCracking ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Unlock className="w-4 h-4" />}
              {isCracking ? `CRACKING... ${progress}%` : 'INITIATE SEED CRACK'}
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
                  className={`aspect-square flex items-center justify-center text-[10px] font-bold border ${
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

        <div className="border border-ink p-6 bg-ink text-bg col-span-full">
          <h3 className="col-header text-bg mb-4">Vulnerability Report: RNG-01</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[10px] font-mono">
            <div className="space-y-2">
              <p className="opacity-50 uppercase">Finding</p>
              <p>The Keno module uses a time-seeded Mersenne Twister which is susceptible to state recovery after 624 observed outputs.</p>
            </div>
            <div className="space-y-2">
              <p className="opacity-50 uppercase">Impact</p>
              <p className="text-red-400">Total loss of game integrity. Outcomes can be predicted with 100% accuracy once seed is recovered.</p>
            </div>
            <div className="space-y-2">
              <p className="opacity-50 uppercase">Mitigation</p>
              <p className="text-green-400">Implement Cryptographically Secure Pseudo-Random Number Generator (CSPRNG) with hardware entropy sources.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
