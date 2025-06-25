// Report Types
export interface Report {
  id: string;
  name: string;
  description?: string;
  uploadedAt: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  standards: Standard[];
  fileUrl: string;
  results?: ReportResults;
  createdAt: string;
  updatedAt: string;
}

export interface ReportResults {
  score?: number;
  overallScore?: number;
  findings?: Array<{
    standard: string;
    compliance: number;
    issues: Array<{
      id: string;
      description: string;
      severity: string;
      type: string;
      context?: string;
      page?: number;
      recommendation?: string;
      highlightedText?: string;
      textLocation?: {
        pageNumber: number;
        boundingBox: {
          x1: number;
          y1: number;
          x2: number;
          y2: number;
        };
      };
    }>;
  }>;
  analytics?: {
    issuesByCategory?: Array<{
      category: string;
      count: number;
      percentage: number;
    }>;
    issuesBySeverity?: Array<{
      severity: string;
      count: number;
      percentage: number;
    }>;
    complianceTrend?: Array<{
      period: string;
      score: number;
    }>;
    topIssueAreas?: Array<{
      area: string;
      category: string;
      count: number;
    }>;
    improvementOpportunities?: Array<{
      area: string;
      description: string;
      potential: string;
    }>;
  };
  summary?: string;
  processedAt?: string;
  reportId?: string;
  reportName?: string;
  standards?: Array<{
    id: string;
    name: string;
    category: string;
    compliance: number;
  }>;
  status?: string;
  uploadedAt?: string;
  data?: {
    analytics?: {
      issuesByCategory?: Array<{
        category: string;
        count: number;
        percentage: number;
      }>;
      issuesBySeverity?: Array<{
        severity: string;
        count: number;
        percentage: number;
      }>;
      complianceTrend?: Array<{
        period: string;
        score: number;
      }>;
      topIssueAreas?: Array<{
        area: string;
        category: string;
        count: number;
      }>;
      improvementOpportunities?: Array<{
        area: string;
        description: string;
        potential: string;
      }>;
    };
    summary?: string;
    overallScore?: number;
    processedAt?: string;
  };
}

export interface Analytics {
  complianceTrend?: Array<{
    period: string;
    score: number;
  }>;
  improvementOpportunities?: Array<{
    area: string;
    description: string;
    potential: string;
  }>;
  issuesByCategory?: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  issuesBySeverity?: Array<{
    severity: string;
    count: number;
    percentage: number;
  }>;
  topIssueAreas?: Array<{
    area: string;
    category: string;
    count: number;
  }>;
}

export interface ReportIssue {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  page?: number;
  highlightedText?: string;
  solution?: string;
}

// ESG Standards Types
export interface ESGStandard {
  id: string;
  name: string;
  description: string;
  website?: string;
  categories: string[];
  isCustom: boolean;
  isActive: boolean;
}

// API Response Types
export interface Standard {
  id: string;
  name: string;
  description: string;
  categories: string[];
  isCustom: boolean;
  isActive: boolean;
  website?: string;
  files?: File[];
  createdAt: string;
  updatedAt: string;
}

export interface File {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  standardId: string;
  createdAt: string;
  updatedAt: string;
}

export interface StandardCompliance {
  standardId: string;
  compliance: number;
  issues: ReportIssue[];
}

export interface APIResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export interface ComplianceStats {
  compliant: number;
  issues: number;
  critical: number;
  totalReports: number;
  averageScore: number;
  categories: Record<string, number>;
}