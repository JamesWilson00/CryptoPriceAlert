const axios = require('axios');
const cron = require('node-cron');
const AlertManager = require('./alertManager');
require('dotenv').config();

console.log('Crypto Price Alert System Starting...');

const alertManager = new AlertManager();

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
    console.log('Checking crypto prices...');
    
    // Bitcoin
    const btcPrice = await getCryptoPrice('bitcoin');
    if (btcPrice) {
        console.log(`Current BTC price: $${btcPrice}`);
        await alertManager.checkAlerts('bitcoin', btcPrice);
    }
    
    // Ethereum  
    const ethPrice = await getCryptoPrice('ethereum');
    if (ethPrice) {
        console.log(`Current ETH price: $${ethPrice}`);
        await alertManager.checkAlerts('ethereum', ethPrice);
    }
}

function startMonitoring() {
    console.log('Starting scheduled monitoring...');
    
    // Add some sample alerts
    alertManager.addAlert('bitcoin', 45000, 'above');
    alertManager.addAlert('bitcoin', 35000, 'below');
    alertManager.addAlert('ethereum', 3000, 'above');
    
    console.log(`Active alerts: ${alertManager.getActiveAlerts().length}`);
    
    // Run immediately
    checkPrices();
    
    // Schedule price checks every 5 minutes
    cron.schedule('*/5 * * * *', () => {
        console.log('\n--- Scheduled price check ---');
        checkPrices();
    });
    
    // Schedule daily summary at 9 AM
    cron.schedule('0 9 * * *', () => {
        console.log('\n--- Daily Alert Summary ---');
        console.log(`Total alerts: ${alertManager.getAllAlerts().length}`);
        console.log(`Active alerts: ${alertManager.getActiveAlerts().length}`);
    });
}

startMonitoring();