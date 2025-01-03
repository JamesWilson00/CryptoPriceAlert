const axios = require('axios');

console.log('Crypto Price Alert System Starting...');

async function getCryptoPrice(symbol) {
    try {
        const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${symbol}&vs_currencies=usd`);
        return response.data[symbol].usd;
    } catch (error) {
        console.error('Error fetching price:', error.message);
        return null;
    }
}

async function main() {
    console.log('Fetching Bitcoin price...');
    const btcPrice = await getCryptoPrice('bitcoin');
    
    if (btcPrice) {
        console.log(`Current BTC price: $${btcPrice}`);
    } else {
        console.log('Failed to fetch BTC price');
    }
}

main();