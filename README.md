# Activity Tracker

A modern, offline-capable web application for tracking daily activities and todos with intelligent notifications and comprehensive reporting.

## Features

### Core Functionality
- **Activity Logging**: Quick and easy activity entry with timestamps
- **Todo list**: Add Todo items with due dates
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

### Customisation
- **Complex Scheduling**: Set different working hours for each day with multiple time ranges
- **Simple Scheduling**: Traditional start/end time for all working days
- **Activity Days**: Configure which days you're active
- **Notification Intervals**: From 1 minute to 2 hours
- **Pause Controls**: Temporarily disable notifications
- **Sound Settings**: Optional notification sounds
- **Workspaces**: Organize different projects with isolated data and settings

### Technical Features
- **Progressive Web App (PWA)**: Install on any device
- **Service Worker**: Background notifications and offline support
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
1. Navigate to the "Todos" section
2. Add items with optional due dates
3. Mark complete with checkboxes
4. View overdue items highlighted in red

#### Setting Up Notifications
1. Go to **Settings** → **Activity Schedule**
2. Configure your activity days and hours
3. Set notification intervals (1-120 minutes)
4. Enable browser notifications when prompted

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

#### Advanced Reporting

Generate detailed reports with custom templates:

1. Navigate to **Reports** section
2. Select date range and format (HTML/Markdown/CSV)
3. Use template editor for custom report layouts
4. Export or view reports in new tabs

### Settings Reference

#### General Settings
- **Theme**: Light, Dark, or System preference
- **Sound**: Enable/disable notification sounds  
- **Pagination**: Items per page (10-100)
- **Confirmations**: Warnings for deletions and resets

#### Activity Schedule
- **Simple Mode**: Single start/end time for all activity days
- **Complex Mode**: Multiple time ranges per day
- **Activity Days**: Enable/disable specific days
- **Notification Intervals**: 1-120 minutes between reminders

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
- **Build System**: Custom Node.js builder with minification
- **Storage**: Browser localStorage for offline operation
- **Service Worker**: Background notifications and caching
- **PWA**: Installable with offline capabilities

## Browser Support

- Chrome/Edge 80+
- Firefox 75+  
- Safari 13+
- Mobile browsers with PWA support

## License

MIT License - see LICENSE file for details.
