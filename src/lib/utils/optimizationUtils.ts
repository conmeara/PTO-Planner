import type { StrategyInput } from '../types';
import { isWeekend, isHoliday, daysBetween, dateKey } from './holidayUtils';
import { getAvailablePTOOnDate } from '../stores/ptoStore';

const MS_IN_A_DAY = 86400000;

/**
 * Checks if there is enough PTO available for a given date
 */
function hasEnoughPTOForDate(date: Date): boolean {
    const availablePTO = getAvailablePTOOnDate(date);
    
    // Only consider PTO available if there's at least 1 full day
    // We could make this configurable if partial days are supported in the future
    const hasEnough = availablePTO >= 1;
    
    if (!hasEnough) {
        console.log(`Not enough PTO for ${date.toLocaleDateString()} - Balance: ${availablePTO.toFixed(1)}`);
    }
    
    return hasEnough;
}

/**
 * Generates a Balanced Mix of days throughout the year
 * Focuses on creating a distributed set of 3-5 day breaks
 */
export function getBalancedMixDays(input: StrategyInput): Date[] {
    const { year, weekends, holidays, ptoBalance } = input;
    const allDaysOff = new Set([
        ...holidays.map(h => dateKey(h.date)),
        ...getWeekends(year, weekends).map(d => dateKey(d))
    ]);

    // Find potential gaps between days off
    const gaps = findGaps(allDaysOff, year, weekends, 3); // Look for smaller gaps for balanced distribution
    const rankedGaps = rankGapsByEfficiency(gaps, allDaysOff, weekends);
    
    // Select days that create balanced breaks throughout the year
    return selectDaysForStrategy(rankedGaps, ptoBalance, allDaysOff, weekends, 'balanced');
}

/**
 * Focus on creating long weekends by adding 1-2 PTO days around holidays/weekends
 */
export function getLongWeekendsDays(input: StrategyInput): Date[] {
    const { year, weekends, holidays, ptoBalance } = input;
    const allDaysOff = new Set([
        ...holidays.map(h => dateKey(h.date)),
        ...getWeekends(year, weekends).map(d => dateKey(d))
    ]);

    // For long weekends, we're looking for 1-2 day gaps adjacent to holidays or weekends
    const gaps = findGaps(allDaysOff, year, weekends, 2);
    const rankedGaps = rankGapsByEfficiency(gaps, allDaysOff, weekends);
    
    return selectDaysForStrategy(rankedGaps, ptoBalance, allDaysOff, weekends, 'long-weekends');
}

/**
 * Creates multiple mini breaks of 5-6 days throughout the year
 */
export function getMiniBreaksDays(input: StrategyInput): Date[] {
    const { year, weekends, holidays, ptoBalance } = input;
    const allDaysOff = new Set([
        ...holidays.map(h => dateKey(h.date)),
        ...getWeekends(year, weekends).map(d => dateKey(d))
    ]);

    // For mini breaks, look for clusters that can be extended to 5-6 days
    const gaps = findGaps(allDaysOff, year, weekends, 4);
    const rankedGaps = rankGapsByEfficiency(gaps, allDaysOff, weekends);
    
    return selectDaysForStrategy(rankedGaps, ptoBalance, allDaysOff, weekends, 'mini-breaks');
}

/**
 * Focus on creating 1-2 week-long breaks (7-9 days)
 */
export function getWeekLongBreaksDays(input: StrategyInput): Date[] {
    const { year, weekends, holidays, ptoBalance } = input;
    const allDaysOff = new Set([
        ...holidays.map(h => dateKey(h.date)),
        ...getWeekends(year, weekends).map(d => dateKey(d))
    ]);

    // For week-long breaks, prioritize filling adjacent days
    // around existing holiday clusters
    const clusters = findPotentialClusters(allDaysOff, year, weekends);
    const gaps = findGapsAroundClusters(clusters, allDaysOff, year, weekends);
    const rankedGaps = rankGapsByLength(gaps, allDaysOff, weekends);
    
    return selectDaysForStrategy(rankedGaps, ptoBalance, allDaysOff, weekends, 'week-long');
}

/**
 * Creates one or two extended vacation periods (10-15 days)
 */
export function getExtendedVacationsDays(input: StrategyInput): Date[] {
    const { year, weekends, holidays, ptoBalance } = input;
    const allDaysOff = new Set([
        ...holidays.map(h => dateKey(h.date)),
        ...getWeekends(year, weekends).map(d => dateKey(d))
    ]);

    // For extended vacations, look for the best season and create a longer break
    const clusters = findPotentialClusters(allDaysOff, year, weekends);
    // Sort clusters by most efficient (most days off already present)
    const sortedClusters = clusters.sort((a, b) => b.daysOffCount - a.daysOffCount);
    
    const result: Date[] = [];
    let remainingPTO = ptoBalance;
    
    if (sortedClusters.length > 0 && remainingPTO > 0) {
        // Focus on 1-2 clusters to create extended breaks
        for (let i = 0; i < Math.min(2, sortedClusters.length) && remainingPTO > 0; i++) {
            const cluster = sortedClusters[i];
            const workdays = getWorkdaysInRange(cluster.start, cluster.end, weekends, allDaysOff);
            
            // Add up to 10 days per break, or less if not enough PTO
            const daysToUse = Math.min(10, remainingPTO, workdays.length);
            
            // Add the workdays to the result, but check PTO availability first
            for (let j = 0; j < daysToUse; j++) {
                const day = workdays[j];
                if (hasEnoughPTOForDate(day)) {
                    result.push(day);
                    remainingPTO--;
                }
            }
        }
    }
    
    return result;
}

// Helper functions

/**
 * Get all weekend days for a year
 */
function getWeekends(year: number, weekendDays: number[]): Date[] {
    const weekends = [];
    for (let d = new Date(year, 0, 1); d <= new Date(year, 11, 31); d.setDate(d.getDate() + 1)) {
        if (weekendDays.includes(d.getDay())) {
            weekends.push(new Date(d));
        }
    }
    return weekends;
}

/**
 * Find gaps between days off that could be filled with PTO
 */
function findGaps(allDaysOff: Set<string>, year: number, weekendDays: number[], maxGapLength = 5) {
    const gaps = [];
    let gapStart = null;

    for (let d = new Date(year, 0, 1); d <= new Date(year, 11, 31); d.setDate(d.getDate() + 1)) {
        const key = dateKey(d);
        if (!allDaysOff.has(key) && !isWeekend(d, weekendDays)) {
            if (!gapStart) gapStart = new Date(d);
        } else if (gapStart) {
            const gapLength = daysBetween(gapStart, d);
            if (gapLength > 0 && gapLength <= maxGapLength) {
                gaps.push({ start: gapStart, end: new Date(d.getTime() - MS_IN_A_DAY), gapLength });
            }
            gapStart = null;
        }
    }
    return gaps;
}

/**
 * Rank gaps by efficiency for creating longer breaks
 */
function rankGapsByEfficiency(gaps: any[], allDaysOff: Set<string>, weekendDays: number[]) {
    return gaps
        .map(gap => {
            const [backward, forward] = ['backward', 'forward'].map(direction => 
                calculateChain(direction === 'backward' ? gap.start : gap.end, gap.gapLength, allDaysOff, direction as 'backward' | 'forward', weekendDays)
            );
            return forward.chainLength > backward.chainLength || 
                   (forward.chainLength === backward.chainLength && forward.usedDaysOff <= backward.usedDaysOff)
                ? { ...gap, ...forward, fillFrom: 'end' }
                : { ...gap, ...backward, fillFrom: 'start' };
        })
        .sort((a, b) => b.chainLength - a.chainLength || a.gapLength - b.gapLength || a.usedDaysOff - b.usedDaysOff);
}

/**
 * Rank gaps by length for week-long breaks
 */
function rankGapsByLength(gaps: any[], allDaysOff: Set<string>, weekendDays: number[]) {
    return gaps.sort((a, b) => b.gapLength - a.gapLength);
}

/**
 * Calculate potential chain length in either direction from a gap
 */
function calculateChain(date: Date, gapLength: number, allDaysOff: Set<string>, direction: 'backward' | 'forward', weekendDays: number[]) {
    const increment = direction === 'backward' ? -1 : 1;
    let chainLength = gapLength;
    let currentDate = new Date(date);
    
    while (allDaysOff.has(dateKey(new Date(currentDate.getTime() + MS_IN_A_DAY * increment))) || 
           isWeekend(new Date(currentDate.getTime() + MS_IN_A_DAY * increment), weekendDays)) {
        chainLength++;
        currentDate.setDate(currentDate.getDate() + increment);
    }

    return { 
        chainLength, 
        usedDaysOff: Array.from({ length: gapLength }, (_, i) => {
            const d = new Date(date);
            d.setDate(d.getDate() + i * increment);
            return !allDaysOff.has(dateKey(d)) && !isWeekend(d, weekendDays);
        }).filter(Boolean).length
    };
}

/**
 * Select days for a specific strategy
 */
function selectDaysForStrategy(
    rankedGaps: any[], 
    ptoBalance: number, 
    allDaysOff: Set<string>, 
    weekendDays: number[],
    strategy: string
): Date[] {
    const selectedDays: Date[] = [];
    let remainingDays = ptoBalance;

    for (const gap of rankedGaps) {
        if (remainingDays <= 0) break;
        
        const increment = gap.fillFrom === 'start' ? 1 : -1;
        const startDate = gap.fillFrom === 'start' ? gap.start : gap.end;
        
        // For long weekends, we want to limit each gap to 1-2 days max
        const maxDaysPerGap = strategy === 'long-weekends' ? 2 : 
                             strategy === 'mini-breaks' ? 3 :
                             strategy === 'balanced' ? 4 : gap.gapLength;
                             
        // Make sure we're not using more days than the gap has
        const daysToUse = Math.min(maxDaysPerGap, gap.gapLength, remainingDays);

        for (let i = 0; i < daysToUse; i++) {
            const day = new Date(startDate);
            day.setDate(day.getDate() + (i * increment));
            
            if (!allDaysOff.has(dateKey(day)) && !isWeekend(day, weekendDays)) {
                // Check if enough PTO is available on this day according to the ledger
                if (hasEnoughPTOForDate(day)) {
                    selectedDays.push(day);
                    remainingDays--;
                    if (remainingDays <= 0) break;
                }
            }
        }
    }

    return selectedDays;
}

/**
 * Find potential clusters of days off (holidays + weekends)
 */
function findPotentialClusters(allDaysOff: Set<string>, year: number, weekendDays: number[]) {
    const clusters = [];
    let clusterStart = null;
    let daysOffCount = 0;

    for (let d = new Date(year, 0, 1); d <= new Date(year, 11, 31); d.setDate(d.getDate() + 1)) {
        const key = dateKey(d);
        const isDayOff = allDaysOff.has(key) || isWeekend(d, weekendDays);
        
        if (isDayOff) {
            if (!clusterStart) clusterStart = new Date(d);
            daysOffCount++;
        } else if (clusterStart) {
            // Add a buffer of 2 days on each side for potential extension
            const bufferStart = new Date(clusterStart);
            bufferStart.setDate(bufferStart.getDate() - 2);
            
            const bufferEnd = new Date(d);
            bufferEnd.setDate(bufferEnd.getDate() + 1);
            
            clusters.push({ 
                start: bufferStart, 
                end: bufferEnd, 
                daysOffCount 
            });
            
            clusterStart = null;
            daysOffCount = 0;
        }
    }
    
    if (clusterStart) {
        const bufferStart = new Date(clusterStart);
        bufferStart.setDate(bufferStart.getDate() - 2);
        
        const bufferEnd = new Date(year, 11, 31);
        bufferEnd.setDate(bufferEnd.getDate() + 1);
        
        clusters.push({ 
            start: bufferStart, 
            end: bufferEnd, 
            daysOffCount 
        });
    }
    
    return clusters;
}

/**
 * Find gaps around clusters
 */
function findGapsAroundClusters(clusters: any[], allDaysOff: Set<string>, year: number, weekendDays: number[]) {
    const gaps = [];
    
    for (const cluster of clusters) {
        // Find workdays within the cluster range
        const workdays = getWorkdaysInRange(cluster.start, cluster.end, weekendDays, allDaysOff);
        
        if (workdays.length > 0) {
            gaps.push({
                start: cluster.start,
                end: cluster.end,
                gapLength: workdays.length,
                daysOffCount: cluster.daysOffCount
            });
        }
    }
    
    return gaps;
}

/**
 * Get workdays within a date range
 */
function getWorkdaysInRange(start: Date, end: Date, weekendDays: number[], allDaysOff: Set<string>): Date[] {
    const workdays = [];
    const currentDate = new Date(start);
    
    while (currentDate <= end) {
        if (!isWeekend(currentDate, weekendDays) && !allDaysOff.has(dateKey(currentDate))) {
            workdays.push(new Date(currentDate));
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return workdays;
} 