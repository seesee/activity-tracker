/**
 * Tests for Complex Schedule functionality
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock ActivityTracker class for testing
let tracker;

// Create a mock ActivityTracker with complex schedule functionality
class MockActivityTracker {
    constructor() {
        this.defaultSettings = {
            notificationInterval: 60,
            startTime: '08:00',
            endTime: '18:00',
            workingDays: {
                monday: true,
                tuesday: true,
                wednesday: true,
                thursday: true,
                friday: true,
                saturday: false,
                sunday: false
            },
            complexSchedule: {
                monday: [{ start: '09:00', end: '17:00' }],
                tuesday: [{ start: '09:00', end: '17:00' }],
                wednesday: [{ start: '09:00', end: '17:00' }],
                thursday: [{ start: '09:00', end: '17:00' }],
                friday: [{ start: '09:00', end: '17:00' }],
                saturday: [],
                sunday: []
            },
            useComplexSchedule: false
        };
        
        this.settings = { ...this.defaultSettings };
        this.state = {};
    }

    isWithinWorkingHours(time = new Date()) {
        const currentTime = time.getHours() * 60 + time.getMinutes();
        const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][time.getDay()];

        // Check if it's an activity day (always check this first)
        if (!this.settings.workingDays[dayName]) {
            return false;
        }

        // Use complex schedule if enabled
        if (this.settings.useComplexSchedule && this.settings.complexSchedule && this.settings.complexSchedule[dayName]) {
            const ranges = this.settings.complexSchedule[dayName];
            if (!ranges || ranges.length === 0) {
                return false; // No activity hours defined for this day
            }

            // Check if current time falls within any of the defined ranges
            return ranges.some(range => {
                const [startHour, startMin] = range.start.split(':').map(Number);
                const [endHour, endMin] = range.end.split(':').map(Number);
                const startTime = startHour * 60 + startMin;
                const endTime = endHour * 60 + endMin;
                return currentTime >= startTime && currentTime <= endTime;
            });
        } else {
            // Fall back to simple start/end time
            const [startHour, startMin] = this.settings.startTime.split(':').map(Number);
            const [endHour, endMin] = this.settings.endTime.split(':').map(Number);
            const startTime = startHour * 60 + startMin;
            const endTime = endHour * 60 + endMin;
            return currentTime >= startTime && currentTime <= endTime;
        }
    }

    getNextWorkingTime(fromTime) {
        const activityDayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const currentTime = fromTime.getHours() * 60 + fromTime.getMinutes();
        const currentDayName = activityDayNames[fromTime.getDay()];
        
        // Check if there's an activity period later today
        if (this.settings.workingDays[currentDayName]) {
            if (this.settings.useComplexSchedule && this.settings.complexSchedule && this.settings.complexSchedule[currentDayName]) {
                const ranges = this.settings.complexSchedule[currentDayName];
                // Find the next range that starts after current time
                for (const range of ranges) {
                    const [startHour, startMin] = range.start.split(':').map(Number);
                    const startTime = startHour * 60 + startMin;
                    if (startTime > currentTime) {
                        const nextTime = new Date(fromTime);
                        nextTime.setHours(startHour, startMin, 0, 0);
                        return nextTime;
                    }
                }
            } else {
                // Simple schedule
                const [startHour, startMin] = this.settings.startTime.split(':').map(Number);
                const startTime = startHour * 60 + startMin;
                if (startTime > currentTime) {
                    const nextTime = new Date(fromTime);
                    nextTime.setHours(startHour, startMin, 0, 0);
                    return nextTime;
                }
            }
        }
        
        // Check future days (up to 7 days ahead)
        for (let daysAhead = 1; daysAhead <= 7; daysAhead++) {
            const futureDate = new Date(fromTime);
            futureDate.setDate(futureDate.getDate() + daysAhead);
            futureDate.setHours(0, 0, 0, 0);
            
            const futureDayName = activityDayNames[futureDate.getDay()];
            if (this.settings.workingDays[futureDayName]) {
                if (this.settings.useComplexSchedule && this.settings.complexSchedule && this.settings.complexSchedule[futureDayName]) {
                    const ranges = this.settings.complexSchedule[futureDayName];
                    if (ranges.length > 0) {
                        const [startHour, startMin] = ranges[0].start.split(':').map(Number);
                        futureDate.setHours(startHour, startMin, 0, 0);
                        return futureDate;
                    }
                } else {
                    // Simple schedule
                    const [startHour, startMin] = this.settings.startTime.split(':').map(Number);
                    futureDate.setHours(startHour, startMin, 0, 0);
                    return futureDate;
                }
            }
        }
        
        return null; // No activity periods found
    }
}

beforeEach(() => {
    // Set up basic DOM elements for complex schedule
    document.body.innerHTML += `
        <input type="checkbox" id="useComplexSchedule" />
        <div id="simpleSchedule"></div>
        <div id="complexSchedule"></div>
        <div id="monday-ranges"></div>
        <div id="tuesday-ranges"></div>
        <div id="wednesday-ranges"></div>
        <div id="thursday-ranges"></div>
        <div id="friday-ranges"></div>
        <div id="saturday-ranges"></div>
        <div id="sunday-ranges"></div>
        <input type="time" id="startTime" value="08:00" />
        <input type="time" id="endTime" value="18:00" />
        <input type="checkbox" id="monday" />
        <input type="checkbox" id="tuesday" />
        <input type="checkbox" id="wednesday" />
        <input type="checkbox" id="thursday" />
        <input type="checkbox" id="friday" />
        <input type="checkbox" id="saturday" />
        <input type="checkbox" id="sunday" />
    `;
    
    // Create fresh tracker instance
    tracker = new MockActivityTracker();
});

describe('Complex Schedule Data Structure', () => {
    test('should initialize with default complex schedule structure', () => {
        expect(tracker.settings.complexSchedule).toBeDefined();
        expect(tracker.settings.complexSchedule.monday).toEqual([{ start: '09:00', end: '17:00' }]);
        expect(tracker.settings.complexSchedule.saturday).toEqual([]);
        expect(tracker.settings.complexSchedule.sunday).toEqual([]);
        expect(tracker.settings.useComplexSchedule).toBe(false);
    });

    test('should handle empty day schedules', () => {
        tracker.settings.complexSchedule.monday = [];
        tracker.settings.useComplexSchedule = true;
        
        const isWorking = tracker.isWithinWorkingHours(new Date('2025-01-06T10:00:00')); // Monday 10am
        expect(isWorking).toBe(false);
    });

    test('should handle multiple time ranges per day', () => {
        tracker.settings.complexSchedule.monday = [
            { start: '09:00', end: '12:00' },
            { start: '14:00', end: '18:00' }
        ];
        tracker.settings.useComplexSchedule = true;
        tracker.settings.workingDays.monday = true;

        // Test morning range
        const morning = tracker.isWithinWorkingHours(new Date('2025-01-06T10:00:00')); // Monday 10am
        expect(morning).toBe(true);

        // Test break period
        const lunch = tracker.isWithinWorkingHours(new Date('2025-01-06T13:00:00')); // Monday 1pm
        expect(lunch).toBe(false);

        // Test afternoon range
        const afternoon = tracker.isWithinWorkingHours(new Date('2025-01-06T15:00:00')); // Monday 3pm
        expect(afternoon).toBe(true);

        // Test after hours
        const evening = tracker.isWithinWorkingHours(new Date('2025-01-06T19:00:00')); // Monday 7pm
        expect(evening).toBe(false);
    });
});

describe('Activity Hours Validation with Complex Schedule', () => {
    beforeEach(() => {
        tracker.settings.useComplexSchedule = true;
        tracker.settings.workingDays = {
            monday: true,
            tuesday: true,
            wednesday: true,
            thursday: true,
            friday: true,
            saturday: false,
            sunday: false
        };
        tracker.settings.complexSchedule = {
            monday: [{ start: '09:00', end: '17:00' }],
            tuesday: [{ start: '12:00', end: '20:00' }],
            wednesday: [],
            thursday: [{ start: '12:00', end: '20:00' }],
            friday: [{ start: '12:00', end: '20:00' }],
            saturday: [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '18:00' }],
            sunday: [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '18:00' }]
        };
    });

    test('should validate Monday 9am-5pm schedule', () => {
        const tests = [
            { time: '2025-01-06T08:00:00', expected: false }, // Before work
            { time: '2025-01-06T09:00:00', expected: true },  // Start of work
            { time: '2025-01-06T13:00:00', expected: true },  // Lunch break (within range)
            { time: '2025-01-06T17:00:00', expected: true },  // End of work
            { time: '2025-01-06T18:00:00', expected: false }  // After work
        ];

        tests.forEach(({ time, expected }) => {
            const result = tracker.isWithinWorkingHours(new Date(time));
            expect(result).toBe(expected);
        });
    });

    test('should validate Tuesday 12pm-8pm schedule', () => {
        const tests = [
            { time: '2025-01-07T11:00:00', expected: false }, // Before work
            { time: '2025-01-07T12:00:00', expected: true },  // Start of work
            { time: '2025-01-07T16:00:00', expected: true },  // Middle of work
            { time: '2025-01-07T20:00:00', expected: true },  // End of work
            { time: '2025-01-07T21:00:00', expected: false }  // After work
        ];

        tests.forEach(({ time, expected }) => {
            const result = tracker.isWithinWorkingHours(new Date(time));
            expect(result).toBe(expected);
        });
    });

    test('should handle non-working day (Wednesday with empty schedule)', () => {
        const tests = [
            { time: '2025-01-08T09:00:00', expected: false },
            { time: '2025-01-08T13:00:00', expected: false },
            { time: '2025-01-08T17:00:00', expected: false }
        ];

        tests.forEach(({ time, expected }) => {
            const result = tracker.isWithinWorkingHours(new Date(time));
            expect(result).toBe(expected);
        });
    });

    test('should handle split schedule (Saturday)', () => {
        // Enable Saturday as working day for this test
        tracker.settings.workingDays.saturday = true;
        
        const tests = [
            { time: '2025-01-04T08:00:00', expected: false }, // Before first range
            { time: '2025-01-04T10:00:00', expected: true },  // In first range (9-12)
            { time: '2025-01-04T13:00:00', expected: false }, // Between ranges
            { time: '2025-01-04T15:00:00', expected: true },  // In second range (14-18)
            { time: '2025-01-04T19:00:00', expected: false }  // After second range
        ];

        tests.forEach(({ time, expected }) => {
            const result = tracker.isWithinWorkingHours(new Date(time));
            expect(result).toBe(expected);
        });
    });

    test('should respect activity days setting even with complex schedule', () => {
        // Disable Monday as activity day
        tracker.settings.workingDays.monday = false;
        
        const result = tracker.isWithinWorkingHours(new Date('2025-01-06T10:00:00')); // Monday 10am
        expect(result).toBe(false);
    });
});

describe('Fallback to Simple Schedule', () => {
    beforeEach(() => {
        tracker.settings.useComplexSchedule = false;
        tracker.settings.startTime = '08:00';
        tracker.settings.endTime = '18:00';
        tracker.settings.workingDays.monday = true;
    });

    test('should use simple schedule when complex schedule is disabled', () => {
        const tests = [
            { time: '2025-01-06T07:00:00', expected: false },
            { time: '2025-01-06T08:00:00', expected: true },
            { time: '2025-01-06T13:00:00', expected: true },
            { time: '2025-01-06T18:00:00', expected: true },
            { time: '2025-01-06T19:00:00', expected: false }
        ];

        tests.forEach(({ time, expected }) => {
            const result = tracker.isWithinWorkingHours(new Date(time));
            expect(result).toBe(expected);
        });
    });
});

describe('Next Working Time Calculation', () => {
    beforeEach(() => {
        tracker.settings.useComplexSchedule = true;
        tracker.settings.workingDays = {
            monday: true,
            tuesday: true,
            wednesday: false,
            thursday: true,
            friday: true,
            saturday: false,
            sunday: false
        };
        tracker.settings.complexSchedule = {
            monday: [{ start: '09:00', end: '17:00' }],
            tuesday: [{ start: '12:00', end: '20:00' }],
            wednesday: [],
            thursday: [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '18:00' }],
            friday: [{ start: '08:00', end: '16:00' }],
            saturday: [],
            sunday: []
        };
    });

    test('should find next activity time later same day', () => {
        // Monday 8am, next activity starts at 9am
        const current = new Date('2025-01-06T08:00:00');
        const next = tracker.getNextWorkingTime(current);
        
        expect(next).toEqual(new Date('2025-01-06T09:00:00'));
    });

    test('should find next activity time on next day', () => {
        // Monday 6pm (after activity), next activity is Tuesday 12pm
        const current = new Date('2025-01-06T18:00:00');
        const next = tracker.getNextWorkingTime(current);
        
        expect(next).toEqual(new Date('2025-01-07T12:00:00'));
    });

    test('should find next range on same day for split schedule', () => {
        // Thursday 1pm (between ranges), next activity is Thursday 2pm
        const current = new Date('2025-01-09T13:00:00');
        const next = tracker.getNextWorkingTime(current);
        
        expect(next).toEqual(new Date('2025-01-09T14:00:00'));
    });

    test('should skip non-activity days', () => {
        // Tuesday 9pm (after activity), next activity is Thursday 9am (skipping Wednesday)
        const current = new Date('2025-01-07T21:00:00');
        const next = tracker.getNextWorkingTime(current);
        
        expect(next).toEqual(new Date('2025-01-09T09:00:00'));
    });

    test('should handle case with no activity periods', () => {
        tracker.settings.workingDays = {
            monday: false,
            tuesday: false,
            wednesday: false,
            thursday: false,
            friday: false,
            saturday: false,
            sunday: false
        };
        
        const current = new Date('2025-01-06T10:00:00');
        const next = tracker.getNextWorkingTime(current);
        
        expect(next).toBeNull();
    });
});

describe('Schedule Settings Integration', () => {
    test('should maintain backward compatibility with existing settings', () => {
        // Simulate existing user with simple schedule
        const existingSettings = {
            startTime: '09:00',
            endTime: '17:00',
            workingDays: {
                monday: true,
                tuesday: true,
                wednesday: true,
                thursday: true,
                friday: true,
                saturday: false,
                sunday: false
            }
        };

        // Create tracker with existing settings (no complex schedule)
        tracker.settings = { ...tracker.defaultSettings, ...existingSettings };
        
        // Should work with simple schedule
        const result = tracker.isWithinWorkingHours(new Date('2025-01-06T10:00:00')); // Monday 10am
        expect(result).toBe(true);
        
        // Complex schedule should be available but not enabled
        expect(tracker.settings.useComplexSchedule).toBe(false);
        expect(tracker.settings.complexSchedule).toBeDefined();
    });

    test('should handle migration to complex schedule', () => {
        // Start with simple schedule
        tracker.settings.useComplexSchedule = false;
        tracker.settings.startTime = '08:30';
        tracker.settings.endTime = '17:30';
        
        // Enable complex schedule
        tracker.settings.useComplexSchedule = true;
        
        // Should now use complex schedule (which has different default times)
        const result = tracker.isWithinWorkingHours(new Date('2025-01-06T08:00:00')); // Monday 8am
        expect(result).toBe(false); // Complex schedule starts at 9am by default
        
        const result2 = tracker.isWithinWorkingHours(new Date('2025-01-06T09:30:00')); // Monday 9:30am
        expect(result2).toBe(true); // Should be within complex schedule range
    });
});

describe('Edge Cases and Error Handling', () => {
    test('should handle invalid time ranges gracefully', () => {
        tracker.settings.useComplexSchedule = true;
        tracker.settings.workingDays.monday = true;
        
        // Invalid range where end time is before start time
        tracker.settings.complexSchedule.monday = [{ start: '17:00', end: '09:00' }];
        
        const result = tracker.isWithinWorkingHours(new Date('2025-01-06T10:00:00'));
        expect(result).toBe(false); // Should handle gracefully
    });

    test('should handle malformed time strings', () => {
        tracker.settings.useComplexSchedule = true;
        tracker.settings.workingDays.monday = true;
        
        // Malformed time strings
        tracker.settings.complexSchedule.monday = [{ start: 'invalid', end: 'also-invalid' }];
        
        // Should not throw error
        expect(() => {
            tracker.isWithinWorkingHours(new Date('2025-01-06T10:00:00'));
        }).not.toThrow();
    });

    test('should handle missing complex schedule data', () => {
        tracker.settings.useComplexSchedule = true;
        tracker.settings.workingDays.monday = true;
        tracker.settings.complexSchedule = {}; // Missing day data
        
        // Should fall back to simple schedule (8:00-18:00 by default)
        const result = tracker.isWithinWorkingHours(new Date('2025-01-06T10:00:00'));
        expect(result).toBe(true); // 10am is within default simple schedule
        
        // Test outside simple schedule hours
        const earlyResult = tracker.isWithinWorkingHours(new Date('2025-01-06T07:00:00'));
        expect(earlyResult).toBe(false);
    });

    test('should handle boundary times correctly', () => {
        tracker.settings.useComplexSchedule = true;
        tracker.settings.workingDays.monday = true;
        tracker.settings.complexSchedule.monday = [{ start: '09:00', end: '17:00' }];
        
        // Test exact start and end times
        const startTime = tracker.isWithinWorkingHours(new Date('2025-01-06T09:00:00'));
        const endTime = tracker.isWithinWorkingHours(new Date('2025-01-06T17:00:00'));
        
        expect(startTime).toBe(true);
        expect(endTime).toBe(true);
        
        // Test one minute before/after
        const beforeStart = tracker.isWithinWorkingHours(new Date('2025-01-06T08:59:00'));
        const afterEnd = tracker.isWithinWorkingHours(new Date('2025-01-06T17:01:00'));
        
        expect(beforeStart).toBe(false);
        expect(afterEnd).toBe(false);
    });
});