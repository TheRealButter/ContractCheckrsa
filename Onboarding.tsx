
import React from 'react';
import Button from './Button';

interface OnboardingProps {
  onClose: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xl z-[100] flex items-center justify-center p-6 sm:p-10 fade-in">
      <div className="bg-white rounded-[3.5rem] shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col sm:flex-row border border-slate-100">
        
        {/* Visual Hero Sidebar */}
        <div className="sm:w-2/5 bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-950 p-10 flex flex-col justify-center text-white relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-4xl font-black tracking-tight leading-tight mb-4">
              Don't Sign <br />
              <span className="text-blue-300">Blindly.</span>
            </h2>
            <p className="text-blue-100/80 text-sm font-medium leading-relaxed max-w-[200px]">
              The easiest way to check South African contracts for hidden risks.
            </p>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-8 sm:p-14 overflow-y-auto flex flex-col">
          <div className="flex-1">
            <div className="mb-12">
              <h3 className="text-sm font-black text-blue-600 uppercase tracking-[0.3em] mb-3">Welcome</h3>
              <h4 className="text-3xl font-black text-slate-900 tracking-tight">How it works</h4>
            </div>

            <div className="space-y-10">
              <div className="flex gap-6 group">
                <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                </div>
                <div>
                  <h5 className="font-bold text-slate-900 text-lg mb-1">Your data is private</h5>
                  <p className="text-slate-500 text-sm leading-relaxed font-medium">We don't save your files. Everything is checked privately in your browser.</p>
                </div>
              </div>

              <div className="flex gap-6 group">
                <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
                <div>
                  <h5 className="font-bold text-slate-900 text-lg mb-1">We know SA Law</h5>
                  <p className="text-slate-500 text-sm leading-relaxed font-medium">The AI is tuned for South African consumer rights, privacy rules, and job laws.</p>
                </div>
              </div>

              <div className="flex gap-6 group">
                <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
                <div>
                  <h5 className="font-bold text-slate-900 text-lg mb-1">Smart Suggestions</h5>
                  <p className="text-slate-500 text-sm leading-relaxed font-medium">Get clear advice on how to change unfair terms before you sign.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-100 flex justify-end">
            <Button className="px-10 py-4 font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-blue-600/20 w-full sm:w-auto" onClick={onClose}>Get Started</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
