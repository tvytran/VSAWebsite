$(document).ready(function() {
    // Handle search form submission
    $('form').submit(function(e) {
        const query = $('input[name="query"]').val().trim();
        
        // If query is only whitespace, prevent submission
        if (!query) {
            e.preventDefault();
            $('input[name="query"]').val('').focus();
        }
    });
    
    // Add hover effects to cards
    $('.card').hover(
        function() {
            $(this).addClass('shadow-lg');
        },
        function() {
            $(this).removeClass('shadow-lg');
        }
    );
    
    // Smooth scroll for anchor links
    $('a[href^="#"]').on('click', function(e) {
        e.preventDefault();
        
        $('html, body').animate({
            scrollTop: $($(this).attr('href')).offset().top - 70
        }, 500, 'linear');
    });
    
    // Initialize tooltips if Bootstrap is loaded
    if (typeof bootstrap !== 'undefined') {
        var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
    
    // Add animation to popular badges
    $('.popular-badge').each(function() {
        $(this).addClass('animate__animated animate__pulse');
    });
    
    // Add event listeners for card clicks (alternative to anchor tags)
    $('.event-card').on('click', function() {
        const eventId = $(this).data('id');
        if (eventId) {
            window.location.href = '/view/' + eventId;
        }
    });
    
    // ===== FIX FOR EMPTY SPACE ISSUE =====
    // Function to find and fix empty space issues
    function fixEmptySpaces() {
        // Look for main container elements
        const containers = document.querySelectorAll('.container, .container-fluid, main, #content');
        
        containers.forEach(container => {
            // Remove fixed height properties
            container.style.height = 'auto';
            container.style.minHeight = 'auto';
            
            // Check all direct children for empty divs
            Array.from(container.children).forEach(child => {
                // Check if this is an empty div taking up space
                if (child.children.length === 0 && 
                    child.textContent.trim() === '' && 
                    !child.hasAttribute('id') &&
                    getComputedStyle(child).height !== '0px') {
                    
                    // Hide empty divs
                    child.style.display = 'none';
                }
                
                // Reduce margins on all children
                child.style.marginBottom = '0';
            });
        });
        
        // Fix for footers
        const footers = document.querySelectorAll('footer');
        footers.forEach(footer => {
            footer.style.marginTop = '0';
            
            // If footer has position absolute/fixed, adjust it
            const footerStyle = getComputedStyle(footer);
            if (footerStyle.position === 'absolute' || footerStyle.position === 'fixed') {
                // Get the last content element
                const lastContent = document.querySelector('.container:last-of-type');
                if (lastContent) {
                    const rect = lastContent.getBoundingClientRect();
                    footer.style.top = (rect.bottom + window.scrollY) + 'px';
                    footer.style.position = 'absolute';
                }
            }
        });
        
        // Look for any elements with large fixed heights
        document.querySelectorAll('*').forEach(el => {
            const style = getComputedStyle(el);
            const height = parseFloat(style.height);
            const isEmpty = el.children.length === 0 && el.textContent.trim() === '';
            
            // If it's an empty element with significant height, minimize it
            if (isEmpty && height > 100 && !el.hasAttribute('id')) {
                el.style.height = 'auto';
                el.style.minHeight = 'auto';
                el.style.maxHeight = 'none';
            }
        });

        // Special fix for the row elements
        $('.row').css('margin-bottom', '0');
    }
    
    // Run the fix after a slight delay to ensure all elements are rendered
    setTimeout(fixEmptySpaces, 200);
    
    // Also run it on window resize
    $(window).on('resize', fixEmptySpaces);
    
    console.log('VSA Events script loaded successfully');
});