const axios = require('axios');
const cron = require('node-cron');
const AlertManager = require('./alertManager');
const { getAllSupportedCryptos, formatCryptoName } = require('./cryptoList');
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
    
    const supportedCryptos = ['bitcoin', 'ethereum', 'cardano', 'solana', 'dogecoin'];
    
    for (const crypto of supportedCryptos) {
        const price = await getCryptoPrice(crypto);
        if (price) {
            console.log(`${formatCryptoName(crypto)}: $${price}`);
            await alertManager.checkAlerts(crypto, price);
            
            // Save price to history if storage is available
            if (alertManager.storage) {
                await alertManager.storage.savePriceHistory(crypto, price);
            }
        }
        
        // Small delay between API calls to be respectful
        await new Promise(resolve => setTimeout(resolve, 200));
    }
}

function startMonitoring() {
    console.log('Starting scheduled monitoring...');
    
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