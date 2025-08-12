/**
 * Version History for Activity Tracker
 * Contains the last 5 major revisions with build versions and summaries
 */

const VERSION_HISTORY = [
    {
        commit: "TBD",
        date: "2025-08-12",
        summary: "Enhanced service worker diagnostics with comprehensive modal interface, statistics collection, and interactive features"
    },
    {
        commit: "46ff2e2",
        date: "2025-08-07", 
        summary: "Added SVG logo overlay to background. Fixed more todo/notes UI bugs. Updated Service Worker notifications"
    },
    {
        commit: "31b0120",
        date: "2025-08-07",
        summary: "Fixed todo/notes form submissions, improved contextual entry creation across all form types"
    },
    {
        commit: "24dacd7",
        date: "2025-08-05",
        summary: "Added complex activity schedule support"
    },
    {
        commit: "5398868",
        date: "2025-08-05",
        summary: "Added workspace system for organising separate projects and schedules"
    }
];

/**
 * Get the version history array
 * @returns {Array} Array of version history objects
 */
function getVersionHistory() {
    return VERSION_HISTORY;
}

/**
 * Get the current application version
 * @returns {string} Current version string
 */
function getCurrentVersion() {
    // This will be replaced by the build system with actual version
    return typeof APP_VERSION !== 'undefined' ? APP_VERSION : 'Development';
}

/**
 * Format version history for display
 * @returns {string} HTML formatted version history
 */
function formatVersionHistory() {
    const currentVersion = getCurrentVersion();
    let html = `<div class="version-current">
        <strong>Current Build:</strong> ${currentVersion}
    </div>
    <div class="version-history-list">
        <h5 style="margin: 16px 0 12px 0; color: #4a5568;">Recent Major Changes</h5>`;
    
    VERSION_HISTORY.forEach((entry, index) => {
        const isLatest = index === 0;
        const className = isLatest ? 'version-entry current' : 'version-entry';
        
        html += `<div class="${className}">
            <div class="version-header">
                <span class="version-number">${entry.commit}</span>
                <span class="version-date">${entry.date}</span>
            </div>
            <div class="version-summary">${entry.summary}</div>
        </div>`;
    });
    
    html += '</div>';
    return html;
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.VersionHistory = {
        getVersionHistory,
        getCurrentVersion,
        formatVersionHistory
    };
}

console.log('Version History module loaded');
