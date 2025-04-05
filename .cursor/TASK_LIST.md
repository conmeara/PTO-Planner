# PTO Planner - Next Steps Task List

Below is the updated task list focusing on user input functionality in the top-pill menu, calendar interaction, saving and hosting, styling with the Ghibli theme, and eventually implementing enhanced PTO optimization algorithms.

---

## Completed Tasks

- [x] Basic calendar rendering (CalendarGrid, CalendarMonth)
- [x] Basic PTO and holiday store setup
- [x] Initial UI layout with top tabs/pills (Suggested PTO, Selected PTO, Weekends, Public Holidays)
- [x] LocalStorage persistence scaffolding (partial)
- [x] Suggested PTO Optimization Algorithms

---

## In Progress Tasks

1. **Top Pill Menu Functionality**
   - [X] Ensure tabs for **Suggested PTO**, **Selected PTO**, **Weekends**, and **Public Holidays** correctly open/close their respective panels.
   - [ ] Hook up user interactions (clicking a day, toggling weekend settings, changing country/year, etc.) so they refresh data properly in the UI.

2. **Calendar Interaction**
   - [ ] Fix or refine day-selection logic so that:
     - Clicking a day toggles PTO on/off correctly.
     - The UI highlights selected PTO days immediately.
     - PTO balance updates in real time.
   - [ ] Confirm that weekends and public holidays remain non-selectable (or selectable only if business logic allows).
   - [ ] Validate that all store reactivity flows as expected.

3. **User Input Sections in the Settings Panel**
   - [ ] **Selected PTO Panel**:  
     - Display the user's currently selected PTO days.  
     - Show total consecutive days.  
     - Integrate with the existing PTO store to update the selected days in real time.
   - [ ] **Public Holidays Panel**:  
     - Display the selected country/state and year.  
     - Show an editable list or summary of public holidays.  
     - Allow toggling (or hiding) specific holidays if needed.
   - [ ] **Weekend Settings Panel**:  
     - List which days are "weekend" by default.  
     - Allow adding/removing weekend days.  
     - Re-render calendar once changes are made.
   - [x] **Suggested PTO Panel**:  
     - Display optimization strategy selector.
     - Show suggested PTO days based on selected strategy.
     - Include "Apply" button to add suggested days to selected PTO.

4. **Data Saving & Persistence**
   - [ ] Expand localStorage saving so all user inputs (weekends, PTO, holidays, year, etc.) persist across sessions.
   - [ ] Begin designing a "Save/Load" concept in the UI:
     - Possibly a tab or button in the "Selected PTO" section.
     - Include a placeholder for "Buy Me a Coffee" link.

---

## Upcoming Tasks

Once the above functionality is complete and stable, we will proceed as follows:

1. **Styling & Theming**
   - [ ] Migrate current hard-coded colors to Ghibli theme variables.
   - [ ] Refine overall look (pills, headings, backgrounds) to match the Ghibli-inspired palette.
   - [ ] Confirm responsive layout looks good on mobile devices.

2. **Hosting & Buy-Me-A-Coffee**
   - [ ] Finalize deployment on Vercel (including environment config if needed).
   - [ ] Add "Buy Me a Coffee" link or button in the "Save" menu or top navigation.

3. **Future Enhancements**
   - [ ] User authentication and "magic link" functionality.
   - [ ] Email summary or shareable link.
   - [ ] Additional "What if" scenarios (e.g., partial days, year-over-year carryover).

---

## Detailed Implementation Plan

### 1. Pill Menu & Calendar Interaction

- **Files to Update**:  
  - `src/lib/components/ui/CalendarLegendMenu.svelte`  
  - `src/lib/components/calendar/CalendarMonth.svelte`  
  - `src/lib/stores/ptoStore.ts`  
  - `src/lib/stores/holidayStore.ts`
- **Steps**:  
  1. Verify each tab's toggle in `CalendarLegendMenu.svelte` calls the correct logic.  
  2. In `CalendarMonth.svelte`, ensure `handleDayClick()` updates `selectedPTODays` in `ptoStore.ts`.  
  3. Confirm weekends/holidays ignore or handle clicks per business logic.  
  4. Re-check reactivity with derived store data to reflect new PTO selections instantly.

### 2. User Input Panels

- **Files to Update**:  
  - `SettingsPanel.svelte`  
  - `PTOBalanceSettings.svelte`  
  - `CountrySelector.svelte`, `StateSelector.svelte`, `WeekendSettings.svelte`, `DaysOffSelector.svelte`  
  - `CalendarLegendMenu.svelte` (for toggling the new sections)
- **Steps**:  
  1. Ensure each panel corresponds to the correct store updates (country changes reload holiday data, etc.).  
  2. In the **Selected PTO** panel, show a list of the user's chosen days (`selectedPTODays`).  
  3. Summaries for consecutive day blocks, total PTO used, and the updated balance.  
  4. In the **Weekend Settings** panel, allow removing or adding day indices to `weekendDays`.

### 3. Persistence & Save Menu

- **Files to Update**:  
  - `ptoStore.ts`, `holidayStore.ts` (to confirm all data is stored in localStorage).  
  - Possibly a new `SaveMenu.svelte` or repurpose an existing panel for "Save & Support."
- **Steps**:  
  1. Confirm each store's subscribe block updates localStorage.  
  2. On mount, re-hydrate from localStorage to preserve user selections.  
  3. Add a "Save/Load" button or section in the UI.  
  4. Insert "Buy Me a Coffee" link or donation button inside that same panel.

### 4. Theme & UI Cleanup

- **Files to Update**:  
  - Potentially all Svelte components containing color definitions.
  - `tailwind.config.js` (if we integrate or finalize Tailwind for Ghibli theming).
- **Steps**:  
  1. Replace existing color hex codes with theme variables.  
  2. Adjust spacing, fonts, and radius for a consistent Ghibli style.  
  3. Validate final look on small/medium/large screens.

### 5. PTO Optimization Strategies - COMPLETED

- **Files Updated**:  
  - Added `src/lib/utils/optimizationUtils.ts` for strategy implementation.
  - Created `src/lib/stores/strategyStore.ts` for strategy selection.
  - Updated `src/lib/types/index.ts` with strategy types and interfaces.
  - Modified `CalendarLegendMenu.svelte` to add strategy selector.
  - Updated `CalendarGrid.svelte` and `CalendarMonth.svelte` to display suggested days.
- **Implementation**:  
  1. Created five strategy functions:
     - Balanced Mix - distributes days evenly across the year
     - Long Weekends - extends weekends for 3-4 day breaks
     - Mini Breaks - creates 2-3 day mini-vacations
     - Week-Long Breaks - focuses on full week vacations
     - Extended Vacations - builds 10+ day extended breaks
  2. Integrated with existing holiday and weekend data
  3. Added UI to select strategies and display suggested days in a unique color
  4. Implemented "Apply" button to add suggested days to selected PTO

---

## Relevant Files

- `src/lib/components/ui/CalendarLegendMenu.svelte`
- `src/lib/components/calendar/CalendarGrid.svelte`
- `src/lib/components/calendar/CalendarMonth.svelte`
- `src/lib/components/settings/`
- `src/lib/stores/ptoStore.ts`
- `src/lib/stores/holidayStore.ts`
- `src/lib/stores/strategyStore.ts`
- `src/lib/utils/holidayUtils.ts`
- `src/lib/utils/optimizationUtils.ts`
- `src/lib/types/index.ts`

---

## Summary

1. **Complete the top-pill menu logic** and ensure each panel (Suggested PTO, Selected PTO, Weekends, Public Holidays) is fully functional.  
2. **Refine calendar day-selection** and real-time store updates.  
3. **Implement a robust "Save" approach** and integrate the "Buy Me a Coffee" link.  
4. **Polish the Ghibli theme** across all components.  
5. **COMPLETED: Developed advanced PTO optimization strategies** with multiple options for users to optimize their time off.