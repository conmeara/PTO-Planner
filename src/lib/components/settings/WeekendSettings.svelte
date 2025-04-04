<script lang="ts">
    import { weekendDays, updateHolidays } from '../../stores/holidayStore';
    import type { DayInfo } from '../../types';

    function getOrderedDays(): DayInfo[] {
        const days = [
            { name: 'Sunday', index: 0 },
            { name: 'Monday', index: 1 },
            { name: 'Tuesday', index: 2 },
            { name: 'Wednesday', index: 3 },
            { name: 'Thursday', index: 4 },
            { name: 'Friday', index: 5 },
            { name: 'Saturday', index: 6 }
        ];
        return days;
    }

    function toggleWeekendDay(dayIndex: number) {
        weekendDays.update(days => {
            if (days.includes(dayIndex)) {
                return days.filter(d => d !== dayIndex);
            } else {
                return [...days, dayIndex].sort();
            }
        });
        updateHolidays();
    }
</script>

<div class="weekend-settings">
    <h3>Weekend Days</h3>
    <ul>
        {#each getOrderedDays() as {name, index}}
            <li>
                <div class="setting-item-label">
                    <span class="color-box weekend"></span>
                    <span>{name}</span>
                </div>
                <button on:click={() => toggleWeekendDay(index)}>
                    {$weekendDays.includes(index) ? 'Remove' : 'Add'}
                </button>
            </li>
        {/each}
    </ul>
</div>

<style>
    .weekend-settings {
        margin-top: 20px;
    }

    h3 {
        margin-top: 0;
        margin-bottom: 10px;
        font-size: 1.2em;
    }

    ul {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    li {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 5px 0;
        border-bottom: 1px solid #eee;
    }

    .setting-item-label {
        display: flex;
        align-items: center;
        gap: 10px;
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

    button {
        background-color: #f0f0f0;
        border: 1px solid #ccc;
        border-radius: 4px;
        padding: 5px 10px;
        cursor: pointer;
        font-size: 0.9em;
        transition: background-color 0.2s;
    }

    button:hover {
        background-color: #e0e0e0;
    }
</style>
