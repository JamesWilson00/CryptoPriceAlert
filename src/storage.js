const fs = require('fs').promises;
const path = require('path');

class DataStorage {
    constructor() {
        this.dataDir = path.join(__dirname, '..', 'data');
        this.alertsFile = path.join(this.dataDir, 'alerts.json');
        this.historyFile = path.join(this.dataDir, 'price_history.json');
        this.ensureDataDir();
    }
    
    async ensureDataDir() {
        try {
            await fs.access(this.dataDir);
        } catch {
            await fs.mkdir(this.dataDir, { recursive: true });
        }
    }
    
    async saveAlerts(alerts) {
        try {
            const alertData = alerts.map(alert => ({
                id: alert.id,
                crypto: alert.crypto,
                threshold: alert.threshold,
                type: alert.type,
                isActive: alert.isActive,
                createdAt: alert.createdAt,
                triggeredAt: alert.triggeredAt
            }));
            
            await fs.writeFile(this.alertsFile, JSON.stringify(alertData, null, 2));
            console.log(`Saved ${alertData.length} alerts to storage`);
        } catch (error) {
            console.error('Error saving alerts:', error.message);
        }
    }
    
    async loadAlerts() {
        try {
            const data = await fs.readFile(this.alertsFile, 'utf8');
            const alertData = JSON.parse(data);
            console.log(`Loaded ${alertData.length} alerts from storage`);
            return alertData;
        } catch (error) {
            console.log('No existing alerts found, starting fresh');
            return [];
        }
    }
    
    async savePriceHistory(crypto, price, timestamp = new Date()) {
        try {
            let history = {};
            
            try {
                const data = await fs.readFile(this.historyFile, 'utf8');
                history = JSON.parse(data);
            } catch {
                // File doesn't exist yet
            }
            
            if (!history[crypto]) {
                history[crypto] = [];
            }
            
            history[crypto].push({
                price: price,
                timestamp: timestamp
            });
            
            // Keep only last 1000 records per crypto
            if (history[crypto].length > 1000) {
                history[crypto] = history[crypto].slice(-1000);
            }
            
            await fs.writeFile(this.historyFile, JSON.stringify(history, null, 2));
        } catch (error) {
            console.error('Error saving price history:', error.message);
        }
    }
    
    async getPriceHistory(crypto, limit = 100) {
        try {
            const data = await fs.readFile(this.historyFile, 'utf8');
            const history = JSON.parse(data);
            
            if (!history[crypto]) {
                return [];
            }
            
            return history[crypto].slice(-limit);
        } catch (error) {
            console.log(`No price history found for ${crypto}`);
            return [];
        }
    }
}

module.exports = DataStorage;