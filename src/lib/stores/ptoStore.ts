import { writable, derived } from 'svelte/store';
import type { SelectedPTODay } from '../types';

// PTO Balance Store
export const ptoBalance = writable<number>(0);
export const ptoBalanceUnit = writable<'days' | 'hours'>('days');
export const ptoBalanceAsOfDate = writable<Date>(new Date());

// PTO Accrual Store
export const ptoAccrualRate = writable<number>(0);
export const ptoAccrualUnit = writable<'days' | 'hours'>('days');
export const ptoAccrualFrequency = writable<'weekly' | 'bi-weekly' | 'monthly'>('monthly');

// Selected PTO Days Store
export const selectedPTODays = writable<SelectedPTODay[]>([]);

// Derived store for current PTO balance based on accruals and used days
export const currentPTOBalance = derived(
    [ptoBalance, ptoBalanceAsOfDate, ptoAccrualRate, ptoAccrualUnit, ptoAccrualFrequency, selectedPTODays, ptoBalanceUnit],
    ([$ptoBalance, $ptoBalanceAsOfDate, $ptoAccrualRate, $ptoAccrualUnit, $ptoAccrualFrequency, $selectedPTODays, $ptoBalanceUnit]) => {
        try {
            // Use default values if any are undefined
            const balance = $ptoBalance || 0;
            const asOfDate = $ptoBalanceAsOfDate ? new Date($ptoBalanceAsOfDate) : new Date();
            const accrualRate = $ptoAccrualRate || 0;
            const accrualUnit = $ptoAccrualUnit || 'days';
            const accrualFrequency = $ptoAccrualFrequency || 'monthly';
            const balanceUnit = $ptoBalanceUnit || 'days';
            const ptoDays = $selectedPTODays || [];

            // Calculate accrued PTO since the "as of" date
            const today = new Date();

            // Calculate days between asOfDate and today
            const daysDiff = Math.floor((today.getTime() - asOfDate.getTime()) / (1000 * 60 * 60 * 24));

            // Calculate accrued PTO based on frequency
            let accrualMultiplier = 0;

            // Use proper type assertion and check exact string values
            if ((accrualFrequency as string) === 'weekly') {
                accrualMultiplier = daysDiff / 7;
            } else if ((accrualFrequency as string) === 'bi-weekly') {
                accrualMultiplier = daysDiff / 14;
            } else {
                // Default to monthly
                accrualMultiplier = daysDiff / 30;
            }

            // Add accrued PTO
            let result = balance + (accrualRate * Math.floor(accrualMultiplier));

            // Subtract used PTO
            const usedPTO = ptoDays.length;

            // If PTO is tracked in hours, convert days to hours (assuming 8 hours per day)
            if (accrualUnit === 'hours' && balanceUnit === 'days') {
                result = result * 8;
            } else if (accrualUnit === 'days' && balanceUnit === 'hours') {
                result = result / 8;
            }

            return Math.max(0, result - usedPTO);
        } catch (e) {
            console.error('Error calculating PTO balance:', e);
            return 0; // Return 0 as a fallback
        }
    }
);

// Function to calculate available PTO on a specific date
export function getAvailablePTOOnDate(date: Date): number {
    try {
        let balance = 0;
        let asOfDate = new Date();
        let rate = 0;
        let unit: 'days' | 'hours' = 'days';
        let frequency: 'weekly' | 'bi-weekly' | 'monthly' = 'monthly';
        let days: SelectedPTODay[] = [];
        let balanceUnit: 'days' | 'hours' = 'days';

        // Get current values from stores
        ptoBalance.subscribe(value => balance = value !== undefined ? value : 0)();
        ptoBalanceAsOfDate.subscribe(value => asOfDate = value !== undefined ? new Date(value) : new Date())();
        ptoAccrualRate.subscribe(value => rate = value !== undefined ? value : 0)();
        ptoAccrualUnit.subscribe(value => unit = value !== undefined ? value : 'days')();
        ptoAccrualFrequency.subscribe(value => frequency = value !== undefined ? value : 'monthly')();
        selectedPTODays.subscribe(value => days = value !== undefined ? value : [])();
        ptoBalanceUnit.subscribe(value => balanceUnit = value !== undefined ? value : 'days')();

        // Calculate days between asOfDate and the specified date
        const daysDiff = Math.floor((date.getTime() - asOfDate.getTime()) / (1000 * 60 * 60 * 24));

        // Calculate accrued PTO based on frequency
        let accrualMultiplier = 0;

        // Use proper type assertion and check exact string values
        if ((frequency as string) === 'weekly') {
            accrualMultiplier = daysDiff / 7;
        } else if ((frequency as string) === 'bi-weekly') {
            accrualMultiplier = daysDiff / 14;
        } else {
            // Default to monthly
            accrualMultiplier = daysDiff / 30;
        }

        // Add accrued PTO
        let result = balance + (rate * Math.floor(accrualMultiplier));

        // Subtract used PTO up to the specified date
        const usedPTO = days.filter(day => day.date && day.date.getTime() <= date.getTime()).length;

        // Use a type-safe approach for unit conversions
        const isHoursUnit = (val: string): val is 'hours' => val === 'hours';
        const isDaysUnit = (val: string): val is 'days' => val === 'days';

        if (isHoursUnit(unit) && isDaysUnit(balanceUnit)) {
            result = result * 8;
        } else if (isDaysUnit(unit) && isHoursUnit(balanceUnit)) {
            result = result / 8;
        }

        return Math.max(0, result - usedPTO);
    } catch (e) {
        console.error('Error calculating available PTO:', e);
        return 0; // Return 0 as a fallback
    }
}

// Initialize with default values
export function initializePTOStores(): void {
    // Set default values first
    ptoBalance.set(0);
    ptoBalanceUnit.set('days');
    ptoBalanceAsOfDate.set(new Date());
    ptoAccrualRate.set(0);
    ptoAccrualUnit.set('days');
    ptoAccrualFrequency.set('monthly');
    selectedPTODays.set([]);

    // Then load from localStorage if available
    if (typeof window !== 'undefined') {
        try {
            const storedPTOBalance = localStorage.getItem('ptoBalance');
            const storedPTOBalanceUnit = localStorage.getItem('ptoBalanceUnit');
            const storedPTOBalanceAsOfDate = localStorage.getItem('ptoBalanceAsOfDate');
            const storedPTOAccrualRate = localStorage.getItem('ptoAccrualRate');
            const storedPTOAccrualUnit = localStorage.getItem('ptoAccrualUnit');
            const storedPTOAccrualFrequency = localStorage.getItem('ptoAccrualFrequency');
            const storedSelectedPTODays = localStorage.getItem('selectedPTODays');

            if (storedPTOBalance) ptoBalance.set(parseFloat(storedPTOBalance));
            if (storedPTOBalanceUnit) ptoBalanceUnit.set(storedPTOBalanceUnit === 'hours' ? 'hours' : 'days');
            if (storedPTOBalanceAsOfDate) ptoBalanceAsOfDate.set(new Date(storedPTOBalanceAsOfDate));
            if (storedPTOAccrualRate) ptoAccrualRate.set(parseFloat(storedPTOAccrualRate));
            if (storedPTOAccrualUnit) ptoAccrualUnit.set(storedPTOAccrualUnit === 'hours' ? 'hours' : 'days');
            if (storedPTOAccrualFrequency) {
                ptoAccrualFrequency.set(
                    storedPTOAccrualFrequency === 'weekly' ? 'weekly' :
                    storedPTOAccrualFrequency === 'bi-weekly' ? 'bi-weekly' : 'monthly'
                );
            }
            if (storedSelectedPTODays) {
                try {
                    const parsedDays = JSON.parse(storedSelectedPTODays);
                    selectedPTODays.set(parsedDays.map((day: any) => ({
                        ...day,
                        date: new Date(day.date)
                    })));
                } catch (e) {
                    console.error('Error parsing stored PTO days:', e);
                }
            }
        } catch (e) {
            console.error('Error initializing PTO stores:', e);
        }
    }
}

// Subscribe to changes and update localStorage
if (typeof window !== 'undefined') {
    ptoBalance.subscribe(value => localStorage.setItem('ptoBalance', value.toString()));
    ptoBalanceUnit.subscribe(value => localStorage.setItem('ptoBalanceUnit', value));
    ptoBalanceAsOfDate.subscribe(value => localStorage.setItem('ptoBalanceAsOfDate', value.toISOString()));
    ptoAccrualRate.subscribe(value => localStorage.setItem('ptoAccrualRate', value.toString()));
    ptoAccrualUnit.subscribe(value => localStorage.setItem('ptoAccrualUnit', value));
    ptoAccrualFrequency.subscribe(value => localStorage.setItem('ptoAccrualFrequency', value));
    selectedPTODays.subscribe(value => localStorage.setItem('selectedPTODays', JSON.stringify(value)));
}

// Function to toggle a day as selected PTO
export function toggleSelectedPTODay(date: Date): void {
    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    console.log(`Toggling PTO day with key: ${dateKey}`);

    selectedPTODays.update(days => {
        try {
            // Check if the day is already selected
            const existingIndex = days.findIndex(day => {
                if (!day.date) {
                    console.warn('Found a day without a date property in selectedPTODays');
                    return false;
                }
                const dayDate = day.date instanceof Date ? day.date : new Date(day.date);
                const storedDateKey = `${dayDate.getFullYear()}-${dayDate.getMonth()}-${dayDate.getDate()}`;
                return storedDateKey === dateKey;
            });

            let updatedDays: SelectedPTODay[];
            
            if (existingIndex >= 0) {
                // Remove the day if already selected
                updatedDays = days.filter((_, i) => i !== existingIndex);
                console.log(`Removed PTO day for ${date.toLocaleDateString()}, days remaining: ${updatedDays.length}`);
            } else {
                // Add the day if not already selected
                const newDay = { date: new Date(date) };
                updatedDays = [...days, newDay];
                console.log(`Added PTO day for ${date.toLocaleDateString()}, total days: ${updatedDays.length}`);
            }
            
            // Force update of currentPTOBalance 
            // The store is already reactive, but this logging helps debug
            let currentBalance = 0;
            currentPTOBalance.subscribe(value => currentBalance = value)();
            console.log(`Updated PTO balance: ${currentBalance.toFixed(1)}`);
            
            // Debug log the updated store state
            console.log(`Store now has ${updatedDays.length} days selected`);
            
            return updatedDays;
        } catch (error) {
            console.error('Error in toggleSelectedPTODay:', error);
            return days; // Return unchanged on error
        }
    });
}

// Function to check if a day is selected as PTO
export function isSelectedPTODay(date: Date): boolean {
    // Create a date key that only includes year, month, and day
    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    let result = false;
    let storedDays: SelectedPTODay[] = [];

    // Unsubscribe from the store subscription to prevent memory leaks
    const unsubscribe = selectedPTODays.subscribe(days => {
        storedDays = days;
        result = days.some(day => {
            // Ensure the date property is a Date object
            const dayDate = day.date instanceof Date ? day.date : new Date(day.date);
            // Create a comparable key for the stored date
            const storedDateKey = `${dayDate.getFullYear()}-${dayDate.getMonth()}-${dayDate.getDate()}`;
            // Compare the keys
            return storedDateKey === dateKey;
        });
    });
    
    // Execute the subscription once and unsubscribe
    unsubscribe();

    // Log for debugging
    if (result) {
        console.log(`Date ${date.toLocaleDateString()} IS selected. Total selected days: ${storedDays.length}`);
    } else if (storedDays.length > 0 && Math.random() < 0.01) {
        // Log occasionally to avoid flooding console
        console.log(`Date ${date.toLocaleDateString()} is NOT selected. Total days: ${storedDays.length}, First day: ${storedDays[0]?.date?.toLocaleDateString()}`);
    }

    return result;
}
