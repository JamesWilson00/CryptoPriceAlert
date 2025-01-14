const PriceAlert = require('./alert');
const NotificationService = require('./notification');
const DataStorage = require('./storage');

class AlertManager {
    constructor() {
        this.alerts = [];
        this.notificationService = new NotificationService();
        this.storage = new DataStorage();
    }
    
    addAlert(crypto, threshold, type) {
        const alert = new PriceAlert(crypto, threshold, type);
        this.alerts.push(alert);
        console.log(`Alert added: ${crypto.toUpperCase()} ${type} $${threshold}`);
        return alert.id;
    }
    
    removeAlert(alertId) {
        const index = this.alerts.findIndex(alert => alert.id === alertId);
        if (index !== -1) {
            this.alerts.splice(index, 1);
            console.log(`Alert removed: ${alertId}`);
            return true;
        }
        return false;
    }
    
    async checkAlerts(crypto, currentPrice) {
        const triggeredAlerts = [];
        
        for (const alert of this.alerts) {
            if (alert.crypto === crypto && alert.checkAlert(currentPrice)) {
                triggeredAlerts.push(alert);
                
                // Send all types of notifications
                await this.notificationService.sendAllNotifications(alert, currentPrice);
            }
        }
        
        return triggeredAlerts;
    }
    
    getActiveAlerts() {
        return this.alerts.filter(alert => alert.isActive);
    }
    
    getAllAlerts() {
        return this.alerts;
    }
}

module.exports = AlertManager;