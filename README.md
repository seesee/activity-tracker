# Activity Tracker

A modern, offline-capable web application for tracking daily activities and todos with intelligent notifications and comprehensive reporting.

## Features

### Core Functionality
- **Activity Logging**: Quick and easy activity entry with timestamps
- **Todo Management**: Add Todo items with due dates and interactive checkboxes
- **Notes System**: Separate notes management with full search and filtering
- **Auto Bullet Descriptions**: Automatically format description lines as bullets or checkboxes
- **Tagging and Searching**: Categorise items and retrieve them through search
- **Smart Notifications**: Configurable reminders during activity hours
- **Pomodoro support**: Customisable Pomodoro sessions with optional tick simulation
- **Inline Replies**: Log activities directly from notifications
- **Offline Support**: Works without internet connection
- **Data Persistence**: All data stored privately and locally in your browser

### Reporting & Analytics
- **Flexible Reports**: Generate customisable reports for any date range using a powerful templating mechanism
- **Week Navigation**: Easy week-by-week activity review
- **Multiple Formats**: Export as HTML, Markdown, or CSV
- **Duration Tracking**: Automatic time calculations between activities
- **Activity Hours Capping**: Respect your configured activity hours

### Customisation & Settings
- **Complex Scheduling**: Set different working hours for each day with multiple time ranges
- **Simple Scheduling**: Traditional start/end time for all working days
- **Activity Days**: Configure which days you're active
- **Notification Intervals**: From 1 minute to 2 hours
- **Pause Controls**: Temporarily disable notifications
- **Sound Settings**: Optional notification sounds with multiple sound types
- **Auto Bullet Descriptions**: Toggle automatic bullet/checkbox formatting
- **Automatic Backups**: Background data backups with configurable frequency
- **Workspaces**: Organize different projects with isolated data and settings

### Technical Features
- **Progressive Web App (PWA)**: Install on any device
- **Background Sync**: Automatic backups via Web Background Sync API
- **Service Worker**: Background notifications, automatic backups, and offline support
- **Interactive Markdown**: Live checkbox functionality for todo management
- **Smart Templating**: Advanced report generation with checkbox cleanup
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Modern UI**: Glass morphism design with smooth animations

## Quick Start

### Development Setup

1. **Clone or download** the project files
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Development build**:
   ```bash
   npm run dev
   ```
4. **Production build**:
   ```bash  
   npm run build
   ```
5. **Serve locally**:
   ```bash
   npm run serve
   ```

### Production Deployment

The application builds into a single HTML file for easy deployment:

1. Run `npm run build`
2. Deploy the `dist/index.html` file to any web server
3. Optional: Copy `dist/sw.js` and `dist/favicon.ico` alongside

## User Guide

### Basic Usage

#### Logging Activities
1. Enter your activity in the main input field
2. Add tags using `#hashtag` syntax
3. Set due dates with `@YYYY-MM-DD` format  
4. Click "Add Activity" or press Enter

#### Working with Todos
1. Navigate to the "Todos" section or press **Ctrl+T**
2. Add items with optional due dates using `@YYYY-MM-DD` format
3. **Interactive Checkboxes**: Click to mark complete (when Auto Bullet Descriptions enabled)
4. **Smart Formatting**: Lines automatically get checkbox syntax `[ ]` and `[x]`
5. View overdue items highlighted in red
6. **Keyboard Shortcuts**:
   - **Shift+Enter**: Submit todo entry
   - **Ctrl+T**: Toggle todo section
   - **Ctrl+N**: Toggle notes section

#### Working with Notes  
1. Press **Ctrl+N** to open Notes section
2. Add notes with full search and filtering capabilities
3. Use hashtags for organisation
4. Notes are excluded from reports automatically

#### Setting Up Notifications
1. Go to **Settings** → **Activity Schedule**
2. Configure your activity days and hours
3. Set notification intervals (1-120 minutes)
4. Enable browser notifications when prompted
5. **Test Notifications**: Use "Test Notification" button in Settings

### Advanced Features

#### Complex Scheduling

**Enable Complex Schedule Mode:**
1. Go to **Settings** → **Activity Schedule**
2. Check **"Complex Schedule"** option
3. Configure each day individually with multiple time ranges

**Examples:**
- **Split Shifts**: 9am-12pm and 2pm-6pm on weekdays
- **Flexible Hours**: Different start/end times per day  
- **Part-time**: Custom hours on specific days only

**Adding Time Ranges:**
1. Click **"+ Add Range"** for any day
2. Set start and end times
3. Click **×** to remove unwanted ranges
4. Leave days empty for no activity hours

#### Workspaces

Organize different projects with completely isolated data:

1. Click the hamburger menu (☰)
2. Select **"Workspaces"**
3. Create new workspaces or switch between existing ones
4. Each workspace has its own activities, settings, and state

#### Pomodoro Mode

Structured work sessions with automatic break reminders:

1. Go to **Settings** → **Pomodoro Mode**  
2. Enable Pomodoro Mode
3. Customize work/break durations
4. Use the Pomodoro controls in the main interface

#### Auto Bullet Descriptions

Automatically format activity descriptions with bullets and interactive checkboxes:

1. Go to **Settings** → **General Settings**
2. Enable **"Auto Bullet Descriptions"**
3. Description lines are automatically formatted:
   - Regular activities get bullet points ("- ")
   - Todo items get interactive checkboxes
   - Click checkboxes to mark todos complete
   - Preserves existing formatting and nested lists

**How it works:**
- Lines without bullets automatically get "- " prefix
- Todo items get checkboxes instead: `[ ]` unchecked, `[x]` checked
- Clicking checkboxes saves completion state
- Reports automatically clean checkbox syntax for professional output

#### Automatic Backups

Set up background data backups that run even when the app isn't open:

1. Go to **Settings** → **Data Management**
2. Change **Backup Type** from "Turned off" to **"Automatic backups"**
3. Choose frequency: Daily, Weekly, Bi-weekly, or Monthly
4. Grant browser permissions when prompted
5. Backups run automatically in background via Service Worker

**Features:**
- Runs truly in background using Web Background Sync API
- Smart throttling prevents multiple backups within 20 seconds
- Status panel shows next backup countdown
- Missed backup recovery when app reopens
- User-friendly notifications on completion
- Manual backups always available alongside automatic ones

#### Advanced Reporting

Generate detailed reports with custom templates:

1. Navigate to **Reports** section
2. Select date range and format (HTML/Markdown/CSV)
3. Use template editor for custom report layouts
4. Export or view reports in new tabs
5. Checkbox syntax automatically cleaned from reports

### Settings Reference

#### General Settings
- **Theme**: Light, Dark, or System preference
- **Sound Settings**: Enable/disable with sound type selection (notification, chime, bell)
- **Pagination**: Items per page (10-100) 
- **Auto Bullet Descriptions**: Automatically format description lines with bullets/checkboxes
- **Confirmations**: Warnings for deletions and resets

#### Activity Schedule
- **Simple Mode**: Single start/end time for all activity days
- **Complex Mode**: Multiple time ranges per day
- **Activity Days**: Enable/disable specific days
- **Notification Intervals**: 1-120 minutes between reminders

#### Data Management Settings
- **Backup Type**: Choose from "Send backup reminder", "Automatic backups", or "Turned off"
- **Backup Frequency**: Daily, Weekly, Bi-weekly, or Monthly (for automatic backups)
- **Manual Backup**: Always available regardless of automatic backup settings
- **Import/Export**: Full database backup and restore functionality

#### Pomodoro Settings
- **Work Duration**: 1-60 minutes (default: 25)
- **Short Break**: 1-30 minutes (default: 5)  
- **Long Break**: 1-60 minutes (default: 15)
- **Sessions Until Long Break**: 2-10 sessions (default: 4)

## Testing

Run the test suite:

```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Generate coverage report:
```bash
npm run test:coverage
```

## Architecture

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Build System**: Custom Node.js builder with internationalization and minification
- **Storage**: Browser localStorage for offline operation
- **Background Services**: Service Worker with Background Sync API for automatic backups
- **Markdown Engine**: Custom renderer with HTML protection and interactive checkbox support
- **Templating System**: Advanced AST-based engine with comprehensive filtering
- **PWA**: Installable with offline capabilities and background operation

## Troubleshooting

### Automatic Backups Not Working
- **Check permissions**: Ensure notifications are allowed in browser settings
- **Background Sync support**: Works on Chrome/Edge, limited on Firefox/Safari
- **File protocol**: Automatic backups require `http://` or `https://`, not `file://`
- **Service Worker**: Check Settings → Diagnostics for Service Worker status

### Auto Bullet Descriptions Issues  
- **Not formatting**: Check "Auto Bullet Descriptions" is enabled in General Settings
- **Checkboxes not working**: Ensure the activity is marked as a "Todo" type
- **Missing styling**: Verify CSS has loaded properly

### File Downloads Blocked
- **Check browser settings**: Allow downloads from your domain
- **Test download**: Use "Test File Download" button in Settings → Diagnostics
- **Popup blockers**: May interfere with backup downloads

## Browser Support

- **Chrome/Edge 80+**: Full support including Background Sync
- **Firefox 75+**: Limited background sync support  
- **Safari 13+**: Basic functionality, no background sync
- **Mobile browsers**: PWA support required for full functionality

## License

MIT License - see LICENSE file for details.
