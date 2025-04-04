<script lang="ts">
    import { onMount } from 'svelte';
    import countries from 'i18n-iso-countries';
    import enLocale from 'i18n-iso-countries/langs/en.json';
    import { selectedCountry, selectedCountryCode, updateHolidays } from '../../stores/holidayStore';
    import type { CountryInfo } from '../../types';

    let countriesInput: HTMLInputElement;
    let countriesList: Record<string, string> = {};

    onMount(() => {
        countries.registerLocale(enLocale);
        countriesList = countries.getNames('en');
    });

    function handleCountryChange(event: Event) {
        const target = event.target as HTMLInputElement;
        const countryName = target.value;
        const countryCode = Object.keys(countriesList).find(code => countriesList[code] === countryName) || '';
        
        selectedCountry.set(countryName);
        selectedCountryCode.set(countryCode);
        updateHolidays();
    }

    function getFlagEmoji(countryCode: string): string {
        if (!countryCode) return '';
        
        const codePoints = countryCode
            .toUpperCase()
            .split('')
            .map(char => 127397 + char.charCodeAt(0));
        
        return String.fromCodePoint(...codePoints);
    }
</script>

<div class="country-selector">
    <span class="flag" style="vertical-align: middle;">{$selectedCountryCode ? getFlagEmoji($selectedCountryCode) : ''}</span>
    <input bind:this={countriesInput} list="countries" class="editable-input bold" bind:value={$selectedCountry}
        on:input={(e) => handleCountryChange(e)}
        on:focus={(e) => { (e.target as HTMLInputElement).value = ''; }}
        placeholder="Country"
        aria-label="Country" />
    <datalist id="countries">
        {#each Object.entries(countriesList) as [code, name]}
            <option value={name}>{name}</option>
        {/each}
    </datalist>
</div>

<style>
    .country-selector {
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
