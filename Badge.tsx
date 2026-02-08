
import React from 'react';
import { RiskLevel } from '../types';

interface BadgeProps {
  level: RiskLevel;
  label: string;
}

const Badge: React.FC<BadgeProps> = ({ level, label }) => {
  const styles = {
    high: "bg-red-50 text-red-700 border-red-200/50 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/30",
    medium: "bg-amber-50 text-amber-700 border-amber-200/50 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/30",
    low: "bg-emerald-50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/30"
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 border rounded-md text-[10px] font-bold uppercase tracking-wider ${styles[level]}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
        level === 'high' ? 'bg-red-500' : level === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
      }`}></span>
      {label}
    </span>
  );
};

export default Badge;
