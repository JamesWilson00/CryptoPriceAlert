const fs = require('fs').promises;
const path = require('path');

class ConfigManager {
    constructor() {
        this.configPath = path.join(__dirname, '..', 'config.json');
        this.defaultConfig = {
            alerts: {
                defaultCurrency: 'usd',
                checkInterval: 300000,
                maxActiveAlerts: 50,
                autoDisableAfterTrigger: true
            },
            notifications: {
                email: {
                    enabled: false,
                    user: '',
                    password: '',
                    recipient: ''
                },
                webhook: {
                    enabled: false,
                    url: '',
                    timeout: 10000
                },
                discord: {
                    enabled: false,
                    webhookUrl: ''
                },
                slack: {
                    enabled: false,
                    webhookUrl: ''
                }
            },
            api: {
                coingecko: {
                    apiKey: '',
                    baseUrl: 'https://api.coingecko.com/api/v3',
                    requestDelay: 200
                }
            },
            monitoring: {
                enabledCryptos: ['bitcoin', 'ethereum', 'cardano', 'solana', 'dogecoin'],
                schedules: {
                    priceCheck: '*/5 * * * *',
                    dailySummary: '0 9 * * *',
                    weeklyReport: '0 9 * * 0'
                }
            },
            analysis: {
                movingAveragePeriods: 20,
                trendAnalysisPeriods: 10,
                volatilityPeriods: 20
            },
            storage: {
                maxPriceHistoryRecords: 1000,
                dataRetentionDays: 365,
                autoBackup: true,
                backupInterval: 86400000
            }
        };
    }
    
    async loadConfig() {
        try {
            const configData = await fs.readFile(this.configPath, 'utf8');
            const config = JSON.parse(configData);
            return this.mergeWithDefaults(config);
        } catch (error) {
            console.log('No config file found, using defaults');
            return this.defaultConfig;
        }
    }
    
    async saveConfig(config) {
        try {
            const configData = JSON.stringify(config, null, 2);
            await fs.writeFile(this.configPath, configData);
            console.log('Configuration saved successfully');
            return true;
        } catch (error) {
            console.error('Failed to save configuration:', error.message);
            return false;
        }
    }
    
    mergeWithDefaults(userConfig) {
        return this.deepMerge(this.defaultConfig, userConfig);
    }
    
    deepMerge(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(target[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        
        return result;
    }
    
    async updateConfig(path, value) {
        const config = await this.loadConfig();
        this.setNestedProperty(config, path, value);
        return await this.saveConfig(config);
    }
    
    setNestedProperty(obj, path, value) {
        const keys = path.split('.');
        let current = obj;
        
        for (let i = 0; i < keys.length - 1; i++) {
            if (!(keys[i] in current)) {
                current[keys[i]] = {};
            }
            current = current[keys[i]];
        }
        
        current[keys[keys.length - 1]] = value;
    }
    
    async getConfig(path = null) {
        const config = await this.loadConfig();
        
        if (!path) {
            return config;
        }
        
        return this.getNestedProperty(config, path);
    }
    
    getNestedProperty(obj, path) {
        const keys = path.split('.');
        let current = obj;
        
        for (const key of keys) {
            if (current && typeof current === 'object' && key in current) {
                current = current[key];
            } else {
                return undefined;
            }
        }
        
        return current;
    }
    
    async initializeConfig() {
        try {
            await fs.access(this.configPath);
            console.log('Configuration file exists');
        } catch {
            console.log('Creating default configuration file');
            await this.saveConfig(this.defaultConfig);
        }
    }
    
    async resetConfig() {
        console.log('Resetting configuration to defaults');
        return await this.saveConfig(this.defaultConfig);
    }
    
    validateConfig(config) {
        const errors = [];
        
        // Validate alert settings
        if (config.alerts?.maxActiveAlerts && config.alerts.maxActiveAlerts < 1) {
            errors.push('Max active alerts must be at least 1');
        }
        
        // Validate intervals
        if (config.alerts?.checkInterval && config.alerts.checkInterval < 60000) {
            errors.push('Check interval must be at least 60 seconds');
        }
        
        // Validate email settings
        if (config.notifications?.email?.enabled) {
            if (!config.notifications.email.user) {
                errors.push('Email user is required when email notifications are enabled');
            }
            if (!config.notifications.email.password) {
                errors.push('Email password is required when email notifications are enabled');
            }
        }
        
        // Validate webhook URLs
        if (config.notifications?.webhook?.enabled && !config.notifications.webhook.url) {
            errors.push('Webhook URL is required when webhook notifications are enabled');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
    
    async exportConfig(filePath) {
        const config = await this.loadConfig();
        
        try {
            await fs.writeFile(filePath, JSON.stringify(config, null, 2));
            console.log(`Configuration exported to ${filePath}`);
            return true;
        } catch (error) {
            console.error('Failed to export configuration:', error.message);
            return false;
        }
    }
    
    async importConfig(filePath) {
        try {
            const configData = await fs.readFile(filePath, 'utf8');
            const config = JSON.parse(configData);
            
            const validation = this.validateConfig(config);
            if (!validation.isValid) {
                console.error('Invalid configuration:', validation.errors);
                return false;
            }
            
            return await this.saveConfig(config);
        } catch (error) {
            console.error('Failed to import configuration:', error.message);
            return false;
        }
    }
}

module.exports = ConfigManager;