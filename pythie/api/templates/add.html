{% extends "base.html" %}

{% block title %}Add New Event - VSA Events{% endblock %}

{% block content %}
<div class="row">
    <div class="col-12">
        <div class="card mb-3">
            <div class="card-header py-2 d-flex justify-content-between align-items-center">
                <h1 class="h4 mb-0">Add New VSA Event</h1>
                
                <!-- Success message (hidden by default) -->
                <div id="success-message" class="alert alert-success py-1 px-3 mb-0 d-none">
                    <div class="d-flex align-items-center">
                        <i class="bi bi-check-circle-fill me-2"></i>
                        <p class="mb-0">New event created. <a id="view-event-link" href="#" class="alert-link">See it here</a></p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<div class="row">
    <div class="col-md-6">
        <!-- First column of form fields -->
        <form id="add-event-form">
            <div class="row g-2">
                <div class="col-md-6">
                    <label for="title" class="form-label small mb-1">Event Title <span class="text-danger">*</span></label>
                    <input type="text" class="form-control form-control-sm" id="title" name="title" required>
                    <div class="invalid-feedback" id="title-error"></div>
                </div>
                
                <div class="col-md-6">
                    <label for="year" class="form-label small mb-1">Year <span class="text-danger">*</span></label>
                    <input type="number" class="form-control form-control-sm" id="year" name="year" required min="2023" max="2030" value="2025">
                    <div class="invalid-feedback" id="year-error"></div>
                </div>
            </div>
            
            <div class="row g-2 mt-2">
                <div class="col-md-6">
                    <label for="image" class="form-label small mb-1">Image Path <span class="text-danger">*</span></label>
                    <input type="text" class="form-control form-control-sm" id="image" name="image" required placeholder="/static/images/filename.jpg">
                    <div class="invalid-feedback" id="image-error"></div>
                </div>
                
                <div class="col-md-6">
                    <label for="location" class="form-label small mb-1">Location <span class="text-danger">*</span></label>
                    <input type="text" class="form-control form-control-sm" id="location" name="location" required placeholder="Hamilton 309, Lerner 555, etc.">
                    <div class="invalid-feedback" id="location-error"></div>
                </div>
            </div>
            
            <div class="row g-2 mt-2">
                <div class="col-12">
                    <label for="activities" class="form-label small mb-1">Popular Activities <span class="text-danger">*</span></label>
                    <input type="text" class="form-control form-control-sm" id="activities" name="activities" required placeholder="Cultural performances, Food tasting, Dancing, etc. (comma-separated)">
                    <div class="invalid-feedback" id="activities-error"></div>
                </div>
            </div>
    </div>
    
    <div class="col-md-6">
        <!-- Second column with remaining form fields -->
        <div class="row g-2">
            <div class="col-12">
                <label for="summary" class="form-label small mb-1">Event Summary <span class="text-danger">*</span></label>
                <textarea class="form-control form-control-sm" id="summary" name="summary" rows="5" required placeholder="Provide a detailed description of at least 20 words..." style="font-size: 0.9rem;"></textarea>
                <div class="invalid-feedback" id="summary-error"></div>
            </div>
        </div>
        
        <div class="d-grid mt-3">
            <button type="submit" class="btn btn-primary btn-sm">Create Event</button>
        </div>
        </form>
    </div>
</div>
{% endblock %}

{% block scripts %}
<script>
    $(document).ready(function() {
        // Store the last created event ID
        var lastCreatedEventId = null;
        
        // Focus on the first field when the page loads
        $('#title').focus();
        
        // Handle "See it here" link click
        $(document).on('click', '#view-event-link', function(e) {
            if (lastCreatedEventId) {
                window.location.href = '/view/' + lastCreatedEventId;
            }
            return false; // Prevent default behavior
        });
        
        // Handle form submission
        $('#add-event-form').submit(function(e) {
            e.preventDefault();
            
            // Reset validation styles
            $('.is-invalid').removeClass('is-invalid');
            
            // Gather form data
            var formData = new FormData(this);
            
            // Submit form via AJAX
            $.ajax({
                url: '/api/add_event',
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                success: function(response) {
                    if (response.success) {
                        // Store the event ID
                        lastCreatedEventId = response.id;
                        
                        // Show success message
                        $('#success-message').removeClass('d-none');
                        
                        // Update view link with proper URL
                        $('#view-event-link').attr('href', '/view/' + response.id);
                        
                        // Reset form
                        $('#add-event-form')[0].reset();
                        
                        // Focus on the first field
                        $('#title').focus();
                    } else {
                        // Display validation errors
                        if (response.errors) {
                            $.each(response.errors, function(field, message) {
                                if (field === 'general') {
                                    alert('Error: ' + message);
                                } else {
                                    $('#' + field).addClass('is-invalid');
                                    $('#' + field + '-error').text(message);
                                }
                            });
                            
                            // Focus on the first field with an error
                            $('.is-invalid:first').focus();
                        }
                    }
                },
                error: function() {
                    alert('An error occurred while submitting the form. Please try again.');
                }
            });
        });
    });
</script>
{% endblock %}