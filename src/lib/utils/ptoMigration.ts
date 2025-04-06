import type { PayPeriodTemplate } from '../types';

/**
 * Determines if we need to migrate from the old PTO calculation to the new transaction-based approach
 */
export function needsMigration(): boolean {
    if (typeof window === 'undefined') return false;
    
    const storedPayPeriodTemplate = localStorage.getItem('payPeriodTemplate');
    
    // If there's no pay period template, we need to migrate
    return !storedPayPeriodTemplate;
}

/**
 * Creates a default pay period template based on the stored accrual frequency
 */
export function createDefaultPayPeriodTemplate(): PayPeriodTemplate {
    if (typeof window === 'undefined') {
        return {
            frequency: 'monthly',
            dayOfMonth: 1,
            weekday: 5 // Friday
        };
    }
    
    const storedFrequency = localStorage.getItem('ptoAccrualFrequency');
    const frequency = storedFrequency === 'weekly' ? 'weekly' : 
                    storedFrequency === 'bi-weekly' ? 'bi-weekly' : 'monthly';
    
    // Default to 1st of month for monthly
    if (frequency === 'monthly') {
        return {
            frequency: 'monthly',
            dayOfMonth: 1
        };
    }
    
    // Default to Friday for weekly/bi-weekly
    return {
        frequency,
        weekday: 5 // Friday
    };
}

/**
 * Performs the migration from the old PTO calculation to the new transaction-based approach
 */
export function migrateToTransactionBasedCalculation(): void {
    if (typeof window === 'undefined') return;
    
    console.log('Migrating to transaction-based PTO calculation...');
    
    try {
        // Create the default pay period template
        const template = createDefaultPayPeriodTemplate();
        
        // Store it in localStorage
        localStorage.setItem('payPeriodTemplate', JSON.stringify(template));
        
        console.log('Migration complete. Created default pay period template:', template);
    } catch (error) {
        console.error('Error during migration:', error);
    }
} 