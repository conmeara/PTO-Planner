import { writable, derived, get } from 'svelte/store';
import type { SelectedPTODay, CarryoverOptions, MultiYearConfig, PayPeriodTemplate, DailyLedgerEntry } from '../types';
import { toYYYYMMDD, PtoEngine, type PtoEngineConfig, sameDay } from '../utils/ptoEngine';
import { needsMigration, migrateToTransactionBasedCalculation } from '../utils/ptoMigration';

// PTO Configuration store - Single source of truth
export const ptoConfig = writable<PtoEngineConfig>({
    initialBalance: 0,
    balanceUnit: 'days',
    asOfDate: new Date(),
    accrualRate: 1,
    accrualUnit: 'days',
    accrualFrequency: 'monthly',
    visibleYears: [new Date().getFullYear(), new Date().getFullYear() + 1],
    carryover: {
        enabled: true,
        maxDays: Infinity
    },
    payPeriodTemplate: {
        frequency: 'monthly',
        dayOfMonth: 1,
        weekday: 5
    }
});

// Selected PTO Days Store
export const selectedPTODays = writable<SelectedPTODay[]>([]);

// Derived store for the daily PTO ledger using the PtoEngine
export const dailyPTOLedger = derived(
    [ptoConfig, selectedPTODays],
    ([$ptoConfig, $selectedPTODays]) => {
        try {
            console.log("-------- RECALCULATING PTO LEDGER --------");
            console.log(`Initial balance: ${$ptoConfig.initialBalance}, As of: ${$ptoConfig.asOfDate.toDateString()}`);
            console.log(`Accrual: ${$ptoConfig.accrualRate} ${$ptoConfig.accrualUnit} per ${$ptoConfig.accrualFrequency}`);
            console.log(`Selected PTO days: ${$selectedPTODays.length}`);
            if ($selectedPTODays.length > 0) {
                console.log("Selected PTO dates:");
                $selectedPTODays.forEach(day => {
                    console.log(`- ${day.date.toDateString()}`);
                });
            }
            console.log(`Balance unit: ${$ptoConfig.balanceUnit}`);
            console.log(`Visible years: ${$ptoConfig.visibleYears.join(', ')}`);
            console.log(`Carryover enabled: ${$ptoConfig.carryover.enabled}, Max: ${$ptoConfig.carryover.maxDays === Infinity ? 'unlimited' : $ptoConfig.carryover.maxDays}`);
            console.log(`Pay period: ${$ptoConfig.payPeriodTemplate?.frequency} (${
                $ptoConfig.payPeriodTemplate?.frequency === 'monthly' 
                    ? `Day ${$ptoConfig.payPeriodTemplate?.dayOfMonth}` 
                    : `Weekday ${$ptoConfig.payPeriodTemplate?.weekday}`
            })`);
            
            // Create engine instance with the current configuration
            const engine = new PtoEngine($ptoConfig);
            
            // Build the ledger with selected PTO days
            const ledger = engine.buildLedger($selectedPTODays);
            
            // Log sample balances for debugging
            $ptoConfig.visibleYears.forEach(year => {
                console.log(`Sample balances for ${year}:`);
                const dates = [
                    new Date(year, 0, 1),  // January 1
                    new Date(year, 3, 1),  // April 1
                    new Date(year, 6, 1),  // July 1
                    new Date(year, 9, 1),  // October 1
                    new Date(year, 11, 31) // December 31
                ];
                
                dates.forEach(date => {
                    const dateKey = toYYYYMMDD(date);
                    if (ledger[dateKey]) {
                        const balance = ledger[dateKey].balance.toFixed(1);
                        console.log(`- ${date.toLocaleDateString()}: ${balance} ${$ptoConfig.balanceUnit}`);
                    }
                });
            });
            
            console.log("------------------------------------------");
            return ledger;
        } catch (e) {
            console.error('Error calculating PTO ledger:', e);
            return {}; // Return empty ledger on error
        }
    }
);

// Derived store for visible years for convenient access
export const visibleYears = derived(
    ptoConfig,
    ($ptoConfig) => $ptoConfig.visibleYears
);

// Derived store for current PTO balance (as of today)
export const currentPTOTodayBalance = derived(
    [ptoConfig, dailyPTOLedger],
    ([$ptoConfig, $dailyPTOLedger]) => {
        try {
            const today = new Date();
            const engine = new PtoEngine($ptoConfig);
            return engine.getBalanceOnDate($dailyPTOLedger, today);
        } catch (e) {
            console.error('Error getting current PTO balance:', e);
            return 0; // Return 0 as a fallback
        }
    }
);

// Legacy - Points to currentPTOTodayBalance for backwards compatibility
export const currentPTOBalance = currentPTOTodayBalance;

// Function to get available PTO on a specific date (using the derived ledger)
export function getAvailablePTOOnDate(date: Date): number {
    // Use get() for synchronous access to the derived ledger value
    const config = get(ptoConfig);
    const ledger = get(dailyPTOLedger);

    if (!config) {
        console.error('PTO config not available when checking balance');
        return 0;
    }

    const engine = new PtoEngine(config);
    // Ensure the date is normalized (start of day) before checking
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    const balance = engine.getBalanceOnDate(ledger, checkDate);

    // Optional log for debugging balance checks
    // console.log(`Balance check for ${toYYYYMMDD(checkDate)}: ${balance.toFixed(2)}`);
    return balance;
}

// Initialize PTO stores
export function initializePTOStores(): void {
    // Check if we need to migrate from old PTO calculation
    if (needsMigration()) {
        migrateToTransactionBasedCalculation();
    }

    // Set default values first
    ptoConfig.set({
        initialBalance: 0,
        balanceUnit: 'days',
        asOfDate: new Date(),
        accrualRate: 1,
        accrualUnit: 'days',
        accrualFrequency: 'monthly',
        visibleYears: [new Date().getFullYear(), new Date().getFullYear() + 1],
        carryover: {
            enabled: true,
            maxDays: Infinity
        },
        payPeriodTemplate: {
            frequency: 'monthly',
            dayOfMonth: 1,
            weekday: 5 // Friday
        }
    });
    
    selectedPTODays.set([]);

    // Then load from localStorage if available
    if (typeof window !== 'undefined') {
        try {
            // Load legacy values
            const storedPTOBalance = localStorage.getItem('ptoBalance');
            const storedPTOBalanceUnit = localStorage.getItem('ptoBalanceUnit');
            const storedPTOBalanceAsOfDate = localStorage.getItem('ptoBalanceAsOfDate');
            const storedPTOAccrualRate = localStorage.getItem('ptoAccrualRate');
            const storedPTOAccrualUnit = localStorage.getItem('ptoAccrualUnit');
            const storedPTOAccrualFrequency = localStorage.getItem('ptoAccrualFrequency');
            const storedSelectedPTODays = localStorage.getItem('selectedPTODays');
            const storedMultiYearConfig = localStorage.getItem('multiYearConfig');
            const storedPayPeriodTemplate = localStorage.getItem('payPeriodTemplate');
            
            // Update ptoConfig with stored values
            ptoConfig.update(config => {
                const updatedConfig = { ...config };
                
                if (storedPTOBalance) {
                    updatedConfig.initialBalance = parseFloat(storedPTOBalance);
                }
                if (storedPTOBalanceUnit) {
                    updatedConfig.balanceUnit = storedPTOBalanceUnit as 'days' | 'hours';
                }
                if (storedPTOBalanceAsOfDate) {
                    updatedConfig.asOfDate = new Date(storedPTOBalanceAsOfDate);
                }
                if (storedPTOAccrualRate) {
                    updatedConfig.accrualRate = parseFloat(storedPTOAccrualRate);
                }
                if (storedPTOAccrualUnit) {
                    updatedConfig.accrualUnit = storedPTOAccrualUnit as 'days' | 'hours';
                }
                if (storedPTOAccrualFrequency) {
                    updatedConfig.accrualFrequency = storedPTOAccrualFrequency as 'weekly' | 'bi-weekly' | 'monthly';
                }
                if (storedMultiYearConfig) {
                    const parsed = JSON.parse(storedMultiYearConfig);
                    updatedConfig.visibleYears = parsed.visibleYears || updatedConfig.visibleYears;
                    updatedConfig.carryover = parsed.carryover || updatedConfig.carryover;
                }
                if (storedPayPeriodTemplate) {
                    updatedConfig.payPeriodTemplate = JSON.parse(storedPayPeriodTemplate);
                }
                
                return updatedConfig;
            });
            
            // Update selected PTO days
            if (storedSelectedPTODays) {
                try {
                    const ptoDays = JSON.parse(storedSelectedPTODays);
                    
                    // Convert date strings to Date objects
                    const processedPtoDays = ptoDays.map((day: any) => ({
                        date: new Date(day.date)
                    }));
                    
                    selectedPTODays.set(processedPtoDays);
                } catch (e) {
                    console.error('Error parsing stored selected PTO days:', e);
                    selectedPTODays.set([]);
                }
            }
            
            console.log('PTO configuration loaded from localStorage');
        } catch (e) {
            console.error('Error loading PTO data from localStorage:', e);
            // Keep default values on error
        }
    }
}

// Subscribe to changes and update localStorage
if (typeof window !== 'undefined') {
    ptoConfig.subscribe(value => {
        localStorage.setItem('ptoBalance', value.initialBalance.toString());
        localStorage.setItem('ptoBalanceUnit', value.balanceUnit);
        localStorage.setItem('ptoBalanceAsOfDate', value.asOfDate.toISOString());
        localStorage.setItem('ptoAccrualRate', value.accrualRate.toString());
        localStorage.setItem('ptoAccrualUnit', value.accrualUnit);
        localStorage.setItem('ptoAccrualFrequency', value.accrualFrequency);
        localStorage.setItem('multiYearConfig', JSON.stringify({
            visibleYears: value.visibleYears,
            carryover: value.carryover
        }));
        localStorage.setItem('payPeriodTemplate', JSON.stringify(value.payPeriodTemplate));
    });
    
    selectedPTODays.subscribe(value => {
        localStorage.setItem('selectedPTODays', JSON.stringify(value));
    });
}

// Function to toggle selected PTO day - Refactored for validation
export function toggleSelectedPTODay(date: Date): void {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0); // Normalize target date to start of day

    // Get current state synchronously using get()
    const currentConfig = get(ptoConfig);
    const currentSelectedDays = get(selectedPTODays);

    // Check if the target date is already selected
    const isCurrentlySelected = currentSelectedDays.some(day => sameDay(day.date, targetDate));

    if (isCurrentlySelected) {
        // --- REMOVING A PTO DAY ---
        console.log(`Removing PTO day: ${targetDate.toDateString()}`);
        // Update the store by filtering out the target date
        selectedPTODays.update(days =>
            days.filter(day => !sameDay(day.date, targetDate))
        );
        console.log(`Selected days count after removal: ${get(selectedPTODays).length}`);

    } else {
        // --- ADDING A NEW PTO DAY ---
        console.log(`Attempting to add PTO day: ${targetDate.toDateString()}`);

        // Ensure configuration is loaded
        if (!currentConfig) {
            console.error('PTO config not available when adding PTO day.');
            alert('Configuration error. Cannot add PTO day.');
            return;
        }

        // Prevent selecting dates before the configured 'as of' date
        const asOfDateStart = new Date(currentConfig.asOfDate);
        asOfDateStart.setHours(0, 0, 0, 0);
        if (targetDate < asOfDateStart) {
            const msg = `Cannot select PTO date ${targetDate.toLocaleDateString()} as it's before the configuration start date ${asOfDateStart.toLocaleDateString()}.`;
            console.warn(msg);
            alert(msg);
            return;
        }

        // Determine the amount of PTO needed for one day based on the balance unit
        const usageAmount = currentConfig.balanceUnit === 'hours' ? 8 : 1;

        // Check the available balance *on the target date* using the current ledger state
        const balanceBeforeAdd = getAvailablePTOOnDate(targetDate);

        console.log(`Checking balance for ${targetDate.toLocaleDateString()}: Available = ${balanceBeforeAdd.toFixed(2)}, Needed = ${usageAmount.toFixed(2)}`);

        // Validate if there is sufficient balance
        if (balanceBeforeAdd < usageAmount) {
            // Not enough PTO available
            const msg = `Not enough PTO available to select ${targetDate.toLocaleDateString()}.
Available on this date: ${balanceBeforeAdd.toFixed(2)} ${currentConfig.balanceUnit}
Required: ${usageAmount.toFixed(2)} ${currentConfig.balanceUnit}`;
            console.warn(msg);
            alert(msg);
            return; // Stop the process
        }

        // Sufficient balance confirmed, proceed to add the day
        console.log(`Adding PTO day: ${targetDate.toDateString()} (Balance sufficient)`);
        selectedPTODays.update(days => [
            // Add the new day object
            ...days,
            { date: new Date(targetDate) } // Store a new Date instance
        // Keep the array sorted by date for consistency
        ].sort((a, b) => a.date.getTime() - b.date.getTime()));

        console.log(`Selected days count after addition: ${get(selectedPTODays).length}`);
    }

    // Note: The 'dailyPTOLedger' derived store will automatically recalculate
    // due to the change in 'selectedPTODays'. No need for manual triggering.
}

// Check if a date is a selected PTO day
export function isSelectedPTODay(date: Date): boolean {
    // Use get() for synchronous access
    const currentSelectedDays = get(selectedPTODays);
    const checkDate = new Date(date); // Normalize check date
    checkDate.setHours(0,0,0,0);

    return currentSelectedDays.some(day => sameDay(day.date, checkDate));
}

// Function to update visible years
export function updateVisibleYears(years: number[]): void {
    ptoConfig.update(config => ({
        ...config,
        visibleYears: years
    }));
}

// Function to update carryover settings
export function updateCarryoverSettings(settings: CarryoverOptions): void {
    ptoConfig.update(config => ({
        ...config,
        carryover: settings
    }));
}

// Function to update pay period template
export function updatePayPeriodTemplate(template: PayPeriodTemplate): void {
    ptoConfig.update(config => ({
        ...config,
        payPeriodTemplate: template,
        accrualFrequency: template.frequency // Keep accrual frequency in sync with pay period
    }));
}

// Update initial PTO balance
export function updateInitialPTOBalance(balance: number): void {
    ptoConfig.update(config => ({
        ...config,
        initialBalance: balance
    }));
    
    // Log the update
    console.log(`Updated initial PTO balance to ${balance}`);
    
    // Force a recalculation
    let currentBalance = 0;
    currentPTOTodayBalance.subscribe(value => {
        currentBalance = value;
    })();
    
    console.log(`New current PTO balance: ${currentBalance}`);
}