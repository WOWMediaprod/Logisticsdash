// Types for Driver Performance Overview API

export type PerformancePeriod = 'today' | 'week' | 'month' | '30days';

export interface DriverLocation {
  lat: number;
  lng: number;
  updatedAt: string | null;
}

export interface DriverStats {
  totalJobs: number;
  completedJobs: number;
  completionRate: number;
  totalEarnings: number;
  jobsPerDay: number;
  activeDays: number;
  idleDays: number;
}

export interface DriverTrends {
  jobsChange: number;
  earningsChange: number;
  completionRateChange: number;
}

export interface DriverAlerts {
  isTopPerformer: boolean;
  isUnderperforming: boolean;
  hasIdleStreak: boolean;
  isNewDriver: boolean;
}

export interface DriverPerformance {
  id: string;
  name: string;
  phone: string;
  isOnline: boolean;
  lastLocation: DriverLocation | null;
  stats: DriverStats;
  trends: DriverTrends;
  alerts: DriverAlerts;
  lastActive: string | null;
}

export interface CompanyAverages {
  completionRate: number;
  jobsPerDay: number;
  avgEarnings: number;
}

export interface PeriodInfo {
  start: string;
  end: string;
  label: string;
}

export interface PerformanceSummary {
  totalDrivers: number;
  onlineNow: number;
  topPerformers: number;
  needsAttention: number;
}

export interface DriverOverviewResponse {
  success: boolean;
  data: {
    period: PeriodInfo;
    previousPeriod: {
      start: string;
      end: string;
    };
    companyAverages: CompanyAverages;
    drivers: DriverPerformance[];
    summary: PerformanceSummary;
  };
}

// Sort options for the table
export type SortField =
  | 'name'
  | 'status'
  | 'totalJobs'
  | 'completionRate'
  | 'jobsChange'
  | 'jobsPerDay'
  | 'activeDays'
  | 'lastActive';

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}
