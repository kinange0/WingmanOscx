import React, { useState } from 'react';
import { Contact, Message } from '../types';

interface SOSInterfaceProps {
  contact: Contact;
  onClose: () => void;
  onUpdateContact: (updates: Partial<Contact>) => void;
  geminiService: any;
}

export const SOSInterface: React.FC<SOSInterfaceProps> = ({ contact, onClose, onUpdateContact, geminiService }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [sosResult, setSosResult] = useState<string | null>(null);

  const handleSOSAction = async (actionType: string) => {
    if (!geminiService) return;
    setIsProcessing(true);
    setSosResult(null);

    const prevEmergencyContext = contact.emergencyLogs?.map(log => 
      `ACTION: ${log.action}, OUTCOME: ${log.outcome}`
    ).join('\n') || 'None';

    const history = (contact.history || []).slice(-10).map(m => 
      `${m.role === 'user' || m.role === 'user_input' ? 'ME' : 'HER'}: ${m.content}`
    ).join('\n');

    const prompt = `
      EMERGENCY PROTOCOL: ${actionType}
      TARGET: ${contact.name}
      PREVIOUS SOS ATTEMPTS: ${prevEmergencyContext}
      CHAT HISTORY: ${history}
      
      TASK: This is a high-stakes relationship emergency. Provide a single, brutal, and effective "Nuclear Strike" reply to fix the situation.
      Return the output as a plain string, keep it tactically precise and high-status.
    `;

    try {
      const response = await geminiService.ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt
      });
      
      const advice = response.text || "PROTOCOL FAILED. RETREAT.";
      setSosResult(advice);

      const newLog = {
        date: Date.now(),
        action: actionType,
        outcome: advice
      };

      const updatedLogs = [...(contact.emergencyLogs || []), newLog].slice(-10);
      onUpdateContact({ emergencyLogs: updatedLogs });

    } catch (err) {
      console.error(err);
      setSosResult("NEURAL SYNC LOST. RE-INITIALIZE.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black text-red-600 flex flex-col font-mono p-6 lg:p-12 overflow-y-auto">
      {/* SCANNING LINES EFFECT */}
      <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%]"></div>
      
      <div className="relative z-20 flex flex-col h-full max-w-5xl mx-auto w-full">
        {/* HEADER */}
        <div className="flex justify-between items-start border-b-2 border-red-600 pb-6 mb-8">
          <div>
            <h1 className="text-4xl lg:text-6xl font-black italic tracking-tighter animate-pulse">SOS: TACTICAL OVERRIDE</h1>
            <p className="text-red-500/60 mt-2 font-bold uppercase tracking-widest text-xs">Emergency Neural Grid / Operative: {contact.name}</p>
          </div>
          <button 
            onClick={onClose}
            className="px-6 py-3 border-2 border-red-600 hover:bg-red-600 hover:text-black transition-all font-black uppercase text-sm tracking-[0.3em]"
          >
            Exit Tactical
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 flex-1">
          {/* LEFT: BRIEFING */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-red-600/5 border border-red-600/30 p-6 rounded-xl">
               <h3 className="text-red-500 font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                 <span className="w-2 h-2 bg-red-600 rounded-full animate-ping"></span>
                 Tactical Briefing
               </h3>
               <div className="space-y-4 max-h-[40vh] overflow-y-auto no-scrollbar pr-2">
                  {contact.emergencyLogs && contact.emergencyLogs.length > 0 ? (
                    contact.emergencyLogs.map((log, i) => (
                      <div key={i} className="border-l-2 border-red-600/40 pl-4 py-2">
                        <div className="text-[10px] text-red-500/40">{new Date(log.date).toLocaleString()}</div>
                        <div className="text-[10px] font-black uppercase text-red-500">PREVIOUS STRATEGY: {log.action}</div>
                        <div className="text-xs italic text-red-400 mt-1 line-clamp-2">"{log.outcome}"</div>
                      </div>
                    ))
                  ) : (
                    <p className="text-red-500/40 italic text-xs">No previous SOS protocols logged. Grid is clean.</p>
                  )}
               </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-red-500 font-black text-xs uppercase tracking-widest">Select Protocol</h3>
              <div className="flex flex-col gap-4">
                {[
                  { id: 'GHOST PROTOCOL', desc: 'Cease all comms. Re-establish frame through absence.' },
                  { id: 'SILENCE BREAKER', desc: 'High-status trigger to force an immediate response.' },
                  { id: 'DAMAGE CONTROL', desc: 'Counter-tease to fix a frame collapse or simping error.' }
                ].map(action => (
                  <button 
                    key={action.id}
                    onClick={() => handleSOSAction(action.id)}
                    disabled={isProcessing}
                    className="group flex flex-col text-left p-6 border border-red-600/30 hover:bg-red-600/10 hover:border-red-600 transition-all rounded-xl relative overflow-hidden disabled:opacity-30"
                  >
                    <div className="absolute top-0 right-0 w-16 h-16 bg-red-600/5 rotate-45 translate-x-8 -translate-y-8 group-hover:bg-red-600/20 transition-all"></div>
                    <span className="text-lg font-black tracking-tighter">{action.id}</span>
                    <span className="text-[10px] text-red-500/60 font-bold uppercase mt-1">{action.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: OUTPUT */}
          <div className="lg:col-span-7">
             <div className="h-full bg-red-600/5 border border-red-600/30 rounded-3xl p-8 flex flex-col relative overflow-hidden min-h-[400px]">
                <div className="flex justify-between items-center mb-8 border-b border-red-600/20 pb-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.5em] text-red-500">Deployment Logic</span>
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse"></span>
                    <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse delay-75"></span>
                    <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse delay-150"></span>
                  </div>
                </div>

                {isProcessing ? (
                  <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                    <div className="w-20 h-20 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                    <div className="text-xl font-black italic animate-pulse">ANALYZING FATALITIES...</div>
                  </div>
                ) : sosResult ? (
                  <div className="flex-1 animate-in fade-in duration-700">
                    <div className="text-red-500/40 text-[10px] uppercase font-bold mb-4 font-mono">NUCLEAR STRIKE OUTPUT:</div>
                    <div className="text-2xl lg:text-4xl font-black italic leading-tight text-red-100 bg-red-600/10 p-6 rounded-2xl border border-red-600/20">
                      "{sosResult}"
                    </div>
                    <div className="mt-8 p-6 bg-black border border-red-600/20 rounded-xl">
                      <p className="text-red-500/60 text-[11px] leading-relaxed italic">
                        PROTOCOL NOTE: This is high-stakes. Do not alter a single word. Deploy exactly as formatted or frame collapse is imminent.
                      </p>
                    </div>
                    <button 
                      onClick={() => navigator.clipboard.writeText(sosResult)}
                      className="mt-6 w-full py-4 bg-red-600 text-black font-black uppercase tracking-widest text-xs hover:bg-red-500 transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                    >
                      Copy Strike & Deploy
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center border-2 border-dashed border-red-600/10 rounded-2xl">
                    <p className="text-red-600/20 font-black uppercase text-center tracking-widest italic">Waiting for Module Activation...</p>
                  </div>
                )}

                {/* BOTTOM DECORATION */}
                <div className="absolute bottom-4 left-8 right-8 flex justify-between text-[8px] font-black opacity-20 uppercase tracking-widest">
                  <span>Target_Psyche: Analyzed</span>
                  <span>Neural_Sync: Locked</span>
                  <span>Probability: 98%</span>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};