
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Language, AnalysisResult, RiskLevel, RiskThresholds, FlaggedClause, ExportOptions } from './types';
import { TRANSLATIONS, PRE_ANALYZED_SAMPLES, JARGON_EXPLANATIONS } from './constants';
import { parsePDF } from './services/pdfService';
import { analyzeContract } from './services/geminiService';
import Button from './components/Button';
import Badge from './components/Badge';
import Onboarding from './components/Onboarding';
import RiskGauge from './components/RiskGauge';

const FREE_LIMIT = 2;

const JargonText: React.FC<{ text: string }> = ({ text }) => {
  const jargonKeys = Object.keys(JARGON_EXPLANATIONS);
  const regex = new RegExp(`(\\b(?:${jargonKeys.join('|')})\\b)`, 'g');
  const parts = text.split(regex);
  
  return (
    <>
      {parts.map((part, i) => {
        const explanation = JARGON_EXPLANATIONS[part];
        if (explanation) {
          return (
            <span key={i} className="relative group cursor-help border-b-2 border-dotted border-blue-400/50 text-blue-700 dark:text-blue-400 font-bold px-0.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors rounded-sm">
              {part}
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 p-4 bg-slate-900 dark:bg-slate-800 backdrop-blur-sm text-white text-[11px] rounded-2xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-[100] shadow-2xl leading-relaxed scale-95 group-hover:scale-100 origin-bottom border border-slate-700">
                <span className="block font-black mb-2 border-b border-slate-700 pb-1 text-blue-300 uppercase tracking-widest">{part} Definition</span>
                {explanation}
              </span>
            </span>
          );
        }
        return part;
      })}
    </>
  );
};

const DocumentContextView: React.FC<{ 
  text: string, 
  clauses: FlaggedClause[], 
  hoveredIndex: number | null, 
  onHover: (idx: number | null) => void,
  onScrollTo: (idx: number) => void
}> = ({ text, clauses, hoveredIndex, onHover, onScrollTo }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  if (!text) return null;

  let content: React.ReactNode[] = [text];

  clauses.forEach((clause, idx) => {
    const newContent: React.ReactNode[] = [];
    content.forEach((item) => {
      if (typeof item !== 'string') {
        newContent.push(item);
        return;
      }

      const parts = item.split(clause.clauseText);
      parts.forEach((part, i) => {
        newContent.push(part);
        if (i < parts.length - 1) {
          const riskColors = {
            high: 'bg-red-200/60 text-red-900 border-red-300 dark:bg-red-500/30 dark:text-red-200 dark:border-red-400/30',
            medium: 'bg-amber-200/60 text-amber-900 border-amber-300 dark:bg-amber-500/30 dark:text-amber-200 dark:border-amber-400/30',
            low: 'bg-emerald-200/60 text-emerald-900 border-emerald-300 dark:bg-emerald-500/30 dark:text-emerald-200 dark:border-emerald-400/30'
          };
          
          newContent.push(
            <mark
              key={`${idx}-${i}`}
              onMouseEnter={() => onHover(idx)}
              onMouseLeave={() => onHover(null)}
              onClick={() => onScrollTo(idx)}
              className={`px-0.5 rounded cursor-pointer transition-all duration-300 border-b-2 ${
                riskColors[clause.riskLevel]
              } ${hoveredIndex === idx ? 'ring-2 ring-blue-500 bg-blue-100 dark:bg-blue-900/40 shadow-sm' : ''}`}
            >
              {clause.clauseText}
            </mark>
          );
        }
      });
    });
    content = newContent;
  });

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-sm flex flex-col h-[70vh] overflow-hidden">
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Your Document</h4>
        </div>
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700"></div>
          <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700"></div>
          <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700"></div>
        </div>
      </div>
      <div 
        ref={containerRef}
        className="flex-1 p-8 overflow-y-auto custom-scrollbar text-sm leading-relaxed text-slate-600 dark:text-slate-400 font-medium whitespace-pre-wrap selection:bg-blue-100 dark:selection:bg-blue-900"
      >
        {content}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('en');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [rawText, setRawText] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [isComparing, setIsComparing] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [activeHighlight, setActiveHighlight] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [privateNotes, setPrivateNotes] = useState<Record<number, string>>({});
  const [exportConfig, setExportConfig] = useState<ExportOptions>({
    includeClauses: true,
    includeContext: false,
    includeScores: true,
    includeNotes: true,
    includeRecommendations: true
  });

  // Usage management
  const [dailyUsage, setDailyUsage] = useState<number>(0);
  const [hasCustomKey, setHasCustomKey] = useState<boolean>(false);
  const [showLimitModal, setShowLimitModal] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const hasSeen = localStorage.getItem('contractcheck_onboarding_seen');
    if (!hasSeen) setShowOnboarding(true);
    
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme === 'dark';
    
    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Initialize usage tracking
    const today = new Date().toISOString().split('T')[0];
    const stored = localStorage.getItem('contractcheck_usage');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.date === today) {
        setDailyUsage(parsed.count);
      } else {
        localStorage.setItem('contractcheck_usage', JSON.stringify({ date: today, count: 0 }));
        setDailyUsage(0);
      }
    } else {
      localStorage.setItem('contractcheck_usage', JSON.stringify({ date: today, count: 0 }));
    }

    // Check for custom API key
    if (window.aistudio?.hasSelectedApiKey) {
      window.aistudio.hasSelectedApiKey().then(setHasCustomKey);
    }
  }, []);

  const handleCloseOnboarding = () => {
    localStorage.setItem('contractcheck_onboarding_seen', 'true');
    setShowOnboarding(false);
  };

  const incrementUsage = () => {
    const today = new Date().toISOString().split('T')[0];
    const nextCount = dailyUsage + 1;
    setDailyUsage(nextCount);
    localStorage.setItem('contractcheck_usage', JSON.stringify({ date: today, count: nextCount }));
  };

  const handleOpenSelectKey = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      setHasCustomKey(true);
      setShowLimitModal(false);
    } else {
      alert("API Key selection is only available within the AI Studio environment.");
    }
  };

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const adjustedAnalysis = useMemo(() => {
    if (!analysis) return null;
    return {
      ...analysis,
      flaggedClauses: analysis.flaggedClauses.map((c, idx) => ({
        ...c,
        privateNote: privateNotes[idx] || ''
      }))
    };
  }, [analysis, privateNotes]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    // Check usage limits before processing
    if (dailyUsage >= FREE_LIMIT && !hasCustomKey) {
      setShowLimitModal(true);
      return;
    }

    let file: File | undefined;
    if (e.type === 'drop') {
      const de = e as React.DragEvent;
      de.preventDefault(); de.stopPropagation(); setIsDragging(false);
      file = de.dataTransfer.files[0];
    } else {
      const ce = e as React.ChangeEvent<HTMLInputElement>;
      file = ce.target.files?.[0];
    }

    if (!file) return;
    if (file.type !== 'application/pdf') {
      setError('Please use a PDF file.');
      return;
    }

    setError(null); setIsDemo(false); setLoading(true); setProgress(5); setLoadingText('Reading your file...');

    try {
      const text = await parsePDF(file);
      setRawText(text); setProgress(25); setLoadingText('Looking for risks...');
      const result = await analyzeContract(text);
      setAnalysis(result); 
      setPrivateNotes({}); 
      setProgress(100);
      if (!hasCustomKey) incrementUsage();
    } catch (err: any) {
      if (err.message?.includes("Requested entity was not found")) {
        setHasCustomKey(false);
        setError("Your API key seems invalid. Please re-select it.");
      } else {
        setError(err.message || 'Something went wrong reading the document.');
      }
    } finally {
      setLoading(false); setProgress(0);
    }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };

  const handleNoteChange = (idx: number, value: string) => {
    setPrivateNotes(prev => ({ ...prev, [idx]: value }));
  };

  const toggleSelection = (idx: number) => {
    setSelectedIndices(prev => {
      if (prev.includes(idx)) return prev.filter(i => i !== idx);
      if (prev.length < 2) return [...prev, idx];
      return [prev[1], idx];
    });
  };

  const scrollToClause = (idx: number) => {
    setActiveHighlight(idx);
    cardRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => setActiveHighlight(null), 3000);
  };

  const executeExport = () => {
    if (!adjustedAnalysis) return;
    let report = `CONTRACTCHECK REPORT\nDate: ${new Date().toLocaleString()}\nRisk Score: ${adjustedAnalysis.overallRiskScore}/100\n\n--- ISSUES FOUND ---\n\n`;
    adjustedAnalysis.flaggedClauses.forEach((c, i) => {
      report += `${i + 1}. ${c.issue}\nClause: "${c.clauseText}"\nAnalysis: ${c.analysis}\nSolution: ${c.recommendation}\nMy Notes: ${c.privateNote || 'None'}\n\n`;
    });
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `my_contract_audit_${Date.now()}.txt`; a.click();
    setShowExportModal(false);
  };

  const loadSample = (key: string) => {
    const sample = PRE_ANALYZED_SAMPLES[key];
    setAnalysis(sample);
    setRawText(sample.sampleDocumentText);
    setPrivateNotes({});
    setSelectedIndices([]);
    setIsDemo(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => scrollToClause(0), 1000);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 flex flex-col antialiased text-slate-900 dark:text-slate-100 selection:bg-blue-100 dark:selection:bg-blue-900 transition-colors duration-300">
      {showOnboarding && <Onboarding onClose={handleCloseOnboarding} />}

      {/* Usage Limit Modal */}
      {showLimitModal && (
        <div className="fixed inset-0 z-[120] bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-6 fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-3xl max-w-lg w-full p-12 border border-slate-100 dark:border-slate-800 text-center">
            <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-amber-600">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <h3 className="text-3xl font-black mb-4">Daily Free Limit Reached</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-10 leading-relaxed font-medium">
              You've used your {FREE_LIMIT} free daily scans. To continue using ContractCheck today, please select your own Gemini API key. 
              <br /><br />
              <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Learn more about API keys and billing</a>
            </p>
            <div className="flex flex-col gap-4">
              <Button size="lg" className="w-full font-black uppercase tracking-widest text-xs" onClick={handleOpenSelectKey}>Select API Key</Button>
              <Button variant="ghost" className="w-full font-black uppercase text-xs" onClick={() => setShowLimitModal(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-[110] bg-slate-950/40 dark:bg-black/60 backdrop-blur-md flex items-center justify-center p-6 fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-3xl max-w-md w-full p-10 border border-slate-100 dark:border-slate-800">
            <h3 className="text-2xl font-black mb-6">Save Results</h3>
            <div className="space-y-4 mb-10">
              <label className="flex items-center justify-between cursor-pointer p-3 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">Include Advice</span>
                <input type="checkbox" checked={exportConfig.includeRecommendations} onChange={(e) => setExportConfig({...exportConfig, includeRecommendations: e.target.checked})} className="w-5 h-5 rounded border-slate-200 dark:border-slate-700 text-blue-600 bg-transparent" />
              </label>
              <label className="flex items-center justify-between cursor-pointer p-3 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">Include My Notes</span>
                <input type="checkbox" checked={exportConfig.includeNotes} onChange={(e) => setExportConfig({...exportConfig, includeNotes: e.target.checked})} className="w-5 h-5 rounded border-slate-200 dark:border-slate-700 text-blue-600 bg-transparent" />
              </label>
            </div>
            <div className="flex gap-4">
              <Button variant="ghost" className="flex-1 font-black text-xs uppercase" onClick={() => setShowExportModal(false)}>Cancel</Button>
              <Button className="flex-1 font-black text-xs uppercase shadow-xl shadow-blue-500/20" onClick={executeExport}>Save File</Button>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Drawer */}
      {isComparing && adjustedAnalysis && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 dark:bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-10 fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-7xl rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-800">
            <div className="p-10 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50/80 dark:bg-slate-800/80">
              <div>
                <h2 className="text-3xl font-black">Compare Items</h2>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Side-by-side view</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsComparing(false)}>Close View</Button>
            </div>
            <div className="flex-1 overflow-y-auto p-12 grid grid-cols-1 md:grid-cols-2 gap-16">
              {selectedIndices.map((idx) => {
                const c = adjustedAnalysis.flaggedClauses[idx];
                return (
                  <div key={idx} className="space-y-8 animate-in slide-in-from-bottom-4">
                    <Badge level={c.riskLevel} label={`${c.riskLevel} risk`} />
                    <h3 className="text-3xl font-black leading-tight text-blue-600 dark:text-blue-400">{c.issue}</h3>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-3xl italic text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800 shadow-inner text-lg leading-relaxed">"{c.clauseText}"</div>
                    <div className="space-y-6">
                      <div className="p-6 bg-blue-50/50 dark:bg-blue-900/20 rounded-[2rem] border border-blue-100/50 dark:border-blue-900/40">
                        <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3">Why it matters</h4>
                        <p className="text-md leading-relaxed text-slate-600 dark:text-slate-400 font-medium"><JargonText text={c.analysis} /></p>
                      </div>
                      <div className="p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-[2rem] border border-emerald-100 dark:border-emerald-900/40 shadow-sm">
                        <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-3">Suggested Solution</h4>
                        <p className="text-md text-slate-700 dark:text-emerald-100 font-bold">{c.recommendation}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 no-print transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-5 flex items-center justify-between">
          <div className="flex items-center gap-5 group cursor-pointer" onClick={() => window.location.reload()}>
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-500/20 group-hover:scale-110 transition-transform">
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-none">ContractCheck</h1>
              <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.3em] mt-1.5">South Africa</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {!hasCustomKey && (
              <div className="hidden md:flex flex-col items-end mr-2">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Free Scans Remaining</span>
                <div className="flex gap-1 mt-1">
                  {[...Array(FREE_LIMIT)].map((_, i) => (
                    <div key={i} className={`w-3 h-1 rounded-full transition-colors ${i < (FREE_LIMIT - dailyUsage) ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                  ))}
                </div>
              </div>
            )}
            {hasCustomKey && (
              <Badge level="low" label="PRO Mode Active" />
            )}
            <button 
              onClick={toggleDarkMode}
              className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400 hover:text-blue-600 transition-all border border-slate-200 dark:border-slate-700"
              title="Toggle Dark Mode"
            >
              {isDarkMode ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"/></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
              )}
            </button>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner">
              {(['en', 'af', 'zu'] as Language[]).map(l => (
                <button key={l} onClick={() => setLang(l)} className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${lang === l ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-md scale-105' : 'text-slate-400 hover:text-slate-600'}`}>{l}</button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 sm:px-10 py-12">
        {!adjustedAnalysis && !loading && (
          <div className="space-y-20 py-10">
            <div className="text-center space-y-6">
              <h2 className="text-7xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight">Spot hidden traps in any contract.</h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-xl leading-relaxed font-medium">Whether it's a house lease, a job offer, or a business deal, get an instant AI scan for South African legal safety.</p>
              <div className="flex flex-wrap justify-center gap-3 mt-8">
                {['Consumer Rights', 'Job Law', 'Leases & Rent', 'Privacy (POPIA)'].map(tag => (
                  <span key={tag} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">{tag}</span>
                ))}
              </div>
            </div>

            <div 
              className={`relative border-[8px] border-dashed rounded-[5rem] p-32 text-center transition-all duration-700 bg-white dark:bg-slate-900/50 group ${isDragging ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 scale-[1.02] shadow-3xl' : 'border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 hover:shadow-2xl'}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleFileUpload}
            >
              <input type="file" accept=".pdf" ref={fileInputRef} onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
              <div className="space-y-10 relative z-0 pointer-events-none">
                <div className={`w-28 h-28 rounded-[2.5rem] flex items-center justify-center mx-auto transition-all shadow-xl ${isDragging ? 'bg-blue-600 text-white scale-125 rotate-12' : 'bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400'}`}>
                  <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
                </div>
                <div className="space-y-3">
                  <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{isDragging ? 'Drop it now!' : 'Drop your contract here'}</h3>
                  <p className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest text-xs">PDF File • Secure & Private • Tuned for SA Law</p>
                </div>
                {dailyUsage >= FREE_LIMIT && !hasCustomKey ? (
                  <Button size="lg" className="shadow-3xl bg-amber-600 hover:bg-amber-700 font-black tracking-widest uppercase text-xs" onClick={handleOpenSelectKey}>Get PRO to scan more</Button>
                ) : (
                  <Button size="lg" className="shadow-3xl shadow-blue-600/30 font-black tracking-widest uppercase text-xs">Choose File</Button>
                )}
                <div className="pt-6">
                  {!hasCustomKey && (
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      {FREE_LIMIT - dailyUsage} free daily scans remaining
                    </p>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40 rounded-[2rem] text-center fade-in">
                <p className="text-red-700 dark:text-red-400 font-bold">{error}</p>
                {error.includes("re-select") && (
                   <Button variant="ghost" size="sm" className="mt-4" onClick={handleOpenSelectKey}>Re-select Key</Button>
                )}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-8">
              {Object.keys(PRE_ANALYZED_SAMPLES).map(key => (
                <button key={key} onClick={() => loadSample(key)} className="p-12 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3.5rem] text-left hover:shadow-3xl hover:-translate-y-3 transition-all flex flex-col justify-between group overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 dark:bg-blue-900/10 rounded-bl-[5rem] translate-x-10 -translate-y-10 group-hover:translate-x-8 group-hover:-translate-y-8 transition-transform"></div>
                  <div className="relative z-10">
                    <Badge level={PRE_ANALYZED_SAMPLES[key].overallRisk} label="Demo" />
                    <h4 className="text-3xl font-black text-slate-900 dark:text-white mt-6 leading-tight">Common {key} Problems</h4>
                    <p className="text-slate-500 dark:text-slate-400 text-md mt-4 leading-relaxed font-medium">See how our AI spots unfair terms in typical agreements.</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="py-40 text-center space-y-12 fade-in">
            <div className="relative inline-flex mb-8">
              <div className="w-32 h-32 rounded-[3rem] border-8 border-blue-50 dark:border-slate-800 animate-pulse"></div>
              <div className="absolute inset-0 w-32 h-32 rounded-[3rem] border-8 border-blue-600 dark:border-blue-500 border-t-transparent animate-spin"></div>
            </div>
            <div className="space-y-4">
              <h3 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">{loadingText}</h3>
              <p className="text-slate-400 dark:text-slate-500 text-xl font-bold uppercase tracking-widest">Checking the law...</p>
            </div>
            <div className="max-w-xl mx-auto">
              <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner border border-slate-200 dark:border-slate-700">
                <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-700 ease-out shadow-lg" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          </div>
        )}

        {adjustedAnalysis && (
          <div className="space-y-12 fade-in">
            {isDemo && (
              <div className="bg-blue-600 text-white p-4 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl animate-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  </div>
                  <p className="font-bold text-sm">Viewing Interactive Example Analysis. <span className="opacity-75 font-medium">Try clicking the blue highlighted text in the document viewer.</span></p>
                </div>
                <Button size="sm" variant="ghost" className="text-white hover:bg-white/10" onClick={() => { setAnalysis(null); setIsDemo(false); }}>Scan Your Own Contract</Button>
              </div>
            )}

            <div className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-200 dark:border-slate-800 flex flex-wrap justify-between items-center gap-6 no-print shadow-sm">
              <Button variant="ghost" size="sm" onClick={() => { setAnalysis(null); setRawText(''); setIsDemo(false); }} className="font-black text-xs uppercase tracking-widest">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg> New Document
              </Button>
              <div className="flex gap-3 items-center">
                {selectedIndices.length === 1 && (
                  <div className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 animate-pulse px-4 border-l dark:border-slate-800">Select one more to compare</div>
                )}
                {selectedIndices.length === 2 && (
                  <Button size="sm" onClick={() => setIsComparing(true)} className="animate-pulse shadow-lg shadow-blue-500/20 font-black text-xs uppercase tracking-widest">
                    Compare Items ({selectedIndices.length})
                  </Button>
                )}
                <div className="flex gap-2 border-l pl-4 border-slate-200 dark:border-slate-800">
                  <Button size="sm" variant="secondary" onClick={() => setShowExportModal(true)} className="font-black text-xs uppercase tracking-widest">Save Result</Button>
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-12 items-start">
              <div className="lg:col-span-7 space-y-12">
                <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-xl border border-slate-100 dark:border-slate-800 p-12 flex flex-col md:flex-row gap-12 items-center">
                  <RiskGauge score={adjustedAnalysis.overallRiskScore} level={adjustedAnalysis.overallRisk} label={`${adjustedAnalysis.overallRisk} Risk`} clauses={adjustedAnalysis.flaggedClauses} />
                  <div className="space-y-6 flex-1 text-center md:text-left">
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{isDemo ? 'Sample Audit Result' : 'AI Audit Result'}</h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">We found {adjustedAnalysis.flaggedClauses.length} items that need attention. High scores mean serious problems under SA law.</p>
                    <div className="flex justify-center md:justify-start gap-2">
                      <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-[10px] font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest border border-blue-100 dark:border-blue-900/40">CPA & POPIA Checked</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <h4 className="font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-xs px-2">Identified Problems</h4>
                  {adjustedAnalysis.flaggedClauses.map((clause, idx) => (
                    <div 
                      key={idx} ref={el => cardRefs.current[idx] = el}
                      onMouseEnter={() => setHoveredIndex(idx)} onMouseLeave={() => setHoveredIndex(null)}
                      className={`bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 transition-all duration-500 overflow-hidden group/card relative ${
                        selectedIndices.includes(idx) ? 'border-blue-500 shadow-xl' : 'border-slate-100 dark:border-slate-800 shadow-md hover:border-slate-200 dark:hover:border-slate-700'
                      } ${hoveredIndex === idx ? 'ring-4 ring-blue-500/20' : ''} ${activeHighlight === idx ? 'ring-4 ring-blue-500 ring-offset-4 scale-[1.02] dark:ring-offset-slate-950' : ''}`}
                    >
                      <button 
                        onClick={() => toggleSelection(idx)}
                        className={`absolute top-6 right-6 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${selectedIndices.includes(idx) ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 text-transparent'}`}
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                      </button>
                      <div className={`h-2 w-full ${clause.riskLevel === 'high' ? 'bg-red-500' : clause.riskLevel === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                      <div className="p-10 space-y-8">
                        <div>
                          <h5 className="text-2xl font-black text-slate-900 dark:text-white mb-2">{clause.issue}</h5>
                          <Badge level={clause.riskLevel} label={`${clause.riskLevel} risk`} />
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl italic text-slate-700 dark:text-slate-300 leading-relaxed border border-slate-100 dark:border-slate-800 shadow-inner group-hover/card:bg-slate-100/50 dark:group-hover/card:bg-slate-800/80 transition-colors">"{clause.clauseText}"</div>
                        <div className="grid md:grid-cols-2 gap-10">
                          <div className="space-y-3">
                            <h6 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Why it's risky</h6>
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium"><JargonText text={clause.analysis} /></p>
                          </div>
                          <div className="space-y-3">
                            <h6 className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">What to do</h6>
                            <div className="p-5 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 text-slate-800 dark:text-emerald-100 text-sm font-bold shadow-sm">{clause.recommendation}</div>
                          </div>
                        </div>
                        {clause.legislationLink && (
                          <div className="pt-4 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center">
                            <h6 className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">Official Law Reference</h6>
                            <a href={clause.legislationLink} target="_blank" rel="noopener noreferrer" className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-1 hover:text-blue-800 dark:hover:text-blue-300 transition-colors">
                              Check Official Act <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                            </a>
                          </div>
                        )}
                        <div className="pt-6 border-t border-slate-50 dark:border-slate-800 space-y-3">
                          <h6 className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Private Note</h6>
                          <textarea 
                            value={privateNotes[idx] || ''} onChange={(e) => handleNoteChange(idx, e.target.value)}
                            placeholder="Type your notes here... (Private in your browser)"
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-xs font-medium text-slate-600 dark:text-slate-300 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/40 focus:bg-white dark:focus:bg-slate-700 focus:border-blue-400 outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600 resize-none"
                            rows={3}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-5 sticky top-32 space-y-8 no-print transition-all">
                <DocumentContextView text={rawText} clauses={adjustedAnalysis.flaggedClauses} hoveredIndex={hoveredIndex} onHover={setHoveredIndex} onScrollTo={scrollToClause} />
                <div className="bg-slate-900 dark:bg-slate-900 rounded-[2rem] p-8 text-white shadow-2xl overflow-hidden relative group border border-slate-800">
                  <h5 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-6">SA Law Quick Help</h5>
                  <div className="grid gap-3">
                    {Object.keys(JARGON_EXPLANATIONS).map((key) => (
                      <div key={key} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-help border border-transparent hover:border-white/10">
                        <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center text-[10px] font-black text-white">{key[0]}</div>
                        <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{key}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 py-20 mt-auto no-print transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-10 text-center space-y-8">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed font-bold uppercase tracking-tight max-w-xl mx-auto">ContractCheck is for your awareness. It does not replace a lawyer. Always get professional legal advice before signing.</p>
          <p className="text-[10px] font-black text-slate-300 dark:text-slate-700 tracking-[0.4em] uppercase">© {new Date().getFullYear()} CONTRACTCHECK SA</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
