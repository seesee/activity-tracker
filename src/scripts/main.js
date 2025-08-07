/**
 * Main initialization and global functions for Activity Tracker
 * This file handles app initialization, global event handlers, and UI functions
 */

// Global tracker instance
let tracker;

/**
 * Show a specific section and update navigation
 * @param {string} sectionName - Name of section to show
 * @param {Event} event - Click event (optional)
 */
function showSection(sectionName, event) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show target section
    document.getElementById(sectionName).classList.add('active');

    // Update navigation buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    if (event && event.target) {
        event.target.classList.add('active');
    } else {
        const button = document.querySelector(`.nav-btn[onclick*="'${sectionName}'"]`);
        if (button) {
            button.classList.add('active');
        }
    }

    // Focus on entry input when showing tracker, todo, or notes (if form is visible)
    if (sectionName === 'tracker' || sectionName === 'todo' || sectionName === 'notes') {
        setTimeout(() => {
            const inputId = sectionName === 'tracker' ? 'activity' : 
                           sectionName === 'todo' ? 'todoActivity' : 'notesActivity';
            const input = document.getElementById(inputId);
            const component = document.getElementById(`${sectionName}EntryComponent`);
            
            // Only focus if the form is visible (not collapsed)
            if (input && component && !component.classList.contains('collapsed')) {
                input.focus();
            }
        }, 100);
    }

    // Auto-generate report if switching to reports tab and it's empty
    if (sectionName === 'reports') {
        const reportResults = document.getElementById('reportResults');
        if (tracker && (!reportResults || !reportResults.innerHTML.trim())) {
            tracker.setWeeklyReport(); // This will now auto-generate
        }
    }
}

/**
 * Add current time to timestamp input
 */
function addCurrentTime() {
    if (tracker) {
        tracker.setCurrentTime();
    }
}

/**
 * Generate sound option elements for dropdowns
 * @param {Array} excludeSounds - Array of sound keys to exclude (e.g., tick sounds)
 * @param {string} selectedValue - Currently selected value
 * @returns {string} HTML string of option elements
 */
function generateSoundOptions(excludeSounds = [], selectedValue = '') {
    // Get all available sounds from SoundManager
    const allSounds = {
        'classic': 'Classic Bloop',
        'gentle': 'Gentle Chime', 
        'urgent': 'Urgent Ping',
        'digital': 'Digital Beep',
        'nature': 'Nature Drop',
        'mechanical': 'Mechanical Click',
        'spacey': 'Spacey Wobble',
        'corporate': 'Corporate Ding',
        'retro': 'Retro Arcade',
        'piano': 'Piano Note',
        'bell': 'Temple Bell',
        'whistle': 'Train Whistle',
        'bubble': 'Bubble Pop',
        'glass': 'Glass Tap',
        'wood': 'Wood Block',
        'metal': 'Metal Ting',
        'ethereal': 'Ethereal Hum',
        'cosmic': 'Cosmic Blip',
        'ocean': 'Ocean Wave',
        'forest': 'Forest Chirp',
        'failsafe': 'Failsafe'
    };
    
    return Object.entries(allSounds)
        .filter(([key]) => !excludeSounds.includes(key))
        .sort(([, nameA], [, nameB]) => nameA.localeCompare(nameB))
        .map(([key, name]) => {
            const selected = key === selectedValue ? ' selected' : '';
            return `<option value="${key}"${selected}>${name}</option>`;
        })
        .join('');
}

/**
 * Generate report based on selected dates
 */
function generateReport() {
    if (tracker) {
        tracker.generateReport();
    }
}

/**
 * Set report to current week
 */
function setWeeklyReport() {
    if (tracker) {
        tracker.setWeeklyReport();
    }
}

/**
 * Navigate to previous week in reports
 */
function previousWeek() {
    if (tracker) {
        tracker.previousWeek();
    }
}

/**
 * Navigate to next week in reports
 */
function nextWeek() {
    if (tracker) {
        tracker.nextWeek();
    }
}

/**
 * Download current report
 */
function downloadReport() {
    if (tracker) {
        tracker.downloadReport();
    }
}

/**
 * Open report in new tab
 */
function openReportInNewTab() {
    if (tracker) {
        tracker.openReportInNewTab();
    }
}

/**
 * Save settings
 */
function saveSettings() {
    if (tracker) {
        tracker.saveSettings();
    }
}

/**
 * Enable notifications
 */
function enableNotifications() {
    if (tracker) {
        tracker.toggleActivityReminders();
    }
}

/**
 * Test notification
 */
function testNotification() {
    if (tracker) {
        tracker.testNotification();
    }
}

/**
 * Test notification sound
 */
function testNotificationSound() {
    if (tracker) {
        tracker.testNotificationSound();
    }
}

/**
 * Preview notification sound when selection changes
 */
function previewNotificationSound() {
    const soundType = document.getElementById('notificationSoundType').value;
    
    if (tracker && tracker.soundManager && !tracker.isNotificationSoundMuted()) {
        tracker.soundManager.playSound(soundType, false);
    }
}

/**
 * Show template guide modal
 */
function showTemplateGuide() {
    const modal = document.getElementById('templateGuideModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

/**
 * Close template guide modal
 */
function closeTemplateGuide() {
    const modal = document.getElementById('templateGuideModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Show About modal
 */
function showAbout() {
    const modal = document.getElementById('aboutModal');
    if (modal) {
        modal.style.display = 'block';
        // Update debug info when modal opens
        if (tracker) {
            tracker.updateAboutDebugInfo();
        }
        // Update copyright year
        updateCopyrightYear();
    }
}

/**
 * Update the copyright year display with dynamic range
 */
function updateCopyrightYear() {
    const startYear = 2025;
    const currentYear = new Date().getFullYear();
    
    let yearText;
    if (currentYear === startYear) {
        yearText = startYear.toString();
    } else if (currentYear > startYear) {
        yearText = `${startYear}-${currentYear}`;
    } else {
        // Fallback for years before 2025 (shouldn't happen in practice)
        yearText = startYear.toString();
    }
    
    // Update both copyright year elements
    const copyrightYearElement = document.getElementById('copyrightYear');
    if (copyrightYearElement) {
        copyrightYearElement.textContent = yearText;
    }
    
    const copyrightYearRangeElement = document.getElementById('copyrightYearRange');
    if (copyrightYearRangeElement) {
        copyrightYearRangeElement.textContent = yearText;
    }
}

/**
 * Position burger menu relative to anchor element
 */
function positionBurgerMenu() {
    const burgerMenu = document.querySelector('.burger-menu');
    const burgerAnchor = document.getElementById('burgerAnchor');
    
    if (!burgerMenu || !burgerAnchor) return;
    
    // Ensure the anchor is visible and has layout
    if (!burgerAnchor.offsetParent && burgerAnchor.style.display !== 'block') {
        return;
    }
    
    const anchorRect = burgerAnchor.getBoundingClientRect();
    
    // Check if anchor has valid dimensions
    if (anchorRect.width === 0 && anchorRect.height === 0) {
        return;
    }
    
    // Position burger menu relative to the anchor with some offset
    const topPosition = Math.max(0, anchorRect.top + 10);
    const rightPosition = Math.max(10, window.innerWidth - anchorRect.right + 10);
    
    burgerMenu.style.top = `${topPosition}px`;
    burgerMenu.style.right = `${rightPosition}px`;
    
    // Ensure burger menu is visible after positioning
    burgerMenu.style.visibility = 'visible';
    burgerMenu.style.opacity = '1';
}

/**
 * Close About modal
 */
function closeAbout() {
    const modal = document.getElementById('aboutModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Request notification permission (called from HTML)
 */
function requestNotificationPermission() {
    if (tracker) {
        tracker.requestNotificationPermission();
    }
}

/**
 * Decline notification permission (called from HTML)
 */
function declineNotificationPermission() {
    if (tracker) {
        tracker.declineNotificationPermission();
    }
}

/**
 * Force enable notification capability for diagnostics
 */
function forceEnableNotifications() {
    if (tracker) {
        tracker.forceEnableNotificationCapability();
    }
}

/**
 * Show User Guide modal
 */
function showUserGuide() {
    const modal = document.getElementById('userGuideModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

/**
 * Close User Guide modal
 */
function closeUserGuide() {
    const modal = document.getElementById('userGuideModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Set due date using quick-set buttons
 * @param {string} period - 'tomorrow', 'nextWeek', or 'nextMonth'
 */
function setDueDate(period) {
    const dueDateInput = document.getElementById('dueDate');
    if (!dueDateInput) return;

    const now = new Date();
    let targetDate;

    switch (period) {
        case 'tomorrow':
            targetDate = new Date(now);
            targetDate.setDate(now.getDate() + 1);
            targetDate.setHours(9, 0, 0, 0); // Set to 9 AM
            break;
        case 'nextWeek':
            targetDate = new Date(now);
            targetDate.setDate(now.getDate() + 7);
            targetDate.setHours(9, 0, 0, 0); // Set to 9 AM
            break;
        case 'nextMonth':
            targetDate = new Date(now);
            targetDate.setMonth(now.getMonth() + 1);
            targetDate.setHours(9, 0, 0, 0); // Set to 9 AM
            break;
        default:
            return;
    }

    dueDateInput.value = targetDate.toISOString().slice(0, 16);
}

/**
 * Set due date using quick-set buttons for edit modal
 * @param {string} period - 'tomorrow', 'nextWeek', or 'nextMonth'
 */
function setEditDueDate(period) {
    const dueDateInput = document.getElementById('editDueDate');
    if (!dueDateInput) return;

    const now = new Date();
    let targetDate;

    switch (period) {
        case 'tomorrow':
            targetDate = new Date(now);
            targetDate.setDate(now.getDate() + 1);
            targetDate.setHours(9, 0, 0, 0); // Set to 9 AM
            break;
        case 'nextWeek':
            targetDate = new Date(now);
            targetDate.setDate(now.getDate() + 7);
            targetDate.setHours(9, 0, 0, 0); // Set to 9 AM
            break;
        case 'nextMonth':
            targetDate = new Date(now);
            targetDate.setMonth(now.getMonth() + 1);
            targetDate.setHours(9, 0, 0, 0); // Set to 9 AM
            break;
        default:
            return;
    }

    dueDateInput.value = targetDate.toISOString().slice(0, 16);
}

/**
 * Copy report content to clipboard
 */
function copyReportToClipboard() {
    const reportPreview = document.getElementById('reportPreview');
    const isRenderedView = document.getElementById('reportPreviewTabRendered').classList.contains('active');
    
    let textToCopy = '';
    
    if (isRenderedView) {
        // For rendered view, try to get clean text content
        const iframe = reportPreview.querySelector('iframe');
        if (iframe && iframe.contentDocument) {
            textToCopy = iframe.contentDocument.body.innerText || iframe.contentDocument.body.textContent;
        } else {
            textToCopy = reportPreview.innerText || reportPreview.textContent;
        }
    } else {
        // For source view, get the raw content
        textToCopy = reportPreview.innerText || reportPreview.textContent;
    }
    
    if (textToCopy && textToCopy.trim()) {
        navigator.clipboard.writeText(textToCopy).then(() => {
            showNotification('Report copied to clipboard!', 'success');
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = textToCopy;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showNotification('Report copied to clipboard!', 'success');
        });
    } else {
        showNotification('No report content to copy', 'error');
    }
}

/**
 * Refresh notification status
 */
function refreshNotificationStatus() {
    if (tracker) {
        tracker.refreshNotificationStatus();
    }
}

/**
 * Clear all application data
 */
function clearAllData() {
    if (tracker) {
        tracker.clearAllData();
    }
}

/**
 * Close edit modal
 */
function closeEditModal() {
    if (tracker) {
        tracker.closeEditModal();
    }
}

/**
 * Close modal by ID
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Show hashtag browser modal with cloud visualization
 */
function showHashtagBrowser() {
    const modal = document.getElementById('hashtagBrowserModal');
    if (!modal) return;
    
    // Generate hashtag cloud
    const hashtagFrequency = tracker.getHashtagFrequency();
    const cloudContainer = modal.querySelector('.hashtag-cloud');
    const countElement = modal.querySelector('#hashtagCount');
    
    const hashtagCount = Object.keys(hashtagFrequency).length;
    
    // Update count display
    if (countElement) {
        countElement.textContent = `${hashtagCount} hashtag${hashtagCount !== 1 ? 's' : ''} found`;
    }
    
    if (hashtagCount === 0) {
        cloudContainer.innerHTML = '<p class="empty-state">No hashtags found. Add activities with #hashtags to see them here!</p>';
    } else {
        const maxFreq = Math.max(...Object.values(hashtagFrequency));
        const minFreq = Math.min(...Object.values(hashtagFrequency));
        const range = maxFreq - minFreq || 1;
        
        const hashtagElements = Object.entries(hashtagFrequency)
            .sort(([,a], [,b]) => b - a) // Sort by frequency desc
            .map(([tag, freq]) => {
                const normalized = (freq - minFreq) / range;
                const fontSize = 0.8 + (normalized * 1.2); // 0.8em to 2.0em
                const opacity = 0.6 + (normalized * 0.4); // 0.6 to 1.0
                
                return `<span class="hashtag-cloud-item" 
                              style="font-size: ${fontSize}em; opacity: ${opacity};"
                              onclick="tracker.searchByHashtag('${tag}'); closeModal('hashtagBrowserModal');"
                              title="${freq} occurrence${freq !== 1 ? 's' : ''}">#${tag}</span>`;
            })
            .join(' ');
        
        cloudContainer.innerHTML = hashtagElements;
    }
    
    modal.style.display = 'block';
}

/**
 * Close hashtag browser modal
 */
function closeHashtagBrowser() {
    closeModal('hashtagBrowserModal');
}

/**
 * Toggle todo mode for activity form
 */
function toggleTodoMode() {
    const btn = document.getElementById('todoToggleBtn');
    if (!btn) return;
    
    const isActive = btn.classList.contains('active');
    const dueDateSection = document.getElementById('dueDateSection');
    
    if (isActive) {
        btn.classList.remove('active');
        btn.textContent = 'Mark as Todo';
        // Hide due date section when not in todo mode
        if (dueDateSection) {
            dueDateSection.style.display = 'none';
        }
    } else {
        btn.classList.add('active');
        btn.textContent = '✓ Todo';
        // Show due date section when in todo mode
        if (dueDateSection) {
            dueDateSection.style.display = 'block';
        }
    }
    
    // Update form labels and examples
    updateFormLabelsAndExamples('tracker');
}

/**
 * Check if todo mode is active
 */
function isTodoModeActive() {
    const btn = document.getElementById('todoToggleBtn');
    return btn ? btn.classList.contains('active') : false;
}

/**
 * Toggle note mode for activity form
 */
function toggleNoteMode() {
    const btn = document.getElementById('noteToggleBtn');
    if (!btn) return;
    
    const isActive = btn.classList.contains('active');
    
    if (isActive) {
        btn.classList.remove('active');
        btn.textContent = 'Mark as Note';
    } else {
        btn.classList.add('active');
        btn.textContent = '✓ Note';
    }
    
    // Update form labels and examples
    updateFormLabelsAndExamples('tracker');
}

/**
 * Check if note mode is active
 */
function isNoteModeActive() {
    const btn = document.getElementById('noteToggleBtn');
    return btn ? btn.classList.contains('active') : false;
}

/**
 * Update form labels and placeholders based on current mode flags
 */
function updateFormLabelsAndExamples(context = 'tracker') {
    const isTodo = context === 'tracker' ? isTodoModeActive() : 
                   context === 'todo' ? document.getElementById('todoTodoToggleBtn')?.classList.contains('active') :
                   document.getElementById('notesTodToggleBtn')?.classList.contains('active');
    
    const isNote = context === 'tracker' ? isNoteModeActive() :
                   context === 'todo' ? document.getElementById('todoNoteToggleBtn')?.classList.contains('active') :
                   document.getElementById('notesNoteToggleBtn')?.classList.contains('active');
    
    let prefix = context === 'tracker' ? '' : context;
    let titleElement, activityLabel, activityInput, descriptionLabel, descriptionInput, addButton;
    
    if (context === 'tracker') {
        titleElement = document.getElementById('entryTitle');
        activityLabel = document.getElementById('activityLabel');
        activityInput = document.getElementById('activity');
        descriptionLabel = document.getElementById('descriptionLabel');
        descriptionInput = document.getElementById('description');
        addButton = document.getElementById('addEntryBtn');
    } else if (context === 'todo') {
        titleElement = document.getElementById('todoEntryTitle');
        activityLabel = document.getElementById('todoActivityLabel');
        activityInput = document.getElementById('todoActivity');
        descriptionLabel = document.getElementById('todoDescriptionLabel');
        descriptionInput = document.getElementById('todoDescription');
        addButton = document.getElementById('todoAddEntryBtn');
    } else if (context === 'notes') {
        titleElement = document.getElementById('notesEntryTitle');
        activityLabel = document.getElementById('notesActivityLabel');
        activityInput = document.getElementById('notesActivity');
        descriptionLabel = document.getElementById('notesDescriptionLabel');
        descriptionInput = document.getElementById('notesDescription');
        addButton = document.getElementById('notesAddEntryBtn');
    }
    
    // Update based on flag combinations
    if (isTodo && isNote) {
        // Both flags active - Todo Note
        if (titleElement) titleElement.textContent = context === 'tracker' ? 'New Todo Note' : 'New Todo Note';
        if (activityLabel) activityLabel.textContent = 'What do you need to note and do?';
        if (activityInput) activityInput.placeholder = 'e.g., Research budget options, Review meeting agenda #work';
        if (descriptionLabel) descriptionLabel.textContent = 'Note details and todo description';
        if (descriptionInput) descriptionInput.placeholder = 'Capture your notes and describe what needs to be done...';
        if (addButton) addButton.textContent = 'Add Todo Note';
    } else if (isTodo) {
        // Only todo flag active
        if (titleElement) titleElement.textContent = context === 'tracker' ? 'New Todo Item' : 'New Todo Item';
        if (activityLabel) activityLabel.textContent = 'What do you need to do?';
        if (activityInput) activityInput.placeholder = 'e.g., Call client about project, Review budget #work';
        if (descriptionLabel) descriptionLabel.textContent = 'Todo description (optional)';
        if (descriptionInput) descriptionInput.placeholder = 'Additional details about this task, steps needed, context...';
        if (addButton) addButton.textContent = 'Add Todo';
    } else if (isNote) {
        // Only note flag active
        if (titleElement) titleElement.textContent = context === 'tracker' ? 'New Note' : 'New Note';
        if (activityLabel) activityLabel.textContent = 'Note title or topic';
        if (activityInput) activityInput.placeholder = 'e.g., Meeting notes, Ideas for project #brainstorm';
        if (descriptionLabel) descriptionLabel.textContent = 'Note content';
        if (descriptionInput) descriptionInput.placeholder = 'Write your note content, ideas, observations, or thoughts here...';
        if (addButton) addButton.textContent = 'Add Note';
    } else {
        // Neither flag active - regular activity
        if (titleElement) titleElement.textContent = context === 'tracker' ? 'Activity Entry' : 'New Activity';
        if (activityLabel) activityLabel.textContent = 'What are you doing?';
        if (activityInput) activityInput.placeholder = 'e.g., Writing report, Meeting with team #work';
        if (descriptionLabel) descriptionLabel.textContent = 'Description (optional)';
        if (descriptionInput) descriptionInput.placeholder = 'Additional details about this activity...';
        if (addButton) addButton.textContent = 'Add Entry';
    }
}

// === Todo Section Toggle Functions ===

/**
 * Toggle todo mode for todo section form
 */
function toggleTodoModeForTodo() {
    const btn = document.getElementById('todoTodoToggleBtn');
    if (!btn) return;
    
    const isActive = btn.classList.contains('active');
    const dueDateSection = document.getElementById('todoDueDateSection');
    
    if (isActive) {
        btn.classList.remove('active');
        btn.textContent = 'Mark as Todo';
        if (dueDateSection) dueDateSection.style.display = 'none';
    } else {
        btn.classList.add('active');
        btn.textContent = '✓ Todo';
        if (dueDateSection) dueDateSection.style.display = 'block';
    }
    
    updateFormLabelsAndExamples('todo');
}

/**
 * Toggle note mode for todo section form
 */
function toggleNoteModeForTodo() {
    const btn = document.getElementById('todoNoteToggleBtn');
    if (!btn) return;
    
    const isActive = btn.classList.contains('active');
    
    if (isActive) {
        btn.classList.remove('active');
        btn.textContent = 'Mark as Note';
    } else {
        btn.classList.add('active');
        btn.textContent = '✓ Note';
    }
    
    updateFormLabelsAndExamples('todo');
}

// === Notes Section Toggle Functions ===

/**
 * Toggle todo mode for notes section form
 */
function toggleTodoModeForNotes() {
    const btn = document.getElementById('notesTodToggleBtn');
    if (!btn) return;
    
    const isActive = btn.classList.contains('active');
    const dueDateSection = document.getElementById('notesDueDateSection');
    
    if (isActive) {
        btn.classList.remove('active');
        btn.textContent = 'Mark as Todo';
        if (dueDateSection) dueDateSection.style.display = 'none';
    } else {
        btn.classList.add('active');
        btn.textContent = '✓ Todo';
        if (dueDateSection) dueDateSection.style.display = 'block';
    }
    
    updateFormLabelsAndExamples('notes');
}

/**
 * Toggle note mode for notes section form
 */
function toggleNoteModeForNotes() {
    const btn = document.getElementById('notesNoteToggleBtn');
    if (!btn) return;
    
    const isActive = btn.classList.contains('active');
    
    if (isActive) {
        btn.classList.remove('active');
        btn.textContent = 'Mark as Note';
    } else {
        btn.classList.add('active');
        btn.textContent = '✓ Note';
    }
    
    updateFormLabelsAndExamples('notes');
}

// === Helper Functions for New Forms ===

/**
 * Adjust due date by adding or subtracting time periods
 * @param {string} inputId - ID of the datetime input field
 * @param {number} amount - Amount to adjust (positive or negative)
 * @param {string} unit - 'day', 'week', or 'month'
 */
function adjustDueDate(inputId, amount, unit) {
    const dueDateInput = document.getElementById(inputId);
    if (!dueDateInput) return;

    // Use current date from input field, or current time if empty
    let baseDate;
    if (dueDateInput.value) {
        baseDate = new Date(dueDateInput.value);
    } else {
        baseDate = new Date();
        baseDate.setHours(9, 0, 0, 0); // Default to 9 AM for new dates
    }

    let newDate = new Date(baseDate);

    switch (unit) {
        case 'day':
            newDate.setDate(baseDate.getDate() + amount);
            break;
        case 'week':
            newDate.setDate(baseDate.getDate() + (amount * 7));
            break;
        case 'month':
            newDate.setMonth(baseDate.getMonth() + amount);
            break;
        default:
            return;
    }

    dueDateInput.value = newDate.toISOString().slice(0, 16);
}

/**
 * Set due date for todo form
 */
function setDueDateForTodo(preset) {
    setDueDatePreset('todoDueDate', preset);
}

/**
 * Set due date for notes form
 */
function setDueDateForNotes(preset) {
    setDueDatePreset('notesDueDate', preset);
}

/**
 * Add current time for todo form
 */
function addCurrentTimeForTodo() {
    setCurrentDateTime('todoTimestamp');
}

/**
 * Add current time for notes form
 */
function addCurrentTimeForNotes() {
    setCurrentDateTime('notesTimestamp');
}

/**
 * Update due date section visibility for main activity form
 */
function updateDueDateSectionVisibility() {
    const todoBtn = document.getElementById('todoToggleBtn');
    const dueDateSection = document.getElementById('dueDateSection');
    
    if (dueDateSection) {
        // Show due date section only if todo mode is active
        if (todoBtn && todoBtn.classList.contains('active')) {
            dueDateSection.style.display = 'block';
        } else {
            dueDateSection.style.display = 'none';
        }
    }
}

/**
 * Reset activity form to defaults
 */
function resetActivityForm() {
    const form = document.getElementById('activityForm');
    if (form) {
        // Clear due date first (before form.reset() which might not clear datetime-local properly)
        const dueDateInput = document.getElementById('dueDate');
        if (dueDateInput) {
            dueDateInput.value = '';
        }
        
        form.reset();
        
        // Set timestamp to current time
        setCurrentDateTime('timestamp');
        
        // Explicitly clear due date again to ensure it's null
        if (dueDateInput) {
            dueDateInput.value = '';
        }
        
        // Reset todo/note buttons
        const todoBtn = document.getElementById('todoToggleBtn');
        const noteBtn = document.getElementById('noteToggleBtn');
        if (todoBtn) {
            todoBtn.classList.remove('active');
            todoBtn.textContent = 'Mark as Todo';
        }
        if (noteBtn) {
            noteBtn.classList.remove('active');
            noteBtn.textContent = 'Mark as Note';
        }
        // Reset due date section visibility
        updateDueDateSectionVisibility();
    }
}

/**
 * Reset todo form to defaults
 */
function resetTodoForm() {
    const form = document.getElementById('todoActivityForm');
    if (form) {
        // Clear due date first (before form.reset() which might not clear datetime-local properly)
        const dueDateInput = document.getElementById('todoDueDate');
        if (dueDateInput) {
            dueDateInput.value = '';
        }
        
        form.reset();
        
        // Set timestamp to current time
        setCurrentDateTime('todoTimestamp');
        
        // Explicitly clear due date again to ensure it's null
        if (dueDateInput) {
            dueDateInput.value = '';
        }
        
        // Reset todo/note buttons but keep todo active (this is the todo section)
        const todoBtn = document.getElementById('todoTodoToggleBtn');
        const noteBtn = document.getElementById('todoNoteToggleBtn');
        if (todoBtn) {
            todoBtn.classList.add('active');
            todoBtn.textContent = 'Mark as Todo ✓';
        }
        if (noteBtn) {
            noteBtn.classList.remove('active');
            noteBtn.textContent = 'Mark as Note';
        }
        // Keep due date section visible since todo mode is active
        const dueDateSection = document.getElementById('todoDueDateSection');
        if (dueDateSection) {
            dueDateSection.style.display = 'block';
        }
    }
}

/**
 * Reset notes form to defaults
 */
function resetNotesForm() {
    const form = document.getElementById('notesActivityForm');
    if (form) {
        // Clear due date first (before form.reset() which might not clear datetime-local properly)
        const dueDateInput = document.getElementById('notesDueDate');
        if (dueDateInput) {
            dueDateInput.value = '';
        }
        
        form.reset();
        
        // Set timestamp to current time
        setCurrentDateTime('notesTimestamp');
        
        // Explicitly clear due date again to ensure it's null
        if (dueDateInput) {
            dueDateInput.value = '';
        }
        
        // Reset todo/note buttons but keep note active (this is the notes section)
        const todoBtn = document.getElementById('notesTodToggleBtn');
        const noteBtn = document.getElementById('notesNoteToggleBtn');
        if (todoBtn) {
            todoBtn.classList.remove('active');
            todoBtn.textContent = 'Mark as Todo';
        }
        if (noteBtn) {
            noteBtn.classList.add('active');
            noteBtn.textContent = 'Mark as Note ✓';
        }
        // Hide due date section since notes don't use due dates by default
        const dueDateSection = document.getElementById('notesDueDateSection');
        if (dueDateSection) {
            dueDateSection.style.display = 'none';
        }
    }
}

/**
 * Initialize all form timestamps to current time on page load
 */
function initializeFormTimestamps() {
    // Set all timestamp fields to current time
    const timestampFields = ['timestamp', 'todoTimestamp', 'notesTimestamp'];
    timestampFields.forEach(fieldId => {
        setCurrentDateTime(fieldId);
    });
}

/**
 * Set current date/time for any field
 */
function setCurrentDateTime(fieldId) {
    const field = document.getElementById(fieldId);
    if (field) {
        const now = new Date();
        field.value = now.toISOString().slice(0, 16);
    }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// === Due Date System ===

/**
 * Format time remaining until due date in human-friendly format
 */
function formatTimeUntilDue(dueDate) {
    if (!dueDate) return null;
    
    const now = new Date();
    const due = new Date(dueDate);
    const diffMs = due.getTime() - now.getTime();
    
    // If overdue
    if (diffMs < 0) {
        const overdueDiffMs = Math.abs(diffMs);
        const overdueDays = Math.floor(overdueDiffMs / (1000 * 60 * 60 * 24));
        const overdueHours = Math.floor((overdueDiffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const overdueMinutes = Math.floor((overdueDiffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        if (overdueDays > 0) {
            return `${overdueDays} day${overdueDays === 1 ? '' : 's'} overdue`;
        } else if (overdueHours > 0) {
            return `${overdueHours} hour${overdueHours === 1 ? '' : 's'} overdue`;
        } else if (overdueMinutes > 0) {
            return `${overdueMinutes} minute${overdueMinutes === 1 ? '' : 's'} overdue`;
        } else {
            return 'Just overdue';
        }
    }
    
    // Time remaining
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
        return `${days} day${days === 1 ? '' : 's'} till due`;
    } else if (hours > 0) {
        return `${hours} hour${hours === 1 ? '' : 's'} till due`;
    } else if (minutes > 0) {
        return `${minutes} minute${minutes === 1 ? '' : 's'} till due`;
    } else {
        return 'Due now';
    }
}

/**
 * Check if an item is overdue
 */
function isOverdue(dueDate) {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
}

/**
 * Get overdue items sorted by most overdue first
 */
function getOverdueItems() {
    if (!tracker || !tracker.entries) return [];
    
    const overdueItems = tracker.entries.filter(entry => 
        entry.dueDate && entry.isTodo && isOverdue(entry.dueDate)
    );
    
    // Sort by most overdue first (oldest due date first)
    return overdueItems.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
}

/**
 * Update overdue alert button visibility
 */
function updateOverdueAlertButton() {
    const alertButton = document.getElementById('overdueAlertButton');
    if (!alertButton) return;
    
    const overdueItems = getOverdueItems();
    
    if (overdueItems.length > 0) {
        alertButton.style.display = '';
        alertButton.textContent = `⚠️ Alert (${overdueItems.length})`;
        alertButton.title = `${overdueItems.length} item${overdueItems.length === 1 ? '' : 's'} overdue`;
    } else {
        alertButton.style.display = 'none';
    }
}

/**
 * Show overdue alert modal
 */
function showOverdueAlert() {
    const modal = document.getElementById('overdueAlertModal');
    const itemsList = document.getElementById('overdueItemsList');
    
    if (!modal || !itemsList) return;
    
    const overdueItems = getOverdueItems();
    
    // Clear existing content
    itemsList.innerHTML = '';
    
    if (overdueItems.length === 0) {
        itemsList.innerHTML = '<p>No overdue items.</p>';
    } else {
        overdueItems.forEach(item => {
            const timeOverdue = formatTimeUntilDue(item.dueDate);
            const overdueDays = Math.floor((Date.now() - new Date(item.dueDate).getTime()) / (1000 * 60 * 60 * 24));
            const isCritical = overdueDays >= 7; // 7+ days overdue is critical
            
            const itemElement = document.createElement('div');
            itemElement.className = `overdue-item${isCritical ? ' critical' : ''}`;
            
            itemElement.innerHTML = `
                <div class="overdue-item-content" onclick="navigateToOverdueItem('${item.id}')">
                    <div class="overdue-item-header">
                        <h4 class="overdue-item-title">${escapeHtml(item.activity)}</h4>
                        <span class="overdue-time">${timeOverdue}</span>
                    </div>
                    ${item.description ? `<div class="overdue-item-description">${escapeHtml(item.description)}</div>` : ''}
                    <div class="overdue-item-due-date">
                        Due: ${new Date(item.dueDate).toLocaleString()}
                    </div>
                </div>
                <div class="overdue-item-actions">
                    <button class="btn btn-success btn-small" onclick="event.stopPropagation(); markOverdueItemComplete('${item.id}')" title="Mark as completed">✓ Complete</button>
                    <div class="reschedule-dropdown">
                        <button class="btn btn-secondary btn-small reschedule-btn" onclick="event.stopPropagation(); toggleRescheduleOptions('${item.id}')" title="Reschedule item">📅 Reschedule</button>
                        <div class="reschedule-options" id="reschedule-${item.id}" style="display: none;">
                            <button onclick="event.stopPropagation(); rescheduleOverdueItem('${item.id}', 'tomorrow')">Tomorrow</button>
                            <button onclick="event.stopPropagation(); rescheduleOverdueItem('${item.id}', 'next-week')">Next Week</button>
                            <button onclick="event.stopPropagation(); rescheduleOverdueItem('${item.id}', 'next-month')">Next Month</button>
                            <button onclick="event.stopPropagation(); rescheduleOverdueItemCustom('${item.id}')">Custom Date</button>
                        </div>
                    </div>
                </div>
            `;
            
            itemsList.appendChild(itemElement);
        });
    }
    
    modal.style.display = 'block';
}

/**
 * Close overdue alert modal
 */
function closeOverdueAlert() {
    const modal = document.getElementById('overdueAlertModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Mark an overdue item as complete
 */
function markOverdueItemComplete(itemId) {
    if (tracker) {
        tracker.completeEntry(itemId);
        // Refresh the overdue modal
        showOverdueAlert();
        // Update alert button state
        updateOverdueAlertButton();
        // Play sound if enabled
        if (tracker.soundManager && !tracker.isNotificationSoundMuted()) {
            tracker.soundManager.playSound('classic', false);
        }
    }
}

/**
 * Navigate to the section containing an overdue item
 */
function navigateToOverdueItem(itemId) {
    if (!tracker) return;
    
    const item = tracker.entries.find(entry => entry.id === itemId);
    if (!item) return;
    
    // Close the overdue modal
    closeOverdueAlert();
    
    // Navigate to appropriate section and find the correct page
    if (item.isTodo) {
        // Switch to todo section
        showSection('todo');
        // Find which page the item is on and navigate to it
        navigateToItemInSection('todo', itemId);
    } else if (item.isNote) {
        // Switch to notes section
        showSection('notes');
        // Find which page the item is on and navigate to it
        navigateToItemInSection('notes', itemId);
    } else {
        // Switch to tracker section for regular entries
        showSection('tracker');
        // Find which page the item is on and navigate to it
        navigateToItemInSection('tracker', itemId);
    }
}

/**
 * Navigate to a specific item in a section, handling pagination
 */
function navigateToItemInSection(section, itemId) {
    setTimeout(() => {
        // With overdue prioritization, overdue items should be on first pages
        // But let's be extra sure by checking if the item is visible
        let targetElement = document.querySelector(`[onclick*="${itemId}"]`);
        
        if (!targetElement) {
            // Item not visible on current page, it might be on another page
            // Since overdue items are now prioritized and shown first, 
            // this shouldn't happen for overdue items, but let's handle it anyway
            
            // Go to first page to look for overdue items
            if (section === 'todo' && tracker.todoPagination) {
                tracker.todoPagination.currentPage = 1;
                tracker.displayTodos();
            } else if (section === 'notes' && tracker.notesPagination) {
                tracker.notesPagination.currentPage = 1;
                tracker.displayNotes();
            } else if (section === 'tracker' && tracker.entriesPagination) {
                tracker.entriesPagination.currentPage = 1;
                tracker.displayEntries();
            }
            
            // Try to find the element again after refresh
            setTimeout(() => {
                targetElement = document.querySelector(`[onclick*="${itemId}"]`);
                if (targetElement) {
                    highlightAndScrollToElement(targetElement);
                }
            }, 100);
        } else {
            // Element is visible, just scroll to it
            highlightAndScrollToElement(targetElement);
        }
    }, 100);
}

/**
 * Highlight and scroll to a target element
 */
function highlightAndScrollToElement(element) {
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.style.background = '#fff3cd';
        element.style.transition = 'background-color 0.3s ease';
        setTimeout(() => {
            element.style.background = '';
            setTimeout(() => {
                element.style.transition = '';
            }, 300);
        }, 2000);
    }
}

/**
 * Toggle reschedule options dropdown for an overdue item
 */
function toggleRescheduleOptions(itemId) {
    const dropdown = document.getElementById(`reschedule-${itemId}`);
    if (!dropdown) return;
    
    // Close all other open dropdowns first
    document.querySelectorAll('.reschedule-options').forEach(option => {
        if (option.id !== `reschedule-${itemId}`) {
            option.style.display = 'none';
        }
    });
    
    // Toggle this dropdown with proper positioning
    if (dropdown.style.display === 'none' || !dropdown.style.display) {
        // Find the reschedule button that triggered this
        const rescheduleButton = document.querySelector(`[onclick*="toggleRescheduleOptions('${itemId}')"]`);
        if (rescheduleButton) {
            const rect = rescheduleButton.getBoundingClientRect();
            
            // Position dropdown relative to viewport
            dropdown.style.left = `${rect.left}px`;
            dropdown.style.top = `${rect.bottom + 5}px`;
            
            // Ensure dropdown doesn't go off-screen
            const dropdownRect = dropdown.getBoundingClientRect();
            if (rect.left + dropdownRect.width > window.innerWidth) {
                dropdown.style.left = `${window.innerWidth - dropdownRect.width - 10}px`;
            }
            if (rect.bottom + dropdownRect.height > window.innerHeight) {
                dropdown.style.top = `${rect.top - dropdownRect.height - 5}px`;
            }
        }
        dropdown.style.display = 'block';
    } else {
        dropdown.style.display = 'none';
    }
}

/**
 * Reschedule an overdue item to a preset date
 */
function rescheduleOverdueItem(itemId, rescheduleType) {
    if (!tracker) return;
    
    const item = tracker.entries.find(entry => entry.id === itemId);
    if (!item) return;
    
    const now = new Date();
    let newDueDate;
    
    switch (rescheduleType) {
        case 'tomorrow':
            newDueDate = new Date(now);
            newDueDate.setDate(now.getDate() + 1);
            newDueDate.setHours(9, 0, 0, 0); // Default to 9 AM
            break;
        case 'next-week':
            newDueDate = new Date(now);
            newDueDate.setDate(now.getDate() + 7);
            newDueDate.setHours(9, 0, 0, 0); // Default to 9 AM
            break;
        case 'next-month':
            newDueDate = new Date(now);
            newDueDate.setMonth(now.getMonth() + 1);
            newDueDate.setHours(9, 0, 0, 0); // Default to 9 AM
            break;
        default:
            return;
    }
    
    // Update the item's due date
    item.dueDate = newDueDate.toISOString();
    tracker.saveEntries();
    
    // Refresh displays
    tracker.displayEntries();
    tracker.displayTodos();
    tracker.displayNotes();
    showOverdueAlert();
    updateOverdueAlertButton();
    
    // Close dropdown
    const dropdown = document.getElementById(`reschedule-${itemId}`);
    if (dropdown) dropdown.style.display = 'none';
    
    // Show confirmation
    showNotification(`Item rescheduled to ${newDueDate.toLocaleDateString()}`, 'success');
    
    // Play sound if enabled
    if (tracker.soundManager && !tracker.isNotificationSoundMuted()) {
        tracker.soundManager.playSound('classic', false);
    }
}

/**
 * Show custom date picker for rescheduling an overdue item
 */
function rescheduleOverdueItemCustom(itemId) {
    if (!tracker) return;
    
    const item = tracker.entries.find(entry => entry.id === itemId);
    if (!item) return;
    
    // Create a simple prompt for custom date/time
    const currentDue = item.dueDate ? new Date(item.dueDate) : new Date();
    const defaultValue = currentDue.toISOString().slice(0, 16); // Format for datetime-local input
    
    const customDate = prompt(`Enter new due date and time for "${item.activity}":`, defaultValue);
    if (customDate) {
        const newDueDate = new Date(customDate);
        if (!isNaN(newDueDate.getTime())) {
            // Update the item's due date
            item.dueDate = newDueDate.toISOString();
            tracker.saveEntries();
            
            // Refresh displays
            tracker.displayEntries();
            tracker.displayTodos();
            tracker.displayNotes();
            showOverdueAlert();
            updateOverdueAlertButton();
            
            // Close dropdown
            const dropdown = document.getElementById(`reschedule-${itemId}`);
            if (dropdown) dropdown.style.display = 'none';
            
            // Show confirmation
            showNotification(`Item rescheduled to ${newDueDate.toLocaleString()}`, 'success');
            
            // Play sound if enabled
            if (tracker.soundManager && !tracker.isNotificationSoundMuted()) {
                tracker.soundManager.playSound('classic', false);
            }
        } else {
            showNotification('Invalid date format. Please try again.', 'error');
        }
    }
}

/**
 * Generate due date countdown HTML for entry display
 */
function generateDueDateCountdown(dueDate) {
    if (!dueDate) return '';
    
    const timeText = formatTimeUntilDue(dueDate);
    if (!timeText) return '';
    
    const now = new Date();
    const due = new Date(dueDate);
    const diffMs = due.getTime() - now.getTime();
    
    let cssClass = 'upcoming';
    if (diffMs < 0) {
        cssClass = 'overdue';
    } else if (diffMs < 24 * 60 * 60 * 1000) { // Less than 24 hours
        cssClass = 'soon';
    }
    
    return `<span class="entry-due-countdown ${cssClass}">${timeText}</span>`;
}

/**
 * Check for newly due items and send notifications
 */
function checkDueItemsForNotifications() {
    if (!tracker || !tracker.entries) return;
    
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    
    // Find items that became due in the last minute (only consider active todos)
    const newlyDueItems = tracker.entries.filter(entry => {
        if (!entry.dueDate || !entry.isTodo) return false;
        
        const dueDate = new Date(entry.dueDate);
        return dueDate <= now && dueDate > oneMinuteAgo;
    });
    
    // Send notifications for newly due items
    newlyDueItems.forEach(item => {
        sendDueItemNotification(item);
    });
}

/**
 * Send notification for a due item
 */
function sendDueItemNotification(item) {
    // Check if notifications are enabled
    if (!tracker.settings.notificationsEnabled) return;
    
    // Play sound if enabled
    if (tracker.soundManager && !tracker.isNotificationSoundMuted()) {
        tracker.soundManager.playSound(tracker.settings.notificationSoundType, false);
    }
    
    // Send browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification('Item Due Now!', {
            body: `${item.activity}${item.description ? ' - ' + item.description : ''}`,
            icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23e53e3e"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>',
            tag: 'due-item-' + item.id,
            requireInteraction: true
        });
        
        // Auto-close after 10 seconds
        setTimeout(() => {
            if (notification) {
                notification.close();
            }
        }, 10000);
    }
}

/**
 * Initialize due date monitoring system
 */
function initializeDueDateSystem() {
    // Check for due items every minute
    setInterval(() => {
        checkDueItemsForNotifications();
        updateOverdueAlertButton();
    }, 60000);
    
    // Initial check
    updateOverdueAlertButton();
    
    console.log('Due date monitoring system initialized');
}

// === Entry Form Toggle System ===

// Global state for entry form visibility (persistent across tabs)
let entryFormsVisible = true;
let userStruggleTimeout = null;

/**
 * Create latch click sound effect
 */
function createLatchClickSound() {
    // Create a synthetic latch click sound using Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create multiple oscillators for a complex latch sound
    const clickDuration = 0.08;
    const now = audioContext.currentTime;
    
    // Main click sound (sharp transient)
    const oscillator1 = audioContext.createOscillator();
    const gainNode1 = audioContext.createGain();
    
    oscillator1.connect(gainNode1);
    gainNode1.connect(audioContext.destination);
    
    oscillator1.frequency.setValueAtTime(800, now);
    oscillator1.frequency.exponentialRampToValueAtTime(200, now + 0.02);
    
    gainNode1.gain.setValueAtTime(0.3, now);
    gainNode1.gain.exponentialRampToValueAtTime(0.01, now + clickDuration);
    
    // Secondary resonance (metallic ring)
    const oscillator2 = audioContext.createOscillator();
    const gainNode2 = audioContext.createGain();
    
    oscillator2.connect(gainNode2);
    gainNode2.connect(audioContext.destination);
    
    oscillator2.frequency.setValueAtTime(1200, now + 0.01);
    oscillator2.frequency.exponentialRampToValueAtTime(400, now + 0.04);
    
    gainNode2.gain.setValueAtTime(0.15, now + 0.01);
    gainNode2.gain.exponentialRampToValueAtTime(0.01, now + clickDuration);
    
    // Start and stop oscillators
    oscillator1.start(now);
    oscillator1.stop(now + clickDuration);
    
    oscillator2.start(now + 0.01);
    oscillator2.stop(now + clickDuration);
}

/**
 * Play latch click sound if sound is enabled
 */
function playLatchClick() {
    if (tracker && tracker.settings && !tracker.settings.muteSound) {
        try {
            createLatchClickSound();
        } catch (error) {
            console.log('Could not play latch click sound:', error.message);
        }
    }
}

/**
 * Toggle entry form visibility for a specific section
 */
function toggleEntryForm(section) {
    const component = document.getElementById(`${section}EntryComponent`);
    const toggleBtn = document.getElementById(`${section}ToggleBtn${section === 'tracker' ? '' : '2'}`);
    
    if (!component || !toggleBtn) return;
    
    entryFormsVisible = !entryFormsVisible;
    
    // Play sound effect
    playLatchClick();
    
    // Update all sections to maintain consistency
    updateAllEntryForms();
    
    // Clear any struggle hints
    clearStruggleHint();
    
    // If showing form, focus on appropriate input after animation completes
    if (entryFormsVisible) {
        setTimeout(() => {
            const inputId = section === 'tracker' ? 'activity' : 
                           section === 'todo' ? 'todoActivity' : 'notesActivity';
            const input = document.getElementById(inputId);
            const component = document.getElementById(`${section}EntryComponent`);
            
            // Only focus if the form is actually visible (not collapsed)
            if (input && component && !component.classList.contains('collapsed')) {
                input.focus();
            }
        }, 400); // Wait for animation to complete
    }
}

/**
 * Update all entry forms to match global visibility state
 */
function updateAllEntryForms() {
    const sections = ['tracker', 'todo', 'notes'];
    
    sections.forEach(section => {
        const component = document.getElementById(`${section}EntryComponent`);
        const toggleBtn = document.getElementById(`${section}ToggleBtn${section === 'tracker' ? '' : '2'}`);
        
        if (component && toggleBtn) {
            if (entryFormsVisible) {
                component.classList.remove('collapsed');
                toggleBtn.classList.remove('hidden-form');
                toggleBtn.title = 'Hide entry form';
            } else {
                component.classList.add('collapsed');
                toggleBtn.classList.add('hidden-form');
                toggleBtn.title = 'Show entry form';
            }
        }
    });
}

/**
 * Start struggle detection timer
 */
function startStruggleDetection() {
    if (userStruggleTimeout) clearTimeout(userStruggleTimeout);
    
    // If forms are hidden and user hasn't interacted for 10 seconds, show hint
    if (!entryFormsVisible) {
        userStruggleTimeout = setTimeout(() => {
            showStruggleHint();
        }, 10000);
    }
}

/**
 * Show struggle hint on toggle buttons
 */
function showStruggleHint() {
    const sections = ['tracker', 'todo', 'notes'];
    
    sections.forEach(section => {
        const toggleBtn = document.getElementById(`${section}ToggleBtn${section === 'tracker' ? '' : '2'}`);
        if (toggleBtn && !entryFormsVisible) {
            toggleBtn.classList.add('glow-hint');
        }
    });
    
    // Remove hint after 5 seconds
    setTimeout(() => {
        clearStruggleHint();
    }, 5000);
}

/**
 * Clear struggle hint from all toggle buttons
 */
function clearStruggleHint() {
    if (userStruggleTimeout) {
        clearTimeout(userStruggleTimeout);
        userStruggleTimeout = null;
    }
    
    const sections = ['tracker', 'todo', 'notes'];
    sections.forEach(section => {
        const toggleBtn = document.getElementById(`${section}ToggleBtn${section === 'tracker' ? '' : '2'}`);
        if (toggleBtn) {
            toggleBtn.classList.remove('glow-hint');
        }
    });
}

/**
 * Close Pomodoro activity modal
 */
function closePomodoroActivityModal() {
    const modal = document.getElementById('pomodoroActivityModal');
    if (modal) {
        modal.style.display = 'none';
        document.getElementById('pomodoroActivityForm').reset();
    }
}

/**
 * Show Pomodoro activity modal
 */
function showPomodoroActivityModal() {
    const modal = document.getElementById('pomodoroActivityModal');
    if (modal) {
        modal.style.display = 'block';
        updatePreviousActivityButton();
        setTimeout(() => {
            const activityInput = document.getElementById('pomodoroActivityName');
            if (activityInput) {
                activityInput.focus();
            }
        }, 100);
    }
}

/**
 * Toggle pause/resume for notifications
 */
function togglePause() {
    if (tracker) {
        const pauseButton = document.getElementById('pauseButton');
        
        // Check if button shows "Outside activity hours" and show info modal
        if (pauseButton && pauseButton.textContent === 'Outside activity hours') {
            showActivityHoursInfo();
            return;
        }
        
        // Check if notifications are completely disabled
        if (pauseButton && pauseButton.textContent === 'All reminders disabled') {
            // Focus user's attention on the notification status section
            const notificationStatus = document.querySelector('.notification-status');
            if (notificationStatus) {
                notificationStatus.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Add a subtle highlight effect
                notificationStatus.style.backgroundColor = 'rgba(102, 126, 234, 0.1)';
                setTimeout(() => {
                    notificationStatus.style.backgroundColor = '';
                }, 3000);
            }
            return;
        }
        
        // Proceed with normal pause toggle
        tracker.togglePause();
    }
}

/**
 * Show activity hours information modal
 */
function showActivityHoursInfo() {
    const modal = document.getElementById('activityHoursInfoModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

/**
 * Close activity hours information modal
 */
function closeActivityHoursInfo() {
    const modal = document.getElementById('activityHoursInfoModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Navigate to activity hours settings
 */
function goToActivityHoursSettings() {
    // Close the modal first
    closeActivityHoursInfo();
    
    // Switch to settings section
    showSection('settings');
    
    // Scroll to the activity hours settings
    setTimeout(() => {
        const activityHoursSection = document.querySelector('.settings-section h3');
        if (activityHoursSection) {
            // Look for the Activity Schedule section
            const sections = document.querySelectorAll('.settings-section h3');
            for (let section of sections) {
                if (section.textContent.includes('Activity Schedule') || section.textContent.includes('Schedule')) {
                    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    // Add a subtle highlight effect
                    section.parentElement.style.backgroundColor = 'rgba(102, 126, 234, 0.1)';
                    setTimeout(() => {
                        section.parentElement.style.backgroundColor = '';
                    }, 3000);
                    break;
                }
            }
        }
    }, 200);
}

/**
 * Toggle Pomodoro mode from navigation button
 */
function togglePomodoro() {
    if (tracker && tracker.pomodoroManager) {
        tracker.pomodoroManager.togglePomodoroFromButton();
    }
}

/**
 * Toggle Pomodoro pause/resume from banner button
 */
function togglePomodoroPause() {
    if (tracker && tracker.pomodoroManager) {
        tracker.pomodoroManager.togglePause();
    }
}

/**
 * Use previous activity to populate Pomodoro activity form
 */
function usePreviousActivity() {
    if (!tracker || !tracker.entries || tracker.entries.length === 0) {
        showNotification('No previous activities found', 'warning');
        return;
    }
    
    // Find the most recent non-Pomodoro activity or the most recent Pomodoro work activity
    let previousActivity = null;
    
    for (const entry of tracker.entries) {
        if (entry.source !== 'pomodoro') {
            // Use most recent manual activity
            previousActivity = entry;
            break;
        } else if (entry.activity && !entry.activity.includes('break') && !entry.activity.includes('abandoned')) {
            // Use most recent Pomodoro work activity (not break or abandonment)
            previousActivity = entry;
            break;
        }
    }
    
    if (!previousActivity) {
        showNotification('No suitable previous activity found', 'warning');
        return;
    }
    
    // Populate the form
    const activityName = document.getElementById('pomodoroActivityName');
    const activityDescription = document.getElementById('pomodoroActivityDescription');
    
    if (activityName) {
        activityName.value = previousActivity.activity;
    }
    
    if (activityDescription && previousActivity.description) {
        activityDescription.value = previousActivity.description;
    }
    
    showNotification(`Using previous activity: "${previousActivity.activity}"`, 'success');
}

/**
 * Update the "Use Previous Activity" button state
 */
function updatePreviousActivityButton() {
    const button = document.getElementById('usePreviousActivityBtn');
    if (!button) return;
    
    if (!tracker || !tracker.entries || tracker.entries.length === 0) {
        button.disabled = true;
        button.title = 'No previous activities available';
        return;
    }
    
    // Check if there's a suitable previous activity
    let hasUsableActivity = false;
    for (const entry of tracker.entries) {
        if (entry.source !== 'pomodoro' || 
            (entry.activity && !entry.activity.includes('break') && !entry.activity.includes('abandoned'))) {
            hasUsableActivity = true;
            break;
        }
    }
    
    button.disabled = !hasUsableActivity;
    button.title = hasUsableActivity ? 'Fill form with your most recent activity' : 'No suitable previous activities available';
}

/**
 * Show Pomodoro abandonment dialog
 */
function showPomodoroAbandonDialog() {
    const modal = document.getElementById('pomodoroAbandonModal');
    if (modal) {
        modal.style.display = 'block';
        setTimeout(() => {
            const activityInput = document.getElementById('pomodoroAbandonActivityName');
            if (activityInput) {
                activityInput.focus();
            }
        }, 100);
    }
}

/**
 * Close Pomodoro abandonment dialog
 */
function closePomodoroAbandonDialog() {
    const modal = document.getElementById('pomodoroAbandonModal');
    if (modal) {
        modal.style.display = 'none';
        document.getElementById('pomodoroAbandonForm').reset();
    }
}

/**
 * Handle Pomodoro abandonment save decision
 */
function handlePomodoroAbandonmentSave(saveWork) {
    if (tracker && tracker.pomodoroManager) {
        tracker.pomodoroManager.handleAbandonmentSave(saveWork);
    }
}

/**
 * Reset Pomodoro session counter
 */
function resetPomodoroSessions() {
    if (!tracker || !tracker.pomodoroManager) {
        showNotification('Pomodoro manager not available', 'error');
        return;
    }
    
    // Check warning settings
    if (tracker.settings.warnOnSessionReset) {
        showConfirmationDialog(
            'Reset Session Counter',
            'Are you sure you want to reset the Pomodoro session counter? This will start your session count back at 1.',
            (skipFuture) => {
                if (skipFuture) {
                    tracker.settings.warnOnSessionReset = false;
                    // Update the form element to reflect the change
                    const warnResetElement = document.getElementById('warnOnSessionReset');
                    if (warnResetElement) {
                        warnResetElement.value = 'false';
                    }
                    tracker.saveSettings();
                }
                tracker.pomodoroManager.resetSessionCounter();
            },
            {
                confirmText: 'Reset',
                buttonClass: 'btn-warning',
                allowSkip: true
            }
        );
    } else {
        tracker.pomodoroManager.resetSessionCounter();
    }
}

/**
 * Toggle the edit todo button state
 */
function toggleEditTodo() {
    if (!tracker) return;
    
    const button = document.getElementById('editTodoButton');
    if (button) {
        const currentState = button.dataset.isTodo === 'true';
        tracker.setEditTodoButtonState(!currentState);
    }
}

/**
 * Toggle the edit note button state
 */
function toggleEditNote() {
    if (!tracker) return;
    
    const button = document.getElementById('editNoteButton');
    if (button) {
        const currentState = button.dataset.isNote === 'true';
        tracker.setEditNoteButtonState(!currentState);
    }
}

/**
 * Show custom confirmation dialog
 */
function showConfirmationDialog(title, message, onConfirm, options = {}) {
    const modal = document.getElementById('confirmationModal');
    const titleElement = document.getElementById('confirmationTitle');
    const messageElement = document.getElementById('confirmationMessage');
    const confirmBtn = document.getElementById('confirmationConfirmBtn');
    const skipSection = document.getElementById('confirmationSkipSection');
    const skipCheckbox = document.getElementById('confirmationSkipFuture');
    
    if (modal && titleElement && messageElement && confirmBtn) {
        titleElement.textContent = title;
        messageElement.textContent = message;
        
        // Configure button
        confirmBtn.textContent = options.confirmText || 'Confirm';
        confirmBtn.className = `btn ${options.buttonClass || 'btn-danger'}`;
        
        // Show/hide skip option
        if (options.allowSkip) {
            skipSection.style.display = 'block';
            skipCheckbox.checked = false;
        } else {
            skipSection.style.display = 'none';
        }
        
        // Set up confirm handler
        confirmBtn.onclick = () => {
            const skipFuture = skipCheckbox.checked;
            closeConfirmationDialog();
            onConfirm(skipFuture);
        };
        
        modal.style.display = 'block';
    }
}

/**
 * Close confirmation dialog
 */
function closeConfirmationDialog() {
    const modal = document.getElementById('confirmationModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Test Pomodoro tick sounds (for debugging)
 */
function testPomodoroTick(soundType = 'soft') {
    if (tracker && tracker.pomodoroManager) {
        console.log(`Testing Pomodoro tick sound: ${soundType}`);
        tracker.pomodoroManager.settings.tickSound = soundType;
        tracker.pomodoroManager.playTickSound();
    } else {
        console.error('Tracker or Pomodoro Manager not available');
    }
}

/**
 * Saves the customized report templates from the settings page.
 */
function saveReportTemplates() {
    if (tracker) {
        tracker.saveReportTemplates();
    }
}

/**
 * Resets report templates to their default values.
 */
function resetReportTemplates() {
    if (tracker) {
        tracker.resetReportTemplates();
    }
}

/**
 * Export database as backup file
 */
function exportDatabase() {
    if (tracker) {
        tracker.exportDatabase();
    }
}

/**
 * Trigger file picker for database import
 */
function importDatabase() {
    const fileInput = document.getElementById('importFile');
    if (fileInput) {
        fileInput.click();
    }
}

/**
 * Handle import file selection
 */
function handleImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
        showNotification('Please select a valid JSON backup file.', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        if (tracker) {
            tracker.importDatabase(e.target.result);
        }
        // Clear the file input so the same file can be selected again if needed
        event.target.value = '';
    };
    reader.onerror = function() {
        showNotification('Error reading backup file.', 'error');
        event.target.value = '';
    };
    reader.readAsText(file);
}

/**
 * Open template manager overlay
 */
function openTemplateManager() {
    if (tracker) {
        tracker.openTemplateManager();
    }
}

/**
 * Close template manager overlay
 */
function closeTemplateManager() {
    if (tracker) {
        tracker.closeTemplateManager();
    }
}

/**
 * Add new template in manager
 */
function addNewTemplate() {
    if (tracker) {
        tracker.addNewTemplate();
    }
}

/**
 * Reset all templates to defaults
 */
function resetToDefaults() {
    if (tracker) {
        tracker.resetToDefaults();
    }
}

/**
 * Save current template in editor
 */
function saveCurrentTemplate() {
    if (tracker) {
        tracker.saveCurrentTemplate();
    }
}

/**
 * Delete current template in editor
 */
function deleteCurrentTemplate() {
    if (tracker) {
        tracker.deleteCurrentTemplate();
    }
}

/**
 * Duplicate current template in editor
 */
function duplicateCurrentTemplate() {
    if (tracker) {
        tracker.duplicateCurrentTemplate();
    }
}

/**
 * Refresh template preview
 */
function refreshTemplatePreview() {
    if (tracker) {
        tracker.refreshTemplatePreview();
    }
}

/**
 * Save all templates and close manager
 */
function saveAllTemplates() {
    if (tracker) {
        tracker.saveAllTemplates();
    }
}

/**
 * Switch preview tab in template manager
 */
function switchPreviewTab(tabType) {
    if (tracker) {
        tracker.switchPreviewTab(tabType);
    }
}

/**
 * Switch preview tab in reports section
 */
function switchReportPreviewTab(tabType) {
    if (tracker) {
        tracker.switchReportPreviewTab(tabType);
    }
}

/**
 * Switch template editor tab (Editor/Preview)
 */
function switchTemplateTab(tabType) {
    if (tracker) {
        tracker.switchTemplateTab(tabType);
    }
}

/**
 * Run comprehensive service worker diagnostic test
 */
async function runServiceWorkerTest() {
    if (!tracker) {
        showNotification('Tracker not initialized', 'error');
        return;
    }
    
    showNotification('Running Service Worker diagnostics...', 'info');
    
    try {
        const diagnostics = await tracker.runServiceWorkerDiagnostics();
        
        let message = 'Service Worker Diagnostics:\n\n';
        message += `Available: ${diagnostics.available}\n`;
        message += `Protocol: ${diagnostics.protocol}\n`;
        message += `Platform: ${diagnostics.platform}\n`;
        
        if (diagnostics.registration) {
            message += `Registration: Active\n`;
            message += `Scope: ${diagnostics.registration.scope}\n`;
        } else {
            message += `Registration: None\n`;
        }
        
        if (diagnostics.controller) {
            message += `Controller: Active (${diagnostics.controller.state})\n`;
        } else {
            message += `Controller: None\n`;
        }
        
        if (diagnostics.communication) {
            message += `Communication: ${diagnostics.communication}\n`;
        }
        
        if (diagnostics.swVersion) {
            message += `SW Version: ${diagnostics.swVersion}\n`;
        }
        
        if (diagnostics.error) {
            message += `Error: ${diagnostics.error}\n`;
        }
        
        // Show detailed results in console and user notification
        console.log('Service Worker Diagnostics:', diagnostics);
        alert(message);
        
        const status = diagnostics.available && diagnostics.registration ? 'success' : 'warning';
        const summary = diagnostics.available && diagnostics.registration ? 
            'Service Worker is working correctly' : 
            'Service Worker issues detected (see console)';
            
        showNotification(summary, status);
        
    } catch (error) {
        console.error('Diagnostic test failed:', error);
        showNotification('Diagnostic test failed: ' + error.message, 'error');
    }
}

/**
 * Initialize UI state on page load
 */
function initializeUIState() {
    // Hide due date sections by default (they're only for todos)
    const dueDateSection = document.getElementById('dueDateSection');
    if (dueDateSection) {
        dueDateSection.style.display = 'none';
    }
    
    const editDueDateSection = document.getElementById('editDueDateSection');
    if (editDueDateSection) {
        editDueDateSection.style.display = 'none';
    }
}

/**
 * Initialize entry form toggle system
 */
function initializeEntryFormToggle() {
    // Set initial form state
    updateAllEntryForms();
    
    // Add event listeners for user interaction detection
    const interactionEvents = ['click', 'scroll', 'keydown', 'mousemove'];
    
    interactionEvents.forEach(eventType => {
        document.addEventListener(eventType, () => {
            clearStruggleHint();
            startStruggleDetection();
        }, { passive: true });
    });
    
    // Start initial struggle detection if forms are hidden
    startStruggleDetection();
    
    console.log('Entry form toggle system initialized');
}

/**
 * Initialize the application when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Activity Tracker...');
    
    // Initialize UI state
    initializeUIState();
    
    // Initialize entry form toggle system
    initializeEntryFormToggle();
    
    // Create tracker instance
    tracker = new ActivityTracker();
    
    // Initialize form timestamps to current time
    initializeFormTimestamps();
    
    // Register service worker if supported
    if ('serviceWorker' in navigator) {
        // Check if we're on a supported protocol
        if (window.location.protocol === 'file:') {
            console.log('Service Worker not registering: file:// protocol detected');
            console.log('App will function normally without Service Worker');
        } else {
            console.log('Registering Service Worker...');
            
            navigator.serviceWorker.register('./sw.js')
                .then(registration => {
                    console.log('Service Worker registered with scope:', registration.scope);
                    
                    // Handle updates
                    registration.addEventListener('updatefound', () => {
                        console.log('Service Worker update found');
                        const newWorker = registration.installing;
                        if (newWorker) {
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    console.log('New Service Worker installed, refresh recommended');
                                    showNotification('App updated! Refresh for latest version.', 'info', 10000);
                                }
                            });
                        }
                    });
                    
                    if (tracker) {
                        tracker.updateDebugInfo();
                    }
                })
                .catch(error => {
                    console.error('Service Worker registration failed:', error);
                    console.log('App will function normally without Service Worker');
                    
                    // Check for common macOS issues
                    if (navigator.platform.includes('Mac') && error.name === 'SecurityError') {
                        console.warn('macOS Security Error: This may be due to strict security settings');
                        console.warn('Try serving over HTTP/HTTPS instead of file://');
                    }
                    
                    if (tracker) {
                        tracker.updateDebugInfo();
                    }
                });
        }

        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', event => {
            console.log('Message from SW:', event.data);
            
            if (event.data && event.data.type === 'add-entry') {
                if (tracker) {
                    tracker.addEntry(event.data.entry);
                    showNotification('Activity logged from notification!', 'success');
                }
            }
            
            if (event.data && event.data.type === 'navigate-to-tracker') {
                showSection('tracker');
                
                // Focus the activity input field and ensure forms are visible
                setTimeout(() => {
                    const activityInput = document.getElementById('activity');
                    if (activityInput) {
                        // Make sure entry forms are visible if they were hidden
                        if (typeof entryFormsVisible !== 'undefined' && !entryFormsVisible) {
                            entryFormsVisible = true;
                            if (typeof updateAllEntryForms === 'function') {
                                updateAllEntryForms();
                            }
                        }
                        activityInput.focus();
                    }
                }, 100);
            }
            
            if (event.data && event.data.type === 'populate-activity-input') {
                // Navigate to tracker section first
                showSection('tracker');
                
                // Populate the activity input field with the notification reply text
                const activityInput = document.getElementById('activity');
                if (activityInput && event.data.text) {
                    activityInput.value = event.data.text;
                    activityInput.focus();
                    activityInput.select(); // Select the text so user can easily modify it
                    showNotification('Activity text populated from notification!', 'success');
                }
            }
        });

        // Listen for service worker control changes
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('Service Worker controller changed');
            if (tracker) {
                tracker.updateDebugInfo();
            }
        });

    } else {
        console.log('Service Worker not supported in this browser');
        console.log('App will function normally without Service Worker');
    }

    // Handle hash navigation (if coming from notification)
    if (window.location.hash === '#tracker') {
        showSection('tracker');
        
        // Focus the activity input field and ensure forms are visible
        setTimeout(() => {
            const activityInput = document.getElementById('activity');
            if (activityInput) {
                // Make sure entry forms are visible if they were hidden
                if (typeof entryFormsVisible !== 'undefined' && !entryFormsVisible) {
                    entryFormsVisible = true;
                    if (typeof updateAllEntryForms === 'function') {
                        updateAllEntryForms();
                    }
                }
                activityInput.focus();
            }
        }, 200);
        
        // Clean up the hash
        history.replaceState(null, document.title, window.location.pathname + window.location.search);
    }

    // Position burger menu initially
    positionBurgerMenu();
    
    console.log('Activity Tracker initialized successfully');
});

// Handle window resize and state changes to reposition burger menu
window.addEventListener('resize', () => {
    positionBurgerMenu();
});

// Handle window state changes (maximize, restore, etc.)
window.addEventListener('focus', () => {
    // Small delay to ensure layout is complete after focus
    setTimeout(positionBurgerMenu, 10);
});

// Additional fallback for various window state changes
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        setTimeout(positionBurgerMenu, 10);
    }
});

// Force repositioning on orientation change (mobile)
window.addEventListener('orientationchange', () => {
    setTimeout(positionBurgerMenu, 100);
});

// Use requestAnimationFrame for smooth repositioning during animations
function scheduleRepositioning() {
    requestAnimationFrame(positionBurgerMenu);
}

// Monitor for layout changes using ResizeObserver if available
if (window.ResizeObserver) {
    const resizeObserver = new ResizeObserver(() => {
        scheduleRepositioning();
    });
    
    // Observe the document body for layout changes
    resizeObserver.observe(document.body);
}

/**
 * Handle modal clicks (close when clicking outside)
 */
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        // Close the appropriate modal based on which one is open
        if (e.target.id === 'templateGuideModal') {
            closeTemplateGuide();
        } else if (e.target.id === 'aboutModal') {
            closeAbout();
        } else if (e.target.id === 'pomodoroActivityModal') {
            closePomodoroActivityModal();
        } else if (e.target.id === 'pomodoroAbandonModal') {
            closePomodoroAbandonDialog();
        } else if (e.target.id === 'confirmationModal') {
            closeConfirmationDialog();
        } else if (e.target.id === 'hashtagBrowserModal') {
            closeHashtagBrowser();
        } else if (e.target.id === 'userGuideModal') {
            closeUserGuide();
        } else {
            closeEditModal();
        }
    }
    
    // Close reschedule dropdowns when clicking outside
    if (!e.target.closest('.reschedule-dropdown')) {
        document.querySelectorAll('.reschedule-options').forEach(dropdown => {
            dropdown.style.display = 'none';
        });
    }
});

/**
 * Handle keyboard shortcuts
 */
document.addEventListener('keydown', (e) => {
    // Esc key closes modals
    if (e.key === 'Escape') {
        // Close whichever modal is currently open
        const templateGuideModal = document.getElementById('templateGuideModal');
        const aboutModal = document.getElementById('aboutModal');
        const editModal = document.getElementById('editModal');
        const pomodoroActivityModal = document.getElementById('pomodoroActivityModal');
        const pomodoroAbandonModal = document.getElementById('pomodoroAbandonModal');
        const confirmationModal = document.getElementById('confirmationModal');
        const hashtagBrowserModal = document.getElementById('hashtagBrowserModal');
        const userGuideModal = document.getElementById('userGuideModal');
        const activityHoursInfoModal = document.getElementById('activityHoursInfoModal');
        
        if (templateGuideModal && templateGuideModal.style.display === 'block') {
            closeTemplateGuide();
        } else if (aboutModal && aboutModal.style.display === 'block') {
            closeAbout();
        } else if (pomodoroActivityModal && pomodoroActivityModal.style.display === 'block') {
            closePomodoroActivityModal();
        } else if (pomodoroAbandonModal && pomodoroAbandonModal.style.display === 'block') {
            closePomodoroAbandonDialog();
        } else if (confirmationModal && confirmationModal.style.display === 'block') {
            closeConfirmationDialog();
        } else if (hashtagBrowserModal && hashtagBrowserModal.style.display === 'block') {
            closeHashtagBrowser();
        } else if (userGuideModal && userGuideModal.style.display === 'block') {
            closeUserGuide();
        } else if (activityHoursInfoModal && activityHoursInfoModal.style.display === 'block') {
            closeActivityHoursInfo();
        } else if (document.getElementById('overdueAlertModal') && document.getElementById('overdueAlertModal').style.display === 'block') {
            closeOverdueAlert();
        } else if (editModal && editModal.style.display === 'block') {
            closeEditModal();
        }
    }
    
    // Shift + Enter submits the activity form when focused
    if (e.shiftKey && e.key === 'Enter') {
        const activeElement = document.activeElement;
        
        // Main activity form
        if (activeElement && (activeElement.id === 'activity' || activeElement.id === 'description')) {
            e.preventDefault();
            const form = document.getElementById('activityForm');
            if (form) {
                form.dispatchEvent(new Event('submit'));
            }
        }
        return;
    }
    
    // Shift + Space focuses the activity input field and unfurls form if hidden
    if (e.shiftKey && e.key === ' ') {
        const activeElement = document.activeElement;
        // Don't trigger if currently focused on any description textarea
        if (activeElement && (activeElement.id === 'description' || activeElement.id === 'editDescription')) {
            return;
        }
        e.preventDefault();
        
        // If forms are hidden, show them first
        if (!entryFormsVisible) {
            entryFormsVisible = true;
            playLatchClick();
            updateAllEntryForms();
            clearStruggleHint();
        }
        
        // Focus the activity input and switch to tracker section
        setTimeout(() => {
            const activityInput = document.getElementById('activity');
            const component = document.getElementById('trackerEntryComponent');
            
            // Also switch to tracker section if not already there
            showSection('tracker');
            
            // Only focus if the form is visible
            if (activityInput && component && !component.classList.contains('collapsed')) {
                activityInput.focus();
            }
        }, entryFormsVisible ? 0 : 400);
        return;
    }
    
    // Ctrl/Cmd + T toggles todo mode
    if ((e.ctrlKey || e.metaKey) && e.key === 't') {
        const activeElement = document.activeElement;
        
        // Main activity form - toggle todo mode
        if (activeElement && (activeElement.id === 'activity' || activeElement.id === 'description')) {
            e.preventDefault();
            toggleTodoMode();
        }
        
        // Edit modal form - toggle todo mode
        if (activeElement && (activeElement.id === 'editActivity' || activeElement.id === 'editDescription' || activeElement.id === 'editTimestamp')) {
            e.preventDefault();
            toggleEditTodo();
        }
        return;
    }
    
    // Ctrl/Cmd + N toggles note mode
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        const activeElement = document.activeElement;
        
        // Main activity form - toggle note mode
        if (activeElement && (activeElement.id === 'activity' || activeElement.id === 'description')) {
            e.preventDefault();
            toggleNoteMode();
        }
        
        // Edit modal form - toggle note mode
        if (activeElement && (activeElement.id === 'editActivity' || activeElement.id === 'editDescription' || activeElement.id === 'editTimestamp')) {
            e.preventDefault();
            toggleEditNote();
        }
        return;
    }
    
    // Ctrl/Cmd + Enter submits the activity form when focused
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const activeElement = document.activeElement;
        
        // Main activity form
        if (activeElement && (activeElement.id === 'activity' || activeElement.id === 'description')) {
            const form = document.getElementById('activityForm');
            if (form) {
                form.dispatchEvent(new Event('submit'));
            }
        }
        
        // Edit modal form
        if (activeElement && (activeElement.id === 'editActivity' || activeElement.id === 'editDescription' || activeElement.id === 'editTimestamp')) {
            const editForm = document.getElementById('editForm');
            if (editForm) {
                editForm.dispatchEvent(new Event('submit'));
            }
        }
        
        // Pomodoro activity modal form
        if (activeElement && (activeElement.id === 'pomodoroActivityName' || activeElement.id === 'pomodoroActivityDescription')) {
            const pomodoroForm = document.getElementById('pomodoroActivityForm');
            if (pomodoroForm) {
                pomodoroForm.dispatchEvent(new Event('submit'));
            }
        }
    }
});

/**
 * Handle visibility change to pause/resume notifications when tab is hidden
 */
document.addEventListener('visibilitychange', () => {
    if (tracker) {
        // Update debug info when tab becomes visible
        if (!document.hidden) {
            tracker.updateDebugInfo();
        }
    }
});

/**
 * Handle online/offline events
 */
window.addEventListener('online', () => {
    console.log('Connection restored');
    showNotification('Connection restored', 'success');
});

window.addEventListener('offline', () => {
    console.log('Connection lost');
    showNotification('Working offline', 'info');
});

/**
 * Handle beforeunload for cleanup and unsaved data warning
 */
window.addEventListener('beforeunload', (e) => {
    // Clean up pause manager
    if (tracker && tracker.pauseManager) {
        tracker.pauseManager.destroy();
    }
    
    // Only show warning if there's unsaved form data
    const activityInput = document.getElementById('activity');
    if (activityInput && activityInput.value.trim()) {
        e.preventDefault();
        e.returnValue = 'You have unsaved activity data. Are you sure you want to leave?';
        return e.returnValue;
    }
});

/**
 * Add PWA install prompt handling
 */
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    console.log('PWA install prompt available');
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Save the event so it can be triggered later
    deferredPrompt = e;
    
    // Show custom install button/notification if desired
    showNotification('This app can be installed on your device!', 'info');
});

window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    showNotification('Activity Tracker installed successfully!', 'success');
    deferredPrompt = null;
});

/**
 * Error handling for uncaught errors
 */
window.addEventListener('error', (e) => {
    console.error('Uncaught error:', e.error);
    showNotification('An unexpected error occurred. Please refresh the page.', 'error');
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
    showNotification('An unexpected error occurred. Please refresh the page.', 'error');
});

/**
 * Performance monitoring
 */
window.addEventListener('load', () => {
    // Log performance timing
    if (window.performance && window.performance.timing) {
        const timing = window.performance.timing;
        const loadTime = timing.loadEventEnd - timing.navigationStart;
        console.log(`Page loaded in ${loadTime}ms`);
    }
});

/**
 * Toggle burger menu dropdown
 */
function toggleBurgerMenu() {
    const dropdown = document.getElementById('burgerDropdown');
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    }
}

/**
 * Close burger menu dropdown
 */
function closeBurgerMenu() {
    const dropdown = document.getElementById('burgerDropdown');
    if (dropdown) {
        dropdown.style.display = 'none';
    }
}

// Close burger menu when clicking outside
document.addEventListener('click', (e) => {
    const burgerMenu = document.querySelector('.burger-menu');
    const dropdown = document.getElementById('burgerDropdown');
    
    if (burgerMenu && dropdown && !burgerMenu.contains(e.target)) {
        dropdown.style.display = 'none';
    }
});

// ==================== COMPLEX SCHEDULE MANAGEMENT ====================

/**
 * Toggle between simple and complex schedule modes
 */
function toggleScheduleMode() {
    const useComplex = document.getElementById('useComplexSchedule').checked;
    const simpleSchedule = document.getElementById('simpleSchedule');
    const complexSchedule = document.getElementById('complexSchedule');
    
    if (useComplex) {
        simpleSchedule.style.display = 'none';
        complexSchedule.style.display = 'block';
        // Populate complex schedule with current data
        populateComplexSchedule();
    } else {
        simpleSchedule.style.display = 'block';
        complexSchedule.style.display = 'none';
    }
    
    // Update the setting
    tracker.settings.useComplexSchedule = useComplex;
    saveSettings();
}

/**
 * Populate complex schedule UI with current data
 */
function populateComplexSchedule() {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    days.forEach(day => {
        const container = document.getElementById(`${day}-ranges`);
        const ranges = tracker.settings.complexSchedule[day] || [];
        
        // Clear existing ranges
        container.innerHTML = '';
        
        if (ranges.length === 0) {
            container.innerHTML = '<div class="empty-schedule">No activity hours set for this day</div>';
        } else {
            ranges.forEach((range, index) => {
                addTimeRangeElement(day, range.start, range.end, index);
            });
        }
    });
}

/**
 * Add a new time range for a specific day
 */
function addTimeRange(day) {
    const ranges = tracker.settings.complexSchedule[day] || [];
    const newRange = { start: '09:00', end: '17:00' };
    ranges.push(newRange);
    
    // Update the tracker settings
    tracker.settings.complexSchedule[day] = ranges;
    saveSettings();
    
    // Update UI
    const container = document.getElementById(`${day}-ranges`);
    if (container.querySelector('.empty-schedule')) {
        container.innerHTML = '';
    }
    
    addTimeRangeElement(day, newRange.start, newRange.end, ranges.length - 1);
}

/**
 * Add a time range element to the UI
 */
function addTimeRangeElement(day, startTime, endTime, index) {
    const container = document.getElementById(`${day}-ranges`);
    
    const rangeDiv = document.createElement('div');
    rangeDiv.className = 'time-range';
    rangeDiv.dataset.index = index;
    
    rangeDiv.innerHTML = `
        <input type="time" value="${startTime}" onchange="updateTimeRange('${day}', ${index}, 'start', this.value)">
        <span class="range-separator">to</span>
        <input type="time" value="${endTime}" onchange="updateTimeRange('${day}', ${index}, 'end', this.value)">
        <button type="button" class="remove-range" onclick="removeTimeRange('${day}', ${index})" title="Remove this time range">×</button>
    `;
    
    container.appendChild(rangeDiv);
}

/**
 * Update a time range when inputs change
 */
function updateTimeRange(day, index, field, value) {
    const ranges = tracker.settings.complexSchedule[day] || [];
    if (ranges[index]) {
        ranges[index][field] = value;
        tracker.settings.complexSchedule[day] = ranges;
        saveSettings();
    }
}

/**
 * Remove a time range
 */
function removeTimeRange(day, index) {
    const ranges = tracker.settings.complexSchedule[day] || [];
    ranges.splice(index, 1);
    tracker.settings.complexSchedule[day] = ranges;
    saveSettings();
    
    // Refresh the UI for this day
    const container = document.getElementById(`${day}-ranges`);
    container.innerHTML = '';
    
    if (ranges.length === 0) {
        container.innerHTML = '<div class="empty-schedule">No activity hours set for this day</div>';
    } else {
        ranges.forEach((range, newIndex) => {
            addTimeRangeElement(day, range.start, range.end, newIndex);
        });
    }
}

// ==================== WORKSPACE MANAGEMENT UI ====================

/**
 * Open workspace manager modal
 */
function openWorkspaceManager() {
    const modal = document.getElementById('workspaceManagerModal');
    if (modal && tracker) {
        // Update current workspace name
        const currentNameSpan = document.getElementById('currentWorkspaceName');
        if (currentNameSpan) {
            currentNameSpan.textContent = tracker.currentWorkspace;
        }
        
        // Populate workspace list
        populateWorkspaceList();
        
        modal.style.display = 'block';
    }
}

/**
 * Close workspace manager modal
 */
function closeWorkspaceManager() {
    const modal = document.getElementById('workspaceManagerModal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    // Clear input
    const input = document.getElementById('newWorkspaceName');
    if (input) {
        input.value = '';
    }
}

/**
 * Populate the workspace list
 */
function populateWorkspaceList() {
    const listContainer = document.getElementById('workspaceList');
    if (!listContainer || !tracker) return;
    
    const workspaceNames = tracker.getWorkspaceNames();
    
    if (workspaceNames.length === 0) {
        listContainer.innerHTML = '<p class="empty-state">No workspaces found.</p>';
        return;
    }
    
    let html = '';
    workspaceNames.forEach(name => {
        const isCurrent = name === tracker.currentWorkspace;
        const isDefault = name === 'Default';
        
        html += `<div class="workspace-item ${isCurrent ? 'current' : ''}">
            <div class="workspace-info">
                <span class="workspace-name">${name}</span>
                ${isCurrent ? '<span class="current-badge">Current</span>' : ''}
            </div>
            <div class="workspace-actions">
                ${!isCurrent ? `<button class="btn btn-small btn-primary" onclick="switchToWorkspace('${name}')">Switch</button>` : ''}
                ${!isDefault && !isCurrent ? `<button class="btn btn-small btn-secondary" onclick="renameWorkspacePrompt('${name}')">Rename</button>` : ''}
                ${!isDefault && !isCurrent ? `<button class="btn btn-small btn-danger" onclick="deleteWorkspacePrompt('${name}')">Delete</button>` : ''}
            </div>
        </div>`;
    });
    
    listContainer.innerHTML = html;
}

/**
 * Create a new workspace
 */
function createNewWorkspace() {
    const input = document.getElementById('newWorkspaceName');
    if (!input || !tracker) return;
    
    const workspaceName = input.value.trim();
    if (!workspaceName) {
        alert('Please enter a workspace name');
        return;
    }
    
    if (tracker.createWorkspace(workspaceName)) {
        input.value = '';
        populateWorkspaceList();
        console.log(`Created workspace: ${workspaceName}`);
    }
}

/**
 * Switch to a different workspace
 */
function switchToWorkspace(workspaceName) {
    if (!tracker) return;
    
    tracker.switchWorkspace(workspaceName);
    
    // Update current workspace display
    const currentNameSpan = document.getElementById('currentWorkspaceName');
    if (currentNameSpan) {
        currentNameSpan.textContent = workspaceName;
    }
    
    // Refresh workspace list
    populateWorkspaceList();
    
    console.log(`Switched to workspace: ${workspaceName}`);
}

/**
 * Prompt to rename a workspace
 */
function renameWorkspacePrompt(oldName) {
    const newName = prompt(`Rename workspace "${oldName}" to:`, oldName);
    if (newName && newName.trim() && newName.trim() !== oldName) {
        if (tracker && tracker.renameWorkspace(oldName, newName.trim())) {
            populateWorkspaceList();
            
            // Update current workspace display if needed
            const currentNameSpan = document.getElementById('currentWorkspaceName');
            if (currentNameSpan && tracker.currentWorkspace === newName.trim()) {
                currentNameSpan.textContent = newName.trim();
            }
            
            console.log(`Renamed workspace ${oldName} to ${newName.trim()}`);
        }
    }
}

/**
 * Prompt to delete a workspace
 */
function deleteWorkspacePrompt(workspaceName) {
    if (confirm(`Are you sure you want to delete workspace "${workspaceName}"?\n\nThis action cannot be undone and will permanently delete all activities and settings in this workspace.`)) {
        if (tracker && tracker.deleteWorkspace(workspaceName)) {
            populateWorkspaceList();
            console.log(`Deleted workspace: ${workspaceName}`);
        }
    }
}

/**
 * Handle Enter key in workspace name input
 */
document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('newWorkspaceName');
    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                createNewWorkspace();
            }
        });
    }
});

// Export for testing purposes
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        showSection,
        addCurrentTime,
        generateReport,
        setWeeklyReport,
        previousWeek,
        nextWeek,
        downloadReport,
        openReportInNewTab,
        saveSettings,
        enableNotifications,
        testNotification,
        testNotificationSound,
        refreshNotificationStatus,
        clearAllData,
        closeEditModal,
        togglePause,
        exportDatabase,
        importDatabase,
        handleImportFile,
        runServiceWorkerTest,
        previewNotificationSound,
        showTemplateGuide,
        closeTemplateGuide,
        showAbout,
        closeAbout,
        updateCopyrightYear,
        requestNotificationPermission,
        declineNotificationPermission,
        forceEnableNotifications,
        copyReportToClipboard,
        toggleBurgerMenu,
        closeBurgerMenu,
        resetActivityForm,
        resetTodoForm,
        resetNotesForm,
        adjustDueDate,
        updateDueDateSectionVisibility,
        openWorkspaceManager,
        closeWorkspaceManager,
        createNewWorkspace,
        switchToWorkspace,
        renameWorkspacePrompt,
        deleteWorkspacePrompt,
        toggleScheduleMode,
        addTimeRange,
        updateTimeRange,
        removeTimeRange
    };
}

// Ensure critical functions are available globally for onclick handlers
if (typeof window !== 'undefined') {
    window.resetActivityForm = resetActivityForm;
    window.resetTodoForm = resetTodoForm;
    window.resetNotesForm = resetNotesForm;
    window.adjustDueDate = adjustDueDate;
    window.updateDueDateSectionVisibility = updateDueDateSectionVisibility;
    window.openWorkspaceManager = openWorkspaceManager;
    window.closeWorkspaceManager = closeWorkspaceManager;
    window.createNewWorkspace = createNewWorkspace;
    window.switchToWorkspace = switchToWorkspace;
    window.renameWorkspacePrompt = renameWorkspacePrompt;
    window.deleteWorkspacePrompt = deleteWorkspacePrompt;
    window.toggleScheduleMode = toggleScheduleMode;
    window.addTimeRange = addTimeRange;
    window.updateTimeRange = updateTimeRange;
    window.removeTimeRange = removeTimeRange;
}
