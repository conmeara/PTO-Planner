<script lang="ts">
    import Tooltip from '../ui/Tooltip.svelte';
    import type { Holiday, ConsecutiveDaysOff } from '../../types';
    import { isSelectedPTODay, toggleSelectedPTODay, getAvailablePTOOnDate, ptoBalanceUnit, selectedPTODays, currentPTOBalance } from '../../stores/ptoStore';
    import { createEventDispatcher } from 'svelte';
    import { onDestroy } from 'svelte';

    export let year: number;
    export let month: number;
    export let holidays: Holiday[];
    export let optimizedDaysOff: Date[];
    export let consecutiveDaysOff: ConsecutiveDaysOff[];
    export let selectedCountryCode: string;
    export let weekendDays: number[] = [6, 0];

    // Create event dispatcher
    const dispatch = createEventDispatcher();

    // Track local copy of selected PTO days for reactivity
    let localSelectedPTODays: Date[] = [];
    // Subscribe to changes in selectedPTODays and update localSelectedPTODays
    const unsubscribe = selectedPTODays.subscribe(days => {
        console.log(`CalendarMonth: selectedPTODays updated with ${days.length} days`);
        localSelectedPTODays = days.map(d => d.date instanceof Date ? d.date : new Date(d.date));
    });

    // Cleanup subscription when component is destroyed
    onDestroy(() => {
        unsubscribe();
    });

    // Calculate available PTO at the beginning of the month
    $: monthStartDate = new Date(year, month, 1);
    $: availablePTOAtMonthStart = getAvailablePTOOnDate(monthStartDate);
    $: availablePTOBalance = $currentPTOBalance;

    // Function to determine the first day of the week based on locale
    function getFirstDayOfWeek(locale: string): number {
        const normalizedLocale = locale.toLowerCase() === 'us' ? 'en-US' : `en-${locale.toUpperCase()}`;

        try {
            // @ts-ignore .weekInfo exists on all browsers except Firefox
            const weekFirstDay = new Intl.Locale(normalizedLocale)?.weekInfo?.firstDay;
            if (weekFirstDay !== undefined) {
                return weekFirstDay;
            }
        } catch (e) {
            // Fallback if weekInfo is not supported
        }

        // Fallback: US starts on Sunday (0), most others on Monday (1)
        return normalizedLocale === 'en-US' ? 0 : 1;
    }

    // Reactive declarations
    $: daysInMonth = getDaysInMonth(year, month);
    $: locale = selectedCountryCode ? new Intl.Locale(selectedCountryCode).toString() : 'us';
    $: firstDayOfWeek = getFirstDayOfWeek(locale);
    $: adjustedFirstDay = (getFirstDayOfMonth(year, month) - firstDayOfWeek + 7) % 7;

    function getDaysInMonth(year: number, month: number): number {
        return new Date(year, month + 1, 0).getDate();
    }

    function getFirstDayOfMonth(year: number, month: number): number {
        return new Date(year, month, 1).getDay();
    }

    function getHoliday(day: number): Holiday | undefined {
        return holidays.find(holiday =>
            holiday.date.getFullYear() === year &&
            holiday.date.getMonth() === month &&
            holiday.date.getDate() === day
        );
    }

    function isOptimizedDayOff(day: number): boolean {
        return optimizedDaysOff.some(date =>
            date.getFullYear() === year &&
            date.getMonth() === month &&
            date.getDate() === day
        );
    }

    function getDominantMonth(period: ConsecutiveDaysOff): number {
        const startMonth = period.startDate.getMonth();
        const endMonth = period.endDate.getMonth();

        if (startMonth === endMonth) {
            return startMonth;
        }

        const startDays = getDaysInMonth(year, startMonth) - period.startDate.getDate() + 1;
        const endDays = period.endDate.getDate();

        return startDays > endDays ? startMonth : endMonth;
    }

    function isConsecutiveDayOff(day: number): boolean {
        return consecutiveDaysOff.some(period => {
            const start = period.startDate;
            const end = period.endDate;
            const date = new Date(year, month, day);
            return date >= start && date <= end;
        });
    }

    function isSelectedPTO(day: number): boolean {
        const date = new Date(year, month, day);
        // Check both the store function and our local array for better reactivity
        const storeResult = isSelectedPTODay(date);
        const localResult = localSelectedPTODays.some(d => 
            d.getFullYear() === year && 
            d.getMonth() === month && 
            d.getDate() === day
        );
        // If there's a mismatch, log it for debugging
        if (storeResult !== localResult) {
            console.log(`Mismatch for ${date.toLocaleDateString()}: store=${storeResult}, local=${localResult}`);
        }
        return storeResult || localResult;
    }

    function handleDayClick(day: number): void {
        const date = new Date(year, month, day);
        // Don't allow selecting weekends or holidays as PTO days
        if (!isWeekend(date) && !getHoliday(day)) {
            console.log(`Clicking day ${date.toLocaleDateString()}`);
            
            // Toggle PTO status
            toggleSelectedPTODay(date);
            
            // Force reactivity update by creating a new reference
            // This is not strictly necessary with our subscription, but provides a backup
            localSelectedPTODays = [...localSelectedPTODays];
            
            // Dispatch event to notify parent components
            dispatch('daySelected', { date, isSelected: isSelectedPTODay(date) });
            
            // Log current state after update
            console.log(`After click, day ${date.toLocaleDateString()} selection state: ${isSelectedPTODay(date)}`);
            
            // Force a re-render by updating a reactive variable
            selectedDaysCount = localSelectedPTODays.length;
        }
    }

    function getAvailablePTO(day: number): number {
        const date = new Date(year, month, day);
        return getAvailablePTOOnDate(date);
    }

    function isWeekend(date: Date): boolean {
        return weekendDays.includes(date.getDay());
    }

    const dayInitials = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    $: orderedDayInitials = dayInitials.slice(firstDayOfWeek).concat(dayInitials.slice(0, firstDayOfWeek));

    // Make sure isSelectedPTO uses the updated localSelectedPTODays
    $: selectedDaysCount = localSelectedPTODays.length;
</script>

<div class="calendar">
    <div class="month-header">
        <div class="month-name">{new Date(year, month).toLocaleString('default', { month: 'long' })}</div>
        <div class="pto-balance">PTO: {availablePTOBalance !== undefined ? availablePTOBalance.toFixed(1) : '0.0'} {$ptoBalanceUnit || 'days'}</div>
    </div>

    {#each orderedDayInitials as dayInitial}
        <div class="day-initial">{dayInitial}</div>
    {/each}

    {#each Array.from({ length: adjustedFirstDay }) as _}
        <div class="day"></div>
    {/each}
    {#each Array.from({ length: daysInMonth }, (_, i) => i + 1) as day}
        {@const holiday = getHoliday(day)}
        {@const date = new Date(year, month, day)}
        {@const isPTO = isSelectedPTO(day)}
        {@const availablePTO = getAvailablePTO(day)}
        <div
            class="day {isWeekend(date) ? 'weekend' : ''} {holiday ? 'holiday' : ''} {isOptimizedDayOff(day) ? 'optimized' : ''} {isConsecutiveDayOff(day) ? 'consecutive-day' : ''} {isPTO ? 'selected-pto' : ''}"
            on:click={() => handleDayClick(day)}
            on:keydown={(e) => e.key === 'Enter' && handleDayClick(day)}
            role="button"
            tabindex="0"
        >
            <span class={holiday?.hidden ? 'strikethrough' : ''}>{day}</span>
            {#if holiday}
                <Tooltip text={holiday.name} />
            {:else if isPTO}
                <Tooltip text={`Selected PTO Day`} />
            {:else if !isWeekend(date)}
                <Tooltip text={`Available PTO: ${availablePTO !== undefined ? availablePTO.toFixed(1) : '0.0'} ${$ptoBalanceUnit || 'days'}`} />
            {/if}
        </div>
    {/each}
</div>

<div class="consecutive-days-off">
    <ul>
        {#each consecutiveDaysOff.filter(period => getDominantMonth(period) === month) as period}
            <li>
                {period.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} to
                {period.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}:
                <strong>{period.totalDays} days</strong>
            </li>
        {/each}
    </ul>
</div>

<style>
    .calendar {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 1px;
        box-sizing: border-box;
        width: 100%;
        height: auto;
    }

    .month-header {
        grid-column: span 7;
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 5px;
    }
    .day-initial {
        text-align: center;
        font-weight: bold;
        color: #666;
        font-size: 0.6em;
    }
    .day {
        aspect-ratio: 1;
        text-align: center;
        font-size: 0.7em;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #333;
        background-color: #f9f9f9;
        position: relative;
    }
    .day:hover {
        :global(.tooltip) {
            opacity: 1;
            pointer-events: auto;
        }
    }
    .weekend {
        background-color: #e0e0e0;
    }
    .optimized {
        background-color: #4caf50;
    }
    .holiday {
        background-color: #7e57c2;
        cursor: pointer;
    }
    .consecutive-day {
        border: 1px solid rgba(0, 0, 0, 0.3);
    }

    .selected-pto {
        background-color: #ff9800;
        cursor: pointer;
    }
    .month-name {
        text-align: center;
        letter-spacing: 0.1em;
        font-size: 1em;
        text-transform: uppercase;
        color: #333;
    }

    .pto-balance {
        font-size: 0.8em;
        color: #4caf50;
        font-weight: bold;
    }
    .consecutive-days-off {
        margin-top: 10px;
        color: #333;
    }
    .consecutive-days-off ul {
        list-style: none;
        padding: 0;
        margin: 0;
    }
    .consecutive-days-off li {
        font-size: 1em;
    }

    @media (max-width: 600px) {
        .month-name {
            font-size: 0.9em;
        }
        .consecutive-days-off li {
            font-size: 0.8em;
        }
    }

    .strikethrough {
        text-decoration: line-through;
        opacity: 0.5;
    }
</style>
