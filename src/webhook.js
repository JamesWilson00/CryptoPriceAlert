const axios = require('axios');

class WebhookNotification {
    constructor() {
        this.webhookUrl = process.env.WEBHOOK_URL;
        this.discordWebhook = process.env.DISCORD_WEBHOOK_URL;
        this.slackWebhook = process.env.SLACK_WEBHOOK_URL;
    }
    
    async sendWebhookAlert(alert, currentPrice) {
        if (!this.webhookUrl) {
            console.log('No webhook URL configured');
            return false;
        }
        
        const payload = {
            type: 'price_alert',
            crypto: alert.crypto,
            symbol: alert.crypto.toUpperCase(),
            currentPrice: currentPrice,
            threshold: alert.threshold,
            alertType: alert.type,
            triggeredAt: new Date().toISOString(),
            message: alert.getAlertMessage(currentPrice)
        };
        
        try {
            const response = await axios.post(this.webhookUrl, payload, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });
            
            console.log('Webhook notification sent successfully');
            return true;
        } catch (error) {
            console.error('Failed to send webhook notification:', error.message);
            return false;
        }
    }
    
    async sendDiscordAlert(alert, currentPrice) {
        if (!this.discordWebhook) {
            return false;
        }
        
        const embed = {
            title: "🚨 Crypto Price Alert",
            color: alert.type === 'above' ? 0x00ff00 : 0xff0000,
            fields: [
                {
                    name: "Cryptocurrency",
                    value: alert.crypto.toUpperCase(),
                    inline: true
                },
                {
                    name: "Current Price",
                    value: `$${currentPrice}`,
                    inline: true
                },
                {
                    name: "Alert Threshold", 
                    value: `${alert.type} $${alert.threshold}`,
                    inline: true
                }
            ],
            timestamp: new Date().toISOString(),
            footer: {
                text: "CryptoPriceAlert Bot"
            }
        };
        
        try {
            await axios.post(this.discordWebhook, {
                embeds: [embed]
            });
            console.log('Discord notification sent');
            return true;
        } catch (error) {
            console.error('Failed to send Discord notification:', error.message);
            return false;
        }
    }
    
    async sendSlackAlert(alert, currentPrice) {
        if (!this.slackWebhook) {
            return false;
        }
        
        const color = alert.type === 'above' ? 'good' : 'danger';
        const message = {
            text: "Crypto Price Alert Triggered",
            attachments: [
                {
                    color: color,
                    fields: [
                        {
                            title: "Cryptocurrency",
                            value: alert.crypto.toUpperCase(),
                            short: true
                        },
                        {
                            title: "Current Price", 
                            value: `$${currentPrice}`,
                            short: true
                        },
                        {
                            title: "Alert Type",
                            value: `${alert.type} $${alert.threshold}`,
                            short: true
                        }
                    ],
                    ts: Math.floor(Date.now() / 1000)
                }
            ]
        };
        
        try {
            await axios.post(this.slackWebhook, message);
            console.log('Slack notification sent');
            return true;
        } catch (error) {
            console.error('Failed to send Slack notification:', error.message);
            return false;
        }
    }
    
    async sendAllWebhooks(alert, currentPrice) {
        const results = await Promise.allSettled([
            this.sendWebhookAlert(alert, currentPrice),
            this.sendDiscordAlert(alert, currentPrice),
            this.sendSlackAlert(alert, currentPrice)
        ]);
        
        const successCount = results.filter(result => 
            result.status === 'fulfilled' && result.value === true
        ).length;
        
        return successCount > 0;
    }
}

module.exports = WebhookNotification;