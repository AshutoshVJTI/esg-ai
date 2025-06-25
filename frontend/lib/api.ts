import { Report, Standard, APIResponse, ComplianceStats } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'An unknown error occurred' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }
  
  const responseData = await response.json();
  
  // Check if the response is already in the expected format
  if (responseData && typeof responseData === 'object') {
    // If it has success property, it's using our APIResponse format
    if ('success' in responseData) {
      const data: APIResponse<T> = responseData;
      if (!data.success) {
        throw new Error(data.error || 'API request failed');
      }
      return data.data;
    }
    
    // If it doesn't have success property but has the expected shape, return it directly
    // This handles direct JSON responses from the backend
    return responseData as T;
  }
  
  throw new Error('Invalid response format');
}

// Standards API
export async function getStandards(): Promise<Standard[]> {
  const response = await fetch(`${API_BASE_URL}/standards`);
  return handleResponse<Standard[]>(response);
}

export async function getStandard(id: string): Promise<Standard> {
  const response = await fetch(`${API_BASE_URL}/standards/${id}`);
  return handleResponse<Standard>(response);
}

export async function createStandard(data: Partial<Standard>): Promise<Standard> {
  const response = await fetch(`${API_BASE_URL}/standards`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return handleResponse<Standard>(response);
}

export async function updateStandard(id: string, data: Partial<Standard>): Promise<Standard> {
  const response = await fetch(`${API_BASE_URL}/standards/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return handleResponse<Standard>(response);
}

export async function deleteStandard(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/standards/${id}`, {
    method: 'DELETE',
  });
  return handleResponse<void>(response);
}

// Activities API
export interface Activity {
  id: string;
  type: string;
  details: string;
  user?: string | null;
  reportId?: string | null;
  createdAt: Date;
  report?: {
    id: string;
    name: string;
  } | null;
}

export interface GetActivitiesOptions {
  type?: string;
  reportId?: string;
  user?: string;
  startDate?: Date;
  endDate?: Date;
  sortBy?: 'createdAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export async function getActivities(options: GetActivitiesOptions = {}): Promise<Activity[]> {
  const params = new URLSearchParams();
  
  // Add query parameters if they exist
  if (options.type) params.append('type', options.type);
  if (options.reportId) params.append('reportId', options.reportId);
  if (options.user) params.append('user', options.user);
  if (options.startDate) params.append('startDate', options.startDate.toISOString());
  if (options.endDate) params.append('endDate', options.endDate.toISOString());
  if (options.sortBy) params.append('sortBy', options.sortBy);
  if (options.sortOrder) params.append('sortOrder', options.sortOrder);
  if (options.page) params.append('page', options.page.toString());
  if (options.limit) params.append('limit', options.limit.toString());

  const queryString = params.toString();
  const url = `${API_BASE_URL}/activities${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetch(url);
  return handleResponse<Activity[]>(response);
}

export async function getReportActivities(reportId: string): Promise<Activity[]> {
  const response = await fetch(`${API_BASE_URL}/activities/report/${reportId}`);
  return handleResponse<Activity[]>(response);
}

export async function createActivity(data: {
  type: string;
  details: string;
  user?: string;
  reportId?: string;
}): Promise<Activity> {
  const response = await fetch(`${API_BASE_URL}/activities`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return handleResponse<Activity>(response);
}

export async function exportActivities(options: GetActivitiesOptions = {}): Promise<Blob> {
  const params = new URLSearchParams();
  
  // Add query parameters if they exist
  if (options.type) params.append('type', options.type);
  if (options.reportId) params.append('reportId', options.reportId);
  if (options.user) params.append('user', options.user);
  if (options.startDate) params.append('startDate', options.startDate.toISOString());
  if (options.endDate) params.append('endDate', options.endDate.toISOString());
  if (options.sortBy) params.append('sortBy', options.sortBy);
  if (options.sortOrder) params.append('sortOrder', options.sortOrder);

  const queryString = params.toString();
  const url = `${API_BASE_URL}/activities/export${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'An unknown error occurred' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }
  
  return response.blob();
}

// Reports API
export interface GetReportsOptions {
  search?: string;
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  standardId?: string;
  sortBy?: 'name' | 'uploadedAt' | 'status';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export async function getReports(options: GetReportsOptions = {}) {
  const params = new URLSearchParams();
  
  // Add query parameters if they exist
  if (options.search) params.append('search', options.search);
  if (options.status) params.append('status', options.status);
  if (options.standardId) params.append('standardId', options.standardId);
  if (options.sortBy) params.append('sortBy', options.sortBy);
  if (options.sortOrder) params.append('sortOrder', options.sortOrder);
  if (options.page) params.append('page', options.page.toString());
  if (options.limit) params.append('limit', options.limit.toString());

  const queryString = params.toString();
  const url = `${API_BASE_URL}/reports${queryString ? `?${queryString}` : ''}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch reports: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch reports');
    }
    
    // Return the data property of the result
    return result.data;
  } catch (error) {
    throw error;
  }
}

export async function getReport(id: string): Promise<Report> {
  try {
    const response = await fetch(`${API_BASE_URL}/reports/${id}`);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'An unknown error occurred' }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }
    
    const responseData = await response.json();
    
    // Check if the response is successful
    if (!responseData.success) {
      throw new Error(responseData.error || 'API request failed');
    }
    
    // Extract the report data
    let reportData: Report;
    
    if (responseData.data) {
      // New format where the report is in responseData.data
      reportData = responseData.data;
    } else {
      // Old format where the report is directly in responseData
      reportData = responseData;
    }
    
    // Normalize the results structure if needed
    if (reportData.results) {
      // If results has a data property that contains analytics, move it to the top level
      if ((reportData.results as any).data) {
        // Handle analytics
        if ((reportData.results as any).data.analytics && !reportData.results.analytics) {
          reportData.results.analytics = (reportData.results as any).data.analytics;
        }
        
        // Copy other important fields to the top level if they don't exist there
        const fields = ['overallScore', 'summary', 'processedAt', 'findings', 'standards'] as const;
        fields.forEach(field => {
          const dataField = (reportData.results as any).data?.[field];
          const resultsField = reportData.results?.[field];
          
          if (dataField && !resultsField) {
            // Type assertion to handle the dynamic property assignment
            (reportData.results as any)[field] = dataField;
          }
        });
      }
    }
    
    return reportData;
  } catch (error) {
    throw error;
  }
}

export async function getReportsByStandard(standardId: string) {
  const response = await fetch(`${API_BASE_URL}/reports/standard/${standardId}`);
  const data = await response.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

export interface UploadResult {
  fileUrl: string;
}

export interface CreateReportRequest {
  name: string;
  description: string;
  standards: string[];
  fileUrl: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
}

export interface ReportRequest {
  id: string;
  name: string;
  description: string;
  standards: string[];
  fileUrl: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  updatedAt: string;
}

export const uploadFile = async (
  file: File, 
  onProgress?: (progress: number) => void
): Promise<UploadResult> => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(`${API_BASE_URL}/reports/upload`, {
      method: 'POST',
      body: formData,
    });

    return handleResponse<UploadResult>(response);
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Upload failed');
  }
};

export async function createReport(data: CreateReportRequest): Promise<Report> {
  const response = await fetch(`${API_BASE_URL}/reports`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return handleResponse<Report>(response);
}

export async function validateReport(id: string, guideline?: string): Promise<Report> {
  const response = await fetch(`${API_BASE_URL}/reports/${id}/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ guideline }),
  });
  return handleResponse<Report>(response);
}

export async function updateReport(id: string, data: Partial<Report>): Promise<Report> {
  const response = await fetch(`${API_BASE_URL}/reports/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return handleResponse<Report>(response);
}

export async function deleteReport(id: string) {
  const response = await fetch(`${API_BASE_URL}/reports/${id}`, {
    method: 'DELETE'
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

export async function addReportAnalysis(reportId: string, analysis: any) {
  const response = await fetch(`${API_BASE_URL}/reports/${reportId}/analysis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(analysis)
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

export async function uploadReport(file: File, standards: string[]): Promise<ReportRequest> {
  const formData = new FormData();
  formData.append('file', file);
  standards.forEach(standardId => {
    formData.append('standards[]', standardId);
  });

  const response = await fetch(`${API_BASE_URL}/reports/upload`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse<ReportRequest>(response);
}

export async function getComplianceStats(): Promise<ComplianceStats> {
  const response = await fetch(`${API_BASE_URL}/reports/stats`);
  return handleResponse<ComplianceStats>(response);
}

export async function exportReport(id: string): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/reports/${id}/export`);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'An unknown error occurred' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }
  return response.blob();
}

export async function shareReport(id: string, email: string): Promise<{ shareLink: string }> {
  const response = await fetch(`${API_BASE_URL}/reports/${id}/share`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });
  return handleResponse<{ shareLink: string }>(response);
}

export async function getSharedReport(token: string): Promise<Report> {
  const response = await fetch(`${API_BASE_URL}/reports/shared/${token}`);
  return handleResponse<Report>(response);
}

// Function to check if a report's status has changed to COMPLETED
export async function checkReportStatus(id: string): Promise<{
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  isCompleted: boolean;
}> {
  const report = await getReport(id);
  const isCompleted = report.status === 'COMPLETED';
  return {
    status: report.status,
    isCompleted
  };
}