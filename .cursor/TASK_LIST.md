# PTO Planner Implementation Tasks

This document outlines the next development steps for the PTO Planner application, focusing on completing core functionality.

## Completed Tasks

- [x] Set up project structure
- [x] Create basic calendar components (CalendarGrid.svelte, CalendarMonth.svelte)
- [x] Set up initial store files (ptoStore.ts, holidayStore.ts)
- [x] Implement initial utility functions (ptoData.ts, holidayUtils.ts)

## In Progress Tasks

- [ ] Fix day selection functionality in the calendar
- [ ] Configure Ghibli theme styling
- [ ] Complete UI components and layout
- [ ] Implement PTO input form functionality

## Priority Tasks

### Bug Fixes

- [ ] Debug and fix the toggleSelectedPTODay function in ptoStore.ts
  - [ ] Verify date comparison logic works correctly
  - [ ] Add console logging to trace selection state changes
  - [ ] Fix any issues with date serialization/deserialization
- [ ] Fix CalendarMonth.svelte day selection issues
  - [ ] Ensure proper reactivity with the ptoStore
  - [ ] Fix visual feedback when days are selected
  - [ ] Test with different browsers

### Theme Implementation

- [ ] Configure Ghibli theme colors in tailwind.config.js
- [ ] Replace hard-coded color values with Ghibli theme variables:
  - [ ] Update weekend color (#e0e0e0 → ghibli-card)
  - [ ] Update optimized days color (#4caf50 → ghibli-accent)
  - [ ] Update holiday color (#7e57c2 → ghibli-blue)
  - [ ] Update selected-pto color (#ff9800 → ghibli-primary)
- [ ] Apply Ghibli theme fonts and styling to components

### UI and Navigation

- [ ] Implement pill/island style menu with calendar legend tabs
- [ ] Create Legend.svelte component with items for:
  - [ ] Suggested PTO
  - [ ] Selected PTO
  - [ ] Weekend
  - [ ] Public Holidays
- [ ] Ensure responsive design works correctly on all screen sizes

### User Input Functionality

- [ ] Create PtoForm.svelte in settings/ directory
- [ ] Connect form to ptoStore.ts for:
  - [ ] Initial PTO balance
  - [ ] PTO balance unit (days/hours)
  - [ ] PTO balance as of date
  - [ ] Accrual rate
  - [ ] Accrual frequency
- [ ] Improve UI for input forms with proper validation
- [ ] Add save functionality for user preferences

### Calendar Interaction

- [ ] Improve CalendarMonth.svelte to show better visual feedback on day clicks
- [ ] Add hover effects for interactive calendar days
- [ ] Connect calendar interactions with ptoStore more effectively
- [ ] Add real-time PTO balance calculations as days are selected
- [ ] Display duration summary for consecutive PTO selections

### PTO Optimization

- [ ] Implement PTO optimization strategies in ptoData.ts:
  - [ ] Balanced Mix - combination of short breaks and longer vacations
  - [ ] Long Weekends - extend weekends to 3-4 day breaks
  - [ ] Mini Breaks - create 5-6 day breaks throughout year
  - [ ] Week-Long Breaks - optimize for 7-9 day getaways
  - [ ] Extended Vacations - find opportunities for 10-15 day breaks
- [ ] Create OptimizationPanel.svelte in settings/ directory
- [ ] Add UI controls to switch between optimization strategies
- [ ] Calculate and display suggested PTO days for each strategy
- [ ] Add "Apply Strategy" button to accept optimization suggestions

### Data Persistence

- [ ] Debug localStorage persistence issues
- [ ] Add email-based "magic link" functionality
- [ ] Create summary/export feature for PTO plans

## Implementation Plan

### Bug Fix Approach

1. Add diagnostic logging to ptoStore.ts to track state changes
2. Create simple test cases for day selection
3. Verify that date objects are properly handled in store functions
4. Fix any serialization issues when storing/retrieving from localStorage
5. Ensure proper reactivity between store updates and component rendering

### Calendar Interaction Flow

1. User clicks on a non-weekend, non-holiday date in CalendarMonth.svelte
2. toggleSelectedPTODay function in ptoStore.ts is called
3. selectedPTODays store is updated
4. CalendarMonth reacts to the change and updates the visual display
5. PTO balance calculations are updated via store subscription
6. Duration for consecutive days is displayed in the calendar

### PTO Optimization Algorithm

1. Identify all weekends and public holidays using holidayStore data
2. For each strategy:
   - Analyze full year calendar to find optimal blocks based on strategy rules
   - Consider existing PTO balance constraints
   - Identify periods that maximize time off with minimum PTO days used
   - Return optimizedDaysOff array to be displayed in the calendar

### Relevant Files

#### Existing Files
- `src/lib/components/calendar/CalendarMonth.svelte` - Main calendar component with day selection
- `src/lib/components/calendar/CalendarGrid.svelte` - Calendar grid structure
- `src/lib/stores/ptoStore.ts` - PTO state management with toggleSelectedPTODay function
- `src/lib/stores/holidayStore.ts` - Holiday data management
- `src/lib/utils/ptoData.ts` - PTO calculation utilities
- `src/lib/utils/holidayUtils.ts` - Holiday data utilities

#### Files to Create
- `src/lib/components/Legend.svelte` - Calendar legend component
- `src/lib/components/settings/PtoForm.svelte` - PTO input form
- `src/lib/components/settings/OptimizationPanel.svelte` - PTO optimization panel
- `src/lib/components/layout/Menu.svelte` - Pill/island style menu 