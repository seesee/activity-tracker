/**
 * Reports functionality for Activity Tracker.
 * This version manually processes loops before sending to the templating engine.
 */
Object.assign(ActivityTracker.prototype, {
    
    /**
     * Initializes the report section, populating the template selector.
     */
    initReportTemplates() {
        this.templatingEngine = new TemplatingEngine();
        const templateSelector = document.getElementById('reportTemplate');
        if (!templateSelector) return;

        const templates = this.getReportTemplates();
        const defaultTemplates = window.ReportTemplates || {};
        
        templateSelector.innerHTML = Object.keys(templates).map(key => {
            const template = templates[key];
            const isCustom = !defaultTemplates[key];
            const displayName = isCustom ? `${template.name} (Custom)` : template.name;
            return `<option value="${key}">${displayName}</option>`;
        }).join('');
        
        console.log('Initialized report templates dropdown with', Object.keys(templates).length, 'templates');
    },

    /**
     * Prepares the data from entries for use in report templates.
     * @param {Array} entries - The raw activity entries.
     * @param {Date} startDate - The start date of the report.
     * @param {Date} endDate - The end date of the report.
     * @returns {object} A structured data object for the templating engine.
     */
    prepareReportData(entries, startDate, endDate) {
        console.log('Preparing report data with entries:', entries);
        
        const sortedEntries = [...entries].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        console.log('Sorted entries:', sortedEntries);
        
        const processedEntries = sortedEntries.map((entry, index) => {
            console.log('Processing entry:', entry);
            
            if (!entry.timestamp) {
                console.error('Entry missing timestamp:', entry);
            }
            
            const nextEntry = sortedEntries[index + 1];
            let endTime, duration;

            if (nextEntry) {
                endTime = new Date(nextEntry.timestamp);
                duration = Math.round((endTime - new Date(entry.timestamp)) / 60000);
            } else {
                const endOfDay = new Date(entry.timestamp);
                const [endHour, endMin] = this.settings.endTime.split(':').map(Number);
                endOfDay.setHours(endHour, endMin, 0, 0);
                endTime = new Date(Math.min(new Date(), endOfDay));
                duration = Math.round((endTime - new Date(entry.timestamp)) / 60000);
            }

            const processedEntry = { ...entry, endTime, duration };
            console.log('Processed entry:', processedEntry);
            return processedEntry;
        });

        const entriesByDate = {};
        processedEntries.forEach(entry => {
            const date = new Date(entry.timestamp).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            if (!entriesByDate[date]) {
                entriesByDate[date] = { entries: [], totalDuration: 0 };
            }
            entriesByDate[date].entries.push(entry);
            entriesByDate[date].totalDuration += entry.duration > 0 ? entry.duration : 0;
        });

        const days = Object.keys(entriesByDate).map(date => ({
            date,
            entries: entriesByDate[date].entries,
            totalDuration: entriesByDate[date].totalDuration
        }));

        console.log('Final days structure:', days);

        const totalDuration = days.reduce((sum, day) => sum + day.totalDuration, 0);

        return {
            report: {
                startDate,
                endDate,
                generatedDate: new Date(),
                totalEntries: processedEntries.length,
                totalDuration,
                activeDays: days.length,
            },
            days: days,
            entries: processedEntries
        };
    },

    /**
     * Manually processes a template with loops.
     * @param {string} templateString - The template string.
     * @param {object} data - The report data.
     * @returns {string} The fully rendered report.
     */
    renderReport(templateString, data) {
        // Use the templating engine's built-in loop processing
        return this.templatingEngine.render(templateString, data);
    },

    /**
     * Generate and display a report based on the selected date range.
     */
    generateReport() {
        const startDateInput = document.getElementById('reportStartDate').value;
        const endDateInput = document.getElementById('reportEndDate').value;

        if (!startDateInput || !endDateInput) {
            showNotification('Please select both start and end dates', 'error');
            return;
        }

        const start = new Date(startDateInput);
        const end = new Date(endDateInput);
        end.setHours(23, 59, 59, 999);

        const includeTodos = document.getElementById('includeTodos')?.value || 'exclude';
        const includeNotes = document.getElementById('includeNotes')?.value || 'exclude';
        
        const filteredEntries = this.entries.filter(entry => {
            const entryDate = new Date(entry.timestamp);
            const isInDateRange = entryDate >= start && entryDate <= end;
            
            // Handle notes filtering
            if (entry.isNote) {
                return includeNotes === 'include' && isInDateRange;
            }
            
            // Handle todos filtering
            if (entry.isTodo) {
                switch (includeTodos) {
                    case 'exclude':
                        return false;
                    case 'incomplete':
                        // Include incomplete todos (all todos are considered incomplete for now)
                        return isInDateRange;
                    case 'all':
                        return isInDateRange;
                    default:
                        return false;
                }
            }
            
            return isInDateRange;
        });

        this.currentReportEntries = filteredEntries;
        this.currentReportData = this.prepareReportData(filteredEntries, start, end);
        
        this.previewReport();
    },

    /**
     * Render a preview of the selected report template.
     */
    previewReport() {
        const previewEl = document.getElementById('reportPreview');
        if (!previewEl) return;

        const copyBtn = document.getElementById('copyReportBtn');
        
        if (!this.currentReportData || this.currentReportEntries.length === 0) {
            previewEl.innerHTML = 'No data for the selected period. Generate a report first.';
            if (copyBtn) copyBtn.style.display = 'none';
            return;
        }

        const templateKey = document.getElementById('reportTemplate').value;
        const templates = this.getReportTemplates();
        const template = templates[templateKey];

        if (!template) {
            previewEl.textContent = 'Error: Selected report template not found.';
            if (copyBtn) copyBtn.style.display = 'none';
            return;
        }

        // Check which tab is active
        const renderedTab = document.getElementById('reportPreviewTabRendered');
        const isRenderedView = renderedTab && renderedTab.classList.contains('active');

        try {
            const renderedContent = this.renderReport(template.template, this.currentReportData);
            
            if (isRenderedView) {
                // Show rendered view
                if (template.type === 'html') {
                    previewEl.innerHTML = `<iframe srcdoc="${this.templatingEngine.escapeHtml(renderedContent)}" style="width: 100%; height: 450px; border: none;"></iframe>`;
                } else if (template.type === 'markdown' && this.markdownRenderer) {
                    // Render markdown to HTML
                    const htmlContent = this.markdownRenderer.render(renderedContent);
                    previewEl.innerHTML = htmlContent;
                } else {
                    // Show as formatted text
                    previewEl.innerHTML = `<pre>${this.templatingEngine.escapeHtml(renderedContent)}</pre>`;
                }
            } else {
                // Show source view
                previewEl.innerHTML = `<pre>${this.templatingEngine.escapeHtml(renderedContent)}</pre>`;
            }
            // Show copy button when there's content
            if (copyBtn) copyBtn.style.display = 'inline-block';
        } catch (error) {
            previewEl.textContent = 'Error generating preview: ' + error.message;
            if (copyBtn) copyBtn.style.display = 'none';
        }
    },

    /**
     * Download the report using the selected template.
     */
    downloadReport() {
        if (!this.currentReportData || this.currentReportEntries.length === 0) {
            showNotification('Please generate a report with data first', 'error');
            return;
        }

        const templateKey = document.getElementById('reportTemplate').value;
        const templates = this.getReportTemplates();
        const template = templates[templateKey];
        const startDate = this.currentReportData.report.startDate;
        const endDate = this.currentReportData.report.endDate;

        const content = this.renderReport(template.template, this.currentReportData);
        
        const fileExtension = template.type;
        const mimeType = {
            html: 'text/html',
            markdown: 'text/markdown',
            csv: 'text/csv'
        }[fileExtension] || 'text/plain';

        const filename = `activity-report-${this.templatingEngine.formatDate(startDate, 'yyyy-mm-dd')}-to-${this.templatingEngine.formatDate(endDate, 'yyyy-mm-dd')}.${fileExtension}`;

        downloadFile(content, filename, mimeType);
        showNotification(`Report downloaded as ${template.name}`, 'success');
    },

    /**
     * Open the report in a new tab/window.
     */
    openReportInNewTab() {
        if (!this.currentReportData || this.currentReportEntries.length === 0) {
            showNotification('Please generate a report with data first', 'error');
            return;
        }

        const templateKey = document.getElementById('reportTemplate').value;
        const templates = this.getReportTemplates();
        const template = templates[templateKey];
        const startDate = this.currentReportData.report.startDate;
        const endDate = this.currentReportData.report.endDate;

        const content = this.renderReport(template.template, this.currentReportData);
        
        // Create appropriate content for new tab based on file type
        let finalContent = content;
        let mimeType = 'text/plain';
        
        if (template.type === 'html') {
            // For HTML, wrap in a complete HTML document
            const title = `Activity Report ${this.templatingEngine.formatDate(startDate, 'yyyy-mm-dd')} to ${this.templatingEngine.formatDate(endDate, 'yyyy-mm-dd')}`;
            finalContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
        table { border-collapse: collapse; width: 100%; margin: 1em 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        h1, h2, h3 { color: #333; }
        .hashtag { color: #38a169; font-weight: 500; }
    </style>
</head>
<body>
${content}
</body>
</html>`;
            mimeType = 'text/html';
        } else if (template.type === 'markdown') {
            // For Markdown, wrap in HTML with basic styling
            const title = `Activity Report ${this.templatingEngine.formatDate(startDate, 'yyyy-mm-dd')} to ${this.templatingEngine.formatDate(endDate, 'yyyy-mm-dd')}`;
            finalContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
        pre { white-space: pre-wrap; font-family: 'Monaco', 'Courier New', monospace; background: #f5f5f5; padding: 15px; border-radius: 5px; }
    </style>
</head>
<body>
    <pre>${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
</body>
</html>`;
            mimeType = 'text/html';
        } else if (template.type === 'csv') {
            // For CSV, show in a pre-formatted text display
            const title = `Activity Report ${this.templatingEngine.formatDate(startDate, 'yyyy-mm-dd')} to ${this.templatingEngine.formatDate(endDate, 'yyyy-mm-dd')}`;
            finalContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: 'Monaco', 'Courier New', monospace; line-height: 1.4; max-width: 1200px; margin: 0 auto; padding: 20px; }
        pre { white-space: pre-wrap; background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>Activity Report (CSV Format)</h1>
    <pre>${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
</body>
</html>`;
            mimeType = 'text/html';
        }

        try {
            // Create blob and object URL
            const blob = new Blob([finalContent], { type: mimeType });
            const url = URL.createObjectURL(blob);
            
            // Open in new tab
            const newWindow = window.open(url, '_blank');
            
            // Clean up the object URL after a delay
            setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 1000);
            
            if (newWindow) {
                showNotification(`Report opened in new tab`, 'success');
            } else {
                showNotification('Please allow popups for this site to open reports in new tabs', 'warning');
            }
        } catch (error) {
            console.error('Error opening report in new tab:', error);
            showNotification('Error opening report in new tab. Try downloading instead.', 'error');
        }
    },

    /**
     * Set report to the current week.
     */
    setWeeklyReport() {
        const now = new Date();
        this.currentWeekStart = getWeekStart(now);
        this.updateWeekFromCurrent();
        this.generateReport();
    },

    /**
     * Navigate to the previous week.
     */
    previousWeek() {
        if (!this.currentWeekStart) this.currentWeekStart = getWeekStart(new Date());
        this.currentWeekStart.setDate(this.currentWeekStart.getDate() - 7);
        this.updateWeekFromCurrent();
        this.generateReport();
    },

    /**
     * Navigate to the next week.
     */
    nextWeek() {
        if (!this.currentWeekStart) this.currentWeekStart = getWeekStart(new Date());
        this.currentWeekStart.setDate(this.currentWeekStart.getDate() + 7);
        this.updateWeekFromCurrent();
        this.generateReport();
    },

    /**
     * Update date inputs from the current week start date.
     */
    updateWeekFromCurrent() {
        const monday = new Date(this.currentWeekStart);
        const sunday = getWeekEnd(monday);

        document.getElementById('reportStartDate').value = monday.toISOString().split('T')[0];
        document.getElementById('reportEndDate').value = sunday.toISOString().split('T')[0];
        
        this.updateWeekDisplay();
    },

    /**
     * Update the week display text.
     */
    updateWeekDisplay() {
        if (!this.currentWeekStart) return;
        
        const monday = new Date(this.currentWeekStart);
        const sunday = getWeekEnd(monday);

        const weekText = `Week of ${monday.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${sunday.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
        
        document.getElementById('weekDisplay').textContent = weekText;
    }
});

// Helper functions for date calculations
function getWeekStart(d) {
    d = new Date(d);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
}

function getWeekEnd(d) {
    const start = getWeekStart(d);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return end;
}
