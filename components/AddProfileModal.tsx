import React, { useState, useRef } from 'react';
import { Theme } from '../types';

interface AddProfileModalProps {
  onClose: () => void;
  onSave: (name: string, notes: string, history: string, avatar?: string, historyImage?: any) => void;
  theme: Theme;
}

export const AddProfileModal: React.FC<AddProfileModalProps> = ({ onClose, onSave, theme }) => {
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [history, setHistory] = useState('');
  const [avatar, setAvatar] = useState<string | undefined>(undefined);
  const [historyImage, setHistoryImage] = useState<any>(null);
  const [isRecording, setIsRecording] = useState<'notes' | 'history' | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const historyImageInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const getThemeAccent = () => {
    switch(theme) {
      case 'lust': return 'rose-600';
      case 'neon': return 'cyan-500';
      case 'stealth': return 'slate-600';
      default: return 'rose-500';
    }
  };

  const accent = getThemeAccent();

  const toggleVoiceInput = (field: 'notes' | 'history') => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input not supported in this browser.");
      return;
    }
    
    if (!recognitionRef.current) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.lang = 'en-US';
    }
    
    if (isRecording === field) {
      recognitionRef.current.stop();
      setIsRecording(null);
    } else {
      if (isRecording) recognitionRef.current.stop();
      
      recognitionRef.current.onresult = (e: any) => {
        let text = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          text += e.results[i][0].transcript;
        }
        if (field === 'notes') setNotes(prev => prev + ' ' + text);
        else setHistory(prev => prev + ' ' + text);
      };
      recognitionRef.current.onend = () => setIsRecording(null);
      
      recognitionRef.current.start();
      setIsRecording(field);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleHistoryImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        setHistoryImage({
          inlineData: {
            data: base64,
            mimeType: file.type
          }
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-[2.5rem] p-6 lg:p-8 shadow-2xl animate-in zoom-in-95 duration-200 my-auto">
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h2 className={`text-xl font-black text-white tracking-tight uppercase`}>New Operative</h2>
            <p className="text-slate-500 text-sm">Create a new target intelligence file.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-white transition-colors"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="space-y-5">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-3">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`w-24 h-24 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center cursor-pointer overflow-hidden transition-all hover:border-${accent}/50 relative group bg-slate-950`}
            >
              {avatar ? (
                <img src={avatar} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-600"><path d="M12 4v16m8-8H4"/></svg>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <span className="text-[10px] font-black text-white uppercase tracking-widest">Upload Profile</span>
              </div>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              accept="image/*" 
              className="hidden" 
            />
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Dossier Image (Optional)</label>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Full Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Anna, Fatuma, Nasra..."
              className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 text-white focus:outline-none focus:border-rose-500 transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Target Intel / Bio</label>
            <div className="relative">
              <textarea 
                value={notes} 
                onChange={e => setNotes(e.target.value)}
                placeholder="Background? Personality traits? Red flags?"
                className="w-full h-24 bg-slate-950 border border-white/5 rounded-2xl p-4 pr-12 text-white focus:outline-none focus:border-rose-500 transition-colors resize-none text-sm"
              />
              <button 
                onClick={() => toggleVoiceInput('notes')}
                className={`absolute bottom-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isRecording === 'notes' ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-800 text-slate-500 hover:text-white'}`}
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/></svg>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Chat Logs (History)</label>
            <div className="relative">
              <textarea 
                value={history} 
                onChange={e => setHistory(e.target.value)}
                placeholder="Paste previous chat history here for neural context..."
                className="w-full h-32 bg-slate-950 border border-white/5 rounded-2xl p-4 pr-24 text-white focus:outline-none focus:border-rose-500 transition-colors resize-none text-xs font-mono"
              />
              <div className="absolute bottom-3 right-3 flex gap-2">
                <button 
                  onClick={() => historyImageInputRef.current?.click()}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center bg-slate-800 text-slate-500 hover:text-white transition-all ${historyImage ? 'text-rose-500' : ''}`}
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
                </button>
                <button 
                  onClick={() => toggleVoiceInput('history')}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isRecording === 'history' ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-800 text-slate-500 hover:text-white'}`}
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/></svg>
                </button>
              </div>
              <input 
                type="file" 
                ref={historyImageInputRef} 
                onChange={handleHistoryImageUpload} 
                accept="image/*" 
                className="hidden" 
              />
              {historyImage && (
                <div className="absolute -bottom-5 left-1 text-[8px] font-black text-rose-500 uppercase tracking-widest">
                  Intelligence Clip Attached
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 flex gap-4">
          <button 
            onClick={onClose}
            className="flex-1 py-4 bg-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-700 transition-colors"
          >
            Abort
          </button>
          <button 
            onClick={() => {
              if (name.trim()) onSave(name, notes, history, avatar, historyImage);
            }}
            disabled={!name.trim()}
            className={`flex-1 py-4 bg-${accent} disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl text-[10px] font-black uppercase tracking-widest text-white hover:opacity-90 transition-all shadow-lg`}
          >
            Initialize Dossier
          </button>
        </div>
      </div>
    </div>
  );
};