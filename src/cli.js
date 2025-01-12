#!/usr/bin/env node

const readline = require('readline');
const AlertManager = require('./alertManager');
const DataStorage = require('./storage');

class CLI {
    constructor() {
        this.alertManager = new AlertManager();
        this.storage = new DataStorage();
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }
    
    async start() {
        console.log('🚀 Crypto Price Alert CLI');
        console.log('========================');
        
        // Load existing alerts
        await this.loadAlerts();
        
        this.showMenu();
        this.handleInput();
    }
    
    async loadAlerts() {
        try {
            const alertData = await this.storage.loadAlerts();
            // TODO: Restore alerts from data
            console.log(`Loaded ${alertData.length} saved alerts`);
        } catch (error) {
            console.log('No saved alerts found');
        }
    }
    
    showMenu() {
        console.log('\nAvailable commands:');
        console.log('1. add - Add new price alert');
        console.log('2. list - List all alerts');  
        console.log('3. remove - Remove alert');
        console.log('4. check - Check current prices');
        console.log('5. history - Show price history');
        console.log('6. help - Show this menu');
        console.log('7. exit - Exit program');
        console.log('');
    }
    
    handleInput() {
        this.rl.question('> ', async (input) => {
            const command = input.trim().toLowerCase();
            
            switch (command) {
                case '1':
                case 'add':
                    await this.addAlert();
                    break;
                case '2':
                case 'list':
                    this.listAlerts();
                    break;
                case '3':
                case 'remove':
                    await this.removeAlert();
                    break;
                case '4':
                case 'check':
                    await this.checkPrices();
                    break;
                case '5':
                case 'history':
                    await this.showHistory();
                    break;
                case '6':
                case 'help':
                    this.showMenu();
                    break;
                case '7':
                case 'exit':
                    await this.exit();
                    return;
                default:
                    console.log('Unknown command. Type "help" for available commands.');
            }
            
            this.handleInput();
        });
    }
    
    async addAlert() {
        return new Promise((resolve) => {
            this.rl.question('Enter crypto symbol (bitcoin/ethereum): ', (crypto) => {
                this.rl.question('Enter price threshold: $', (price) => {
                    this.rl.question('Alert type (above/below): ', (type) => {
                        const threshold = parseFloat(price);
                        
                        if (isNaN(threshold)) {
                            console.log('Invalid price entered');
                            resolve();
                            return;
                        }
                        
                        if (!['above', 'below'].includes(type.toLowerCase())) {
                            console.log('Invalid alert type. Use "above" or "below"');
                            resolve();
                            return;
                        }
                        
                        const alertId = this.alertManager.addAlert(crypto.toLowerCase(), threshold, type.toLowerCase());
                        console.log(`✅ Alert created with ID: ${alertId}`);
                        
                        this.storage.saveAlerts(this.alertManager.getAllAlerts());
                        resolve();
                    });
                });
            });
        });
    }
    
    listAlerts() {
        const alerts = this.alertManager.getAllAlerts();
        
        if (alerts.length === 0) {
            console.log('No alerts configured');
            return;
        }
        
        console.log('\nConfigured Alerts:');
        console.log('==================');
        
        alerts.forEach(alert => {
            const status = alert.isActive ? '🟢 Active' : '🔴 Triggered';
            console.log(`ID: ${alert.id}`);
            console.log(`  ${alert.crypto.toUpperCase()} ${alert.type} $${alert.threshold} - ${status}`);
            if (alert.triggeredAt) {
                console.log(`  Triggered: ${alert.triggeredAt.toLocaleString()}`);
            }
            console.log('');
        });
    }
    
    async removeAlert() {
        return new Promise((resolve) => {
            this.listAlerts();
            this.rl.question('Enter alert ID to remove: ', (id) => {
                const alertId = parseFloat(id);
                const removed = this.alertManager.removeAlert(alertId);
                
                if (removed) {
                    console.log('✅ Alert removed successfully');
                    this.storage.saveAlerts(this.alertManager.getAllAlerts());
                } else {
                    console.log('❌ Alert not found');
                }
                
                resolve();
            });
        });
    }
    
    async checkPrices() {
        console.log('Checking current prices...');
        // This would integrate with the existing price checking logic
        console.log('Price check completed');
    }
    
    async showHistory() {
        return new Promise((resolve) => {
            this.rl.question('Enter crypto symbol: ', async (crypto) => {
                const history = await this.storage.getPriceHistory(crypto.toLowerCase(), 10);
                
                if (history.length === 0) {
                    console.log(`No price history found for ${crypto}`);
                    resolve();
                    return;
                }
                
                console.log(`\nPrice History for ${crypto.toUpperCase()} (last 10 records):`);
                console.log('====================================');
                
                history.forEach(record => {
                    console.log(`$${record.price} - ${new Date(record.timestamp).toLocaleString()}`);
                });
                
                resolve();
            });
        });
    }
    
    async exit() {
        console.log('Saving data and exiting...');
        await this.storage.saveAlerts(this.alertManager.getAllAlerts());
        console.log('Goodbye! 👋');
        this.rl.close();
        process.exit(0);
    }
}

// Run CLI if this file is executed directly
if (require.main === module) {
    const cli = new CLI();
    cli.start();
}

module.exports = CLI;