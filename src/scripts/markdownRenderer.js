/**
 * Lightweight Markdown Renderer for Activity Tracker
 * Handles basic markdown rendering for reports preview
 */

class MarkdownRenderer {
    constructor() {
        this.rules = [
            // Headers (H4-H6 support added)
            { pattern: /^###### (.*$)/gim, replacement: '<h6>$1</h6>' },
            { pattern: /^##### (.*$)/gim, replacement: '<h5>$1</h5>' },
            { pattern: /^#### (.*$)/gim, replacement: '<h4>$1</h4>' },
            { pattern: /^### (.*$)/gim, replacement: '<h3>$1</h3>' },
            { pattern: /^## (.*$)/gim, replacement: '<h2>$1</h2>' },
            { pattern: /^# (.*$)/gim, replacement: '<h1>$1</h1>' },
            
            // Code blocks (fenced with ```)
            { pattern: /```([^`]*)```/gims, replacement: '<pre><code>$1</code></pre>' },
            
            // Bold and Italic combinations (must come before individual patterns)
            { pattern: /\*\*\*(.*?)\*\*\*/gim, replacement: '<strong><em>$1</em></strong>' },
            { pattern: /___([^_]+?)___/gim, replacement: '<strong><em>$1</em></strong>' },
            
            // Bold (both ** and __ syntax)
            { pattern: /\*\*(.*?)\*\*/gim, replacement: '<strong>$1</strong>' },
            { pattern: /__([^_]+?)__/gim, replacement: '<strong>$1</strong>' },
            
            // Italic (both * and _ syntax, non-greedy)
            { pattern: /\*([^*]+?)\*/gim, replacement: '<em>$1</em>' },
            { pattern: /_([^_]+?)_/gim, replacement: '<em>$1</em>' },
            
            // Strikethrough
            { pattern: /~~(.*?)~~/gim, replacement: '<del>$1</del>' },
            
            // Code (inline) - improved to handle backticks better
            { pattern: /`([^`]+?)`/gim, replacement: '<code>$1</code>' },
            
            // Links with tooltips and without
            { pattern: /\[([^\]]*)\]\(([^\s\)]+)\s+"([^"]*)"\)/gim, replacement: '<a href="$2" title="$3">$1</a>' },
            { pattern: /\[([^\]]*)\]\(([^\)]*)\)/gim, replacement: '<a href="$2">$1</a>' },
            
            // Images (basic support)
            { pattern: /!\[([^\]]*)\]\(([^\)]*)\)/gim, replacement: '<img src="$2" alt="$1">' },
            
            // Horizontal rules (multiple formats)
            { pattern: /^(-{3,}|\*{3,}|_{3,})\s*$/gim, replacement: '<hr>' },
            
            // Blockquotes (improved to handle multiple lines)
            { pattern: /^> (.*)$/gim, replacement: '<blockquote>$1</blockquote>' },
            
            // This will be handled by renderLists method instead
        ];
    }

    /**
     * Render markdown to HTML
     * @param {string} markdown - Markdown text
     * @param {boolean} inline - Whether this is inline rendering (for descriptions)  
     * @returns {string} HTML string
     */
    render(markdown, inline = false) {
        if (!markdown || typeof markdown !== 'string') {
            return '';
        }

        let html = markdown.trim();

        // Handle lists FIRST, before other processing
        html = this.renderLists(html);

        // Apply markdown rules (excluding list processing)
        this.rules.forEach(rule => {
            html = html.replace(rule.pattern, rule.replacement);
        });

        // Handle line breaks and paragraphs (but not inside lists)
        if (inline) {
            // For inline content (descriptions), be more conservative
            // Double newlines become paragraph breaks
            html = html.replace(/\n\s*\n/gim, '</p><p>');
            // Single newlines become line breaks only if not in lists
            html = html.replace(/\n(?![<\/]|<ul>|<ol>|<li>)/gim, '<br>');
        } else {
            // For full content, handle paragraphs more aggressively
            html = html.replace(/\n\s*\n/gim, '</p><p>');
            // Don't add line breaks inside list structures
            html = html.replace(/\n(?![<\/]|<ul>|<ol>|<li>)/gim, '<br>');
        }

        // Wrap in paragraphs if not inline or if it doesn't start with a block element
        if (!inline || !html.match(/^<(h[1-6]|ul|ol|blockquote|hr)/)) {
            html = '<p>' + html + '</p>';
        }

        // Clean up empty paragraphs
        html = html.replace(/<p>\s*<\/p>/gim, '');
        html = html.replace(/<p><h/gim, '<h');
        html = html.replace(/<\/h([1-6])><\/p>/gim, '</h$1>');
        html = html.replace(/<p><hr><\/p>/gim, '<hr>');
        html = html.replace(/<p><blockquote>/gim, '<blockquote>');
        html = html.replace(/<\/blockquote><\/p>/gim, '</blockquote>');
        html = html.replace(/<p><ul>/gim, '<ul>');
        html = html.replace(/<\/ul><\/p>/gim, '</ul>');
        html = html.replace(/<p><ol>/gim, '<ol>');
        html = html.replace(/<\/ol><\/p>/gim, '</ol>');
        
        // Clean up extra line breaks around lists
        html = html.replace(/<br>\s*<\/li>/gim, '</li>');
        html = html.replace(/<li><br>/gim, '<li>');
        html = html.replace(/<\/ul><br>/gim, '</ul>');
        html = html.replace(/<br><ul>/gim, '<ul>');
        html = html.replace(/<\/ol><br>/gim, '</ol>');
        html = html.replace(/<br><ol>/gim, '<ol>');

        return html;
    }

    /**
     * Process list items into proper nested ul/ol tags
     * @param {string} html - HTML text
     * @returns {string} HTML with proper nested list structure
     */
    renderLists(html) {
        // First, find and process all list lines
        const lines = html.split('\n');
        const processedLines = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // Match both unordered (-) and ordered (1.) lists
            const unorderedMatch = line.match(/^(\s*)-\s+(.*)$/);
            const orderedMatch = line.match(/^(\s*)\d+\.\s+(.*)$/);
            
            if (unorderedMatch) {
                const indentation = unorderedMatch[1].length;
                const content = unorderedMatch[2];
                const level = Math.floor(indentation / 2); // Every 2 spaces = 1 level
                
                processedLines.push({
                    type: 'list-item',
                    listType: 'ul',
                    level: level,
                    content: content,
                    original: line
                });
            } else if (orderedMatch) {
                const indentation = orderedMatch[1].length;
                const content = orderedMatch[2];
                const level = Math.floor(indentation / 2);
                
                processedLines.push({
                    type: 'list-item',
                    listType: 'ol',
                    level: level,
                    content: content,
                    original: line
                });
            } else {
                // Non-list line
                processedLines.push({
                    type: 'text',
                    content: line,
                    original: line
                });
            }
        }
        
        // Now build the nested HTML structure
        let result = [];
        let listStack = []; // Stack to track open list tags with their types
        
        for (let i = 0; i < processedLines.length; i++) {
            const item = processedLines[i];
            
            if (item.type === 'list-item') {
                const currentLevel = item.level;
                const currentListType = item.listType;
                
                // Close deeper lists if we're going to a shallower level
                while (listStack.length > currentLevel + 1) {
                    const closingList = listStack.pop();
                    result.push(`</${closingList.type}>`);
                }
                
                // If we're at the same level but different list type, close and reopen
                if (listStack.length === currentLevel + 1 && 
                    listStack[listStack.length - 1].type !== currentListType) {
                    const closingList = listStack.pop();
                    result.push(`</${closingList.type}>`);
                }
                
                // Open new lists if we're going deeper or need to switch types
                while (listStack.length <= currentLevel) {
                    result.push(`<${currentListType}>`);
                    listStack.push({type: currentListType, level: currentLevel});
                }
                
                // Add the list item
                result.push(`<li>${item.content}</li>`);
                
            } else {
                // Close all open lists when we hit non-list content
                while (listStack.length > 0) {
                    const closingList = listStack.pop();
                    result.push(`</${closingList.type}>`);
                }
                
                // Add the non-list content
                if (item.content.trim()) {
                    result.push(item.content);
                }
            }
        }
        
        // Close any remaining open lists
        while (listStack.length > 0) {
            const closingList = listStack.pop();
            result.push(`</${closingList.type}>`);
        }
        
        return result.join('\n');
    }

    /**
     * Render inline markdown (for descriptions)
     * @param {string} markdown - Markdown text
     * @returns {string} HTML string
     */
    renderInline(markdown) {
        return this.render(markdown, true);
    }

    /**
     * Render markdown with custom CSS classes
     * @param {string} markdown - Markdown text
     * @param {boolean} inline - Whether this is inline rendering
     * @returns {string} HTML with CSS classes
     */
    renderWithClasses(markdown, inline = false) {
        let html = this.render(markdown, inline);
        
        // Add CSS classes for styling
        html = html.replace(/<h1>/gim, '<h1 class="md-h1">');
        html = html.replace(/<h2>/gim, '<h2 class="md-h2">');
        html = html.replace(/<h3>/gim, '<h3 class="md-h3">');
        html = html.replace(/<h4>/gim, '<h4 class="md-h4">');
        html = html.replace(/<h5>/gim, '<h5 class="md-h5">');
        html = html.replace(/<h6>/gim, '<h6 class="md-h6">');
        html = html.replace(/<blockquote>/gim, '<blockquote class="md-blockquote">');
        html = html.replace(/<code>/gim, '<code class="md-code">');
        html = html.replace(/<pre>/gim, '<pre class="md-codeblock">');
        html = html.replace(/<ul>/gim, '<ul class="md-list">');
        html = html.replace(/<ol>/gim, '<ol class="md-list-ordered">');
        html = html.replace(/<p>/gim, '<p class="md-paragraph">');
        html = html.replace(/<hr>/gim, '<hr class="md-hr">');
        html = html.replace(/<strong>/gim, '<strong class="md-bold">');
        html = html.replace(/<em>/gim, '<em class="md-italic">');
        html = html.replace(/<del>/gim, '<del class="md-strikethrough">');
        html = html.replace(/<a /gim, '<a class="md-link" ');
        html = html.replace(/<img /gim, '<img class="md-image" ');

        return html;
    }

    /**
     * Render inline markdown with CSS classes (for descriptions)
     * @param {string} markdown - Markdown text
     * @returns {string} HTML string with classes
     */
    renderInlineWithClasses(markdown) {
        return this.renderWithClasses(markdown, true);
    }

    /**
     * Create a preview of markdown content (first few lines)
     * @param {string} markdown - Markdown text
     * @param {number} maxLines - Maximum lines to preview
     * @returns {string} HTML preview
     */
    preview(markdown, maxLines = 10) {
        if (!markdown) return '';
        
        const lines = markdown.split('\n').slice(0, maxLines);
        const previewMarkdown = lines.join('\n');
        
        if (lines.length >= maxLines && markdown.split('\n').length > maxLines) {
            return this.renderWithClasses(previewMarkdown) + '<p class="md-preview-more">...</p>';
        }
        
        return this.renderWithClasses(previewMarkdown);
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.MarkdownRenderer = MarkdownRenderer;
}

console.log('Markdown Renderer module loaded');
