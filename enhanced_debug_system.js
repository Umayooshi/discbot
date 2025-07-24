const fs = require('fs');
const path = require('path');

class EnhancedDebugSystem {
    constructor() {
        this.startTime = Date.now();
        this.logLevels = {
            INFO: 'ℹ️',
            SUCCESS: '✅',
            WARNING: '⚠️',
            ERROR: '❌',
            CRITICAL: '🚨',
            API: '🌐',
            DB: '🗄️',
            PERFORMANCE: '⚡',
            MAL: '📺'
        };
        this.apiTimings = new Map();
        this.errorCounts = new Map();
        this.performanceMetrics = {
            apiCalls: 0,
            dbQueries: 0,
            imageProcessing: 0,
            totalErrors: 0
        };
    }

    log(level, category, message, data = null) {
        const timestamp = new Date().toISOString();
        const emoji = this.logLevels[level] || '📝';
        const runtime = ((Date.now() - this.startTime) / 1000).toFixed(2);
        
        let logMessage = `${emoji} [${level}] [${category}] (+${runtime}s) ${message}`;
        
        if (data) {
            logMessage += `\n📊 Data: ${JSON.stringify(data, null, 2)}`;
        }
        
        console.log(logMessage);
        
        // Track error counts
        if (level === 'ERROR' || level === 'CRITICAL') {
            this.performanceMetrics.totalErrors++;
            const errorKey = `${category}-${message.substring(0, 50)}`;
            this.errorCounts.set(errorKey, (this.errorCounts.get(errorKey) || 0) + 1);
        }
        
        return { timestamp, level, category, message, data, runtime };
    }

    // API Performance Tracking
    startApiCall(apiName, endpoint = '') {
        const callId = `${apiName}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        this.apiTimings.set(callId, {
            apiName,
            endpoint,
            startTime: Date.now()
        });
        this.log('API', 'START', `${apiName} API call started: ${endpoint}`);
        this.performanceMetrics.apiCalls++;
        return callId;
    }

    endApiCall(callId, success = true, responseData = null) {
        const timing = this.apiTimings.get(callId);
        if (!timing) return;
        
        const duration = Date.now() - timing.startTime;
        const status = success ? 'SUCCESS' : 'ERROR';
        
        this.log(status, 'API_END', 
            `${timing.apiName} completed in ${duration}ms`, 
            { endpoint: timing.endpoint, duration, responseData }
        );
        
        this.apiTimings.delete(callId);
        return duration;
    }

    // Database Performance Tracking
    trackDbQuery(operation, collection, query = null) {
        const startTime = Date.now();
        this.performanceMetrics.dbQueries++;
        
        return {
            end: (success = true, resultCount = null) => {
                const duration = Date.now() - startTime;
                const status = success ? 'SUCCESS' : 'ERROR';
                this.log(status, 'DATABASE', 
                    `${operation} on ${collection} (${duration}ms)`,
                    { query, resultCount, duration }
                );
                return duration;
            }
        };
    }

    // Image Processing Tracking
    trackImageProcessing(operation, imageInfo = null) {
        const startTime = Date.now();
        this.performanceMetrics.imageProcessing++;
        
        return {
            end: (success = true, outputInfo = null) => {
                const duration = Date.now() - startTime;
                const status = success ? 'SUCCESS' : 'ERROR';
                this.log(status, 'IMAGE', 
                    `${operation} completed (${duration}ms)`,
                    { imageInfo, outputInfo, duration }
                );
                return duration;
            }
        };
    }

    // MAL API Specific Logging
    malApiLog(operation, data = null) {
        this.log('MAL', 'API', operation, data);
    }

    malCharacterLog(operation, characterName, data = null) {
        this.log('MAL', 'CHARACTER', `${operation}: ${characterName}`, data);
    }

    malVersionLog(operation, characterName, version, data = null) {
        this.log('MAL', 'VERSION', `${operation}: ${characterName} v${version}`, data);
    }

    // Error Recovery Suggestions
    suggestFix(category, error) {
        const suggestions = {
            'API': [
                'Check internet connection',
                'Verify API key is valid',
                'Check rate limits',
                'Try again in a few seconds'
            ],
            'DATABASE': [
                'Check MongoDB connection',
                'Verify collection exists',
                'Check query syntax',
                'Ensure proper indexing'
            ],
            'IMAGE': [
                'Check image URL is valid',
                'Verify image format supported',
                'Check Canvas/Sharp installation',
                'Ensure sufficient memory'
            ],
            'MAL': [
                'Verify MAL_CLIENT_ID is set',
                'Check MAL API status',
                'Try Jikan API as backup',
                'Check character name format'
            ]
        };

        const fixes = suggestions[category] || ['Check logs for more details'];
        this.log('INFO', 'RECOVERY', `Suggested fixes for ${category} error:`, fixes);
        return fixes;
    }

    // Performance Summary
    getPerformanceSummary() {
        const runtime = ((Date.now() - this.startTime) / 1000).toFixed(2);
        const summary = {
            totalRuntime: `${runtime}s`,
            ...this.performanceMetrics,
            activeApiCalls: this.apiTimings.size,
            uniqueErrors: this.errorCounts.size,
            averageApiTime: this.performanceMetrics.apiCalls > 0 ? 
                `${(Array.from(this.apiTimings.values()).reduce((sum, call) => 
                    sum + (Date.now() - call.startTime), 0) / this.apiTimings.size).toFixed(0)}ms` : '0ms'
        };
        
        this.log('PERFORMANCE', 'SUMMARY', 'Current performance metrics', summary);
        return summary;
    }

    // Error Analysis
    getErrorAnalysis() {
        const errorAnalysis = {
            totalErrors: this.performanceMetrics.totalErrors,
            errorBreakdown: Object.fromEntries(this.errorCounts),
            mostCommonError: this.errorCounts.size > 0 ? 
                [...this.errorCounts.entries()].sort((a, b) => b[1] - a[1])[0] : null
        };
        
        this.log('INFO', 'ERROR_ANALYSIS', 'Error breakdown analysis', errorAnalysis);
        return errorAnalysis;
    }

    // Utility methods for common operations
    info(category, message, data) { return this.log('INFO', category, message, data); }
    success(category, message, data) { return this.log('SUCCESS', category, message, data); }
    warning(category, message, data) { return this.log('WARNING', category, message, data); }
    error(category, message, data) { return this.log('ERROR', category, message, data); }
    critical(category, message, data) { return this.log('CRITICAL', category, message, data); }
}

// Global debug instance
const debugSystem = new EnhancedDebugSystem();

// Helper function for easy access
function debug() {
    return debugSystem;
}

module.exports = { EnhancedDebugSystem, debugSystem, debug };