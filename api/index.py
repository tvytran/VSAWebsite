from flask import Flask, render_template, request, redirect, url_for, session, flash
import random
import os
from functools import wraps
from werkzeug.security import generate_password_hash, check_password_hash

# Create Flask app with correct paths for Vercel
app = Flask(__name__, 
            static_folder="../static",  
            template_folder="../templates")

# Set a secret key for session management
app.secret_key = os.environ.get("SECRET_KEY", "vsa_default_secret_key")

# Define your highlight_match function
def highlight_match(text, query):
    """Highlight occurrences of query in text with HTML span"""
    search_text = text.lower()
    query = query.lower()
    
    matches = []
    start_pos = 0
    # Find all occurrences of the query
    while True:
        pos = search_text.find(query, start_pos)
        if pos == -1:
            break
        matches.append((pos, pos + len(query)))
        start_pos = pos + 1
    
    # Highlight all matches
    result = []
    last_end = 0
    for start, end in sorted(matches):
        result.append(text[last_end:start])
        result.append(f'<span class="highlight">{text[start:end]}</span>')
        last_end = end
    
    # Add remaining part of the string
    result.append(text[last_end:])
    return ''.join(result)

# Copy your events dictionary and users dictionary here
events = {
    # Your events data...
}

users = {
    "admin": {
        "username": "admin",
        "email": "admin@example.com",
        "password": generate_password_hash("password123"),
        "is_admin": True
    }
}

# Copy all your route functions and decorators

# Make sure the app is properly exposed for Vercel
app.debug = False

# This is important for Vercel serverless function
index = app.wsgi_app