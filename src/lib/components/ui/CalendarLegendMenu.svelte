<script lang="ts">
    import { holidays, optimizedDaysOff, weekendDays, consecutiveDaysOff } from '../../stores/holidayStore';
    import { selectedPTODays, currentPTOBalance, ptoBalanceUnit } from '../../stores/ptoStore';
    import type { Holiday } from '../../types';
    import CountrySelector from '../settings/CountrySelector.svelte';
    import StateSelector from '../settings/StateSelector.svelte';
    import YearSelector from '../settings/YearSelector.svelte';
    import WeekendSettings from '../settings/WeekendSettings.svelte';
    import PTOBalanceSettings from '../settings/PTOBalanceSettings.svelte';
    import { createEventDispatcher } from 'svelte';

    // Define the active tab
    let activeTab = 'holiday'; // 'none', 'suggested', 'selected', 'weekend', 'holiday'

    // Create event dispatcher
    const dispatch = createEventDispatcher();

    function toggleTab(tab: string) {
        activeTab = activeTab === tab ? 'none' : tab;
        dispatch('tabChange', activeTab);
    }

    // Export the active tab
    export { activeTab };

    // Format date for display
    function formatDate(date: Date): string {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    // Get month name
    function getMonthName(month: number): string {
        return new Date(0, month).toLocaleString('default', { month: 'long' });
    }

    // Group holidays by month
    $: holidaysByMonth = $holidays.reduce((acc, holiday) => {
        const month = holiday.date.getMonth();
        if (!acc[month]) acc[month] = [];
        acc[month].push(holiday);
        return acc;
    }, {} as Record<number, Holiday[]>);

    // Group optimized days off by month
    $: optimizedByMonth = $optimizedDaysOff.reduce((acc, date) => {
        const month = date.getMonth();
        if (!acc[month]) acc[month] = [];
        acc[month].push(date);
        return acc;
    }, {} as Record<number, Date[]>);

    // Calculate total consecutive days
    $: totalConsecutiveDays = $consecutiveDaysOff.reduce((total, group) => total + group.totalDays, 0);
</script>

<div class="legend-menu">
    <div class="legend-tabs">
        <button
            class="tab-item suggested-pto {activeTab === 'suggested' ? 'active' : ''}"
            on:click={() => toggleTab('suggested')}
        >
            <span class="color-box optimized"></span>
            <span>Suggested PTO</span>
        </button>

        <button
            class="tab-item selected-pto {activeTab === 'selected' ? 'active' : ''}"
            on:click={() => toggleTab('selected')}
        >
            <span class="color-box consecutive-day"></span>
            <span>Selected PTO</span>
        </button>

        <button
            class="tab-item weekend {activeTab === 'weekend' ? 'active' : ''}"
            on:click={() => toggleTab('weekend')}
        >
            <span class="color-box weekend"></span>
            <span>Weekend</span>
        </button>

        <button
            class="tab-item holiday {activeTab === 'holiday' ? 'active' : ''}"
            on:click={() => toggleTab('holiday')}
        >
            <span class="color-box holiday"></span>
            <span>Public Holiday</span>
        </button>
    </div>

    {#if activeTab !== 'none'}
        <div class="edit-menu">
            {#if activeTab === 'suggested'}
                <div class="menu-content">
                    <h3>Suggested PTO Days</h3>
                    <p>These are the optimal days to take off to maximize your time off.</p>
                    <p>Total suggested: <strong>{$optimizedDaysOff.length} days</strong></p>

                    <div class="month-groups">
                        {#each Object.entries(optimizedByMonth) as [month, dates]}
                            <div class="month-group">
                                <h4>{getMonthName(parseInt(month))}</h4>
                                <ul class="date-list">
                                    {#each dates as date}
                                        <li>{formatDate(date)}</li>
                                    {/each}
                                </ul>
                            </div>
                        {/each}
                    </div>
                </div>
            {:else if activeTab === 'selected'}
                <div class="menu-content">
                    <h3>Selected PTO Days</h3>
                    <p>You'll get <strong>{totalConsecutiveDays} consecutive days</strong> off with your selections.</p>

                    <div class="consecutive-periods">
                        {#each $consecutiveDaysOff as period}
                            <div class="period-item">
                                <span class="period-dates">{formatDate(period.startDate)} - {formatDate(period.endDate)}</span>
                                <span class="period-days"><strong>{period.totalDays} days</strong></span>
                            </div>
                        {/each}
                    </div>

                    <div class="pto-balance-container">
                        <PTOBalanceSettings />
                    </div>

                    <div class="selected-pto-days">
                        <h3>Selected PTO Days</h3>
                        <p>Total selected: <strong>{$selectedPTODays.length} {$ptoBalanceUnit}</strong></p>
                        <p>Current available: <strong>{$currentPTOBalance.toFixed(1)} {$ptoBalanceUnit}</strong></p>

                        {#if $selectedPTODays.length > 0}
                            <div class="month-groups">
                                {#each Object.entries($selectedPTODays.reduce((acc, day) => {
                                    const month = day.date.getMonth();
                                    if (!acc[month]) acc[month] = [];
                                    acc[month].push(day.date);
                                    return acc;
                                }, {} as Record<number, Date[]>)) as [month, dates]}
                                    <div class="month-group">
                                        <h4>{getMonthName(parseInt(month))}</h4>
                                        <ul class="date-list">
                                            {#each dates as date}
                                                <li>{formatDate(date)}</li>
                                            {/each}
                                        </ul>
                                    </div>
                                {/each}
                            </div>
                        {:else}
                            <p class="no-data">No PTO days selected yet. Click on days in the calendar to select them.</p>
                        {/if}
                    </div>
                </div>
            {:else if activeTab === 'weekend'}
                <div class="menu-content">
                    <h3>Weekend Settings</h3>
                    <p>Customize which days are considered weekend days.</p>
                    <div class="weekend-days">
                        <p>Current weekend days: <strong>{$weekendDays.map(day => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day]).join(', ')}</strong></p>
                    </div>
                    <WeekendSettings />
                </div>
            {:else if activeTab === 'holiday'}
                <div class="menu-content">
                    <h3>Public Holidays</h3>

                    <div class="location-settings">
                        <div class="location-row">
                            I live in
                            <CountrySelector />
                            <StateSelector />
                            in
                            <YearSelector />
                        </div>
                    </div>

                    <p>Total holidays: <strong>{$holidays.length}</strong></p>

                    <div class="month-groups">
                        {#each Object.entries(holidaysByMonth) as [month, monthHolidays]}
                            <div class="month-group">
                                <h4>{getMonthName(parseInt(month))}</h4>
                                <ul class="date-list">
                                    {#each monthHolidays as holiday}
                                        <li class={holiday.hidden ? 'disabled' : ''}>
                                            {formatDate(holiday.date)} - {holiday.name}
                                        </li>
                                    {/each}
                                </ul>
                            </div>
                        {/each}
                    </div>
                </div>
            {/if}
        </div>
    {/if}
</div>

<style>
    .legend-menu {
        background-color: #fff;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        margin: 20px 0;
        overflow: hidden;
    }

    .legend-tabs {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        padding: 12px;
        background-color: #f9f9f9;
        border-bottom: 1px solid #eee;
    }

    .tab-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border-radius: 20px;
        border: none;
        background-color: #f0f0f0;
        cursor: pointer;
        font-size: 0.9em;
        transition: all 0.2s ease;
    }

    .tab-item:hover {
        background-color: #e0e0e0;
    }

    .tab-item.active {
        background-color: #e8f4fd;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .color-box {
        width: 15px;
        height: 15px;
        display: inline-block;
        border-radius: 3px;
    }

    .weekend {
        background-color: #e0e0e0;
    }

    .holiday {
        background-color: #7e57c2;
    }

    .optimized {
        background-color: #4caf50;
    }

    .consecutive-day {
        background-color: #fff;
        border: 1px solid rgba(0, 0, 0, 0.3);
    }

    .edit-menu {
        padding: 16px;
    }

    .menu-content {
        animation: fadeIn 0.3s ease;
    }

    h3 {
        margin-top: 0;
        margin-bottom: 10px;
        font-size: 1.2em;
    }

    h4 {
        margin: 10px 0 5px;
        font-size: 1em;
        color: #555;
    }

    .month-groups {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 15px;
        margin-top: 15px;
    }

    .month-group {
        background-color: #f9f9f9;
        border-radius: 8px;
        padding: 10px;
    }

    .date-list {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .date-list li {
        padding: 4px 0;
        font-size: 0.9em;
        border-bottom: 1px solid #eee;
    }

    .date-list li.disabled {
        text-decoration: line-through;
        opacity: 0.5;
    }

    .consecutive-periods {
        margin-top: 15px;
    }

    .period-item {
        display: flex;
        justify-content: space-between;
        padding: 8px 12px;
        margin-bottom: 8px;
        background-color: #f9f9f9;
        border-radius: 6px;
        font-size: 0.9em;
    }

    .period-dates {
        font-weight: normal;
    }

    .period-days {
        color: #4caf50;
    }

    .weekend-days {
        background-color: #f9f9f9;
        border-radius: 8px;
        padding: 10px 15px;
        margin-top: 10px;
    }

    .location-settings {
        background-color: #f9f9f9;
        border-radius: 8px;
        padding: 10px 15px;
        margin-bottom: 15px;
    }

    .location-row {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 5px;
        line-height: 2;
    }

    .pto-balance-container {
        margin: 20px 0;
        padding: 15px;
        background-color: #f9f9f9;
        border-radius: 8px;
    }

    .selected-pto-days {
        margin-top: 20px;
    }

    .no-data {
        font-style: italic;
        color: #777;
        text-align: center;
        margin: 20px 0;
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }

    @media (max-width: 768px) {
        .legend-tabs {
            flex-direction: column;
            gap: 6px;
        }

        .tab-item {
            width: 100%;
            justify-content: flex-start;
        }

        .month-groups {
            grid-template-columns: 1fr;
        }
    }
</style>
