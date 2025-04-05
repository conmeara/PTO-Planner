<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import type { Unsubscriber } from 'svelte/store';
    import CalendarLegendMenu from '../ui/CalendarLegendMenu.svelte';
    import { initializeStores, updateHolidays, selectedCountryCode } from '../../stores/holidayStore';
    import { initializePTOStores } from '../../stores/ptoStore';

    let activeTab = 'holiday'; // Default to holiday tab
    let countryCodeSubscription: Unsubscriber | undefined;

    function handleTabChange(event: CustomEvent<string>) {
        // Update active tab based on event detail
        activeTab = event.detail;
        
        // If holiday tab is selected, ensure holiday data is up-to-date
        if (activeTab === 'holiday') {
            updateHolidays();
        }

        // Log for debugging
        console.log('Tab changed to:', activeTab);
    }

    onMount(() => {
        // Initialize stores
        initializeStores();
        initializePTOStores();
        
        // Subscribe to country code changes
        countryCodeSubscription = selectedCountryCode.subscribe(code => {
            if (code) {
                console.log(`Country code changed to: ${code}, updating holidays`);
                updateHolidays();
            }
        });
    });

    onDestroy(() => {
        // Clean up subscription
        if (countryCodeSubscription) {
            countryCodeSubscription();
        }
    });
</script>

<div class="settings-panel">
    <!-- Calendar Legend Menu -->
    <CalendarLegendMenu on:tabChange={handleTabChange} />
</div>

<style>
    .settings-panel {
        margin-bottom: 20px;
    }
</style>
