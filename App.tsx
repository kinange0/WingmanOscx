import React, { useState, useEffect, useRef } from 'react';
import { auth, db, googleProvider } from './firebaseConfig';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, signInWithPopup, signOut } from 'https://esm.sh/firebase/auth';
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc } from 'https://esm.sh/firebase/firestore';
import { ContactList } from './components/ContactList';
import { AdviceOutput } from './components/AdviceOutput';
import { AddProfileModal } from './components/AddProfileModal';
import { SOSInterface } from './components/SOSInterface';
import { GeminiService } from './services/geminiService';
import { Contact, AppState, UserState, Intensity, IntelligenceModule, Theme, Message } from './types';

const App: React.FC = () => {
  // ============ AUTH STATE (KEEP AS IS) ============
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // ============ APP STATE ============
  const [state, setState] = useState<AppState>({
    contacts: [],
    activeContactId: null,
    intensity: 'medium',
    userState: 'confident',
    vibeMode: 'smooth',
    activeModule: 'reply',
    activeTheme: 'midnight',
    isGenerating: false,
    advice: null,
  });

  // ============ UI STATE ============
  const [inputMessage, setInputMessage] = useState('');
  const [contextNote, setContextNote] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [isScanningPsycho, setIsScanningPsycho] = useState(false);
  const [isRefreshingStarters, setIsRefreshingStarters] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  // ============ REFS ============
  const geminiService = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const abortFlagRef = useRef(false);
  const contactsUnsubscribeRef = useRef<(() => void) | null>(null);

  // ============ THEME COLORS ============
  const getThemeColors = () => {
    switch(state.activeTheme) {
      case 'lust': 
        return { accent: 'rose-600', textAccent: 'rose-500', glow: 'bg-red-600/20', bg: 'bg-black' };
      case 'neon': 
        return { accent: 'cyan-500', textAccent: 'cyan-400', glow: 'bg-cyan-500/20', bg: 'bg-slate-950' };
      case 'stealth': 
        return { accent: 'slate-600', textAccent: 'slate-400', glow: 'bg-slate-500/10', bg: 'bg-[#0f172a]' };
      default: 
        return { accent: 'rose-500', textAccent: 'rose-500', glow: 'bg-rose-500/10', bg: 'bg-[#020617]' };
    }
  };

  const themeColors = getThemeColors();
  const activeContact = state.contacts.find(c => c.id === state.activeContactId) || null;

  // ============ AUTH INITIALIZATION ============
  useEffect(() => {
    geminiService.current = new GeminiService();

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);

      contactsUnsubscribeRef.current?.();
      contactsUnsubscribeRef.current = null;

      if (!user) {
        setState(prev => ({ ...prev, contacts: [], activeContactId: null }));
        return;
      }

      const contactsQuery = query(
        collection(db, 'users', user.uid, 'contacts'),
        orderBy('updatedAt', 'desc')
      );

      contactsUnsubscribeRef.current = onSnapshot(contactsQuery, (snapshot) => {
        const contacts = snapshot.docs.map((docSnapshot) => {
          const payload = docSnapshot.data() as { data?: Omit<Contact, 'id'> };
          return {
            id: docSnapshot.id,
            ...(payload.data || {})
          } as Contact;
        });

        setState(prev => ({
          ...prev,
          contacts,
          activeContactId: contacts.some(c => c.id === prev.activeContactId)
            ? prev.activeContactId
            : (contacts[0]?.id || null)
        }));
      }, (err) => {
        console.error('Failed to subscribe contacts:', err);
      });
    });

    return () => {
      unsubscribeAuth();
      contactsUnsubscribeRef.current?.();
    };
  }, []);

  // ============ DATA FUNCTIONS ============
  const saveContactToDb = async (contact: Contact) => {
    if (!currentUser?.uid) return;
    try {
      const { id, ...contactData } = contact;
      const contactRef = doc(db, 'users', currentUser.uid, 'contacts', id);
      await setDoc(contactRef, {
        userId: currentUser.uid,
        data: contactData,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      }, { merge: true });
    } catch (err) {
      console.error('Failed to save contact:', err);
    }
  };

  const updateContactState = async (contactId: string, updates: Partial<Contact>) => {
    const contact = state.contacts.find(c => c.id === contactId);
    if (!contact) return null;
    
    const updatedContact = { ...contact, ...updates };
    
    setState(prev => ({
      ...prev,
      contacts: prev.contacts.map(c => c.id === contactId ? updatedContact : c)
    }));
    
    await saveContactToDb(updatedContact);
    return updatedContact;
  };

  // ============ AUTH HANDLERS ============
  const handleAuth = async () => {
    if (!email || !email.includes('@')) {
      setAuthError('Please enter a valid email address');
      return;
    }
    if (authMode !== 'forgot' && (!password || password.length < 6)) {
      setAuthError('Password must be at least 6 characters');
      return;
    }
    
    setAuthError('');
    setIsAuthenticating(true);
    
    try {
      if (authMode === 'forgot') {
        await sendPasswordResetEmail(auth, email.trim());
        alert('Password reset email sent. Check your inbox.');
        setAuthMode('login');
      } else if (authMode === 'signup') {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (error: any) {
      setAuthError(error.message || 'Authentication Protocol Failed');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleGoogleAuth = async () => {
    setAuthError('');
    setIsAuthenticating(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      setAuthError(error.message || 'Google sign-in failed');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  // ============ AI FUNCTIONS ============
  const scanPsychoProfile = async (contactId: string, historyImage?: any) => {
    if (!geminiService.current) return;
    const contact = state.contacts.find(c => c.id === contactId);
    if (!contact) return;
    
    setIsScanningPsycho(true);
    try {
      const profileData = {
        name: contact.name,
        notes: contact.notes || '',
        history: contact.history || [],
        summary: contact.summary || '',
        stats: contact.stats || {}
      };
      
      const analysis = await geminiService.current.scanPsychology(profileData, historyImage);
      
      await updateContactState(contactId, {
        summary: analysis.summary,
        suggestion: analysis.suggestion,
        psychoTraits: analysis.traits || [],
        peakHours: analysis.peakHours || 'Analyzing...',
        reminders: analysis.reminders || [],
        stats: {
          ...contact.stats,
          interestLevel: analysis.interestLevel || contact.stats?.interestLevel || 50,
          vibeStatus: analysis.vibeStatus || contact.stats?.vibeStatus || 'green'
        } as any
      });
    } catch (err) {
      console.error('Psycho scan failed:', err);
    } finally {
      setIsScanningPsycho(false);
    }
  };

  const handleRefreshStarters = async () => {
    if (!activeContact || !geminiService.current) return;
    setIsRefreshingStarters(true);
    try {
      const result = await geminiService.current.refreshStarters(activeContact, contextNote);
      await updateContactState(activeContact.id, {
        starters: result.starters,
        forbiddenWords: result.forbiddenWords
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefreshingStarters(false);
    }
  };

  const handleAbort = () => {
    abortFlagRef.current = true;
    setState(prev => ({ ...prev, isGenerating: false }));
  };

  const handleExecute = async () => {
    if (!activeContact || !geminiService.current) return;
    
    abortFlagRef.current = false;
    setState(prev => ({ ...prev, isGenerating: true }));
    
    try {
      if (inputMessage.trim()) {
        const newHistory = [
          ...(activeContact.history || []),
          { role: 'user_input', content: inputMessage, timestamp: Date.now() }
        ].slice(-50);
        await updateContactState(activeContact.id, { history: newHistory as any[] });
      }
      
      const advice = await geminiService.current.processRequest(
        state.activeModule,
        activeContact,
        state.intensity,
        state.userState,
        state.vibeMode,
        `MISSION_DESIRED_OUTCOME: ${contextNote}\n\nSIGNAL_RECEIVED: ${inputMessage}`,
        selectedMedia || undefined
      );
      
      if (abortFlagRef.current) return;

      const updatedMetrics = advice.metrics ? {
        interestLevel: advice.metrics.interest,
        investmentScore: advice.metrics.investment,
        vibeStatus: advice.metrics.interest > 70 ? 'green' : advice.metrics.interest > 40 ? 'yellow' : 'red'
      } : {};

      setState(prev => ({ ...prev, advice, isGenerating: false }));

      await updateContactState(activeContact.id, {
        lastAdvice: advice,
        stats: { ...activeContact.stats, ...updatedMetrics } as any
      });

      if (state.activeModule === 'analyze' || state.activeModule === 'radar') {
        scanPsychoProfile(activeContact.id);
      }

      if (window.innerWidth < 1024) {
        document.getElementById('advice-output')?.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (error) {
      if (abortFlagRef.current) return;
      console.error(error);
      alert('Neural sync interrupted.');
      setState(prev => ({ ...prev, isGenerating: false }));
    }
  };

  const handleOptionSelection = async (text: string) => {
    if (!activeContact) return;
    
    const newHistory: Message[] = [
      ...(activeContact.history || []),
      { role: 'model', content: text, timestamp: Date.now() }
    ].slice(-50);
    
    await updateContactState(activeContact.id, { history: newHistory });
  };

  // ============ CONTACT HANDLERS ============
  const handleAddProfile = async (name: string, notes: string, history: string, avatar?: string, historyImage?: any) => {
    if (!currentUser?.uid) return;
    
    const newContact: Contact = {
      id: crypto.randomUUID(),
      name,
      notes,
      avatar: avatar || undefined,
      summary: '',
      suggestion: '',
      peakHours: '',
      starters: [],
      forbiddenWords: [],
      reminders: [],
      emergencyLogs: [],
      history: history ? [{ role: 'target', content: history, timestamp: Date.now() }] as any[] : [],
      stats: { 
        interestLevel: 50, 
        investmentScore: 50, 
        vibeStatus: 'green',
        energyRatio: '1:1',
        simpingRisk: 'low'
      }
    };

    setState(prev => ({
      ...prev,
      contacts: [newContact, ...prev.contacts],
      activeContactId: newContact.id,
      advice: null
    }));

    setIsAddModalOpen(false);
    await saveContactToDb(newContact);
    
    if (history || notes || historyImage) {
      setTimeout(() => scanPsychoProfile(newContact.id, historyImage), 500);
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (confirm("Burn this operative dossier permanently?")) {
      setState(prev => {
        const remaining = prev.contacts.filter(c => c.id !== id);
        return {
          ...prev,
          contacts: remaining,
          activeContactId: prev.activeContactId === id ? (remaining.length > 0 ? remaining[0].id : null) : prev.activeContactId
        };
      });
      if (currentUser?.uid) {
        await deleteDoc(doc(db, 'users', currentUser.uid, 'contacts', id));
      }
    }
  };

  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice interface not supported.");
      return;
    }
    
    if (!recognitionRef.current) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.onresult = (e: any) => {
        let text = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          text += e.results[i][0].transcript;
        }
        setInputMessage(prev => prev + ' ' + text);
      };
      recognitionRef.current.onend = () => setIsListening(false);
    }
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        setSelectedMedia({
          inlineData: {
            data: base64,
            mimeType: file.type
          }
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const pasteFromClipboard = async (setter: (val: string) => void) => {
    try {
      const text = await navigator.clipboard.readText();
      setter(text);
    } catch (err) {
      console.error('Paste failed', err);
    }
  };

  if (authLoading) return <div className="h-screen w-full bg-[#020617] flex items-center justify-center"><div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div></div>;

  if (!currentUser) {
    return (
      <div className={`min-h-screen w-full flex flex-col items-center justify-center ${themeColors.bg} text-white p-4 sm:p-6 relative overflow-hidden`}>
        <div className={`glow-bg top-[-200px] left-[-200px] ${themeColors.glow}`}></div>
        <div className={`glow-bg bottom-[-200px] right-[-200px] ${themeColors.glow}`}></div>
        <div className="z-10 w-full max-w-sm md:max-w-md space-y-4 sm:space-y-5 animate-in zoom-in-95 duration-700">
          <div className="text-center space-y-2 sm:space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-rose-500/10 rounded-2xl border border-rose-500/20 shadow-2xl animate-float">
              <span className="text-3xl sm:text-4xl">🔥</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight uppercase">WINGMAN <span className="text-slate-600">OS</span></h1>
            <p className="text-slate-500 font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.35em] sm:tracking-[0.45em]">
              {authMode === 'signup' ? 'Dossier Registration' : authMode === 'forgot' ? 'Recovery Protocol' : 'Neural Grid Connect'}
            </p>
          </div>
          <div className="bg-slate-900/45 p-5 sm:p-6 rounded-[1.75rem] sm:rounded-[2rem] border border-white/5 backdrop-blur-3xl shadow-2xl space-y-3 sm:space-y-4">
            {authError && <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500 text-[10px] font-black uppercase text-center leading-relaxed">{authError}</div>}
            <div className="space-y-2.5 sm:space-y-3">
              <input type="email" placeholder="Email Terminal" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3.5 bg-slate-950/60 border border-white/10 rounded-xl text-white placeholder:text-slate-700 focus:outline-none focus:border-rose-500 transition-all text-sm" />
              {authMode !== 'forgot' && (
                <input type="password" placeholder="Access Key" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAuth()} className="w-full px-4 py-3.5 bg-slate-950/60 border border-white/10 rounded-xl text-white placeholder:text-slate-700 focus:outline-none focus:border-rose-500 transition-all text-sm" />
              )}
            </div>
            <button onClick={handleAuth} disabled={isAuthenticating} className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-[0.25em] sm:tracking-[0.35em] shadow-xl hover:opacity-90 active:scale-95 transition-all">
              {isAuthenticating ? 'Initializing...' : (authMode === 'login' ? 'Establish Link' : authMode === 'signup' ? 'Register Profile' : 'Send Reset Link')}
            </button>
            <button onClick={handleGoogleAuth} disabled={isAuthenticating} className="w-full py-3.5 bg-white text-slate-900 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.28em] shadow-xl hover:opacity-90 active:scale-95 transition-all">
              Continue with Google
            </button>
            <button onClick={() => setAuthMode('forgot')} className="w-full text-slate-500 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-widest hover:text-white transition-colors">
              Forgot Password?
            </button>
          </div>
          {authMode === 'forgot' ? (
            <button onClick={() => setAuthMode('login')} className="w-full text-slate-600 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-widest hover:text-white transition-colors">
              Back to Login
            </button>
          ) : (
            <button onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="w-full text-slate-500 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-widest hover:text-white transition-colors">
              {authMode === 'login' ? "New Operative? Request Clearance" : "Existing File? Reconnect Portal"}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      {state.activeModule === 'sos' && activeContact && (
        <SOSInterface 
          contact={activeContact}
          onClose={() => setState(p => ({...p, activeModule: 'reply'}))}
          onUpdateContact={(updates) => updateContactState(activeContact.id, updates)}
          geminiService={geminiService.current}
        />
      )}
      <div className={`flex flex-col lg:flex-row h-screen h-[100dvh] w-full bg-[#020617] text-slate-200 overflow-hidden font-sans relative`}>
        <div className={`glow-bg top-[-300px] left-[-300px] ${themeColors.glow}`}></div>
        <div className={`glow-bg bottom-[-300px] right-[-300px] ${themeColors.glow}`}></div>

        {isAddModalOpen && <AddProfileModal onClose={() => setIsAddModalOpen(false)} onSave={handleAddProfile} theme={state.activeTheme as any} />}

        <ContactList 
          contacts={state.contacts} 
          activeId={state.activeContactId} 
          onSelect={(id) => { 
            setState(prev => ({...prev, activeContactId: id, advice: null})); 
            const c = state.contacts.find(x => x.id === id); 
            if (c && !c.summary) scanPsychoProfile(id); 
          }} 
          onDelete={handleDeleteContact} 
          onAdd={() => setIsAddModalOpen(true)} 
          isOpen={isMobileMenuOpen} 
          onClose={() => setIsMobileMenuOpen(false)} 
          theme={state.activeTheme as any} 
        />

        <div className="flex-1 flex flex-col relative z-10 overflow-hidden h-full">
          {/* HEADER */}
          <header className="h-16 lg:h-20 border-b border-white/5 flex items-center justify-between px-4 lg:px-12 bg-slate-950/20 backdrop-blur-3xl shrink-0">
            <div className="flex items-center gap-3 lg:gap-6">
              <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2.5 bg-slate-900 border border-white/10 rounded-xl text-slate-400">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              </button>
              <h1 className="text-lg lg:text-xl font-black text-white tracking-tighter flex items-center gap-2">
                <span className={`text-${themeColors.textAccent}`}>🔥</span> WINGMAN <span className="text-slate-600 font-extralight uppercase hidden sm:inline text-xs">OS ELITE</span>
              </h1>
            </div>
            <div className="flex items-center gap-4">
               <div className="relative">
                 <button onClick={() => setShowThemeMenu(!showThemeMenu)} className="px-4 py-2 bg-slate-900/60 border border-white/10 rounded-xl text-slate-400 hover:text-white flex items-center gap-2 transition-all text-[10px] font-black uppercase tracking-widest">
                   <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="6" cy="6" r="3"/></svg>
                   {state.activeTheme}
                 </button>
                 {showThemeMenu && (
                   <div className="absolute top-full right-0 mt-2 w-40 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-2 z-[60] backdrop-blur-3xl">
                     {['midnight', 'lust', 'neon', 'stealth'].map(t => (
                       <button key={t} onClick={() => { setState(prev => ({...prev, activeTheme: t as Theme})); setShowThemeMenu(false); }} className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${state.activeTheme === t ? 'bg-rose-500 text-white' : 'text-slate-500 hover:bg-white/5'}`}>{t}</button>
                     ))}
                   </div>
                 )}
               </div>
               <button onClick={handleLogout} className="px-5 py-2.5 bg-slate-950 border border-white/5 rounded-xl text-[10px] font-black text-slate-500 hover:text-rose-500 uppercase tracking-widest transition-all">Disconnect</button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 lg:p-8 max-w-7xl mx-auto w-full no-scrollbar pb-24">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
              
              {/* MIDDLE COLUMN (OPERATIONS) */}
              <div className="lg:col-span-5 space-y-8">
                
                {/* CARD: MISSION OBJECTIVE */}
                <div className="bg-slate-900/60 border border-white/10 rounded-[2rem] p-6 backdrop-blur-2xl relative shadow-2xl">
                  <div className="flex justify-between items-center mb-4">
                     <div className="flex items-center gap-2">
                       <svg width="14" height="14" className={`text-${themeColors.textAccent}`} fill="currentColor"><path d="M12 2l-4 8H2l7 5-3 9 8-6 8 6-3-9 7-5h-6l-4-8z"/></svg>
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mission Objective</span>
                     </div>
                     <div className="flex gap-4">
                       <button onClick={() => pasteFromClipboard(setContextNote)} className="text-[9px] font-black text-slate-600 hover:text-white uppercase flex items-center gap-1"><svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg> Paste</button>
                       <button onClick={() => setContextNote('')} className="text-[9px] font-black text-slate-600 hover:text-white uppercase">Reset</button>
                     </div>
                  </div>
                  <textarea 
                    value={contextNote} 
                    onChange={(e) => setContextNote(e.target.value)} 
                    placeholder="What is your desired outcome? (e.g., Get her to suggest a date, tease her about her dressing, make her curious...)" 
                    className="w-full h-24 bg-slate-950/40 border border-white/5 rounded-xl p-4 text-white placeholder:text-slate-700 focus:outline-none focus:border-rose-500 transition-all resize-none text-[11px] italic font-medium leading-relaxed" 
                  />
                </div>

                {/* CARD: OPERATIONAL DOSSIER */}
                {activeContact && (
                  <div className="bg-slate-900/50 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-2xl relative group shadow-2xl space-y-8">
                    {/* Header: Avatar, Name, Peak Hour */}
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/10 shrink-0 shadow-2xl bg-slate-800 flex items-center justify-center font-black text-slate-500 text-2xl uppercase">
                          {activeContact.avatar ? <img src={activeContact.avatar} className="w-full h-full object-cover" /> : activeContact.name.charAt(0)}
                        </div>
                        <div>
                          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Operational Dossier</span>
                          <h3 className="text-2xl font-black text-white leading-tight">{activeContact.name}</h3>
                          <div className="flex items-center gap-2 mt-1.5">
                             <div className={`w-2 h-2 rounded-full ${activeContact.stats?.vibeStatus === 'green' ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`}></div>
                             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Interest Level: {activeContact.stats?.interestLevel || 50}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-slate-950/50 px-4 py-3 rounded-xl border border-white/5 flex flex-col items-center">
                          <span className="text-[7px] font-black text-slate-600 uppercase mb-0.5">Peak Hour</span>
                          <span className="text-[10px] font-black text-white uppercase font-mono">{activeContact.peakHours || 'Scanning...'}</span>
                      </div>
                    </div>

                    {/* Psycho Reader Status */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                         <span className={`text-[9px] font-black text-${themeColors.textAccent} uppercase tracking-widest flex items-center gap-2`}>
                            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="9"/><path d="M12 8v4l2 2"/></svg>
                            Psycho Reader Status
                         </span>
                         <div className="flex items-center gap-2">
                            <span className="bg-rose-500/10 border border-rose-500/30 text-rose-500 text-[8px] font-black px-2 py-1 rounded">HIGH ALIGNMENT</span>
                            <button onClick={() => scanPsychoProfile(activeContact.id)} disabled={isScanningPsycho} className={`p-1.5 rounded-lg border border-white/5 bg-slate-900 text-slate-500 hover:text-white transition-all ${isScanningPsycho ? 'animate-spin' : ''}`}>
                              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
                            </button>
                         </div>
                      </div>
                      <div className="bg-slate-950/40 rounded-2xl p-6 border border-white/5 space-y-4">
                         <div>
                            <div className="text-[10px] font-black text-slate-600 uppercase mb-2">Psychological Overview</div>
                            <p className="text-xs text-slate-300 font-medium italic leading-relaxed">{activeContact.summary || "Pending strategic analysis..."}</p>
                         </div>
                         {activeContact.suggestion && (
                           <div className={`p-4 bg-rose-500/5 rounded-xl border border-rose-500/10`}>
                              <div className="text-[8px] font-black text-rose-400 uppercase mb-1.5">Master Suggestion (What to do)</div>
                              <p className="text-xs text-white font-bold leading-relaxed">"{activeContact.suggestion}"</p>
                           </div>
                         )}
                      </div>
                    </div>

                    {/* Starters Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className={`text-[9px] font-black text-${themeColors.textAccent} uppercase tracking-widest flex items-center gap-2`}>
                           <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                           Inescapable Starters
                        </span>
                        <button onClick={handleRefreshStarters} disabled={isRefreshingStarters} className={`p-1.5 rounded-lg bg-slate-900 border border-white/5 text-slate-500 ${isRefreshingStarters ? 'animate-spin' : ''}`}><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg></button>
                      </div>
                      <div className="space-y-2">
                         {activeContact.starters?.map((s, i) => (
                           <div key={i} className="p-4 bg-slate-950/40 rounded-xl border border-white/5 text-[11px] text-slate-300 italic relative group leading-relaxed">
                             "{s}"
                           </div>
                         )) || <p className="text-[10px] text-slate-600 italic px-2">Analyze recent signals to generate strikes.</p>}
                      </div>
                    </div>

                    {/* Red Zone Section */}
                    <div className="space-y-3">
                      <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-2">
                         <svg width="12" height="12" fill="currentColor"><path d="M12 2L1 21h22L12 2zm0 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg> Red Zone (No-Go Words)
                      </span>
                      <div className="flex flex-wrap gap-2">
                         {activeContact.forbiddenWords?.map((w, i) => (
                           <span key={i} className="px-2 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[8px] font-black uppercase rounded">{w}</span>
                         ))}
                      </div>
                    </div>

                    {/* Silent Monitors Section */}
                    <div className="space-y-3">
                      <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="6" cy="6" r="5"/><path d="M6 4v2l1 1"/></svg> Silent Monitors
                      </span>
                      <div className="bg-slate-950/40 rounded-2xl p-5 border border-white/5 space-y-3">
                        {activeContact.reminders?.map((r, i) => (
                          <div key={i} className="text-[10px] text-slate-400 flex items-start gap-3">
                            <span className="text-emerald-500 text-xs">○</span> <span className="flex-1 leading-tight">{r}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* CARD: INPUT AREA */}
                <div className="bg-slate-900/60 border border-white/10 rounded-[2rem] p-8 backdrop-blur-2xl relative shadow-2xl">
                   <textarea 
                    value={inputMessage} 
                    onChange={(e) => setInputMessage(e.target.value)} 
                    placeholder="Copy her message here or describe the vibe... (Strike Input Required)" 
                    className="w-full h-32 bg-transparent text-slate-100 placeholder:text-slate-700 focus:outline-none transition-all resize-none text-[13px] font-medium leading-relaxed" 
                  />
                  <div className="flex justify-end gap-3 mt-4">
                    <button onClick={() => fileInputRef.current?.click()} className="w-10 h-10 rounded-xl bg-slate-950 border border-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-all"><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg></button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*,audio/*" onChange={handleMediaUpload} />
                    <button onClick={() => pasteFromClipboard(setInputMessage)} className="w-10 h-10 rounded-xl bg-slate-950 border border-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-all"><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg></button>
                    <button onClick={toggleListening} className={`w-10 h-10 rounded-xl bg-slate-950 border border-white/5 flex items-center justify-center transition-all ${isListening ? 'text-rose-500 animate-pulse' : 'text-slate-500'}`}><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/></svg></button>
                  </div>
                </div>

                {/* ACTION ROW */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <select 
                    value={state.userState} 
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'sos') {
                        setState(prev => ({...prev, activeModule: 'sos'}));
                      } else {
                        setState(prev => ({...prev, userState: val as UserState}));
                      }
                    }} 
                    className="flex-1 bg-slate-950 border border-white/5 rounded-2xl p-5 text-[10px] font-black uppercase text-slate-400 focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value="confident">Alpha / Status Frame</option>
                    <option value="attraction">Attraction Strike</option>
                    <option value="chaos">Chaos Mode</option>
                    <option value="mind-game">Strategic Mind Game</option>
                    <option value="ghost">Ghost Mode</option>
                    <option value="sos" className="text-red-500 font-black">--- EMERGENCY SOS ---</option>
                  </select>
                  <button 
                    onClick={handleExecute} 
                    disabled={state.isGenerating || (!inputMessage.trim() && !selectedMedia)} 
                    className={`h-16 px-12 bg-rose-500 hover:bg-rose-600 rounded-2xl text-white font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl transition-all active:scale-95 disabled:opacity-30`}
                  >
                    {state.isGenerating ? 'PROCESSING...' : 'DEPLOY STRIKE'}
                  </button>
                </div>
              </div>

              {/* RIGHT COLUMN (RESULTS) */}
              <div className="lg:col-span-7" id="advice-output">
                 <AdviceOutput 
                    advice={state.advice} 
                    isGenerating={state.isGenerating} 
                    theme={state.activeTheme as any} 
                    onAbort={handleAbort} 
                    onSelectOption={handleOptionSelection}
                 />
              </div>
            </div>
          </main>
          
          {/* FOOTER STATUS BAR */}
          <div className="h-10 border-t border-white/5 flex items-center justify-between px-10 bg-slate-950/20 backdrop-blur-md shrink-0">
             <div className="flex items-center gap-3 text-[10px] font-black text-slate-700 font-mono tracking-widest uppercase">
                <span className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]"></span> SYSTEM_SECURE
             </div>
             <div className="flex items-center gap-6 text-[9px] font-black text-slate-800 font-mono uppercase tracking-widest">
                <span>WINGMAN OS v5.9.X [ELITE]</span>
                <span className="hidden sm:inline opacity-30">|</span>
                <span className="hidden sm:inline">NEURAL LINK: OPTIMIZED</span>
                <span className="hidden sm:inline opacity-30">|</span>
                <span className="hidden sm:inline">BONGO SLANG ENGINE: ENABLED</span>
             </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default App;
