<script lang="ts">
    import { onMount } from 'svelte';
    import CalendarLegendMenu from '../ui/CalendarLegendMenu.svelte';
    import { initializeStores, updateHolidays } from '../../stores/holidayStore';
    import { initializePTOStores } from '../../stores/ptoStore';

    let activeTab = 'holiday'; // Default to holiday tab

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
        initializeStores();
        initializePTOStores();
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
