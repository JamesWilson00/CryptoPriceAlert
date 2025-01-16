const fs = require('fs').promises;
const path = require('path');

class Logger {
    constructor() {
        this.logsDir = path.join(__dirname, '..', 'logs');
        this.logFile = path.join(this.logsDir, 'app.log');
        this.errorFile = path.join(this.logsDir, 'error.log');
        this.alertFile = path.join(this.logsDir, 'alerts.log');
        this.maxLogSize = 10 * 1024 * 1024; // 10MB
        this.maxLogFiles = 5;
        
        this.ensureLogsDir();
    }
    
    async ensureLogsDir() {
        try {
            await fs.access(this.logsDir);
        } catch {
            await fs.mkdir(this.logsDir, { recursive: true });
        }
    }
    
    formatMessage(level, message, data = null) {
        const timestamp = new Date().toISOString();
        let logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
        
        if (data) {
            logEntry += ` | ${JSON.stringify(data)}`;
        }
        
        return logEntry + '\n';
    }
    
    async writeToFile(filePath, content) {
        try {
            // Check file size and rotate if needed
            await this.rotateLogIfNeeded(filePath);
            
            await fs.appendFile(filePath, content);
        } catch (error) {
            console.error('Failed to write to log file:', error.message);
        }
    }
    
    async rotateLogIfNeeded(filePath) {
        try {
            const stats = await fs.stat(filePath);
            
            if (stats.size > this.maxLogSize) {
                await this.rotateLog(filePath);
            }
        } catch (error) {
            // File doesn't exist yet, no rotation needed
        }
    }
    
    async rotateLog(filePath) {
        const ext = path.extname(filePath);
        const baseName = path.basename(filePath, ext);
        const dir = path.dirname(filePath);
        
        // Move existing log files
        for (let i = this.maxLogFiles - 1; i > 0; i--) {
            const oldFile = path.join(dir, `${baseName}.${i}${ext}`);
            const newFile = path.join(dir, `${baseName}.${i + 1}${ext}`);
            
            try {
                await fs.access(oldFile);
                await fs.rename(oldFile, newFile);
            } catch {
                // File doesn't exist, continue
            }
        }
        
        // Move current log to .1
        const archiveFile = path.join(dir, `${baseName}.1${ext}`);
        try {
            await fs.rename(filePath, archiveFile);
        } catch (error) {
            console.error('Failed to rotate log file:', error.message);
        }
    }
    
    async info(message, data = null) {
        const logEntry = this.formatMessage('info', message, data);
        console.log(logEntry.trim());
        await this.writeToFile(this.logFile, logEntry);
    }
    
    async warn(message, data = null) {
        const logEntry = this.formatMessage('warn', message, data);
        console.warn(logEntry.trim());
        await this.writeToFile(this.logFile, logEntry);
    }
    
    async error(message, error = null, data = null) {
        const errorData = error ? {
            message: error.message,
            stack: error.stack,
            ...data
        } : data;
        
        const logEntry = this.formatMessage('error', message, errorData);
        console.error(logEntry.trim());
        await this.writeToFile(this.logFile, logEntry);
        await this.writeToFile(this.errorFile, logEntry);
    }
    
    async debug(message, data = null) {
        if (process.env.NODE_ENV === 'development' || process.env.DEBUG) {
            const logEntry = this.formatMessage('debug', message, data);
            console.debug(logEntry.trim());
            await this.writeToFile(this.logFile, logEntry);
        }
    }
    
    async alert(message, alertData = null) {
        const logEntry = this.formatMessage('alert', message, alertData);
        console.log(`🚨 ${logEntry.trim()}`);
        await this.writeToFile(this.alertFile, logEntry);
        await this.writeToFile(this.logFile, logEntry);
    }
    
    async logPriceCheck(crypto, price, alertsTriggered = 0) {
        const data = {
            crypto,
            price,
            alertsTriggered,
            timestamp: new Date().toISOString()
        };
        
        await this.info(`Price check: ${crypto.toUpperCase()} = $${price}`, data);
    }
    
    async logAlertTriggered(alert, currentPrice) {
        const data = {
            alertId: alert.id,
            crypto: alert.crypto,
            threshold: alert.threshold,
            type: alert.type,
            currentPrice: currentPrice,
            createdAt: alert.createdAt,
            triggeredAt: alert.triggeredAt
        };
        
        await this.alert(`Alert triggered: ${alert.crypto.toUpperCase()} ${alert.type} $${alert.threshold} (current: $${currentPrice})`, data);
    }
    
    async logNotificationSent(type, success, error = null) {
        const data = {
            notificationType: type,
            success: success,
            error: error?.message || null
        };
        
        const message = `Notification ${success ? 'sent' : 'failed'}: ${type}`;
        
        if (success) {
            await this.info(message, data);
        } else {
            await this.error(message, error, data);
        }
    }
    
    async logSystemStart() {
        await this.info('Crypto Price Alert System started', {
            nodeVersion: process.version,
            platform: process.platform,
            pid: process.pid
        });
    }
    
    async logSystemStop() {
        await this.info('Crypto Price Alert System stopped');
    }
    
    async getRecentLogs(type = 'all', lines = 100) {
        let filePath = this.logFile;
        
        switch (type) {
            case 'error':
                filePath = this.errorFile;
                break;
            case 'alert':
                filePath = this.alertFile;
                break;
        }
        
        try {
            const content = await fs.readFile(filePath, 'utf8');
            const logLines = content.trim().split('\n');
            return logLines.slice(-lines);
        } catch (error) {
            return [`No logs found for type: ${type}`];
        }
    }
    
    async clearLogs() {
        try {
            await Promise.all([
                fs.writeFile(this.logFile, ''),
                fs.writeFile(this.errorFile, ''),
                fs.writeFile(this.alertFile, '')
            ]);
            
            await this.info('Log files cleared');
            return true;
        } catch (error) {
            console.error('Failed to clear logs:', error.message);
            return false;
        }
    }
    
    async getLogStats() {
        try {
            const [appStats, errorStats, alertStats] = await Promise.all([
                this.getFileStats(this.logFile),
                this.getFileStats(this.errorFile), 
                this.getFileStats(this.alertFile)
            ]);
            
            return {
                app: appStats,
                error: errorStats,
                alert: alertStats
            };
        } catch (error) {
            console.error('Failed to get log stats:', error.message);
            return null;
        }
    }
    
    async getFileStats(filePath) {
        try {
            const stats = await fs.stat(filePath);
            const content = await fs.readFile(filePath, 'utf8');
            const lines = content.trim().split('\n').filter(line => line.length > 0);
            
            return {
                size: stats.size,
                lines: lines.length,
                lastModified: stats.mtime
            };
        } catch {
            return {
                size: 0,
                lines: 0,
                lastModified: null
            };
        }
    }
}

// Create singleton instance
const logger = new Logger();

module.exports = logger;