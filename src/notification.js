const nodemailer = require('nodemailer');
require('dotenv').config();

class NotificationService {
    constructor() {
        this.transporter = null;
        this.setupEmailTransporter();
    }
    
    setupEmailTransporter() {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.log('Email credentials not configured, email notifications disabled');
            return;
        }
        
        this.transporter = nodemailer.createTransporter({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    }
    
    async sendEmailAlert(alert, currentPrice) {
        if (!this.transporter) {
            console.log('Email not configured, skipping email notification');
            return false;
        }
        
        const subject = `🚨 Crypto Alert: ${alert.crypto.toUpperCase()} Price Alert Triggered`;
        const text = alert.getAlertMessage(currentPrice);
        const html = `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: #ff6b35;">🚨 Crypto Price Alert</h2>
                <p><strong>Currency:</strong> ${alert.crypto.toUpperCase()}</p>
                <p><strong>Current Price:</strong> $${currentPrice}</p>
                <p><strong>Alert Type:</strong> ${alert.type} $${alert.threshold}</p>
                <p><strong>Triggered At:</strong> ${new Date().toLocaleString()}</p>
                <hr>
                <p style="color: #666;">This alert has been automatically disabled.</p>
            </div>
        `;
        
        try {
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: process.env.ALERT_EMAIL || process.env.EMAIL_USER,
                subject: subject,
                text: text,
                html: html
            };
            
            await this.transporter.sendMail(mailOptions);
            console.log('Email alert sent successfully');
            return true;
        } catch (error) {
            console.error('Failed to send email alert:', error.message);
            return false;
        }
    }
    
    async sendConsoleAlert(alert, currentPrice) {
        console.log('='.repeat(50));
        console.log(alert.getAlertMessage(currentPrice));
        console.log(`Triggered at: ${new Date().toLocaleString()}`);
        console.log('='.repeat(50));
        return true;
    }
}

module.exports = NotificationService;