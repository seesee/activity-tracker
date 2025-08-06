/**
 * Utility functions for the Activity Tracker application
 */

/**
 * Get user's date format preference
 * @returns {string} Selected date format
 */
function getUserDateFormat() {
    try {
        const settings = JSON.parse(localStorage.getItem('activitySettings') || '{}');
        return settings.dateFormat || 'default';
    } catch {
        return 'default';
    }
}

/**
 * Get date formatting options based on user preference
 * @param {string} formatType - Type of format (datetime, date, time)
 * @returns {Object} Formatting options for toLocaleDateString/toLocaleString
 */
function getDateFormatOptions(formatType = 'datetime') {
    const userFormat = getUserDateFormat();
    
    const formatMappings = {
        datetime: {
            default: {
                locale: 'en-GB',
                options: {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }
            },
            iso: {
                locale: 'sv-SE', // Swedish locale uses ISO format
                options: {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                }
            },
            us: {
                locale: 'en-US',
                options: {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                }
            },
            european: {
                locale: 'en-GB',
                options: {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                }
            },
            short: {
                locale: 'en-GB',
                options: {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }
            },
            long: {
                locale: 'en-GB',
                options: {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }
            }
        },
        date: {
            default: {
                locale: 'en-GB',
                options: {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }
            },
            iso: {
                locale: 'sv-SE',
                options: {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                }
            },
            us: {
                locale: 'en-US',
                options: {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                }
            },
            european: {
                locale: 'en-GB',
                options: {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                }
            },
            short: {
                locale: 'en-GB',
                options: {
                    month: 'short',
                    day: 'numeric'
                }
            },
            long: {
                locale: 'en-GB',
                options: {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }
            }
        }
    };

    return formatMappings[formatType][userFormat] || formatMappings[formatType]['default'];
}

/**
 * Format a timestamp to a readable date and time string using user's preferred format
 * @param {string} timestamp - ISO timestamp string
 * @returns {string} Formatted date and time
 */
function formatDateTime(timestamp) {
    const date = new Date(timestamp);
    const format = getDateFormatOptions('datetime');
    
    // For ISO format, handle manually for consistent YYYY-MM-DD HH:MM format
    if (getUserDateFormat() === 'iso') {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hour = String(date.getHours()).padStart(2, '0');
        const minute = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day} ${hour}:${minute}`;
    }
    
    return date.toLocaleString(format.locale, format.options);
}

/**
 * Format a date to a readable date string using user's preferred format
 * @param {Date} date - Date object
 * @returns {string} Formatted date
 */
function formatDate(date) {
    const format = getDateFormatOptions('date');
    
    // For ISO format, handle manually for consistent YYYY-MM-DD format
    if (getUserDateFormat() === 'iso') {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    return date.toLocaleDateString(format.locale, format.options);
}

/**
 * Format a timestamp to just the time portion
 * @param {string} timestamp - ISO timestamp string
 * @returns {string} Formatted time
 */
function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} HTML-safe text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Toast notification manager for stacking notifications
 */
const ToastManager = {
    notifications: [],
    container: null,

    init() {
        if (!this.container) {
            // Create container for notifications
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            this.container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                pointer-events: none;
                display: flex;
                flex-direction: column;
                gap: 10px;
                max-width: 400px;
            `;
            document.body.appendChild(this.container);

            // Add global styles for animations
            if (!document.getElementById('toast-styles')) {
                const style = document.createElement('style');
                style.id = 'toast-styles';
                style.textContent = `
                    @keyframes slideDownIn {
                        from {
                            transform: translateY(-100%);
                            opacity: 0;
                        }
                        to {
                            transform: translateY(0);
                            opacity: 1;
                        }
                    }
                    @keyframes slideRightOut {
                        from {
                            transform: translateX(0);
                            opacity: 1;
                        }
                        to {
                            transform: translateX(120%);
                            opacity: 0;
                        }
                    }
                    @keyframes pushDown {
                        from {
                            transform: translateY(0);
                        }
                        to {
                            transform: translateY(10px);
                        }
                    }
                `;
                document.head.appendChild(style);
            }
        }
    },

    show(message, type = 'info', duration = 3000) {
        this.init();

        const notification = document.createElement('div');
        notification.className = 'toast-notification';
        notification.style.cssText = `
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            background: ${type === 'success' ? '#48bb78' : type === 'error' ? '#f56565' : '#667eea'};
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            animation: slideDownIn 0.3s ease-out;
            pointer-events: auto;
            max-width: 100%;
            word-wrap: break-word;
        `;

        notification.innerHTML = message;
        
        // Add to container (will appear at top due to flex-direction: column)
        this.container.appendChild(notification);
        this.notifications.push(notification);

        // Push existing notifications down with animation
        this.notifications.slice(0, -1).forEach(existingNotification => {
            if (existingNotification.parentNode) {
                existingNotification.style.animation = 'pushDown 0.2s ease-out';
            }
        });

        // Auto-remove after duration
        setTimeout(() => {
            this.remove(notification);
        }, duration);

        return notification;
    },

    remove(notification) {
        if (!notification || !notification.parentNode) {
            return;
        }

        // Remove from tracking array immediately to prevent double removal
        const index = this.notifications.indexOf(notification);
        if (index > -1) {
            this.notifications.splice(index, 1);
        }

        // Clear any existing animation and apply slide out
        notification.style.animation = 'none';
        // Force reflow to ensure animation is cleared
        notification.offsetHeight;
        notification.style.animation = 'slideRightOut 0.3s ease-in forwards';
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }
};

/**
 * Show a temporary notification message
 * @param {string} message - Message to display
 * @param {string} type - Type of notification (info, success, error)
 * @param {number} duration - Duration in milliseconds
 */
function showNotification(message, type = 'info', duration = 3000) {
    return ToastManager.show(message, type, duration);
}

/**
 * Download a file with the given content
 * @param {string} content - File content
 * @param {string} filename - Desired filename
 * @param {string} mimeType - MIME type of the file
 */
function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Get the current time formatted for datetime-local input
 * @returns {string} Current time in datetime-local format
 */
function getCurrentTimeForInput() {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
}

/**
 * Escape CSV field content
 * @param {string} str - String to escape
 * @returns {string} CSV-safe string
 */
function escapeCsv(str) {
    if (!str) return '';
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

/**
 * Generate a unique ID based on timestamp
 * @returns {string} Unique identifier
 */
function generateId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

/**
 * Validate if a date string is valid
 * @param {string} dateString - Date string to validate
 * @returns {boolean} True if valid date
 */
function isValidDate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
}

/**
 * Get week start date (Monday) for a given date
 * @param {Date} date - Reference date
 * @returns {Date} Monday of that week
 */
function getWeekStart(date) {
    const monday = new Date(date);
    const dayOfWeek = date.getDay();
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    monday.setDate(date.getDate() + daysToMonday);
    monday.setHours(0, 0, 0, 0);
    return monday;
}

/**
 * Get week end date (Sunday) for a given date
 * @param {Date} date - Reference date
 * @returns {Date} Sunday of that week
 */
function getWeekEnd(date) {
    const sunday = new Date(getWeekStart(date));
    sunday.setDate(sunday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return sunday;
}

/**
 * Deep clone an object
 * @param {Object} obj - Object to clone
 * @returns {Object} Cloned object
 */
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    if (typeof obj === 'object') {
        const cloned = {};
        Object.keys(obj).forEach(key => {
            cloned[key] = deepClone(obj[key]);
        });
        return cloned;
    }
}

/**
 * Initialize date input formatters for all datetime-local inputs
 */
function initializeDateInputFormatters() {
    const dateTimeInputs = document.querySelectorAll('input[type="datetime-local"], input[type="date"]');
    
    dateTimeInputs.forEach(input => {
        // Skip if already initialized
        if (input.dataset.formatterInitialized) return;
        
        // Create a display element for the formatted date
        const display = document.createElement('div');
        display.className = 'date-format-display';
        display.style.cssText = `
            font-size: 0.85em;
            color: #666;
            margin-top: 2px;
            min-height: 1.2em;
        `;
        
        // Insert after the input
        input.parentNode.insertBefore(display, input.nextSibling);
        
        // Function to update the display
        const updateDisplay = () => {
            if (input.value) {
                try {
                    const date = new Date(input.value);
                    if (!isNaN(date.getTime())) {
                        if (input.type === 'datetime-local') {
                            display.textContent = t('schedule.datePreview.prefix') + formatDateTime(date.toISOString());
                        } else {
                            display.textContent = t('schedule.datePreview.prefix') + formatDate(date);
                        }
                        display.style.color = '#666';
                    } else {
                        display.textContent = '';
                    }
                } catch (error) {
                    display.textContent = '';
                }
            } else {
                display.textContent = '';
            }
        };
        
        // Listen for changes
        input.addEventListener('input', updateDisplay);
        input.addEventListener('change', updateDisplay);
        
        // Initial update
        updateDisplay();
        
        // Mark as initialized
        input.dataset.formatterInitialized = 'true';
    });
}

/**
 * Update all date input formatters when date format changes
 */
function updateDateInputFormatters() {
    const displays = document.querySelectorAll('.date-format-display');
    displays.forEach(display => {
        const input = display.previousElementSibling;
        if (input && input.value) {
            try {
                const date = new Date(input.value);
                if (!isNaN(date.getTime())) {
                    if (input.type === 'datetime-local') {
                        display.textContent = t('schedule.datePreview.prefix') + formatDateTime(date.toISOString());
                    } else {
                        display.textContent = t('schedule.datePreview.prefix') + formatDate(date);
                    }
                }
            } catch (error) {
                // Ignore errors
            }
        }
    });
}
