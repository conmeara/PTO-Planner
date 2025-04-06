<script lang="ts">
    import CalendarMonth from './CalendarMonth.svelte';
    import { holidays, optimizedDaysOff, consecutiveDaysOff, selectedCountryCode, weekendDays } from '../../stores/holidayStore';
    import { selectedPTODays, currentPTOTodayBalance, visibleYears, updateVisibleYears, ptoConfig, dailyPTOLedger } from '../../stores/ptoStore';
    import { strategySuggestedDays } from '../../stores/strategyStore';
    import CalendarLegendMenu from '../ui/CalendarLegendMenu.svelte';
    import { ensureYearLoaded } from '../../stores/holidayStore';
    import { onMount } from 'svelte';

    // Component properties
    export let year: number = new Date().getFullYear();

    // Generate array of months (0-11)
    const months = Array.from({ length: 12 }, (_, i) => i);

    // Create reactive variables for tracking UI updates
    $: ptoCount = $selectedPTODays.length;
    $: availableBalance = $currentPTOTodayBalance;
    $: holidaysList = $holidays;
    $: selectedVisibleYears = $visibleYears;
    
    // Force UI refresh when ledger changes
    $: ledgerVersion = Object.keys($dailyPTOLedger).length;
    
    // Ensure we have holidays loaded for this year
    $: {
        ensureYearLoaded(year);
    }
    
    // Handle day selection
    function handleDaySelected() {
        // Force reactivity update when a day is selected
        ptoCount = $selectedPTODays.length;
        console.log(`CalendarGrid: Day selected, total selected days: ${ptoCount}`);
        console.log(`Current balance: ${availableBalance.toFixed(1)} ${$ptoConfig.balanceUnit}`);
    }
    
    // Handle year selection
    function handleYearChange(e: Event) {
        const selectedYear = parseInt((e.target as HTMLSelectElement).value, 10);
        
        // Update the visible year
        if (!selectedVisibleYears.includes(selectedYear)) {
            const newVisibleYears = [...selectedVisibleYears, selectedYear].sort();
            updateVisibleYears(newVisibleYears);
        }
        
        // Make sure we load the holidays for this year
        ensureYearLoaded(selectedYear);
        
        // Update the displayed year
        year = selectedYear;
    }
    
    // Generate available years (current year - 1 to current year + 5)
    const currentYear = new Date().getFullYear();
    const availableYears = Array.from({ length: 7 }, (_, i) => currentYear - 1 + i);
    
    onMount(() => {
        console.log("CalendarGrid mounted");
    });
</script>

<div class="calendar-header">
    <div class="year-selector">
        <label for="year-select">Select Year</label>
        <select id="year-select" value={year} on:change={handleYearChange}>
            {#each availableYears as availableYear}
                <option value={availableYear}>{availableYear}</option>
            {/each}
        </select>
    </div>
    <div class="visible-years">
        <span>Visible years: </span>
        {#each $visibleYears as visibleYear}
            <span class="year-badge" class:current-year={visibleYear === year}>{visibleYear}</span>
        {/each}
    </div>
</div>

<div class="pto-summary">
    <div class="pto-summary-item">
        <span class="pto-label">Current PTO Balance:</span>
        <span class="pto-value" class:pto-low={availableBalance < 2}>{availableBalance.toFixed(1)} {$ptoConfig.balanceUnit}</span>
    </div>
    <div class="pto-summary-item">
        <span class="pto-label">Selected PTO Days:</span>
        <span class="pto-value">{ptoCount} {$ptoConfig.balanceUnit}</span>
    </div>
</div>

<div class="calendar-grid">
    {#each months as month}
        <div class="calendar-container">
            <CalendarMonth
                year={year}
                month={month}
                holidays={$holidays}
                optimizedDaysOff={$optimizedDaysOff}
                strategySuggestedDays={$strategySuggestedDays}
                consecutiveDaysOff={$consecutiveDaysOff}
                selectedCountryCode={$selectedCountryCode}
                weekendDays={$weekendDays}
                on:daySelected={handleDaySelected}
            />
        </div>
    {/each}
</div>

<style>
    .calendar-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
    }
    
    .year-selector {
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .year-selector select {
        padding: 8px 16px;
        border-radius: 8px;
        border: 1px solid #ccc;
        background-color: #fff;
        font-size: 1rem;
    }
    
    .visible-years {
        display: flex;
        align-items: center;
        gap: 6px;
    }
    
    .year-badge {
        padding: 4px 8px;
        border-radius: 16px;
        background-color: #e9e9e9;
        font-size: 0.875rem;
    }
    
    .current-year {
        background-color: #4a90e2;
        color: white;
    }
    
    .pto-summary {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background-color: #f5f5f5;
        border-radius: 8px;
        padding: 12px 16px;
        margin-bottom: 16px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .pto-summary-item {
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .pto-label {
        font-size: 0.9rem;
        font-weight: 500;
        color: #555;
    }
    
    .pto-value {
        font-size: 1.1rem;
        font-weight: 700;
        color: #4caf50;
    }
    
    .pto-low {
        color: #ff5722;
    }

    .calendar-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 20px;
        margin-top: 20px;
    }

    .calendar-container {
        background-color: #fff;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        padding: 10px;
        transition: transform 0.2s;
    }

    .calendar-container:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }

    @media (max-width: 768px) {
        .calendar-grid {
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 10px;
        }
        
        .calendar-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
        }
        
        .pto-summary {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
        }
    }
</style>
