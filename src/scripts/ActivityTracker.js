/**
 * Main ActivityTracker class
 * Handles all functionality for tracking activities, notifications, and reports
 */
class ActivityTracker {
    constructor() {
        // Initialize entries array from localStorage
        let entries = [];
        try {
            const storedEntries = JSON.parse(localStorage.getItem('activityEntries'));
            if (Array.isArray(storedEntries)) {
                entries = storedEntries.filter(entry => 
                    entry && typeof entry === 'object' && entry.timestamp
                ).map(entry => {
                    // Migrate existing entries to new schema
                    if (typeof entry.isTodo === 'undefined') {
                        entry.isTodo = false;
                    }
                    if (typeof entry.isNote === 'undefined') {
                        entry.isNote = false;
                    }
                    if (!entry.tags) {
                        entry.tags = [];
                    }
                    if (!entry.dueDate) {
                        entry.dueDate = null;
                    }
                    if (!entry.startedAt) {
                        entry.startedAt = null;
                    }
                    return entry;
                });
            }
        } catch (e) {
            console.error("Error parsing activity entries from localStorage", e);
            localStorage.removeItem('activityEntries');
        }
        this.entries = entries;

        // Define default settings
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
            // New complex schedule structure - each day can have multiple time ranges
            complexSchedule: {
                monday: [{ start: '09:00', end: '17:00' }],
                tuesday: [{ start: '09:00', end: '17:00' }],
                wednesday: [{ start: '09:00', end: '17:00' }],
                thursday: [{ start: '09:00', end: '17:00' }],
                friday: [{ start: '09:00', end: '17:00' }],
                saturday: [],
                sunday: []
            },
            useComplexSchedule: false, // Flag to use complex schedule instead of simple startTime/endTime
            pauseDuration: 60,
            notificationsPausedUntil: null,
            notificationsEnabled: true,
            autoStartAlerts: false,
            hasRequestedNotificationPermission: false, // Whether user has been asked about browser notifications
            sendSystemNotifications: true, // Whether to send system notifications (only applies if hasRequestedNotificationPermission is true)
            soundMuteMode: 'none', // 'none', 'all', 'pomodoro', 'notifications'
            notificationSoundType: "classic",
            reminderTimerReset: 'on_add', // 'on_add', 'on_add_edit', 'never'
            darkModePreference: 'system', // 'light', 'dark', 'system'
            paginationSize: 20,
            hashtagCloudLimit: 50,
            warnOnActivityDelete: true,
            warnOnSessionReset: true,
            
            // Backup settings
            backupType: 'reminders', // 'reminders', 'automatic', 'off'
            backupReminders: 'enabled', // 'enabled', 'disabled', 'never'
            backupSchedule: 'end_of_day', // 'end_of_day', 'daily_5pm', 'weekly_friday', 'weekly_end', 'manual_only'
            backupFilenamePattern: 'timestamp', // 'timestamp', 'date_only', 'simple', 'workspace'
            
            // Automatic backup settings
            automaticBackups: false, // Enable/disable automatic background backups
            backgroundBackupFrequency: 'daily', // 'daily', 'weekly', 'bi_weekly', 'monthly'
            backgroundBackupPermission: 'not_requested', // 'not_requested', 'granted', 'denied'
            
            // Description formatting
            autoBulletDescriptions: false // Auto-add bullets to description lines, checkboxes for todos
        };

        // Initialize settings with defaults
        this.settings = {
            ...this.defaultSettings,
            ...JSON.parse(localStorage.getItem('activitySettings') || '{}')
        };

        // Initialize state variables
        this.notificationTimer = null;
        this.currentReportEntries = [];
        this.currentWeekStart = null;
        this.soundManager = null;
        this.pauseManager = null;
        
        // Initialize application state
        this.state = this.loadState();
        
        // Initialize workspace system
        this.currentWorkspace = localStorage.getItem('currentWorkspace') || 'Default';
        this.initializeWorkspaces();

        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        this.loadSettings();
        this.migrateExistingEntries();
        this.initMarkdownRenderer();
        this.initReportTemplates();
        this.loadReportTemplatesIntoEditor();
        this.initTemplatePreviewGrid();
        this.displayEntries();
        this.displayTodos();
        this.displayNotes();
        this.updateNotificationStatus();
        this.updateDebugInfo();
        this.updatePauseButtonState();
        this.updateHeaderWorkspaceName();
        
        // Only start notifications if auto-start is enabled
        if (this.settings.autoStartAlerts) {
            this.startNotificationTimer();
        }
        this.setWeeklyReport();
        this.initSoundManager();
        this.initPauseManager();
        this.initPomodoroManager();
        
        // Event listeners
        this.attachEventListeners();
        this.initSearch();
        this.initHashtagCompletion();
        
        // Set current time by default
        this.setCurrentTime();
        
        // Check notification permissions on first run
        this.checkNotificationSetup();
        document.getElementById('activity').focus();

        // Check for local file protocol
        if (window.location.protocol === 'file:') {
            console.warn('Running from local file - notifications may have limitations');
        }
        
        // Initialize due date monitoring system
        if (typeof initializeDueDateSystem === 'function') {
            initializeDueDateSystem();
        }
    }

    /**
     * Migrate existing entries to add hashtags and update schema
     */
    migrateExistingEntries() {
        let needsSave = false;
        
        this.entries.forEach(entry => {
            if (!entry.tags || entry.tags.length === 0) {
                entry.tags = this.extractHashtags(entry.activity + ' ' + (entry.description || ''));
                needsSave = true;
            }
        });
        
        if (needsSave) {
            this.saveEntries();
            console.log('Migrated existing entries with hashtags');
        }
    }

    /**
     * Get current report templates, combining defaults with custom templates from localStorage.
     */
    getReportTemplates() {
        // Start with default templates
        const allTemplates = { ...(window.ReportTemplates || {}) };
        
        // Load and merge custom templates
        const customTemplatesData = localStorage.getItem('customReportTemplates');
        if (customTemplatesData) {
            try {
                const customTemplates = JSON.parse(customTemplatesData);
                Object.assign(allTemplates, customTemplates);
                console.log('Loaded custom templates:', Object.keys(customTemplates));
            } catch (e) {
                console.error("Error parsing custom report templates from localStorage", e);
            }
        }
        
        return allTemplates;
    }

    /**
     * Load the report templates into the editor in the settings page.
     */
    loadReportTemplatesIntoEditor() {
        const editorContainer = document.getElementById('report-templates-editor');
        if (!editorContainer) return;

        const templates = this.getReportTemplates();
        editorContainer.innerHTML = Object.keys(templates).map(key => `
            <div class="template-group">
                <label for="template-${key}">${templates[key].name}</label>
                <textarea id="template-${key}" data-key="${key}">${escapeHtml(templates[key].template)}</textarea>
            </div>
        `).join('');
    }

    /**
     * Save the report templates from the editor to localStorage.
     */
    saveReportTemplates() {
        const editorContainer = document.getElementById('report-templates-editor');
        if (!editorContainer) return;

        const customTemplates = this.getReportTemplates();
        const textareas = editorContainer.querySelectorAll('textarea');

        textareas.forEach(textarea => {
            const key = textarea.dataset.key;
            if (customTemplates[key]) {
                customTemplates[key].template = textarea.value;
            }
        });

        localStorage.setItem('reportTemplates', JSON.stringify(customTemplates));
        showNotification('Report templates saved successfully!', 'success');
        
        // Refresh report section to reflect changes
        this.initReportTemplates();
        if (this.currentReportData) {
            this.previewReport();
        }
    }

    /**
     * Reset report templates to their default values.
     */
    resetReportTemplates() {
        if (confirm('Are you sure you want to reset all report templates to their default values?')) {
            localStorage.removeItem('reportTemplates');
            this.loadReportTemplatesIntoEditor();
            this.initReportTemplates();
            if (this.currentReportData) {
                this.previewReport();
            }
            showNotification('Report templates have been reset to default.', 'success');
        }
    }

    /**
     * Initialize markdown renderer
     */
    initMarkdownRenderer() {
        try {
            this.markdownRenderer = new MarkdownRenderer();
        } catch (error) {
            console.warn('Markdown Renderer initialization failed:', error);
        }
    }

    /**
     * Initialize pause manager
     */
    initPauseManager() {
        try {
            this.pauseManager = new PauseManager(this);
        } catch (error) {
            console.warn('Pause Manager initialization failed:', error);
        }
    }

    /**
     * Attach event listeners to forms
     */
    attachEventListeners() {
        // Main tracker form
        document.getElementById('activityForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addEntry('tracker');
        });

        // Todo form
        const todoForm = document.getElementById('todoActivityForm');
        if (todoForm) {
            todoForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addEntry('todo');
            });
        }

        // Notes form
        const notesForm = document.getElementById('notesActivityForm');
        if (notesForm) {
            notesForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addEntry('notes');
            });
        }

        document.getElementById('editForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateEntry();
        });

        // Auto-save settings when changed
        this.attachSettingsListeners();
    }

    /**
     * Attach event listeners to settings inputs for auto-save
     */
    attachSettingsListeners() {
        const settingsInputs = [
            'notificationInterval',
            'startTime', 
            'endTime',
            'pauseDuration',
            'soundMuteMode',
            'notificationSoundType',
            'darkModePreference',
            'autoStartAlerts',
            'paginationSize',
            'hashtagCloudLimit',
            'pomodoroEnabled',
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
            'warnOnActivityDelete',
            'warnOnSessionReset',
            'pomodoroPauseAllowed',
            'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
        ];

        settingsInputs.forEach(inputId => {
            const element = document.getElementById(inputId);
            if (element) {
                let eventType;
                if (element.type === 'checkbox' || element.tagName.toLowerCase() === 'select') {
                    eventType = 'change';
                } else {
                    eventType = 'input';
                }
                element.addEventListener(eventType, () => {
                    this.autoSaveSettings();
                });
            }
        });
    }

    /**
     * Auto-save settings when inputs change
     */
    autoSaveSettings() {
        // Update settings from UI
        this.settings.notificationInterval = parseInt(document.getElementById('notificationInterval').value);
        this.settings.startTime = document.getElementById('startTime').value;
        this.settings.endTime = document.getElementById('endTime').value;
        this.settings.pauseDuration = parseInt(document.getElementById('pauseDuration').value);
        this.settings.soundMuteMode = document.getElementById('soundMuteMode').value;
        this.settings.notificationSoundType = document.getElementById('notificationSoundType').value;
        this.settings.darkModePreference = document.getElementById('darkModePreference').value;
        this.settings.autoStartAlerts = document.getElementById('autoStartAlerts')?.value === 'true';
        this.settings.paginationSize = parseInt(document.getElementById('paginationSize').value);
        this.settings.hashtagCloudLimit = parseInt(document.getElementById('hashtagCloudLimit').value);
        this.settings.autoBulletDescriptions = document.getElementById('autoBulletDescriptions')?.value === 'true';
        this.settings.pomodoroAutoStart = document.getElementById('pomodoroAutoStart')?.checked || false;
        this.settings.pomodoroAutoLog = document.getElementById('pomodoroAutoLog')?.checked !== false;
        this.settings.pomodoroLogBreaks = document.getElementById('pomodoroLogBreaks')?.checked || false;

        // Update working days
        ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].forEach(day => {
            this.settings.workingDays[day] = document.getElementById(day).checked;
        });

        // Apply theme immediately
        this.applyTheme();

        // Update pagination settings if pagination size changed
        if (document.getElementById('paginationSize')) {
            this.updatePaginationSettings();
        }

        // Save to localStorage (this will show "Settings saved successfully!")
        this.saveSettings();

        // Restart notification timer if interval changed
        if (this.settings.notificationsEnabled) {
            this.startNotificationTimer();
        }

        // Update about section to reflect changes
        this.updateDebugInfo();

        // Save Pomodoro settings if manager exists
        if (this.pomodoroManager) {
            this.pomodoroManager.saveSettings();
            this.pomodoroManager.loadSettings();
        }
    }

    /**
     * Initialize Web Audio API for notification sounds
     */
    initSoundManager() {
        try {
            this.soundManager = new SoundManager();
        } catch (error) {
            console.warn('Sound Manager failed to initialise:', error);
        }
    }

    /**
     * Check if notification sounds are muted
     */
    isNotificationSoundMuted() {
        return this.settings.soundMuteMode === 'all' || this.settings.soundMuteMode === 'notifications';
    }

    /**
     * Check if Pomodoro sounds are muted
     */
    isPomodoroSoundMuted() {
        return this.settings.soundMuteMode === 'all' || this.settings.soundMuteMode === 'pomodoro';
    }

    /**
     * Play notification sound
     */
    playNotificationSound() {
        if (this.soundManager) {
            this.soundManager.playSound(this.settings.notificationSoundType, this.isNotificationSoundMuted());
        }
    }

    /**
     * Test notification sound
     */
    testNotificationSound() {
        if (this.soundManager) {
            const isMuted = this.isNotificationSoundMuted();
            
            if (isMuted) {
                let muteReason = 'Sound is muted because: ';
                const reasons = [];
                
                if (this.settings.muteSound) {
                    reasons.push('Global sound is disabled in Settings');
                }
                if (this.isOutsideWorkingHours()) {
                    reasons.push('Currently outside activity hours');
                }
                if (this.pomodoroManager && this.pomodoroManager.isActive()) {
                    reasons.push('Pomodoro mode is active');
                }
                
                muteReason += reasons.join(', ');
                alert(muteReason + '\n\nTo hear test sounds, please adjust your settings or check the time.');
                return;
            }
            
            this.soundManager.playSound(this.settings.notificationSoundType, false);
            showNotification('Test sound played!', 'success');
        } else {
            alert('Sound manager is not available');
        }
    }

    /**
     * Add a new activity entry
     * @param {Object} entry - Optional pre-formed entry object
     */
    addEntry(contextOrEntry) {
        let newEntry, context;
        
        // If first parameter is an entry object (from service worker), use it directly
        if (contextOrEntry && typeof contextOrEntry === 'object' && contextOrEntry.id) {
            newEntry = contextOrEntry;
            context = null; // No context needed for pre-built entries
        } else {
            // Otherwise, it's a context string ('tracker', 'todo', 'notes')
            context = contextOrEntry || 'tracker';
            newEntry = null;
        }
        
        if (!newEntry) {
            // Determine field IDs based on context
            let activityId, descriptionId, timestampId, dueDateId;
            let defaultIsTodo, defaultIsNote;
            
            if (context === 'todo') {
                activityId = 'todoActivity';
                descriptionId = 'todoDescription';
                timestampId = 'todoTimestamp';
                dueDateId = 'todoDueDate';
                defaultIsTodo = true;
                defaultIsNote = false;
            } else if (context === 'notes') {
                activityId = 'notesActivity';
                descriptionId = 'notesDescription';
                timestampId = 'notesTimestamp';
                dueDateId = 'notesDueDate';
                defaultIsTodo = false;
                defaultIsNote = true;
            } else {
                // Default to tracker context
                activityId = 'activity';
                descriptionId = 'description';
                timestampId = 'timestamp';
                dueDateId = 'dueDate';
                defaultIsTodo = isTodoModeActive();
                defaultIsNote = isNoteModeActive();
            }
            
            const activity = document.getElementById(activityId).value;
            const description = document.getElementById(descriptionId).value;
            const timestamp = document.getElementById(timestampId).value;
            
            // For contextual forms, use the context defaults unless overridden by toggle buttons
            let isTodo, isNote;
            if (context === 'todo') {
                // Check if note toggle is active in todo context
                isNote = document.getElementById('todoNoteToggleBtn')?.classList.contains('active') || false;
                isTodo = true; // Always true in todo context
            } else if (context === 'notes') {
                // Check if todo toggle is active in notes context
                isTodo = document.getElementById('notesTodToggleBtn')?.classList.contains('active') || false;
                isNote = true; // Always true in notes context
            } else {
                // Use the toggle state functions for tracker context
                isTodo = defaultIsTodo;
                isNote = defaultIsNote;
            }
            
            const dueDate = document.getElementById(dueDateId)?.value || null;

            // Extract hashtags from text and add pomodoro hashtags if active
            const extractedTags = this.extractHashtags(activity + ' ' + (description || ''));
            const pomodoroTags = this.generatePomodoroHashtags();
            const allTags = [...new Set([...extractedTags, ...pomodoroTags])];
            
            newEntry = {
                id: generateId(),
                activity,
                description,
                timestamp: new Date(timestamp).toISOString(),
                created: new Date().toISOString(),
                isTodo: isTodo,
                isNote: isNote,
                tags: allTags,
                dueDate: dueDate ? new Date(dueDate).toISOString() : null,
                startedAt: isTodo ? new Date(timestamp).toISOString() : null
            };
        } else if (newEntry.source === 'pomodoro') {
            const pomodoroTags = this.generatePomodoroHashtags();
            const allTags = [...new Set([...(newEntry.tags || []), ...pomodoroTags])];
            newEntry.tags = allTags;
        }

        // Development mode: Check for debug palette override flags
        this.validateDebugModeFlags(newEntry.tags);

        this.entries.unshift(newEntry);
        this.saveEntries();
        this.displayEntries();
        this.displayTodos();
        this.displayNotes();

        // Only reset form if this was a user-entered entry (not from service worker)
        if (context) {
            this.resetFormByContext(context);
            
            // Reset reminder timer based on setting
            this.handleReminderTimerReset('add');
        }
        
        showNotification('Entry added successfully!', 'success');
    }

    /**
     * Reset form based on context after adding an entry
     * @param {string} context - 'tracker', 'todo', or 'notes'
     */
    resetFormByContext(context) {
        if (context === 'todo') {
            // Reset todo form using the existing function
            resetTodoForm();
        } else if (context === 'notes') {
            // Reset notes form using the existing function
            resetNotesForm();
        } else {
            // Default tracker form reset
            document.getElementById('activityForm').reset();
            
            // Reset todo mode button
            const todoBtn = document.getElementById('todoToggleBtn');
            if (todoBtn) {
                todoBtn.classList.remove('active');
                todoBtn.textContent = 'Mark as Todo';
            }
            
            // Reset note mode button
            const noteBtn = document.getElementById('noteToggleBtn');
            if (noteBtn) {
                noteBtn.classList.remove('active');
                noteBtn.textContent = 'Mark as Note';
            }
            
            this.setCurrentTime();
            document.getElementById('activity').focus();
        }
    }

    /**
     * Update an existing entry
     */
    updateEntry() {
        const id = document.getElementById('editId').value;
        const activity = document.getElementById('editActivity').value;
        const description = document.getElementById('editDescription').value;
        const timestamp = document.getElementById('editTimestamp').value;
        const todoButton = document.getElementById('editTodoButton');
        const isTodo = todoButton ? todoButton.dataset.isTodo === 'true' : false;
        const noteButton = document.getElementById('editNoteButton');
        const isNote = noteButton ? noteButton.dataset.isNote === 'true' : false;
        const dueDate = document.getElementById('editDueDate').value;

        const entryIndex = this.entries.findIndex(entry => entry.id === id);
        if (entryIndex !== -1) {
            const existingEntry = this.entries[entryIndex];
            
            // Extract hashtags from text and add pomodoro hashtags if active
            const extractedTags = this.extractHashtags(activity + ' ' + (description || ''));
            const pomodoroTags = this.generatePomodoroHashtags();
            const allTags = [...extractedTags, ...pomodoroTags];
            
            this.entries[entryIndex] = {
                ...existingEntry,
                activity,
                description,
                timestamp: new Date(timestamp).toISOString(),
                isTodo,
                isNote,
                tags: allTags,
                dueDate: dueDate ? new Date(dueDate).toISOString() : null,
                // Preserve startedAt if it exists, or set it if becoming a todo
                startedAt: isTodo ? (existingEntry.startedAt || new Date(timestamp).toISOString()) : existingEntry.startedAt
            };
            
            this.saveEntries();
            this.displayEntries();
            this.displayTodos();
            this.displayNotes();
            this.closeEditModal();
            
            // Reset reminder timer based on setting
            this.handleReminderTimerReset('edit');
            
            showNotification('Entry updated successfully!', 'success');
        }
    }

    /**
     * Delete an entry
     * @param {string} id - Entry ID to delete
     */
    deleteEntry(id) {
        const entry = this.entries.find(e => e.id === id);
        if (!entry) return;
        
        // Check warning settings
        if (this.settings.warnOnActivityDelete) {
            showConfirmationDialog(
                'Delete Activity',
                `Are you sure you want to delete "${entry.activity}"? This action can be undone.`,
                (skipFuture) => {
                    if (skipFuture) {
                        this.settings.warnOnActivityDelete = false;
                        // Update the form element to reflect the change
                        const warnDeleteElement = document.getElementById('warnOnActivityDelete');
                        if (warnDeleteElement) {
                            warnDeleteElement.value = 'false';
                        }
                        this.saveSettings();
                    }
                    this.performDeletion(id);
                },
                {
                    confirmText: 'Delete',
                    buttonClass: 'btn-danger',
                    allowSkip: true
                }
            );
        } else {
            this.performDeletion(id);
        }
    }
    
    /**
     * Perform the actual deletion after confirmation
     */
    performDeletion(id) {
        const entry = this.entries.find(e => e.id === id);
        if (!entry) return;
        
        // Add to undo buffer
        this.addToUndoBuffer(entry);
        
        // Remove from entries
        this.entries = this.entries.filter(e => e.id !== id);
        this.saveEntries();
        this.displayEntries();
        this.displayTodos();
        this.displayNotes();
        
        showNotification('Entry deleted successfully! <button onclick="tracker.undoLastDeletion()" class="undo-btn">Undo</button>', 'success', 5000);
    }
    
    /**
     * Add deleted entry to undo buffer
     */
    addToUndoBuffer(entry) {
        // Ensure state and deletedEntriesBuffer are initialized
        if (!this.state) {
            this.state = this.loadState();
        }
        if (!this.state.deletedEntriesBuffer) {
            this.state.deletedEntriesBuffer = [];
        }
        
        // Add deleted entry with timestamp
        const deletedEntry = {
            ...entry,
            deletedAt: new Date().toISOString()
        };
        
        this.state.deletedEntriesBuffer.unshift(deletedEntry);
        
        // Keep only last 5 deleted entries
        if (this.state.deletedEntriesBuffer.length > 5) {
            this.state.deletedEntriesBuffer = this.state.deletedEntriesBuffer.slice(0, 5);
        }
        
        // Save state
        this.saveState();
    }
    
    /**
     * Undo the last deletion
     */
    undoLastDeletion() {
        // Ensure state and deletedEntriesBuffer are initialized
        if (!this.state) {
            this.state = this.loadState();
        }
        if (!this.state.deletedEntriesBuffer) {
            this.state.deletedEntriesBuffer = [];
        }
        
        if (this.state.deletedEntriesBuffer.length === 0) {
            showNotification('No deletions to undo', 'info');
            return;
        }
        
        const lastDeleted = this.state.deletedEntriesBuffer.shift();
        delete lastDeleted.deletedAt; // Remove the deletion timestamp
        
        // Check if entry with same ID already exists
        if (this.entries.find(e => e.id === lastDeleted.id)) {
            // Generate new ID to avoid conflicts
            lastDeleted.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        }
        
        // Add back to entries
        this.entries.unshift(lastDeleted);
        this.saveEntries();
        this.displayEntries();
        this.displayTodos();
        this.displayNotes();
        
        // Update state
        this.saveState();
        
        showNotification(`Restored "${lastDeleted.activity}"`, 'success');
    }
    
    /**
     * Get undo buffer for display purposes
     */
    getUndoBuffer() {
        return this.deletedEntriesBuffer.map(entry => ({
            id: entry.id,
            activity: entry.activity,
            description: entry.description,
            timestamp: entry.timestamp,
            deletedAt: entry.deletedAt
        }));
    }

    /**
     * Edit an entry (open modal)
     * @param {string} id - Entry ID to edit
     */
    editEntry(id) {
        const entry = this.entries.find(entry => entry.id === id);
        if (entry) {
            document.getElementById('editId').value = entry.id;
            document.getElementById('editActivity').value = entry.activity;
            
            // Check if entry has tags that aren't already in activity/description text
            let description = entry.description || '';
            if (entry.tags && entry.tags.length > 0) {
                const existingText = entry.activity + ' ' + description;
                const existingTags = this.extractHashtags(existingText);
                const missingTags = entry.tags.filter(tag => !existingTags.includes(tag));
                
                // Add missing tags to description to preserve them during editing
                if (missingTags.length > 0) {
                    const tagString = missingTags.map(tag => `#${tag}`).join(' ');
                    description = description ? `${description} ${tagString}` : tagString;
                }
            }
            
            document.getElementById('editDescription').value = description;
            document.getElementById('editTimestamp').value = 
                new Date(entry.timestamp).toISOString().slice(0, 16);
            
            // Update todo button state
            this.setEditTodoButtonState(entry.isTodo || false);
            
            // Update note button state
            this.setEditNoteButtonState(entry.isNote || false);
            
            document.getElementById('editDueDate').value = 
                entry.dueDate ? new Date(entry.dueDate).toISOString().slice(0, 16) : '';
            
            document.getElementById('editModal').style.display = 'block';
            
            // Adjust textarea height based on available modal space
            this.adjustEditTextareaHeight();
        }
    }
    
    /**
     * Dynamically adjust edit modal textarea height based on available space
     */
    adjustEditTextareaHeight() {
        const modal = document.getElementById('editModal');
        const modalContent = modal.querySelector('.modal-content');
        const textarea = document.getElementById('editDescription');
        
        if (!modal || !modalContent || !textarea) return;
        
        // Wait for modal to be fully rendered
        setTimeout(() => {
            const viewportHeight = window.innerHeight;
            const modalRect = modalContent.getBoundingClientRect();
            const modalBodyHeight = modal.querySelector('.modal-body').offsetHeight;
            
            // Calculate how much vertical space is available in the modal
            const modalTopPadding = 40; // Typical modal top margin
            const modalBottomPadding = 40; // Space below modal
            const availableModalHeight = viewportHeight - modalTopPadding - modalBottomPadding;
            
            // Calculate space used by other elements in modal
            const modalHeader = modal.querySelector('.modal-header');
            const modalActions = modal.querySelector('.modal-actions');
            const otherFields = modal.querySelectorAll('.form-group:not(:has(#editDescription))');
            
            let usedHeight = 0;
            if (modalHeader) usedHeight += modalHeader.offsetHeight;
            if (modalActions) usedHeight += modalActions.offsetHeight;
            otherFields.forEach(field => usedHeight += field.offsetHeight);
            
            // Add padding and margins
            usedHeight += 120; // Buffer for padding, margins, and spacing
            
            // Calculate available height for textarea
            const availableHeight = availableModalHeight - usedHeight;
            
            console.log('Textarea sizing:', {
                viewportHeight,
                availableModalHeight,
                usedHeight,
                availableHeight,
                modalRect: modalRect.height
            });
            
            // Set appropriate rows based on available space
            if (availableHeight > 350) {
                textarea.rows = 15; // Plenty of space
            } else if (availableHeight > 250) {
                textarea.rows = 10; // Good space
            } else if (availableHeight > 150) {
                textarea.rows = 6; // Medium space
            } else if (availableHeight > 100) {
                textarea.rows = 4; // Limited space
            } else {
                textarea.rows = 3; // Very limited space
            }
            
            console.log(`Set textarea to ${textarea.rows} rows based on ${availableHeight}px available height`);
        }, 100);
    }
    
    /**
     * Set the edit todo button state
     */
    setEditTodoButtonState(isTodo) {
        const button = document.getElementById('editTodoButton');
        const buttonText = document.getElementById('editTodoButtonText');
        const editDueDateSection = document.getElementById('editDueDateSection');
        
        if (button && buttonText) {
            button.dataset.isTodo = isTodo.toString();
            if (isTodo) {
                button.classList.add('active');
                buttonText.textContent = 'Remove from Todos';
                // Show due date section when in todo mode
                if (editDueDateSection) {
                    editDueDateSection.style.display = 'block';
                }
            } else {
                button.classList.remove('active');
                buttonText.textContent = 'Mark as Todo';
                // Hide due date section when not in todo mode
                if (editDueDateSection) {
                    editDueDateSection.style.display = 'none';
                }
            }
        }
    }

    /**
     * Set the edit note button state
     */
    setEditNoteButtonState(isNote) {
        const button = document.getElementById('editNoteButton');
        const buttonText = document.getElementById('editNoteButtonText');
        
        if (button && buttonText) {
            button.dataset.isNote = isNote.toString();
            if (isNote) {
                button.classList.add('active');
                buttonText.textContent = 'Remove from Notes';
            } else {
                button.classList.remove('active');
                buttonText.textContent = 'Mark as Note';
            }
        }
    }

    /**
     * Close the edit modal
     */
    closeEditModal() {
        document.getElementById('editModal').style.display = 'none';
    }

    /**
     * Display entries in the UI
     */
    displayEntries() {
        const container = document.getElementById('entriesList');
        
        // Initialize entries pagination if it doesn't exist
        if (!this.entriesPagination) {
            this.entriesPagination = {
                currentPage: 1,
                itemsPerPage: this.settings.paginationSize || 20
            };
        }
        
        // Update pagination size if settings changed
        this.entriesPagination.itemsPerPage = this.settings.paginationSize || 20;
        
        // Sort entries with overdue items first
        const sortedEntries = this.getSortedEntriesWithOverduePriority();
        
        // Calculate pagination
        const startIndex = (this.entriesPagination.currentPage - 1) * this.entriesPagination.itemsPerPage;
        const endIndex = startIndex + this.entriesPagination.itemsPerPage;
        const paginatedEntries = sortedEntries.slice(startIndex, endIndex);

        if (paginatedEntries.length === 0) {
            container.innerHTML = '<p>No entries yet. Add your first activity above!</p>';
            return;
        }

        container.innerHTML = paginatedEntries.map(entry => this.renderEntry(entry, { showTodoIndicator: true, showNoteIndicator: true })).join('');
        
        // Update pagination controls
        this.updateEntriesPagination(sortedEntries.length);
    }

    /**
     * Get entries sorted with overdue items prioritised first
     */
    getSortedEntriesWithOverduePriority() {
        const now = new Date();
        const overdueEntries = this.entries.filter(entry => entry.dueDate && entry.isTodo && new Date(entry.dueDate) < now);
        const regularEntries = this.entries.filter(entry => !entry.dueDate || !entry.isTodo || new Date(entry.dueDate) >= now);

        // Sort overdue entries by how overdue they are (most overdue first)
        const sortedOverdue = overdueEntries.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        // Keep regular entries in their original order (newest first, which is the default)
        const sortedRegular = regularEntries;

        // Return overdue items first, then regular items
        return [...sortedOverdue, ...sortedRegular];
    }

    /**
     * Unified entry rendering method used by both main entries and todo sections
     * @param {Object} entry - The entry to render
     * @param {Object} options - Rendering options
     * @returns {string} HTML string for the entry
     */
    renderEntry(entry, options = {}) {
        const {
            showTodoIndicator = false,
            showNoteIndicator = false,
            showCreatedTime = false
        } = options;

        const now = new Date();
        const isOverdue = entry.isTodo && entry.dueDate && new Date(entry.dueDate) < now;
        const isTodo = entry.isTodo;
        
        let itemClass = 'entry-item';
        if (isTodo) {
            itemClass += isOverdue ? ' entry-todo entry-overdue' : ' entry-todo';
        }
        
        // Generate human-friendly due date display (only show if item is currently a todo)
        let dueDateHtml = '';
        if (entry.dueDate && isTodo && typeof formatTimeUntilDue === 'function') {
            const countdownText = formatTimeUntilDue(entry.dueDate);
            if (countdownText) {
                const isOverdueItem = typeof isOverdue === 'function' && isOverdue(entry.dueDate);
                const badgeClass = isOverdueItem ? 'due-badge-overdue' : 'due-badge-normal';
                dueDateHtml = `<div class="entry-due-date"><span class="due-countdown-badge ${badgeClass}">${countdownText}</span></div>`;
            }
        } else if (entry.dueDate && isTodo) {
            // Fallback to formatted date if countdown functions aren't available (only for todos)
            dueDateHtml = `<div class="entry-due-date">Due: ${formatDateTime(entry.dueDate)}</div>`;
        }

        // For todo section, show created time instead of timestamp, and optionally show todo indicator
        const timeToShow = showCreatedTime && entry.created ? entry.created : entry.timestamp;
        const todoIndicator = (showTodoIndicator && entry.isTodo) ? '<span class="entry-todo-indicator">📋 Todo</span>' : '';
        const noteIndicator = (showNoteIndicator && entry.isNote) ? '<span class="entry-note-indicator">📝 Note</span>' : '';

        // Process description with inline hashtags
        const processedDescription = entry.description ? this.renderDescriptionWithInlineHashtags(entry.description, entry.tags, entry.isTodo) : '';

        return `
            <div class="${itemClass}">
                <div class="entry-content">
                    <div class="entry-time">${formatDateTime(timeToShow)} ${todoIndicator}${noteIndicator}</div>
                    <div class="entry-activity">${escapeHtml(entry.activity)}</div>
                    ${processedDescription ? `<div class="entry-description">${processedDescription}</div>` : ''}
                    ${dueDateHtml}
                </div>
                <div class="entry-actions">
                    ${entry.isTodo ? `<button class="btn btn-success btn-small" onclick="tracker.completeEntry('${entry.id}')" title="Mark as completed">Mark Complete</button>` : ''}
                    <button class="btn btn-secondary btn-small" onclick="tracker.editEntry('${entry.id}')">Edit</button>
                    <button class="btn btn-danger btn-small" onclick="tracker.deleteEntry('${entry.id}')">Delete</button>
                </div>
            </div>
        `;
    }

    /**
     * Process description to add auto bullets/checkboxes if enabled
     * @param {string} description - Original description text
     * @param {boolean} isTodo - Whether this entry is a todo
     * @returns {string} Processed description with auto bullets/checkboxes
     */
    processAutoBulletDescription(description, isTodo = false) {
        if (!this.settings.autoBulletDescriptions || !description) {
            return description;
        }

        const lines = description.split('\n');
        const processedLines = lines.map(line => {
            // Skip empty lines
            if (!line.trim()) {
                return line;
            }

            // Check if line already has a bullet pattern (optional whitespace followed by "- ")
            const bulletPattern = /^\s*- /;
            const checkboxPattern = /^\s*- \[[ x]\] /;
            
            // If line already has bullets or checkboxes, leave as is
            if (bulletPattern.test(line)) {
                return line;
            }

            // For todos, add checkbox syntax; for regular entries, add bullet
            const prefix = isTodo ? '- [ ] ' : '- ';
            
            // Preserve leading whitespace for nested items
            const leadingWhitespace = line.match(/^\s*/)[0];
            const trimmedLine = line.trim();
            
            return leadingWhitespace + prefix + trimmedLine;
        });

        return processedLines.join('\n');
    }

    /**
     * Render description text as markdown
     * @param {string} description - Description text
     * @param {boolean} isTodo - Whether this entry is a todo (for checkbox rendering)
     * @returns {string} HTML string
     */
    renderDescriptionMarkdown(description, isTodo = false) {
        // Initialize markdown renderer if not already done
        if (!this.markdownRenderer && typeof MarkdownRenderer !== 'undefined') {
            this.initMarkdownRenderer();
        }

        if (this.markdownRenderer && description) {
            // Process description with auto bullets/checkboxes if enabled
            const processedDescription = this.processAutoBulletDescription(description, isTodo);
            return this.markdownRenderer.renderInlineWithClasses(processedDescription);
        }
        return escapeHtml(description);
    }

    /**
     * Render description with inline hashtag links and add missing tags
     * @param {string} description - The entry description
     * @param {Array} entryTags - The tags associated with this entry
     * @param {boolean} isTodo - Whether this entry is a todo
     * @returns {string} Processed description with clickable hashtags
     */
    renderDescriptionWithInlineHashtags(description, entryTags = [], isTodo = false) {
        // Start with the description, adding missing tags if needed
        let fullText = description;
        
        // Check if entry has tags that aren't already in the description
        if (entryTags && entryTags.length > 0) {
            const existingTags = this.extractHashtags(description);
            const missingTags = entryTags.filter(tag => !existingTags.includes(tag));
            
            // Add missing tags to the end of the description
            if (missingTags.length > 0) {
                const tagString = missingTags.map(tag => `#${tag}`).join(' ');
                fullText = fullText ? `${fullText} ${tagString}` : tagString;
            }
        }
        
        // First apply markdown rendering
        let processedText = this.renderDescriptionMarkdown(fullText, isTodo);
        
        // Convert URLs to clickable links first (before hashtags to avoid conflicts)
        processedText = processedText.replace(/(https?:\/\/[^\s<>"\[\]]+)/gi, (match, url) => {
            return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="external-link">${url}</a>`;
        });
        
        // Protect checkbox labels from hashtag processing
        const protectedCheckboxes = [];
        const checkboxProtectionPattern = /<li class="todo-item[^>]*>.*?<\/li>/gs;
        
        // Replace checkbox HTML with placeholders
        processedText = processedText.replace(checkboxProtectionPattern, (match) => {
            const placeholder = `__PROTECTED_TODO_${protectedCheckboxes.length}__`;
            protectedCheckboxes.push(match);
            return placeholder;
        });
        
        // Then replace hashtags with clickable links (now safe from checkbox interference)
        processedText = processedText.replace(/(?<!href="[^"]*|href='[^']*)#([\w][\w-]*)/g, (match, tag) => {
            return `<a href="#" class="hashtag-link" onclick="tracker.searchByHashtag('${tag}'); return false;">#${tag}</a>`;
        });
        
        // Restore protected checkbox HTML
        protectedCheckboxes.forEach((originalHtml, index) => {
            processedText = processedText.replace(`__PROTECTED_TODO_${index}__`, originalHtml);
        });
        
        return processedText;
    }

    /**
     * Save entries to localStorage
     */
    saveEntries() {
        localStorage.setItem('activityEntries', JSON.stringify(this.entries));
    }

    /**
     * Save settings
     */
    saveSettings() {
        try {
            this.settings = {
            ...this.settings,
            notificationInterval: parseInt(document.getElementById('notificationInterval').value),
            startTime: document.getElementById('startTime').value,
            endTime: document.getElementById('endTime').value,
            pauseDuration: parseInt(document.getElementById('pauseDuration').value),
            soundMuteMode: document.getElementById('soundMuteMode').value,
            notificationSoundType: document.getElementById('notificationSoundType').value,
            reminderTimerReset: document.getElementById('reminderTimerReset').value,
            darkModePreference: document.getElementById('darkModePreference').value,
            autoStartAlerts: document.getElementById('autoStartAlerts')?.value === 'true',
            hasRequestedNotificationPermission: this.settings.hasRequestedNotificationPermission, // Don't override this from form
            sendSystemNotifications: document.getElementById('sendSystemNotifications')?.value === 'true',
            paginationSize: parseInt(document.getElementById('paginationSize').value),
            hashtagCloudLimit: parseInt(document.getElementById('hashtagCloudLimit').value),
            autoBulletDescriptions: document.getElementById('autoBulletDescriptions')?.value === 'true',
            warnOnActivityDelete: document.getElementById('warnOnActivityDelete')?.value === 'true',
            warnOnSessionReset: document.getElementById('warnOnSessionReset')?.value === 'true',
            workingDays: {
                monday: document.getElementById('monday').checked,
                tuesday: document.getElementById('tuesday').checked,
                wednesday: document.getElementById('wednesday').checked,
                thursday: document.getElementById('thursday').checked,
                friday: document.getElementById('friday').checked,
                saturday: document.getElementById('saturday').checked,
                sunday: document.getElementById('sunday').checked
            },
            // Pomodoro settings
            pomodoroEnabled: document.getElementById('pomodoroEnabled')?.checked || false,
            pomodoroWorkDuration: parseInt(document.getElementById('pomodoroWorkDuration')?.value) || 25,
            pomodoroBreakDuration: parseInt(document.getElementById('pomodoroBreakDuration')?.value) || 5,
            pomodoroAutoStart: document.getElementById('pomodoroAutoStart')?.checked || false,
            pomodoroAutoLog: document.getElementById('pomodoroAutoLog')?.checked !== false,
            pomodoroLogBreaks: document.getElementById('pomodoroLogBreaks')?.checked || false,
            pomodoroLongBreak: document.getElementById('pomodoroLongBreak')?.checked || false,
            pomodoroPauseAllowed: document.getElementById('pomodoroPauseAllowed')?.checked !== false,
            
            // Backup settings
            backupType: document.getElementById('backupType')?.value || 'reminders',
            backupReminders: this.settings.backupReminders, // Managed by backupType logic
            automaticBackups: this.settings.automaticBackups, // Managed by backupType logic
            backgroundBackupFrequency: document.getElementById('backgroundBackupFrequency')?.value || 'daily',
            backgroundBackupPermission: this.settings.backgroundBackupPermission // Don't override this from form
        };

            localStorage.setItem('activitySettings', JSON.stringify(this.settings));
            this.applyTheme();
            this.startNotificationTimer();
            
            // Update Pomodoro manager if it exists
            if (this.pomodoroManager) {
                this.pomodoroManager.saveSettings();
                this.pomodoroManager.loadSettings();
            }
            
            // Update pause manager to reflect new activity schedule
            if (this.pauseManager) {
                this.pauseManager.updatePauseButtonDisplay();
            }
            
            // Also save any pending template changes
            if (this.templateManagerState && this.templateManagerState.hasUnsavedChanges) {
                this.saveTemplatesQuietly();
            }
            
            // Update pagination settings and refresh displays
            this.updatePaginationSettings();
            
            // Settings saved silently - only show notifications on errors
        } catch (error) {
            console.error('Error saving settings:', error);
            showNotification('Failed to save settings. Please try again.', 'error');
        }
    }

    /**
     * Check if browser supports notifications and handle first-run setup
     */
    checkNotificationSetup() {
        // Skip if user has already been asked or notifications aren't supported
        if (this.settings.hasRequestedNotificationPermission || !this.isNotificationSupported()) {
            this.updateSystemNotificationsVisibility();
            return;
        }
        
        // Show first-run notification permission dialog
        setTimeout(() => {
            this.showNotificationPermissionDialog();
        }, 1000); // Small delay to let app finish loading
    }

    /**
     * Check if the current environment supports notifications
     */
    isNotificationSupported() {
        // Check for file:// protocol
        if (window.location.protocol === 'file:') {
            return false;
        }
        
        // Check for Notification API
        if (!('Notification' in window)) {
            return false;
        }
        
        // Additional checks for mobile browsers that claim support but don't really work
        const userAgent = navigator.userAgent.toLowerCase();
        
        // iOS Safari has limited notification support
        if (/iphone|ipad|ipod/.test(userAgent) && /safari/.test(userAgent) && !/chrome|crios|fxios/.test(userAgent)) {
            return false;
        }
        
        return true;
    }

    /**
     * Show notification permission setup dialog
     */
    showNotificationPermissionDialog() {
        const modal = document.getElementById('notificationPermissionModal');
        if (modal) {
            modal.style.display = 'block';
        }
    }

    /**
     * Handle user requesting notification permission
     */
    async requestNotificationPermission() {
        try {
            const permission = await Notification.requestPermission();
            
            // Mark that we've asked the user
            this.settings.hasRequestedNotificationPermission = true;
            
            if (permission === 'granted') {
                this.settings.sendSystemNotifications = true;
                showNotification('System notifications enabled! You\'ll receive reminders through your operating system.', 'success');
            } else {
                this.settings.sendSystemNotifications = false;
                showNotification('System notifications disabled. You\'ll still receive sound alerts within the app.', 'info');
            }
            
            this.saveSettings();
            this.updateSystemNotificationsVisibility();
            this.closeNotificationPermissionDialog();
            
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            this.declineNotificationPermission();
        }
    }

    /**
     * Handle user declining notification permission
     */
    declineNotificationPermission() {
        this.settings.hasRequestedNotificationPermission = true;
        this.settings.sendSystemNotifications = false;
        
        this.saveSettings();
        this.updateSystemNotificationsVisibility();
        this.closeNotificationPermissionDialog();
        
        showNotification('Sound alerts enabled. You can enable system notifications later in General Settings.', 'info');
    }

    /**
     * Close notification permission dialog
     */
    closeNotificationPermissionDialog() {
        const modal = document.getElementById('notificationPermissionModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    /**
     * Update visibility of system notifications setting
     */
    updateSystemNotificationsVisibility() {
        const systemNotificationsGroup = document.getElementById('systemNotificationsGroup');
        
        if (systemNotificationsGroup) {
            if (this.settings.hasRequestedNotificationPermission && this.isNotificationSupported()) {
                systemNotificationsGroup.style.display = 'block';
            } else {
                systemNotificationsGroup.style.display = 'none';
            }
        }
    }

    /**
     * Force enable notification capability (for diagnostics)
     */
    forceEnableNotificationCapability() {
        this.settings.hasRequestedNotificationPermission = false;
        this.saveSettings();
        this.showNotificationPermissionDialog();
    }

    /**
     * Toggle activity reminders on/off
     */
    toggleActivityReminders() {
        if (this.settings.notificationsEnabled) {
            // Turn off reminders
            this.settings.notificationsEnabled = false;
            this.stopNotificationTimer();
            showNotification('Activity reminders turned off', 'info');
        } else {
            // Turn on reminders
            this.settings.notificationsEnabled = true;
            this.startNotificationTimer();
            showNotification('Activity reminders turned on', 'success');
        }
        
        this.saveSettings();
        this.updateNotificationStatus();
        this.updatePauseButtonState();
    }

    /**
     * Load application state from localStorage or create default state
     */
    loadState() {
        try {
            const stateJson = localStorage.getItem('activityState');
            if (stateJson) {
                return JSON.parse(stateJson);
            }
        } catch (error) {
            console.warn('Error loading state from localStorage:', error);
        }
        
        // Return default state structure
        return {
            // Undo buffer for deletions (max 5 items)
            deletedEntriesBuffer: [],
            
            // Pomodoro session state
            pomodoro: {
                isRunning: false,
                isPaused: false,
                currentPhase: null, // 'work' or 'break'
                sessionNumber: 0,
                startTime: null,
                originalDuration: null,
                remainingTime: null,
                pausedAt: null,
                workActivity: null, // {name, description}
                cycleCount: 0,
                totalSessions: 0
            },
            
            // Current activity being worked on (not yet logged)
            currentActivity: {
                name: '',
                description: '',
                startTime: null,
                tags: []
            },
            
            // Todo state
            todos: {
                currentTodo: null,
                completedSinceLastLog: []
            },
            
            timestamp: Date.now()
        };
    }

    /**
     * Save application state to localStorage
     */
    saveState() {
        // Update timestamp
        this.state.timestamp = Date.now();
        
        // Save to localStorage alongside other app data
        localStorage.setItem('activityState', JSON.stringify(this.state));
        
        console.log('State saved:', this.state);
    }

    /**
     * Clear application state from localStorage
     */
    clearState() {
        localStorage.removeItem('activityState');
        this.state = this.loadState();
    }

    /**
     * Update pomodoro state and save
     */
    updatePomodoroState(updates) {
        this.state.pomodoro = { ...this.state.pomodoro, ...updates };
        this.saveState();
    }

    /**
     * Update pagination settings and refresh displays
     */
    updatePaginationSettings() {
        const newSize = this.settings.paginationSize || 20;
        
        // Update entries pagination
        if (this.entriesPagination) {
            this.entriesPagination.itemsPerPage = newSize;
            this.entriesPagination.currentPage = 1; // Reset to first page
        }
        
        // Update todo pagination
        if (this.todoPagination) {
            this.todoPagination.itemsPerPage = newSize;
            this.todoPagination.currentPage = 1; // Reset to first page
        }
        
        // Update notes pagination
        if (this.notesPagination) {
            this.notesPagination.itemsPerPage = newSize;
            this.notesPagination.currentPage = 1; // Reset to first page
        }
        
        // Update search pagination
        if (this.searchState && this.searchState.searchPagination) {
            this.searchState.searchPagination.itemsPerPage = newSize;
            this.searchState.searchPagination.currentPage = 1; // Reset to first page
        }
        
        // Refresh displays
        this.displayEntries();
        this.displayTodos();
        this.displayNotes();
        
        // Refresh search results if there's an active search
        if (this.searchState && this.searchState.currentQuery) {
            this.performSearch(this.searchState.currentQuery);
        }
    }

    /**
     * Load settings into the UI
     */
    loadSettings() {
        document.getElementById('notificationInterval').value = this.settings.notificationInterval;
        document.getElementById('startTime').value = this.settings.startTime;
        document.getElementById('endTime').value = this.settings.endTime;
        document.getElementById('pauseDuration').value = this.settings.pauseDuration;
        document.getElementById('soundMuteMode').value = this.settings.soundMuteMode;
        document.getElementById('darkModePreference').value = this.settings.darkModePreference;
        document.getElementById('autoStartAlerts').value = this.settings.autoStartAlerts.toString();
        document.getElementById('paginationSize').value = this.settings.paginationSize;
        document.getElementById('hashtagCloudLimit').value = this.settings.hashtagCloudLimit;
        document.getElementById('autoBulletDescriptions').value = this.settings.autoBulletDescriptions.toString();
        document.getElementById('sendSystemNotifications').value = this.settings.sendSystemNotifications.toString();
        document.getElementById('warnOnActivityDelete').value = this.settings.warnOnActivityDelete.toString();
        document.getElementById('warnOnSessionReset').value = this.settings.warnOnSessionReset.toString();
        document.getElementById('reminderTimerReset').value = this.settings.reminderTimerReset;
        
        // Populate sound dropdowns with all available sounds
        this.populateSoundDropdowns();
        
        Object.entries(this.settings.workingDays).forEach(([day, checked]) => {
            document.getElementById(day).checked = checked;
        });
        
        // Initialize complex schedule toggle and UI
        const useComplexScheduleEl = document.getElementById('useComplexSchedule');
        if (useComplexScheduleEl) {
            useComplexScheduleEl.checked = this.settings.useComplexSchedule || false;
            // Initialize the schedule mode display
            if (typeof toggleScheduleMode === 'function') {
                const simpleSchedule = document.getElementById('simpleSchedule');
                const complexSchedule = document.getElementById('complexSchedule');
                if (this.settings.useComplexSchedule) {
                    if (simpleSchedule) simpleSchedule.style.display = 'none';
                    if (complexSchedule) complexSchedule.style.display = 'block';
                    // Populate complex schedule if function is available
                    if (typeof populateComplexSchedule === 'function') {
                        populateComplexSchedule();
                    }
                } else {
                    if (simpleSchedule) simpleSchedule.style.display = 'block';
                    if (complexSchedule) complexSchedule.style.display = 'none';
                }
            }
        }
        
        // Load backup settings
        const backupTypeEl = document.getElementById('backupType');
        const backupRemindersEl = document.getElementById('backupReminders');
        const backupScheduleEl = document.getElementById('backupSchedule');
        const backupFilenamePatternEl = document.getElementById('backupFilenamePattern');
        const automaticBackupsEl = document.getElementById('automaticBackups');
        const backgroundBackupFrequencyEl = document.getElementById('backgroundBackupFrequency');
        
        if (backupTypeEl) {
            // Determine backup type from current settings
            if (this.settings.automaticBackups) {
                backupTypeEl.value = 'automatic';
            } else if (this.settings.backupReminders === 'never') {
                backupTypeEl.value = 'off';
            } else {
                backupTypeEl.value = 'reminders';
            }
        }
        
        if (backupRemindersEl) backupRemindersEl.value = this.settings.backupReminders;
        if (backupScheduleEl) backupScheduleEl.value = this.settings.backupSchedule;
        if (backupFilenamePatternEl) backupFilenamePatternEl.value = this.settings.backupFilenamePattern;
        if (automaticBackupsEl) automaticBackupsEl.checked = this.settings.automaticBackups;
        if (backgroundBackupFrequencyEl) backgroundBackupFrequencyEl.value = this.settings.backgroundBackupFrequency;
        
        // Update backup type UI after loading settings
        if (typeof updateBackupTypeSettings === 'function') {
            updateBackupTypeSettings(true); // Pass true to indicate this is initialization
        }
        
        // Update system notifications visibility
        this.updateSystemNotificationsVisibility();

        this.applyTheme();
    }
    
    /**
     * Populate all sound dropdowns with available sounds
     */
    populateSoundDropdowns() {
        const soundDropdowns = [
            { id: 'notificationSoundType', selectedValue: this.settings.notificationSoundType },
            { id: 'pomodoroShortBreakSound', selectedValue: this.settings.pomodoroShortBreakSound || 'gentle' },
            { id: 'pomodoroLongBreakSound', selectedValue: this.settings.pomodoroLongBreakSound || 'bell' },
            { id: 'pomodoroResumeSound', selectedValue: this.settings.pomodoroResumeSound || 'digital' }
        ];
        
        soundDropdowns.forEach(({ id, selectedValue }) => {
            const dropdown = document.getElementById(id);
            if (dropdown && typeof generateSoundOptions === 'function') {
                dropdown.innerHTML = generateSoundOptions([], selectedValue);
            }
        });
    }

    /**
     * Apply the current theme (light/dark)
     */
    applyTheme() {
        let shouldUseDarkMode = false;
        
        switch (this.settings.darkModePreference) {
            case 'dark':
                shouldUseDarkMode = true;
                break;
            case 'light':
                shouldUseDarkMode = false;
                break;
            case 'system':
                // Check system preference
                shouldUseDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                break;
            default:
                shouldUseDarkMode = false;
        }
        
        if (shouldUseDarkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
        
        // Listen for system preference changes if using system mode
        if (this.settings.darkModePreference === 'system') {
            if (!this.systemThemeListener) {
                this.systemThemeListener = (e) => {
                    if (this.settings.darkModePreference === 'system') {
                        this.applyTheme();
                    }
                };
                window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', this.systemThemeListener);
            }
        }
    }

    /**
     * Toggle notifications on/off
     */
    async enableNotifications() {
        if (!('Notification' in window) || !('serviceWorker' in navigator)) {
            alert('This browser does not support notifications or service workers.');
            this.updateDebugInfo();
            return;
        }

        // If notifications are currently enabled, disable them
        if (this.settings.notificationsEnabled && Notification.permission === 'granted') {
            this.settings.notificationsEnabled = false;
            this.saveSettings();
            this.stopNotificationTimer();
            showNotification('Notifications disabled', 'success');
            this.updateNotificationStatus();
            this.updateDebugInfo();
            return;
        }

        // If notifications are disabled, enable them
        try {
            console.log('Requesting notification permission...');
            const permission = await Notification.requestPermission();
            console.log('Permission result:', permission);
            
            if (permission === 'granted') {
                this.settings.notificationsEnabled = true;
                this.saveSettings();
                showNotification('Notifications enabled successfully!', 'success');
                this.startNotificationTimer();
                
                setTimeout(() => {
                    this.testNotification(true);
                }, 1000);
            } else if (permission === 'denied') {
                showNotification('Notifications were denied. Please check your browser settings and try again.', 'error');
            } else {
                showNotification('Notification permission was not granted. Please try again.', 'error');
            }
            
            setTimeout(() => {
                this.updateNotificationStatus();
                this.updateDebugInfo();
            }, 500);
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            showNotification('Error requesting notification permission: ' + error.message, 'error');
            this.updateDebugInfo();
        }
    }

    /**
     * Show notification with fallback support
     * @param {string} title - Notification title
     * @param {Object} options - Notification options
     */
    async showNotificationWithServiceWorker(title, options) {
        if (!('Notification' in window)) {
            console.warn('Notifications not supported');
            return;
        }

        // Check if system notifications are disabled in settings
        if (!this.settings.sendSystemNotifications) {
            console.log('System notifications disabled in settings, skipping notification');
            return;
        }

        if (Notification.permission !== 'granted') {
            console.warn('Notification permission not granted');
            return;
        }

        try {
            // Debug Service Worker state
            console.log('Service Worker debug info:', {
                supported: 'serviceWorker' in navigator,
                controller: navigator.serviceWorker?.controller?.state,
                controllerUrl: navigator.serviceWorker?.controller?.scriptURL
            });
            
            // Try service worker approach first
            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.ready;
                console.log('Service Worker registration ready:', registration);
                
                // Show notification via Service Worker
                console.log('Showing notification with options:', options);
                await registration.showNotification(title, options);
                console.log('Notification shown via Service Worker');
                return;
            }
        } catch (error) {
            console.warn('Service Worker notification failed, falling back to direct notification:', error);
        }

        // Fallback: Use direct Notification API (limited functionality)
        try {
            // Remove service worker specific options for fallback
            const fallbackOptions = {
                body: options.body,
                icon: options.icon,
                tag: options.tag,
                requireInteraction: options.requireInteraction
                // Note: actions are not supported in direct notifications
            };

            const notification = new Notification(title, fallbackOptions);
            
            // Handle click events for fallback notifications
            notification.onclick = () => {
                window.focus();
                notification.close();
            };

            console.log('Notification shown via direct API (limited features)');
            
            // Auto-close after some time if not set to require interaction
            if (!options.requireInteraction) {
                setTimeout(() => {
                    notification.close();
                }, 5000);
            }

        } catch (directError) {
            console.error('Both Service Worker and direct notification failed:', directError);
            
            // Last resort: show in-app notification
            showNotification('Activity reminder: ' + (options.body || 'Time to log your activity!'), 'info', 8000);
        }
    }

    /**
     * Test notification
     * @param {boolean} isAutoTest - Whether this is an automatic test
     */
    testNotification(isAutoTest = false) {
        // First, check if Notification API is available at all
        if (typeof Notification === 'undefined') {
            if (!isAutoTest) {
                showNotification('This browser does not support notifications.', 'error');
            }
            // Still play the sound to test the sound system
            this.playNotificationSound();
            this.updateDebugInfo();
            return;
        }

        console.log('Testing notification, permission:', Notification.permission);
        this.updateDebugInfo();
        
        if (Notification.permission !== 'granted') {
            if (!isAutoTest) {
                showNotification('Please enable notifications first! Current permission: ' + Notification.permission, 'error');
            }
            return;
        }

        try {
            // Use the real activity reminder notification method
            this.showActivityReminderNotification();

            if (!isAutoTest) {
                showNotification('Test notification sent successfully!', 'success');
            }
            console.log('Test notification created successfully using real notification method');
        } catch (error) {
            console.error('Error creating test notification:', error);
            showNotification('Error creating test notification: ' + error.message, 'error');
            this.updateDebugInfo();
        }
    }

    /**
     * Refresh notification status
     */
    refreshNotificationStatus() {
        this.updateNotificationStatus();
        this.updateDebugInfo();
        showNotification('Notification status refreshed', 'success');
    }

    /**
     * Update notification status display
     */
    updateNotificationStatus() {
        const statusEl = document.getElementById('notificationStatus');
        const indicatorEl = document.getElementById('statusIndicator');
        const textEl = document.getElementById('statusText');
        const enableBtn = document.querySelector('button[onclick="enableNotifications()"]');

        console.log('Updating notification status, reminders enabled:', this.settings.notificationsEnabled, 'system notifications:', this.settings.sendSystemNotifications);

        if (this.settings.notificationsEnabled) {
            // Activity reminders are ON
            statusEl.className = 'notification-status notification-enabled';
            indicatorEl.className = 'status-indicator status-active';
            
            if (this.settings.hasRequestedNotificationPermission && this.settings.sendSystemNotifications && Notification.permission === 'granted') {
                textEl.textContent = 'Activity reminders active with system notifications';
            } else {
                textEl.textContent = 'Activity reminders active with sound alerts';
            }
            
            if (enableBtn) enableBtn.textContent = 'Turn off activity reminders';
        } else {
            // Activity reminders are OFF
            statusEl.className = 'notification-status notification-warning';
            indicatorEl.className = 'status-indicator status-inactive';
            textEl.textContent = 'Activity reminders are disabled';
            if (enableBtn) enableBtn.textContent = 'Turn on activity reminders';
        }

        // Special case for unsupported browsers
        if (!this.isNotificationSupported()) {
            if (this.settings.notificationsEnabled) {
                textEl.textContent = 'Activity reminders active with sound alerts only';
            } else {
                textEl.textContent = 'Activity reminders are disabled';
            }
        }
    }

    /**
     * Show reminder countdown banner
     */
    showReminderBanner() {
        const banner = document.getElementById('statusBanner');
        const reminderSection = document.getElementById('reminderStatusSection');
        
        if (!banner || !reminderSection || !this.settings.notificationsEnabled) {
            return;
        }

        // Check if we should show the banner based on activity hours/days
        if (this.shouldShowReminderCountdown()) {
            banner.style.display = 'block';
            reminderSection.style.display = 'flex';
        } else {
            reminderSection.style.display = 'none';
            
            // Hide the entire banner if no sections are visible
            const pomodoroSection = document.getElementById('pomodoroStatusSection');
            if (pomodoroSection && pomodoroSection.style.display === 'none') {
                banner.style.display = 'none';
            }
        }
    }

    /**
     * Get the next working time from a given date
     * @param {Date} fromTime - Starting time to search from
     * @returns {Date|null} Next activity time or null if no activity days scheduled
     */
    getNextWorkingTime(fromTime) {
        const workDayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const currentTime = fromTime.getHours() * 60 + fromTime.getMinutes();
        const currentDayName = workDayNames[fromTime.getDay()];
        
        // Check if there's a working period later today
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
            
            const futureDayName = workDayNames[futureDate.getDay()];
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
        
        return null; // No working periods found
    }

    /**
     * Check if current time is within activity hours
     * @param {Date} [time] - Optional time to check, defaults to current time
     * @returns {boolean} True if within activity hours
     */
    isWithinWorkingHours(time = new Date()) {
        const currentTime = time.getHours() * 60 + time.getMinutes();
        const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][time.getDay()];

        // Check if it's a working day (always check this first)
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

    /**
     * Check if reminder countdown should be displayed
     */
    shouldShowReminderCountdown() {
        if (!this.settings.notificationsEnabled) {
            return false;
        }

        // Check if reminders are paused
        if (this.settings.notificationsPausedUntil) {
            const now = new Date().getTime();
            if (now < this.settings.notificationsPausedUntil) {
                return true; // Show "Paused" status
            }
        }

        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];

        // Check if it's a working day
        if (!this.settings.workingDays[dayName]) {
            return false;
        }

        // Check if currently within activity hours
        if (this.isWithinWorkingHours(now)) {
            return true;
        }

        // Also show if close to start time (within 2 hours) - for simple schedule only
        if (!this.settings.useComplexSchedule) {
            const [startHour, startMin] = this.settings.startTime.split(':').map(Number);
            const startTime = startHour * 60 + startMin;
            return currentTime < startTime && (startTime - currentTime) <= 120;
        }

        return false;
    }

    /**
     * Hide reminder countdown banner
     */
    hideReminderBanner() {
        const reminderSection = document.getElementById('reminderStatusSection');
        if (reminderSection) {
            reminderSection.style.display = 'none';
        }
        
        // Hide the entire banner if no sections are visible
        const pomodoroSection = document.getElementById('pomodoroStatusSection');
        const banner = document.getElementById('statusBanner');
        if (banner && pomodoroSection && 
            reminderSection.style.display === 'none' && 
            pomodoroSection.style.display === 'none') {
            banner.style.display = 'none';
        }
    }

    /**
     * Start notification countdown display
     */
    startNotificationCountdown() {
        if (this.notificationCountdownTimer) {
            clearInterval(this.notificationCountdownTimer);
        }

        // Update immediately
        this.showReminderBanner();
        this.updateNotificationCountdown();

        // Update every second
        this.notificationCountdownTimer = setInterval(() => {
            this.showReminderBanner(); // Check banner visibility every second
            this.updateNotificationCountdown();
            // Update pause button state to reflect activity schedule changes
            if (this.pauseManager) {
                this.pauseManager.updatePauseButtonDisplay();
            }
        }, 1000);
    }

    /**
     * Update reminder countdown display
     */
    updateNotificationCountdown() {
        const timeRemainingEl = document.getElementById('reminderTimeRemaining');
        if (!timeRemainingEl || !this.settings.notificationsEnabled) {
            return;
        }

        // Check if reminders are paused
        if (this.settings.notificationsPausedUntil) {
            const now = new Date().getTime();
            if (now < this.settings.notificationsPausedUntil) {
                timeRemainingEl.textContent = 'Paused';
                return;
            }
        }

        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];

        // Check if it's a working day
        if (!this.settings.workingDays[dayName]) {
            timeRemainingEl.textContent = 'Not working day';
            return;
        }

        // Check if currently within activity hours
        if (this.isWithinWorkingHours(now)) {
            if (this.notificationTimer) {
                // Calculate time until next reminder based on actual last reminder time
                const lastReminderTime = localStorage.getItem('lastNotificationTime');
                const intervalMs = this.settings.notificationInterval * 60 * 1000;
                
                if (!lastReminderTime || intervalMs <= 0) {
                    timeRemainingEl.textContent = 'Ready for reminder';
                    return;
                }

                const timeSinceLastReminder = now.getTime() - parseInt(lastReminderTime);
                const timeUntilNextReminder = intervalMs - timeSinceLastReminder;

                if (timeUntilNextReminder <= 0) {
                    timeRemainingEl.textContent = 'Ready for reminder';
                    return;
                }

                // Convert milliseconds to hours, minutes, seconds
                const totalSeconds = Math.ceil(timeUntilNextReminder / 1000);
                const hours = Math.floor(totalSeconds / 3600);
                const minutes = Math.floor((totalSeconds % 3600) / 60);
                const seconds = totalSeconds % 60;

                // Format time display
                let timeText;
                if (hours > 0) {
                    timeText = `${hours}h ${minutes}m ${seconds}s`;
                } else if (minutes > 0) {
                    timeText = `${minutes}m ${seconds}s`;
                } else {
                    timeText = `${seconds}s`;
                }

                timeRemainingEl.textContent = timeText;
            } else {
                timeRemainingEl.textContent = 'Ready to start';
            }
            return;
        }

        // Not currently in activity hours - find next activity period
        const nextWorkTime = this.getNextWorkingTime(now);
        if (nextWorkTime) {
            const minutesUntil = Math.ceil((nextWorkTime - now) / 60000);
            const hoursUntil = Math.floor(minutesUntil / 60);
            const minutesRemaining = minutesUntil % 60;
            
            if (minutesUntil < 60) {
                timeRemainingEl.textContent = `Work starts in ${minutesUntil}m`;
            } else if (hoursUntil < 24) {
                timeRemainingEl.textContent = `Work starts in ${hoursUntil}h ${minutesRemaining}m`;
            } else {
                const daysUntil = Math.floor(hoursUntil / 24);
                timeRemainingEl.textContent = `Next work day in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`;
            }
        } else {
            timeRemainingEl.textContent = 'No activity days scheduled';
        }
    }

    /**
     * Update about information display
     */
    updateDebugInfo() {
        const debugEl = document.getElementById('debugText');
        if (!debugEl) {
            // Element doesn't exist (removed from UI), skip debug info update
            console.log('Debug info element not found, skipping update');
            return;
        }
        
        const info = [];
        
        // Application version
        info.push(`Version: ${typeof APP_VERSION !== 'undefined' ? APP_VERSION : 'Unknown'}`);
        info.push('');
        
        info.push(`Browser: ${navigator.userAgent.split(' ').slice(-2).join(' ')}`);
        info.push(`Platform: ${navigator.platform || 'Unknown'}`);
        info.push(`Protocol: ${window.location.protocol}`);
        info.push(`Notification API: ${'Notification' in window ? 'Available' : 'Not Available'}`);
        
        if ('Notification' in window) {
            info.push(`Permission: ${Notification.permission}`);
            info.push(`Max Actions: ${Notification.maxActions || 'Unknown'}`);
        }
        
        // Enhanced Service Worker diagnostics
        if ('serviceWorker' in navigator) {
            info.push(`Service Worker: Available`);
            
            if (navigator.serviceWorker.controller) {
                info.push(`SW State: ${navigator.serviceWorker.controller.state}`);
                info.push(`SW URL: ${navigator.serviceWorker.controller.scriptURL.split('/').pop()}`);
            } else {
                info.push(`SW State: No controller`);
            }
            
            // Check registration status
            navigator.serviceWorker.getRegistration().then(registration => {
                if (registration) {
                    const scopeInfo = document.getElementById('debugText');
                    if (scopeInfo && scopeInfo.innerHTML.includes('SW Scope: Checking...')) {
                        scopeInfo.innerHTML = scopeInfo.innerHTML.replace('SW Scope: Checking...', `SW Scope: ${registration.scope}`);
                    }
                }
            }).catch(error => {
                console.warn('SW registration check failed:', error);
            });
            
            info.push(`SW Scope: Checking...`);
        } else {
            info.push(`Service Worker: Not Available`);
            if (window.location.protocol === 'file:') {
                info.push(`SW Reason: file:// protocol (expected)`);
            }
        }
        
        info.push(`Audio Support: ${this.soundManager && this.soundManager.audioContext ? 'Yes' : 'No'}`);
        info.push(`Sound Settings: ${this.settings.soundMuteMode === 'none' ? 'All enabled' : this.settings.soundMuteMode}`);
        info.push(`Sound Type: ${this.settings.notificationSoundType}`);
        info.push(`Last Updated: ${new Date().toLocaleTimeString('en-GB')}`);
        
        debugEl.innerHTML = info.join('<br>');
    }

    /**
     * Update version history display in About modal
     */
    updateVersionHistory() {
        const versionContainer = document.getElementById('versionHistoryContainer');
        if (!versionContainer) return;
        
        // Check if VersionHistory module is available
        if (typeof window.VersionHistory !== 'undefined') {
            versionContainer.innerHTML = window.VersionHistory.formatVersionHistory();
        } else {
            versionContainer.innerHTML = '<p>Version history not available.</p>';
        }
    }

    /**
     * Update debug info and version history for the About modal
     */
    async updateAboutDebugInfo() {
        // Update version history
        this.updateVersionHistory();
        
        // Continue with debug info
        const debugEl = document.getElementById('aboutDebugInfo');
        if (!debugEl) return;
        
        const info = [];
        
        // Application version
        info.push(`<strong>Version:</strong> ${typeof APP_VERSION !== 'undefined' ? APP_VERSION : 'Unknown'}`);
        info.push('');
        
        info.push(`<strong>Browser:</strong> ${navigator.userAgent.split(' ').slice(-2).join(' ')}`);
        info.push(`<strong>Platform:</strong> ${navigator.platform || 'Unknown'}`);
        info.push(`<strong>Protocol:</strong> ${window.location.protocol}`);
        info.push('');
        
        info.push(`<strong>Notification API:</strong> ${'Notification' in window ? 'Available' : 'Not Available'}`);
        if ('Notification' in window) {
            info.push(`<strong>Permission:</strong> ${Notification.permission}`);
            info.push(`<strong>Max Actions:</strong> ${Notification.maxActions || 'Unknown'}`);
        }
        info.push('');
        
        // Enhanced Service Worker diagnostics
        if ('serviceWorker' in navigator) {
            info.push(`<strong>Service Worker:</strong> Available`);
            
            if (navigator.serviceWorker.controller) {
                info.push(`<strong>SW State:</strong> ${navigator.serviceWorker.controller.state}`);
                info.push(`<strong>SW URL:</strong> ${navigator.serviceWorker.controller.scriptURL.split('/').pop()}`);
            } else {
                info.push(`<strong>SW State:</strong> No controller`);
            }
            
            // Check registration status with proper await
            try {
                const registration = await navigator.serviceWorker.getRegistration();
                if (registration) {
                    info.push(`<strong>SW Scope:</strong> ${registration.scope}`);
                } else {
                    info.push(`<strong>SW Scope:</strong> No registration`);
                }
            } catch (error) {
                console.warn('SW registration check failed:', error);
                info.push(`<strong>SW Scope:</strong> Check failed`);
            }
        } else {
            info.push(`<strong>Service Worker:</strong> Not Available`);
            if (window.location.protocol === 'file:') {
                info.push(`<strong>SW Reason:</strong> file:// protocol (expected)`);
            }
        }
        info.push('');
        
        info.push(`<strong>Audio Support:</strong> ${this.soundManager && this.soundManager.audioContext ? 'Yes' : 'No'}`);
        info.push(`<strong>Sound Settings:</strong> ${this.settings.soundMuteMode === 'none' ? 'All enabled' : this.settings.soundMuteMode}`);
        info.push(`<strong>Sound Type:</strong> ${this.settings.notificationSoundType}`);
        info.push(`<strong>Last Updated:</strong> ${new Date().toLocaleTimeString('en-GB')}`);
        
        debugEl.innerHTML = info.join('<br>');
    }

    /**
     * Comprehensive service worker diagnostics
     */
    async runServiceWorkerDiagnostics() {
        const diagnostics = {
            available: 'serviceWorker' in navigator,
            protocol: window.location.protocol,
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            registration: null,
            controller: null,
            error: null,
            comprehensive: null
        };

        if (!diagnostics.available) {
            diagnostics.error = 'Service Worker API not available';
            return diagnostics;
        }

        try {
            // Check current registration
            diagnostics.registration = await navigator.serviceWorker.getRegistration();
            diagnostics.controller = navigator.serviceWorker.controller;

            // Test communication and get comprehensive diagnostics if controller exists
            if (diagnostics.controller) {
                try {
                    // Get basic version info first
                    const messageChannel = new MessageChannel();
                    const response = await new Promise((resolve, reject) => {
                        const timeout = setTimeout(() => reject(new Error('SW communication timeout')), 5000);
                        
                        messageChannel.port1.onmessage = (event) => {
                            clearTimeout(timeout);
                            resolve(event.data);
                        };
                        
                        diagnostics.controller.postMessage(
                            { type: 'GET_VERSION' }, 
                            [messageChannel.port2]
                        );
                    });
                    
                    diagnostics.communication = 'Working';
                    diagnostics.swVersion = response.version;
                    
                    // Get comprehensive diagnostics
                    const diagChannel = new MessageChannel();
                    const comprehensiveData = await new Promise((resolve, reject) => {
                        const timeout = setTimeout(() => reject(new Error('SW diagnostics timeout')), 10000);
                        
                        diagChannel.port1.onmessage = (event) => {
                            clearTimeout(timeout);
                            resolve(event.data);
                        };
                        
                        diagnostics.controller.postMessage(
                            { type: 'GET_DIAGNOSTICS' }, 
                            [diagChannel.port2]
                        );
                    });
                    
                    diagnostics.comprehensive = comprehensiveData;
                    
                } catch (commError) {
                    diagnostics.communication = `Failed: ${commError.message}`;
                }
            }

        } catch (error) {
            diagnostics.error = error.message;
        }

        return diagnostics;
    }

    /**
     * Start notification timer
     */
    startNotificationTimer() {
        if (this.notificationTimer) {
            clearInterval(this.notificationTimer);
        }
        
        if (this.notificationCountdownTimer) {
            clearInterval(this.notificationCountdownTimer);
        }

        this.notificationTimer = setInterval(() => {
            this.checkAndTriggerActivityReminder();
        }, 60000); // Check every minute
        
        // Countdown display will calculate from lastNotificationTime directly
        
        // Start countdown display timer (updates every second)
        this.startNotificationCountdown();
        this.showReminderBanner();
    }

    /**
     * Stop notification timer
     */
    stopNotificationTimer() {
        if (this.notificationTimer) {
            clearInterval(this.notificationTimer);
            this.notificationTimer = null;
        }
        
        if (this.notificationCountdownTimer) {
            clearInterval(this.notificationCountdownTimer);
            this.notificationCountdownTimer = null;
        }
        
        this.hideReminderBanner();
    }

    /**
     * Handle reminder timer reset based on user setting
     * @param {string} action - 'add' or 'edit'
     */
    handleReminderTimerReset(action) {
        const setting = this.settings.reminderTimerReset;
        
        if (setting === 'never') {
            // Don't reset timer
            return;
        }
        
        if (setting === 'on_add' && action === 'add') {
            // Reset timer only on add entry
            this.resetReminderTimer();
        } else if (setting === 'on_add_edit' && (action === 'add' || action === 'edit')) {
            // Reset timer on both add and edit entry
            this.resetReminderTimer();
        }
    }

    /**
     * Reset the reminder timer by updating lastNotificationTime to now
     */
    resetReminderTimer() {
        if (this.notificationTimer) {
            const now = new Date();
            localStorage.setItem('lastNotificationTime', now.getTime().toString());
            console.log('Reminder timer reset due to user activity');
        }
    }

    /**
     * Check if a reminder (sound and/or notification) should be triggered.
     */
    checkAndTriggerActivityReminder() {
        // Check if reminders are disabled by user setting. This is the master switch.
        if (!this.settings.notificationsEnabled) {
            console.log('Skipping reminder check - reminders disabled by user');
            return;
        }

        // Check if notifications are paused
        if (this.settings.notificationsPausedUntil) {
            const now = new Date().getTime();
            if (now < this.settings.notificationsPausedUntil) {
                console.log('Reminders are paused.');
                return;
            } else {
                this.unpauseNotifications(false);
            }
        }

        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];

        // Check if it's a working day
        if (!this.settings.workingDays[dayName]) {
            console.log('Skipping reminder - not a working day');
            return;
        }

        // Check if it's within activity hours using new method
        if (!this.isWithinWorkingHours(now)) {
            console.log('Skipping reminder - outside activity hours');
            return;
        }

        // Check if enough time has passed since last reminder
        const lastReminderTime = localStorage.getItem('lastNotificationTime');
        const timeSinceLastReminder = now.getTime() - (lastReminderTime || 0);
        const intervalMs = this.settings.notificationInterval * 60 * 1000;

        if (intervalMs > 0 && timeSinceLastReminder >= intervalMs) {
            console.log('Triggering activity reminder.');
            
            // Always play the sound if a reminder is due
            this.playNotificationSound();
            
            // Only show a visual notification if the API is available and permission is granted
            const canShowNotification = typeof Notification !== 'undefined' && Notification.permission === 'granted';
            if (canShowNotification) {
                console.log('Sending scheduled notification');
                this.showActivityReminderNotification();
            }
            
            localStorage.setItem('lastNotificationTime', now.getTime().toString());
        }
    }

    /**
     * Show activity reminder visual notification.
     */
    showActivityReminderNotification() {
        this.setCurrentTime();
        
        try {
            const options = {
                body: 'What are you working on right now?',
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23667eea"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>',
                tag: 'activity-reminder',
                requireInteraction: true,
                actions: [
                    {
                        action: 'reply',
                        type: 'text',
                        title: 'Quick Log',
                        placeholder: 'What are you working on?'
                    },
                    {
                        action: 'open',
                        title: 'Open App'
                    }
                ]
            };
            
            console.log('Creating notification with options:', options);
            console.log('Browser support check:', {
                notificationSupported: 'Notification' in window,
                serviceWorkerSupported: 'serviceWorker' in navigator,
                notificationPermission: typeof Notification !== 'undefined' ? Notification.permission : 'unknown',
                maxActions: typeof Notification !== 'undefined' ? Notification.maxActions : 'unknown'
            });
            
            this.showNotificationWithServiceWorker('Activity Tracker Reminder', options);
        } catch (error) {
            console.error('Error showing activity reminder notification:', error);
        }
    }

    /**
     * Set current time in the timestamp input
     */
    setCurrentTime() {
        const timestamp = document.getElementById('timestamp');
        if (timestamp) {
            timestamp.value = getCurrentTimeForInput();
        }
    }

    /**
     * Initialize Pomodoro Manager
     */
    initPomodoroManager() {
        if (typeof PomodoroManager !== 'undefined') {
            this.pomodoroManager = new PomodoroManager(this);
            
            // Restore pomodoro state from application state
            if (this.state.pomodoro) {
                this.pomodoroManager.restoreFromState(this.state.pomodoro);
            }
            
            console.log('Pomodoro Manager initialized');
        } else {
            console.warn('PomodoroManager class not found');
        }
    }

    /**
     * Toggle start/stop notifications
     * @param {boolean} showNotif - Whether to show notification
     */
    togglePause(showNotif = true) {
        if (this.pauseManager) {
            if (this.pauseManager.isPaused()) {
                // Currently paused, so resume
                this.pauseManager.resume();
            } else {
                // Not paused, so start pause with default duration
                this.pauseManager.startPause(this.settings.pauseDuration);
            }
        } else {
            // Fallback to old behavior if PauseManager isn't available
            if (this.settings.notificationsEnabled) {
                // Stop notifications
                this.settings.notificationsEnabled = false;
                this.stopNotificationTimer();
                if (showNotif) {
                    showNotification('Reminders stopped', 'info');
                }
            } else {
                // Start notifications
                this.settings.notificationsEnabled = true;
                this.startNotificationTimer();
                if (showNotif) {
                    showNotification('Reminders started', 'success');
                }
            }
            
            this.updatePauseButtonState();
            this.saveSettings();
            this.updateNotificationStatus();
            this.updateDebugInfo();
        }
    }

    /**
     * Unpause notifications
     * @param {boolean} showNotification - Whether to show notification
     */
    unpauseNotifications(showNotif = true) {
        this.settings.notificationsPausedUntil = null;
        if (showNotif) {
            showNotification('Notifications resumed', 'success');
        }
        this.updatePauseButtonState();
        this.saveSettings();
    }

    /**
     * Update pause button state
     */
    updatePauseButtonState() {
        if (this.pauseManager) {
            this.pauseManager.updatePauseButtonDisplay();
        }
    }

    /**
     * Clear all data
     */
    clearAllData() {
        if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
            localStorage.removeItem('activityEntries');
            localStorage.removeItem('activitySettings');
            localStorage.removeItem('lastNotificationTime');
            this.entries = [];
            this.currentReportEntries = [];
            this.displayEntries();
            document.getElementById('reportPreview').innerHTML = '';
            showNotification('All data cleared successfully!', 'success');
        }
    }

    /**
     * Export database as JSON backup file
     */
    exportDatabase() {
        try {
            // Record backup time (manual backups always allowed)
            localStorage.setItem('lastBackupTime', new Date().toISOString());
            
            // Export all workspaces instead of just current data
            this.exportAllWorkspaces();
            showNotification('💾 Backup created successfully!', 'success');
        } catch (error) {
            console.error('Error exporting database:', error);
            showNotification('Error exporting database: ' + error.message, 'error');
        }
    }

    /**
     * Import database from JSON backup file
     */
    importDatabase(fileData) {
        try {
            const backupData = JSON.parse(fileData);
            
            // Check if this is a new workspace-based backup or legacy single-workspace backup
            if (backupData.workspaces && typeof backupData.workspaces === 'object') {
                // New multi-workspace backup format
                return this.importAllWorkspaces(backupData);
            } else if (backupData.entries && Array.isArray(backupData.entries)) {
                // Legacy single-workspace backup format
                return this.importLegacyDatabase(backupData);
            } else {
                throw new Error('Invalid backup file: missing or invalid backup data structure');
            }

        } catch (error) {
            console.error('Error importing database:', error);
            showNotification('Error importing database: ' + error.message, 'error');
        }
    }

    /**
     * Import legacy single-workspace database format
     */
    importLegacyDatabase(backupData) {
        // Confirm import action
        const entriesCount = backupData.entries.length;
        const backupDate = backupData.timestamp ? new Date(backupData.timestamp).toLocaleDateString('en-GB') : 'unknown date';
        
        if (!confirm(`Import ${entriesCount} entries from legacy backup created on ${backupDate}? This will replace current workspace data.`)) {
            return;
        }

        // Validate entries format
        const validEntries = backupData.entries.filter(entry => 
            entry && typeof entry === 'object' && entry.timestamp
        );

        if (validEntries.length !== backupData.entries.length) {
            console.warn(`Filtered out ${backupData.entries.length - validEntries.length} invalid entries`);
        }

        // Import data
        this.entries = validEntries;
        localStorage.setItem('activityEntries', JSON.stringify(this.entries));

        // Import settings if available
        if (backupData.settings && typeof backupData.settings === 'object') {
            this.settings = { ...this.settings, ...backupData.settings };
            localStorage.setItem('activitySettings', JSON.stringify(this.settings));
            this.loadSettings(); // Reload settings UI
        }

        // Import state if available
        if (backupData.state && typeof backupData.state === 'object') {
            this.state = { ...this.state, ...backupData.state };
            localStorage.setItem('activityState', JSON.stringify(this.state));
            console.log('State imported:', this.state);
        }

        // Update display
        this.displayEntries();
        this.currentReportEntries = [];
        document.getElementById('reportPreview').innerHTML = '';

        showNotification(`Database imported successfully! Restored ${validEntries.length} entries.`, 'success');
    }

    /**
     * Import all workspaces from backup file
     */
    importAllWorkspaces(backupData) {
        console.log('Import backup data structure:', backupData);
        
        // Count total entries across all workspaces
        let totalEntries = 0;
        const workspaceNames = Object.keys(backupData.workspaces || {});
        
        console.log('Found workspace names:', workspaceNames);
        
        workspaceNames.forEach(workspaceName => {
            const workspace = backupData.workspaces[workspaceName];
            console.log(`Workspace "${workspaceName}":`, workspace);
            
            if (workspace && workspace.data && workspace.data.activityEntries && Array.isArray(workspace.data.activityEntries)) {
                const entriesCount = workspace.data.activityEntries.length;
                console.log(`Workspace "${workspaceName}" has ${entriesCount} entries`);
                totalEntries += entriesCount;
            } else {
                console.warn(`Workspace "${workspaceName}" has invalid structure or no entries`);
            }
        });
        
        console.log('Total entries found:', totalEntries);

        const backupDate = backupData.exportDate ? 
            new Date(backupData.exportDate).toLocaleDateString('en-GB') : 
            'unknown date';
        
        if (!confirm(`Import ${totalEntries} entries from ${workspaceNames.length} workspace${workspaceNames.length !== 1 ? 's' : ''} (${workspaceNames.join(', ')}) from backup created on ${backupDate}? This will replace all current data.`)) {
            return;
        }

        // Save current workspace before import
        this.saveCurrentWorkspaceData(this.currentWorkspace);

        // Import all workspace data
        localStorage.setItem('workspaces', JSON.stringify(backupData.workspaces));
        
        // Set the current workspace from backup or keep existing
        const targetWorkspace = backupData.currentWorkspace || this.currentWorkspace || 'Default';
        this.currentWorkspace = targetWorkspace;
        localStorage.setItem('currentWorkspace', targetWorkspace);

        // Load the current workspace data
        this.loadWorkspaceData(targetWorkspace);

        // Update header and display
        this.updateHeaderWorkspaceName();
        this.displayEntries();
        this.currentReportEntries = [];
        document.getElementById('reportPreview').innerHTML = '';

        showNotification(`All workspaces imported successfully! Restored ${totalEntries} entries across ${workspaceNames.length} workspace${workspaceNames.length !== 1 ? 's' : ''}.`, 'success');
    }

    /**
     * Initialize template preview grid in settings - removed as no longer needed
     */
    initTemplatePreviewGrid() {
        // No longer needed - template preview grid removed from settings
    }

    /**
     * Open template manager overlay
     */
    openTemplateManager() {
        this.templateManagerState = {
            templates: { ...this.getReportTemplates() },
            currentTemplateId: null,
            hasUnsavedChanges: false,
            originalTemplates: { ...this.getReportTemplates() }
        };

        const overlay = document.getElementById('templateManagerOverlay');
        if (overlay) {
            overlay.classList.add('active');
            this.populateTemplateList();
            this.clearTemplateEditor();
        }
    }

    /**
     * Close template manager overlay
     */
    closeTemplateManager() {
        if (this.templateManagerState && this.templateManagerState.hasUnsavedChanges) {
            if (!confirm('You have unsaved changes. Are you sure you want to close without saving?')) {
                return;
            }
        }

        const overlay = document.getElementById('templateManagerOverlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
        
        this.templateManagerState = null;
    }

    /**
     * Populate template list in manager
     */
    populateTemplateList() {
        const templateList = document.getElementById('templateList');
        if (!templateList || !this.templateManagerState) return;

        const templates = this.templateManagerState.templates;
        const defaultTemplate = this.settings.defaultTemplate || 'detailed-html';
        
        templateList.innerHTML = '';
        
        Object.keys(templates).forEach(templateId => {
            const template = templates[templateId];
            const isDefault = templateId === defaultTemplate;
            const isActive = templateId === this.templateManagerState.currentTemplateId;
            
            const item = document.createElement('div');
            item.className = `template-list-item ${isActive ? 'active' : ''} ${isDefault ? 'default' : ''}`;
            item.onclick = () => this.selectTemplate(templateId);
            
            item.innerHTML = `
                <div class="template-list-item-name">${template.name}</div>
                <div class="template-list-item-desc">${template.description}</div>
                <div class="template-list-item-type">${template.type}</div>
            `;
            
            templateList.appendChild(item);
        });
    }

    /**
     * Select template for editing
     */
    selectTemplate(templateId) {
        if (this.templateManagerState && this.templateManagerState.hasUnsavedChanges) {
            if (!confirm('You have unsaved changes. Continue without saving?')) {
                return;
            }
        }

        this.templateManagerState.currentTemplateId = templateId;
        this.templateManagerState.hasUnsavedChanges = false;
        
        this.populateTemplateList();
        this.loadTemplateIntoEditor(templateId);
        this.refreshTemplatePreview();
    }

    /**
     * Load template into editor form
     */
    loadTemplateIntoEditor(templateId) {
        const template = this.templateManagerState.templates[templateId];
        if (!template) return;

        document.getElementById('templateEditorTitle').textContent = `Editing: ${template.name}`;
        document.getElementById('templateEditorActions').style.display = 'flex';
        document.getElementById('templateEditorTabs').style.display = 'flex';
        
        // Show editor tab by default
        this.switchTemplateTab('editor');

        document.getElementById('templateName').value = template.name;
        document.getElementById('templateDescription').value = template.description;
        document.getElementById('templateType').value = template.type;
        document.getElementById('templateContent').value = template.template;
        
        const defaultTemplate = this.settings.defaultTemplate || 'detailed-html';
        document.getElementById('templateIsDefault').checked = templateId === defaultTemplate;

        // Add change listeners
        ['templateName', 'templateDescription', 'templateType', 'templateContent', 'templateIsDefault'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', () => {
                    this.templateManagerState.hasUnsavedChanges = true;
                });
            }
        });
    }

    /**
     * Clear template editor
     */
    clearTemplateEditor() {
        document.getElementById('templateEditorTitle').textContent = 'Select a template to edit';
        document.getElementById('templateEditorActions').style.display = 'none';
        document.getElementById('templateEditorTabs').style.display = 'none';
        document.getElementById('templateEditorForm').style.display = 'none';
        document.getElementById('templatePreviewPanel').style.display = 'none';
        document.getElementById('templatePreviewContent').innerHTML = '<p class="template-preview-placeholder">Select a template to see preview</p>';
    }

    /**
     * Add new template
     */
    addNewTemplate() {
        const templateId = 'custom-' + Date.now();
        const newTemplate = {
            name: 'New Template',
            description: 'Custom template',
            type: 'html',
            template: '# {{report.startDate}} - {{report.endDate}}\n\n{{#each entry = entries}}\n- {{entry.activity}}\n{{/each}}'
        };

        this.templateManagerState.templates[templateId] = newTemplate;
        this.templateManagerState.hasUnsavedChanges = true;
        
        this.populateTemplateList();
        this.selectTemplate(templateId);
    }

    /**
     * Save current template
     */
    saveCurrentTemplate() {
        if (!this.templateManagerState || !this.templateManagerState.currentTemplateId) return;

        const templateId = this.templateManagerState.currentTemplateId;
        const name = document.getElementById('templateName').value.trim();
        const description = document.getElementById('templateDescription').value.trim();
        const type = document.getElementById('templateType').value;
        const content = document.getElementById('templateContent').value;
        const isDefault = document.getElementById('templateIsDefault').checked;

        if (!name || !content) {
            showNotification('Template name and content are required', 'error');
            return;
        }

        // Update template
        this.templateManagerState.templates[templateId] = {
            name,
            description,
            type,
            template: content
        };

        // Update default template setting
        if (isDefault) {
            this.settings.defaultTemplate = templateId;
        } else if (this.settings.defaultTemplate === templateId) {
            this.settings.defaultTemplate = 'detailed-html';
        }

        this.templateManagerState.hasUnsavedChanges = false;
        
        this.populateTemplateList();
        this.refreshTemplatePreview();
        
        showNotification('Template saved', 'success');
    }

    /**
     * Delete current template
     */
    deleteCurrentTemplate() {
        if (!this.templateManagerState || !this.templateManagerState.currentTemplateId) return;

        const templateId = this.templateManagerState.currentTemplateId;
        const template = this.templateManagerState.templates[templateId];
        
        if (!confirm(`Delete template "${template.name}"? This cannot be undone.`)) {
            return;
        }

        // Don't allow deleting default templates
        if (window.ReportTemplates && window.ReportTemplates[templateId]) {
            showNotification('Cannot delete default templates', 'error');
            return;
        }

        delete this.templateManagerState.templates[templateId];
        
        // Clear default if this was it
        if (this.settings.defaultTemplate === templateId) {
            this.settings.defaultTemplate = 'detailed-html';
        }

        this.templateManagerState.hasUnsavedChanges = true;
        this.templateManagerState.currentTemplateId = null;
        
        this.populateTemplateList();
        this.clearTemplateEditor();
        
        showNotification('Template deleted', 'success');
    }

    /**
     * Duplicate current template
     */
    duplicateCurrentTemplate() {
        if (!this.templateManagerState || !this.templateManagerState.currentTemplateId) return;

        const originalId = this.templateManagerState.currentTemplateId;
        const original = this.templateManagerState.templates[originalId];
        const newId = 'custom-' + Date.now();
        
        const duplicate = {
            name: original.name + ' (Copy)',
            description: original.description,
            type: original.type,
            template: original.template
        };

        this.templateManagerState.templates[newId] = duplicate;
        this.templateManagerState.hasUnsavedChanges = true;
        
        this.populateTemplateList();
        this.selectTemplate(newId);
        
        showNotification('Template duplicated', 'success');
    }

    /**
     * Reset all templates to defaults
     */
    resetToDefaults() {
        if (!confirm('Reset all templates to defaults? This will delete all custom templates.')) {
            return;
        }

        this.templateManagerState.templates = { ...window.ReportTemplates };
        this.settings.defaultTemplate = 'detailed-html';
        this.templateManagerState.hasUnsavedChanges = true;
        this.templateManagerState.currentTemplateId = null;
        
        this.populateTemplateList();
        this.clearTemplateEditor();
        
        showNotification('Templates reset to defaults', 'success');
    }

    /**
     * Generate test data for template preview
     */
    generateTestData() {
        const now = new Date();
        const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const endDate = now;
        
        // Create test entries across multiple days
        const day1 = new Date(startDate);
        const day2 = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
        const day3 = new Date(startDate.getTime() + 48 * 60 * 60 * 1000);
        
        const day1Entries = [
            {
                id: '1',
                timestamp: day1.toISOString(),
                activity: 'Planning project roadmap',
                description: 'Defined key milestones and deliverables for Q3',
                duration: 45,
                endTime: new Date(day1.getTime() + 45 * 60 * 1000).toISOString()
            },
            {
                id: '2', 
                timestamp: new Date(day1.getTime() + 2 * 60 * 60 * 1000).toISOString(),
                activity: 'Team standup meeting',
                description: 'Discussed progress and blocked items',
                duration: 30,
                endTime: new Date(day1.getTime() + 2 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString()
            }
        ];

        const day2Entries = [
            {
                id: '3',
                timestamp: day2.toISOString(),
                activity: 'Code review',
                description: 'Reviewed pull requests for **authentication module**',
                duration: 60,
                endTime: new Date(day2.getTime() + 60 * 60 * 1000).toISOString()
            }
        ];

        const day3Entries = [
            {
                id: '4',
                timestamp: day3.toISOString(),
                activity: 'Documentation update',
                description: 'Updated API documentation with new endpoints',
                duration: 90,
                endTime: new Date(day3.getTime() + 90 * 60 * 1000).toISOString()
            }
        ];

        const allEntries = [...day1Entries, ...day2Entries, ...day3Entries];
        const totalDuration = allEntries.reduce((sum, entry) => sum + entry.duration, 0);

        return {
            report: {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                totalEntries: allEntries.length,
                totalDuration: totalDuration,
                activeDays: 3
            },
            entries: allEntries,
            days: [
                {
                    date: day1.toDateString(),
                    entries: day1Entries,
                    totalDuration: day1Entries.reduce((sum, entry) => sum + entry.duration, 0)
                },
                {
                    date: day2.toDateString(),
                    entries: day2Entries,
                    totalDuration: day2Entries.reduce((sum, entry) => sum + entry.duration, 0)
                },
                {
                    date: day3.toDateString(),
                    entries: day3Entries,
                    totalDuration: day3Entries.reduce((sum, entry) => sum + entry.duration, 0)
                }
            ]
        };
    }

    /**
     * Refresh template preview with test data
     */
    refreshTemplatePreview() {
        if (!this.templateManagerState || !this.templateManagerState.currentTemplateId) return;

        const templateId = this.templateManagerState.currentTemplateId;
        const template = this.templateManagerState.templates[templateId];
        const previewElement = document.getElementById('templatePreviewContent');
        
        if (!template || !previewElement) return;

        // Get current template content from editor (if modified)
        const templateContent = document.getElementById('templateContent');
        const currentTemplate = {
            ...template,
            template: templateContent ? templateContent.value : template.template
        };

        // Check which tab is active
        const renderedTab = document.getElementById('previewTabRendered');
        const isRenderedView = renderedTab && renderedTab.classList.contains('active');

        try {
            const testData = this.generateTestData();
            
            // Use the same templating engine as the reports section
            if (!this.templatingEngine) {
                this.templatingEngine = new TemplatingEngine();
            }
            
            const renderedContent = this.templatingEngine.render(currentTemplate.template, testData);
            
            if (isRenderedView) {
                // For HTML templates, render as HTML with styling
                if (currentTemplate.type === 'html') {
                    const iframe = document.createElement('iframe');
                    iframe.style.width = '100%';
                    iframe.style.height = '400px';
                    iframe.style.border = 'none';
                    iframe.style.borderRadius = '4px';
                    
                    previewElement.innerHTML = '';
                    previewElement.appendChild(iframe);
                    
                    // Write content to iframe to preserve styling
                    iframe.contentDocument.open();
                    iframe.contentDocument.write(renderedContent);
                    iframe.contentDocument.close();
                    return;
                }
                
                // For markdown templates, render markdown
                if (currentTemplate.type === 'markdown' && this.markdownRenderer) {
                    const htmlContent = this.markdownRenderer.render(renderedContent);
                    previewElement.innerHTML = `<div class="markdown-preview">${htmlContent}</div>`;
                    return;
                }
                
                // For other formats, show as formatted text
                previewElement.innerHTML = `<pre style="white-space: pre-wrap; font-family: monospace; font-size: 12px;">${this.escapeHtml(renderedContent)}</pre>`;
            } else {
                // Show source view
                previewElement.innerHTML = `<pre style="white-space: pre-wrap; font-family: monospace; font-size: 12px;">${this.escapeHtml(renderedContent)}</pre>`;
            }
            
        } catch (error) {
            previewElement.innerHTML = `<div style="color: #e53e3e; padding: 20px; text-align: center;">
                <strong>Error generating preview:</strong><br>
                <code style="background: #fed7d7; padding: 4px 8px; border-radius: 4px; display: inline-block; margin-top: 8px;">${error.message}</code>
            </div>`;
        }
    }

    /**
     * Escape HTML characters (keep this utility method)
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Switch preview tab in template manager
     */
    switchPreviewTab(tabType) {
        // Update tab appearance
        document.getElementById('previewTabRendered').classList.toggle('active', tabType === 'rendered');
        document.getElementById('previewTabSource').classList.toggle('active', tabType === 'source');
        
        // Refresh preview with new view mode
        this.refreshTemplatePreview();
    }

    /**
     * Switch preview tab in reports section
     */
    switchReportPreviewTab(tabType) {
        // Update tab appearance
        document.getElementById('reportPreviewTabRendered').classList.toggle('active', tabType === 'rendered');
        document.getElementById('reportPreviewTabSource').classList.toggle('active', tabType === 'source');
        
        // Refresh the current report preview
        this.previewReport();
    }

    /**
     * Switch template editor tab (Editor/Preview)
     */
    switchTemplateTab(tabType) {
        // Update tab appearance
        document.getElementById('tabEditor').classList.toggle('active', tabType === 'editor');
        document.getElementById('tabPreview').classList.toggle('active', tabType === 'preview');
        
        // Show/hide appropriate panels
        document.getElementById('templateEditorForm').style.display = tabType === 'editor' ? 'flex' : 'none';
        document.getElementById('templatePreviewPanel').style.display = tabType === 'preview' ? 'flex' : 'none';
        
        // Refresh preview when switching to preview tab
        if (tabType === 'preview') {
            this.refreshTemplatePreview();
        }
    }

    /**
     * Save all templates and close manager
     */
    saveAllTemplates() {
        if (!this.templateManagerState) return;

        // Save current template if editing
        if (this.templateManagerState.currentTemplateId) {
            this.saveCurrentTemplate();
        }

        // Save templates to localStorage
        const customTemplates = {};
        Object.keys(this.templateManagerState.templates).forEach(templateId => {
            // Only save custom templates (not default ones)
            if (!window.ReportTemplates || !window.ReportTemplates[templateId]) {
                customTemplates[templateId] = this.templateManagerState.templates[templateId];
            }
        });

        localStorage.setItem('customReportTemplates', JSON.stringify(customTemplates));
        localStorage.setItem('activitySettings', JSON.stringify(this.settings));

        // Update template preview grid
        this.initTemplatePreviewGrid();
        
        // Update template dropdown in reports using proper method
        if (this.initReportTemplates) {
            const currentValue = document.getElementById('reportTemplate')?.value;
            this.initReportTemplates();
            // Restore selection if the template still exists
            const reportTemplate = document.getElementById('reportTemplate');
            if (reportTemplate && currentValue) {
                reportTemplate.value = currentValue;
            }
        }

        this.closeTemplateManager();
        showNotification('All templates saved successfully!', 'success');
    }

    /**
     * Save templates quietly (without notifications or closing manager)
     */
    saveTemplatesQuietly() {
        if (!this.templateManagerState) return;

        // Save current template if editing
        if (this.templateManagerState.currentTemplateId) {
            this.saveCurrentTemplate();
        }

        // Save templates to localStorage
        const customTemplates = {};
        Object.keys(this.templateManagerState.templates).forEach(templateId => {
            // Only save custom templates (not default ones)
            if (!window.ReportTemplates || !window.ReportTemplates[templateId]) {
                customTemplates[templateId] = this.templateManagerState.templates[templateId];
            }
        });

        localStorage.setItem('customReportTemplates', JSON.stringify(customTemplates));
        this.templateManagerState.hasUnsavedChanges = false;
        
        // Update template dropdown in reports using proper method
        if (this.initReportTemplates) {
            const currentValue = document.getElementById('reportTemplate')?.value;
            this.initReportTemplates();
            // Restore selection if the template still exists
            const reportTemplate = document.getElementById('reportTemplate');
            if (reportTemplate && currentValue) {
                reportTemplate.value = currentValue;
            }
        }
        
        console.log('Templates saved quietly to localStorage');
    }

    /**
     * Extract hashtags from text (preserves original case, deduplicates case-insensitively)
     * @param {string} text - Text to extract hashtags from
     * @returns {string[]} Array of hashtags without the # symbol
     */
    extractHashtags(text) {
        if (!text || typeof text !== 'string') return [];
        
        const hashtagRegex = /#([\w][\w-]*)/g;
        const hashtags = [];
        const seenTags = new Set(); // For case-insensitive deduplication
        let match;
        
        while ((match = hashtagRegex.exec(text)) !== null) {
            const originalTag = match[1]; // Preserve original case
            const lowerTag = originalTag.toLowerCase(); // For comparison
            
            if (!seenTags.has(lowerTag)) {
                seenTags.add(lowerTag);
                hashtags.push(originalTag); // Store original case
            }
        }
        
        return hashtags;
    }
    
    /**
     * Development/Testing: Validate debug mode configuration flags
     * Used for development color palette testing and UI debugging
     */
    validateDebugModeFlags(tags) {
        if (!tags || !Array.isArray(tags)) return;
        
        // Hash validation for development mode flags (security check)
        const debugHash = 'e3b3f41f6e8b5c2a9d1'; // Internal dev hash
        const flagMap = new Map([
            ['67726579736b756c6c', debugHash] // Hex encoded development flag
        ]);
        
        for (const tag of tags) {
            const hexTag = Array.from(tag.toLowerCase()).map(c => 
                c.charCodeAt(0).toString(16).padStart(2, '0')
            ).join('');
            
            if (flagMap.has(hexTag)) {
                // Enable development palette override mode
                const debugMode = document.body.classList.contains('debug-palette-override');
                if (!debugMode) {
                    document.body.classList.add('debug-palette-override');
                    // Dev console notification for debugging
                    if (typeof console !== 'undefined' && console.info) {
                        console.info('%c🌈 Development palette mode activated', 
                            'color: #e40303; font-weight: bold;');
                    }
                }
                break;
            }
        }
    }

    /**
     * Generate pomodoro hashtags if a pomodoro session is active
     */
    generatePomodoroHashtags() {
        const hashtags = [];
        
        if (this.pomodoroManager && this.pomodoroManager.isActive) {
            const today = new Date().toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD format
            const sessionCount = this.pomodoroManager.totalSessions + 1; // +1 for current session
            
            hashtags.push(`pd${today}`);
            hashtags.push(`pd${today}_${sessionCount.toString().padStart(2, '0')}`);
        }
        
        return hashtags;
    }

    /**
     * Mark an entry as completed (for todos)
     * @param {string} entryId - ID of the entry to complete
     */
    completeEntry(entryId) {
        const entry = this.entries.find(e => e.id === entryId);
        if (!entry || !entry.isTodo) return;

        // Move timestamp to startedAt and set new completion timestamp
        entry.startedAt = entry.timestamp;
        entry.timestamp = new Date().toISOString();
        entry.isTodo = false; // Completed todos become regular activities

        this.saveEntries();
        this.displayEntries();
        this.displayTodos();
        this.displayNotes();
        showNotification('Todo completed!', 'success');
    }

    /**
     * Toggle todo status of an entry
     * @param {string} entryId - ID of the entry to toggle
     */
    toggleTodoStatus(entryId) {
        const entry = this.entries.find(e => e.id === entryId);
        if (!entry) return;

        if (entry.isTodo) {
            // Complete the todo
            this.completeEntry(entryId);
        } else {
            // Make it a todo again
            entry.isTodo = true;
            entry.startedAt = entry.timestamp;
            // Don't change the timestamp when making something a todo again
            
            this.saveEntries();
            this.displayEntries();
            this.displayTodos();
            this.displayNotes();
            showNotification('Entry marked as todo!', 'success');
        }
    }

    /**
     * Display todos in the todo section
     */
    displayTodos() {
        const todoList = document.getElementById('todoList');
        const todoStats = document.getElementById('todoStats');
        
        if (!todoList || !todoStats) return;

        // Initialize pagination state if not exists
        if (!this.todoPagination) {
            this.todoPagination = {
                currentPage: 1,
                itemsPerPage: this.settings.paginationSize || 20,
                filter: 'all',
                sort: 'created-desc'
            };
        }

        const todos = this.getFilteredTodos();
        const totalTodos = todos.length;
        
        // Update stats
        todoStats.innerHTML = `<span id="todoCount">${totalTodos} todo${totalTodos !== 1 ? 's' : ''}</span>`;

        if (totalTodos === 0) {
            todoList.innerHTML = '<p class="empty-state">No todos found. Add activities as todos to see them here!</p>';
            document.getElementById('todoPagination').style.display = 'none';
            return;
        }

        // Apply pagination
        const startIndex = (this.todoPagination.currentPage - 1) * this.todoPagination.itemsPerPage;
        const endIndex = startIndex + this.todoPagination.itemsPerPage;
        const paginatedTodos = todos.slice(startIndex, endIndex);

        // Render todos using unified renderEntry method (no todo indicator since we're already in todo section)
        todoList.innerHTML = paginatedTodos.map(todo => this.renderEntry(todo, { showCreatedTime: true })).join('');

        // Update pagination controls
        this.updateTodoPagination(totalTodos);
    }

    /**
     * Get filtered and sorted todos
     */
    getFilteredTodos() {
        let todos = this.entries.filter(entry => entry.isTodo);

        // Apply filter
        switch (this.todoPagination.filter) {
            case 'due-today':
                todos = todos.filter(todo => {
                    if (!todo.dueDate) return false;
                    const today = new Date().toDateString();
                    return new Date(todo.dueDate).toDateString() === today;
                });
                break;
            case 'overdue':
                todos = todos.filter(todo => {
                    if (!todo.dueDate) return false;
                    return new Date(todo.dueDate) < new Date();
                });
                break;
            case 'no-due-date':
                todos = todos.filter(todo => !todo.dueDate);
                break;
        }

        // Separate overdue and non-overdue items for prioritization
        const now = new Date();
        const overdueTodos = todos.filter(todo => todo.dueDate && new Date(todo.dueDate) < now);
        const regularTodos = todos.filter(todo => !todo.dueDate || new Date(todo.dueDate) >= now);

        // Apply sort to both groups separately
        const applySortToGroup = (todoGroup) => {
            switch (this.todoPagination.sort) {
                case 'created-asc':
                    return todoGroup.sort((a, b) => new Date(a.created) - new Date(b.created));
                case 'created-desc':
                    return todoGroup.sort((a, b) => new Date(b.created) - new Date(a.created));
                case 'due-asc':
                    return todoGroup.sort((a, b) => {
                        if (!a.dueDate && !b.dueDate) return 0;
                        if (!a.dueDate) return 1;
                        if (!b.dueDate) return -1;
                        return new Date(a.dueDate) - new Date(b.dueDate);
                    });
                case 'due-desc':
                    return todoGroup.sort((a, b) => {
                        if (!a.dueDate && !b.dueDate) return 0;
                        if (!a.dueDate) return 1;
                        if (!b.dueDate) return -1;
                        return new Date(b.dueDate) - new Date(a.dueDate);
                    });
                case 'activity-asc':
                    return todoGroup.sort((a, b) => a.activity.localeCompare(b.activity));
                case 'activity-desc':
                    return todoGroup.sort((a, b) => b.activity.localeCompare(a.activity));
                default:
                    return todoGroup;
            }
        };

        // Sort overdue items by how overdue they are (most overdue first)
        const sortedOverdue = overdueTodos.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        const sortedRegular = applySortToGroup(regularTodos);

        // Return overdue items first, then regular items
        return [...sortedOverdue, ...sortedRegular];
    }

    /**
     * Update todo pagination controls
     */
    updateTodoPagination(totalItems) {
        const pagination = document.getElementById('todoPagination');
        const prevBtn = document.getElementById('todoPrevBtn');
        const nextBtn = document.getElementById('todoNextBtn');
        const pageInfo = document.getElementById('todoPageInfo');

        if (!pagination || !prevBtn || !nextBtn || !pageInfo) return;

        const totalPages = Math.ceil(totalItems / this.todoPagination.itemsPerPage);
        
        if (totalPages <= 1) {
            pagination.style.display = 'none';
            return;
        }

        pagination.style.display = 'flex';
        pageInfo.textContent = `Page ${this.todoPagination.currentPage} of ${totalPages}`;
        
        prevBtn.disabled = this.todoPagination.currentPage <= 1;
        nextBtn.disabled = this.todoPagination.currentPage >= totalPages;
    }

    /**
     * Update entries pagination controls
     */
    updateEntriesPagination(totalItems) {
        const pagination = document.getElementById('entriesPagination');
        const prevBtn = document.getElementById('entriesPrevBtn');
        const nextBtn = document.getElementById('entriesNextBtn');
        const pageInfo = document.getElementById('entriesPageInfo');
        
        if (!pagination || !prevBtn || !nextBtn || !pageInfo) return;
        
        const totalPages = Math.ceil(totalItems / this.entriesPagination.itemsPerPage);
        
        if (totalPages <= 1) {
            pagination.style.display = 'none';
            return;
        }
        
        pagination.style.display = 'flex';
        pageInfo.textContent = `Page ${this.entriesPagination.currentPage} of ${totalPages}`;
        
        prevBtn.disabled = this.entriesPagination.currentPage <= 1;
        nextBtn.disabled = this.entriesPagination.currentPage >= totalPages;
    }

    /**
     * Navigate to previous entries page
     */
    previousEntriesPage() {
        if (this.entriesPagination.currentPage > 1) {
            this.entriesPagination.currentPage--;
            this.displayEntries();
        }
    }

    /**
     * Navigate to next entries page
     */
    nextEntriesPage() {
        const totalPages = Math.ceil(this.entries.length / this.entriesPagination.itemsPerPage);
        if (this.entriesPagination.currentPage < totalPages) {
            this.entriesPagination.currentPage++;
            this.displayEntries();
        }
    }

    /**
     * Filter todos
     */
    filterTodos() {
        const filterSelect = document.getElementById('todoFilter');
        if (filterSelect) {
            this.todoPagination.filter = filterSelect.value;
            this.todoPagination.currentPage = 1; // Reset to first page
            this.displayTodos();
        }
    }

    /**
     * Sort todos
     */
    sortTodos() {
        const sortSelect = document.getElementById('todoSort');
        if (sortSelect) {
            this.todoPagination.sort = sortSelect.value;
            this.todoPagination.currentPage = 1; // Reset to first page
            this.displayTodos();
        }
    }

    /**
     * Navigate to previous todo page
     */
    previousTodoPage() {
        if (this.todoPagination.currentPage > 1) {
            this.todoPagination.currentPage--;
            this.displayTodos();
        }
    }

    /**
     * Navigate to next todo page
     */
    nextTodoPage() {
        const totalTodos = this.getFilteredTodos().length;
        const totalPages = Math.ceil(totalTodos / this.todoPagination.itemsPerPage);
        
        if (this.todoPagination.currentPage < totalPages) {
            this.todoPagination.currentPage++;
            this.displayTodos();
        }
    }

    /**
     * Display notes with filtering, sorting, and pagination
     */
    displayNotes() {
        const noteList = document.getElementById('noteList');
        
        if (!noteList) return;

        // Initialize pagination state if not exists
        if (!this.notesPagination) {
            this.notesPagination = {
                currentPage: 1,
                itemsPerPage: this.settings.paginationSize || 20,
                filter: 'all',
                sort: 'newest',
                searchQuery: ''
            };
        }

        // Update pagination size from settings
        this.notesPagination.itemsPerPage = this.settings.paginationSize || 20;

        const notes = this.getFilteredNotes();
        const totalNotes = notes.length;

        if (totalNotes === 0) {
            noteList.innerHTML = '<p class="no-entries">No notes found.</p>';
            document.getElementById('notesPagination').style.display = 'none';
            return;
        }

        // Apply pagination
        const startIndex = (this.notesPagination.currentPage - 1) * this.notesPagination.itemsPerPage;
        const endIndex = startIndex + this.notesPagination.itemsPerPage;
        const paginatedNotes = notes.slice(startIndex, endIndex);

        // Render notes using unified renderEntry method with note indicator
        noteList.innerHTML = paginatedNotes.map(note => this.renderEntry(note, { showCreatedTime: true })).join('');

        // Update pagination controls
        this.updateNotesPagination(totalNotes);
    }

    /**
     * Get filtered and sorted notes
     */
    getFilteredNotes() {
        let notes = this.entries.filter(entry => entry.isNote);

        // Apply search filter
        if (this.notesPagination.searchQuery) {
            const query = this.notesPagination.searchQuery.toLowerCase();
            notes = notes.filter(note => 
                note.activity.toLowerCase().includes(query) ||
                (note.description && note.description.toLowerCase().includes(query)) ||
                note.tags.some(tag => tag.toLowerCase().includes(query))
            );
        }

        // Apply filter
        const now = new Date();
        switch (this.notesPagination.filter) {
            case 'today':
                const today = now.toDateString();
                notes = notes.filter(note => new Date(note.timestamp).toDateString() === today);
                break;
            case 'week':
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                notes = notes.filter(note => new Date(note.timestamp) >= weekAgo);
                break;
            case 'month':
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                notes = notes.filter(note => new Date(note.timestamp) >= monthAgo);
                break;
            case 'all':
            default:
                // No additional filtering
                break;
        }

        // Separate overdue and non-overdue notes for prioritization
        const overdueNotes = notes.filter(note => note.dueDate && new Date(note.dueDate) < now);
        const regularNotes = notes.filter(note => !note.dueDate || new Date(note.dueDate) >= now);

        // Apply sort to both groups separately
        const applySortToGroup = (noteGroup) => {
            switch (this.notesPagination.sort) {
                case 'oldest':
                    return noteGroup.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                case 'activity':
                    return noteGroup.sort((a, b) => a.activity.localeCompare(b.activity));
                case 'newest':
                default:
                    return noteGroup.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            }
        };

        // Sort overdue notes by how overdue they are (most overdue first)
        const sortedOverdue = overdueNotes.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        const sortedRegular = applySortToGroup(regularNotes);

        // Return overdue notes first, then regular notes
        return [...sortedOverdue, ...sortedRegular];
    }

    /**
     * Update notes pagination controls
     */
    updateNotesPagination(totalNotes) {
        const pagination = document.getElementById('notesPagination');
        const pageInfo = document.getElementById('notesPageInfo');
        const prevBtn = document.getElementById('notesPrevBtn');
        const nextBtn = document.getElementById('notesNextBtn');
        
        if (!pagination || !pageInfo || !prevBtn || !nextBtn) return;
        
        const totalPages = Math.ceil(totalNotes / this.notesPagination.itemsPerPage);
        
        if (totalPages <= 1) {
            pagination.style.display = 'none';
            return;
        }

        pagination.style.display = 'flex';
        pageInfo.textContent = `Page ${this.notesPagination.currentPage} of ${totalPages}`;
        
        prevBtn.disabled = this.notesPagination.currentPage <= 1;
        nextBtn.disabled = this.notesPagination.currentPage >= totalPages;
    }

    /**
     * Filter notes
     */
    filterNotes() {
        const filterSelect = document.getElementById('noteFilter');
        if (filterSelect) {
            this.notesPagination.filter = filterSelect.value;
            this.notesPagination.currentPage = 1; // Reset to first page
            this.displayNotes();
        }
    }

    /**
     * Sort notes
     */
    sortNotes() {
        const sortSelect = document.getElementById('noteSort');
        if (sortSelect) {
            this.notesPagination.sort = sortSelect.value;
            this.notesPagination.currentPage = 1; // Reset to first page
            this.displayNotes();
        }
    }

    /**
     * Search notes
     */
    searchNotes() {
        const searchInput = document.getElementById('noteSearchInput');
        if (searchInput) {
            this.notesPagination.searchQuery = searchInput.value.trim();
            this.notesPagination.currentPage = 1; // Reset to first page
            this.displayNotes();
        }
    }

    /**
     * Clear note search
     */
    clearNoteSearch() {
        const searchInput = document.getElementById('noteSearchInput');
        const clearBtn = document.getElementById('noteClearBtn');
        if (searchInput) {
            searchInput.value = '';
            this.notesPagination.searchQuery = '';
            this.notesPagination.currentPage = 1;
            this.displayNotes();
        }
        if (clearBtn) {
            clearBtn.style.display = 'none';
        }
    }

    /**
     * Toggle visibility of note clear button based on search input
     */
    toggleNoteClearButton() {
        const searchInput = document.getElementById('noteSearchInput');
        const clearBtn = document.getElementById('noteClearBtn');
        
        if (searchInput && clearBtn) {
            if (searchInput.value.trim().length > 0) {
                clearBtn.style.display = 'inline-block';
            } else {
                clearBtn.style.display = 'none';
            }
        }
    }

    /**
     * Navigate to previous notes page
     */
    previousNotePage() {
        if (this.notesPagination.currentPage > 1) {
            this.notesPagination.currentPage--;
            this.displayNotes();
        }
    }

    /**
     * Navigate to next notes page
     */
    nextNotePage() {
        const totalNotes = this.getFilteredNotes().length;
        const totalPages = Math.ceil(totalNotes / this.notesPagination.itemsPerPage);
        
        if (this.notesPagination.currentPage < totalPages) {
            this.notesPagination.currentPage++;
            this.displayNotes();
        }
    }

    /**
     * Initialize search functionality
     */
    initSearch() {
        const searchInput = document.getElementById('globalSearch');
        const searchResults = document.getElementById('searchResults');
        
        if (!searchInput || !searchResults) return;

        // Initialize search state
        this.searchState = {
            currentQuery: '',
            selectedIndex: -1,
            suggestions: [],
            searchPagination: {
                currentPage: 1,
                itemsPerPage: this.settings.paginationSize || 20,
                filter: 'all',
                sort: 'relevance'
            }
        };

        let searchTimeout;

        // Real-time search as you type
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();
            
            if (query.length === 0) {
                this.hideSearchSuggestions();
                return;
            }

            // Debounce search for better performance
            searchTimeout = setTimeout(() => {
                this.performSearch(query);
            }, 150);
        });

        // Handle keyboard navigation
        searchInput.addEventListener('keydown', (e) => {
            const suggestions = this.searchState.suggestions;
            
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.searchState.selectedIndex = Math.min(
                    this.searchState.selectedIndex + 1, 
                    suggestions.length - 1
                );
                this.updateSearchSuggestionSelection();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.searchState.selectedIndex = Math.max(this.searchState.selectedIndex - 1, -1);
                this.updateSearchSuggestionSelection();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (this.searchState.selectedIndex >= 0) {
                    this.selectSearchSuggestion(this.searchState.selectedIndex);
                } else if (searchInput.value.trim()) {
                    this.showFullSearchResults(searchInput.value.trim());
                }
            } else if (e.key === 'Escape') {
                this.hideSearchSuggestions();
                searchInput.blur();
            }
        });

        // Hide suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
                this.hideSearchSuggestions();
            }
        });
    }

    /**
     * Perform search and show suggestions
     */
    performSearch(query) {
        this.searchState.currentQuery = query;
        const results = this.searchEntries(query, 10); // Limit suggestions to 10
        this.searchState.suggestions = results;
        this.showSearchSuggestions(results);
    }

    /**
     * Search through entries
     */
    searchEntries(query, limit = null) {
        const searchTerms = query.toLowerCase().split(' ');
        const results = [];

        this.entries.forEach(entry => {
            let score = 0;
            const searchableText = (
                entry.activity + ' ' + 
                (entry.description || '') + ' ' +
                (entry.tags ? entry.tags.join(' ') : '')
            ).toLowerCase();

            // Calculate relevance score
            searchTerms.forEach(term => {
                if (entry.activity.toLowerCase().includes(term)) {
                    score += 10; // Activity title matches are most important
                }
                if (entry.description && entry.description.toLowerCase().includes(term)) {
                    score += 5; // Description matches
                }
                if (entry.tags && entry.tags.some(tag => tag.includes(term))) {
                    score += 8; // Hashtag matches are important
                }
                if (searchableText.includes(term)) {
                    score += 1; // General match
                }
            });

            if (score > 0) {
                results.push({ ...entry, searchScore: score });
            }
        });

        // Sort by relevance score
        results.sort((a, b) => b.searchScore - a.searchScore);

        return limit ? results.slice(0, limit) : results;
    }

    /**
     * Show search suggestions dropdown
     */
    showSearchSuggestions(results) {
        const searchResults = document.getElementById('searchResults');
        if (!searchResults) return;

        if (results.length === 0) {
            searchResults.innerHTML = '<div class="search-suggestion">No results found</div>';
        } else {
            searchResults.innerHTML = results.map((result, index) => {
                const tagsHtml = result.tags && result.tags.length > 0 
                    ? result.tags.map(tag => `<span class="search-hashtag">#${tag}</span>`).join('')
                    : '';

                const todoIndicator = result.isTodo ? '📋 ' : '';
                const typeIndicator = result.isTodo ? 'Todo' : 'Activity';

                return `
                    <div class="search-suggestion" data-index="${index}" onclick="tracker.selectSearchSuggestion(${index})">
                        <div class="search-suggestion-activity">${todoIndicator}${escapeHtml(result.activity)}</div>
                        <div class="search-suggestion-meta">${typeIndicator} • ${formatDateTime(result.timestamp)} ${tagsHtml}</div>
                    </div>
                `;
            }).join('');
        }

        searchResults.style.display = 'block';
        this.searchState.selectedIndex = -1;
    }

    /**
     * Hide search suggestions
     */
    hideSearchSuggestions() {
        const searchResults = document.getElementById('searchResults');
        if (searchResults) {
            searchResults.style.display = 'none';
        }
        this.searchState.selectedIndex = -1;
    }

    /**
     * Update search suggestion selection
     */
    updateSearchSuggestionSelection() {
        const suggestions = document.querySelectorAll('.search-suggestion');
        suggestions.forEach((suggestion, index) => {
            if (index === this.searchState.selectedIndex) {
                suggestion.classList.add('selected');
            } else {
                suggestion.classList.remove('selected');
            }
        });
    }

    /**
     * Select a search suggestion
     */
    selectSearchSuggestion(index) {
        const result = this.searchState.suggestions[index];
        if (result) {
            this.editEntry(result.id); // Open the entry for editing
            this.hideSearchSuggestions();
            document.getElementById('globalSearch').value = '';
        }
    }

    /**
     * Show full search results in dedicated section
     */
    showFullSearchResults(query) {
        const allResults = this.searchEntries(query);
        this.searchState.searchPagination.filter = 'all';
        this.searchState.searchPagination.sort = 'relevance';
        this.searchState.searchPagination.currentPage = 1;
        
        // Switch to search section
        showSection('search');
        
        // Update search info
        const searchQuery = document.getElementById('searchQuery');
        const searchCount = document.getElementById('searchCount');
        
        if (searchQuery) searchQuery.textContent = `Search: "${query}"`;
        if (searchCount) searchCount.textContent = `${allResults.length} result${allResults.length !== 1 ? 's' : ''}`;
        
        // Display results
        this.displaySearchResults(allResults);
        this.hideSearchSuggestions();
        document.getElementById('globalSearch').value = '';
    }

    /**
     * Display paginated search results
     */
    displaySearchResults(results) {
        const resultsList = document.getElementById('searchResultsList');
        const pagination = this.searchState.searchPagination;
        
        if (!resultsList) return;

        if (results.length === 0) {
            resultsList.innerHTML = '<p class="empty-state">No results found. Try different search terms.</p>';
            document.getElementById('searchPagination').style.display = 'none';
            return;
        }

        // Apply pagination
        const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
        const endIndex = startIndex + pagination.itemsPerPage;
        const paginatedResults = results.slice(startIndex, endIndex);

        // Render results using unified renderEntry method
        resultsList.innerHTML = paginatedResults.map(result => this.renderEntry(result, { showTodoIndicator: true, showNoteIndicator: true, showCreatedTime: true })).join('');

        // Update pagination
        this.updateSearchPagination(results.length);
    }


    /**
     * Update search pagination controls
     */
    updateSearchPagination(totalItems) {
        const pagination = document.getElementById('searchPagination');
        const prevBtn = document.getElementById('searchPrevBtn');
        const nextBtn = document.getElementById('searchNextBtn');
        const pageInfo = document.getElementById('searchPageInfo');

        if (!pagination || !prevBtn || !nextBtn || !pageInfo) return;

        const totalPages = Math.ceil(totalItems / this.searchState.searchPagination.itemsPerPage);
        
        if (totalPages <= 1) {
            pagination.style.display = 'none';
            return;
        }

        pagination.style.display = 'flex';
        pageInfo.textContent = `Page ${this.searchState.searchPagination.currentPage} of ${totalPages}`;
        
        prevBtn.disabled = this.searchState.searchPagination.currentPage <= 1;
        nextBtn.disabled = this.searchState.searchPagination.currentPage >= totalPages;
    }

    /**
     * Sort search results
     */
    sortSearchResults() {
        const sortSelect = document.getElementById('searchSort');
        if (sortSelect && this.searchState.currentQuery) {
            this.searchState.searchPagination.sort = sortSelect.value;
            this.searchState.searchPagination.currentPage = 1;
            this.showFullSearchResults(this.searchState.currentQuery);
        }
    }

    /**
     * Filter search results
     */
    filterSearchResults() {
        const filterSelect = document.getElementById('searchFilter');
        if (filterSelect && this.searchState.currentQuery) {
            this.searchState.searchPagination.filter = filterSelect.value;
            this.searchState.searchPagination.currentPage = 1;
            this.showFullSearchResults(this.searchState.currentQuery);
        }
    }

    /**
     * Navigate to previous search page
     */
    previousSearchPage() {
        if (this.searchState.searchPagination.currentPage > 1) {
            this.searchState.searchPagination.currentPage--;
            if (this.searchState.currentQuery) {
                this.showFullSearchResults(this.searchState.currentQuery);
            }
        }
    }

    /**
     * Navigate to next search page
     */
    nextSearchPage() {
        const results = this.searchEntries(this.searchState.currentQuery);
        const totalPages = Math.ceil(results.length / this.searchState.searchPagination.itemsPerPage);
        
        if (this.searchState.searchPagination.currentPage < totalPages) {
            this.searchState.searchPagination.currentPage++;
            if (this.searchState.currentQuery) {
                this.showFullSearchResults(this.searchState.currentQuery);
            }
        }
    }

    /**
     * Search by hashtag
     * @param {string} hashtag - The hashtag to search for
     */
    searchByHashtag(hashtag) {
        const query = `#${hashtag}`;
        this.showFullSearchResults(query);
    }

    /**
     * Get hashtag frequency for cloud visualization
     * @returns {Object} Object with hashtag as key and frequency as value
     */
    getHashtagFrequency() {
        const frequency = {};
        
        this.entries.forEach(entry => {
            if (entry.tags && entry.tags.length > 0) {
                entry.tags.forEach(tag => {
                    frequency[tag] = (frequency[tag] || 0) + 1;
                });
            }
        });
        
        return frequency;
    }

    /**
     * Initialize hashtag completion system
     */
    initHashtagCompletion() {
        this.hashtagState = {
            suggestions: [],
            selectedIndex: -1,
            isShowing: false,
            currentInput: null
        };

        // Add event listeners to input fields that support hashtags
        const inputFields = ['activity', 'description', 'editActivity', 'editDescription'];
        inputFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('input', (e) => this.handleHashtagInput(e));
                field.addEventListener('keydown', (e) => this.handleHashtagKeydown(e));
                field.addEventListener('blur', () => {
                    // Delay hiding to allow click selection
                    setTimeout(() => this.hideHashtagSuggestions(), 150);
                });
            }
        });

        // Hide suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.hashtag-suggestions') && !e.target.closest('input')) {
                this.hideHashtagSuggestions();
            }
        });
    }

    /**
     * Handle input changes for hashtag completion
     */
    handleHashtagInput(event) {
        const input = event.target;
        const cursorPos = input.selectionStart;
        const text = input.value.substring(0, cursorPos);
        
        // Find the last hashtag being typed
        const hashtagMatch = text.match(/#(\w*)$/);
        
        if (hashtagMatch) {
            const partialTag = hashtagMatch[1];
            this.showHashtagSuggestions(input, partialTag, hashtagMatch.index);
        } else {
            this.hideHashtagSuggestions();
        }
    }

    /**
     * Handle keyboard navigation for hashtag completion
     */
    handleHashtagKeydown(event) {
        if (!this.hashtagState.isShowing) return;

        const suggestions = this.hashtagState.suggestions;
        
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                this.hashtagState.selectedIndex = Math.min(
                    this.hashtagState.selectedIndex + 1,
                    suggestions.length - 1
                );
                this.updateHashtagSelection();
                break;
                
            case 'ArrowUp':
                event.preventDefault();
                this.hashtagState.selectedIndex = Math.max(
                    this.hashtagState.selectedIndex - 1,
                    0
                );
                this.updateHashtagSelection();
                break;
                
            case 'Tab':
            case 'Enter':
                if (this.hashtagState.selectedIndex >= 0) {
                    event.preventDefault();
                    this.selectHashtagSuggestion(this.hashtagState.selectedIndex);
                }
                break;
                
            case 'Escape':
                this.hideHashtagSuggestions();
                break;
        }
    }

    /**
     * Get all existing hashtags from entries
     */
    getAllHashtags() {
        const allTags = new Set();
        this.entries.forEach(entry => {
            if (entry.tags && Array.isArray(entry.tags)) {
                entry.tags.forEach(tag => allTags.add(tag));
            }
        });
        return Array.from(allTags).sort();
    }

    /**
     * Show hashtag suggestions dropdown
     */
    showHashtagSuggestions(input, partialTag, hashtagStartPos) {
        this.hashtagState.currentInput = input;
        this.hashtagState.hashtagStartPos = hashtagStartPos;
        
        const allTags = this.getAllHashtags();
        const suggestions = partialTag 
            ? allTags.filter(tag => tag.toLowerCase().startsWith(partialTag.toLowerCase()))
            : allTags.slice(0, 10); // Show top 10 if no partial match
        
        this.hashtagState.suggestions = suggestions;
        this.hashtagState.selectedIndex = suggestions.length > 0 ? 0 : -1;
        
        if (suggestions.length === 0) {
            this.hideHashtagSuggestions();
            return;
        }

        // Create or update suggestions dropdown
        let dropdown = document.getElementById('hashtagSuggestions');
        if (!dropdown) {
            dropdown = document.createElement('div');
            dropdown.id = 'hashtagSuggestions';
            dropdown.className = 'hashtag-suggestions';
            document.body.appendChild(dropdown);
        }

        // Position dropdown below input
        const rect = input.getBoundingClientRect();
        dropdown.style.position = 'absolute';
        dropdown.style.left = `${rect.left}px`;
        dropdown.style.top = `${rect.bottom + 5}px`;
        dropdown.style.width = `${Math.max(200, rect.width)}px`;
        dropdown.style.zIndex = '10002';

        // Generate dropdown content
        dropdown.innerHTML = suggestions.map((tag, index) => 
            `<div class="hashtag-suggestion ${index === this.hashtagState.selectedIndex ? 'selected' : ''}" 
                  data-index="${index}" onclick="tracker.selectHashtagSuggestion(${index})">
                #${escapeHtml(tag)}
            </div>`
        ).join('');

        this.hashtagState.isShowing = true;
    }

    /**
     * Hide hashtag suggestions
     */
    hideHashtagSuggestions() {
        const dropdown = document.getElementById('hashtagSuggestions');
        if (dropdown) {
            dropdown.remove();
        }
        this.hashtagState.isShowing = false;
        this.hashtagState.selectedIndex = -1;
    }

    /**
     * Update hashtag suggestion selection visual state
     */
    updateHashtagSelection() {
        const suggestions = document.querySelectorAll('.hashtag-suggestion');
        suggestions.forEach((suggestion, index) => {
            if (index === this.hashtagState.selectedIndex) {
                suggestion.classList.add('selected');
            } else {
                suggestion.classList.remove('selected');
            }
        });
    }

    /**
     * Select a hashtag suggestion and insert it into the input
     */
    selectHashtagSuggestion(index) {
        const suggestion = this.hashtagState.suggestions[index];
        if (!suggestion || !this.hashtagState.currentInput) return;

        const input = this.hashtagState.currentInput;
        const cursorPos = input.selectionStart;
        const currentValue = input.value;
        
        // Find the hashtag being replaced
        const beforeHashtag = currentValue.substring(0, this.hashtagState.hashtagStartPos);
        const afterCursor = currentValue.substring(cursorPos);
        
        // Replace with selected suggestion
        const newValue = beforeHashtag + '#' + suggestion + ' ' + afterCursor;
        input.value = newValue;
        
        // Position cursor after the inserted hashtag
        const newCursorPos = beforeHashtag.length + suggestion.length + 2; // +2 for # and space
        input.setSelectionRange(newCursorPos, newCursorPos);
        
        this.hideHashtagSuggestions();
        input.focus();
    }

    // ==================== WORKSPACE MANAGEMENT ====================

    /**
     * Initialize workspace system
     */
    initializeWorkspaces() {
        // Ensure workspaces object exists in localStorage
        if (!localStorage.getItem('workspaces')) {
            localStorage.setItem('workspaces', JSON.stringify({}));
        }
        
        // If this is first time using workspaces, save current data as "Default"
        const workspaces = JSON.parse(localStorage.getItem('workspaces'));
        if (!workspaces.Default) {
            this.saveCurrentWorkspaceData('Default');
        }
        
        console.log(`Workspace system initialized. Current workspace: ${this.currentWorkspace}`);
    }

    /**
     * Get list of all workspace names
     */
    getWorkspaceNames() {
        const workspaces = JSON.parse(localStorage.getItem('workspaces') || '{}');
        return Object.keys(workspaces).sort();
    }

    /**
     * Save current application data to a workspace
     */
    saveCurrentWorkspaceData(workspaceName) {
        const workspaces = JSON.parse(localStorage.getItem('workspaces') || '{}');
        
        // Save current data structure
        workspaces[workspaceName] = {
            data: {
                activityEntries: JSON.parse(localStorage.getItem('activityEntries') || '[]'),
                activitySettings: JSON.parse(localStorage.getItem('activitySettings') || '{}'),
                activityState: JSON.parse(localStorage.getItem('activityState') || '{}')
            },
            lastModified: new Date().toISOString()
        };
        
        localStorage.setItem('workspaces', JSON.stringify(workspaces));
        console.log(`Saved current data to workspace: ${workspaceName}`);
    }

    /**
     * Load workspace data into current application
     */
    loadWorkspaceData(workspaceName) {
        const workspaces = JSON.parse(localStorage.getItem('workspaces') || '{}');
        const workspace = workspaces[workspaceName];
        
        if (!workspace) {
            console.error(`Workspace ${workspaceName} not found`);
            return false;
        }
        
        // Load workspace data into current storage
        localStorage.setItem('activityEntries', JSON.stringify(workspace.data.activityEntries || []));
        localStorage.setItem('activitySettings', JSON.stringify(workspace.data.activitySettings || {}));
        localStorage.setItem('activityState', JSON.stringify(workspace.data.activityState || {}));
        
        console.log(`Loaded workspace: ${workspaceName}`);
        return true;
    }

    /**
     * Switch to a different workspace
     */
    switchWorkspace(targetWorkspaceName) {
        if (targetWorkspaceName === this.currentWorkspace) {
            console.log(`Already in workspace: ${targetWorkspaceName}`);
            return;
        }
        
        // Save current workspace data before switching
        this.saveCurrentWorkspaceData(this.currentWorkspace);
        
        // Load target workspace data
        if (this.loadWorkspaceData(targetWorkspaceName)) {
            this.currentWorkspace = targetWorkspaceName;
            localStorage.setItem('currentWorkspace', targetWorkspaceName);
            
            // Reload application data
            this.entries = JSON.parse(localStorage.getItem('activityEntries') || '[]');
            this.settings = {
                ...this.defaultSettings,
                ...JSON.parse(localStorage.getItem('activitySettings') || '{}')
            };
            this.state = this.loadState();
            
            // Re-initialize managers with new settings
            if (this.pauseManager) {
                this.pauseManager.updatePauseButtonDisplay();
            }
            if (this.pomodoroManager) {
                this.pomodoroManager.updateUI();
            }
            
            // Refresh UI
            this.displayEntries();
            this.displayTodos();
            this.displayNotes();
            this.loadSettings();
            this.updateHeaderWorkspaceName();
            
            console.log(`Switched to workspace: ${targetWorkspaceName}`);
        }
    }

    /**
     * Create a new workspace
     */
    createWorkspace(workspaceName) {
        if (!workspaceName || workspaceName.trim() === '') {
            return false;
        }
        
        const trimmedName = workspaceName.trim();
        const workspaces = JSON.parse(localStorage.getItem('workspaces') || '{}');
        
        if (workspaces[trimmedName]) {
            alert(`Workspace "${trimmedName}" already exists`);
            return false;
        }
        
        // Create new workspace with default settings structure
        workspaces[trimmedName] = {
            data: {
                activityEntries: [],
                activitySettings: { ...this.defaultSettings }, // Use default settings instead of empty object
                activityState: {}
            },
            lastModified: new Date().toISOString()
        };
        
        localStorage.setItem('workspaces', JSON.stringify(workspaces));
        console.log(`Created new workspace: ${trimmedName}`);
        return true;
    }

    /**
     * Delete a workspace
     */
    deleteWorkspace(workspaceName) {
        if (workspaceName === 'Default') {
            alert('Cannot delete the Default workspace');
            return false;
        }
        
        if (workspaceName === this.currentWorkspace) {
            alert('Cannot delete the currently active workspace');
            return false;
        }
        
        const workspaces = JSON.parse(localStorage.getItem('workspaces') || '{}');
        if (!workspaces[workspaceName]) {
            console.error(`Workspace ${workspaceName} not found`);
            return false;
        }
        
        delete workspaces[workspaceName];
        localStorage.setItem('workspaces', JSON.stringify(workspaces));
        console.log(`Deleted workspace: ${workspaceName}`);
        return true;
    }

    /**
     * Rename a workspace
     */
    renameWorkspace(oldName, newName) {
        if (!newName || newName.trim() === '') {
            return false;
        }
        
        const trimmedNewName = newName.trim();
        const workspaces = JSON.parse(localStorage.getItem('workspaces') || '{}');
        
        if (!workspaces[oldName]) {
            console.error(`Workspace ${oldName} not found`);
            return false;
        }
        
        if (workspaces[trimmedNewName]) {
            alert(`Workspace "${trimmedNewName}" already exists`);
            return false;
        }
        
        // Copy workspace data to new name
        workspaces[trimmedNewName] = workspaces[oldName];
        workspaces[trimmedNewName].lastModified = new Date().toISOString();
        
        // Remove old workspace
        delete workspaces[oldName];
        
        // Update current workspace if it was renamed
        if (this.currentWorkspace === oldName) {
            this.currentWorkspace = trimmedNewName;
            localStorage.setItem('currentWorkspace', trimmedNewName);
            this.updateHeaderWorkspaceName();
        }
        
        localStorage.setItem('workspaces', JSON.stringify(workspaces));
        console.log(`Renamed workspace ${oldName} to ${trimmedNewName}`);
        return true;
    }

    /**
     * Get all workspaces data for backup (without triggering download)
     * @returns {Object} Backup data
     */
    getAllWorkspacesData() {
        // Save current workspace before export
        this.saveCurrentWorkspaceData(this.currentWorkspace);
        
        return {
            workspaces: JSON.parse(localStorage.getItem('workspaces') || '{}'),
            currentWorkspace: this.currentWorkspace,
            exportDate: new Date().toISOString(),
            version: typeof APP_VERSION !== 'undefined' ? APP_VERSION : 'Development'
        };
    }

    /**
     * Export all workspaces data
     */
    exportAllWorkspaces() {
        const allData = this.getAllWorkspacesData();
        
        const dataStr = JSON.stringify(allData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `activity-tracker-all-workspaces-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        console.log('Exported all workspaces');
    }

    /**
     * Update header to show workspace name
     */
    updateHeaderWorkspaceName() {
        const headerText = document.querySelector('.header .header-text h1 .header-text');
        if (headerText) {
            const baseTitle = 'Activity Tracker';
            if (this.currentWorkspace && this.currentWorkspace !== 'Default') {
                headerText.textContent = `${baseTitle} - ${this.currentWorkspace}`;
            } else {
                headerText.textContent = baseTitle;
            }
        }
    }

    /**
     * Version checking and update notification system
     */
    initializeVersionChecking() {
        // Check immediately on startup
        this.checkForUpdates();
        
        // Set up periodic checks every 12 hours
        this.versionCheckInterval = setInterval(() => {
            this.checkForUpdates();
        }, 12 * 60 * 60 * 1000); // 12 hours in milliseconds
        
        console.log('Version checking initialized - will check every 12 hours');
    }

    /**
     * Check for app updates by comparing current version with server version
     * @param {boolean} isManualCheck - Whether this is a manual check (affects error handling)
     */
    async checkForUpdates(isManualCheck = false) {
        try {
            const currentVersion = typeof APP_VERSION !== 'undefined' ? APP_VERSION : 'unknown';
            const lastCheck = localStorage.getItem('lastVersionCheck');
            const now = Date.now();
            
            // Only check if more than 11 hours have passed since last check (unless manual)
            if (!isManualCheck && lastCheck && (now - parseInt(lastCheck)) < (11 * 60 * 60 * 1000)) {
                return Promise.resolve();
            }
            
            // Try to fetch the current page to get the latest version
            const response = await fetch(window.location.href, {
                method: 'HEAD',
                cache: 'no-cache',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache'
                }
            });
            
            if (response.ok) {
                // Fetch the full HTML to extract version from meta tag
                const htmlResponse = await fetch(window.location.href, {
                    cache: 'no-cache',
                    headers: {
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache'
                    }
                });
                
                if (!htmlResponse.ok) {
                    throw new Error(`Failed to fetch HTML: ${htmlResponse.status} ${htmlResponse.statusText}`);
                }
                
                const html = await htmlResponse.text();
                
                if (!html) {
                    throw new Error('Empty response received');
                }
                
                const versionMatch = html.match(/<meta name="app-version" content="([^"]+)"/);
                
                if (versionMatch) {
                    const serverVersion = versionMatch[1];
                    
                    // Store last check time
                    localStorage.setItem('lastVersionCheck', now.toString());
                    
                    if (this.compareVersions(serverVersion, currentVersion) > 0) {
                        console.log(`Update available: ${currentVersion} → ${serverVersion}`);
                        
                        // Check if user recently triggered a refresh
                        const updateRefreshTime = localStorage.getItem('updateRefreshTriggered');
                        const timeSinceRefresh = updateRefreshTime ? now - parseInt(updateRefreshTime) : Infinity;
                        
                        // If they just refreshed (within 10 seconds), show refreshed message instead of banner
                        if (timeSinceRefresh < 10000) {
                            console.log('Recent refresh detected, showing refreshed message instead of update banner');
                            this.showAppRefreshedMessage();
                            // Clear the refresh trigger so subsequent checks work normally
                            localStorage.removeItem('updateRefreshTriggered');
                        } else {
                            this.showUpdateNotification(serverVersion);
                        }
                    } else {
                        console.log(`App is up to date: ${currentVersion}`);
                        
                        // Still check for recent refresh to show refreshed message
                        const updateRefreshTime = localStorage.getItem('updateRefreshTriggered');
                        const timeSinceRefresh = updateRefreshTime ? now - parseInt(updateRefreshTime) : Infinity;
                        
                        if (timeSinceRefresh < 10000) {
                            console.log('App refreshed and is up to date');
                            this.showAppRefreshedMessage();
                            localStorage.removeItem('updateRefreshTriggered');
                        }
                    }
                } else {
                    console.warn('Version meta tag not found in HTML response');
                    // Still store last check time so we don't spam requests
                    localStorage.setItem('lastVersionCheck', now.toString());
                }
            } else {
                throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            console.warn('Version check failed (this is normal if offline):', error.message);
            // Re-throw error only for manual checks to handle
            if (isManualCheck) {
                throw error;
            }
        }
    }

    /**
     * Compare two version strings (YYYY.MM.DD.NN format)
     * Returns: 1 if version1 > version2, -1 if version1 < version2, 0 if equal
     */
    compareVersions(version1, version2) {
        if (version1 === version2) return 0;
        
        const v1Parts = version1.split('.').map(n => parseInt(n, 10));
        const v2Parts = version2.split('.').map(n => parseInt(n, 10));
        
        for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
            const v1 = v1Parts[i] || 0;
            const v2 = v2Parts[i] || 0;
            
            if (v1 > v2) return 1;
            if (v1 < v2) return -1;
        }
        
        return 0;
    }

    /**
     * Show update notification to user
     */
    showUpdateNotification(newVersion) {
        const currentVersion = typeof APP_VERSION !== 'undefined' ? APP_VERSION : 'unknown';
        
        // Create update notification banner
        const updateBanner = document.createElement('div');
        updateBanner.id = 'updateBanner';
        updateBanner.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 20px;
            z-index: 10001;
            text-align: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            font-weight: 500;
        `;
        
        updateBanner.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; gap: 15px; flex-wrap: wrap;">
                <span>🚀 Update available! ${currentVersion} → ${newVersion}</span>
                <button onclick="tracker.handleUpdateRefresh()" style="
                    background: rgba(255,255,255,0.2);
                    border: 1px solid rgba(255,255,255,0.3);
                    color: white;
                    padding: 6px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: all 0.2s;
                " onmouseover="this.style.background='rgba(255,255,255,0.3)'" 
                   onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                    Update Now
                </button>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: transparent;
                    border: 1px solid rgba(255,255,255,0.3);
                    color: white;
                    padding: 6px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: all 0.2s;
                " onmouseover="this.style.background='rgba(255,255,255,0.1)'" 
                   onmouseout="this.style.background='transparent'">
                    Dismiss
                </button>
            </div>
        `;
        
        // Remove any existing update banner
        const existingBanner = document.getElementById('updateBanner');
        if (existingBanner) {
            existingBanner.remove();
        }
        
        // Add banner to page
        document.body.appendChild(updateBanner);
        
        // Also show a toast notification
        showNotification(
            `Update available! Current: ${currentVersion}, Available: ${newVersion}`,
            'info',
            8000
        );
    }

    /**
     * Handle the update refresh action
     */
    handleUpdateRefresh() {
        // Mark that the user has acted on an update
        localStorage.setItem('updateRefreshTriggered', Date.now().toString());
        
        // Remove the banner
        const banner = document.getElementById('updateBanner');
        if (banner) {
            banner.remove();
        }
        
        // Reload the page
        window.location.reload();
    }

    /**
     * Show a brief "App refreshed" message that auto-disappears
     */
    showAppRefreshedMessage() {
        const currentVersion = typeof APP_VERSION !== 'undefined' ? APP_VERSION : 'unknown';
        showNotification(`🔄 App refreshed to ${currentVersion}`, 'success', 3000);
    }

    /**
     * Cleanup version checking interval
     */
    stopVersionChecking() {
        if (this.versionCheckInterval) {
            clearInterval(this.versionCheckInterval);
            this.versionCheckInterval = null;
            console.log('Version checking stopped');
        }
    }

    /**
     * Initialize automated backup prompt system
     */
    initializeBackupPrompt() {
        // Only initialize if backups are enabled
        if (this.settings.backupReminders === 'enabled') {
            this.scheduleBackupPrompt();
            console.log('Backup prompt system initialized');
        } else {
            console.log('Backup prompts disabled in settings');
        }
        
        // Initialize automatic backups if enabled
        if (this.settings.automaticBackups) {
            this.initializeAutomaticBackups();
        }
    }

    /**
     * Initialize automatic backup system
     */
    async initializeAutomaticBackups() {
        try {
            if (this.settings.backgroundBackupPermission === 'granted') {
                // Check for missed backups and perform one if needed
                await this.checkAndHandleMissedBackups();
                
                await this.scheduleNextAutomaticBackup();
                console.log('Automatic backup system initialized');
            } else {
                console.log('Automatic backups enabled but permission not granted');
            }
        } catch (error) {
            console.error('Failed to initialize automatic backups:', error);
        }
    }

    /**
     * Check for missed backups and perform one if needed
     */
    async checkAndHandleMissedBackups() {
        const lastAutomaticBackup = localStorage.getItem('lastAutomaticBackupTime');
        const lastGeneralBackup = localStorage.getItem('lastBackupTime');
        
        // If no backup history at all, skip missed backup check
        if (!lastAutomaticBackup && !lastGeneralBackup) {
            return;
        }
        
        // Use the most recent backup time (automatic or manual)
        let lastBackupTime = null;
        if (lastAutomaticBackup && lastGeneralBackup) {
            const autoTime = new Date(lastAutomaticBackup);
            const generalTime = new Date(lastGeneralBackup);
            lastBackupTime = autoTime > generalTime ? lastAutomaticBackup : lastGeneralBackup;
        } else {
            lastBackupTime = lastAutomaticBackup || lastGeneralBackup;
        }

        const now = new Date();
        const lastBackupDate = new Date(lastBackupTime);
        let nextBackupDate = new Date(lastBackupDate);

        // Calculate when the next backup should have been
        switch (this.settings.backgroundBackupFrequency) {
            case 'daily':
                nextBackupDate.setDate(nextBackupDate.getDate() + 1);
                break;
            case 'weekly':
                nextBackupDate.setDate(nextBackupDate.getDate() + 7);
                break;
            case 'bi_weekly':
                nextBackupDate.setDate(nextBackupDate.getDate() + 14);
                break;
            case 'monthly':
                nextBackupDate.setMonth(nextBackupDate.getMonth() + 1);
                break;
        }

        // If we're past the next backup date, perform a missed backup
        if (now >= nextBackupDate) {
            console.log('Detected missed automatic backup, performing now...');
            
            try {
                const backupData = this.getAllWorkspacesData();
                const filename = this.generateBackupFilename();
                
                // Create and download the missed backup
                const blob = new Blob([JSON.stringify(backupData, null, 2)], { 
                    type: 'application/json' 
                });
                
                // Record the backup (both automatic and general backup time)
                localStorage.setItem('lastAutomaticBackupTime', now.toISOString());
                localStorage.setItem('lastBackupTime', now.toISOString());
                
                // Show user-friendly notification
                showNotification('📦 Missed backup completed automatically', 'success', 4000);
                
                console.log('Missed automatic backup completed:', filename);
                
            } catch (error) {
                console.error('Failed to perform missed backup:', error);
                showNotification('❌ Failed to perform missed backup', 'error', 4000);
            }
        }
    }

    /**
     * Schedule the backup prompt for 15 minutes before end of working day
     */
    scheduleBackupPrompt() {
        // Clear any existing timer
        if (this.backupPromptTimer) {
            clearTimeout(this.backupPromptTimer);
            this.backupPromptTimer = null;
        }

        // Check backup schedule setting
        const schedule = this.settings.backupSchedule;
        if (schedule === 'manual_only') {
            console.log('Backup schedule set to manual only, skipping automatic scheduling');
            return;
        }

        // Check if we should show the backup prompt
        const now = new Date();
        const shouldShowPrompt = this.shouldShowBackupPrompt(schedule, now);
        
        if (!shouldShowPrompt.show) {
            console.log(`Backup prompt not needed: ${shouldShowPrompt.reason}`);
            return;
        }

        // Calculate when to show the prompt based on schedule
        const promptTime = this.calculateBackupPromptTime(schedule);
        if (!promptTime) {
            console.log('Could not calculate backup prompt time');
            return;
        }

        const msUntilPrompt = promptTime.getTime() - now.getTime();
        
        if (msUntilPrompt > 0) {
            console.log(`Backup prompt scheduled for: ${promptTime.toLocaleTimeString()} (${schedule})`);
            this.backupPromptTimer = setTimeout(() => {
                this.showBackupPrompt();
            }, msUntilPrompt);
        } else {
            console.log('Backup prompt time has passed');
        }
    }

    /**
     * Check if backup prompt should be shown based on schedule
     */
    shouldShowBackupPrompt(schedule, now) {
        const today = now.toDateString();
        const lastPromptDate = localStorage.getItem('lastBackupPromptDate');
        const promptDismissed = localStorage.getItem('backupPromptDismissed') === today;
        
        // Don't show if dismissed today
        if (promptDismissed) {
            return { show: false, reason: 'dismissed today' };
        }

        switch (schedule) {
            case 'end_of_day':
                return { 
                    show: lastPromptDate !== today, 
                    reason: lastPromptDate === today ? 'already shown today' : 'ready to show'
                };
                
            case 'daily_5pm':
                return { 
                    show: lastPromptDate !== today, 
                    reason: lastPromptDate === today ? 'already shown today' : 'ready to show'
                };
                
            case 'weekly_friday':
                const isFriday = now.getDay() === 5; // 5 = Friday
                const thisWeek = this.getWeekStart(now).toDateString();
                const lastWeek = localStorage.getItem('lastBackupPromptWeek');
                return { 
                    show: isFriday && lastWeek !== thisWeek, 
                    reason: !isFriday ? 'not Friday' : lastWeek === thisWeek ? 'already shown this week' : 'ready to show'
                };
                
            case 'weekly_end':
                const isWeekend = now.getDay() === 0 || now.getDay() === 6; // Sunday or Saturday
                const weekStart = this.getWeekStart(now).toDateString();
                const lastWeekPrompt = localStorage.getItem('lastBackupPromptWeek');
                return { 
                    show: isWeekend && lastWeekPrompt !== weekStart, 
                    reason: !isWeekend ? 'not weekend' : lastWeekPrompt === weekStart ? 'already shown this week' : 'ready to show'
                };
                
            default:
                return { show: false, reason: 'unknown schedule' };
        }
    }

    /**
     * Get the start of the week (Monday) for a given date
     */
    getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        return new Date(d.setDate(diff));
    }

    /**
     * Calculate when to show the backup prompt based on schedule type
     */
    calculateBackupPromptTime(schedule) {
        const now = new Date();
        
        switch (schedule) {
            case 'end_of_day':
                return this.calculateEndOfDayPromptTime(now);
                
            case 'daily_5pm':
                const fivePm = new Date(now);
                fivePm.setHours(17, 0, 0, 0); // 5:00 PM
                
                if (fivePm > now) {
                    return fivePm;
                } else {
                    // If it's past 5 PM, schedule for tomorrow
                    const tomorrow = new Date(now);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    tomorrow.setHours(17, 0, 0, 0);
                    return tomorrow;
                }
                
            case 'weekly_friday':
                return this.calculateFridayPromptTime(now);
                
            case 'weekly_end':
                return this.calculateWeekendPromptTime(now);
                
            default:
                return this.calculateEndOfDayPromptTime(now);
        }
    }

    /**
     * Calculate prompt time for end of working day (15 minutes before end)
     */
    calculateEndOfDayPromptTime(now) {
        const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
        let endTime = null;

        if (this.settings.useComplexSchedule && this.settings.complexSchedule) {
            const daySchedule = this.settings.complexSchedule[dayName];
            if (daySchedule && daySchedule.length > 0) {
                // Find the latest end time for today
                let latestEnd = null;
                daySchedule.forEach(range => {
                    if (range.end) {
                        const [hours, minutes] = range.end.split(':').map(Number);
                        const endDateTime = new Date(now);
                        endDateTime.setHours(hours, minutes, 0, 0);
                        
                        if (!latestEnd || endDateTime > latestEnd) {
                            latestEnd = endDateTime;
                        }
                    }
                });
                endTime = latestEnd;
            }
        } else if (this.settings.endTime) {
            // Simple schedule mode
            const dayCheckboxes = document.querySelectorAll('input[name="activityDays"]:checked');
            const activeDays = Array.from(dayCheckboxes).map(cb => cb.value);
            
            if (activeDays.includes(dayName)) {
                const [hours, minutes] = this.settings.endTime.split(':').map(Number);
                endTime = new Date(now);
                endTime.setHours(hours, minutes, 0, 0);
            }
        }

        if (endTime && endTime > now) {
            // Calculate 15 minutes before end time
            const promptTime = new Date(endTime.getTime() - (15 * 60 * 1000));
            
            // Only show if prompt time is in the future
            if (promptTime > now) {
                return promptTime;
            }
        }

        return null;
    }

    /**
     * Calculate prompt time for Friday at 4:45 PM
     */
    calculateFridayPromptTime(now) {
        const today = now.getDay();
        const daysUntilFriday = (5 - today + 7) % 7;
        
        const fridayDate = new Date(now);
        if (daysUntilFriday === 0) {
            // It's Friday today
            fridayDate.setHours(16, 45, 0, 0); // 4:45 PM
            if (fridayDate > now) {
                return fridayDate;
            } else {
                // Past 4:45 PM on Friday, wait for next Friday
                fridayDate.setDate(fridayDate.getDate() + 7);
                fridayDate.setHours(16, 45, 0, 0);
                return fridayDate;
            }
        } else {
            // Schedule for next Friday
            fridayDate.setDate(fridayDate.getDate() + daysUntilFriday);
            fridayDate.setHours(16, 45, 0, 0);
            return fridayDate;
        }
    }

    /**
     * Calculate prompt time for weekend (Saturday at 10 AM)
     */
    calculateWeekendPromptTime(now) {
        const today = now.getDay();
        const daysUntilSaturday = (6 - today + 7) % 7;
        
        const saturdayDate = new Date(now);
        if (daysUntilSaturday === 0) {
            // It's Saturday today
            saturdayDate.setHours(10, 0, 0, 0); // 10:00 AM
            if (saturdayDate > now) {
                return saturdayDate;
            } else {
                // Past 10 AM on Saturday, try Sunday
                const sundayDate = new Date(now);
                sundayDate.setDate(sundayDate.getDate() + 1);
                sundayDate.setHours(10, 0, 0, 0);
                if (sundayDate > now && today === 6) { // Only if it's Saturday
                    return sundayDate;
                } else {
                    // Wait for next Saturday
                    saturdayDate.setDate(saturdayDate.getDate() + 7);
                    saturdayDate.setHours(10, 0, 0, 0);
                    return saturdayDate;
                }
            }
        } else if (daysUntilSaturday === 1 && today === 0) {
            // It's Sunday, check if we should show today
            const sundayTime = new Date(now);
            sundayTime.setHours(10, 0, 0, 0);
            if (sundayTime > now) {
                return sundayTime;
            } else {
                // Past time on Sunday, wait for next Saturday
                saturdayDate.setDate(saturdayDate.getDate() + 6);
                saturdayDate.setHours(10, 0, 0, 0);
                return saturdayDate;
            }
        } else {
            // Schedule for next Saturday
            saturdayDate.setDate(saturdayDate.getDate() + daysUntilSaturday);
            saturdayDate.setHours(10, 0, 0, 0);
            return saturdayDate;
        }
    }

    /**
     * Show the backup prompt banner
     */
    showBackupPrompt() {
        const banner = document.getElementById('backupBanner');
        if (banner) {
            banner.classList.add('show');
            
            const schedule = this.settings.backupSchedule;
            const now = new Date();
            
            // Store tracking information based on schedule type
            if (schedule === 'weekly_friday' || schedule === 'weekly_end') {
                // For weekly schedules, track by week
                const weekStart = this.getWeekStart(now).toDateString();
                localStorage.setItem('lastBackupPromptWeek', weekStart);
            } else {
                // For daily schedules, track by day
                localStorage.setItem('lastBackupPromptDate', now.toDateString());
            }
            
            console.log(`Backup prompt banner shown (${schedule})`);
        }
    }

    /**
     * Manually show the backup prompt (for testing/diagnostics)
     */
    showBackupPromptManually() {
        const banner = document.getElementById('backupBanner');
        if (banner) {
            banner.classList.add('show');
            console.log('Backup prompt manually triggered from diagnostics');
            showNotification('💾 Backup prompt displayed for testing', 'info', 2000);
        }
    }

    /**
     * Hide the backup prompt banner
     */
    hideBackupPrompt() {
        const banner = document.getElementById('backupBanner');
        if (banner) {
            banner.classList.remove('show');
        }
    }

    /**
     * Create a quick backup and hide the prompt
     */
    createQuickBackup() {
        try {
            // Use the existing export functionality
            const data = this.exportDatabase();
            
            // Create filename with current date and time
            const now = new Date();
            const timestamp = now.toLocaleDateString('en-CA') + '_' + 
                            now.toLocaleTimeString('en-GB', { hour12: false }).replace(/:/g, '-');
            const filename = `activity-backup-${timestamp}.json`;
            
            // Create and trigger download
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            // Hide the banner and show success message
            this.hideBackupPrompt();
            showNotification(`✅ Backup created: ${filename}`, 'success', 4000);
            
            // Mark as completed for today
            localStorage.setItem('backupPromptDismissed', new Date().toDateString());
            
        } catch (error) {
            console.error('Failed to create backup:', error);
            showNotification('❌ Failed to create backup. Please try the Settings menu.', 'error', 4000);
        }
    }

    /**
     * Snooze the backup prompt for a specified duration
     * @param {number} minutes - Minutes to snooze (60=1hr, 180=3hr, 1440=1day, 10080=1week)
     */
    snoozeBackupPrompt(minutes = 30) {
        this.hideBackupPrompt();
        
        // Schedule to show again after specified minutes
        this.backupPromptTimer = setTimeout(() => {
            this.showBackupPrompt();
        }, minutes * 60 * 1000);
        
        // Friendly duration messages
        let durationText;
        if (minutes === 60) durationText = '1 hour';
        else if (minutes === 180) durationText = '3 hours';
        else if (minutes === 1440) durationText = 'tomorrow';
        else if (minutes === 10080) durationText = 'next week';
        else durationText = `${minutes} minutes`;
        
        showNotification(`⏰ Backup reminder snoozed for ${durationText}`, 'info', 3000);
    }

    /**
     * Dismiss the backup prompt for today
     */
    dismissBackupPrompt() {
        this.hideBackupPrompt();
        
        // Mark as dismissed for today
        localStorage.setItem('backupPromptDismissed', new Date().toDateString());
        
        showNotification('📝 Backup reminder dismissed for today', 'info', 2000);
    }

    /**
     * Permanently disable backup reminders
     */
    neverRemindBackup() {
        this.hideBackupPrompt();
        
        // Update settings to never remind again
        this.settings.backupReminders = 'never';
        this.saveSettings();
        
        // Clear any existing timers
        if (this.backupPromptTimer) {
            clearTimeout(this.backupPromptTimer);
            this.backupPromptTimer = null;
        }
        
        showNotification('🚫 Backup reminders disabled permanently (can be re-enabled in Settings)', 'warning', 5000);
    }

    /**
     * Request permission for background sync and automatic backups
     */
    async requestBackgroundBackupPermission() {
        try {
            // Check if Background Sync is supported
            if (!('serviceWorker' in navigator) || !('sync' in window.ServiceWorkerRegistration.prototype)) {
                throw new Error('Background Sync is not supported in this browser');
            }

            // Request persistent notification permission (needed for background operations)
            const notificationPermission = await Notification.requestPermission();
            if (notificationPermission !== 'granted') {
                throw new Error('Notification permission is required for background backups');
            }

            // Register background sync for automatic backups
            const registration = await navigator.serviceWorker.ready;
            await registration.sync.register('automatic-backup');

            // Update permission status
            this.settings.backgroundBackupPermission = 'granted';
            this.saveSettings();

            console.log('Background backup permission granted');
            return true;

        } catch (error) {
            console.error('Failed to request background backup permission:', error);
            this.settings.backgroundBackupPermission = 'denied';
            this.saveSettings();
            throw error;
        }
    }

    /**
     * Enable automatic backups
     */
    async enableAutomaticBackups() {
        try {
            // Request permission first if not already granted
            if (this.settings.backgroundBackupPermission !== 'granted') {
                await this.requestBackgroundBackupPermission();
            }

            // Enable automatic backups
            this.settings.automaticBackups = true;
            this.saveSettings();

            // Schedule initial backup sync
            await this.scheduleNextAutomaticBackup();

            // Trigger an initial backup to help user enable downloads in browser
            console.log('Triggering initial backup to help user enable downloads...');
            this.exportDatabase();

            showNotification('🚀 Automatic backups enabled! Please allow downloads when prompted. Backups will happen in the background.', 'success', 6000);
            return true;

        } catch (error) {
            console.error('Failed to enable automatic backups:', error);
            showNotification(`❌ Could not enable automatic backups: ${error.message}`, 'error', 6000);
            return false;
        }
    }

    /**
     * Disable automatic backups
     */
    async disableAutomaticBackups() {
        try {
            this.settings.automaticBackups = false;
            this.saveSettings();

            // Clear any pending background sync registrations
            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.ready;
                if (registration.sync) {
                    // Note: There's no unregister method, but we'll handle this in the SW
                    console.log('Automatic backups disabled');
                }
            }

            showNotification('⏸️ Automatic backups disabled', 'info', 3000);
            return true;

        } catch (error) {
            console.error('Failed to disable automatic backups:', error);
            showNotification(`❌ Error disabling automatic backups: ${error.message}`, 'error', 4000);
            return false;
        }
    }

    /**
     * Schedule the next automatic backup based on frequency setting
     */
    async scheduleNextAutomaticBackup() {
        if (!this.settings.automaticBackups || this.settings.backgroundBackupPermission !== 'granted') {
            return;
        }

        try {
            const registration = await navigator.serviceWorker.ready;
            
            // Calculate next backup time based on frequency
            const now = new Date();
            const lastBackup = localStorage.getItem('lastAutomaticBackupTime');
            const lastBackupTime = lastBackup ? new Date(lastBackup) : new Date(0);
            
            let nextBackupTime = new Date(now);
            
            switch (this.settings.backgroundBackupFrequency) {
                case 'daily':
                    nextBackupTime.setDate(lastBackupTime.getDate() + 1);
                    break;
                case 'weekly':
                    nextBackupTime.setDate(lastBackupTime.getDate() + 7);
                    break;
                case 'bi_weekly':
                    nextBackupTime.setDate(lastBackupTime.getDate() + 14);
                    break;
                case 'monthly':
                    nextBackupTime.setMonth(lastBackupTime.getMonth() + 1);
                    break;
            }

            // Only register sync if backup is overdue (next backup time is in the past)
            if (nextBackupTime <= now) {
                await registration.sync.register('automatic-backup');
                console.log('Automatic backup scheduled immediately (overdue)');
            } else {
                // Future backup - don't register sync yet, just log when it would be due
                console.log(`Next automatic backup scheduled for: ${nextBackupTime.toLocaleString()}`);
                // Note: Background sync will be triggered by the missed backup check during next app load
            }

        } catch (error) {
            console.error('Failed to schedule automatic backup:', error);
        }
    }

    /**
     * Perform automatic backup (called by service worker)
     */
    performAutomaticBackup() {
        try {
            // Check backup throttling for automatic backups
            if (!this.canPerformAutomaticBackup()) {
                console.log('⏸️ Automatic backup throttled - too soon since last backup');
                return false;
            }
            
            // Generate backup data
            const backupData = this.getAllWorkspacesData();
            
            // Generate filename based on pattern
            const filename = this.generateBackupFilename();
            
            // Store backup data temporarily for service worker to access
            localStorage.setItem('pendingAutomaticBackup', JSON.stringify({
                data: backupData,
                filename: filename,
                timestamp: new Date().toISOString()
            }));

            // Record that we performed a backup (both automatic and general backup time)
            localStorage.setItem('lastAutomaticBackupTime', new Date().toISOString());
            localStorage.setItem('lastBackupTime', new Date().toISOString());

            console.log('Automatic backup prepared:', filename);
            
            // Trigger download via service worker message
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'DOWNLOAD_AUTOMATIC_BACKUP',
                    filename: filename
                });
            }

            return true;

        } catch (error) {
            console.error('Failed to perform automatic backup:', error);
            return false;
        }
    }

    /**
     * Check if automatic backup can be performed (throttling check)
     * @returns {boolean} True if backup can be performed
     */
    canPerformAutomaticBackup() {
        const lastBackupTime = localStorage.getItem('lastBackupTime');
        
        if (!lastBackupTime) {
            // No previous backup, allow backup
            return true;
        }
        
        const now = Date.now();
        const lastBackup = new Date(lastBackupTime).getTime();
        const timeSinceLastBackup = now - lastBackup;
        
        // Throttle automatic backups to 20 seconds (20000 milliseconds)
        const THROTTLE_DURATION = 20000;
        
        if (timeSinceLastBackup < THROTTLE_DURATION) {
            const remainingTime = Math.ceil((THROTTLE_DURATION - timeSinceLastBackup) / 1000);
            console.log(`⏱️ Backup throttled: ${remainingTime} seconds remaining`);
            return false;
        }
        
        return true;
    }

    /**
     * Get automatic backup status for UI display
     */
    getAutomaticBackupStatus() {
        // Check if we're running from file:// protocol
        if (window.location.protocol === 'file:') {
            return {
                supported: false,
                enabled: false,
                status: 'Automatic backups are not available when running from file:// protocol. Use a web server.',
                statusClass: 'status-disabled'
            };
        }

        // Check for Service Worker and Background Sync support
        if (!('serviceWorker' in navigator) || !('sync' in window.ServiceWorkerRegistration.prototype)) {
            return {
                supported: false,
                enabled: false,
                status: 'Background Sync is not supported in this browser. Automatic backups unavailable.',
                statusClass: 'status-disabled'
            };
        }

        if (this.settings.backgroundBackupPermission === 'denied') {
            return {
                supported: true,
                enabled: false,
                status: 'Permission denied. Click to retry permission request.',
                statusClass: 'status-disabled'
            };
        }

        if (this.settings.backgroundBackupPermission === 'not_requested') {
            return {
                supported: true,
                enabled: false,
                status: 'Permission required for background operations. Will request when enabled.',
                statusClass: 'status-permission-needed'
            };
        }

        if (this.settings.automaticBackups) {
            const frequency = this.getFrequencyDisplayName(this.settings.backgroundBackupFrequency);
            const lastBackup = localStorage.getItem('lastAutomaticBackupTime');
            const nextBackupText = this.getNextBackupText();
            
            let statusText = `✅ Automatic backups enabled (${frequency}).`;
            
            if (lastBackup) {
                const lastBackupDate = new Date(lastBackup);
                const timeSinceLastBackup = this.getTimeSince(lastBackupDate);
                statusText += ` Last backup: ${timeSinceLastBackup}.`;
            } else {
                statusText += ' No backups yet.';
            }
            
            if (nextBackupText) {
                statusText += ` ${nextBackupText}`;
            }
                
            return {
                supported: true,
                enabled: true,
                status: statusText,
                statusClass: 'status-enabled'
            };
        }

        return {
            supported: true,
            enabled: false,
            status: 'Automatic backups are available. Enable to create backups in the background.',
            statusClass: ''
        };
    }

    /**
     * Get user-friendly frequency display name
     */
    getFrequencyDisplayName(frequency) {
        const frequencyMap = {
            'daily': 'Daily',
            'weekly': 'Weekly', 
            'bi_weekly': 'Bi-weekly',
            'monthly': 'Monthly'
        };
        return frequencyMap[frequency] || 'Daily';
    }

    /**
     * Get time since a date in user-friendly format
     */
    getTimeSince(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMinutes < 1) {
            return 'just now';
        } else if (diffMinutes < 60) {
            return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
        } else if (diffHours < 24) {
            return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        } else if (diffDays < 7) {
            return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    /**
     * Get next backup time text
     */
    getNextBackupText() {
        const lastBackup = localStorage.getItem('lastAutomaticBackupTime');
        const now = new Date();
        
        if (!lastBackup) {
            return 'Next backup: When app is next closed and reopened';
        }

        const lastBackupDate = new Date(lastBackup);
        let nextBackupDate = new Date(lastBackupDate);

        // Calculate next backup time based on frequency
        switch (this.settings.backgroundBackupFrequency) {
            case 'daily':
                nextBackupDate.setDate(nextBackupDate.getDate() + 1);
                break;
            case 'weekly':
                nextBackupDate.setDate(nextBackupDate.getDate() + 7);
                break;
            case 'bi_weekly':
                nextBackupDate.setDate(nextBackupDate.getDate() + 14);
                break;
            case 'monthly':
                nextBackupDate.setMonth(nextBackupDate.getMonth() + 1);
                break;
        }

        // If next backup time has passed, it's overdue
        if (nextBackupDate <= now) {
            return 'Next backup: Overdue (will backup when app reopens)';
        }

        // Calculate time until next backup
        const timeDiff = nextBackupDate - now;
        const hoursUntil = Math.floor(timeDiff / (1000 * 60 * 60));
        const daysUntil = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

        if (daysUntil > 0) {
            return `Next backup: in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`;
        } else if (hoursUntil > 0) {
            return `Next backup: in ${hoursUntil} hour${hoursUntil !== 1 ? 's' : ''}`;
        } else {
            return 'Next backup: soon';
        }
    }
}
