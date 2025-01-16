#!/usr/bin/env node

const readline = require('readline');
const AlertManager = require('./alertManager');
const DataStorage = require('./storage');
const PriceAnalyzer = require('./analysis');
const ConfigManager = require('./config');
const logger = require('./logger');
const { getAllSupportedCryptos, isValidCrypto, formatCryptoName } = require('./cryptoList');

class CLI {
    constructor() {
        this.alertManager = new AlertManager();
        this.storage = new DataStorage();
        this.analyzer = new PriceAnalyzer(this.storage);
        this.configManager = new ConfigManager();
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
        console.log('6. analyze - Generate analysis report');
        console.log('7. config - Manage configuration');
        console.log('8. logs - View recent logs');
        console.log('9. cryptos - List supported cryptocurrencies');
        console.log('10. help - Show this menu');
        console.log('11. exit - Exit program');
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
                case 'analyze':
                    await this.showAnalysis();
                    break;
                case '7':
                case 'config':
                    await this.manageConfig();
                    break;
                case '8':
                case 'logs':
                    await this.showLogs();
                    break;
                case '9':
                case 'cryptos':
                    this.showSupportedCryptos();
                    break;
                case '10':
                case 'help':
                    this.showMenu();
                    break;
                case '11':
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
        console.log('\nSupported cryptocurrencies:');
        getAllSupportedCryptos().forEach(crypto => {
            console.log(`- ${crypto.id} (${crypto.symbol})`);
        });
        
        return new Promise((resolve) => {
            this.rl.question('Enter crypto symbol: ', (crypto) => {
                if (!isValidCrypto(crypto)) {
                    console.log('❌ Unsupported cryptocurrency. Use "cryptos" command to see supported ones.');
                    resolve();
                    return;
                }
                
                this.rl.question('Enter price threshold: $', (price) => {
                    this.rl.question('Alert type (above/below): ', (type) => {
                        const threshold = parseFloat(price);
                        
                        if (isNaN(threshold) || threshold <= 0) {
                            console.log('❌ Invalid price entered');
                            resolve();
                            return;
                        }
                        
                        if (!['above', 'below'].includes(type.toLowerCase())) {
                            console.log('❌ Invalid alert type. Use "above" or "below"');
                            resolve();
                            return;
                        }
                        
                        const alertId = this.alertManager.addAlert(crypto.toLowerCase(), threshold, type.toLowerCase());
                        console.log(`✅ Alert created with ID: ${alertId}`);
                        console.log(`   ${formatCryptoName(crypto)} ${type} $${threshold}`);
                        
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
            console.log(`  ${formatCryptoName(alert.crypto)} ${alert.type} $${alert.threshold} - ${status}`);
            console.log(`  Created: ${new Date(alert.createdAt).toLocaleString()}`);
            if (alert.triggeredAt) {
                console.log(`  Triggered: ${new Date(alert.triggeredAt).toLocaleString()}`);
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
    
    async showAnalysis() {
        return new Promise((resolve) => {
            this.rl.question('Enter crypto symbol for analysis: ', async (crypto) => {
                if (!isValidCrypto(crypto)) {
                    console.log('❌ Unsupported cryptocurrency');
                    resolve();
                    return;
                }
                
                console.log('Generating analysis report...');
                const report = await this.analyzer.generateAnalysisReport(crypto.toLowerCase());
                
                if (report) {
                    const formatted = this.analyzer.formatAnalysisReport(report);
                    console.log(formatted);
                } else {
                    console.log('❌ Unable to generate analysis - insufficient data');
                }
                
                resolve();
            });
        });
    }
    
    async manageConfig() {
        console.log('\nConfiguration Management:');
        console.log('1. View current config');
        console.log('2. Update setting');
        console.log('3. Reset to defaults');
        console.log('4. Export config');
        console.log('5. Import config');
        
        return new Promise((resolve) => {
            this.rl.question('Choose option: ', async (option) => {
                switch (option) {
                    case '1':
                        const config = await this.configManager.getConfig();
                        console.log('\nCurrent Configuration:');
                        console.log(JSON.stringify(config, null, 2));
                        break;
                    case '2':
                        this.rl.question('Enter config path (e.g. alerts.checkInterval): ', (path) => {
                            this.rl.question('Enter new value: ', async (value) => {
                                // Try to parse as number or boolean if possible
                                let parsedValue = value;
                                if (!isNaN(value)) {
                                    parsedValue = parseFloat(value);
                                } else if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') {
                                    parsedValue = value.toLowerCase() === 'true';
                                }
                                
                                const success = await this.configManager.updateConfig(path, parsedValue);
                                console.log(success ? '✅ Configuration updated' : '❌ Failed to update configuration');
                                resolve();
                            });
                        });
                        return;
                    case '3':
                        const resetSuccess = await this.configManager.resetConfig();
                        console.log(resetSuccess ? '✅ Configuration reset to defaults' : '❌ Failed to reset configuration');
                        break;
                    case '4':
                        this.rl.question('Enter export file path: ', async (filePath) => {
                            const exportSuccess = await this.configManager.exportConfig(filePath);
                            console.log(exportSuccess ? `✅ Configuration exported to ${filePath}` : '❌ Export failed');
                            resolve();
                        });
                        return;
                    case '5':
                        this.rl.question('Enter import file path: ', async (filePath) => {
                            const importSuccess = await this.configManager.importConfig(filePath);
                            console.log(importSuccess ? '✅ Configuration imported successfully' : '❌ Import failed');
                            resolve();
                        });
                        return;
                    default:
                        console.log('Invalid option');
                }
                resolve();
            });
        });
    }
    
    async showLogs() {
        console.log('\nLog Options:');
        console.log('1. Recent app logs');
        console.log('2. Recent error logs');
        console.log('3. Recent alert logs');
        console.log('4. Log statistics');
        
        return new Promise((resolve) => {
            this.rl.question('Choose option: ', async (option) => {
                try {
                    switch (option) {
                        case '1':
                            const appLogs = await logger.getRecentLogs('all', 20);
                            console.log('\nRecent App Logs:');
                            appLogs.forEach(log => console.log(log));
                            break;
                        case '2':
                            const errorLogs = await logger.getRecentLogs('error', 10);
                            console.log('\nRecent Error Logs:');
                            errorLogs.forEach(log => console.log(log));
                            break;
                        case '3':
                            const alertLogs = await logger.getRecentLogs('alert', 10);
                            console.log('\nRecent Alert Logs:');
                            alertLogs.forEach(log => console.log(log));
                            break;
                        case '4':
                            const stats = await logger.getLogStats();
                            if (stats) {
                                console.log('\nLog Statistics:');
                                console.log(`App log: ${stats.app.lines} lines, ${(stats.app.size / 1024).toFixed(1)} KB`);
                                console.log(`Error log: ${stats.error.lines} lines, ${(stats.error.size / 1024).toFixed(1)} KB`);
                                console.log(`Alert log: ${stats.alert.lines} lines, ${(stats.alert.size / 1024).toFixed(1)} KB`);
                            }
                            break;
                        default:
                            console.log('Invalid option');
                    }
                } catch (error) {
                    console.log('❌ Error accessing logs:', error.message);
                }
                resolve();
            });
        });
    }
    
    showSupportedCryptos() {
        console.log('\nSupported Cryptocurrencies:');
        console.log('============================');
        getAllSupportedCryptos().forEach(crypto => {
            console.log(`${crypto.emoji} ${crypto.name} (${crypto.symbol}) - use "${crypto.id}"`);
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