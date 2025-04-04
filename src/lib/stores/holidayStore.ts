import { writable, derived } from 'svelte/store';
import type { Holiday, ConsecutiveDaysOff } from '../types';
import { getHolidaysForYear, optimizeDaysOff, calculateConsecutiveDaysOff } from '../utils/holidayUtils';
import { ptoData } from '../utils/ptoData';

// Initial state
export const year = writable<number>(new Date().getFullYear());
export const selectedCountry = writable<string>('');
export const selectedCountryCode = writable<string>('');
export const selectedState = writable<string>('');
export const selectedStateCode = writable<string>('');
export const daysOff = writable<number>(0);
export const weekendDays = writable<number[]>([0, 6]); // Sunday, Saturday
export const holidays = writable<Holiday[]>([]);
export const visibleHolidays = derived(holidays, $holidays => $holidays.filter(h => !h.hidden));

// Derived stores
export const optimizedDaysOff = derived(
    [holidays, year, daysOff, weekendDays],
    ([$holidays, $year, $daysOff, $weekendDays]) => {
        const visibleHolidaysList = $holidays.filter(h => !h.hidden);
        return optimizeDaysOff(visibleHolidaysList, $year, $daysOff, $weekendDays);
    }
);

export const consecutiveDaysOff = derived(
    [holidays, optimizedDaysOff, year, weekendDays],
    ([$holidays, $optimizedDaysOff, $year, $weekendDays]) => {
        const visibleHolidaysList = $holidays.filter(h => !h.hidden);
        return calculateConsecutiveDaysOff(visibleHolidaysList, $optimizedDaysOff, $year, $weekendDays);
    }
);

// Actions
export function updateHolidays(): void {
    let countryCode: string;
    let stateCode: string;
    let currentYear: number;
    
    // Get current values from stores
    selectedCountryCode.subscribe(value => countryCode = value)();
    selectedStateCode.subscribe(value => stateCode = value)();
    year.subscribe(value => currentYear = value)();
    
    if (countryCode) {
        const allHolidays = getHolidaysForYear(countryCode, currentYear, stateCode);
        
        // Update with proper date objects and not hidden by default
        holidays.update(() => allHolidays.map(holiday => ({
            ...holiday,
            date: new Date(holiday.date),
            hidden: false
        })));

        // Update optimized days off after holidays update
        const currentWeekends: number[] = [];
        weekendDays.subscribe(value => {
            if (value && Array.isArray(value)) {
                currentWeekends.push(...value);
            }
        })();

        // Log info for debugging
        console.log(`Updated holidays for ${countryCode}, ${stateCode || 'no state'}, ${currentYear}`);
        console.log(`Found ${allHolidays.length} holidays`);
    } else {
        holidays.set([]);
    }
}

// Initialize with default values
export function initializeStores(): void {
    const defaultYear = new Date().getFullYear();
    
    // Load from localStorage if available
    if (typeof window !== 'undefined') {
        const storedYear = localStorage.getItem('year');
        const storedCountry = localStorage.getItem('selectedCountry');
        const storedCountryCode = localStorage.getItem('selectedCountryCode');
        const storedDaysOff = localStorage.getItem('daysOff');
        const storedState = localStorage.getItem('selectedState');
        const storedStateCode = localStorage.getItem('selectedStateCode');
        const storedWeekendDays = localStorage.getItem('weekendDays');
        
        year.set(storedYear ? parseInt(storedYear, 10) : defaultYear);
        selectedCountry.set(storedCountry || '');
        selectedCountryCode.set(storedCountryCode || '');
        selectedState.set(storedState || '');
        selectedStateCode.set(storedStateCode || '');
        daysOff.set(storedDaysOff ? parseInt(storedDaysOff, 10) : 0);
        weekendDays.set(storedWeekendDays ? JSON.parse(storedWeekendDays) : [0, 6]);
        
        // Set default days off based on country code
        if (storedCountryCode && !storedDaysOff) {
            daysOff.set(ptoData[storedCountryCode] || 0);
        }
        
        updateHolidays();
    }
}

// Subscribe to changes and update localStorage
if (typeof window !== 'undefined') {
    year.subscribe(value => localStorage.setItem('year', value.toString()));
    selectedCountry.subscribe(value => localStorage.setItem('selectedCountry', value));
    selectedCountryCode.subscribe(value => localStorage.setItem('selectedCountryCode', value));
    selectedState.subscribe(value => localStorage.setItem('selectedState', value));
    selectedStateCode.subscribe(value => localStorage.setItem('selectedStateCode', value));
    daysOff.subscribe(value => localStorage.setItem('daysOff', value.toString()));
    weekendDays.subscribe(value => localStorage.setItem('weekendDays', JSON.stringify(value)));
}
