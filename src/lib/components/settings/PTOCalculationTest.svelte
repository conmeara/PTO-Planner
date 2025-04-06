<script lang="ts">
  import { currentPTOTodayBalance, ptoConfig, dailyPTOLedger } from '../../stores/ptoStore';
  import type { PtoTransaction } from '../../types';
  import { toYYYYMMDD } from '../../utils/ptoEngine';
  
  // Test dates for verification
  let testDates = [
    new Date(), // Today
    new Date(new Date().getFullYear(), 11, 31), // December 31st
    new Date(new Date().getFullYear() + 1, 5, 15) // June 15th next year
  ];
  
  // Format date for display
  function formatDate(date: Date): string {
    return date.toLocaleDateString();
  }
  
  // Get all transactions for a specific date from the ledger
  function getTransactionsForDate(date: Date): PtoTransaction[] | undefined {
    const dateKey = toYYYYMMDD(date);
    let transactions: PtoTransaction[] | undefined;
    
    dailyPTOLedger.subscribe(ledger => {
      if (ledger[dateKey] && ledger[dateKey].transactions) {
        transactions = ledger[dateKey].transactions;
      }
    })();
    
    return transactions;
  }
  
  // Format transaction for display
  function formatTransaction(transaction: PtoTransaction): string {
    const amountFormatted = transaction.amount >= 0 ? `+${transaction.amount}` : `${transaction.amount}`;
    return `${transaction.type}: ${amountFormatted} ${$ptoConfig.balanceUnit} - ${transaction.note || ''}`;
  }
  
  // Add a custom test date
  let customDate = '';
  function addTestDate() {
    if (customDate) {
      const newDate = new Date(customDate);
      if (!isNaN(newDate.getTime())) {
        testDates = [...testDates, newDate];
        customDate = '';
      }
    }
  }
</script>

<div class="pto-calculation-test">
  <h3 class="text-lg font-medium mb-2">PTO Calculation Verification</h3>
  <p class="text-sm text-gray-500 mb-4">
    Check PTO balances and transactions on specific dates to verify accuracy
  </p>
  
  <div class="test-summary mb-6">
    <h4 class="text-md font-medium mb-2">Current PTO Balance</h4>
    <p class="text-2xl font-bold">
      {$currentPTOTodayBalance.toFixed(1)} {$ptoConfig.balanceUnit}
    </p>
  </div>
  
  <div class="add-test-date mb-4">
    <h4 class="text-md font-medium mb-2">Add Test Date</h4>
    <div class="flex gap-2">
      <input 
        type="date" 
        bind:value={customDate} 
        class="block rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
      />
      <button 
        on:click={addTestDate}
        class="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
      >
        Add
      </button>
    </div>
  </div>
  
  <div class="test-results">
    <h4 class="text-md font-medium mb-2">Test Results</h4>
    
    <div class="test-dates grid gap-4">
      {#each testDates as date}
        <div class="test-date bg-gray-50 p-4 rounded-lg">
          <div class="flex justify-between items-center mb-2">
            <h5 class="font-medium">{formatDate(date)}</h5>
            <div class="balance-pill bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              {#if $dailyPTOLedger[toYYYYMMDD(date)]}
                {$dailyPTOLedger[toYYYYMMDD(date)].balance.toFixed(1)} {$ptoConfig.balanceUnit}
              {:else}
                N/A
              {/if}
            </div>
          </div>
          
          <div class="transactions">
            {#if getTransactionsForDate(date) && getTransactionsForDate(date)!.length > 0}
              <h6 class="text-sm font-medium text-gray-500 mb-1">Transactions:</h6>
              <ul class="transaction-list text-sm pl-2">
                {#each getTransactionsForDate(date)! as transaction}
                  <li class="mb-1 flex items-center">
                    <span class={`transaction-type ${transaction.type} w-2 h-2 rounded-full mr-2`}></span>
                    {formatTransaction(transaction)}
                  </li>
                {/each}
              </ul>
            {:else}
              <p class="text-sm text-gray-500 italic">No transactions on this date</p>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .pto-calculation-test {
    margin-top: 2rem;
  }
  
  .test-dates {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
  
  .transaction-type.accrual {
    background-color: #4caf50;
  }
  
  .transaction-type.usage {
    background-color: #f44336;
  }
  
  .transaction-type.carryover {
    background-color: #ff9800;
  }
  
  .transaction-type.adjustment {
    background-color: #2196f3;
  }
</style> 