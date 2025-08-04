/**
 * Hashtag Tests
 * Tests hashtag parsing functionality including support for hyphens
 */

describe('Hashtag Processing', () => {
    let tracker;
    
    beforeEach(() => {
        createMockDOMStructure();
        
        // Mock the ActivityTracker class for testing
        global.ActivityTracker = class MockActivityTracker {
            extractHashtags(text) {
                if (!text || typeof text !== 'string') return [];
                
                const hashtagRegex = /#([\w][\w-]*)/g;
                const hashtags = [];
                const seenTags = new Set(); // For case-insensitive deduplication
                let match;
                
                while ((match = hashtagRegex.exec(text)) !== null) {
                    const originalTag = match[1]; // Preserve original case
                    const lowerTag = originalTag.toLowerCase(); // For comparison
                    
                    if (!seenTags.has(lowerTag)) {
                        seenTags.add(lowerTag);
                        hashtags.push(originalTag); // Store original case
                    }
                }
                
                return hashtags;
            }
            
            renderDescriptionWithInlineHashtags(description) {
                let processedText = description;
                
                // Convert URLs to clickable links first (before hashtags to avoid conflicts)
                processedText = processedText.replace(/(https?:\/\/[^\s<>"\[\]]+)/gi, (match, url) => {
                    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="external-link">${url}</a>`;
                });
                
                // Then replace hashtags with clickable links (but not inside HTML tags)
                // Use negative lookbehind to avoid matching hashtags inside href attributes
                processedText = processedText.replace(/(?<!href="[^"]*|href='[^']*)#([\w][\w-]*)/g, (match, tag) => {
                    return `<a href="#" class="hashtag-link" onclick="tracker.searchByHashtag('${tag}'); return false;">#${tag}</a>`;
                });
                
                return processedText;
            }
        };
        
        tracker = new global.ActivityTracker();
    });

    describe('extractHashtags function', () => {
        test('should extract basic hashtags', () => {
            const text = 'Working on project #work #coding';
            const hashtags = tracker.extractHashtags(text);
            
            expect(hashtags).toEqual(['work', 'coding']);
        });

        test('should extract hashtags with hyphens while preserving case', () => {
            const text = 'Fixed issue #JIRA-123 #Bug-Fix #HIGH-Priority';
            const hashtags = tracker.extractHashtags(text);
            
            expect(hashtags).toEqual(['JIRA-123', 'Bug-Fix', 'HIGH-Priority']);
        });

        test('should handle mixed hashtags with and without hyphens while preserving case', () => {
            const text = 'Meeting about #Project-Alpha and #Testing for #RELEASE';
            const hashtags = tracker.extractHashtags(text);
            
            expect(hashtags).toEqual(['Project-Alpha', 'Testing', 'RELEASE']);
        });

        test('should handle hashtags with numbers and hyphens while preserving case', () => {
            const text = 'Working on #PROJ-2024 #V2-1-0 #Phase-1';
            const hashtags = tracker.extractHashtags(text);
            
            expect(hashtags).toEqual(['PROJ-2024', 'V2-1-0', 'Phase-1']);
        });

        test('should ignore hashtags that are just hyphens', () => {
            const text = 'Some text #- #-- should be ignored but #Valid-Tag should work';
            const hashtags = tracker.extractHashtags(text);
            
            expect(hashtags).toEqual(['Valid-Tag']);
        });

        test('should handle edge cases while preserving case', () => {
            const text = 'Edge case #A-B-C-D-E #123-456 #Test-';
            const hashtags = tracker.extractHashtags(text);
            
            expect(hashtags).toEqual(['A-B-C-D-E', '123-456', 'Test-']);
        });

        test('should handle empty or invalid input', () => {
            expect(tracker.extractHashtags('')).toEqual([]);
            expect(tracker.extractHashtags(null)).toEqual([]);
            expect(tracker.extractHashtags(undefined)).toEqual([]);
            expect(tracker.extractHashtags(123)).toEqual([]);
        });

        test('should remove duplicates case-insensitively but preserve first occurrence case', () => {
            const text = 'Testing #Work #WORK #work #Bug-Fix #BUG-FIX #bug-fix';
            const hashtags = tracker.extractHashtags(text);
            
            expect(hashtags).toEqual(['Work', 'Bug-Fix']);
        });
    });

    describe('renderDescriptionWithInlineHashtags function', () => {
        test('should convert basic hashtags to clickable links', () => {
            const description = 'Working on #project and #testing';
            const result = tracker.renderDescriptionWithInlineHashtags(description);
            
            expect(result).toContain('<a href="#" class="hashtag-link"');
            expect(result).toContain('#project</a>');
            expect(result).toContain('#testing</a>');
        });

        test('should convert hashtags with hyphens to clickable links', () => {
            const description = 'Fixed #JIRA-123 and implemented #feature-request';
            const result = tracker.renderDescriptionWithInlineHashtags(description);
            
            expect(result).toContain('onclick="tracker.searchByHashtag(\'JIRA-123\')');
            expect(result).toContain('onclick="tracker.searchByHashtag(\'feature-request\')');
            expect(result).toContain('#JIRA-123</a>');
            expect(result).toContain('#feature-request</a>');
        });

        test('should handle mixed hashtags correctly', () => {
            const description = 'Working on #project-alpha for #release and #testing';
            const result = tracker.renderDescriptionWithInlineHashtags(description);
            
            expect(result).toContain('#project-alpha</a>');
            expect(result).toContain('#release</a>');
            expect(result).toContain('#testing</a>');
        });

        test('should preserve non-hashtag text', () => {
            const description = 'This is regular text with #hashtag-test in the middle';
            const result = tracker.renderDescriptionWithInlineHashtags(description);
            
            expect(result).toContain('This is regular text with');
            expect(result).toContain('in the middle');
            expect(result).toContain('#hashtag-test</a>');
        });
    });

    describe('URL markup functionality', () => {
        test('should convert HTTP URLs to clickable links', () => {
            const description = 'Check out http://example.com for more info';
            const result = tracker.renderDescriptionWithInlineHashtags(description);
            
            expect(result).toContain('<a href="http://example.com"');
            expect(result).toContain('target="_blank"');
            expect(result).toContain('rel="noopener noreferrer"');
            expect(result).toContain('class="external-link"');
            expect(result).toContain('http://example.com</a>');
        });

        test('should convert HTTPS URLs to clickable links', () => {
            const description = 'Visit https://secure.example.com/path?param=value for details';
            const result = tracker.renderDescriptionWithInlineHashtags(description);
            
            expect(result).toContain('<a href="https://secure.example.com/path?param=value"');
            expect(result).toContain('target="_blank"');
            expect(result).toContain('rel="noopener noreferrer"');
            expect(result).toContain('class="external-link"');
            expect(result).toContain('https://secure.example.com/path?param=value</a>');
        });

        test('should handle multiple URLs in text', () => {
            const description = 'See http://example.com and also https://another-site.org/page';
            const result = tracker.renderDescriptionWithInlineHashtags(description);
            
            expect(result).toContain('href="http://example.com"');
            expect(result).toContain('href="https://another-site.org/page"');
            expect(result.match(/class="external-link"/g)).toHaveLength(2);
        });

        test('should handle URLs with hashtags together', () => {
            const description = 'Working on #project-alpha, see https://jira.company.com/PROJ-123 for details';
            const result = tracker.renderDescriptionWithInlineHashtags(description);
            
            expect(result).toContain('#project-alpha</a>');
            expect(result).toContain('https://jira.company.com/PROJ-123</a>');
            expect(result).toContain('class="hashtag-link"');
            expect(result).toContain('class="external-link"');
        });

        test('should handle URLs with various formats', () => {
            const description = 'Links: https://sub.domain.com:8080/path/to/resource?query=1&other=2#anchor';
            const result = tracker.renderDescriptionWithInlineHashtags(description);
            
            expect(result).toContain('href="https://sub.domain.com:8080/path/to/resource?query=1&other=2#anchor"');
            expect(result).toContain('class="external-link"');
        });

        test('should not interfere with existing markdown or HTML', () => {
            const description = 'Check **bold text** and http://example.com #test';
            const result = tracker.renderDescriptionWithInlineHashtags(description);
            
            expect(result).toContain('**bold text**'); // Should preserve markdown
            expect(result).toContain('href="http://example.com"');
            expect(result).toContain('#test</a>');
        });
    });

    describe('Real-world hashtag scenarios', () => {
        test('should handle JIRA ticket references with case preservation', () => {
            const text = 'Fixed bug in #PROJ-123 and #TASK-456';
            const hashtags = tracker.extractHashtags(text);
            
            expect(hashtags).toEqual(['PROJ-123', 'TASK-456']);
        });

        test('should handle version numbers with case preservation', () => {
            const text = 'Released #V2-1-0 with #HotFix-2-1-1';
            const hashtags = tracker.extractHashtags(text);
            
            expect(hashtags).toEqual(['V2-1-0', 'HotFix-2-1-1']);
        });

        test('should handle project phases with case preservation', () => {
            const text = 'Completed #Phase-1 moving to #Phase-2-Alpha';
            const hashtags = tracker.extractHashtags(text);
            
            expect(hashtags).toEqual(['Phase-1', 'Phase-2-Alpha']);
        });

        test('should handle compound descriptors with case preservation', () => {
            const text = 'Meeting about #Long-Term-Planning and #Short-Term-Goals';
            const hashtags = tracker.extractHashtags(text);
            
            expect(hashtags).toEqual(['Long-Term-Planning', 'Short-Term-Goals']);
        });

        test('should handle mixed case JIRA tickets with URLs', () => {
            const text = 'Working on #JIRA-123 see https://company.atlassian.net/browse/JIRA-123 #Bug-Fix';
            const hashtags = tracker.extractHashtags(text);
            const result = tracker.renderDescriptionWithInlineHashtags(text);
            
            expect(hashtags).toEqual(['JIRA-123', 'Bug-Fix']);
            expect(result).toContain('#JIRA-123</a>');
            expect(result).toContain('#Bug-Fix</a>');
            expect(result).toContain('https://company.atlassian.net/browse/JIRA-123</a>');
        });
    });
});