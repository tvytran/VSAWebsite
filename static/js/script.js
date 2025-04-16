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
    
    console.log('VSA Events script loaded successfully');
});