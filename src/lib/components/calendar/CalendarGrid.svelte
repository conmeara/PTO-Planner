<script lang="ts">
    import CalendarMonth from './CalendarMonth.svelte';
    import { holidays, optimizedDaysOff, consecutiveDaysOff, selectedCountryCode, weekendDays, year } from '../../stores/holidayStore';
    import { selectedPTODays, currentPTOBalance } from '../../stores/ptoStore';
    import { strategySuggestedDays } from '../../stores/strategyStore';
    import CalendarLegendMenu from '../ui/CalendarLegendMenu.svelte';

    // Generate array of months (0-11)
    const months = Array.from({ length: 12 }, (_, i) => i);

    // Create reactive variables for tracking UI updates
    $: ptoCount = $selectedPTODays.length;
    $: availableBalance = $currentPTOBalance;
    $: holidaysList = $holidays;
    
    // Handle day selection
    function handleDaySelected() {
        // Force reactivity update when a day is selected
        ptoCount = $selectedPTODays.length;
    }
</script>

<div class="calendar-grid">
    {#each months as month}
        <div class="calendar-container">
            <CalendarMonth
                year={$year}
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
    }
</style>
