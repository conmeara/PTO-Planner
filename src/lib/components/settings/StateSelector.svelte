<script lang="ts">
    import { selectedCountryCode, selectedState, selectedStateCode, updateHolidays } from '../../stores/holidayStore';
    import type { StateInfo } from '../../types';

    // Input reference for datalist binding
    let statesInput: HTMLInputElement;
    let statesList: Record<string, string> = {};

    // Common countries with states/provinces
    const countryStates: {[key: string]: {[key: string]: string}} = {
        'US': {
            'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
            'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
            'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
            'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
            'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
            'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
            'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
            'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
            'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
            'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming',
            'DC': 'District of Columbia'
        },
        'CA': {
            'AB': 'Alberta', 'BC': 'British Columbia', 'MB': 'Manitoba', 'NB': 'New Brunswick',
            'NL': 'Newfoundland and Labrador', 'NS': 'Nova Scotia', 'NT': 'Northwest Territories',
            'NU': 'Nunavut', 'ON': 'Ontario', 'PE': 'Prince Edward Island', 'QC': 'Quebec',
            'SK': 'Saskatchewan', 'YT': 'Yukon'
        },
        'AU': {
            'ACT': 'Australian Capital Territory', 'NSW': 'New South Wales', 'NT': 'Northern Territory',
            'QLD': 'Queensland', 'SA': 'South Australia', 'TAS': 'Tasmania', 'VIC': 'Victoria', 'WA': 'Western Australia'
        },
        'DE': {
            'BW': 'Baden-Württemberg', 'BY': 'Bayern', 'BE': 'Berlin', 'BB': 'Brandenburg', 'HB': 'Bremen',
            'HH': 'Hamburg', 'HE': 'Hessen', 'MV': 'Mecklenburg-Vorpommern', 'NI': 'Niedersachsen',
            'NW': 'Nordrhein-Westfalen', 'RP': 'Rheinland-Pfalz', 'SL': 'Saarland', 'SN': 'Sachsen',
            'ST': 'Sachsen-Anhalt', 'SH': 'Schleswig-Holstein', 'TH': 'Thüringen'
        }
    };

    // Subscribe to country code changes to update states list
    $: {
        if ($selectedCountryCode) {
            updateStatesList($selectedCountryCode);
        }
    }

    function updateStatesList(countryCode: string) {
        try {
            // Get states for known countries
            if (countryStates[countryCode]) {
                statesList = countryStates[countryCode];
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
