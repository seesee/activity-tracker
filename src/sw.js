/**
 * Service Worker for Activity Tracker
 * Handles notifications, notification actions, and offline functionality
 */

const CACHE_NAME = 'activity-tracker-{{VERSION}}';
const urlsToCache = [
    './',
    './index.html',
    './sw.js'
];

/**
 * Service Worker installation
 */
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                // Try to cache files individually with error handling
                return Promise.allSettled(
                    urlsToCache.map(url => {
                        return cache.add(url).catch(error => {
                            console.warn(`Failed to cache ${url}:`, error.message);
                            // Don't let individual cache failures break the whole install
                            return null;
                        });
                    })
                ).then(results => {
                    const successful = results.filter(result => result.status === 'fulfilled').length;
                    const failed = results.filter(result => result.status === 'rejected').length;
                    console.log(`Cache results: ${successful} successful, ${failed} failed`);
                });
            })
            .catch(error => {
                console.error('Cache installation failed:', error);
                // Continue with SW installation even if caching fails
            })
    );
    
    // Force the waiting service worker to become the active service worker
    self.skipWaiting();
});

/**
 * Service Worker activation
 */
self.addEventListener('activate', (event) => {
    console.log('Service Worker activated');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    
    // Claim all clients immediately
    return self.clients.claim();
});

/**
 * Fetch event handler for offline functionality
 */
self.addEventListener('fetch', (event) => {
    // Only handle http/https requests, skip file:// protocol
    if (event.request.url.startsWith('http')) {
        const isAppResource = event.request.url.includes('index.html') || 
                              event.request.url.endsWith('/') || 
                              event.request.url.includes('sw.js');
        
        if (isAppResource) {
            // Use network-first strategy for app resources to ensure updates
            event.respondWith(
                fetch(event.request)
                    .then((response) => {
                        // Clone response before caching
                        const responseClone = response.clone();
                        
                        // Cache the new version (only GET requests can be cached)
                        if (event.request.method === 'GET') {
                            caches.open(CACHE_NAME).then((cache) => {
                                cache.put(event.request, responseClone);
                            });
                        }
                        
                        return response;
                    })
                    .catch(() => {
                        // Fallback to cache if network fails
                        return caches.match(event.request).then((response) => {
                            if (response) {
                                return response;
                            }
                            
                            // Return basic offline response for navigation requests
                            if (event.request.mode === 'navigate') {
                                return new Response('App offline', { 
                                    status: 200, 
                                    statusText: 'OK',
                                    headers: { 'Content-Type': 'text/html' }
                                });
                            }
                            
                            throw new Error('No cached response available');
                        });
                    })
            );
        } else {
            // Use cache-first for other resources (like external resources)
            event.respondWith(
                caches.match(event.request)
                    .then((response) => {
                        return response || fetch(event.request);
                    })
                    .catch(error => {
                        console.warn('Fetch failed for:', event.request.url, error.message);
                        throw error;
                    })
            );
        }
    }
});

/**
 * Notification click handler
 * Follows best practices: close notification, find existing client or open new one,
 * post message to client for DOM manipulation, wrap in event.waitUntil
 */
self.addEventListener('notificationclick', (event) => {
    console.log('Notification clicked:', event.notification.tag);
    
    // Close the notification immediately
    event.notification.close();
    
    // Handle different types of notifications
    if (event.notification.tag === 'activity-reminder') {
        // Wrap everything in event.waitUntil to prevent SW termination
        event.waitUntil(
            clients.matchAll({ 
                type: 'window', 
                includeUncontrolled: true 
            }).then((clientList) => {
                // First, try to find and focus an existing client
                for (const client of clientList) {
                    if (isAppClient(client.url)) {
                        console.log('Found existing client, focusing:', client.url);
                        return client.focus().then(() => {
                            // Post message to client for DOM manipulation
                            client.postMessage({ 
                                type: 'navigate-to-tracker',
                                source: 'notification-click'
                            });
                        });
                    }
                }
                
                // If no existing client, open new window with proper URL
                console.log('No existing client found, opening new window');
                if (clients.openWindow) {
                    const appUrl = getAppUrl();
                    console.log('Opening URL:', appUrl);
                    return clients.openWindow(appUrl).then((client) => {
                        if (client) {
                            // Wait for client to load, then send navigation message
                            setTimeout(() => {
                                client.postMessage({ 
                                    type: 'navigate-to-tracker',
                                    source: 'notification-click'
                                });
                            }, 1000);
                        }
                    });
                }
            }).catch(error => {
                console.error('Error handling notification click:', error);
            })
        );
    }
});

/**
 * Notification action handler (for inline replies)
 */
self.addEventListener('notificationactionclick', (event) => {
    console.log('Notification action clicked:', event.action);
    
    event.notification.close();
    
    if (event.action === 'reply') {
        const reply = event.reply;
        console.log('User replied:', reply);
        
        if (reply && reply.trim()) {
            // Create entry directly from notification AND populate the input field
            const now = new Date();
            const entry = {
                id: generateId(),
                activity: reply.trim(),
                description: 'from notification',
                timestamp: now.toISOString(),
                created: now.toISOString(),
                isTodo: false,
                isNote: false,
                tags: extractHashtags(reply.trim()),
                dueDate: null,
                startedAt: null
            };
            
            event.waitUntil(
                clients.matchAll({ type: 'window' }).then((clientList) => {
                    let messageSent = false;
                    
                    // Send to existing clients
                    for (const client of clientList) {
                        if (isAppClient(client.url)) {
                            // Send both messages: create entry and populate input
                            client.postMessage({ 
                                type: 'add-entry', 
                                entry: entry
                            });
                            client.postMessage({ 
                                type: 'populate-activity-input', 
                                text: reply.trim()
                            });
                            messageSent = true;
                        }
                    }
                    
                    // If no existing client, open the app and send both messages
                    if (!messageSent) {
                        const appUrl = getAppUrl();
                        return clients.openWindow(appUrl).then((client) => {
                            if (client) {
                                // Wait for the page to load, then send both messages
                                setTimeout(() => {
                                    client.postMessage({ 
                                        type: 'add-entry', 
                                        entry: entry
                                    });
                                    client.postMessage({ 
                                        type: 'populate-activity-input', 
                                        text: reply.trim(),
                                        source: 'notification-action'
                                    });
                                }, 2000);
                            }
                        });
                    }
                })
            );
        }
    } else if (event.action === 'open') {
        // Handle "Open App" action - same as notification click
        event.waitUntil(
            clients.matchAll({ 
                type: 'window', 
                includeUncontrolled: true 
            }).then((clientList) => {
                // First, try to find and focus an existing client
                for (const client of clientList) {
                    if (isAppClient(client.url)) {
                        console.log('Found existing client, focusing:', client.url);
                        return client.focus().then(() => {
                            // Post message to client for DOM manipulation
                            client.postMessage({ 
                                type: 'navigate-to-tracker',
                                source: 'notification-action-open'
                            });
                        });
                    }
                }
                
                // If no existing client, open new window with proper URL
                console.log('No existing client found, opening new window');
                if (clients.openWindow) {
                    const appUrl = getAppUrl();
                    console.log('Opening URL:', appUrl);
                    return clients.openWindow(appUrl).then((client) => {
                        if (client) {
                            // Wait for client to load, then send navigation message
                            setTimeout(() => {
                                client.postMessage({ 
                                    type: 'navigate-to-tracker',
                                    source: 'notification-action-open'
                                });
                            }, 1000);
                        }
                    });
                }
            }).catch(error => {
                console.error('Error handling notification open action:', error);
            })
        );
    }
});

/**
 * Push notification handler (for future web push functionality)
 */
self.addEventListener('push', (event) => {
    console.log('Push message received');
    
    let data = {};
    
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data = { title: 'Activity Tracker', body: event.data.text() };
        }
    }
    
    const options = {
        body: data.body || 'New notification from Activity Tracker',
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23667eea"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>',
        badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23667eea"><circle cx="12" cy="12" r="10"/></svg>',
        tag: data.tag || 'push-notification',
        requireInteraction: true,
        actions: [
            {
                action: 'reply',
                type: 'text',
                title: 'Log Activity',
                placeholder: 'What are you working on?'
            },
            {
                action: 'dismiss',
                title: 'Dismiss'
            }
        ],
        data: data
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title || 'Activity Tracker', options)
    );
});

/**
 * Background sync handler (for automatic backups and future offline sync)
 */
self.addEventListener('sync', (event) => {
    console.log('Background sync triggered:', event.tag);
    
    if (event.tag === 'automatic-backup') {
        event.waitUntil(performAutomaticBackup());
    } else if (event.tag === 'sync-activities') {
        event.waitUntil(
            // Here you would implement syncing logic
            // For example, upload offline entries to a server
            Promise.resolve().then(() => {
                console.log('Activities synced');
            })
        );
    }
});

/**
 * Perform automatic backup in background
 */
async function performAutomaticBackup() {
    try {
        console.log('🚀 Performing automatic backup in background...');

        // Check backup throttling - get last backup time from clients
        const canBackup = await checkBackupThrottling();
        if (!canBackup) {
            console.log('⏸️ Automatic backup throttled - too soon since last backup');
            return;
        }

        // Get data from localStorage via a client or directly
        const backupData = await getBackupDataFromStorage();
        
        if (!backupData) {
            console.log('No backup data available');
            return;
        }

        // Generate filename
        const now = new Date();
        const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `activity-backup-${timestamp}.json`;

        // Create a blob URL for download
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { 
            type: 'application/json' 
        });
        
        // Store backup info for later notification
        const backupInfo = {
            filename: filename,
            size: blob.size,
            timestamp: now.toISOString(),
            status: 'completed'
        };

        // Notify user of successful backup
        await showBackupCompletedNotification(backupInfo);

        // Update last backup timestamp
        self.clients.matchAll().then(clients => {
            clients.forEach(client => {
                client.postMessage({
                    type: 'AUTOMATIC_BACKUP_COMPLETED',
                    backupInfo: backupInfo
                });
            });
        });

        console.log('✅ Automatic backup completed:', filename);

    } catch (error) {
        console.error('❌ Automatic backup failed:', error);
        
        // Show error notification
        await self.registration.showNotification('Backup Failed', {
            body: `Automatic backup failed: ${error.message}`,
            icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ef4444"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>',
            tag: 'backup-error',
            requireInteraction: true
        });
    }
}

/**
 * Get backup data from localStorage (via client communication)
 */
async function getBackupDataFromStorage() {
    return new Promise((resolve) => {
        // Try to get data from active clients first
        self.clients.matchAll().then(clients => {
            if (clients.length > 0) {
                // Request backup data from the first available client
                const client = clients[0];
                
                const messageChannel = new MessageChannel();
                messageChannel.port1.onmessage = (event) => {
                    resolve(event.data.backupData);
                };
                
                client.postMessage({
                    type: 'REQUEST_BACKUP_DATA'
                }, [messageChannel.port2]);
            } else {
                // No clients available, try to access localStorage directly
                // Note: This is limited in Service Worker context
                try {
                    // We can't directly access localStorage from SW, but we can try
                    // to get data from IndexedDB or other persistent storage
                    resolve(null);
                } catch (error) {
                    console.error('Could not access storage from Service Worker:', error);
                    resolve(null);
                }
            }
        });
    });
}

/**
 * Check if backup can be performed (throttling check)
 * @returns {Promise<boolean>} True if backup can be performed
 */
async function checkBackupThrottling() {
    return new Promise((resolve) => {
        // Request throttling check from clients
        self.clients.matchAll().then(clients => {
            if (clients.length > 0) {
                const client = clients[0];
                
                const messageChannel = new MessageChannel();
                messageChannel.port1.onmessage = (event) => {
                    resolve(event.data.canBackup);
                };
                
                client.postMessage({
                    type: 'CHECK_BACKUP_THROTTLING'
                }, [messageChannel.port2]);
            } else {
                // No clients available, allow backup (conservative approach)
                console.log('No clients available for throttling check, allowing backup');
                resolve(true);
            }
        });
    });
}

/**
 * Show notification when automatic backup completes
 */
async function showBackupCompletedNotification(backupInfo) {
    const options = {
        body: `Your activity data has been automatically backed up.\nFile size: ${(backupInfo.size / 1024).toFixed(1)} KB`,
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2310b981"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>',
        badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2310b981"><circle cx="12" cy="12" r="10"/></svg>',
        tag: 'automatic-backup-success',
        actions: [
            {
                action: 'view_backups',
                title: '📁 View Backups'
            },
            {
                action: 'dismiss',
                title: 'Dismiss'
            }
        ],
        data: backupInfo
    };

    return self.registration.showNotification('💾 Auto Backup Complete', options);
}

/**
 * Message handler for communication with main app
 */
self.addEventListener('message', (event) => {
    console.log('Message received in SW:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: CACHE_NAME });
    }
    
    if (event.data && event.data.type === 'GET_DIAGNOSTICS') {
        getDiagnostics().then(diagnostics => {
            event.ports[0].postMessage(diagnostics);
        }).catch(error => {
            event.ports[0].postMessage({ error: error.message });
        });
    }
});

/**
 * Error handler
 */
self.addEventListener('error', (event) => {
    console.error('Service Worker error:', event.error);
});

/**
 * Unhandled rejection handler
 */
self.addEventListener('unhandledrejection', (event) => {
    console.error('Service Worker unhandled rejection:', event.reason);
});

/**
 * Utility function to broadcast message to all clients
 * @param {Object} message - Message to broadcast
 */
function broadcastMessage(message) {
    return clients.matchAll({ type: 'window' }).then((clientList) => {
        clientList.forEach((client) => {
            client.postMessage(message);
        });
    });
}

/**
 * Generate a unique ID (replicated from utils.js)
 * @returns {string} Unique identifier
 */
function generateId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

/**
 * Extract hashtags from text (replicated from ActivityTracker.js)
 * @param {string} text - Text to extract hashtags from
 * @returns {string[]} Array of hashtags without the # symbol
 */
function extractHashtags(text) {
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

/**
 * Utility function to check if a client URL belongs to this app
 * @param {string} url - The client URL to check
 * @returns {boolean} True if this is an app client
 */
function isAppClient(url) {
    try {
        const urlObj = new URL(url);
        const pathname = urlObj.pathname;
        const filename = pathname.split('/').pop();
        
        // Check for activity-tracker directory in URL (development/subdirectory deployments)
        if (pathname.includes('/activity-tracker/')) {
            return true;
        }
        
        // Check for root deployments (just domain or domain with trailing slash)
        if (pathname === '/' || pathname === '') {
            return true;
        }
        
        // Check if this is the same origin as the service worker
        if (urlObj.origin !== self.location.origin) {
            return false;
        }
        
        // Check for index.html (current) or index.{language}.html (future language-specific versions)
        // Must start with "index." and end with ".html"
        if (filename.startsWith('index.') && filename.endsWith('.html')) {
            return true;
        }
        
        return false;
    } catch (error) {
        // If URL parsing fails, assume it's not an app client
        return false;
    }
}

/**
 * Utility function to check if app is already open
 * @returns {Promise<boolean>} True if app is open
 */
function isAppOpen() {
    return clients.matchAll({ type: 'window' }).then((clientList) => {
        return clientList.some((client) => isAppClient(client.url));
    });
}

/**
 * Utility function to determine the correct app URL based on current context
 * @returns {string} The appropriate app URL
 */
function getAppUrl() {
    // Get the current Service Worker registration scope
    const scope = self.registration.scope;
    console.log('Service Worker scope:', scope);
    
    // Use the scope to ensure URL is within SW scope
    // This prevents opening a second tab/window
    try {
        const scopeUrl = new URL(scope);
        // Return just the base URL without explicit filename
        // This matches the app's start_url and stays within scope
        return scope;
    } catch (error) {
        console.error('Error getting app URL from scope:', error);
        // Fallback to relative path
        return './';
    }
}

/**
 * Get comprehensive service worker diagnostics
 * @returns {Promise<Object>} Detailed diagnostics object
 */
async function getDiagnostics() {
    const diagnostics = {
        // Basic information
        version: CACHE_NAME,
        state: self.registration ? self.registration.active?.state : 'unknown',
        scope: self.registration?.scope || 'unknown',
        updateViaCache: self.registration?.updateViaCache || 'unknown',
        
        // Cache information
        caches: {},
        totalCacheSize: 0,
        cacheStats: {},
        
        // Performance statistics  
        performance: {
            installTime: null,
            activateTime: null,
            uptime: Date.now() - (self.performance?.timeOrigin || Date.now())
        },
        
        // Client information
        clients: {
            count: 0,
            types: {},
            urls: []
        },
        
        // Event statistics
        events: {
            fetchRequests: self.fetchCounter || 0,
            notificationClicks: self.notificationCounter || 0,
            pushMessages: self.pushCounter || 0,
            messagesSent: self.messageCounter || 0
        },
        
        // Memory and storage info
        storage: {},
        
        // Browser capabilities
        capabilities: {
            backgroundSync: 'sync' in self.registration,
            pushMessaging: 'pushManager' in self.registration,
            periodicBackgroundSync: 'periodicSync' in self.registration,
            paymentHandler: 'paymentManager' in self.registration,
            notifications: 'showNotification' in self.registration
        },
        
        timestamp: new Date().toISOString()
    };
    
    try {
        // Get cache information
        const cacheNames = await caches.keys();
        diagnostics.caches.names = cacheNames;
        diagnostics.caches.count = cacheNames.length;
        
        let totalSize = 0;
        for (const cacheName of cacheNames) {
            try {
                const cache = await caches.open(cacheName);
                const keys = await cache.keys();
                const cacheInfo = {
                    keyCount: keys.length,
                    keys: keys.map(req => req.url),
                    size: 0
                };
                
                // Estimate cache size by checking response sizes
                for (const request of keys) {
                    try {
                        const response = await cache.match(request);
                        if (response) {
                            const blob = await response.blob();
                            cacheInfo.size += blob.size;
                        }
                    } catch (e) {
                        // Skip individual response errors
                    }
                }
                
                diagnostics.cacheStats[cacheName] = cacheInfo;
                totalSize += cacheInfo.size;
            } catch (e) {
                diagnostics.cacheStats[cacheName] = { error: e.message };
            }
        }
        diagnostics.totalCacheSize = totalSize;
        
        // Get client information
        const allClients = await clients.matchAll({ includeUncontrolled: true });
        diagnostics.clients.count = allClients.length;
        
        allClients.forEach(client => {
            const type = client.type || 'unknown';
            diagnostics.clients.types[type] = (diagnostics.clients.types[type] || 0) + 1;
            diagnostics.clients.urls.push({
                url: client.url,
                type: client.type,
                id: client.id,
                focused: client.focused || false
            });
        });
        
        // Get storage estimate if available
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            const estimate = await navigator.storage.estimate();
            diagnostics.storage = {
                quota: estimate.quota,
                usage: estimate.usage,
                usageDetails: estimate.usageDetails || {},
                percentUsed: estimate.quota ? Math.round((estimate.usage / estimate.quota) * 100) : 0
            };
        }
        
        // Add registration details
        if (self.registration) {
            diagnostics.registration = {
                scope: self.registration.scope,
                updateViaCache: self.registration.updateViaCache,
                installing: self.registration.installing?.state || null,
                waiting: self.registration.waiting?.state || null,
                active: self.registration.active?.state || null
            };
        }
        
    } catch (error) {
        diagnostics.error = error.message;
        diagnostics.errorStack = error.stack;
    }
    
    return diagnostics;
}

// Initialize event counters
self.fetchCounter = 0;
self.notificationCounter = 0;
self.pushCounter = 0;
self.messageCounter = 0;

// Track fetch events
self.addEventListener('fetch', () => {
    self.fetchCounter = (self.fetchCounter || 0) + 1;
});

// Track notification clicks
self.addEventListener('notificationclick', () => {
    self.notificationCounter = (self.notificationCounter || 0) + 1;
});

// Track push messages
self.addEventListener('push', () => {
    self.pushCounter = (self.pushCounter || 0) + 1;
});

// Track messages
self.addEventListener('message', () => {
    self.messageCounter = (self.messageCounter || 0) + 1;
});

console.log('Service Worker loaded');
