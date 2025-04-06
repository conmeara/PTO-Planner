import { writable, derived } from 'svelte/store';
import type { Holiday, ConsecutiveDaysOff, HolidaysByYear } from '../types';
import { getHolidaysForYear, optimizeDaysOff, calculateConsecutiveDaysOff } from '../utils/holidayUtils';
import { ptoData } from '../utils/ptoData';
import { selectedPTODays, visibleYears as ptoVisibleYears } from './ptoStore';

// Initial state
export const year = writable<number>(new Date().getFullYear()); // Current selected year (legacy)
export const visibleYears = ptoVisibleYears; // Sync with PTO store's visible years
export const selectedCountry = writable<string>('');
export const selectedCountryCode = writable<string>('');
export const selectedState = writable<string>('');
export const selectedStateCode = writable<string>('');
export const daysOff = writable<number>(0);
export const weekendDays = writable<number[]>([0, 6]); // Sunday, Saturday

// Cache for holidays by year
export const holidaysByYear = writable<HolidaysByYear>({});

// Current holidays for the selected year
export const holidays = derived(
    [holidaysByYear, year],
    ([$holidaysByYear, $year]) => {
        return $holidaysByYear[$year] || [];
    }
);

// Visible holidays (not hidden)
export const visibleHolidays = derived(
    holidays, 
    $holidays => $holidays.filter(h => !h.hidden)
);

// Derived store that combines holidays from all visible years
export const allVisibleYearsHolidays = derived(
    [holidaysByYear, visibleYears],
    ([$holidaysByYear, $visibleYears]) => {
        const allHolidays: Holiday[] = [];
        
        $visibleYears.forEach(year => {
            if ($holidaysByYear[year]) {
                allHolidays.push(...$holidaysByYear[year]);
            }
        });
        
        return allHolidays;
    }
);

// Derived stores
export const optimizedDaysOff = derived(
    [holidays, year, daysOff, weekendDays],
    ([$holidays, $year, $daysOff, $weekendDays]) => {
        const visibleHolidaysList = $holidays.filter(h => !h.hidden);
        return optimizeDaysOff(visibleHolidaysList, $year, $daysOff, $weekendDays);
    }
);

export const consecutiveDaysOff = derived(
    [holidays, optimizedDaysOff, year, weekendDays, selectedPTODays],
    ([$holidays, $optimizedDaysOff, $year, $weekendDays, $selectedPTODays]) => {
        const visibleHolidaysList = $holidays.filter(h => !h.hidden);
        const selectedPTODates = $selectedPTODays.map(day => day.date instanceof Date ? day.date : new Date(day.date));
        return calculateConsecutiveDaysOff(visibleHolidaysList, $optimizedDaysOff, $year, $weekendDays, selectedPTODates);
    }
);

// Update holidays for a specific year
function updateHolidaysForYear(countryCode: string, yearToUpdate: number, stateCode: string = ''): Holiday[] {
    if (!countryCode) return [];
    
    const allHolidays = getHolidaysForYear(countryCode, yearToUpdate, stateCode);
    
    // Update with proper date objects and not hidden by default
    return allHolidays.map(holiday => ({
        ...holiday,
        date: new Date(holiday.date),
        hidden: false
    }));
}

// Actions
export function updateHolidays(): void {
    let countryCode: string = '';
    let stateCode: string = '';
    let yearsToUpdate: number[] = [];
    
    // Get current values from stores
    selectedCountryCode.subscribe(value => countryCode = value)();
    selectedStateCode.subscribe(value => stateCode = value)();
    visibleYears.subscribe(value => yearsToUpdate = value)();
    
    if (countryCode && yearsToUpdate.length > 0) {
        holidaysByYear.update(existingHolidays => {
            const updatedHolidays = { ...existingHolidays };
            
            // Update holidays for each visible year
            yearsToUpdate.forEach(yearValue => {
                updatedHolidays[yearValue] = updateHolidaysForYear(countryCode, yearValue, stateCode);
                console.log(`Updated holidays for ${yearValue}: found ${updatedHolidays[yearValue].length} holidays`);
            });
            
            return updatedHolidays;
        });
        
        // Update the current year to the first visible year for legacy compatibility
        year.set(yearsToUpdate[0]);

        // Log info for debugging
        console.log(`Updated holidays for ${countryCode}, ${stateCode || 'no state'}, years: ${yearsToUpdate.join(', ')}`);
    } else {
        // Clear holidays if no country selected
        holidaysByYear.set({});
        console.log('No country selected or no visible years - cleared holidays');
    }
}

// Initialize with default values
export function initializeStores(): void {
    const defaultYear = new Date().getFullYear();
    const nextYear = defaultYear + 1;
    
    // Load from localStorage if available
    if (typeof window !== 'undefined') {
        const storedYear = localStorage.getItem('year');
        const storedVisibleYears = localStorage.getItem('visibleYears');
        const storedCountry = localStorage.getItem('selectedCountry');
        const storedCountryCode = localStorage.getItem('selectedCountryCode');
        const storedDaysOff = localStorage.getItem('daysOff');
        const storedState = localStorage.getItem('selectedState');
        const storedStateCode = localStorage.getItem('selectedStateCode');
        const storedWeekendDays = localStorage.getItem('weekendDays');
        const storedHolidaysByYear = localStorage.getItem('holidaysByYear');
        
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
        
        // Load holidaysByYear from localStorage if available
        if (storedHolidaysByYear) {
            try {
                const parsedHolidays = JSON.parse(storedHolidaysByYear);
                
                // Convert string dates back to Date objects
                const processedHolidays: HolidaysByYear = {};
                Object.entries(parsedHolidays).forEach(([year, holidays]) => {
                    processedHolidays[parseInt(year)] = (holidays as any[]).map(h => ({
                        ...h,
                        date: new Date(h.date)
                    }));
                });
                
                holidaysByYear.set(processedHolidays);
            } catch (e) {
                console.error('Error parsing stored holidays by year:', e);
                updateHolidays(); // Fall back to fetching fresh holidays
            }
        } else {
            updateHolidays(); // Fetch fresh holidays
        }
    }
}

// Subscribe to changes and update localStorage
if (typeof window !== 'undefined') {
    year.subscribe(value => localStorage.setItem('year', value.toString()));
    visibleYears.subscribe(value => localStorage.setItem('visibleYears', JSON.stringify(value)));
    selectedCountry.subscribe(value => localStorage.setItem('selectedCountry', value));
    selectedCountryCode.subscribe(value => localStorage.setItem('selectedCountryCode', value));
    selectedState.subscribe(value => localStorage.setItem('selectedState', value));
    selectedStateCode.subscribe(value => localStorage.setItem('selectedStateCode', value));
    daysOff.subscribe(value => localStorage.setItem('daysOff', value.toString()));
    weekendDays.subscribe(value => localStorage.setItem('weekendDays', JSON.stringify(value)));
    holidaysByYear.subscribe(value => localStorage.setItem('holidaysByYear', JSON.stringify(value)));
}

// Function to manually add a visible year if not already in the cache
export function ensureYearLoaded(yearToAdd: number): void {
    let countryCode: string = '';
    let stateCode: string = '';
    let holidays: HolidaysByYear = {};
    
    selectedCountryCode.subscribe(value => countryCode = value)();
    selectedStateCode.subscribe(value => stateCode = value)();
    holidaysByYear.subscribe(value => holidays = value)();
    
    if (!holidays[yearToAdd] && countryCode) {
        const yearHolidays = updateHolidaysForYear(countryCode, yearToAdd, stateCode);
        
        holidaysByYear.update(existing => ({
            ...existing,
            [yearToAdd]: yearHolidays
        }));
        
        console.log(`Added holidays for year ${yearToAdd}: found ${yearHolidays.length} holidays`);
    }
}
