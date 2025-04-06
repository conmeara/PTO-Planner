export interface Holiday {
    date: Date;
    name: string;
    hidden?: boolean;
}

export interface ConsecutiveDaysOff {
    startDate: Date;
    endDate: Date;
    totalDays: number;
}

export interface DayInfo {
    name: string;
    index: number;
}

export interface CountryInfo {
    code: string;
    name: string;
}

export interface StateInfo {
    code: string;
    name: string;
}

export interface SelectedPTODay {
    date: Date;
}

export interface PTOBalanceInfo {
    balance: number;
    unit: 'days' | 'hours';
    asOfDate: Date;
}

export interface PTOAccrualInfo {
    rate: number;
    unit: 'days' | 'hours';
    frequency: 'weekly' | 'bi-weekly' | 'monthly';
}

// New types for PTO strategies
export type StrategyType = 'none' | 'balanced' | 'long-weekends' | 'mini-breaks' | 'week-long' | 'extended';

export interface StrategyInput {
    year: number;
    weekends: number[];
    holidays: Holiday[];
    ptoBalance: number;
    accrualRate: number;
    accrualFrequency: 'weekly' | 'bi-weekly' | 'monthly';
}

export interface StrategyDescription {
    id: StrategyType;
    name: string;
    description: string;
}

// New types for multi-year PTO tracking
export interface DailyLedgerEntry {
    balance: number;
    transactions?: PtoTransaction[]; // Added to track transactions affecting this day
}

export interface HolidaysByYear {
    [year: number]: Holiday[];
}

export interface CarryoverOptions {
    enabled: boolean;
    maxDays: number; // Maximum days/hours that can be carried over
    expiryDate?: Date; // Optional date when carried over PTO expires
}

export interface MultiYearConfig {
    visibleYears: number[];
    carryover: CarryoverOptions;
}

// New transaction-based PTO tracking
export interface PtoTransaction {
    date: Date;
    type: 'accrual' | 'usage' | 'carryover' | 'adjustment';
    amount: number; // Positive for accrual/carryover, negative for usage
    note?: string;  // Optional description
}

// New interface for pay period template
export interface PayPeriodTemplate {
    frequency: 'weekly' | 'bi-weekly' | 'monthly';
    weekday?: number; // 0-6 for weekly/bi-weekly (0 = Sunday)
    dayOfMonth?: number; // 1-31 for monthly
}
