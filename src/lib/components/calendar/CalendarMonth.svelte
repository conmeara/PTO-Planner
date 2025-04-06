<script lang="ts">
    import Tooltip from '../ui/Tooltip.svelte';
    import type { Holiday, ConsecutiveDaysOff } from '../../types';
    import { toggleSelectedPTODay, getAvailablePTOOnDate, ptoConfig, selectedPTODays, dailyPTOLedger, ledgerVersion as globalLedgerVersion } from '../../stores/ptoStore';
    import { createEventDispatcher } from 'svelte';
    import { onDestroy, tick } from 'svelte';
    import { holidays as allHolidays, weekendDays as allWeekendDays } from '../../stores/holidayStore';
    import { calculateConsecutiveDaysOff } from '../../utils/holidayUtils';
    import { toYYYYMMDD } from '../../utils/ptoEngine';

    export let year: number;
    export let month: number;
    export let holidays: Holiday[];
    export let optimizedDaysOff: Date[];
    export let strategySuggestedDays: Date[] = [];
    export let consecutiveDaysOff: ConsecutiveDaysOff[];
    export let selectedCountryCode: string;
    export let weekendDays: number[] = [6, 0];

    // Create event dispatcher
    const dispatch = createEventDispatcher();

    // Track local copy of selected PTO days for reactivity
    let localSelectedPTODays: Date[] = [];
    // Subscribe to changes in selectedPTODays and update localSelectedPTODays
    const unsubscribePTO = selectedPTODays.subscribe(days => {
        console.log(`CalendarMonth: selectedPTODays updated with ${days.length} days`);
        // Ensure proper Date object creation
        localSelectedPTODays = days.map(d => {
            if (!d.date) return new Date();
            return d.date instanceof Date ? new Date(d.date) : new Date(d.date);
        });
        // Log for debugging
        if (localSelectedPTODays.length > 0) {
            console.log('Selected PTO dates:');
            localSelectedPTODays.forEach(d => console.log(`- ${d.toLocaleDateString()}`));
        }
    });

    // Track the PTO ledger to force updates when it changes
    let localLedgerVersion = 0;
    const unsubscribeLedger = dailyPTOLedger.subscribe(ledger => {
        localLedgerVersion++;
        console.log(`CalendarMonth: PTO ledger updated, version ${localLedgerVersion}`);

        // Force a refresh of the selected days display
        const today = new Date();
        if (today.getFullYear() === year && today.getMonth() === month) {
            console.log("Refreshing calendar display for current month");

            // This will trigger re-rendering of days
            refreshCalendarDisplay();
        }
    });

    // Also subscribe to the global ledger version counter
    const unsubscribeGlobalVersion = globalLedgerVersion.subscribe(version => {
        console.log(`CalendarMonth: Global ledger version updated to ${version}`);
        refreshCalendarDisplay();
    });

    // Helper function to refresh the calendar display
    async function refreshCalendarDisplay() {
        // Wait for the next tick to ensure all reactive updates have been applied
        await tick();

        // Force reactivity by updating these values
        const updatedSelectedDaysCount = localSelectedPTODays.length;
        availablePTOAtMonthStart = getAvailablePTOOnDate(monthStartDate);
        availablePTOAtMonthEnd = getAvailablePTOOnDate(monthEndDate);

        console.log(`Calendar refreshed - Month: ${month+1}/${year}, Start PTO: ${availablePTOAtMonthStart.toFixed(1)}, End PTO: ${availablePTOAtMonthEnd.toFixed(1)}, Selected days: ${updatedSelectedDaysCount}`);
    }

    // Cleanup subscription when component is destroyed
    onDestroy(() => {
        unsubscribePTO();
        unsubscribeLedger();
        unsubscribeGlobalVersion();
    });

    // Calculate available PTO at the beginning and end of the month
    $: monthStartDate = new Date(year, month, 1);
    $: monthEndDate = new Date(year, month + 1, 0); // Last day of month
    $: availablePTOAtMonthStart = getAvailablePTOOnDate(monthStartDate); // Use balance from the first day of the month
    $: availablePTOAtMonthEnd = getAvailablePTOOnDate(monthEndDate); // End balance uses the last day of the current month

    // Count PTO days used in this month
    $: ptoDaysUsedInMonth = $selectedPTODays.filter(day =>
        day.date.getFullYear() === year &&
        day.date.getMonth() === month
    ).length;

    // Create a reactive debug log to see PTO values
    $: {
        // Log the specific selected days being counted for this month
        if (month === 6 && year === new Date().getFullYear()) { // Log only for July of current year for debugging
             const daysInMonth = $selectedPTODays.filter(day =>
                day.date.getFullYear() === year &&
                day.date.getMonth() === month
            );
            console.log(`DEBUG (July ${year}): Filtered selectedPTODays for count:`,
                daysInMonth.map(d => d.date.toDateString()),
                `Count: ${daysInMonth.length}`
            );
        }

        const monthKey = toYYYYMMDD(monthStartDate);
        console.log(`Month: ${monthStartDate.toLocaleString('default', { month: 'long' })}, Key: ${monthKey}, Start Balance: ${availablePTOAtMonthStart}, End Balance: ${availablePTOAtMonthEnd}, Used: ${ptoDaysUsedInMonth}, Ledger Version: ${localLedgerVersion}`);
    }

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

    function isStrategySuggestedDay(day: number): boolean {
        return strategySuggestedDays.some(date =>
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
        // Check directly from the selectedPTODays store
        return $selectedPTODays.some(ptoDay =>
            ptoDay.date.getFullYear() === date.getFullYear() &&
            ptoDay.date.getMonth() === date.getMonth() &&
            ptoDay.date.getDate() === date.getDate()
        );
    }

    function handleDayClick(day: number): void {
        const date = new Date(year, month, day);
        // Don't allow selecting weekends or holidays as PTO days
        if (!isWeekend(date) && !getHoliday(day)) {
            console.log(`Clicking day ${date.toLocaleDateString()}`);

            // Log the current PTO balance before toggling
            const beforeBalance = getAvailablePTO(day);
            console.log(`Before toggle, available PTO on ${date.toLocaleDateString()}: ${beforeBalance.toFixed(1)} ${$ptoConfig.balanceUnit}`);

            // Toggle PTO status
            toggleSelectedPTODay(date);

            // Force reactivity update by creating a new reference
            // This is not strictly necessary with our subscription, but provides a backup
            localSelectedPTODays = [...localSelectedPTODays];

            // Dispatch event to notify parent components
            dispatch('daySelected', { date, isSelected: isSelectedPTO(day) });

            // Log current state after update
            console.log(`After click, day ${date.toLocaleDateString()} selection state: ${isSelectedPTO(day)}`);

            // Force a re-render by updating a reactive variable
            localSelectedPTODays = [...localSelectedPTODays]; // This will trigger reactivity

            // Schedule a refresh of the calendar display
            setTimeout(() => refreshCalendarDisplay(), 100);
        }
    }

    function getAvailablePTO(day: number): number {
        const date = new Date(year, month, day);
        const balance = getAvailablePTOOnDate(date);
        // Log for debugging specific days
        if (date.getDate() === 1 || date.getDate() === 15) {
            console.log(`Available PTO for ${date.toLocaleDateString()}: ${balance.toFixed(1)} ${$ptoConfig.balanceUnit}`);
        }
        return balance;
    }

    // Calculate PTO balance after accounting for selected PTO days
    function getAdjustedPTOBalance(date) {
        // The getAvailablePTOOnDate function already accounts for all selected PTO days
        // because it uses the ledger which includes all PTO transactions
        return getAvailablePTOOnDate(date);
    }

    function isWeekend(date) {
        return weekendDays.includes(date.getDay());
    }

    const dayInitials = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    $: orderedDayInitials = dayInitials.slice(firstDayOfWeek).concat(dayInitials.slice(0, firstDayOfWeek));

    // We use localSelectedPTODays directly for reactivity

    // Function to calculate consecutive days off if a specific suggested day is added
    function getPotentialConsecutiveDays(suggestedDate) {
        // Create a copy of currently selected PTO days
        const potentialPTODays = [
            ...localSelectedPTODays,
            suggestedDate
        ];

        // Get holidays that aren't hidden for calculation
        const visibleHolidaysList = $allHolidays.filter(h => !h.hidden);

        // Calculate the new consecutive days with the added suggested day
        const potentialConsecutive = calculateConsecutiveDaysOff(
            visibleHolidaysList,
            optimizedDaysOff,
            year,
            $allWeekendDays,
            potentialPTODays
        );

        // Find the period that includes the suggested date
        const relevantPeriod = potentialConsecutive.find(period =>
            suggestedDate >= period.startDate && suggestedDate <= period.endDate
        );

        return relevantPeriod ? relevantPeriod.totalDays : 0;
    }
</script>

<div class="calendar">
    <div class="month-header">
        <div class="month-name">{new Date(year, month).toLocaleString('default', { month: 'long' })}</div>
        <div class="pto-balance">
            <div class="pto-start" style="color: {availablePTOAtMonthStart > 0 ? '#4caf50' : '#999'};">
                PTO: {availablePTOAtMonthStart !== undefined ? availablePTOAtMonthStart.toFixed(1) : '0.0'} {$ptoConfig.balanceUnit || 'days'}
            </div>
            {#if ptoDaysUsedInMonth > 0}
                <div class="pto-used">
                    Used: {ptoDaysUsedInMonth} {$ptoConfig.balanceUnit || 'days'}
                </div>
                <div class="pto-end" style="color: {availablePTOAtMonthEnd > 0 ? '#4caf50' : '#ff5722'};">
                    End: {availablePTOAtMonthEnd !== undefined ? availablePTOAtMonthEnd.toFixed(1) : '0.0'} {$ptoConfig.balanceUnit || 'days'}
                </div>
            {/if}
        </div>
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
        {@const isStrategySuggested = isStrategySuggestedDay(day)}
        <div
            class="day
                {isWeekend(date) ? 'weekend' : ''}
                {holiday ? 'holiday' : ''}
                {isOptimizedDayOff(day) && !isStrategySuggested ? 'optimized' : ''}
                {isStrategySuggested ? 'strategy-suggested' : ''}
                {isConsecutiveDayOff(day) ? 'consecutive-day' : ''}
                {isPTO ? 'selected-pto' : ''}"
            on:click={() => handleDayClick(day)}
            on:keydown={(e) => e.key === 'Enter' && handleDayClick(day)}
            role="button"
            tabindex="0"
        >
            <span class={holiday?.hidden ? 'strikethrough' : ''}>{day}</span>
            <Tooltip
                html={true}
                detailed={true}
                text={`
                    ${holiday ? `<div class="label">Holiday</div>
                    <div class="value">${holiday.name}</div>
                    <div class="divider"></div>` : ''}
                    ${isPTO ? `<div class="label">Selected PTO Day</div>
                    <div class="divider"></div>` : ''}
                    ${isStrategySuggested ? `<div class="label">Suggested PTO Day</div>
                    <div class="divider"></div>` : ''}
                    ${isWeekend(date) ? `<div class="label">Weekend</div>
                    <div class="divider"></div>` : ''}
                    <div class="label">Date:</div>
                    <div class="value">${date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</div>
                    <div class="divider"></div>
                    <div class="label">Available PTO:</div>
                    <div class="value ${getAdjustedPTOBalance(date) > 3 ? 'highlight' : getAdjustedPTOBalance(date) > 0 ? 'highlight-warning' : 'highlight-danger'}">
                        ${getAdjustedPTOBalance(date).toFixed(1)} ${$ptoConfig.balanceUnit || 'days'}
                    </div>
                    ${isStrategySuggested ? `<div class="label">Potential Days Off:</div>
                    <div class="value">${getPotentialConsecutiveDays(date)} days</div>` : ''}
                `}
            >
                <span></span>
            </Tooltip>
        </div>
    {/each}
</div>

<div class="consecutive-days-off">
    {#if consecutiveDaysOff.filter(period => getDominantMonth(period) === month).length > 0}
        <h4>Selected PTO</h4>
        <ul>
            {#each consecutiveDaysOff.filter(period => getDominantMonth(period) === month) as period}
                <li>
                    {period.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} to
                    {period.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}:
                    <strong>{period.totalDays} days</strong>
                </li>
            {/each}
        </ul>
    {/if}

    {#if strategySuggestedDays.length > 0 && strategySuggestedDays.some(date => date.getMonth() === month)}
        <h4>Suggested PTO</h4>
        <ul>
            {#each strategySuggestedDays.filter(date => date.getMonth() === month) as suggestedDate}
                {@const potentialDays = getPotentialConsecutiveDays(suggestedDate)}
                <li>
                    <div>
                        {suggestedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {#if potentialDays > 0}
                            <span class="potential-days">→ {potentialDays} days off</span>
                        {/if}
                    </div>
                    <button class="add-day-btn" on:click={() => handleDayClick(suggestedDate.getDate())}>
                        Add
                    </button>
                </li>
            {/each}
        </ul>
    {/if}
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
        cursor: pointer;
    }
    .day:hover :global(.tooltip) {
        opacity: 1 !important;
        visibility: visible !important;
        pointer-events: auto !important;
    }
    .weekend {
        background-color: #e0e0e0;
        position: relative;
        cursor: pointer;
    }


    .optimized {
        background-color: #4caf50;
    }
    .strategy-suggested {
        background-color: #fff;
        border: 2px solid black;
        cursor: pointer;
    }
    .holiday {
        background-color: #7e57c2;
        cursor: pointer;
        position: relative;
    }
    .consecutive-day {
        border: 1px solid rgba(0, 0, 0, 0.3);
    }

    .selected-pto {
        background-color: #ff9800 !important;
        color: white;
        font-weight: bold;
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
        display: flex;
        flex-direction: column;
        font-size: 0.8em;
        text-align: right;
    }

    .pto-start {
        color: #4caf50;
        font-weight: bold;
    }

    .pto-used {
        color: #ff9800;
        font-size: 0.9em;
    }

    .pto-end {
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
        margin: 0 0 15px 0;
    }
    .consecutive-days-off li {
        font-size: 0.85em;
        margin-bottom: 4px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .consecutive-days-off h4 {
        font-size: 0.9em;
        margin: 8px 0 4px 0;
        color: #555;
        border-bottom: 1px solid #eee;
        padding-bottom: 2px;
    }
    .add-day-btn {
        background-color: #4caf50;
        color: white;
        border: none;
        border-radius: 3px;
        padding: 2px 5px;
        font-size: 0.7em;
        cursor: pointer;
        margin-left: 5px;
    }
    .add-day-btn:hover {
        background-color: #388e3c;
    }
    .potential-days {
        font-size: 0.8em;
        color: #666;
        margin-left: 5px;
        font-style: italic;
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
