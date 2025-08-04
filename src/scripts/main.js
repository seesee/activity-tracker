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
    const copyrightYearElement = document.getElementById('copyrightYear');
    if (copyrightYearElement) {
        const startYear = 2025;
        const currentYear = new Date().getFullYear();
        
        if (currentYear === startYear) {
            copyrightYearElement.textContent = startYear.toString();
        } else if (currentYear > startYear) {
            copyrightYearElement.textContent = `${startYear}-${currentYear}`;
        } else {
            // Fallback for years before 2025 (shouldn't happen in practice)
            copyrightYearElement.textContent = startYear.toString();
        }
    }
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
    
    if (Object.keys(hashtagFrequency).length === 0) {
        cloudContainer.innerHTML = '<p>No hashtags found in your entries.</p>';
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
 * Set current date/time for any field
 */
function setCurrentDateTime(fieldId) {
    const field = document.getElementById(fieldId);
    if (field) {
        const now = new Date();
        field.value = now.toISOString().slice(0, 16);
    }
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
        tracker.togglePause();
    }
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
        // Clean up the hash
        history.replaceState(null, document.title, window.location.pathname + window.location.search);
    }

    console.log('Activity Tracker initialized successfully');
});

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
        // Don't trigger if currently focused on description textarea
        if (activeElement && activeElement.id === 'description') {
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
        closeBurgerMenu
    };
}
