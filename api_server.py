"""
Flask API Server for Locale
Provides REST endpoints for location evaluation
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
from locale_backend import evaluate_location, CRITERIA_MAP

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend requests


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'ok'})


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
    
    result = evaluate_location(location, radius_miles, selected_criteria)
    
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
