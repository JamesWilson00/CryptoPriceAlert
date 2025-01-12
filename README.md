# Crypto Price Alert

A cryptocurrency price monitoring and alert system built with Node.js that tracks prices and sends notifications when thresholds are met.

## Features

- 📊 Monitor Bitcoin and Ethereum prices in real-time
- 🚨 Set custom price alerts (above/below thresholds)  
- 📧 Email notifications when alerts trigger
- ⏰ Automated scheduled price monitoring
- 💾 Persistent data storage for alerts and price history
- 🖥️ Interactive command-line interface
- 📈 Price history tracking

## Installation

```bash
git clone https://github.com/yourusername/crypto-price-alert.git
cd crypto-price-alert
npm install
```

## Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Configure your settings in `.env`:
   ```
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   ALERT_EMAIL=alerts@yourdomain.com
   COINGECKO_API_KEY=your-api-key-here
   CHECK_INTERVAL=300000
   DEFAULT_CURRENCY=usd
   ```

## Usage

### Automatic Monitoring
Start the automated monitoring service:
```bash
npm start
```

This will:
- Check prices every 5 minutes
- Trigger alerts when thresholds are met  
- Send email notifications
- Display daily summaries at 9 AM

### Interactive CLI
Use the command-line interface to manage alerts:
```bash
npm run cli
```

Available commands:
- `add` - Create new price alert
- `list` - View all configured alerts  
- `remove` - Delete an alert
- `check` - Check current prices manually
- `history` - View price history
- `help` - Show available commands
- `exit` - Save and quit

### Development Mode
Run with auto-reload during development:
```bash
npm run dev
```

## Alert Types

- **Above**: Trigger when price goes above threshold
- **Below**: Trigger when price goes below threshold

## Supported Cryptocurrencies

- Bitcoin (BTC) - Use `bitcoin` as symbol
- Ethereum (ETH) - Use `ethereum` as symbol

## Email Setup

For Gmail integration:
1. Enable 2-factor authentication
2. Generate an app-specific password
3. Use your email and app password in `.env`

## Data Storage

- Alerts are saved to `data/alerts.json`
- Price history saved to `data/price_history.json`  
- Data files are automatically created on first run

## License

MIT