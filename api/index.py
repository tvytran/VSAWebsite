from flask import Flask, render_template, request, redirect, url_for, session, flash
import random
import os
from functools import wraps
from werkzeug.security import generate_password_hash, check_password_hash

# Import your logic from server.py
# You can either copy the content or refactor to make server.py importable

app = Flask(__name__, 
            static_folder="../static",  # Point to the static folder in root directory
            template_folder="../templates")  # Point to the templates folder in root directory

# Set a secret key for session management
app.secret_key = os.environ.get("SECRET_KEY", os.urandom(24))

# Include your highlight_match function
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

# Copy your events dictionary and all route functions from server.py
# ...

# For Vercel deployment
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)

# Handler for Vercel serverless function
def handler(event, context):
    return app