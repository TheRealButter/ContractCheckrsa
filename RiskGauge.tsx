
import React from 'react';
import { RiskLevel, FlaggedClause } from '../types';

interface RiskGaugeProps {
  score: number;
  level: RiskLevel;
  label: string;
  clauses?: FlaggedClause[];
}

const RiskGauge: React.FC<RiskGaugeProps> = ({ score, level, label, clauses = [] }) => {
  const percentage = Math.min(100, Math.max(0, score));
  const color = level === 'high' ? '#ef4444' : level === 'medium' ? '#f59e0b' : '#10b981';
  
  // Calculate relative weight of each clause for the attribution bar
  const totalClauseRisk = clauses.reduce((sum, c) => sum + c.riskScore, 0);
  
  return (
    <div className="flex flex-col items-center w-full max-w-[240px]">
      <div className="relative w-40 h-20 overflow-hidden mb-4">
        {/* Semi-circle background */}
        <div className="absolute top-0 left-0 w-40 h-40 border-[14px] border-slate-100 dark:border-slate-800 rounded-full"></div>
        {/* Active gauge */}
        <div 
          className="absolute top-0 left-0 w-40 h-40 border-[14px] border-transparent rounded-full transition-all duration-1000 ease-out"
          style={{ 
            borderColor: `${color} ${color} transparent transparent`,
            transform: `rotate(${percentage * 1.8 - 135}deg)`
          }}
        ></div>
        <div className="absolute bottom-0 left-0 w-full text-center pb-1">
          <span className="text-[14px] font-black text-slate-900 dark:text-white leading-none">{Math.round(score)}</span>
        </div>
      </div>
      
      <div className={`text-[10px] font-black uppercase tracking-[0.2em] mb-6`} style={{ color }}>
        {label}
      </div>

      {/* Risk Attribution Breakdown */}
      {clauses.length > 0 && (
        <div className="w-full space-y-3 px-2">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Risk Attribution</span>
            <span className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase">{clauses.length} Flags</span>
          </div>
          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full flex overflow-hidden shadow-inner border border-slate-200/50 dark:border-slate-700/50">
            {clauses.map((clause, idx) => {
              const weight = totalClauseRisk > 0 ? (clause.riskScore / totalClauseRisk) * 100 : 100 / clauses.length;
              const barColor = clause.riskLevel === 'high' ? 'bg-red-500' : clause.riskLevel === 'medium' ? 'bg-amber-500' : 'bg-emerald-500';
              return (
                <div 
                  key={idx}
                  className={`h-full ${barColor} transition-all duration-500 border-r border-white/10 dark:border-black/20`}
                  style={{ width: `${weight}%` }}
                  title={`${clause.issue}: ${clause.riskScore}`}
                />
              );
            })}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center">
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
              <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase">High</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
              <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase">Med</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase">Low</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiskGauge;
