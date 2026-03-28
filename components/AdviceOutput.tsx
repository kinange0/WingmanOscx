
import React, { useState, useEffect } from 'react';
import { WingmanAdvice, Theme, SuggestionReply } from '../types';

interface AdviceOutputProps {
  advice: WingmanAdvice | null;
  isGenerating: boolean;
  theme?: Theme;
  onAbort?: () => void;
  onSelectOption?: (text: string) => void;
}

const CopyButton: React.FC<{ text: string; themeColor: string }> = ({ text, themeColor }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <button 
      onClick={handleCopy}
      className={`absolute top-4 right-4 p-2.5 rounded-xl bg-slate-950/50 border border-white/5 text-slate-500 hover:text-white transition-all z-20 group`}
      title="Copy to clipboard"
    >
      {copied ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-emerald-500 animate-in zoom-in-50"><path d="M20 6L9 17l-5-5"/></svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`group-hover:text-${themeColor}`}><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
      )}
    </button>
  );
};

export const AdviceOutput: React.FC<AdviceOutputProps> = ({ advice, isGenerating, theme = 'midnight', onAbort, onSelectOption }) => {
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [showAbort, setShowAbort] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [expandedReason, setExpandedReason] = useState<number | null>(null);
  const [sentIdx, setSentIdx] = useState<number | null>(null);

  useEffect(() => {
    let timer: number;
    if (isGenerating) {
      setShowAbort(false);
      setSelectedIdx(null);
      setExpandedReason(null);
      setSentIdx(null);
      timer = window.setTimeout(() => setShowAbort(true), 5000);
    } else {
      setShowAbort(false);
    }
    return () => clearTimeout(timer);
  }, [isGenerating]);

  const copyToClipboard = async (text: string, id: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus(id);
      setSelectedIdx(idx); 
      setTimeout(() => setCopyStatus(null), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleSelect = (e: React.MouseEvent, text: string, idx: number) => {
    e.stopPropagation();
    setSentIdx(idx);
    if (onSelectOption) {
      onSelectOption(text);
    }
  };

  const getThemeColors = () => {
    switch(theme) {
      case 'lust': return { accent: 'rose-600', textAccent: 'rose-500' };
      case 'neon': return { accent: 'cyan-500', textAccent: 'cyan-400' };
      case 'stealth': return { accent: 'slate-600', textAccent: 'slate-400' };
      default: return { accent: 'rose-500', textAccent: 'rose-500' };
    }
  };

  const themeColors = getThemeColors();

  const getVibeStyles = (vibe?: string) => {
    switch(vibe) {
      case 'calm': return { 
        bg: 'bg-emerald-500/10', 
        border: 'border-emerald-500/20', 
        text: 'text-emerald-400', 
        icon: 'M12 21l-9-9 9-9 9 9-9 9z'
      };
      case 'playful': return { 
        bg: 'bg-amber-500/10', 
        border: 'border-amber-500/20', 
        text: 'text-amber-400', 
        icon: 'M14.828 14.828a4 4 0 01-5.656 0'
      };
      case 'bold': return { 
        bg: 'bg-rose-500/10', 
        border: 'border-rose-500/20', 
        text: 'text-rose-400', 
        icon: 'M13 10V3L4 14h7v7l9-11h-7z'
      };
      default: return { 
        bg: 'bg-slate-500/10', 
        border: 'border-slate-500/20', 
        text: 'text-slate-400', 
        icon: 'M12 8v4l3 3'
      };
    }
  };

  if (isGenerating) {
    return (
      <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-10 lg:p-16 flex flex-col items-center justify-center space-y-8 backdrop-blur-2xl min-h-[500px] relative overflow-hidden">
        <div className="relative z-10">
          <div className="w-24 h-24 lg:w-32 lg:h-32 border-2 border-white/5 rounded-full animate-pulse-ring"></div>
          <div className={`absolute top-0 w-24 h-24 lg:w-32 lg:h-32 border-t-2 border-${themeColors.textAccent} rounded-full animate-spin`}></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`w-3 h-3 lg:w-4 lg:h-4 bg-${themeColors.textAccent} rounded-full animate-ping`}></div>
          </div>
        </div>
        <div className="text-center z-10">
          <h4 className={`text-${themeColors.textAccent} text-[10px] font-mono font-black tracking-[0.5em] uppercase mb-3`}>Deploying Neural Grid...</h4>
          <p className="text-slate-500 text-xs italic">Simulating triple-strike outcomes...</p>
        </div>
        {showAbort && (
          <button onClick={onAbort} className="absolute bottom-10 px-6 py-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 transition-all">
            Abort Protocol
          </button>
        )}
      </div>
    );
  }

  if (!advice) {
    return (
      <div className="bg-slate-900/10 border border-dashed border-white/10 rounded-3xl p-10 lg:p-20 flex flex-col items-center justify-center text-center min-h-[500px]">
        <div className="w-20 h-20 bg-gradient-to-br from-slate-900 to-black rounded-[2rem] flex items-center justify-center mb-8 border border-white/5 shadow-2xl">
           <svg className={`w-10 h-10 text-${themeColors.textAccent}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
        </div>
        <h3 className="text-slate-200 font-black text-xl lg:text-2xl tracking-tighter uppercase">Wingman OS Ready</h3>
        <p className="text-slate-500 text-xs lg:text-sm mt-4 max-w-sm font-medium italic leading-relaxed">"Ingiza ujumbe wake ili nipige mahesabu ya miondoko mitatu ya hatari."</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 lg:space-y-10 animate-in fade-in slide-in-from-bottom-12 duration-1000 pb-20">
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
           <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded bg-${themeColors.textAccent}/20 border border-${themeColors.textAccent}/40`}></div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Response Matrix (Triple Strike)</span>
           </div>
           {selectedIdx !== null && (
             <button onClick={() => setSelectedIdx(null)} className="text-[9px] font-black text-slate-600 hover:text-white uppercase transition-colors">Reset View</button>
           )}
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          {advice.detailedSuggestions?.map((sug, idx) => {
            const styles = getVibeStyles(sug.vibe);
            const isSelected = selectedIdx === idx;
            const isUnselected = selectedIdx !== null && selectedIdx !== idx;
            const isRecommended = sug.isRecommended && selectedIdx === null;
            const isSent = sentIdx === idx;

            return (
              <div 
                key={idx} 
                onClick={() => setSelectedIdx(idx)}
                className={`
                  relative group transition-all duration-700 cursor-pointer overflow-hidden
                  ${isUnselected ? 'opacity-20 scale-95 blur-[1px] max-h-24' : 'opacity-100 scale-100 max-h-[600px]'}
                  bg-slate-900/60 border ${isSelected ? `border-${themeColors.textAccent} bg-slate-900/95 shadow-[0_0_50px_rgba(244,63,94,0.15)]` : isRecommended ? `border-${themeColors.textAccent}/30` : 'border-white/5'} 
                  rounded-[2.5rem]
                `}
              >
                {isRecommended && (
                  <div className={`absolute top-0 right-10 px-5 py-2 bg-${themeColors.accent} text-white text-[8px] font-black uppercase tracking-[0.3em] rounded-b-2xl shadow-xl z-20 animate-in slide-in-from-top-4`}>Recommended Strike</div>
                )}

                <div className="p-6 lg:p-8 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-4 lg:mb-8">
                    <div className="flex items-center gap-4">
                       <div className={`w-12 h-12 rounded-2xl ${styles.bg} ${styles.border} border flex items-center justify-center ${styles.text}`}>
                          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d={styles.icon}/></svg>
                       </div>
                       <div>
                          <div className={`text-[9px] font-black uppercase tracking-widest ${styles.text}`}>{sug.label}</div>
                          <div className="text-[11px] font-black text-white mt-1 uppercase opacity-60 flex items-center gap-2">
                             <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                             {sug.timingAdvice}
                          </div>
                       </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={(e) => handleSelect(e, sug.reply, idx)}
                        className={`
                          p-5 rounded-2xl border transition-all active:scale-90 shadow-2xl
                          ${isSent ? `bg-emerald-500 text-white border-emerald-400` : 'bg-slate-950 border-white/5 text-slate-500 hover:text-emerald-400'}
                        `}
                        title="I sent this"
                      >
                        <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                      </button>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(sug.reply, `sug-${idx}`, idx);
                        }}
                        className={`
                          p-5 rounded-2xl border transition-all active:scale-90 shadow-2xl
                          ${copyStatus === `sug-${idx}` ? `bg-${themeColors.accent} text-white border-white/20` : 'bg-slate-950 border-white/5 text-slate-500 hover:text-white'}
                        `}
                        title="Copy text"
                      >
                        <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                      </button>
                    </div>
                  </div>

                  <div className={`text-xl lg:text-3xl font-medium text-slate-100 italic leading-relaxed mb-6 transition-all ${isUnselected ? 'line-clamp-1 opacity-40' : ''}`}>
                    "{sug.reply}"
                  </div>

                  {!isUnselected && (
                    <div className="mt-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                      <div className="bg-black/40 rounded-[1.5rem] p-6 border border-white/5 shadow-inner">
                        <div className="flex items-center justify-between mb-3">
                           <span className={`text-[9px] font-black text-${themeColors.textAccent} uppercase tracking-widest flex items-center gap-2`}>
                             <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                             Tactical Rationale
                           </span>
                           <button 
                            onClick={(e) => { e.stopPropagation(); setExpandedReason(expandedReason === idx ? null : idx); }}
                            className="text-[8px] font-black text-slate-600 hover:text-white uppercase transition-colors"
                           >
                             {expandedReason === idx ? 'Collapse' : 'Expand Details'}
                           </button>
                        </div>
                        <p className={`text-xs lg:text-sm text-slate-400 leading-relaxed font-medium italic transition-all duration-300 ${expandedReason === idx ? '' : 'line-clamp-2'}`}>
                          "{sug.why}"
                        </p>
                      </div>

                      {sug.voiceNotePrompt && (
                        <div className={`flex items-center gap-5 py-4 px-6 bg-${themeColors.textAccent}/5 border border-${themeColors.textAccent}/10 rounded-2xl group/vn hover:border-${themeColors.textAccent}/30 transition-all`}>
                           <div className={`p-3 rounded-full bg-${themeColors.textAccent}/10 text-${themeColors.textAccent} animate-pulse`}><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/></svg></div>
                           <div className="flex-1">
                              <span className="text-[9px] font-black text-slate-600 uppercase block mb-1">Voice Note Protocol</span>
                              <p className="text-[11px] text-slate-400 font-bold italic leading-tight">"{sug.voiceNotePrompt}"</p>
                           </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {!selectedIdx && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in slide-in-from-bottom-8 duration-700">
          <div className="bg-slate-900/30 border border-white/5 rounded-[2.5rem] p-8 shadow-xl backdrop-blur-md relative group">
            <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4">Target Psychology</div>
            <p className="text-sm text-slate-300 leading-relaxed italic pr-8">"{advice.subtext}"</p>
            <CopyButton text={advice.subtext || ''} themeColor={themeColors.textAccent} />
            <div className="mt-6 flex flex-wrap gap-2">
                {advice.detectedSignals?.map(s => (
                  <span key={s} className="px-3 py-1 bg-black/40 border border-white/5 rounded-lg text-[8px] font-black text-slate-500 uppercase tracking-tighter">#{s}</span>
                ))}
             </div>
          </div>
          <div className="bg-slate-900/30 border border-white/5 rounded-[2.5rem] p-8 shadow-xl backdrop-blur-md flex flex-col justify-center relative group">
            <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4">Strategic Master-Plan</div>
            <p className="text-sm text-slate-300 leading-relaxed font-bold italic pr-8">"{advice.insight}"</p>
            <CopyButton text={advice.insight} themeColor={themeColors.textAccent} />
          </div>
        </div>
      )}
    </div>
  );
};