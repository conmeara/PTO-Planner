<script lang="ts">
    import { daysOff, updateHolidays } from '../../stores/holidayStore';

    function handleDaysOffChange(event: Event) {
        const target = event.target as HTMLInputElement;
        const newDaysOff = parseInt(target.value, 10);
        if (!isNaN(newDaysOff) && newDaysOff >= 0 && newDaysOff <= 365) {
            daysOff.set(newDaysOff);
            updateHolidays();
        }
    }
</script>

<div class="days-off-selector">
    <input type="number" class="editable-input bold" bind:value={$daysOff}
        on:input={(e) => handleDaysOffChange(e)}
        min="0" max="365"
        aria-label="Days Off" />
    days off
</div>

<style>
    .days-off-selector {
        display: inline-flex;
        align-items: center;
        gap: 5px;
    }

    .editable-input {
        margin: 0 5px;
        font-size: 1em;
        padding: 8px;
        background-color: transparent;
        border: 1px solid #ccc;
        border-radius: 5px;
        color: #333;
        transition: background-color 0.3s, color 0.3s;
        width: 4em;
    }

    .editable-input:hover {
        background-color: rgba(0, 0, 0, 0.05);
    }

    .editable-input:focus {
        outline: 2px solid #2196F3;
    }

    .bold {
        font-weight: bold;
    }
</style>
