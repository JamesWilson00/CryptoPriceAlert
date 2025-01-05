const PriceAlert = require('./alert');

class AlertManager {
    constructor() {
        this.alerts = [];
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
    
    checkAlerts(crypto, currentPrice) {
        const triggeredAlerts = [];
        
        this.alerts.forEach(alert => {
            if (alert.crypto === crypto && alert.checkAlert(currentPrice)) {
                triggeredAlerts.push(alert);
                console.log(alert.getAlertMessage(currentPrice));
            }
        });
        
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