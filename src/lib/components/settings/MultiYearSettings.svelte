<script lang="ts">
    import { ptoConfig, updateVisibleYears, updateCarryoverSettings } from '../../stores/ptoStore';
    import type { CarryoverOptions } from '../../types';
    
    // Local state for form
    let visibleYears: number[] = [];
    let carryoverEnabled: boolean = true;
    let carryoverMaxDays: number | undefined = undefined; // undefined means infinite
    
    // Subscribe to store changes
    $: if ($ptoConfig) {
        visibleYears = [...$ptoConfig.visibleYears];
        carryoverEnabled = $ptoConfig.carryover.enabled;
        carryoverMaxDays = $ptoConfig.carryover.maxDays === Infinity ? undefined : $ptoConfig.carryover.maxDays;
    }
    
    // Handle form submission
    function handleYearsSave() {
        if (visibleYears.length === 0) {
            alert('You must select at least one year');
            return;
        }
        
        // Sort years in ascending order
        const sortedYears = [...visibleYears].sort((a, b) => a - b);
        updateVisibleYears(sortedYears);
    }
    
    // Handle carryover settings update
    function handleCarryoverSave() {
        const carryover: CarryoverOptions = {
            enabled: carryoverEnabled,
            maxDays: carryoverMaxDays === undefined ? Infinity : carryoverMaxDays
        };
        
        updateCarryoverSettings(carryover);
    }
    
    // Generate year options (current year - 1 to current year + 5)
    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from({ length: 7 }, (_, i) => currentYear - 1 + i);
    
    // Toggle a year selection
    function toggleYear(year: number) {
        if (visibleYears.includes(year)) {
            // Don't allow removing the last year
            if (visibleYears.length <= 1) {
                alert('You must have at least one year selected');
                return;
            }
            visibleYears = visibleYears.filter(y => y !== year);
        } else {
            visibleYears = [...visibleYears, year];
        }
    }
</script>

<div class="multi-year-settings">
    <div class="settings-section">
        <h3>Visible Years</h3>
        <p class="description">Select which years to include in your PTO calculations</p>
        
        <div class="year-options">
            {#each yearOptions as year}
                <label class="year-option">
                    <input 
                        type="checkbox" 
                        checked={visibleYears.includes(year)} 
                        on:change={() => toggleYear(year)} 
                    />
                    <span>{year}</span>
                </label>
            {/each}
        </div>
        
        <button class="save-button" on:click={handleYearsSave}>
            Save Visible Years
        </button>
    </div>
    
    <div class="settings-section">
        <h3>PTO Carryover</h3>
        <p class="description">Configure how unused PTO carries over between years</p>
        
        <label class="setting-option">
            <input 
                type="checkbox" 
                bind:checked={carryoverEnabled} 
            />
            <span>Enable PTO carryover</span>
        </label>
        
        {#if carryoverEnabled}
            <div class="setting-input">
                <label for="carryover-max">
                    Maximum days to carry over:
                    <span class="hint">(leave empty for unlimited)</span>
                </label>
                <input 
                    id="carryover-max"
                    type="number" 
                    bind:value={carryoverMaxDays} 
                    min="0"
                    step="0.5"
                    placeholder="Unlimited"
                />
            </div>
        {/if}
        
        <button class="save-button" on:click={handleCarryoverSave}>
            Save Carryover Settings
        </button>
    </div>
</div>

<style>
    .multi-year-settings {
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 24px;
    }
    
    .settings-section {
        background-color: #f9f9f9;
        padding: 16px;
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        gap: 12px;
    }
    
    h3 {
        margin: 0;
        font-size: 1.2rem;
        color: #333;
    }
    
    .description {
        margin: 0;
        color: #666;
        font-size: 0.9rem;
    }
    
    .year-options {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-bottom: 10px;
    }
    
    .year-option {
        display: flex;
        align-items: center;
        gap: 5px;
        background-color: #fff;
        padding: 8px 12px;
        border-radius: 16px;
        border: 1px solid #ddd;
        cursor: pointer;
        user-select: none;
    }
    
    .year-option input[type="checkbox"] {
        margin: 0;
    }
    
    .setting-option {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
    }
    
    .setting-input {
        display: flex;
        flex-direction: column;
        gap: 5px;
        margin-bottom: 10px;
    }
    
    .setting-input input {
        padding: 8px;
        border-radius: 4px;
        border: 1px solid #ddd;
        width: 120px;
    }
    
    .hint {
        font-size: 0.8rem;
        color: #888;
        margin-left: 5px;
    }
    
    .save-button {
        padding: 10px 16px;
        background-color: #4a90e2;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
        align-self: flex-start;
        transition: background-color 0.2s;
    }
    
    .save-button:hover {
        background-color: #3a7bc8;
    }
    
    @media (max-width: 768px) {
        .multi-year-settings {
            padding: 12px;
        }
        
        .year-options {
            gap: 6px;
        }
        
        .year-option {
            padding: 6px 10px;
            font-size: 0.9rem;
        }
    }
</style> 