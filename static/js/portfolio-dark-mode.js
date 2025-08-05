// Portfolio Dark Mode Button Override
(function() {
    function applyPortfolioButtonStyles() {
        // Check if we're in dark mode based on localStorage (same as theme)
        const isLight = localStorage.getItem("isLight");
        const isDarkMode = (isLight === 'false');
        
        // Get all portfolio buttons
        const portfolioButtons = document.querySelectorAll('.portfolio-button');
        const portfolioExternalLinks = document.querySelectorAll('.portfolio-external-link');
        
        if (isDarkMode) {
            // Apply dark mode classes
            portfolioButtons.forEach(button => {
                button.classList.add('portfolio-button-dark-override');
            });
            portfolioExternalLinks.forEach(link => {
                link.classList.add('portfolio-external-link-dark-override');
            });
        } else {
            // Remove dark mode classes
            portfolioButtons.forEach(button => {
                button.classList.remove('portfolio-button-dark-override');
            });
            portfolioExternalLinks.forEach(link => {
                link.classList.remove('portfolio-external-link-dark-override');
            });
        }
    }
    
    // Apply styles on page load
    document.addEventListener('DOMContentLoaded', applyPortfolioButtonStyles);
    
    // Also apply immediately if DOM is already loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyPortfolioButtonStyles);
    } else {
        applyPortfolioButtonStyles();
    }
    
    // Monitor for theme changes by listening to localStorage changes
    window.addEventListener('storage', function(e) {
        if (e.key === 'isLight') {
            setTimeout(applyPortfolioButtonStyles, 100); // Small delay to ensure theme is applied
        }
    });
    
    // Also check periodically in case theme toggle happens on same page
    setInterval(applyPortfolioButtonStyles, 1000);
})();