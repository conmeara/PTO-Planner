<script lang="ts">
  import { ptoConfig, updatePayPeriodTemplate } from '../../stores/ptoStore';
  import type { PayPeriodTemplate } from '../../types';

  let frequency = $ptoConfig.payPeriodTemplate?.frequency || 'monthly';
  let weekday = $ptoConfig.payPeriodTemplate?.weekday !== undefined ? $ptoConfig.payPeriodTemplate.weekday : 5; // Default to Friday (5)
  let dayOfMonth = $ptoConfig.payPeriodTemplate?.dayOfMonth !== undefined ? $ptoConfig.payPeriodTemplate.dayOfMonth : 1; // Default to 1st
  
  // Update local values when ptoConfig changes
  $: if ($ptoConfig.payPeriodTemplate) {
    frequency = $ptoConfig.payPeriodTemplate.frequency;
    weekday = $ptoConfig.payPeriodTemplate.weekday !== undefined ? $ptoConfig.payPeriodTemplate.weekday : 5;
    dayOfMonth = $ptoConfig.payPeriodTemplate.dayOfMonth !== undefined ? $ptoConfig.payPeriodTemplate.dayOfMonth : 1;
  }
  
  const weekdays = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' }
  ];
  
  // Generate days 1-31 for monthly selection
  const daysOfMonth = Array.from({ length: 31 }, (_, i) => ({ value: i + 1, label: `${i + 1}${getDaySuffix(i + 1)}` }));
  
  function getDaySuffix(day: number): string {
    if (day >= 11 && day <= 13) {
      return 'th';
    }
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  }
  
  function handleFrequencyChange(): void {
    applyChanges();
  }
  
  function applyChanges(): void {
    const template: PayPeriodTemplate = {
      frequency,
      weekday: frequency === 'monthly' ? undefined : weekday,
      dayOfMonth: frequency === 'monthly' ? dayOfMonth : undefined
    };
    
    updatePayPeriodTemplate(template);
  }
</script>

<div class="pay-period-settings">
  <div class="settings-header">
    <h3 class="text-lg font-medium">Pay Period Configuration</h3>
    <p class="text-sm text-gray-500 mb-4">
      Configure when your PTO accrues for more accurate calculations
    </p>
  </div>
  
  <div class="settings-form">
    <div class="form-group mb-4">
      <label for="frequency" class="block text-sm font-medium mb-1">Accrual Frequency</label>
      <select 
        id="frequency" 
        bind:value={frequency} 
        on:change={handleFrequencyChange}
        class="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
      >
        <option value="weekly">Weekly</option>
        <option value="bi-weekly">Bi-weekly</option>
        <option value="monthly">Monthly</option>
      </select>
    </div>
    
    {#if frequency === 'monthly'}
      <div class="form-group mb-4">
        <label for="dayOfMonth" class="block text-sm font-medium mb-1">Day of Month</label>
        <select 
          id="dayOfMonth" 
          bind:value={dayOfMonth} 
          on:change={applyChanges}
          class="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
        >
          {#each daysOfMonth as day}
            <option value={day.value}>{day.label}</option>
          {/each}
        </select>
        <p class="text-xs text-gray-500 mt-1">
          PTO will accrue on this day each month. If the month doesn't have this day, it will accrue on the last day of the month.
        </p>
      </div>
    {:else}
      <div class="form-group mb-4">
        <label for="weekday" class="block text-sm font-medium mb-1">Day of Week</label>
        <select 
          id="weekday" 
          bind:value={weekday} 
          on:change={applyChanges}
          class="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
        >
          {#each weekdays as day}
            <option value={day.value}>{day.label}</option>
          {/each}
        </select>
        <p class="text-xs text-gray-500 mt-1">
          PTO will accrue every {frequency === 'weekly' ? 'week' : 'two weeks'} on this day.
        </p>
      </div>
    {/if}
  </div>
</div>

<style>
  .pay-period-settings {
    margin-bottom: 2rem;
    padding: 1.5rem;
    border-radius: 0.5rem;
    background-color: #f8f9fa;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
</style> 