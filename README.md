# Activity Tracker

A modern, offline-capable web application for tracking daily activities and todos with intelligent notifications and comprehensive reporting.

## Features

### Core Functionality
- **Activity Logging**: Quick and easy activity entry with timestamps
- **Todo Management**: Add todo items with due dates and completion tracking
- **Note Taking**: Rich note-taking with markdown support
- **Tagging and Searching**: Categorize items with hashtags and retrieve through powerful search
- **Smart Notifications**: Configurable reminders during your active hours
- **Pomodoro Timer**: Fully customizable Pomodoro sessions with work/break cycles
- **Inline Replies**: Log activities directly from notifications
- **Multi-language Support**: Complete interface in 14 languages
- **Offline Support**: Progressive Web App that works without internet
- **Privacy First**: All data stored privately and locally in your browser

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

### Internationalization
- **14 Languages Supported**: English, French, German, Spanish, Italian, Portuguese, Chinese, Japanese, Welsh, Russian, Dutch, Korean, Greek, Arabic
- **Native Language Names**: Language picker shows flags and native names (e.g., "Français", "Deutsch")
- **Complete Translation**: All UI elements, settings, modals, and documentation translated
- **RTL Support**: Right-to-left text direction support for Arabic
- **Locale-aware Formatting**: Dates, times, and numbers formatted per regional preferences
- **Multilingual Documentation**: User guides and template documentation in all languages

### Technical Features
- **Progressive Web App (PWA)**: Install on any device like a native app
- **Service Worker**: Background notifications and offline functionality
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Modern UI**: Glass morphism design with smooth animations and dark mode
- **Build-time Internationalization**: Efficient translation processing with separate files per language

## Quick Start

### Development Setup

1. **Clone or download** the project files
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Development build** (unminified with verbose output):
   ```bash
   npm run dev
   # or
   npm run build:dev
   ```
4. **Production build** (minified for deployment):
   ```bash  
   npm run build
   # or
   npm run build:prod
   ```
5. **Test locally**: Use your preferred local server to serve the `dist/` directory

### Production Deployment

The application builds into multiple language-specific HTML files for global deployment:

1. **Build for production**:
   ```bash
   npm run build
   ```
2. **Deploy the entire `dist/` folder** to your web server, which contains:
   - `index.html` (English version)
   - `index.fr.html`, `index.de.html`, etc. (other languages)
   - `sw.js` (Service Worker)
   - `favicon.ico`
3. **Optional**: Configure your web server to serve appropriate language versions based on user preferences

### Language Selection

**Accessing Different Languages:**
- **Via URL**: Access specific languages directly (e.g., `index.fr.html` for French, `index.de.html` for German)
- **Via UI**: Use the language picker in the burger menu (☰) → "Language" → select from 14 available languages
- **Auto-detection**: The app can detect your browser's language preference

**Available Languages:**
- 🇬🇧 English (`index.html`)
- 🇫🇷 French (`index.fr.html`) 
- 🇩🇪 German (`index.de.html`)
- 🇪🇸 Spanish (`index.es.html`)
- 🇮🇹 Italian (`index.it.html`)
- 🇵🇹 Portuguese (`index.pt.html`)
- 🇨🇳 Chinese (`index.zh.html`)
- 🇯🇵 Japanese (`index.ja.html`)
- 🏴󠁧󠁢󠁷󠁬󠁳󠁿 Welsh (`index.cy.html`)
- 🇷🇺 Russian (`index.ru.html`)
- 🇳🇱 Dutch (`index.nl.html`)
- 🇰🇷 Korean (`index.ko.html`)
- 🇬🇷 Greek (`index.el.html`)
- 🇸🇦 Arabic (`index.ar.html`) *with RTL support*

### Build Options

**Advanced Build Commands:**
```bash
# Build with verbose output
npm run build:dev -- --verbose

# Build without minification  
npm run build -- --no-minify

# Build without internationalization
npm run build -- --no-i18n

# Clean build directory
npm run clean
```

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

## Development & Contributing

### Project Structure

```
activity-tracker/
├── src/
│   ├── index.html          # Main HTML template with translation placeholders
│   ├── styles/main.css     # All styles including dark mode and responsive design
│   ├── scripts/            # JavaScript modules (loaded in specific order)
│   └── sw.js              # Service Worker for PWA functionality
├── i18n/                  # Translation files for 14 languages
│   ├── en.json            # English (base language)
│   ├── fr.json            # French translations
│   └── ...                # Other language files
├── guides/                # Multilingual documentation
│   ├── user-guide/        # User guides in all languages
│   └── template-guide/    # Template documentation in all languages
├── build.cjs              # Custom build system with i18n support
└── dist/                  # Built files (generated)
    ├── index.html         # English version
    ├── index.fr.html      # French version
    └── ...                # Other language versions
```

### Adding Translations

**For new translatable text:**
1. Never hardcode English strings in HTML or JavaScript
2. Use translation placeholder syntax: `t('section.key')`
3. Add translation keys to `/i18n/en.json` first
4. Add translations to all other language files
5. Test with `npm run build:dev`

**Translation key naming:**
- Use hierarchical structure: `common.save`, `settings.theme`, `modals.confirm.title`
- Be descriptive and context-specific
- Group by UI section for maintainability

### Testing

Run the comprehensive test suite:

```bash
npm test
```

**Test Coverage:**
- Foundation tests (Jest setup, DOM, browser APIs)
- Edit dialog functionality
- Notes system and keyboard shortcuts
- UI interactions and modal behaviors

## Technical Details

### Build System
- **Custom build process**: Combines all assets into optimized single-file-per-language output
- **Translation processing**: Build-time replacement of `t('key')` placeholders with actual translations
- **Minification**: Terser for JavaScript, CleanCSS for CSS, html-minifier-terser for HTML
- **Version management**: Automatic version numbering with daily build increments
- **PWA optimization**: Service Worker and manifest generation

### Browser Support
- **Modern browsers**: Chrome 80+, Firefox 80+, Safari 14+, Edge 80+
- **PWA features**: Installation, offline support, background notifications
- **Responsive design**: Mobile, tablet, and desktop optimized
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support

### Privacy & Security
- **Local storage only**: No external servers, all data stays on your device
- **No tracking**: No analytics, cookies, or third-party scripts
- **Offline capable**: Works completely without internet connection
- **Open source**: Full transparency with auditable code

## License

This project is open source. See individual file headers for specific licensing terms.

---

**Activity Tracker** - A privacy-focused, multilingual personal productivity application built with modern web technologies.
- Mobile browsers with PWA support

## License

MIT License - see LICENSE file for details.
