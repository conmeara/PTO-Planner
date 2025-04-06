<script lang="ts">
    import {
        ptoConfig,
        currentPTOTodayBalance,
        getAvailablePTOOnDate
    } from '../../stores/ptoStore';

    // Format date for input
    function formatDateForInput(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Parse date from input
    function handleDateChange(event: Event) {
        const target = event.target as HTMLInputElement;
        const dateValue = target.value;
        if (dateValue) {
            ptoConfig.update(config => ({
                ...config,
                asOfDate: new Date(dateValue)
            }));
        }
    }

    // Get current date as string for max attribute
    const today = formatDateForInput(new Date());

    // Bind date value
    $: asOfDateValue = formatDateForInput($ptoConfig.asOfDate);
    
    // Calculate end-of-year balance for display
    $: endOfYearDate = new Date(new Date().getFullYear(), 11, 31); // December 31st
    $: endOfYearBalance = getAvailablePTOOnDate(endOfYearDate);

    // Handle individual field updates
    function updateBalance(event: Event) {
        const target = event.target as HTMLInputElement;
        const value = parseFloat(target.value);
        if (!isNaN(value)) {
            console.log(`Updating initial balance to ${value}`);
            ptoConfig.update(config => ({
                ...config,
                initialBalance: value
            }));
            
            // Force a recalculation of the ledger
            setTimeout(() => {
                console.log(`Current PTO balance after update: ${$currentPTOTodayBalance}`);
            }, 50);
        }
    }

    function updateBalanceUnit(event: Event) {
        const target = event.target as HTMLSelectElement;
        console.log(`Updating balance unit to ${target.value}`);
        ptoConfig.update(config => ({
            ...config,
            balanceUnit: target.value as 'days' | 'hours'
        }));
    }

    function updateAccrualRate(event: Event) {
        const target = event.target as HTMLInputElement;
        const value = parseFloat(target.value);
        if (!isNaN(value)) {
            console.log(`Updating accrual rate to ${value}`);
            ptoConfig.update(config => ({
                ...config,
                accrualRate: value
            }));
        }
    }

    function updateAccrualUnit(event: Event) {
        const target = event.target as HTMLSelectElement;
        ptoConfig.update(config => ({
            ...config,
            accrualUnit: target.value as 'days' | 'hours'
        }));
    }

    function updateAccrualFrequency(event: Event) {
        const target = event.target as HTMLSelectElement;
        ptoConfig.update(config => ({
            ...config,
            accrualFrequency: target.value as 'weekly' | 'bi-weekly' | 'monthly',
            payPeriodTemplate: {
                ...($ptoConfig.payPeriodTemplate || {}),
                frequency: target.value as 'weekly' | 'bi-weekly' | 'monthly'
            }
        }));
    }
</script>

<div class="pto-balance-settings">
    <h3>PTO Balance</h3>

    <div class="setting-group">
        <label for="ptoBalance">Current PTO Balance:</label>
        <div class="input-group">
            <input
                type="number"
                id="ptoBalance"
                class="editable-input"
                value={$ptoConfig.initialBalance}
                on:input={updateBalance}
                min="0"
                step="0.5"
                aria-label="PTO Balance"
            />
            <select 
                value={$ptoConfig.balanceUnit} 
                on:change={updateBalanceUnit}
                aria-label="PTO Balance Unit"
            >
                <option value="days">days</option>
                <option value="hours">hours</option>
            </select>
        </div>
    </div>

    <div class="setting-group">
        <label for="ptoAsOfDate">As of Date:</label>
        <input
            type="date"
            id="ptoAsOfDate"
            class="editable-input"
            bind:value={asOfDateValue}
            on:change={handleDateChange}
            max={today}
            aria-label="PTO Balance As Of Date"
        />
    </div>

    <h3>PTO Accrual</h3>

    <div class="setting-group">
        <label for="ptoAccrualRate">Accrual Rate:</label>
        <div class="input-group">
            <input
                type="number"
                id="ptoAccrualRate"
                class="editable-input"
                value={$ptoConfig.accrualRate}
                on:input={updateAccrualRate}
                min="0"
                step="0.5"
                aria-label="PTO Accrual Rate"
            />
            <select 
                value={$ptoConfig.accrualUnit}
                on:change={updateAccrualUnit}
                aria-label="PTO Accrual Unit"
            >
                <option value="days">days</option>
                <option value="hours">hours</option>
            </select>
        </div>
    </div>

    <div class="setting-group">
        <label for="ptoAccrualFrequency">Frequency:</label>
        <select
            id="ptoAccrualFrequency"
            class="editable-input"
            value={$ptoConfig.accrualFrequency}
            on:change={updateAccrualFrequency}
            aria-label="PTO Accrual Frequency"
        >
            <option value="weekly">Weekly</option>
            <option value="bi-weekly">Bi-weekly</option>
            <option value="monthly">Monthly</option>
        </select>
    </div>

    <div class="current-balance">
        <h4>Current Available PTO:</h4>
        <p class="balance-display">{$currentPTOTodayBalance !== undefined ? $currentPTOTodayBalance.toFixed(1) : '0.0'} {$ptoConfig.balanceUnit || 'days'}</p>
        <p class="projected-balance">Projected by Dec 31: {endOfYearBalance.toFixed(1)} {$ptoConfig.balanceUnit}</p>
    </div>
</div>

<style>
    .pto-balance-settings {
        margin-top: 20px;
    }

    h3 {
        margin-top: 15px;
        margin-bottom: 10px;
        font-size: 1.2em;
        color: #333;
    }

    h4 {
        margin-top: 15px;
        margin-bottom: 5px;
        font-size: 1em;
        color: #555;
    }

    .setting-group {
        margin-bottom: 15px;
        display: flex;
        flex-direction: column;
        gap: 5px;
    }

    label {
        font-size: 0.9em;
        color: #555;
    }

    .editable-input {
        padding: 8px 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 0.9em;
        width: 100%;
    }

    .input-group {
        display: flex;
        gap: 5px;
    }

    .input-group input {
        flex: 1;
    }

    .input-group select {
        width: 80px;
    }

    select {
        padding: 8px 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 0.9em;
        background-color: #fff;
    }

    .current-balance {
        margin-top: 20px;
        padding: 15px;
        background-color: #f5f5f5;
        border-radius: 8px;
        text-align: center;
    }

    .balance-display {
        font-size: 1.5em;
        font-weight: bold;
        color: #4caf50;
        margin: 5px 0;
    }

    .projected-balance {
        font-size: 1.2em;
        font-weight: bold;
        color: #555;
        margin: 5px 0;
    }
</style>
