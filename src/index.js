const axios = require('axios');
const cron = require('node-cron');
const AlertManager = require('./alertManager');
const { getAllSupportedCryptos, formatCryptoName } = require('./cryptoList');
const PriceAnalyzer = require('./analysis');
const ConfigManager = require('./config');
const logger = require('./logger');
require('dotenv').config();

console.log('Crypto Price Alert System Starting...');

const alertManager = new AlertManager();
const configManager = new ConfigManager();
let analyzer = null;

async function getCryptoPrice(symbol) {
    try {
        const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${symbol}&vs_currencies=usd`);
        return response.data[symbol].usd;
    } catch (error) {
        console.error('Error fetching price:', error.message);
        return null;
    }
}

async function checkPrices() {
    await logger.info('Starting price check cycle');
    
    const config = await configManager.getConfig();
    const enabledCryptos = config.monitoring?.enabledCryptos || ['bitcoin', 'ethereum', 'cardano', 'solana', 'dogecoin'];
    const requestDelay = config.api?.coingecko?.requestDelay || 200;
    
    for (const crypto of enabledCryptos) {
        try {
            const price = await getCryptoPrice(crypto);
            if (price) {
                console.log(`${formatCryptoName(crypto)}: $${price}`);
                
                const triggeredAlerts = await alertManager.checkAlerts(crypto, price);
                await logger.logPriceCheck(crypto, price, triggeredAlerts.length);
                
                // Save price to history
                if (alertManager.storage) {
                    await alertManager.storage.savePriceHistory(crypto, price);
                }
                
                // Log triggered alerts
                for (const alert of triggeredAlerts) {
                    await logger.logAlertTriggered(alert, price);
                }
            }
        } catch (error) {
            await logger.error(`Failed to process ${crypto}`, error);
        }
        
        // Delay between API calls
        await new Promise(resolve => setTimeout(resolve, requestDelay));
    }
    
    await logger.info('Price check cycle completed');
}

async function generateAnalysisReport(crypto) {
    if (!analyzer) {
        analyzer = new PriceAnalyzer(alertManager.storage);
    }
    
    const report = await analyzer.generateAnalysisReport(crypto);
    if (report) {
        const formattedReport = analyzer.formatAnalysisReport(report);
        console.log(formattedReport);
        await logger.info(`Analysis report generated for ${crypto}`, report);
    }
}

async function startMonitoring() {
    await logger.logSystemStart();
    console.log('Starting scheduled monitoring...');
    
    // Initialize configuration
    await configManager.initializeConfig();
    const config = await configManager.getConfig();
    
    // Add some sample alerts for different cryptos
    alertManager.addAlert('bitcoin', 45000, 'above');
    alertManager.addAlert('bitcoin', 35000, 'below');
    alertManager.addAlert('ethereum', 3000, 'above');
    alertManager.addAlert('cardano', 0.50, 'above');
    alertManager.addAlert('solana', 100, 'below');
    alertManager.addAlert('dogecoin', 0.10, 'above');
    
    console.log(`Active alerts: ${alertManager.getActiveAlerts().length}`);
    
    // Show supported cryptocurrencies
    console.log('\nSupported cryptocurrencies:');
    getAllSupportedCryptos().forEach(crypto => {
        console.log(`- ${crypto.emoji} ${crypto.name} (${crypto.symbol})`);
    });
    
    // Initialize analyzer
    analyzer = new PriceAnalyzer(alertManager.storage);
    
    // Run immediately
    await checkPrices();
    
    // Schedule price checks
    const priceCheckSchedule = config.monitoring?.schedules?.priceCheck || '*/5 * * * *';
    cron.schedule(priceCheckSchedule, async () => {
        console.log('\n--- Scheduled price check ---');
        await checkPrices();
    });
    
    // Schedule daily summary
    const dailySummarySchedule = config.monitoring?.schedules?.dailySummary || '0 9 * * *';
    cron.schedule(dailySummarySchedule, async () => {
        console.log('\n--- Daily Alert Summary ---');
        console.log(`Total alerts: ${alertManager.getAllAlerts().length}`);
        console.log(`Active alerts: ${alertManager.getActiveAlerts().length}`);
        
        await logger.info('Daily summary', {
            totalAlerts: alertManager.getAllAlerts().length,
            activeAlerts: alertManager.getActiveAlerts().length
        });
    });
    
    // Schedule weekly analysis report
    const weeklyReportSchedule = config.monitoring?.schedules?.weeklyReport || '0 9 * * 0';
    cron.schedule(weeklyReportSchedule, async () => {
        console.log('\n--- Weekly Analysis Report ---');
        const enabledCryptos = config.monitoring?.enabledCryptos || ['bitcoin', 'ethereum'];
        
        for (const crypto of enabledCryptos.slice(0, 3)) { // Limit to first 3 for the report
            await generateAnalysisReport(crypto);
        }
    });
    
    // Graceful shutdown handling
    process.on('SIGINT', async () => {
        await logger.logSystemStop();
        console.log('\nShutting down gracefully...');
        process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
        await logger.logSystemStop();
        console.log('\nReceived SIGTERM, shutting down...');
        process.exit(0);
    });
}

startMonitoring();