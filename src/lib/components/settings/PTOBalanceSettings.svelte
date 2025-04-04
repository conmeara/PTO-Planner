<script lang="ts">
    import {
        ptoBalance,
        ptoBalanceUnit,
        ptoBalanceAsOfDate,
        ptoAccrualRate,
        ptoAccrualUnit,
        ptoAccrualFrequency,
        currentPTOBalance
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
            ptoBalanceAsOfDate.set(new Date(dateValue));
        }
    }

    // Get current date as string for max attribute
    const today = formatDateForInput(new Date());

    // Bind date value
    $: asOfDateValue = formatDateForInput($ptoBalanceAsOfDate);
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
                bind:value={$ptoBalance}
                min="0"
                step="0.5"
                aria-label="PTO Balance"
            />
            <select bind:value={$ptoBalanceUnit} aria-label="PTO Balance Unit">
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
                bind:value={$ptoAccrualRate}
                min="0"
                step="0.5"
                aria-label="PTO Accrual Rate"
            />
            <select bind:value={$ptoAccrualUnit} aria-label="PTO Accrual Unit">
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
            bind:value={$ptoAccrualFrequency}
            aria-label="PTO Accrual Frequency"
        >
            <option value="weekly">Weekly</option>
            <option value="bi-weekly">Bi-weekly</option>
            <option value="monthly">Monthly</option>
        </select>
    </div>

    <div class="current-balance">
        <h4>Current Available PTO:</h4>
        <p class="balance-display">{$currentPTOBalance !== undefined ? $currentPTOBalance.toFixed(1) : '0.0'} {$ptoBalanceUnit || 'days'}</p>
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
</style>
