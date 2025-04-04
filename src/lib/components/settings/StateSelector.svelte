<script lang="ts">
    import { onMount } from 'svelte';
    import Holidays from 'date-holidays';
    import { selectedCountryCode, selectedState, selectedStateCode, updateHolidays } from '../../stores/holidayStore';
    import type { StateInfo } from '../../types';

    let statesInput: HTMLInputElement;
    let statesList: Record<string, string> = {};

    // Subscribe to country code changes to update states list
    $: {
        if ($selectedCountryCode) {
            updateStatesList($selectedCountryCode);
        }
    }

    function updateStatesList(countryCode: string) {
        try {
            const hd = new Holidays(countryCode);
            const states = hd.getStates();
            if (states) {
                statesList = states;
            } else {
                statesList = {};
            }
        } catch (error) {
            console.error('Error getting states:', error);
            statesList = {};
        }
    }

    function handleStateChange(event: Event) {
        const target = event.target as HTMLInputElement;
        const stateName = target.value;
        const stateCode = Object.keys(statesList).find(code => statesList[code] === stateName) || '';
        
        selectedState.set(stateName);
        selectedStateCode.set(stateCode);
        updateHolidays();
    }
</script>

{#if Object.keys(statesList).length > 0}
    <div class="state-selector">
        <input bind:this={statesInput} list="states" class="editable-input bold" bind:value={$selectedState}
            on:input={(e) => handleStateChange(e)}
            on:focus={(e) => { (e.target as HTMLInputElement).value = ''; }}
            placeholder="State"
            aria-label="State" />
        <datalist id="states">
            {#each Object.entries(statesList) as [code, name]}
                <option value={name}>{name}</option>
            {/each}
        </datalist>
        in
    </div>
{/if}

<style>
    .state-selector {
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
        width: auto;
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
