/**
 * Pomodoro Timer Manager
 * Handles structured work/break cycles with notifications and activity logging
 */

class PomodoroManager {
    constructor(activityTracker) {
        this.activityTracker = activityTracker;
        this.isActive = false;
        this.isRunning = false;
        this.isPaused = false;
        this.pausedAt = null;
        this.currentPhase = 'work'; // 'work' or 'break'
        this.cycleCount = 0; // Number of completed work sessions
        this.totalSessions = 0; // Total completed work sessions across all Pomodoro mode activations
        this.timer = null;
        this.tickTimer = null;
        this.remainingTime = 0;
        this.startTime = null;
        this.originalDuration = 0;
        
        // Settings (will be loaded from activity tracker settings)
        this.settings = {
            enabled: false,
            workDuration: 25, // minutes
            breakDuration: 5, // minutes
            longBreakDuration: 15, // minutes
            longBreakInterval: 4, // sessions before long break
            tickSound: 'none', // 'none', 'soft', 'classic', 'digital'
            tickInterval: 0, // seconds between ticks (0 = off)
            shortBreakSound: 'gentle',
            longBreakSound: 'bell',
            resumeSound: 'digital',
            autoStart: false,
            autoLog: true,
            logBreaks: false,
            longBreak: true,
            pauseAllowed: true,
            autoResetDaily: false
        };
        
        this.statusUpdateInterval = null;
        this.lastResetDate = null; // Track last reset date for daily auto-reset
        
        this.init();
    }
    
    init() {
        // Set up Pomodoro mode toggle
        const pomodoroEnabled = document.getElementById('pomodoroEnabled');
        if (pomodoroEnabled) {
            pomodoroEnabled.addEventListener('change', () => {
                this.togglePomodoroMode(pomodoroEnabled.checked);
            });
        }
        
        // Set up auto-save for all Pomodoro settings
        this.setupAutoSaveListeners();
        
        // Pomodoro control is now handled by the main navigation button
        
        // Load settings from activity tracker
        this.loadSettings();
        
        console.log('Pomodoro Manager initialized with comprehensive features');
    }
    
    /**
     * Setup auto-save listeners for all Pomodoro settings
     */
    setupAutoSaveListeners() {
        const settingsIds = [
            'pomodoroWorkDuration',
            'pomodoroBreakDuration', 
            'pomodoroLongBreakDuration',
            'pomodoroLongBreakInterval',
            'pomodoroTickSound',
            'pomodoroTickInterval',
            'pomodoroShortBreakSound',
            'pomodoroLongBreakSound',
            'pomodoroResumeSound',
            'pomodoroAutoStart',
            'pomodoroAutoLog',
            'pomodoroLogBreaks',
            'pomodoroLongBreak',
            'pomodoroAutoResetDaily',
            'pomodoroLastResetDate'
        ];
        
        settingsIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                const eventType = element.type === 'checkbox' ? 'change' : 'change';
                element.addEventListener(eventType, () => {
                    console.log(`Auto-saving Pomodoro setting: ${id}`);
                    this.saveSettings();
                    this.loadSettings(); // Refresh settings immediately
                });
            }
        });
        
        console.log('Auto-save listeners setup for Pomodoro settings');
    }
    
    loadSettings() {
        if (this.activityTracker && this.activityTracker.settings) {
            const settings = this.activityTracker.settings;
            this.settings = {
                enabled: settings.pomodoroEnabled || false,
                workDuration: parseInt(settings.pomodoroWorkDuration) || 25,
                breakDuration: parseInt(settings.pomodoroBreakDuration) || 5,
                longBreakDuration: parseInt(settings.pomodoroLongBreakDuration) || 15,
                longBreakInterval: parseInt(settings.pomodoroLongBreakInterval) || 4,
                tickSound: settings.pomodoroTickSound || 'none',
                tickInterval: parseInt(settings.pomodoroTickInterval) || 0,
                shortBreakSound: settings.pomodoroShortBreakSound || 'gentle',
                longBreakSound: settings.pomodoroLongBreakSound || 'bell',
                resumeSound: settings.pomodoroResumeSound || 'digital',
                autoStart: settings.pomodoroAutoStart || false,
                autoLog: settings.pomodoroAutoLog !== false,
                logBreaks: settings.pomodoroLogBreaks || false,
                longBreak: settings.pomodoroLongBreak !== false,
                pauseAllowed: settings.pomodoroPauseAllowed !== false,
                autoResetDaily: settings.pomodoroAutoResetDaily !== false
            };
            
            // Note: Session state restoration is now handled by the new state system
            
            // Update UI
            this.updateUI();
        }
    }
    
    updateUI() {
        const pomodoroEnabled = document.getElementById('pomodoroEnabled');
        const pomodoroConfig = document.getElementById('pomodoroConfig');
        const workDuration = document.getElementById('pomodoroWorkDuration');
        const breakDuration = document.getElementById('pomodoroBreakDuration');
        const longBreakDuration = document.getElementById('pomodoroLongBreakDuration');
        const longBreakInterval = document.getElementById('pomodoroLongBreakInterval');
        const tickSound = document.getElementById('pomodoroTickSound');
        const tickInterval = document.getElementById('pomodoroTickInterval');
        const shortBreakSound = document.getElementById('pomodoroShortBreakSound');
        const longBreakSound = document.getElementById('pomodoroLongBreakSound');
        const resumeSound = document.getElementById('pomodoroResumeSound');
        const autoStart = document.getElementById('pomodoroAutoStart');
        const autoLog = document.getElementById('pomodoroAutoLog');
        const logBreaks = document.getElementById('pomodoroLogBreaks');
        const longBreak = document.getElementById('pomodoroLongBreak');
        const autoResetDaily = document.getElementById('pomodoroAutoResetDaily');
        const statusDisplay = document.getElementById('pomodoroStatus');
        
        if (pomodoroEnabled) {
            pomodoroEnabled.checked = this.settings.enabled;
        }
        
        if (pomodoroConfig) {
            pomodoroConfig.style.display = this.settings.enabled ? 'block' : 'none';
        }
        
        if (workDuration) {
            workDuration.value = this.settings.workDuration.toString();
        }
        
        if (breakDuration) {
            breakDuration.value = this.settings.breakDuration.toString();
        }
        
        if (longBreakDuration) {
            longBreakDuration.value = this.settings.longBreakDuration.toString();
        }
        
        if (longBreakInterval) {
            longBreakInterval.value = this.settings.longBreakInterval.toString();
        }
        
        if (tickSound) {
            tickSound.value = this.settings.tickSound;
        }
        
        if (tickInterval) {
            tickInterval.value = this.settings.tickInterval.toString();
        }
        
        if (shortBreakSound) {
            shortBreakSound.value = this.settings.shortBreakSound;
        }
        
        if (longBreakSound) {
            longBreakSound.value = this.settings.longBreakSound;
        }
        
        if (resumeSound) {
            resumeSound.value = this.settings.resumeSound;
        }
        
        if (autoStart) {
            autoStart.checked = this.settings.autoStart;
        }
        
        if (autoLog) {
            autoLog.checked = this.settings.autoLog;
        }
        
        if (logBreaks) {
            logBreaks.checked = this.settings.logBreaks;
        }
        
        if (longBreak) {
            longBreak.checked = this.settings.longBreak;
        }
        
        if (autoResetDaily) {
            autoResetDaily.checked = this.settings.autoResetDaily;
        }
        
        // Update main Pomodoro button in nav
        this.updatePomodoroButton();
        
        if (statusDisplay) {
            this.updateStatusDisplay();
        }
    }
    
    togglePomodoroMode(enabled) {
        this.settings.enabled = enabled;
        this.isActive = enabled;
        
        const pomodoroConfig = document.getElementById('pomodoroConfig');
        if (pomodoroConfig) {
            pomodoroConfig.style.display = enabled ? 'block' : 'none';
        }
        
        // Update button visibility immediately
        this.updatePomodoroButton();
        
        // Update pause button visibility (hide when pomodoro active)
        if (this.activityTracker && this.activityTracker.pauseManager) {
            this.activityTracker.pauseManager.updatePauseButtonDisplay();
        }
        
        if (enabled) {
            this.startPomodoroMode();
        } else {
            this.stopPomodoroMode();
        }
        
        // Save settings
        if (this.activityTracker) {
            this.activityTracker.settings.pomodoroEnabled = enabled;
            this.activityTracker.saveSettings();
        }
        
        console.log(`Pomodoro mode ${enabled ? 'enabled' : 'disabled'}`);
    }
    
    startPomodoroMode() {
        if (!this.isActive) return;
        
        // Reset state but don't start immediately
        this.currentPhase = 'work';
        this.cycleCount = 0;
        this.totalSessions = 0;
        this.isRunning = false;
        this.isPaused = false;
        this.pausedAt = null;
        this.currentWorkActivity = null;
        
        // Save the reset state
        this.updateState();
        
        // Update display to show ready state
        this.updateStatusDisplay();
        
        showNotification('Pomodoro mode enabled! Click the button to start your first session.', 'success');
    }
    
    stopPomodoroMode() {
        this.isActive = false;
        this.isRunning = false;
        
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        
        this.stopTickSounds();
        this.stopStatusUpdates();
        
        if (this.settings.autoLog && this.currentPhase === 'work') {
            this.logActivity('Pomodoro session ended', 'Work session interrupted');
        }
        
        // Clear session state from storage
        if (this.activityTracker && this.activityTracker.settings) {
            this.activityTracker.settings.pomodoroIsActive = false;
            this.activityTracker.settings.pomodoroIsRunning = false;
            this.activityTracker.settings.pomodoroCurrentPhase = null;
            this.activityTracker.settings.pomodoroStartTime = null;
            this.activityTracker.settings.pomodoroRemainingTime = null;
            this.activityTracker.settings.pomodoroOriginalDuration = null;
            this.activityTracker.settings.pomodoroIsPaused = false;
            this.activityTracker.settings.pomodoroPausedAt = null;
            this.activityTracker.settings.pomodoroCurrentWorkActivity = null;
            this.activityTracker.saveSettings();
        }
        
        this.updateUI();
        showNotification('Pomodoro mode stopped.', 'info');
    }
    
    startWorkPeriod() {
        if (!this.isActive) return;
        
        // Always show modal for work session activity if auto-log is enabled
        if (this.settings.autoLog) {
            this.pendingWorkSession = true;
            this.showWorkActivityModal();
            return;
        }
        
        this.actuallyStartWorkPeriod();
    }
    
    actuallyStartWorkPeriod() {
        if (!this.isActive) return;
        
        // Prevent multiple instances - stop any existing timers first
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        this.stopTickSounds();
        this.stopStatusUpdates();
        
        this.currentPhase = 'work';
        this.isRunning = true;
        this.isPaused = false;
        this.pausedAt = null;
        this.remainingTime = this.settings.workDuration * 60 * 1000;
        this.originalDuration = this.remainingTime; // Convert to milliseconds
        this.startTime = Date.now();
        
        this.timer = setTimeout(() => {
            this.endWorkPeriod();
        }, this.remainingTime);
        
        // Start tick sounds if enabled
        this.startTickSounds();
        
        // Start status updates
        this.startStatusUpdates();
        
        // Save session state
        this.updateState();
        
        // Update UI
        this.updateUI();
        
        console.log(`Starting ${this.settings.workDuration} minute work period (Session ${this.getCurrentSessionNumber()})`);
    }
    
    endWorkPeriod() {
        if (!this.isActive) return;
        
        this.cycleCount++;
        this.totalSessions++;
        this.isRunning = false;
        
        // Stop tick sounds
        this.stopTickSounds();
        
        // Save session progress
        this.updateState();
        
        // Log work activity with custom description if available
        if (this.settings.autoLog) {
            if (this.currentWorkActivity) {
                this.logActivity(
                    this.currentWorkActivity.name,
                    this.currentWorkActivity.description || `Completed ${this.settings.workDuration} minute Pomodoro work session`
                );
            } else {
                this.logActivity(
                    `Pomodoro work period #${this.cycleCount} completed`,
                    `Completed ${this.settings.workDuration} minute focused work session`
                );
            }
        }
        
        // Play notification sound
        if (this.activityTracker) {
            this.activityTracker.playNotificationSound();
        }
        
        // Show notification with action
        this.showWorkCompleteNotification();
        
        // Update UI
        this.updateUI();
        
        // Start break period
        setTimeout(() => {
            this.startBreakPeriod();
        }, 1000);
    }
    
    startBreakPeriod() {
        if (!this.isActive) return;
        
        // Prevent multiple instances - stop any existing timers first
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        this.stopTickSounds(); // Should already be stopped for breaks, but be safe
        this.stopStatusUpdates();
        
        this.currentPhase = 'break';
        this.isRunning = true;
        this.isPaused = false;
        this.pausedAt = null;
        
        // Determine break duration (long break based on configurable interval)
        // Only give long break after completing the specified number of sessions (not at start)
        const isLongBreak = this.settings.longBreak && this.cycleCount > 0 && (this.cycleCount % this.settings.longBreakInterval === 0);
        const breakDuration = isLongBreak ? this.settings.longBreakDuration : this.settings.breakDuration;
        
        this.remainingTime = breakDuration * 60 * 1000;
        this.originalDuration = this.remainingTime;
        this.startTime = Date.now();
        
        this.timer = setTimeout(() => {
            this.endBreakPeriod();
        }, this.remainingTime);
        
        // Start status updates
        this.startStatusUpdates();
        
        // Save session state
        this.updateState();
        
        // Update UI
        this.updateUI();
        
        const breakType = isLongBreak ? 'long break' : 'break';
        console.log(`Starting ${breakDuration} minute ${breakType} (after ${this.cycleCount} sessions)`);
        
        // Play appropriate announce sound
        const announceSound = isLongBreak ? this.settings.longBreakSound : this.settings.shortBreakSound;
        if (this.activityTracker && this.activityTracker.soundManager) {
            const isMuted = this.activityTracker.isPomodoroSoundMuted();
            this.activityTracker.soundManager.playSound(announceSound, isMuted);
        }
        
        // Show break notification
        this.showBreakStartNotification(breakType, breakDuration);
    }
    
    endBreakPeriod() {
        if (!this.isActive) return;
        
        this.isRunning = false;
        
        // Save session progress
        this.updateState();
        
        // Log break activity (only if logBreaks is enabled)
        if (this.settings.logBreaks) {
            const isLongBreak = this.settings.longBreak && this.cycleCount > 0 && (this.cycleCount % this.settings.longBreakInterval === 0);
            this.logActivity(
                `Pomodoro ${isLongBreak ? 'Long Break' : 'Short Break'}`,
                `Completed`,
                [this.generateBreakTag(isLongBreak)]
            );
        }
        
        // Play notification sound
        if (this.activityTracker) {
            this.activityTracker.playNotificationSound();
        }
        
        // Play resume work announce sound
        if (this.activityTracker && this.activityTracker.soundManager) {
            const isMuted = this.activityTracker.isPomodoroSoundMuted();
            this.activityTracker.soundManager.playSound(this.settings.resumeSound, isMuted);
        }
        
        // Show back-to-work notification
        this.showBackToWorkNotification();
        
        // Update UI
        this.updateUI();
        
        // Start next work period (or wait for manual start if auto-start is disabled)
        if (this.settings.autoStart) {
            setTimeout(() => {
                this.startWorkPeriod();
            }, 1000);
        } else {
            // User must manually start next session
            showNotification('Break finished! Click the Pomodoro button to continue.', 'info', 10000);
        }
    }
    
    showWorkCompleteNotification() {
        const options = {
            body: `Work period #${this.cycleCount} complete! Time for a break.`,
            icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23f56565"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
            tag: 'pomodoro-work-complete',
            requireInteraction: true,
            actions: [
                { action: 'start-break', title: 'Start Break', icon: '☕' },
                { action: 'continue-work', title: 'Continue Working', icon: '💪' }
            ]
        };
        
        if (this.activityTracker) {
            this.activityTracker.showNotificationWithServiceWorker('Pomodoro - Work Complete!', options);
        }
    }
    
    showBreakStartNotification(breakType, duration) {
        const options = {
            body: `Take a ${breakType} for ${duration} minutes. You've earned it!`,
            icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2348bb78"><path d="M7 14c-1.66 0-3 1.34-3 3 0 1.31-1.16 2-2 2 .92 1.22 2.49 2 4 2 2.21 0 4-1.79 4-4 0-1.66-1.34-3-3-3zM20.71 4.63l-1.34-1.34c-.39-.39-1.02-.39-1.41 0L9 12.25 11.75 15l8.96-8.96c.39-.39.39-1.02 0-1.41z"/></svg>',
            tag: 'pomodoro-break-start',
            requireInteraction: false
        };
        
        if (this.activityTracker) {
            this.activityTracker.showNotificationWithServiceWorker(`${breakType.charAt(0).toUpperCase() + breakType.slice(1)} Time!`, options);
        }
    }
    
    showBackToWorkNotification() {
        const options = {
            body: 'Break time is over. Ready to get back to focused work?',
            icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23667eea"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>',
            tag: 'pomodoro-back-to-work',
            requireInteraction: true,
            actions: [
                { action: 'reply', type: 'text', title: 'Log Work Activity', placeholder: 'What will you work on next?' }
            ]
        };
        
        if (this.activityTracker) {
            this.activityTracker.showNotificationWithServiceWorker('Back to Work!', options);
        }
    }
    
    /**
     * Generate a simple hash for duplicate detection
     */
    generateActivityHash(activity, description, timestamp) {
        // Round timestamp to minute accuracy for duplicate detection
        const date = new Date(timestamp);
        const minuteAccurateTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 
                                          date.getHours(), date.getMinutes()).toISOString();
        
        const hashString = `${activity}|${description || ''}|${minuteAccurateTime}`;
        
        // Simple hash function
        let hash = 0;
        for (let i = 0; i < hashString.length; i++) {
            const char = hashString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString();
    }

    /**
     * Check if an activity entry already exists (duplicate detection)
     */
    isDuplicateActivity(activity, description, timestamp) {
        if (!this.activityTracker || !this.activityTracker.entries) return false;
        
        const hash = this.generateActivityHash(activity, description, timestamp);
        
        // Check recent entries (last 10) for performance
        const recentEntries = this.activityTracker.entries.slice(0, 10);
        
        return recentEntries.some(entry => {
            if (entry.source !== 'pomodoro') return false;
            
            const entryHash = this.generateActivityHash(
                entry.activity, 
                entry.description || '', 
                entry.timestamp
            );
            
            return entryHash === hash;
        });
    }

    logActivity(activity, description, extraTags = []) {
        if (!this.activityTracker || !this.settings.autoLog) return;
        
        const timestamp = new Date().toISOString();
        
        // Check for duplicates before adding
        if (this.isDuplicateActivity(activity, description, timestamp)) {
            console.log('Skipping duplicate Pomodoro activity:', activity);
            return;
        }
        
        const entry = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            activity: activity,
            description: description || '',
            timestamp: timestamp,
            created: new Date().toISOString(),
            source: 'pomodoro',
            tags: extraTags
        };
        
        this.activityTracker.addEntry(entry);
        console.log('Auto-logged Pomodoro activity:', activity);
    }
    
    saveSettings() {
        if (!this.activityTracker) return;
        
        // Get current values from UI
        const workDuration = document.getElementById('pomodoroWorkDuration');
        const breakDuration = document.getElementById('pomodoroBreakDuration');
        const longBreakDuration = document.getElementById('pomodoroLongBreakDuration');
        const longBreakInterval = document.getElementById('pomodoroLongBreakInterval');
        const tickSound = document.getElementById('pomodoroTickSound');
        const tickInterval = document.getElementById('pomodoroTickInterval');
        const shortBreakSound = document.getElementById('pomodoroShortBreakSound');
        const longBreakSound = document.getElementById('pomodoroLongBreakSound');
        const resumeSound = document.getElementById('pomodoroResumeSound');
        const autoStart = document.getElementById('pomodoroAutoStart');
        const autoLog = document.getElementById('pomodoroAutoLog');
        const logBreaks = document.getElementById('pomodoroLogBreaks');
        const longBreak = document.getElementById('pomodoroLongBreak');
        const autoResetDaily = document.getElementById('pomodoroAutoResetDaily');
        
        if (workDuration) this.settings.workDuration = parseInt(workDuration.value);
        if (breakDuration) this.settings.breakDuration = parseInt(breakDuration.value);
        if (longBreakDuration) this.settings.longBreakDuration = parseInt(longBreakDuration.value);
        if (longBreakInterval) this.settings.longBreakInterval = parseInt(longBreakInterval.value);
        if (tickSound) this.settings.tickSound = tickSound.value;
        if (tickInterval) this.settings.tickInterval = parseInt(tickInterval.value);
        if (shortBreakSound) this.settings.shortBreakSound = shortBreakSound.value;
        if (longBreakSound) this.settings.longBreakSound = longBreakSound.value;
        if (resumeSound) this.settings.resumeSound = resumeSound.value;
        if (autoStart) this.settings.autoStart = autoStart.checked;
        if (autoLog) this.settings.autoLog = autoLog.checked;
        if (logBreaks) this.settings.logBreaks = logBreaks.checked;
        if (longBreak) this.settings.longBreak = longBreak.checked;
        if (autoResetDaily) this.settings.autoResetDaily = autoResetDaily.checked;
        
        // Save to activity tracker settings
        this.activityTracker.settings.pomodoroWorkDuration = this.settings.workDuration;
        this.activityTracker.settings.pomodoroBreakDuration = this.settings.breakDuration;
        this.activityTracker.settings.pomodoroLongBreakDuration = this.settings.longBreakDuration;
        this.activityTracker.settings.pomodoroLongBreakInterval = this.settings.longBreakInterval;
        this.activityTracker.settings.pomodoroTickSound = this.settings.tickSound;
        this.activityTracker.settings.pomodoroTickInterval = this.settings.tickInterval;
        this.activityTracker.settings.pomodoroShortBreakSound = this.settings.shortBreakSound;
        this.activityTracker.settings.pomodoroLongBreakSound = this.settings.longBreakSound;
        this.activityTracker.settings.pomodoroResumeSound = this.settings.resumeSound;
        this.activityTracker.settings.pomodoroAutoStart = this.settings.autoStart;
        this.activityTracker.settings.pomodoroAutoLog = this.settings.autoLog;
        this.activityTracker.settings.pomodoroLogBreaks = this.settings.logBreaks;
        this.activityTracker.settings.pomodoroLongBreak = this.settings.longBreak;
        this.activityTracker.settings.pomodoroAutoResetDaily = this.settings.autoResetDaily;
        
        console.log('Pomodoro settings saved');
    }
    
    /**
     * Get the current session number
     * @returns {number} Current session number (1-based)
     */
    getCurrentSessionNumber() {
        // Current session is always cycleCount + 1 since cycleCount tracks completed sessions
        return this.cycleCount + 1;
    }
    
    /**
     * Get the next session number
     * @returns {number} Next session number (1-based)
     */
    getNextSessionNumber() {
        // Next session depends on current phase
        return this.currentPhase === 'work' ? this.getCurrentSessionNumber() : this.getCurrentSessionNumber() + 1;
    }
    
    getCurrentStatus() {
        if (!this.isActive) return 'Disabled';
        if (!this.isRunning) return 'Paused';
        
        const timeLeft = Math.ceil((this.remainingTime - (Date.now() - this.startTime)) / 60000);
        const phase = this.currentPhase === 'work' ? 'Working' : 'Break';
        const sessionInfo = this.currentPhase === 'work' ? ` (Session ${this.getCurrentSessionNumber()})` : '';
        return `${phase}${sessionInfo} - ${Math.max(0, timeLeft)}m left`;
    }
    
    // === NEW COMPREHENSIVE FEATURES ===
    
    /**
     * Start tick sounds during work periods
     */
    startTickSounds() {
        console.log(`StartTickSounds called - Active: ${this.isActive}, Phase: ${this.currentPhase}, TickSound: ${this.settings.tickSound}, Interval: ${this.settings.tickInterval}`);
        
        // Stop any existing tick timer first
        this.stopTickSounds();
        
        if (!this.isActive || this.currentPhase !== 'work' || this.settings.tickSound === 'none' || this.settings.tickInterval <= 0) {
            console.log('Tick sounds not started - conditions not met');
            return;
        }
        
        console.log(`Starting tick sounds with ${this.settings.tickInterval}s interval`);
        
        const playTick = () => {
            if (!this.isActive || !this.isRunning || this.currentPhase !== 'work') {
                console.log('Tick cancelled - session ended or not in work phase');
                return;
            }
            
            this.playTickSound();
            
            // Schedule next tick
            this.tickTimer = setTimeout(playTick, this.settings.tickInterval * 1000);
        };
        
        // Start first tick after initial delay
        this.tickTimer = setTimeout(playTick, this.settings.tickInterval * 1000);
    }
    
    /**
     * Stop tick sounds
     */
    stopTickSounds() {
        if (this.tickTimer) {
            clearTimeout(this.tickTimer);
            this.tickTimer = null;
        }
    }
    
    /**
     * Play appropriate tick sound
     */
    playTickSound() {
        if (!this.activityTracker || !this.activityTracker.soundManager) {
            console.warn('Tick sound: No sound manager available');
            return;
        }
        
        if (this.settings.tickSound === 'none') {
            return; // No sound
        }
        
        // Check if sounds are muted
        const isMuted = this.activityTracker.isPomodoroSoundMuted();
        if (isMuted) {
            return; // Pomodoro sounds are muted
        }
        
        let soundType = 'soft-tick'; // Default fallback
        switch (this.settings.tickSound) {
            case 'soft':
                soundType = 'soft-tick';
                break;
            case 'classic':
                soundType = 'classic-tick';
                break;
            case 'digital':
                soundType = 'digital-tick';
                break;
        }
        
        console.log(`Playing tick sound: ${soundType} (interval: ${this.settings.tickInterval}s)`);
        this.activityTracker.soundManager.playSound(soundType, false);
    }
    
    /**
     * Abandon current session and restart at same session number
     */
    abandonCurrentSession() {
        if (!this.isActive || !this.isRunning) {
            return;
        }
        
        // Calculate how much time was spent
        const timeSpent = this.originalDuration - this.remainingTime + (Date.now() - this.startTime);
        const minutesSpent = Math.round(timeSpent / 60000);
        
        // Get current session number consistently
        const currentSession = this.getCurrentSessionNumber();
        
        // Stop current timers
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        this.stopTickSounds();
        this.stopStatusUpdates();
        
        // Show abandonment options if we've spent meaningful time (>2 minutes)
        if (minutesSpent > 2 && this.currentPhase === 'work' && this.settings.autoLog) {
            this.showAbandonmentSaveDialog(currentSession, minutesSpent);
        } else {
            // Just abandon without save option for short sessions
            this.finalizeAbandonment(currentSession, false);
        }
    }
    
    /**
     * Show dialog to save partial work when abandoning session
     */
    showAbandonmentSaveDialog(sessionNumber, minutesSpent) {
        if (typeof showPomodoroAbandonDialog === 'function') {
            // Set up the dialog with current session info
            const dialogTitle = document.getElementById('pomodoroAbandonTitle');
            const timeSpentElement = document.getElementById('pomodoroAbandonTimeSpent');
            const activityName = document.getElementById('pomodoroAbandonActivityName');
            const activityDescription = document.getElementById('pomodoroAbandonActivityDescription');
            
            if (dialogTitle) {
                dialogTitle.textContent = `Session ${sessionNumber} Abandonment`;
            }
            if (timeSpentElement) {
                timeSpentElement.textContent = `You worked for ${minutesSpent} minutes`;
            }
            if (activityName && this.currentWorkActivity) {
                activityName.value = this.currentWorkActivity.name || '';
            }
            if (activityDescription && this.currentWorkActivity) {
                activityDescription.value = this.currentWorkActivity.description || `Partial work on session ${sessionNumber} (${minutesSpent} minutes)`;
            }
            
            showPomodoroAbandonDialog();
        } else {
            // Fallback if dialog function not available
            this.finalizeAbandonment(sessionNumber, false);
        }
    }
    
    /**
     * Handle saving partial work when abandoning
     */
    handleAbandonmentSave(saveWork) {
        const currentSession = this.getCurrentSessionNumber();
        
        if (saveWork && this.settings.autoLog) {
            const activityName = document.getElementById('pomodoroAbandonActivityName');
            const activityDescription = document.getElementById('pomodoroAbandonActivityDescription');
            
            const activity = activityName ? activityName.value.trim() : '';
            const description = activityDescription ? activityDescription.value.trim() : '';
            
            if (activity) {
                this.logActivity(activity, description || `Partial Pomodoro session ${currentSession} work`, [this.generateAbandonedTag(currentSession)]);
                showNotification(`Partial work saved: "${activity}"`, 'success');
            }
        }
        
        // Close the dialog
        if (typeof closePomodoroAbandonDialog === 'function') {
            closePomodoroAbandonDialog();
        }
        
        // Finalize abandonment
        this.finalizeAbandonment(currentSession, saveWork);
    }
    
    /**
     * Generate shortened pomodoro tag for abandoned sessions
     */
    generateAbandonedTag(sessionNumber) {
        const today = new Date().toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD format
        const sessionStr = sessionNumber.toString().padStart(2, '0');
        return `pd${today}_${sessionStr}_dnc`;
    }

    /**
     * Generate shortened pomodoro tag for break sessions
     */
    generateBreakTag(isLongBreak) {
        const today = new Date().toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD format
        const breakType = isLongBreak ? 'lb' : 'sb'; // lb = long break, sb = short break
        return `pd${today}_${breakType}`;
    }

    /**
     * Complete the abandonment process
     */
    finalizeAbandonment(sessionNumber, workSaved) {
        // Log abandonment (separate from any saved work)
        if (this.settings.autoLog && !workSaved) {
            if (this.currentWorkActivity && this.currentWorkActivity.name) {
                this.logActivity(
                    this.currentWorkActivity.name,
                    this.currentWorkActivity.description || `Pomodoro session ${sessionNumber} abandoned`,
                    [this.generateAbandonedTag(sessionNumber)]
                );
            } else {
                this.logActivity(
                    `Pomodoro session ${sessionNumber} abandoned`,
                    `Session interrupted, restarting at session ${sessionNumber}`,
                    [this.generateAbandonedTag(sessionNumber)]
                );
            }
        }
        
        // Reset to beginning of current work session
        // No need to adjust cycleCount as we're restarting the same session
        this.isRunning = false;
        this.isPaused = false;
        this.pausedAt = null;
        this.currentPhase = 'work';
        
        // Clear current work activity to force re-selection
        this.currentWorkActivity = null;
        
        // Save progress
        this.updateState();
        
        // Show notification
        const message = workSaved ? 
            `Session ${sessionNumber} abandoned with work saved. Click Start to begin next session.` :
            `Session ${sessionNumber} abandoned. Click Start to begin next session.`;
        showNotification(message, 'warning');
        
        // Update UI
        this.updateUI();
        
        console.log(`Session ${sessionNumber} abandoned, user must restart manually`);
    }
    
    /**
     * Restore pomodoro state from application state
     */
    restoreFromState(pomodoroState) {
        if (!pomodoroState) return;
        
        console.log('Restoring pomodoro from state:', pomodoroState);
        
        // Restore basic state
        this.cycleCount = pomodoroState.cycleCount || 0;
        this.totalSessions = pomodoroState.totalSessions || 0;
        
        // If there's a running session, restore it
        if (pomodoroState.isRunning && pomodoroState.startTime && pomodoroState.remainingTime) {
            this.restoreActiveSession(pomodoroState);
        }
        
        // Update UI
        this.updateUI();
    }

    /**
     * Restore an active session from state
     */
    restoreActiveSession(state) {
        const now = Date.now();
        
        // Calculate how much time has passed
        let timeLeft;
        if (state.isPaused && state.pausedAt) {
            // Session was paused - use the paused state
            const timeElapsedBeforePause = state.pausedAt - state.startTime;
            timeLeft = state.originalDuration - timeElapsedBeforePause;
        } else {
            // Session was running - calculate elapsed time
            const elapsedTime = now - state.startTime;
            timeLeft = state.remainingTime - elapsedTime;
        }
        
        console.log(`Time remaining calculation: ${Math.ceil(timeLeft/1000)}s`);
        
        // Check if session expired while page was closed
        if (timeLeft <= 0) {
            this.handleExpiredSession(state);
            return;
        }
        
        // Restore the active session
        this.isActive = true;
        this.isRunning = true;
        this.currentPhase = state.currentPhase;
        this.originalDuration = state.originalDuration;
        
        if (state.isPaused) {
            // Restore paused session
            this.isPaused = true;
            this.pausedAt = state.pausedAt;
            this.startTime = state.startTime;
            this.remainingTime = state.remainingTime;
            this.startStatusUpdates();
            
            showNotification(`Paused session restored! ${Math.ceil(timeLeft/60000)} minutes remaining.`, 'info');
        } else {
            // Restore running session
            this.isPaused = false;
            this.pausedAt = null;
            this.startTime = now; // Reset start time to now
            this.remainingTime = timeLeft;
            
            // Restart the timer
            this.timer = setTimeout(() => {
                if (this.currentPhase === 'work') {
                    this.endWorkPeriod();
                } else {
                    this.endBreakPeriod();
                }
            }, timeLeft);
            
            this.startTickSounds();
            this.startStatusUpdates();
            
            showNotification(`Session restored! ${Math.ceil(timeLeft/60000)} minutes remaining.`, 'success');
        }
        
        // Restore work activity
        if (state.workActivity) {
            this.currentWorkActivity = state.workActivity;
        }
    }

    /**
     * Handle a session that expired while the page was closed
     */
    handleExpiredSession(state) {
        if (state.currentPhase === 'work') {
            console.log('Work period expired during reload');
            showNotification('Work session completed while page was closed. Ready for break!', 'info');
        } else {
            console.log('Break period expired during reload');
            showNotification('Break completed while page was closed. Ready for next session!', 'info');
        }
        
        this.isActive = true;
        this.isRunning = false;
        this.isPaused = false;
    }

    /**
     * Update pomodoro state in application state
     */
    updateState() {
        if (!this.activityTracker) return;
        
        const pomodoroState = {
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            currentPhase: this.currentPhase,
            sessionNumber: this.getCurrentSessionNumber(),
            startTime: this.startTime,
            originalDuration: this.originalDuration,
            remainingTime: this.remainingTime,
            pausedAt: this.pausedAt,
            workActivity: this.currentWorkActivity,
            cycleCount: this.cycleCount,
            totalSessions: this.totalSessions
        };
        
        this.activityTracker.updatePomodoroState(pomodoroState);
    }
    
    /**
     * Update status display in UI
     */
    updateStatusDisplay() {
        const statusDisplay = document.getElementById('pomodoroStatus');
        const banner = document.getElementById('statusBanner');
        const pomodoroSection = document.getElementById('pomodoroStatusSection');
        const timer = document.getElementById('pomodoroTimer');
        const timeRemaining = document.getElementById('pomodoroTimeRemaining');
        const phase = document.getElementById('pomodoroPhase');
        const activityDisplay = document.getElementById('pomodoroActivityDisplay');
        const activityText = document.getElementById('pomodoroActivityText');
        const activityDesc = document.getElementById('pomodoroActivityDesc');
        
        if (!this.isActive) {
            if (statusDisplay) {
                statusDisplay.textContent = t('status.pomodoroDisabled');
                statusDisplay.style.display = 'block';
            }
            if (timer) timer.style.display = 'none';
            if (pomodoroSection) pomodoroSection.style.display = 'none';
            
            // Hide the entire banner if no sections are visible
            const reminderSection = document.getElementById('reminderStatusSection');
            if (banner && reminderSection && 
                pomodoroSection && pomodoroSection.style.display === 'none' && 
                reminderSection.style.display === 'none') {
                banner.style.display = 'none';
            }
            
            // Re-enable standard reminders when Pomodoro is disabled
            if (this.activityTracker && this.activityTracker.settings.notificationsEnabled) {
                this.activityTracker.startNotificationTimer();
            }
            return;
        }
        
        // Disable standard reminders when Pomodoro is active
        if (this.activityTracker) {
            this.activityTracker.stopNotificationTimer();
        }
        
        // Show banner and Pomodoro section when active
        if (banner && pomodoroSection) {
            banner.style.display = 'block';
            pomodoroSection.style.display = 'flex';
        }
        
        if (!this.isRunning) {
            // Show status text and hide timer when no session is running
            if (statusDisplay) {
                const nextSession = this.getCurrentSessionNumber();
                statusDisplay.textContent = `Ready to start session ${nextSession}`;
                statusDisplay.style.display = 'block';
            }
            if (timer) timer.style.display = 'none';
            this.hidePauseButton();
            return;
        }
        
        // Hide status text and show horizontal bar when running
        if (statusDisplay) statusDisplay.style.display = 'none';
        if (timer) timer.style.display = 'flex';
        
        const timeLeft = Math.ceil((this.remainingTime - (Date.now() - this.startTime)) / 60000);
        const timeLeftSafe = Math.max(0, timeLeft);
        
        // Calculate more precise time remaining for display
        let totalMs;
        if (this.isPaused) {
            // Show time remaining when paused
            const timeElapsedBeforePause = this.pausedAt - this.startTime;
            totalMs = this.originalDuration - timeElapsedBeforePause;
        } else {
            // Normal running calculation
            totalMs = this.remainingTime - (Date.now() - this.startTime);
        }
        const minutes = Math.floor(totalMs / 60000);
        const seconds = Math.floor((totalMs % 60000) / 1000);
        const formattedTime = `${Math.max(0, minutes)}:${Math.max(0, seconds).toString().padStart(2, '0')}`;
        
        if (this.currentPhase === 'work') {
            const currentSession = this.getCurrentSessionNumber();
            if (timeRemaining) timeRemaining.textContent = formattedTime;
            if (phase) phase.textContent = this.isPaused ? `#${currentSession} (Paused)` : `#${currentSession}`;
            
            // Show activity if available
            if (activityDisplay && activityText && this.currentWorkActivity && this.currentWorkActivity.name) {
                activityDisplay.style.display = 'block';
                activityText.textContent = this.currentWorkActivity.name;
                
                // Show description if available and there's space
                if (activityDesc && this.currentWorkActivity.description) {
                    activityDesc.textContent = this.currentWorkActivity.description;
                    activityDesc.style.display = 'block';
                } else if (activityDesc) {
                    activityDesc.style.display = 'none';
                }
            } else if (activityDisplay) {
                activityDisplay.style.display = 'none';
            }
        } else {
            const isLongBreak = this.settings.longBreak && this.cycleCount > 0 && (this.cycleCount % this.settings.longBreakInterval === 0);
            const breakType = isLongBreak ? 'Long Break' : 'Short Break';
            
            if (timeRemaining) timeRemaining.textContent = formattedTime;
            if (phase) phase.textContent = this.isPaused ? `${breakType} (Paused)` : breakType;
            
            // Hide activity during breaks
            if (activityDisplay) {
                activityDisplay.style.display = 'none';
            }
        }
        
        // Update pause button visibility and text based on state and settings
        if (this.settings.pauseAllowed) {
            this.showPauseButton();
            this.updatePauseButtonText();
        } else {
            this.hidePauseButton();
        }
    }
    
    /**
     * Update the main Pomodoro button in navigation
     */
    updatePomodoroButton() {
        const pomodoroBtn = document.getElementById('pomodoroButton');
        if (!pomodoroBtn) return;
        
        if (!this.settings.enabled) {
            pomodoroBtn.style.display = 'none';
            return;
        }
        
        pomodoroBtn.style.display = 'inline-block';
        
        if (!this.isActive) {
            pomodoroBtn.textContent = 'Start Pomodoro';
            pomodoroBtn.className = 'nav-btn pomodoro-btn';
            pomodoroBtn.title = 'Start a new Pomodoro session';
        } else if (this.isRunning) {
            if (this.currentPhase === 'work') {
                const currentSession = this.getCurrentSessionNumber();
                pomodoroBtn.textContent = `Abandon Session ${currentSession}`;
                pomodoroBtn.className = 'nav-btn pomodoro-btn active';
                pomodoroBtn.title = 'Abandon current work session and restart';
            } else {
                pomodoroBtn.textContent = 'On Break';
                pomodoroBtn.className = 'nav-btn pomodoro-btn breaking';
                pomodoroBtn.title = 'Currently on break - click to abandon and restart';
            }
        } else {
            const nextSession = this.getCurrentSessionNumber();
            pomodoroBtn.textContent = `🍅 Start Session ${nextSession}`;
            pomodoroBtn.className = 'nav-btn pomodoro-btn';
            pomodoroBtn.title = `Start work session ${nextSession}`;
        }
    }
    
    /**
     * Toggle Pomodoro (called from nav button)
     */
    togglePomodoroFromButton() {
        if (!this.isActive) {
            // Start Pomodoro mode and immediately begin first work session
            this.togglePomodoroMode(true);
            this.startWorkPeriod();
        } else if (this.isRunning) {
            // Abandon current session
            this.abandonCurrentSession();
        } else {
            // Start next session
            this.startWorkPeriod();
        }
    }
    
    /**
     * Start periodic status updates
     */
    startStatusUpdates() {
        this.stopStatusUpdates(); // Clear any existing interval
        
        this.statusUpdateInterval = setInterval(() => {
            if (this.isActive && (this.isRunning || this.isPaused)) {
                this.updateStatusDisplay();
                this.updatePomodoroButton();
            }
        }, 1000); // Update every second
    }
    
    /**
     * Stop periodic status updates
     */
    stopStatusUpdates() {
        if (this.statusUpdateInterval) {
            clearInterval(this.statusUpdateInterval);
            this.statusUpdateInterval = null;
        }
    }
    
    /**
     * Check for daily auto-reset functionality
     */
    checkDailyAutoReset() {
        if (!this.settings.autoResetDaily) return;
        
        const today = new Date().toDateString();
        
        // If we have a last reset date and it's different from today, reset
        if (this.lastResetDate && this.lastResetDate !== today) {
            console.log('Daily auto-reset triggered');
            this.cycleCount = 0;
            this.totalSessions = 0;
            this.lastResetDate = today;
            
            if (this.settings.autoLog) {
                this.logActivity('Daily Pomodoro reset', 'Session counter automatically reset for new day');
            }
            
            this.updateState();
            this.updateUI();
            
            showNotification('Daily session reset applied', 'info');
        } else if (!this.lastResetDate) {
            // First time, just set the date
            this.lastResetDate = today;
            this.updateState();
        }
    }
    
    /**
     * Reset Pomodoro session counter (for complete restart)
     */
    resetSessionCounter() {
        this.cycleCount = 0;
        this.totalSessions = 0;
        this.lastResetDate = new Date().toDateString(); // Update reset date
        this.updateState();
        this.updateUI();
        
        if (this.settings.autoLog) {
            this.logActivity('Pomodoro session counter reset', 'Starting fresh Pomodoro cycle');
        }
        
        showNotification('Pomodoro session counter reset', 'info');
    }
    
    /**
     * Show work activity modal to prompt for session description
     */
    showWorkActivityModal() {
        if (typeof showPomodoroActivityModal === 'function') {
            showPomodoroActivityModal();
            
            // Set up form handler if not already done
            const form = document.getElementById('pomodoroActivityForm');
            if (form && !form.pomodoroHandlerAdded) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleWorkActivitySubmit();
                });
                form.pomodoroHandlerAdded = true;
            }
        }
    }
    
    /**
     * Handle work activity form submission
     */
    handleWorkActivitySubmit() {
        const activityName = document.getElementById('pomodoroActivityName');
        const activityDescription = document.getElementById('pomodoroActivityDescription');
        
        if (activityName && activityName.value.trim()) {
            // Store the activity for logging when session completes
            this.currentWorkActivity = {
                name: activityName.value.trim(),
                description: activityDescription ? activityDescription.value.trim() : ''
            };
            
            // Close modal
            if (typeof closePomodoroActivityModal === 'function') {
                closePomodoroActivityModal();
            }
            
            // Start the work period
            this.pendingWorkSession = false;
            this.actuallyStartWorkPeriod();
            
            // Save the work activity to session state
            this.updateState();
            
            console.log('Work session started with activity:', this.currentWorkActivity.name);
        }
    }
    
    /**
     * Toggle pause/resume of current Pomodoro session
     */
    togglePause() {
        if (!this.isActive || !this.isRunning) {
            return; // Can't pause if not running
        }
        
        if (!this.settings.pauseAllowed) {
            showNotification('Session pausing is disabled in settings', 'warning');
            return;
        }
        
        if (this.isPaused) {
            // Resume
            this.resumeSession();
        } else {
            // Pause
            this.pauseSession();
        }
    }
    
    /**
     * Pause the current session
     */
    pauseSession() {
        if (!this.isActive || !this.isRunning || this.isPaused) return;
        
        this.isPaused = true;
        this.pausedAt = Date.now();
        
        // Clear the timer
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        
        // Stop tick sounds but keep status updates for UI display
        this.stopTickSounds();
        // Note: Keep status updates running to show paused timer display
        
        // Save pause state
        this.updateState();
        
        // Update UI
        this.updateStatusDisplay();
        this.updatePomodoroButton();
        
        showNotification('Pomodoro session paused', 'info');
        console.log('Session paused');
    }
    
    /**
     * Resume the paused session
     */
    resumeSession() {
        if (!this.isActive || !this.isPaused) return;
        
        // Calculate how much time was remaining when paused
        const timeElapsedBeforePause = this.pausedAt - this.startTime;
        const remainingTimeWhenPaused = this.originalDuration - timeElapsedBeforePause;
        
        // Reset start time to now, keeping the same remaining time
        this.startTime = Date.now();
        this.remainingTime = remainingTimeWhenPaused;
        
        this.isPaused = false;
        this.pausedAt = null;
        
        // Restart the timer with the remaining time
        this.timer = setTimeout(() => {
            if (this.currentPhase === 'work') {
                this.endWorkPeriod();
            } else {
                this.endBreakPeriod();
            }
        }, remainingTimeWhenPaused);
        
        // Restart tick sounds and status updates
        if (this.currentPhase === 'work') {
            this.startTickSounds();
        }
        this.startStatusUpdates();
        
        // Save resumed state
        this.updateState();
        
        // Update UI
        this.updateStatusDisplay();
        this.updatePomodoroButton();
        
        showNotification('Pomodoro session resumed', 'success');
        console.log('Session resumed');
    }
    
    /**
     * Show the pause button in the banner
     */
    showPauseButton() {
        const controls = document.getElementById('pomodoroBannerControls');
        if (controls) {
            controls.style.display = 'flex';
        }
    }
    
    /**
     * Hide the pause button in the banner
     */
    hidePauseButton() {
        const controls = document.getElementById('pomodoroBannerControls');
        if (controls) {
            controls.style.display = 'none';
        }
    }
    
    /**
     * Update the pause button text based on current state
     */
    updatePauseButtonText() {
        const pauseBtn = document.getElementById('pomodoroPauseBtn');
        if (pauseBtn) {
            pauseBtn.textContent = this.isPaused ? 'Resume' : 'Pause';
        }
    }
    
    destroy() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        this.stopTickSounds();
        this.stopStatusUpdates();
        this.isActive = false;
        this.isRunning = false;
        console.log('Pomodoro Manager destroyed');
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.PomodoroManager = PomodoroManager;
}

console.log('Pomodoro Manager module loaded');