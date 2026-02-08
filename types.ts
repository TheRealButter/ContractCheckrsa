
export type RiskLevel = 'high' | 'medium' | 'low';

export interface RiskThresholds {
  lowMax: number;
  mediumMax: number;
}

export interface FlaggedClause {
  clauseText: string;
  riskLevel: RiskLevel; 
  riskScore: number;    // 0 to 100
  issue: string;
  analysis: string;
  recommendation: string;
  legislationLink?: string; // Link to official SA gov legislation
  uncertainty?: string;
  privateNote?: string; // Local user note
}

export interface AnalysisResult {
  overallRisk: RiskLevel;
  overallRiskScore: number;
  flaggedClauses: FlaggedClause[];
  uncertainty?: string;
}

export interface SavedAnalysis {
  id: number;
  timestamp: string;
  encrypted: {
    salt: number[];
    iv: number[];
    data: number[];
  };
}

export type Language = 'en' | 'af' | 'zu';

export interface TranslationSet {
  highRisk: string;
  mediumRisk: string;
  lowRisk: string;
  analysis: string;
  recommendation: string;
  noIssues: string;
  overallRisk: string;
  settings: string;
  compare: string;
  download: string;
  export: string;
}

export interface ExportOptions {
  includeClauses: boolean;
  includeContext: boolean;
  includeScores: boolean;
  includeNotes: boolean;
  includeRecommendations: boolean;
}
