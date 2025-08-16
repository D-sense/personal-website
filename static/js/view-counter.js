/**
 * View Counter JavaScript
 * Handles view counting for blog posts using multiple methods
 */

class ViewCounter {
    constructor(elementId, pageUrl) {
        this.elementId = elementId;
        this.pageUrl = pageUrl;
        this.element = document.getElementById(elementId);
        this.textElement = this.element?.querySelector('.view-count-text');
        
        if (!this.element || !this.textElement) {
            console.warn('View counter element not found:', elementId);
            return;
        }
        
        this.init();
    }
    
    init() {
        // Try different methods in order of preference
        this.tryCounterAPI()
            .catch(() => this.tryLocalStorage())
            .catch(() => this.showFallback());
    }
    
    async tryCounterAPI() {
        const pageIdentifier = this.getPageIdentifier();
        
        // Method 1: Try visitor-badge API
        try {
            const response = await fetch(`https://api.countapi.xyz/hit/adeshinahassan.com${pageIdentifier}`);
            if (response.ok) {
                const data = await response.json();
                this.displayCount(data.value);
                return;
            }
        } catch (error) {
            console.log('CountAPI failed, trying alternative...');
        }
        
        // Method 2: Try alternative counter service
        try {
            const response = await fetch(`https://visitor-badge.laobi.icu/badge?page_id=adeshinahassan.com${pageIdentifier}&format=json`);
            if (response.ok) {
                const data = await response.json();
                if (data && data.count) {
                    this.displayCount(data.count);
                    return;
                }
            }
        } catch (error) {
            console.log('Visitor badge API failed');
        }
        
        throw new Error('All counter APIs failed');
    }
    
    tryLocalStorage() {
        // For localhost development and fallback
        if (this.isLocalhost()) {
            const storageKey = `view_count_${this.getPageIdentifier()}`;
            let count = parseInt(localStorage.getItem(storageKey) || '0');
            
            // Only increment if not already viewed in this session
            const sessionKey = `viewed_${this.getPageIdentifier()}`;
            if (!sessionStorage.getItem(sessionKey)) {
                count++;
                localStorage.setItem(storageKey, count.toString());
                sessionStorage.setItem(sessionKey, 'true');
            }
            
            this.displayCount(count, '(local)');
            return Promise.resolve();
        }
        
        return Promise.reject('Not localhost');
    }
    
    showFallback() {
        this.textElement.innerHTML = '<span class="view-count-error">Views tracked</span>';
    }
    
    displayCount(count, suffix = '') {
        const formattedCount = this.formatNumber(count);
        this.textElement.innerHTML = `<span class="view-count-loaded">${formattedCount} views${suffix ? ' ' + suffix : ''}</span>`;
        
        // Add a subtle animation
        this.element.style.transform = 'scale(1.05)';
        setTimeout(() => {
            this.element.style.transform = 'scale(1)';
        }, 200);
    }
    
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }
    
    getPageIdentifier() {
        return encodeURIComponent(this.pageUrl.replace(/https?:\/\/[^\/]+/, ''));
    }
    
    isLocalhost() {
        return window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1' ||
               window.location.hostname === '';
    }
}

// Enhanced Google Analytics integration
class GAViewCounter extends ViewCounter {
    constructor(elementId, pageUrl) {
        super(elementId, pageUrl);
        this.gaAvailable = typeof gtag !== 'undefined';
    }
    
    async tryCounterAPI() {
        // If Google Analytics is available, try to get real data first
        if (this.gaAvailable && !this.isLocalhost()) {
            try {
                await this.tryGoogleAnalytics();
                return;
            } catch (error) {
                console.log('GA method failed, falling back to counter APIs');
            }
        }
        
        // Fall back to parent method
        return super.tryCounterAPI();
    }
    
    async tryGoogleAnalytics() {
        // This would require Google Analytics Reporting API setup
        // For now, we'll use a simulated approach
        
        // Send a page view event to GA4
        if (this.gaAvailable) {
            gtag('event', 'page_view', {
                page_title: document.title,
                page_location: this.pageUrl
            });
        }
        
        // For actual implementation, you would need:
        // 1. Google Analytics Reporting API credentials
        // 2. A backend service to query GA data
        // 3. CORS-enabled endpoint to fetch view counts
        
        throw new Error('GA Reporting API not implemented');
    }
}

// Auto-initialize view counters when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    const viewCounters = document.querySelectorAll('.view-count-badge');
    
    viewCounters.forEach(element => {
        const textElement = element.querySelector('.view-count-text');
        const pageUrl = textElement?.getAttribute('data-page-url');
        
        if (pageUrl) {
            new GAViewCounter(element.id, pageUrl);
        }
    });
});

// Export for manual initialization if needed
window.ViewCounter = ViewCounter;
window.GAViewCounter = GAViewCounter;
