class PriceAlert {
    constructor(crypto, threshold, type, isActive = true) {
        this.id = Date.now() + Math.random();
        this.crypto = crypto;
        this.threshold = threshold;
        this.type = type; // 'above' or 'below'
        this.isActive = isActive;
        this.createdAt = new Date();
        this.triggeredAt = null;
    }

    checkAlert(currentPrice) {
        if (!this.isActive) return false;
        
        let shouldTrigger = false;
        
        if (this.type === 'above' && currentPrice >= this.threshold) {
            shouldTrigger = true;
        } else if (this.type === 'below' && currentPrice <= this.threshold) {
            shouldTrigger = true;
        }
        
        if (shouldTrigger) {
            this.triggeredAt = new Date();
            this.isActive = false;
            return true;
        }
        
        return false;
    }
    
    getAlertMessage(currentPrice) {
        const direction = this.type === 'above' ? 'above' : 'below';
        return `🚨 PRICE ALERT: ${this.crypto.toUpperCase()} is now $${currentPrice}, ${direction} your threshold of $${this.threshold}`;
    }
}

module.exports = PriceAlert;