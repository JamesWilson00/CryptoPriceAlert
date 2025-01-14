const SUPPORTED_CRYPTOS = {
    bitcoin: {
        id: 'bitcoin',
        symbol: 'BTC',
        name: 'Bitcoin',
        emoji: '₿'
    },
    ethereum: {
        id: 'ethereum', 
        symbol: 'ETH',
        name: 'Ethereum',
        emoji: '♦️'
    },
    cardano: {
        id: 'cardano',
        symbol: 'ADA', 
        name: 'Cardano',
        emoji: '🔷'
    },
    solana: {
        id: 'solana',
        symbol: 'SOL',
        name: 'Solana', 
        emoji: '☀️'
    },
    dogecoin: {
        id: 'dogecoin',
        symbol: 'DOGE',
        name: 'Dogecoin',
        emoji: '🐕'
    },
    'binance-coin': {
        id: 'binance-coin',
        symbol: 'BNB',
        name: 'BNB',
        emoji: '🟡'
    },
    polkadot: {
        id: 'polkadot',
        symbol: 'DOT',
        name: 'Polkadot',
        emoji: '🔴'
    }
};

function getSupportedCrypto(id) {
    return SUPPORTED_CRYPTOS[id.toLowerCase()] || null;
}

function getAllSupportedCryptos() {
    return Object.values(SUPPORTED_CRYPTOS);
}

function isValidCrypto(id) {
    return id.toLowerCase() in SUPPORTED_CRYPTOS;
}

function formatCryptoName(id) {
    const crypto = getSupportedCrypto(id);
    return crypto ? `${crypto.emoji} ${crypto.name} (${crypto.symbol})` : id.toUpperCase();
}

module.exports = {
    SUPPORTED_CRYPTOS,
    getSupportedCrypto,
    getAllSupportedCryptos, 
    isValidCrypto,
    formatCryptoName
};