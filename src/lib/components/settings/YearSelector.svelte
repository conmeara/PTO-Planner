<script lang="ts">
    import { year, updateHolidays } from '../../stores/holidayStore';

    function handleYearChange(event: Event) {
        const target = event.target as HTMLInputElement;
        const newYear = parseInt(target.value, 10);
        if (!isNaN(newYear) && newYear >= 1900 && newYear <= 2100) {
            year.set(newYear);
            updateHolidays();
        }
    }
</script>

<div class="year-selector">
    <input type="number" class="editable-input bold" bind:value={$year}
        on:input={(e) => handleYearChange(e)}
        min="1900" max="2100"
        aria-label="Year" />
</div>

<style>
    .year-selector {
        display: inline-flex;
        align-items: center;
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
        width: 5em;
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
