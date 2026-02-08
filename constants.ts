
import { Language, TranslationSet, AnalysisResult } from './types';

export const TRANSLATIONS: Record<Language, TranslationSet> = {
  en: {
    highRisk: "High Risk",
    mediumRisk: "Medium Risk",
    lowRisk: "Low Risk",
    analysis: "Analysis",
    recommendation: "Recommendation",
    noIssues: "No significant issues identified.",
    overallRisk: "Overall Risk Level",
    settings: "Settings",
    compare: "Compare Clauses",
    download: "Download Original",
    export: "Export Analysis"
  },
  af: {
    highRisk: "Hoë Risiko",
    mediumRisk: "Medium Risiko",
    lowRisk: "Lae Risiko",
    analysis: "Analise",
    recommendation: "Aanbeveling",
    noIssues: "Geen beduidende kwessies nie.",
    overallRisk: "Algehele Risikovlak",
    settings: "Instellings",
    compare: "Vergelyk Klousules",
    download: "Laai Oorspronklike Af",
    export: "Voer Analise Uit"
  },
  zu: {
    highRisk: "Ingozi Ephezulu",
    mediumRisk: "Ingozi Ephakathi",
    lowRisk: "Ingozi Ephansi",
    analysis: "Ukuhlaziya",
    recommendation: "Isincomo",
    noIssues: "Azikho izinkinga ezitholakele.",
    overallRisk: "Izinga Lonke Lengozi",
    settings: "Izilungiselelo",
    compare: "Qhathanisa Izigaba",
    download: "Landa Okokuqala",
    export: "Thumela Ukuhlaziya"
  }
};

export const JARGON_EXPLANATIONS: Record<string, string> = {
  "POPIA": "Protection of Personal Information Act (4 of 2013). South Africa's data protection law which sets conditions for the lawful processing of personal info.",
  "CPA": "Consumer Protection Act (68 of 2008). Law aimed at promoting a fair, accessible, and sustainable marketplace for SA consumers.",
  "BCEA": "Basic Conditions of Employment Act (75 of 1997). Sets out the minimum requirements for employment in South Africa including leave and hours.",
  "LRA": "Labour Relations Act (66 of 1995). Regulates the relationship between employers, employees, and unions.",
  "RHA": "Rental Housing Act (50 of 1999). Governs residential leases and established Rental Housing Tribunals to resolve disputes.",
  "Constitution": "The Constitution of the Republic of South Africa, 1996. The supreme law of the land, specifically the Bill of Rights in Section 14 (Privacy).",
  "NCA": "National Credit Act (34 of 2005). Regulates credit agreements and promotes a fair and non-discriminatory credit market."
};

// Extended interface to handle sample text in constants
export interface SampleResult extends AnalysisResult {
  sampleDocumentText: string;
}

export const PRE_ANALYZED_SAMPLES: Record<string, SampleResult> = {
  "Residential Lease": {
    overallRisk: 'high',
    overallRiskScore: 88,
    sampleDocumentText: `RESIDENTIAL LEASE AGREEMENT

1. THE PARTIES
The Landlord: ABC Properties (Pty) Ltd
The Tenant: John Doe

2. ACCESS TO PREMISES
The Landlord may enter the premises at any time without notice to the Tenant. This access includes but is not limited to inspections, repairs, and showings to prospective new tenants.

3. DATA PROTECTION
The Tenant hereby consents to the Landlord selling their identity number to credit bureaus and marketing firms for the duration of the lease and five years thereafter.

4. LIMITATION OF LIABILITY
The Landlord shall not be liable for any injury to the Tenant caused by the Landlord's gross negligence. The Tenant takes full responsibility for any structural failures of the building.

5. SECURITY DEPOSIT
A deposit of R15,000 is required upon signature...`,
    flaggedClauses: [
      {
        clauseText: "The Landlord may enter the premises at any time without notice to the Tenant.",
        riskScore: 85,
        riskLevel: 'high',
        issue: "Privacy Violation (Section 14)",
        analysis: "Section 14 of the Constitution and the RHA protect tenant privacy. Notice is mandatory for non-emergency inspections.",
        recommendation: "Amend to require at least 24 hours notice for any entry.",
        legislationLink: "https://www.gov.za/documents/rental-housing-act"
      },
      {
        clauseText: "The Tenant hereby consents to the Landlord selling their identity number to credit bureaus and marketing firms.",
        riskScore: 98,
        riskLevel: 'high',
        issue: "Unlawful POPIA Consent",
        analysis: "Under POPIA, processing of personal data must be for a specific, defined purpose. Selling IDs for marketing is likely unlawful.",
        recommendation: "Strike this clause. Identity numbers are high-risk data types.",
        legislationLink: "https://www.gov.za/documents/protection-personal-information-act"
      },
      {
        clauseText: "The Landlord shall not be liable for any injury to the Tenant caused by the Landlord's gross negligence.",
        riskScore: 92,
        riskLevel: 'high',
        issue: "Unfair CPA Limitation",
        analysis: "The CPA prohibits clauses that exempt suppliers from liability for gross negligence.",
        recommendation: "Change to limit liability to ordinary negligence only.",
        legislationLink: "https://www.gov.za/documents/consumer-protection-act"
      }
    ]
  },
  "Employment Agreement": {
    overallRisk: 'medium',
    overallRiskScore: 45,
    sampleDocumentText: `EMPLOYMENT CONTRACT

1. POSITION AND HOURS
The Employee is hired as a Senior Consultant. The Employee shall work 55 hours per week without additional compensation. No overtime will be paid under any circumstances.

2. CONFIDENTIALITY
The Employee shall not disclose any trade secrets...

3. TERMINATION
Either party may terminate this agreement...`,
    flaggedClauses: [
      {
        clauseText: "The Employee shall work 55 hours per week without additional compensation.",
        riskScore: 78,
        riskLevel: 'high',
        issue: "BCEA Maximum Hours Breach",
        analysis: "The BCEA limits ordinary working hours to 45 per week. Overtime is strictly regulated.",
        recommendation: "Ensure hours align with BCEA Chapter 2 standards.",
        legislationLink: "https://www.gov.za/documents/basic-conditions-employment-act"
      }
    ]
  }
};
