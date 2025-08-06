const fs = require('fs-extra');
const path = require('path');
const { minify: minifyJS } = require('terser');
const CleanCSS = require('clean-css');
const { minify: minifyHTML } = require('html-minifier-terser');

class ActivityTrackerBuilder {
    constructor(options = {}) {
        this.srcDir = path.join(__dirname, 'src');
        this.distDir = path.join(__dirname, 'dist');
        this.i18nDir = path.join(__dirname, 'i18n');
        this.minify = options.minify !== false; // Default to true
        this.verbose = options.verbose || false;
        this.enableI18n = options.i18n !== false; // Default to true
    }

    async build() {
        console.log('🚀 Building Activity Tracker...');
        const startTime = Date.now();
        
        // Ensure dist directory exists
        await fs.ensureDir(this.distDir);
        
        try {
            // Get version for this build first
            const version = this.getVersion();
            
            // Read HTML template
            const htmlTemplate = await fs.readFile(
                path.join(this.srcDir, 'index.html'), 
                'utf8'
            );
            
            // Read and combine CSS
            const css = this.minify ? await this.readAndMinifyCSS() : await this.readCSS();
            
            // Read and combine JavaScript
            const js = this.minify ? await this.readAndMinifyJavaScript(version) : await this.readJavaScript(version);
            
            if (this.verbose) {
                console.log(`📊 CSS size: ${Math.round(css.length / 1024)}KB`);
                console.log(`📊 JS size: ${Math.round(js.length / 1024)}KB`);
                console.log(`📊 Minification: ${this.minify ? 'enabled' : 'disabled'}`);
                console.log(`🌐 I18n: ${this.enableI18n ? 'enabled' : 'disabled'}`);
            }
            
            // Build language versions if i18n is enabled
            if (this.enableI18n && await fs.pathExists(this.i18nDir)) {
                await this.buildI18nVersions(htmlTemplate, css, js, version);
            } else {
                // Build default version only
                await this.buildSingleVersion(htmlTemplate, css, js, version, 'index.html');
            }
            
            // Copy static assets
            await this.copyStaticAssets();
            
            const endTime = Date.now();
            const buildTime = endTime - startTime;
            
            console.log('✅ Build completed successfully!');
            console.log(`📁 Output directory: ${this.distDir}`);
            console.log(`⚡ Build time: ${buildTime}ms`);
            
        } catch (error) {
            console.error('❌ Build failed:', error.message);
            process.exit(1);
        }
    }
    
    async buildI18nVersions(htmlTemplate, css, js, version) {
        const i18nFiles = await fs.readdir(this.i18nDir);
        const translationFiles = i18nFiles.filter(file => file.endsWith('.json'));
        
        console.log(`🌐 Building ${translationFiles.length} language versions...`);
        
        for (const file of translationFiles) {
            const langCode = path.basename(file, '.json');
            const translationPath = path.join(this.i18nDir, file);
            
            try {
                const translation = JSON.parse(await fs.readFile(translationPath, 'utf8'));
                const filename = translation.meta?.filename || `index.${langCode}.html`;
                
                // Apply translations to HTML template and JavaScript
                const localizedHTML = await this.applyTranslations(htmlTemplate, translation, langCode);
                const localizedJS = this.applyTranslationsToText(js, translation);
                
                // Build this language version
                await this.buildSingleVersion(localizedHTML, css, localizedJS, version, filename, langCode);
                
                if (this.verbose) {
                    console.log(`✅ Built ${translation.meta?.language || langCode} version: ${filename}`);
                }
            } catch (error) {
                console.error(`❌ Failed to build ${langCode} version:`, error.message);
            }
        }
    }
    
    async buildSingleVersion(htmlTemplate, css, js, version, filename, langCode = null) {
        // Replace placeholders in HTML template
        let html = htmlTemplate
            .replace('{{CSS}}', css)
            .replace('{{JAVASCRIPT}}', js)
            .replace('{{VERSION}}', version);
        
        // Add language attribute if specified
        if (langCode) {
            html = html.replace('<html>', `<html lang="${langCode}">`);
        }
        
        // Minify HTML if requested
        if (this.minify) {
            html = await this.minifyHTMLContent(html);
        }
        
        // Write final HTML file
        await fs.writeFile(
            path.join(this.distDir, filename), 
            html
        );
        
        return html;
    }
    
    async applyTranslations(html, translation, langCode) {
        let translatedHTML = html;
        
        // Helper function to safely get nested translation values
        const getTranslation = (key) => {
            const keys = key.split('.');
            let value = translation;
            
            for (const k of keys) {
                if (value && typeof value === 'object' && k in value) {
                    value = value[k];
                } else {
                    return key; // Return original key if translation not found
                }
            }
            
            return typeof value === 'string' ? value : key;
        };
        
        // Replace all translation placeholders in the format t('key') or t("key")
        translatedHTML = translatedHTML.replace(/t\(['"]([^'"]+)['"]\)/g, (match, key) => {
            return getTranslation(key);
        });
        
        // Load and inject guide content
        translatedHTML = await this.loadGuideContent(translatedHTML, langCode);
        
        // Replace document title and other meta information
        if (translation.app?.title) {
            translatedHTML = translatedHTML.replace(
                /<title>[^<]*<\/title>/,
                `<title>${translation.app.title}</title>`
            );
        }
        
        // Set text direction if specified
        if (translation.meta?.direction) {
            translatedHTML = translatedHTML.replace(
                /<html[^>]*>/,
                `<html dir="${translation.meta.direction}">`
            );
        }
        
        return translatedHTML;
    }
    
    applyTranslationsToText(text, translation) {
        // Helper function to safely get nested translation values
        const getTranslation = (key) => {
            const keys = key.split('.');
            let value = translation;
            
            for (const k of keys) {
                if (value && typeof value === 'object' && k in value) {
                    value = value[k];
                } else {
                    return key; // Return original key if translation not found
                }
            }
            
            return typeof value === 'string' ? value : key;
        };
        
        // Replace all translation placeholders in multiple formats
        // Handle both regular quotes and escaped quotes in template literals
        return text.replace(/\bt\(\\?['"]([^'"\\]+)\\?['"]?\)/g, (match, key, offset, string) => {
            const translation = getTranslation(key);
            
            // Context detection for quote handling
            const charBefore = string.charAt(offset - 1);
            const charAfter = string.charAt(offset + match.length);
            
            // Look for surrounding context to determine if we're in HTML/template literal context
            const contextBefore = string.substring(Math.max(0, offset - 50), offset);
            const contextAfter = string.substring(offset + match.length, Math.min(string.length, offset + match.length + 50));
            
            // Case 1: Direct quote wrapping like "t('key')" in HTML attributes
            if ((charBefore === '"' && charAfter === '"') || (charBefore === "'" && charAfter === "'")) {
                return translation.replace(/"/g, '\\"');
            }
            
            // Case 2: Inside template literals (between backticks) or HTML context
            // Look for template literal patterns or HTML tags
            const inTemplateLiteral = contextBefore.includes('`') || contextAfter.includes('`');
            const inHtmlContext = contextBefore.includes('<') || contextAfter.includes('>');
            
            if (inTemplateLiteral || inHtmlContext) {
                // In template literals or HTML, usually don't need quotes
                return translation.replace(/"/g, '\\"');
            } else {
                // For direct JavaScript assignments like textContent = t('key'), add quotes
                return `"${translation.replace(/"/g, '\\"')}"`;
            }
        });
    }
    
    async loadGuideContent(html, langCode) {
        let processedHTML = html;
        const guidesDir = path.join(__dirname, 'guides');
        
        // Load User Guide content
        try {
            const userGuideFile = path.join(guidesDir, 'user-guide', `${langCode}.html`);
            if (await fs.pathExists(userGuideFile)) {
                const userGuideContent = await fs.readFile(userGuideFile, 'utf8');
                processedHTML = processedHTML.replace('{{USER_GUIDE_CONTENT}}', userGuideContent);
            } else {
                // Fallback to English if language version doesn't exist
                const fallbackFile = path.join(guidesDir, 'user-guide', 'en.html');
                if (await fs.pathExists(fallbackFile)) {
                    const fallbackContent = await fs.readFile(fallbackFile, 'utf8');
                    processedHTML = processedHTML.replace('{{USER_GUIDE_CONTENT}}', fallbackContent);
                }
            }
        } catch (error) {
            console.warn(`Warning: Could not load user guide for ${langCode}:`, error.message);
            processedHTML = processedHTML.replace('{{USER_GUIDE_CONTENT}}', '<p>User guide not available</p>');
        }
        
        // Load Template Guide content
        try {
            const templateGuideFile = path.join(guidesDir, 'template-guide', `${langCode}.html`);
            if (await fs.pathExists(templateGuideFile)) {
                const templateGuideContent = await fs.readFile(templateGuideFile, 'utf8');
                processedHTML = processedHTML.replace('{{TEMPLATE_GUIDE_CONTENT}}', templateGuideContent);
            } else {
                // Fallback to English if language version doesn't exist
                const fallbackFile = path.join(guidesDir, 'template-guide', 'en.html');
                if (await fs.pathExists(fallbackFile)) {
                    const fallbackContent = await fs.readFile(fallbackFile, 'utf8');
                    processedHTML = processedHTML.replace('{{TEMPLATE_GUIDE_CONTENT}}', fallbackContent);
                }
            }
        } catch (error) {
            console.warn(`Warning: Could not load template guide for ${langCode}:`, error.message);
            processedHTML = processedHTML.replace('{{TEMPLATE_GUIDE_CONTENT}}', '<p>Template guide not available</p>');
        }
        
        return processedHTML;
    }
    
    async copyStaticAssets() {
        // Process service worker (minify if needed)
        const swContent = await fs.readFile(
            path.join(this.srcDir, 'sw.js'),
            'utf8'
        );
        
        let processedSW = swContent;
        if (this.minify) {
            const result = await minifyJS(swContent, {
                compress: {
                    drop_console: false, // Keep console logs in SW for debugging
                    drop_debugger: true,
                    dead_code: true
                },
                mangle: {
                    reserved: [] // No reserved names needed for SW
                },
                format: {
                    comments: false
                }
            });
            
            if (result.error) {
                console.warn('⚠️ Service Worker minification failed:', result.error);
                processedSW = swContent; // Fallback to original
            } else {
                processedSW = result.code;
                if (this.verbose) {
                    const originalSize = Math.round(swContent.length / 1024);
                    const minifiedSize = Math.round(processedSW.length / 1024);
                    console.log(`📦 Service Worker: ${originalSize}KB → ${minifiedSize}KB (${Math.round((1 - minifiedSize/originalSize) * 100)}% reduction)`);
                }
            }
        }
        
        await fs.writeFile(
            path.join(this.distDir, 'sw.js'),
            processedSW
        );

        const faviconPath = path.join(this.srcDir, 'favicon.ico');
        if (await fs.pathExists(faviconPath)) {
            await fs.copy(
                faviconPath,
                path.join(this.distDir, 'favicon.ico')
            );
            console.log('📄 Favicon copied');
        }
    }
    
    async readCSS() {
        const cssPath = path.join(this.srcDir, 'styles', 'main.css');
        return await fs.readFile(cssPath, 'utf8');
    }
    
    async readAndMinifyCSS() {
        const cssPath = path.join(this.srcDir, 'styles', 'main.css');
        const css = await fs.readFile(cssPath, 'utf8');
        
        const cleanCSS = new CleanCSS({
            level: 2, // Advanced optimizations
            returnPromise: false
        });
        
        const result = cleanCSS.minify(css);
        
        if (result.errors && result.errors.length > 0) {
            console.warn('CSS minification warnings:', result.errors);
        }
        
        return result.styles;
    }
    
    async readJavaScript(version) {
        const scriptsDir = path.join(this.srcDir, 'scripts');
        
        // Read files in specific order
        const files = [
            'utils.js',
            'sounds.js',
            'pauseManager.js',
            'pomodoroManager.js',
            'markdownRenderer.js',
            'templating.js',
            'report-templates.js',
            'versionHistory.js',
            'ActivityTracker.js', 
            'reports.js', 
            'main.js'
        ];
        
        let combinedJS = `// Application version\nconst APP_VERSION = '${version}';\n\n`;
        
        for (const file of files) {
            const filePath = path.join(scriptsDir, file);
            if (await fs.pathExists(filePath)) {
                const content = await fs.readFile(filePath, 'utf8');
                combinedJS += `\n// === ${file} ===\n${content}\n`;
            }
        }
        
        return combinedJS;
    }
    
    async readAndMinifyJavaScript(version) {
        const scriptsDir = path.join(this.srcDir, 'scripts');
        
        // Read files in specific order
        const files = [
            'utils.js',
            'sounds.js',
            'pauseManager.js',
            'pomodoroManager.js',
            'markdownRenderer.js',
            'templating.js',
            'report-templates.js',
            'versionHistory.js',
            'ActivityTracker.js', 
            'reports.js', 
            'main.js'
        ];
        
        let combinedJS = `const APP_VERSION = '${version}';\n`;
        
        for (const file of files) {
            const filePath = path.join(scriptsDir, file);
            if (await fs.pathExists(filePath)) {
                const content = await fs.readFile(filePath, 'utf8');
                // Don't add file separators in production
                combinedJS += content + '\n';
            }
        }
        
        try {
            const result = await minifyJS(combinedJS, {
                compress: {
                    // Only drop console logs if minification is fully enabled
                    drop_console: this.minify ? ['log'] : false,
                    drop_debugger: true,
                    passes: 2
                },
                mangle: {
                    // Don't mangle function names that might be called from HTML
                    reserved: [
                        'showSection', 'addCurrentTime', 'generateReport', 'setWeeklyReport',
                        'previousWeek', 'nextWeek', 'downloadReport', 'saveSettings',
                        'enableNotifications', 'testNotification', 'testNotificationSound',
                        'refreshNotificationStatus', 'clearAllData', 'closeEditModal',
                        'togglePause', 'saveReportTemplates', 'resetReportTemplates',
                        'exportDatabase', 'importDatabase', 'handleImportFile', 'runServiceWorkerTest',
                        'openTemplateManager', 'closeTemplateManager', 'addNewTemplate', 'resetToDefaults',
                        'saveCurrentTemplate', 'deleteCurrentTemplate', 'duplicateCurrentTemplate',
                        'refreshTemplatePreview', 'saveAllTemplates', 'switchPreviewTab', 'switchReportPreviewTab', 'switchTemplateTab',
                        'adjustDueDate', 'resetActivityForm', 'resetTodoForm', 'resetNotesForm', 'updateDueDateSectionVisibility',
                        'openWorkspaceManager', 'closeWorkspaceManager', 'createNewWorkspace', 'switchToWorkspace', 'renameWorkspacePrompt', 'deleteWorkspacePrompt',
                        'toggleScheduleMode', 'addTimeRange', 'updateTimeRange', 'removeTimeRange'
                    ]
                },
                format: {
                    comments: false // Remove all comments
                }
            });
            
            if (result.error) {
                throw result.error;
            }
            
            return result.code;
        } catch (error) {
            console.error('❌ JavaScript minification failed:', error.message);
            console.log('Falling back to unminified JavaScript');
            return combinedJS;
        }
    }
    
    async minifyHTMLContent(html) {
        try {
            return await minifyHTML(html, {
                collapseWhitespace: true,
                removeComments: true,
                removeRedundantAttributes: true,
                removeScriptTypeAttributes: true,
                removeStyleLinkTypeAttributes: true,
                minifyCSS: true,
                minifyJS: false, // We handle JS separately
                useShortDoctype: true
            });
        } catch (error) {
            console.warn('HTML minification failed, using original:', error.message);
            return html;
        }
    }
    
    getVersion() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const dateKey = `${year}.${month}.${day}`;
        
        // Load version history from file
        const versionFile = path.join(__dirname, '.version-history.json');
        let versionHistory = {};
        
        try {
            if (fs.existsSync(versionFile)) {
                versionHistory = JSON.parse(fs.readFileSync(versionFile, 'utf8'));
            }
        } catch (error) {
            console.warn('Could not read version history, starting fresh');
            versionHistory = {};
        }
        
        // Get current build number for today, or start at 1
        const currentBuild = (versionHistory[dateKey] || 0) + 1;
        const buildNumber = String(currentBuild).padStart(2, '0');
        
        // Update version history
        versionHistory[dateKey] = currentBuild;
        
        // Clean up old entries (keep last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        Object.keys(versionHistory).forEach(key => {
            const [y, m, d] = key.split('.').map(Number);
            const entryDate = new Date(y, m - 1, d);
            if (entryDate < thirtyDaysAgo) {
                delete versionHistory[key];
            }
        });
        
        // Save updated version history
        try {
            fs.writeFileSync(versionFile, JSON.stringify(versionHistory, null, 2));
        } catch (error) {
            console.warn('Could not save version history:', error.message);
        }
        
        const version = `${year}.${month}.${day}.${buildNumber}`;
        console.log(`📋 Version: ${version} (build ${currentBuild} for ${dateKey})`);
        
        return version;
    }
}

// Run the builder
if (require.main === module) {
    const args = process.argv.slice(2);
    const options = {
        minify: !args.includes('--no-minify'),
        verbose: args.includes('--verbose'),
        i18n: !args.includes('--no-i18n')
    };
    
    const builder = new ActivityTrackerBuilder(options);
    builder.build();
}

module.exports = ActivityTrackerBuilder;
