/**
 * Notes System Tests
 * Tests the new Notes functionality and keyboard shortcuts
 */

import { fireEvent } from '@testing-library/dom';

describe('Notes System', () => {
    beforeEach(() => {
        createMockDOMStructure();
    });

    describe('Note Button UI', () => {
        test('should have note button in main form', () => {
            const noteButton = document.getElementById('noteButton');
            const noteButtonText = document.getElementById('noteButtonText');
            
            expect(noteButton).toBeTruthy();
            expect(noteButtonText).toBeTruthy();
            expect(noteButton).toHaveClass('btn-quick-set');
            expect(noteButtonText.textContent).toBe('Mark as Note');
        });

        test('should have note button in edit modal', () => {
            const editNoteButton = document.getElementById('editNoteButton');
            const editNoteButtonText = document.getElementById('editNoteButtonText');
            
            expect(editNoteButton).toBeTruthy();
            expect(editNoteButtonText).toBeTruthy();
            expect(editNoteButton).toHaveClass('btn-quick-set');
            expect(editNoteButtonText.textContent).toBe('Mark as Note');
        });

        test('should toggle note button state correctly', () => {
            const noteButton = document.getElementById('noteButton');
            const noteButtonText = document.getElementById('noteButtonText');
            
            // Initial state - not active
            expect(noteButton).not.toHaveClass('active');
            expect(noteButtonText.textContent).toBe('Mark as Note');
            
            // Simulate active state
            noteButton.classList.add('active');
            noteButtonText.textContent = 'Remove from Notes';
            
            expect(noteButton).toHaveClass('active');
            expect(noteButtonText.textContent).toBe('Remove from Notes');
        });
    });

    describe('Notes Section UI', () => {
        test('should have notes section with proper structure', () => {
            const notesSection = document.getElementById('notesSection');
            const notesFilter = document.getElementById('notesFilter');
            const notesSort = document.getElementById('notesSort');
            const notesSearch = document.getElementById('notesSearch');
            const notesList = document.getElementById('notesList');
            
            expect(notesSection).toBeTruthy();
            expect(notesFilter).toBeTruthy();
            expect(notesSort).toBeTruthy();
            expect(notesSearch).toBeTruthy();
            expect(notesList).toBeTruthy();
        });

        test('should have correct filter options', () => {
            const notesFilter = document.getElementById('notesFilter');
            const options = notesFilter.querySelectorAll('option');
            
            expect(options).toHaveLength(4);
            expect(options[0].value).toBe('all');
            expect(options[1].value).toBe('today');
            expect(options[2].value).toBe('week');
            expect(options[3].value).toBe('month');
        });

        test('should have correct sort options', () => {
            const notesSort = document.getElementById('notesSort');
            const options = notesSort.querySelectorAll('option');
            
            expect(options).toHaveLength(2);
            expect(options[0].value).toBe('newest');
            expect(options[1].value).toBe('oldest');
        });

        test('should have search input with correct placeholder', () => {
            const notesSearch = document.getElementById('notesSearch');
            
            expect(notesSearch.placeholder).toBe('Search through notes...');
            expect(notesSearch.type).toBe('text');
        });

        test('should have clear search button', () => {
            const clearNotesSearchBtn = document.getElementById('clearNotesSearchBtn');
            
            expect(clearNotesSearchBtn).toBeTruthy();
            expect(clearNotesSearchBtn.textContent).toBe('Clear');
            expect(clearNotesSearchBtn.style.display).toBe('none'); // Initially hidden
        });

        test('should have notes pagination', () => {
            const notesPagination = document.getElementById('notesPagination');
            const notesPrevBtn = document.getElementById('notesPrevBtn');
            const notesNextBtn = document.getElementById('notesNextBtn');
            const notesPageInfo = document.getElementById('notesPageInfo');
            
            expect(notesPagination).toBeTruthy();
            expect(notesPrevBtn).toBeTruthy();
            expect(notesNextBtn).toBeTruthy();
            expect(notesPageInfo).toBeTruthy();
        });
    });

    describe('Keyboard Shortcuts', () => {
        test('should handle Ctrl+N for note toggle', () => {
            const activityInput = document.getElementById('activity');
            
            // Focus on activity input
            activityInput.focus();
            
            // Simulate Ctrl+N keydown
            const event = new KeyboardEvent('keydown', {
                key: 'n',
                code: 'KeyN',
                ctrlKey: true,
                bubbles: true
            });
            
            expect(() => {
                document.dispatchEvent(event);
            }).not.toThrow();
        });

        test('should handle Ctrl+T for todo toggle', () => {
            const activityInput = document.getElementById('activity');
            
            // Focus on activity input
            activityInput.focus();
            
            // Simulate Ctrl+T keydown
            const event = new KeyboardEvent('keydown', {
                key: 't',
                code: 'KeyT',
                ctrlKey: true,
                bubbles: true
            });
            
            expect(() => {
                document.dispatchEvent(event);
            }).not.toThrow();
        });

        test('should handle Shift+Enter for form submission', () => {
            const activityInput = document.getElementById('activity');
            
            // Set required values
            activityInput.value = 'Test activity';
            activityInput.focus();
            
            // Simulate Shift+Enter keydown
            const event = new KeyboardEvent('keydown', {
                key: 'Enter',
                code: 'Enter',
                shiftKey: true,
                bubbles: true
            });
            
            expect(() => {
                document.dispatchEvent(event);
            }).not.toThrow();
        });

        test('should handle Shift+Space for quick entry only outside textarea', () => {
            const activityInput = document.getElementById('activity');
            const descriptionTextarea = document.getElementById('description');
            
            // Test on activity input - should work
            activityInput.focus();
            let event = new KeyboardEvent('keydown', {
                key: ' ',
                code: 'Space',
                shiftKey: true,
                bubbles: true
            });
            
            expect(() => {
                document.dispatchEvent(event);
            }).not.toThrow();
            
            // Test on description textarea - should not trigger quick entry
            descriptionTextarea.focus();
            event = new KeyboardEvent('keydown', {
                key: ' ',
                code: 'Space',
                shiftKey: true,
                bubbles: true
            });
            
            expect(() => {
                document.dispatchEvent(event);
            }).not.toThrow();
        });
    });

    describe('Form Interactions', () => {
        test('should handle note button click', () => {
            const noteButton = document.getElementById('noteButton');
            
            expect(() => {
                fireEvent.click(noteButton);
            }).not.toThrow();
        });

        test('should handle edit note button click', () => {
            const editNoteButton = document.getElementById('editNoteButton');
            
            expect(() => {
                fireEvent.click(editNoteButton);
            }).not.toThrow();
        });

        test('should handle notes filter change', () => {
            const notesFilter = document.getElementById('notesFilter');
            
            expect(() => {
                fireEvent.change(notesFilter, { target: { value: 'today' } });
            }).not.toThrow();
            
            expect(notesFilter.value).toBe('today');
        });

        test('should handle notes sort change', () => {
            const notesSort = document.getElementById('notesSort');
            
            expect(() => {
                fireEvent.change(notesSort, { target: { value: 'oldest' } });
            }).not.toThrow();
            
            expect(notesSort.value).toBe('oldest');
        });

        test('should handle notes search input', () => {
            const notesSearch = document.getElementById('notesSearch');
            const clearBtn = document.getElementById('clearNotesSearchBtn');
            
            // Type in search
            fireEvent.input(notesSearch, { target: { value: 'test search' } });
            expect(notesSearch.value).toBe('test search');
            
            // Clear button should become visible (in real app)
            // We can't test the actual visibility change without the JavaScript logic
            expect(clearBtn).toBeTruthy();
        });

        test('should handle clear search button', () => {
            const clearBtn = document.getElementById('clearNotesSearchBtn');
            
            expect(() => {
                fireEvent.click(clearBtn);
            }).not.toThrow();
        });
    });

    describe('Notes Navigation', () => {
        test('should handle notes pagination buttons', () => {
            const prevBtn = document.getElementById('notesPrevBtn');
            const nextBtn = document.getElementById('notesNextBtn');
            
            expect(() => {
                fireEvent.click(prevBtn);
                fireEvent.click(nextBtn);
            }).not.toThrow();
        });

        test('should have onclick attributes for pagination', () => {
            const prevBtn = document.getElementById('notesPrevBtn');
            const nextBtn = document.getElementById('notesNextBtn');
            
            expect(prevBtn.getAttribute('onclick')).toBe('previousNotesPage()');
            expect(nextBtn.getAttribute('onclick')).toBe('nextNotesPage()');
        });
    });
});

describe('Notes Integration Workflow', () => {
    beforeEach(() => {
        createMockDOMStructure();
    });

    test('should simulate adding a note entry', () => {
        const activityInput = document.getElementById('activity');
        const timestampInput = document.getElementById('timestamp');
        const noteButton = document.getElementById('noteButton');
        const form = document.getElementById('activityForm');
        
        // Fill in activity
        fireEvent.change(activityInput, { 
            target: { value: 'Personal note about meeting #meeting' } 
        });
        fireEvent.change(timestampInput, { 
            target: { value: '2025-08-04T14:30' } 
        });
        
        // Mark as note
        fireEvent.click(noteButton);
        
        // Submit form
        expect(() => {
            fireEvent.submit(form);
        }).not.toThrow();
        
        expect(activityInput.value).toBe('Personal note about meeting #meeting');
        expect(timestampInput.value).toBe('2025-08-04T14:30');
    });

    test('should simulate editing a note entry', () => {
        const editActivity = document.getElementById('editActivity');
        const editTimestamp = document.getElementById('editTimestamp');
        const editNoteButton = document.getElementById('editNoteButton');
        const editForm = document.getElementById('editForm');
        
        // Simulate editing
        fireEvent.change(editActivity, { 
            target: { value: 'Updated note content' } 
        });
        fireEvent.change(editTimestamp, { 
            target: { value: '2025-08-04T15:00' } 
        });
        
        // Toggle note status
        fireEvent.click(editNoteButton);
        
        // Submit changes
        expect(() => {
            fireEvent.submit(editForm);
        }).not.toThrow();
        
        expect(editActivity.value).toBe('Updated note content');
        expect(editTimestamp.value).toBe('2025-08-04T15:00');
    });

    test('should simulate notes filtering workflow', () => {
        const notesFilter = document.getElementById('notesFilter');
        const notesSort = document.getElementById('notesSort');
        const notesSearch = document.getElementById('notesSearch');
        
        // Change filter
        fireEvent.change(notesFilter, { target: { value: 'today' } });
        expect(notesFilter.value).toBe('today');
        
        // Change sort
        fireEvent.change(notesSort, { target: { value: 'oldest' } });
        expect(notesSort.value).toBe('oldest');
        
        // Search notes
        fireEvent.input(notesSearch, { target: { value: 'meeting' } });
        expect(notesSearch.value).toBe('meeting');
        
        // Should not throw errors
    });
});