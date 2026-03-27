
import React, { useState, useRef, useEffect } from 'react';
import { Contact, Theme } from '../types';

interface ContactListProps {
  contacts: Contact[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  isOpen: boolean;
  onClose: () => void;
  theme?: Theme;
}

export const ContactList: React.FC<ContactListProps> = ({ contacts, activeId, onSelect, onDelete, onAdd, isOpen, onClose, theme = 'midnight' }) => {
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const longPressTimerRef = useRef<number | null>(null);

  const getThemeAccent = () => {
    switch(theme) {
      case 'lust': return 'rose-600';
      case 'neon': return 'cyan-500';
      case 'stealth': return 'slate-600';
      default: return 'rose-500';
    }
  };

  const accent = getThemeAccent();

  const handleLongPressStart = (id: string) => {
    longPressTimerRef.current = window.setTimeout(() => {
      onDelete(id);
    }, 2500);
  };

  const handleLongPressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  useEffect(() => {
    const handleClickOutside = () => setMenuOpenId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[45] lg:hidden"
          onClick={onClose}
        />
      )}
      
      <div className={`
        fixed inset-y-0 left-0 z-50 w-[85%] sm:w-80 border-r border-white/5 transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        bg-slate-950/95 lg:bg-slate-950/80 backdrop-blur-3xl flex flex-col h-full
      `}>
        <div className="p-6 lg:p-8 border-b border-white/5 flex justify-between items-center shrink-0">
          <div className="flex flex-col">
            <h2 className={`text-[10px] font-extrabold tracking-[0.3em] uppercase text-${accent} font-mono`}>Ma-Operative</h2>
            <p className="text-[11px] text-slate-500 font-medium">Your Network</p>
          </div>
          <button 
            onClick={onAdd}
            className={`w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-900 border border-white/10 text-slate-400 hover:text-${accent} active:scale-95 shadow-lg transition-colors`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-2 no-scrollbar">
          {contacts.map((contact) => (
            <div key={contact.id} className="relative group">
              <button
                onClick={() => {
                  onSelect(contact.id);
                  onClose();
                }}
                onMouseDown={() => handleLongPressStart(contact.id)}
                onMouseUp={handleLongPressEnd}
                onMouseLeave={handleLongPressEnd}
                onTouchStart={() => handleLongPressStart(contact.id)}
                onTouchEnd={handleLongPressEnd}
                className={`w-full text-left px-4 py-4 rounded-2xl transition-all flex items-center gap-4 active:scale-[0.98] ${
                  activeId === contact.id 
                    ? `bg-${accent}/10 border border-${accent}/20 shadow-lg shadow-rose-950/20` 
                    : 'hover:bg-white/[0.03] border border-transparent'
                }`}
              >
                <div className="relative shrink-0">
                  <div className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-colors ${activeId === contact.id ? `border-${accent}` : 'border-slate-800'}`}>
                    {contact.avatar ? (
                      <img src={contact.avatar} alt={contact.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-500 font-black text-xs">
                        {contact.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  {activeId === contact.id && (
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-${accent} border-4 border-slate-950 flex items-center justify-center`}>
                      <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 pr-6">
                  <div className={`font-bold text-sm truncate transition-colors ${activeId === contact.id ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                    {contact.name}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate font-medium mt-0.5">
                    {contact.history.length > 0 
                      ? contact.history[contact.history.length - 1].content 
                      : 'Target Dossier Created'}
                  </div>
                </div>
              </button>

              <div className="absolute top-1/2 -translate-y-1/2 right-2 flex items-center">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpenId(menuOpenId === contact.id ? null : contact.id);
                  }}
                  className="p-2 text-slate-600 hover:text-white transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                </button>

                {menuOpenId === contact.id && (
                  <div className="absolute right-8 top-0 bg-slate-900 border border-white/10 rounded-xl shadow-2xl p-1 z-[60] animate-in slide-in-from-right-2 duration-150">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(contact.id);
                        setMenuOpenId(null);
                      }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors text-[10px] font-black uppercase tracking-widest whitespace-nowrap"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                      Delete Profile
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-6 lg:p-8 bg-black/20 border-t border-white/5 shrink-0">
          <div className={`flex items-center gap-3 text-[10px] font-mono font-bold tracking-widest text-${accent}/80`}>
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-${accent} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 bg-${accent}`}></span>
            </span>
            SYSTEM_SECURE
          </div>
        </div>
      </div>
    </>
  );
};
