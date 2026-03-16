"""
Flask API Server for Locale
Provides REST endpoints for location evaluation
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
from locale_backend import evaluate_location, reverse_geocode, autocomplete_places, CRITERIA_MAP, GOOGLE_API_KEY

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend requests


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'ok'})


@app.route('/api/config', methods=['GET'])
def get_config():
    """Get configuration including Maps API key for frontend"""
    return jsonify({'mapsApiKey': GOOGLE_API_KEY})


@app.route('/api/criteria', methods=['GET'])
def get_criteria():
    """Get list of available criteria"""
    criteria_list = [
        {
            'key': key,
            'label': key.replace('_', ' ').title(),
            'description': f"Count of {key.replace('_', ' ')} within radius"
        }
        for key in CRITERIA_MAP.keys()
    ]
    return jsonify({'criteria': criteria_list})


@app.route('/api/autocomplete', methods=['GET'])
def autocomplete():
    """Get address autocomplete suggestions"""
    input_text = request.args.get('input', '').strip()
    if not input_text or len(input_text) < 2:
        return jsonify({'suggestions': []})
    session_token = request.args.get('session_token')
    suggestions = autocomplete_places(input_text, session_token)
    return jsonify({'suggestions': suggestions})


@app.route('/api/reverse-geocode', methods=['GET'])
def reverse_geocode_endpoint():
    """Convert lat/lng to a formatted address for current-location detection."""
    try:
        lat = float(request.args.get('lat'))
        lng = float(request.args.get('lng'))
    except (TypeError, ValueError):
        return jsonify({'error': 'lat and lng query parameters are required'}), 400

    address = reverse_geocode(lat, lng)
    if not address:
        return jsonify({'error': 'Could not resolve coordinates to an address'}), 404
    return jsonify({'address': address})


@app.route('/api/evaluate', methods=['POST'])
def evaluate():
    """
    Evaluate a location
    
    Request body:
    {
        "location": "Austin, TX",
        "radius_miles": 3,
        "criteria": ["grocery_stores", "restaurants", "coffee_shops"]
    }
    """
    data = request.get_json()
    
    if not data or 'location' not in data:
        return jsonify({'error': 'Location is required'}), 400
    
    location = data['location']
    radius_miles = float(data.get('radius_miles', 3))
    selected_criteria = data.get('criteria')  # None = all criteria
    custom_amenities = data.get('custom_amenities', [])  # Custom place types
    restaurant_min_rating = float(data.get('restaurant_min_rating', 0))  # Minimum rating for restaurants

    result = evaluate_location(location, radius_miles, selected_criteria, custom_amenities, restaurant_min_rating)
    
    if 'error' in result:
        return jsonify(result), 404
    
    return jsonify(result)


@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500


if __name__ == '__main__':
    print("Starting Locale API server...")
    print("Endpoints:")
    print("  GET  /api/health     - Health check")
    print("  GET  /api/criteria   - Get available criteria")
    print("  POST /api/evaluate   - Evaluate location")
    print("\nServer running on http://localhost:5001")

    app.run(debug=True, host='0.0.0.0', port=5001)
