from flask import Flask, render_template, request, redirect, url_for
import random

app = Flask(__name__, 
            static_folder="static",  # Just use the default "static" folder
            static_url_path='/static')  # And this

# VSA Events dataset with added location data
events = {
    "1": {
        "id": "1",
        "title": "Paint and Sip",
        "image": "/static/images/paint.png",
        "year": "2025",
        "location": "Hamilton 309",
        "summary": "The Vietnamese Student Association proudly presents its Paint and Sip event, a vibrant gathering where creativity meets cultural appreciation. Attendees will enjoy a guided painting session featuring Vietnamese-inspired landscapes or cultural symbols, accompanied by bubble tea and traditional snacks. This event offers students a chance to unwind, socialize, and connect with Vietnamese art in a relaxed atmosphere. All skill levels are welcome, and all materials will be provided for participants.",
        "popular_activities": ["Guided painting", "Tasting", "Community bonding", "Photo booth"]
    },
    "2": {
        "id": "2",
        "title": "Valentine's Day Table",
        "image": "/static/images/valentine.png",
        "year": "2025",
        "location": "Lerner Ramps Table 4",
        "summary": "The Vietnamese Student Association welcomes you to our Valentine's Day tabling event! Stop by our beautifully decorated booth to experience the intersection of Vietnamese culture and the celebration of love. Write love letters using Vietnamese calligraphy, enjoy heart-shaped bánh cookies, and learn about how Valentine's Day is celebrated in Vietnam compared to Western traditions. This interactive event provides a perfect opportunity to learn about cultural expressions of love while enjoying sweet treats and making personalized valentines.",
        "popular_activities": ["Vietnamese calligraphy", "Community bonding", "Heart-shaped bánh cookies", "Photo booth"]
    },
    "3": {
        "id": "3",
        "title": "Tet Celebration",
        "image": "/static/images/tet.png",
        "year": "2025",
        "location": "Lerner 555",
        "summary": "Join us for a vibrant celebration of Tet, the Vietnamese Lunar New Year! Our special event features enchanting musical performances from three talented artists of the Vietnamese Creative Society who will showcase traditional and contemporary Vietnamese songs. Immerse yourself in cultural displays including traditional dress (áo dài), lion dances, and festive decorations that symbolize prosperity and good fortune. Guests will enjoy authentic Vietnamese cuisine and participate in cultural activities like red envelope exchanges and traditional games.",
        "popular_activities": ["Musical performances", "Lion dance", "Tasting", "Games", "Red envelope exchange"]
    },
    "4": {
        "id": "4",
        "title": "Study Hall",
        "image": "/static/images/study.png",
        "year": "2025",
        "location": "Lerner Satow",
        "summary": "Join the Vietnamese Student Association for our Study Hall event, where productivity meets community! This dedicated study session offers a supportive environment for students to focus on academics while connecting with peers. Fuel your study session with complimentary Vietnamese coffee and snacks that provide the perfect brain boost. Our Study Hall features designated quiet zones, group work areas, and study resources to accommodate different learning styles. VSA officers will be available to provide academic support and facilitate connections between students studying similar subjects.",
        "popular_activities": ["Quiet study areas", "Group work spaces", "Snack bar", "Tutoring resources"]
    },
    "5": {
        "id": "5",
        "title": "Poetry Night",
        "image": "/static/images/poetry.png",
        "year": "2024",
        "location": "403 Kent Hall",
        "summary": "Join us for an enchanting evening at the Vietnamese Student Association's Poetry Night, where words and emotions come alive in a celebration of creative expression. Experience powerful performances featuring both Vietnamese and English poetry that explores themes of identity, diaspora, heritage, and personal journeys. Our welcoming atmosphere encourages all attendees to share their original work during our open mic session, creating a space for diverse voices. The event features ambient music, atmospheric decorations, and Vietnamese tea service that enhances the immersive artistic experience.",
        "popular_activities": ["Bilingual poetry readings", "Open mic session", "Community bonding", "Literary discussions"]
    },
    "6": {
        "id": "6",
        "title": "Game Night",
        "image": "/static/images/game.png",
        "year": "2024",
        "location": "Hamilton 309",
        "summary": "Join the Vietnamese Student Association for an exciting Game Night filled with fun, laughter, and friendly competition! Experience a diverse selection of games including traditional Vietnamese games like Ô ăn quan and Cờ tướng (Vietnamese chess), alongside popular board games and video game tournaments. Our game stations cater to both competitive players and those seeking casual entertainment in a social setting. Throughout the night, enjoy Vietnamese snacks and refreshments that fuel the gaming experience while creating a festive atmosphere for making new friends.",
        "popular_activities": ["Traditional Vietnamese games", "Board game competitions", "Game", "Snack bar"]
    },
    "7": {
        "id": "7",
        "title": "Field Day",
        "image": "/static/images/field.png",
        "year": "2024",
        "location": "Riverside Park",
        "summary": "Join the Vietnamese Student Association for our action-packed Field Day event! Participate in a variety of outdoor activities and sports including Vietnamese shuttlecock kicking (đá cầu), relay races, tug-of-war, and volleyball matches designed for all skill levels. Our event promotes physical activity, teamwork, and healthy competition in a welcoming environment. Participants can enjoy refreshing Vietnamese beverages like sugarcane juice and coconut water to stay hydrated throughout the day of outdoor fun and community building.",
        "popular_activities": ["Đá cầu (shuttlecock kicking)", "Relay races", "Volleyball matches","Games","Community bonding"]
    },
    "8": {
        "id": "8",
        "title": "Night Market",
        "image": "/static/images/market.png",
        "year": "2023",
        "location": "Low Plaza",
        "summary": "Experience the vibrant sights, sounds, and flavors of Vietnam at the VSA Night Market! Our indoor market recreates the bustling atmosphere of Vietnamese night markets with colorful lanterns, aromatic food stalls, and lively music. Explore vendor booths featuring student entrepreneurs selling crafts, art, and goods inspired by Vietnamese culture. Sample a diverse selection of authentic Vietnamese street foods prepared by VSA members and local restaurants. Cultural demonstrations throughout the evening showcase traditional crafts and performing arts for an immersive experience.",
        "popular_activities": ["Street food sampling", "Tasting", "Vendor shopping", "Lantern making"]
    },
    "9": {
        "id": "9",
        "title": "ACE Reveal Party",
        "image": "/static/images/mixer.jpg",
        "year": "2023",
        "location": "East Campus",
        "summary": "Join us for the highly anticipated Anh Chi Em (ACE) Family Reveal Party hosted by the Vietnamese Student Association! This special ceremony pairs new VSA members with upperclassmen mentors in our unique family system that provides guidance, friendship, and support throughout the academic year. Experience the excitement as new members discover their ACE families through creative and surprising reveal activities designed to create meaningful connections. The celebration features team-building games, a shared Vietnamese meal, and family photo sessions to commemorate the beginning of these important relationships.",
        "popular_activities": ["Family reveal ceremony", "Games", "Photo booth", "Vietnamese banquet","Community bonding"]
    },
    "10": {
        "id": "10",
        "title": "Mid Autumn Festival",
        "image": "/static/images/picnic.png",
        "year": "2023",
        "location": "Math Lawn",
        "summary": "Join us for the Vietnamese Student Association's Mid-Autumn Festival! Celebrate this important cultural holiday with traditional performances, lantern making, and mooncake tasting. Learn about the mythology and significance behind this harvest festival through interactive displays and storytelling sessions. Children from local Vietnamese-American families will perform traditional dances and songs, creating an authentic community celebration. Participants will create their own paper lanterns, enjoy tea ceremonies, and sample various types of mooncakes in this family-friendly cultural event.",
        "popular_activities": ["Lantern making", "Mooncake tasting", "Traditional performances", "Community bonding"]
    },
    "11": {
        "id": "11",
        "title": "Che Social",
        "image": "/static/images/che.jpg",
        "year": "2025",
        "location": "Lerner East Ramp Lounge",
        "summary": "Join the Vietnamese Student Association for our Chè Social, a cultural gathering celebrating Vietnam's sweet treats! Enjoy two classic desserts: chè Thai, a tropical blend of fruits, jellies, and coconut milk, and chè ba màu (three-color dessert) with sweet beans, jellies, and coconut cream. This casual event offers more than just delicious desserts—it's a chance to connect with fellow VSA members, learn about the cultural significance of these sweets, and enjoy relaxed conversation. Whether you're a fan of Vietnamese desserts or trying chè for the first time, this event is a sweet way to experience Vietnamese culinary culture!",
        "popular_activities": ["Tasting", "Cultural discussions", "Community bonding", "Dessert demonstrations"]
    },
    "12": {
        "id": "12",
        "title": "Food Panel with Bánh by Lauren",
        "image": "/static/images/banh.jpg",
        "year": "2025",
        "location": "Hamilton 602",
        "summary": "Join the Vietnamese Student Association for our exclusive Food Panel featuring \"Bánh by Lauren\"! Meet Lauren, the owner of the Vietnamese-inspired bakery, and learn about her journey, inspirations, challenges, and the cultural influences behind her creations during a Q&A session. The evening will also feature a tasting of Lauren's signature desserts, offering a modern twist on traditional Vietnamese bánh. Whether you're passionate about Vietnamese cuisine, food entrepreneurship, or love exceptional desserts, this interactive panel is the perfect blend of cultural exploration and culinary delight. Don't miss this chance to meet a local food creator!",
        "popular_activities": ["Q&A with Lauren", "Tasting", "Entrepreneurship discussion", "Dessert demonstrations"]
    },
    "13": {
        "id": "13",
        "title": "SEA Formal",
        "image": "/static/images/formal.png",
        "year": "2025",
        "location": "Roone Arledge Auditorium",
        "summary": "Join us for the Southeast Asian Formal, a celebration uniting Vietnamese, Thai, Filipino, Malaysian, Indonesian, and other Southeast Asian student associations. Enjoy exquisite cuisine, traditional and contemporary performances, and dancing into the night. Guests are encouraged to wear formal attire or cultural dress to honor our heritage and community bonds. With photo opportunities, curated music, and a joyful atmosphere, this elegant event is the perfect setting to make new friends and celebrate the beauty of Southeast Asian cultures. Don't miss this unforgettable night of cultural pride and tradition!",
        "popular_activities": ["Cultural performances", "Southeast Asian cuisine", "Dancing", "Traditional dress showcase", "Community bonding"]
    }
}

# Helper function to highlight matches with bold text
def highlight_match(text, query):
    """Highlight a query match in text with strong emphasis."""
    text_lower = text.lower()
    query_lower = query.lower()
    
    if query_lower not in text_lower:
        return text
    
    start = text_lower.find(query_lower)
    # Create emphasized and bold version for matched text
    highlighted = (
        text[:start] + 
        f'<span class="highlight"><strong>{text[start:start+len(query)]}</strong></span>' + 
        text[start+len(query):]
    )
    
    return highlighted

# Routes
@app.route('/')
def home():
    # Home page displaying popular events
    return render_template('home.html', events=events)

@app.route('/search')
def search():
    query = request.args.get('query', '').strip().lower()
    
    # Handle empty or whitespace-only searches
    if not query:
        return render_template('search.html', results=None, query='', count=0)
    
    # Search for events containing the query in their title, summary, popular_activities, location, or year
    results = {}
    for event_id, event in events.items():
        # Check if query is in title (case insensitive)
        title_match = query in event['title'].lower()
        
        # Check if query is in summary (case insensitive)
        summary_match = query in event['summary'].lower()
        
        # Check if query is in any popular activities (case insensitive)
        # Also track which activities matched for highlighting
        activities_match = False
        matched_activities = []
        
        for activity in event['popular_activities']:
            if query in activity.lower():
                activities_match = True
                # Create highlighted version with bold emphasis
                highlighted = highlight_match(activity, query)
                matched_activities.append((activity, highlighted))
            else:
                matched_activities.append((activity, activity))
        
        # Check if query is in location (case insensitive)
        location_match = query in event['location'].lower()
        
        # Check if query is in year
        year_match = query in event['year']
        
        # Add to results if any match is found
        if title_match or summary_match or activities_match or location_match or year_match:
            # Create a copy of the event with highlighted matches
            event_copy = event.copy()
            
            # Highlight matches in title
            if title_match:
                event_copy['highlighted_title'] = highlight_match(event['title'], query)
            else:
                event_copy['highlighted_title'] = event['title']
            
            # Add activities with highlighting
            event_copy['highlighted_activities'] = matched_activities
            
            # Add year information with highlighting if it matches
            if year_match:
                event_copy['highlighted_year'] = f'<span class="highlight"><strong>{event["year"]}</strong></span>'
            else:
                event_copy['highlighted_year'] = event['year']
            
            # Add to results
            results[event_id] = event_copy
    
    return render_template('search.html', results=results, query=query, count=len(results))

# Search by year route
@app.route('/search/year/<year>')
def search_by_year(year):
    # Search for events from the specified year
    results = {}
    for event_id, event in events.items():
        if event['year'] == year:
            # Add to results
            results[event_id] = event.copy()
            results[event_id]['highlighted_title'] = event['title']
            results[event_id]['highlighted_year'] = f'<span class="highlight"><strong>{year}</strong></span>'
    
    return render_template('search.html', 
                          results=results, 
                          query=f'Year: {year}', 
                          count=len(results))

@app.route('/search/activity/<activity>')
def search_by_activity(activity):
    # Search for events containing the activity
    results = {}
    for event_id, event in events.items():
        # Check if this activity is in the event's popular activities (case insensitive)
        activity_found = False
        matched_activities = []
        
        for event_activity in event['popular_activities']:
            if activity.lower() in event_activity.lower():
                activity_found = True
                # Create highlighted version with bold emphasis
                highlighted = highlight_match(event_activity, activity)
                matched_activities.append((event_activity, highlighted))
            else:
                matched_activities.append((event_activity, event_activity))
        
        if activity_found:
            # Add to results
            event_copy = event.copy()
            event_copy['highlighted_title'] = event['title']
            event_copy['highlighted_activities'] = matched_activities
            results[event_id] = event_copy
    
    return render_template('search.html', 
                          results=results, 
                          query=f'Activity: {activity}', 
                          count=len(results))

@app.route('/add', methods=['GET', 'POST'])
def add():
    # This route is only accessible from the navbar
    return render_template('add.html')

@app.route('/api/add_event', methods=['POST'])
def add_event():
    # Get data from form submission
    try:
        # Extract form data
        title = request.form.get('title', '').strip()
        image = request.form.get('image', '').strip()
        year = request.form.get('year', '').strip()
        location = request.form.get('location', '').strip()
        summary = request.form.get('summary', '').strip()
        activities = request.form.get('activities', '').strip()
        
        # Validate data
        errors = {}
        if not title:
            errors['title'] = 'Title cannot be empty'
        if not image:
            errors['image'] = 'Image URL cannot be empty'
        if not year:
            errors['year'] = 'Year cannot be empty'
        elif not year.isdigit():
            errors['year'] = 'Year must be a number'
        if not location:
            errors['location'] = 'Location cannot be empty'
        if not summary:
            errors['summary'] = 'Summary cannot be empty'
        elif len(summary.split()) < 20:
            errors['summary'] = 'Summary must be at least 20 words'
        if not activities:
            errors['activities'] = 'Activities cannot be empty'
        
        if errors:
            return {'success': False, 'errors': errors}
        
        # Generate new ID for the event
        new_id = str(max(int(id) for id in events.keys()) + 1)
        
        # Split activities by commas
        activities_list = [activity.strip() for activity in activities.split(',')]
        
        # Create a new event
        new_event = {
            'id': new_id,
            'title': title,
            'image': image,
            'year': year,
            'location': location,
            'summary': summary,
            'popular_activities': activities_list
        }
        
        # Add the new event to the events dictionary
        events[new_id] = new_event
        
        return {'success': True, 'id': new_id, 'title': title}
    
    except Exception as e:
        return {'success': False, 'errors': {'general': str(e)}}

@app.route('/view/<event_id>')
def view(event_id):
    # Get the event details
    event = events.get(event_id)
    
    if event:
        # Find related events (same year or similar activities)
        related_events = []
        
        for related_id, related_event in events.items():
            # Don't include the current event
            if related_id == event_id:
                continue
                
            # Check if years match
            if related_event['year'] == event['year']:
                related_events.append(related_event)
                continue
                
            # Check if they share any activities
            if any(activity in event['popular_activities'] for activity in related_event['popular_activities']):
                related_events.append(related_event)
                
        # Limit to 3 related events maximum
        related_events = related_events[:3]
        
        return render_template('view.html', event=event, related_events=related_events)
    else:
        return redirect(url_for('home'))

@app.route('/random')
def random_event():
    # Get a random event ID from the events dictionary
    random_id = random.choice(list(events.keys()))
    
    # Redirect to the view page for the random event
    return redirect(url_for('view', event_id=random_id))

@app.route('/edit/<event_id>')
def edit(event_id):
    # Get the event details
    event = events.get(event_id)
    
    if event:
        return render_template('edit.html', event=event)
    else:
        return redirect(url_for('home'))
    
@app.route('/api/update_event', methods=['POST'])
def update_event():
    # Get data from form submission
    try:
        # Extract form data
        event_id = request.form.get('event_id', '').strip()
        title = request.form.get('title', '').strip()
        image = request.form.get('image', '').strip()
        year = request.form.get('year', '').strip()
        location = request.form.get('location', '').strip()
        summary = request.form.get('summary', '').strip()
        activities = request.form.get('activities', '').strip()
        
        # Check if event exists
        if event_id not in events:
            return {'success': False, 'errors': {'general': 'Event not found'}}
        
        # Validate data
        errors = {}
        if not title:
            errors['title'] = 'Title cannot be empty'
        if not image:
            errors['image'] = 'Image URL cannot be empty'
        if not year:
            errors['year'] = 'Year cannot be empty'
        elif not year.isdigit():
            errors['year'] = 'Year must be a number'
        if not location:
            errors['location'] = 'Location cannot be empty'
        if not summary:
            errors['summary'] = 'Summary cannot be empty'
        elif len(summary.split()) < 20:
            errors['summary'] = 'Summary must be at least 20 words'
        if not activities:
            errors['activities'] = 'Activities cannot be empty'
        
        if errors:
            return {'success': False, 'errors': errors}
        
        # Split activities by commas
        activities_list = [activity.strip() for activity in activities.split(',')]
        
        # Update the event
        events[event_id]['title'] = title
        events[event_id]['image'] = image
        events[event_id]['year'] = year
        events[event_id]['location'] = location
        events[event_id]['summary'] = summary
        events[event_id]['popular_activities'] = activities_list
        
        return {'success': True, 'id': event_id, 'title': title}
    
    except Exception as e:
        return {'success': False, 'errors': {'general': str(e)}}
    
if __name__ == '__main__':
    app.run(debug=True, port=5001)