import type { SelectedPTODay, DailyLedgerEntry, CarryoverOptions, PtoTransaction, PayPeriodTemplate } from '../types';

// Utility for date formatting (YYYY-MM-DD)
export function toYYYYMMDD(date: Date): string {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
}

// Utility to check if two dates are the same day
export function sameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
}

// Utility to get end of the year date
export function endOfYear(date: Date): Date {
    return new Date(date.getFullYear(), 11, 31);
}

// Utility to get start of the year date
export function startOfYear(year: number): Date {
    return new Date(year, 0, 1);
}

// Utility to check if a date is December 31st
export function isYearEnd(date: Date): boolean {
    return date.getMonth() === 11 && date.getDate() === 31;
}

/**
 * Configuration interface for PTO Engine
 */
export interface PtoEngineConfig {
    initialBalance: number;
    balanceUnit: 'days' | 'hours';
    asOfDate: Date;
    accrualRate: number;
    accrualUnit: 'days' | 'hours';
    accrualFrequency: 'weekly' | 'bi-weekly' | 'monthly';
    visibleYears: number[];
    carryover: CarryoverOptions;
    payPeriodTemplate?: PayPeriodTemplate;
}

/**
 * Centralized engine class for calculating PTO ledgers and balances
 */
export class PtoEngine {
    private config: PtoEngineConfig;
    
    constructor(config: PtoEngineConfig) {
        this.config = {
            ...config,
            payPeriodTemplate: config.payPeriodTemplate || {
                frequency: config.accrualFrequency,
                dayOfMonth: 1,
                weekday: 5 // Default Friday if weekly/bi-weekly
            }
        };
    }
    
    /**
     * Builds the full PTO ledger by generating, sorting, and processing all transactions.
     */
    public buildLedger(selectedPtoDays: SelectedPTODay[] = []): Record<string, DailyLedgerEntry> {
        console.log("--- PtoEngine: Starting buildLedger ---");
        console.log("Config:", this.config);
        console.log(`Selected PTO Days: ${selectedPtoDays.length}`);

        // 1. Generate initial set of transactions (excluding carryover)
        const initialBalanceTransaction = this.generateInitialBalanceTransaction();
        const accrualTransactions = this.generateAccrualTransactions();
        const usageTransactions = this.generateUsageTransactions(selectedPtoDays);

        // 2. Combine and sort transactions before calculating carryover
        let transactionsBeforeCarryover = [
            initialBalanceTransaction,
            ...accrualTransactions,
            ...usageTransactions
        ];
        transactionsBeforeCarryover.sort((a, b) => a.date.getTime() - b.date.getTime());

        console.log(`Generated ${transactionsBeforeCarryover.length} transactions before carryover.`);

        // 3. Generate carryover transactions based on the state *before* carryover adjustments
        const carryoverTransactions = this.generateCarryoverTransactions(transactionsBeforeCarryover);
        console.log(`Generated ${carryoverTransactions.length} carryover transactions.`);

        // 4. Combine all transactions and re-sort
        let allTransactions = [...transactionsBeforeCarryover, ...carryoverTransactions];
        allTransactions.sort((a, b) => {
            if (a.date.getTime() !== b.date.getTime()) {
                return a.date.getTime() - b.date.getTime();
            }
            // Ensure consistent order for same-day transactions (e.g., accrual before usage)
            const typeOrder = { 'adjustment': 1, 'accrual': 2, 'carryover': 3, 'usage': 4 };
             return (typeOrder[a.type] || 99) - (typeOrder[b.type] || 99);
        });
        console.log(`Total transactions to process: ${allTransactions.length}`);


        // 5. Build the final daily ledger from the complete, sorted transaction list
        const ledger = this.buildDailyLedgerFromTransactions(allTransactions);
        console.log("--- PtoEngine: Finished buildLedger ---");

        // Optional: Log ledger details for debugging
        // this.logLedgerDetails(ledger, allTransactions);

        return ledger;
    }
    
    /**
     * Get the balance available on a specific date from a ledger
     */
    public getBalanceOnDate(ledger: Record<string, DailyLedgerEntry>, date: Date): number {
        const dateKey = toYYYYMMDD(date);
        
        // If exact date exists in ledger
        if (ledger[dateKey]) {
            return ledger[dateKey].balance;
        }
        
        // Get all dates in ledger, sort them to be sure
        const ledgerDates = Object.keys(ledger).sort();
        if (ledgerDates.length === 0) {
             // If ledger is empty, return initial balance if date is on or after asOfDate
            return date >= this.config.asOfDate ? this.config.initialBalance : 0;
        }
        
        const firstLedgerDateKey = ledgerDates[0];
        const lastLedgerDateKey = ledgerDates[ledgerDates.length - 1];
        
        // If date is before the first entry in the ledger
        if (dateKey < firstLedgerDateKey) {
             // Before the ledger starts, the balance is effectively 0, unless it's the asOfDate itself
             return sameDay(date, this.config.asOfDate) ? this.config.initialBalance : 0;
        }
        
        // If date is after the last entry in the ledger
        if (dateKey > lastLedgerDateKey) {
            return ledger[lastLedgerDateKey].balance; // Return the last known balance
        }
        
        // Find the entry for the closest date <= the requested date
        let closestBalance = 0; // Default if no earlier date found (shouldn't happen with above checks)
        // Iterate backwards for efficiency
        for (let i = ledgerDates.length - 1; i >= 0; i--) {
            if (ledgerDates[i] <= dateKey) {
                closestBalance = ledger[ledgerDates[i]].balance;
                break;
            }
        }
        
        return closestBalance;
    }


    /**
     * Generates the single transaction representing the initial balance.
     */
    private generateInitialBalanceTransaction(): PtoTransaction {
         // Ensure asOfDate time is set to the start of the day for consistency
        const startOfAsOfDate = new Date(this.config.asOfDate);
        startOfAsOfDate.setHours(0, 0, 0, 0);

        return {
            date: startOfAsOfDate,
            type: 'adjustment',
            amount: this.config.initialBalance,
            note: 'Initial balance'
        };
    }


    /**
     * Generate accrual transactions based on accrual configuration.
     * Starts calculation from the first accrual date *on or after* the asOfDate.
     */
    private generateAccrualTransactions(): PtoTransaction[] {
        const accrualTransactions: PtoTransaction[] = [];
        const startDate = new Date(this.config.asOfDate); // Start considering accruals from this date
        startDate.setHours(0,0,0,0);
        const endDate = this.getEndDate(); // Last day of the visible range

        // Find the *first* accrual event date that is on or after the startDate
        let currentDate = this.findFirstAccrualDate(startDate);
        if (!currentDate || currentDate > endDate) {
             console.log("No accrual dates found within the visible range starting from asOfDate.");
            return []; // No accruals if the first one is outside the visible range
        }

        // Normalize accrual rate based on units
        const normalizedAccrualRate = this.normalizeAmount(this.config.accrualRate, this.config.accrualUnit);

        console.log(`Generating accrual transactions: ${normalizedAccrualRate} ${this.config.balanceUnit} per ${this.config.accrualFrequency}`);
        console.log(`Accrual period considered: ${startDate.toDateString()} to ${endDate.toDateString()}`);
        console.log(`First accrual date calculated as: ${currentDate.toDateString()}`);


        // Generate accrual transactions until the end date
        let transactionCount = 0;
        while (currentDate <= endDate) {
            accrualTransactions.push({
                date: new Date(currentDate), // Use a new Date object
                type: 'accrual',
                amount: normalizedAccrualRate,
                note: `Regular ${this.config.accrualFrequency} accrual`
            });
            transactionCount++;

            // Calculate the next accrual date based on the *current* accrual date
            const nextDate = this.getNextAccrualDate(currentDate);
             // Safety break to prevent infinite loops if getNextAccrualDate has issues
            if (nextDate <= currentDate) {
                console.error("Error: Next accrual date is not advancing. Breaking loop.", { currentDate, nextDate });
                break;
            }
            currentDate = nextDate;
        }

        console.log(`Generated ${transactionCount} accrual transactions.`);
        return accrualTransactions;
    }

     /**
     * Finds the first date on or after the given start date that an accrual should occur,
     * based on the configured frequency and template.
     */
    private findFirstAccrualDate(startDate: Date): Date | null {
        let potentialDate = new Date(startDate);
        potentialDate.setHours(0, 0, 0, 0); // Normalize to start of day

        const template = this.config.payPeriodTemplate;
        if (!template) {
             console.warn("Pay period template is missing, cannot calculate accrual dates accurately.");
             return null; // Cannot determine accrual without a template
        }


        // Iterate forward, checking each potential date against the template rules
        for (let i = 0; i < 366 * 2; i++) { // Limit search to prevent infinite loops (~2 years check)
             switch (template.frequency) {
                case 'monthly':
                    const targetDayOfMonth = template.dayOfMonth ?? 1;
                    // Check if potentialDate is the correct day of the month
                    if (potentialDate.getDate() === targetDayOfMonth) {
                         // If it's also on or after the start date, we found it
                        if (potentialDate >= startDate) return potentialDate;
                         // Otherwise, move to the target day in the *next* month
                         potentialDate = new Date(potentialDate.getFullYear(), potentialDate.getMonth() + 1, targetDayOfMonth);

                    } else if (potentialDate.getDate() < targetDayOfMonth) {
                         // If current day is before target, try target day in current month
                         const dateInCurrentMonth = new Date(potentialDate.getFullYear(), potentialDate.getMonth(), targetDayOfMonth);
                         // Ensure we don't skip months if target day doesn't exist (e.g., Feb 31)
                        if (dateInCurrentMonth.getMonth() === potentialDate.getMonth()) {
                             potentialDate = dateInCurrentMonth;
                              if (potentialDate >= startDate) return potentialDate;
                        }
                         // If target day doesn't exist or is before start date, go to next month's target day
                         potentialDate = new Date(potentialDate.getFullYear(), potentialDate.getMonth() + 1, targetDayOfMonth);


                    } else { // potentialDate.getDate() > targetDayOfMonth
                        // If current day is past the target, go to next month's target day
                         potentialDate = new Date(potentialDate.getFullYear(), potentialDate.getMonth() + 1, targetDayOfMonth);
                    }
                    break; // Break switch after handling monthly


                 case 'weekly':
                 case 'bi-weekly':
                    const targetWeekday = template.weekday ?? 5; // Default to Friday
                    // Check if potentialDate is the correct weekday
                    if (potentialDate.getDay() === targetWeekday) {
                        // If it's on or after start date, check bi-weekly rule if needed
                        if (potentialDate >= startDate) {
                            if (template.frequency === 'bi-weekly') {
                                // Simple bi-weekly check: Is it an even or odd week relative to an anchor?
                                // Let's use Jan 1, 2024 (Monday) as an anchor week.
                                const anchorDate = new Date(2024, 0, 1);
                                const diffWeeks = Math.floor((potentialDate.getTime() - anchorDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
                                if (diffWeeks % 2 === 0) { // Assuming accrual on even weeks relative to anchor
                                    return potentialDate;
                                }
                             } else { // Weekly
                                 return potentialDate;
                             }
                        }
                    }
                     // Move to the next day if the current date didn't match or wasn't the correct week
                     potentialDate.setDate(potentialDate.getDate() + 1);
                     break; // Break switch after handling weekly/bi-weekly

                 default:
                     console.error(`Unsupported accrual frequency: ${template.frequency}`);
                     return null;
             }

            // Safety check for date validity
            if (isNaN(potentialDate.getTime())) {
                 console.error("Generated invalid date during first accrual date search. Breaking.");
                return null;
            }
        }

         console.warn("Could not find the first accrual date within the search limit.");
        return null; // Return null if no date found within limit
    }


    /**
     * Generate PTO usage transactions from selected PTO days.
     */
    private generateUsageTransactions(selectedPtoDays: SelectedPTODay[]): PtoTransaction[] {
         // Filter out any invalid or duplicate dates, and dates before asOfDate
        const uniqueValidDates = new Set<string>();
         const validDays = selectedPtoDays.filter(day => {
             if (!day || !day.date || isNaN(day.date.getTime())) return false;
              // Normalize date to start of day for comparison and uniqueness check
             const dateOnly = new Date(day.date);
             dateOnly.setHours(0, 0, 0, 0);

             // Ignore dates before the asOfDate
             const asOfDateStart = new Date(this.config.asOfDate);
             asOfDateStart.setHours(0,0,0,0);
             if (dateOnly < asOfDateStart) {
                 console.warn(`Ignoring selected PTO date ${dateOnly.toDateString()} as it's before the as-of date ${asOfDateStart.toDateString()}`);
                 return false;
             }


             const dateKey = toYYYYMMDD(dateOnly);
             if (uniqueValidDates.has(dateKey)) {
                 return false; // Already added
             }
             uniqueValidDates.add(dateKey);
             return true;
         });


        // Normalize usage amount based on units
        const normalizedUsageAmount = this.normalizeAmount(1, 'days'); // Assuming 1 day usage


        console.log(`Generating ${validDays.length} usage transactions.`);


        return validDays.map(day => {
             const usageDate = new Date(day.date);
             usageDate.setHours(0, 0, 0, 0); // Ensure start of day
             return {
                 date: usageDate,
                 type: 'usage',
                 amount: -Math.abs(normalizedUsageAmount), // Ensure usage is negative
                 note: 'PTO Used'
             };
        });
    }


    /**
     * Generate carryover adjustment transactions based on year-end balances.
     * Takes the list of transactions *before* carryover to calculate balances.
     */
    private generateCarryoverTransactions(transactionsBeforeCarryover: PtoTransaction[]): PtoTransaction[] {
        const carryoverTransactions: PtoTransaction[] = [];
        if (!this.config.carryover?.enabled || !this.config.visibleYears || this.config.visibleYears.length === 0) {
            return [];
        }

        const maxCarryover = this.config.carryover.maxDays === Infinity
            ? Infinity
            : this.normalizeAmount(this.config.carryover.maxDays, 'days'); // Normalize max carryover based on balance unit


        console.log(`Generating carryover transactions. Max carryover: ${maxCarryover === Infinity ? 'Unlimited' : maxCarryover + ` ${this.config.balanceUnit}`}`);


        // Iterate through each year boundary within the visible range
         // We need to check the end of year N to determine carryover for year N+1
         // So iterate up to the second-to-last visible year.
        const relevantYears = this.config.visibleYears.slice().sort((a, b) => a - b);
         for (let i = 0; i < relevantYears.length -1; i++) {
             const year = relevantYears[i];
             const endOfYearDate = new Date(year, 11, 31);
             endOfYearDate.setHours(23, 59, 59, 999); // Ensure we capture all transactions on Dec 31st


             // Calculate balance at the very end of the year using transactions *before* carryover
            const yearEndBalance = this.calculateBalanceAtDate(transactionsBeforeCarryover, endOfYearDate);


             if (yearEndBalance > maxCarryover) {
                const reductionAmount = yearEndBalance - maxCarryover;
                 const nextYearStartDate = new Date(year + 1, 0, 1); // January 1st of next year
                 nextYearStartDate.setHours(0, 0, 0, 0);


                carryoverTransactions.push({
                    date: nextYearStartDate,
                    type: 'carryover', // Or 'adjustment' if type 'carryover' isn't specifically handled
                    amount: -Math.abs(reductionAmount), // Negative amount to reduce balance
                    note: `Carryover adjustment: Exceeded max ${maxCarryover}. Reduced by ${reductionAmount}.`
                });
                 console.log(`Carryover for ${year + 1}: Balance at end of ${year} (${yearEndBalance.toFixed(2)}) exceeded max (${maxCarryover}). Adding adjustment of ${-reductionAmount.toFixed(2)} on ${nextYearStartDate.toDateString()}`);
             } else {
                 console.log(`Carryover for ${year + 1}: Balance at end of ${year} (${yearEndBalance.toFixed(2)}) is within max (${maxCarryover}). No adjustment needed.`);
             }
         }


        return carryoverTransactions;
    }


    /**
     * Builds the day-by-day ledger by applying sorted transactions chronologically.
     * Ensures balances do not drop below zero.
     */
    private buildDailyLedgerFromTransactions(transactions: PtoTransaction[]): Record<string, DailyLedgerEntry> {
        const ledger: Record<string, DailyLedgerEntry> = {};
        if (transactions.length === 0) {
            // Handle edge case with no transactions (e.g., only initial balance matters)
            const initialTx = this.generateInitialBalanceTransaction();
             if (initialTx.date >= this.getStartDate() && initialTx.date <= this.getEndDate()) {
                 const initialDateKey = toYYYYMMDD(initialTx.date);
                 ledger[initialDateKey] = {
                     balance: Math.max(0, initialTx.amount), // Ensure initial balance isn't negative
                     transactions: [initialTx]
                 };
             }
            return ledger;
        }


        let runningBalance = 0;
        // Find the date of the first transaction to start the iteration
        // Note: The first transaction might be the initial balance, which could be before the visible range starts
        // We should iterate from the *later* of the first transaction date or the start of the visible range.

         const firstTransactionDate = transactions[0].date;
         const rangeStartDate = this.getStartDate(); // Start of the earliest visible year
         const iterationStartDate = firstTransactionDate < rangeStartDate ? rangeStartDate : firstTransactionDate;
         iterationStartDate.setHours(0,0,0,0);


         // Determine initial balance *at the iterationStartDate*
         // We need to apply transactions that occurred *before* or *on* the iteration start date
          transactions.forEach(tx => {
             if (tx.date < iterationStartDate) {
                 runningBalance += tx.amount;
             }
         });
          // Clamp initial running balance at zero before starting the main loop
         runningBalance = Math.max(0, runningBalance);
         console.log(`Starting ledger build from ${iterationStartDate.toDateString()}. Initial calculated running balance: ${runningBalance.toFixed(2)}`);


        const iterationEndDate = this.getEndDate(); // Last day of the last visible year
        iterationEndDate.setHours(0,0,0,0);


        let transactionIndex = 0;
         // Find the index of the first transaction occurring on or after iterationStartDate
         while (transactionIndex < transactions.length && transactions[transactionIndex].date < iterationStartDate) {
             transactionIndex++;
         }


        // Iterate day by day from the start date to the end date
        for (let d = new Date(iterationStartDate); d <= iterationEndDate; d.setDate(d.getDate() + 1)) {
            const currentDate = new Date(d); // Work with a copy
            currentDate.setHours(0, 0, 0, 0); // Normalize date
            const dateKey = toYYYYMMDD(currentDate);
            let dailyTransactions: PtoTransaction[] = [];


            // Apply all transactions that occur on the current day
            while (transactionIndex < transactions.length && sameDay(transactions[transactionIndex].date, currentDate)) {
                const tx = transactions[transactionIndex];
                const previousBalance = runningBalance; // Balance before this specific transaction


                 // Apply the transaction amount
                runningBalance += tx.amount;


                 // Clamp balance at 0 after each transaction application
                // If usage drops below zero, clamp it, but record the attempted transaction
                 if (tx.type === 'usage' && runningBalance < 0) {
                     console.warn(`PTO Usage Warning on ${dateKey}: Attempted usage of ${Math.abs(tx.amount)} units from balance ${previousBalance.toFixed(2)} resulted in negative balance. Clamping balance to 0.`);
                     runningBalance = 0;
                 } else if (runningBalance < 0 && tx.type !== 'usage') {
                      // For non-usage types (like carryover reduction), still clamp at 0
                      runningBalance = 0;
                 }


                dailyTransactions.push(tx);
                transactionIndex++;
            }


            // Always record the balance for the day within the iteration range.
             ledger[dateKey] = {
                 balance: runningBalance, // Store the balance *after* all transactions for the day
                 transactions: dailyTransactions // Store transactions applied *on* this day
             };
        }
        console.log(`Built ledger with ${Object.keys(ledger).length} daily entries.`);
        return ledger;
    }


    /**
     * Helper to calculate the balance at a specific point in time using a list of transactions.
     * Crucially, this uses the ledger generated *from those transactions* to respect clamping rules.
     */
    private calculateBalanceAtDate(transactions: PtoTransaction[], date: Date): number {
        // --- REVISED APPROACH for Carryover Calculation ---
        // Build a temporary ledger using *only* the provided transactions (e.g., transactionsBeforeCarryover)
        const tempLedger = this.buildDailyLedgerFromTransactions(transactions);
        // Get the balance from this temporary ledger using the existing robust method,
        // ensuring we respect the balance clamping logic inherent in the ledger build.
        return this.getBalanceOnDate(tempLedger, date);
        // --- END REVISED APPROACH ---
    }


    /**
     * Gets the end date for ledger generation (last day of the last visible year).
     */
    private getEndDate(): Date {
        const lastYear = Math.max(...this.config.visibleYears);
        const endDate = new Date(lastYear, 11, 31); // December 31st
        endDate.setHours(23, 59, 59, 999); // End of the day
        return endDate;
    }

     /**
     * Gets the start date for ledger generation (first day of the first visible year).
     */
      private getStartDate(): Date {
        const firstYear = Math.min(...this.config.visibleYears);
        const startDate = new Date(firstYear, 0, 1); // January 1st
        startDate.setHours(0, 0, 0, 0); // Start of the day
        return startDate;
    }


    /**
     * Calculates the next date an accrual should occur based on the frequency and template.
     * Input `currentDate` is the date of the *last* accrual or the `asOfDate` if finding the first one.
     */
    private getNextAccrualDate(currentDate: Date): Date {
         const nextDate = new Date(currentDate); // Start from the current date
         const template = this.config.payPeriodTemplate;


         if (!template) {
             console.error("Cannot calculate next accrual date without pay period template.");
             // Return a date far in the future to stop accrual generation
             return new Date(9999, 0, 1);
         }


         switch (template.frequency) {
             case 'monthly':
                 const targetDay = template.dayOfMonth ?? 1;
                 // Move to the first day of the *next* month
                 nextDate.setMonth(nextDate.getMonth() + 1);
                 nextDate.setDate(targetDay);
                 // Handle cases where targetDay doesn't exist (e.g., Feb 31 -> Mar 3)
                 // If setting the date rolled the month over, it means targetDay was too large.
                 // Settle for the last day of the *intended* month.
                 // Example: If current was Jan 31, next month is Feb. Setting date to 31 results in Mar 3.
                 // We need Feb 28/29.
                 // Let's reset: Go to 1st of next month, then set day. If month changes, use last day of prev month.
                 const intendedMonth = (currentDate.getMonth() + 1) % 12;
                 const tempDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, targetDay);
                  if (tempDate.getMonth() !== intendedMonth) {
                      // Rollback happened, use last day of the intended month
                       return new Date(currentDate.getFullYear(), intendedMonth + 1, 0); // Day 0 gives last day of previous month
                  } else {
                      return tempDate;
                  }


             case 'weekly':
                 nextDate.setDate(nextDate.getDate() + 7); // Simply add 7 days
                 break;


             case 'bi-weekly':
                 nextDate.setDate(nextDate.getDate() + 14); // Simply add 14 days
                 break;


             default:
                 console.error(`Unsupported frequency for getNextAccrualDate: ${template.frequency}`);
                 // Return date far in the future
                 return new Date(9999, 0, 1);
         }
          nextDate.setHours(0,0,0,0); // Normalize time
         return nextDate;
     }

     /**
     * Normalizes an amount from a given unit ('days' or 'hours') to the engine's configured balanceUnit.
     */
     private normalizeAmount(amount: number, unit: 'days' | 'hours'): number {
         if (unit === this.config.balanceUnit) {
             return amount; // No conversion needed
         } else if (unit === 'hours' && this.config.balanceUnit === 'days') {
             return amount / 8; // Convert hours to days (assuming 8-hour workday)
         } else if (unit === 'days' && this.config.balanceUnit === 'hours') {
             return amount * 8; // Convert days to hours
         }
         console.warn(`Unhandled unit conversion from ${unit} to ${this.config.balanceUnit}. Returning original amount.`);
         return amount; // Fallback if units mismatch unexpectedly
     }


    // Optional: Helper for debugging
    /*
    private logLedgerDetails(ledger: Record<string, DailyLedgerEntry>, transactions: PtoTransaction[]): void {
        console.log("--- Ledger Details ---");
        const sortedKeys = Object.keys(ledger).sort();
        console.log(`Ledger range: ${sortedKeys[0]} to ${sortedKeys[sortedKeys.length - 1]}`);
        console.log(`Total entries: ${sortedKeys.length}`);

        // Log first 5 and last 5 entries
        console.log("First 5 Ledger Entries:");
        sortedKeys.slice(0, 5).forEach(key => {
            const entry = ledger[key];
            console.log(`- ${key}: Balance=${entry.balance.toFixed(2)}, Transactions=${entry.transactions.length}`);
            entry.transactions.forEach(tx => console.log(`    - ${tx.type}, Amount=${tx.amount.toFixed(2)}, Note=${tx.note}`));
        });

        console.log("Last 5 Ledger Entries:");
         sortedKeys.slice(-5).forEach(key => {
             const entry = ledger[key];
             console.log(`- ${key}: Balance=${entry.balance.toFixed(2)}, Transactions=${entry.transactions.length}`);
             entry.transactions.forEach(tx => console.log(`    - ${tx.type}, Amount=${tx.amount.toFixed(2)}, Note=${tx.note}`));
         });


         console.log("--- All Transactions (Sorted) ---");
         transactions.forEach((tx, index) => {
             console.log(`${index}: ${toYYYYMMDD(tx.date)} - ${tx.type} - Amount: ${tx.amount.toFixed(2)} - Note: ${tx.note}`);
         });
    }
    */


} 