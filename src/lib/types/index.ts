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
