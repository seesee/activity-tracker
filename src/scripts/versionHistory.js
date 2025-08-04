/**
 * Version History for Activity Tracker
 * Contains the last 5 major revisions with build versions and summaries
 */

const VERSION_HISTORY = [
    {
        commit: "b0709e0",
        date: "2025-08-04",
        summary: "Complete due date management system with overdue alerts, rescheduling, and smart prioritization"
    },
    {
        commit: "9355fbb",
        date: "2025-08-04",
        summary: "Major UI overhaul with burger menu, responsive design, and enhanced entry forms"
    },
    {
        commit: "85ee1a3",
        date: "2025-08-04",
        summary: "Navigation improvements, external link handling, version history, and user guide enhancements"
    },
    {
        commit: "59bb00b",
        date: "2025-08-04",
        summary: "Added comprehensive notes system with hashtag improvements and pause enhancements"
    },
    {
        commit: "3cf7365",
        date: "2025-08-03",
        summary: "Standalone web application with modular architecture and build system"
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