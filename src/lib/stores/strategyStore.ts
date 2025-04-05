import { writable, derived } from 'svelte/store';
import type { StrategyType, StrategyDescription } from '../types';
import { 
    getBalancedMixDays, 
    getLongWeekendsDays, 
    getMiniBreaksDays, 
    getWeekLongBreaksDays, 
    getExtendedVacationsDays 
} from '../utils/optimizationUtils';
import { holidays, year, weekendDays } from './holidayStore';
import { ptoBalance, ptoAccrualRate, ptoAccrualFrequency } from './ptoStore';

// Strategy descriptions
export const strategyDescriptions: StrategyDescription[] = [
    {
        id: 'none',
        name: 'No Strategy',
        description: 'No PTO strategy selected'
    },
    {
        id: 'balanced',
        name: 'Balanced Mix',
        description: 'A balanced mix of short and medium breaks throughout the year'
    },
    {
        id: 'long-weekends',
        name: 'Long Weekends',
        description: 'Focus on extending weekends by taking 1-2 days off around existing holidays or weekends'
    },
    {
        id: 'mini-breaks',
        name: 'Mini Breaks',
        description: 'Create multiple 5-6 day breaks spread throughout the year'
    },
    {
        id: 'week-long',
        name: 'Week-Long Breaks',
        description: 'Organize your PTO to create 7-9 day vacation periods'
    },
    {
        id: 'extended',
        name: 'Extended Vacations',
        description: 'Plan for one or two extended 10-15 day vacation periods'
    }
];

// Selected strategy
export const selectedStrategy = writable<StrategyType>('none');

// Derived store for suggested days based on the selected strategy
export const strategySuggestedDays = derived(
    [selectedStrategy, year, holidays, ptoBalance, ptoAccrualRate, ptoAccrualFrequency, weekendDays],
    ([$selectedStrategy, $year, $holidays, $ptoBalance, $ptoAccrualRate, $ptoAccrualFrequency, $weekendDays]) => {
        if ($selectedStrategy === 'none') return [];

        // Construct a StrategyInput object
        const input = {
            year: $year,
            weekends: $weekendDays,
            holidays: $holidays.filter(h => !h.hidden),
            ptoBalance: $ptoBalance,
            accrualRate: $ptoAccrualRate,
            accrualFrequency: $ptoAccrualFrequency
        };

        // Switch or map the strategy to the correct function
        switch ($selectedStrategy) {
            case 'balanced': return getBalancedMixDays(input);
            case 'long-weekends': return getLongWeekendsDays(input);
            case 'mini-breaks': return getMiniBreaksDays(input);
            case 'week-long': return getWeekLongBreaksDays(input);
            case 'extended': return getExtendedVacationsDays(input);
            default: return [];
        }
    }
);

// Initialize with default values
export function initializeStrategyStore(): void {
    // Set default strategy to 'none'
    selectedStrategy.set('none');
    
    // Load from localStorage if available
    if (typeof window !== 'undefined') {
        const storedStrategy = localStorage.getItem('selectedStrategy');
        
        if (storedStrategy) {
            // Verify it's a valid strategy type
            const isValidStrategy = strategyDescriptions.some(desc => desc.id === storedStrategy);
            
            if (isValidStrategy) {
                selectedStrategy.set(storedStrategy as StrategyType);
            }
        }
    }
}

// Subscribe to changes and update localStorage
if (typeof window !== 'undefined') {
    selectedStrategy.subscribe(value => localStorage.setItem('selectedStrategy', value));
} 