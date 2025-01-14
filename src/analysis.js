class PriceAnalyzer {
    constructor(storage) {
        this.storage = storage;
    }
    
    async calculateMovingAverage(crypto, periods = 20) {
        const history = await this.storage.getPriceHistory(crypto, periods);
        
        if (history.length < periods) {
            return null;
        }
        
        const sum = history.reduce((total, record) => total + record.price, 0);
        return sum / history.length;
    }
    
    async calculatePriceChange(crypto, hours = 24) {
        const history = await this.storage.getPriceHistory(crypto, 1000);
        
        if (history.length < 2) {
            return null;
        }
        
        const now = new Date();
        const targetTime = new Date(now.getTime() - (hours * 60 * 60 * 1000));
        
        // Find the closest record to target time
        const oldRecord = this.findClosestRecord(history, targetTime);
        const currentRecord = history[history.length - 1];
        
        if (!oldRecord || !currentRecord) {
            return null;
        }
        
        const priceDiff = currentRecord.price - oldRecord.price;
        const percentChange = (priceDiff / oldRecord.price) * 100;
        
        return {
            oldPrice: oldRecord.price,
            newPrice: currentRecord.price,
            priceChange: priceDiff,
            percentChange: percentChange,
            timeSpan: `${hours}h`
        };
    }
    
    findClosestRecord(history, targetTime) {
        let closest = null;
        let minDiff = Infinity;
        
        for (const record of history) {
            const recordTime = new Date(record.timestamp);
            const diff = Math.abs(recordTime.getTime() - targetTime.getTime());
            
            if (diff < minDiff) {
                minDiff = diff;
                closest = record;
            }
        }
        
        return closest;
    }
    
    async detectPriceTrend(crypto, periods = 10) {
        const history = await this.storage.getPriceHistory(crypto, periods);
        
        if (history.length < 3) {
            return 'insufficient_data';
        }
        
        let upCount = 0;
        let downCount = 0;
        
        for (let i = 1; i < history.length; i++) {
            if (history[i].price > history[i-1].price) {
                upCount++;
            } else if (history[i].price < history[i-1].price) {
                downCount++;
            }
        }
        
        const upRatio = upCount / (history.length - 1);
        
        if (upRatio > 0.6) {
            return 'bullish';
        } else if (upRatio < 0.4) {
            return 'bearish';
        } else {
            return 'sideways';
        }
    }
    
    async calculateVolatility(crypto, periods = 20) {
        const history = await this.storage.getPriceHistory(crypto, periods);
        
        if (history.length < 2) {
            return null;
        }
        
        const prices = history.map(record => record.price);
        const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
        
        const variance = prices.reduce((sum, price) => {
            return sum + Math.pow(price - mean, 2);
        }, 0) / prices.length;
        
        const stdDev = Math.sqrt(variance);
        const coefficient = (stdDev / mean) * 100;
        
        return {
            standardDeviation: stdDev,
            coefficientOfVariation: coefficient,
            volatilityLevel: this.getVolatilityLevel(coefficient)
        };
    }
    
    getVolatilityLevel(coefficient) {
        if (coefficient < 5) return 'low';
        if (coefficient < 15) return 'moderate';
        if (coefficient < 30) return 'high';
        return 'extreme';
    }
    
    async generateAnalysisReport(crypto) {
        try {
            const [
                movingAvg20,
                change24h,
                change7d,
                trend,
                volatility
            ] = await Promise.all([
                this.calculateMovingAverage(crypto, 20),
                this.calculatePriceChange(crypto, 24),
                this.calculatePriceChange(crypto, 168), // 7 days
                this.detectPriceTrend(crypto),
                this.calculateVolatility(crypto)
            ]);
            
            const history = await this.storage.getPriceHistory(crypto, 1);
            const currentPrice = history.length > 0 ? history[0].price : null;
            
            return {
                crypto: crypto,
                currentPrice: currentPrice,
                movingAverage20: movingAvg20,
                priceChange24h: change24h,
                priceChange7d: change7d,
                trend: trend,
                volatility: volatility,
                generatedAt: new Date().toISOString()
            };
        } catch (error) {
            console.error(`Error generating analysis for ${crypto}:`, error.message);
            return null;
        }
    }
    
    formatAnalysisReport(analysis) {
        if (!analysis) {
            return 'Analysis not available';
        }
        
        let report = `\n📊 Analysis Report for ${analysis.crypto.toUpperCase()}\n`;
        report += '='.repeat(40) + '\n';
        
        if (analysis.currentPrice) {
            report += `💰 Current Price: $${analysis.currentPrice.toFixed(2)}\n`;
        }
        
        if (analysis.movingAverage20) {
            report += `📈 20-period MA: $${analysis.movingAverage20.toFixed(2)}\n`;
        }
        
        if (analysis.priceChange24h) {
            const change = analysis.priceChange24h;
            const emoji = change.percentChange >= 0 ? '📈' : '📉';
            report += `${emoji} 24h Change: ${change.percentChange.toFixed(2)}% ($${change.priceChange.toFixed(2)})\n`;
        }
        
        if (analysis.priceChange7d) {
            const change = analysis.priceChange7d;
            const emoji = change.percentChange >= 0 ? '📈' : '📉';
            report += `${emoji} 7d Change: ${change.percentChange.toFixed(2)}% ($${change.priceChange.toFixed(2)})\n`;
        }
        
        if (analysis.trend) {
            const trendEmoji = {
                'bullish': '🚀',
                'bearish': '📉',
                'sideways': '↔️',
                'insufficient_data': '❓'
            };
            report += `${trendEmoji[analysis.trend]} Trend: ${analysis.trend}\n`;
        }
        
        if (analysis.volatility) {
            const vol = analysis.volatility;
            const volEmoji = {
                'low': '🟢',
                'moderate': '🟡', 
                'high': '🟠',
                'extreme': '🔴'
            };
            report += `${volEmoji[vol.volatilityLevel]} Volatility: ${vol.volatilityLevel} (${vol.coefficientOfVariation.toFixed(2)}%)\n`;
        }
        
        report += `\n⏰ Generated: ${new Date(analysis.generatedAt).toLocaleString()}\n`;
        
        return report;
    }
}

module.exports = PriceAnalyzer;