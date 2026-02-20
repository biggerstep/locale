"""
Locale Backend - Location Evaluation API
Integrates Google Places API and Open-Meteo for real location data
"""
import os
import json
import requests
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configuration
GOOGLE_API_KEY = os.environ.get('GOOGLE_MAPS_API_KEY', 'YOUR_API_KEY_HERE')
PLACES_API_BASE = 'https://places.googleapis.com/v1/places:searchNearby'
TEXT_SEARCH_API_BASE = 'https://places.googleapis.com/v1/places:searchText'
GEOCODING_API_BASE = 'https://maps.googleapis.com/maps/api/geocode/json'
METEO_API_BASE = 'https://archive-api.open-meteo.com/v1/archive'

# Available criteria with their Google Places types
CRITERIA_MAP = {
    'grocery_stores': 'grocery_store',
    'restaurants': 'restaurant',
    'coffee_shops': 'cafe',
    'bars': 'bar',
    'breweries': 'brewery',
    'pharmacies': 'pharmacy',
    'gyms': 'gym',
    'parks': 'park',
    'schools': 'school',
    'hospitals': 'hospital',
    'gas_stations': 'gas_station',
}


def geocode_location(location: str) -> Optional[Dict]:
    """Convert location string to lat/lng using Google Geocoding API"""
    params = {
        'address': location,
        'key': GOOGLE_API_KEY
    }
    
    try:
        response = requests.get(GEOCODING_API_BASE, params=params)
        response.raise_for_status()
        data = response.json()
        
        if data['status'] == 'OK' and data['results']:
            result = data['results'][0]
            return {
                'formatted_address': result['formatted_address'],
                'lat': result['geometry']['location']['lat'],
                'lng': result['geometry']['location']['lng']
            }
        return None
    except Exception as e:
        print(f"Geocoding error: {e}")
        return None


def count_nearby_places(lat: float, lng: float, place_type: str,
                       radius_meters: int, min_rating: float = 4.0) -> dict:
    """
    Get places of a given type within radius using Google Places API (New)
    Returns count and detailed list with names and distances
    Uses POST request as required by new API
    """
    headers = {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_API_KEY,
        'X-Goog-FieldMask': 'places.displayName,places.rating,places.location,places.types,places.googleMapsUri'
    }

    body = {
        'includedTypes': [place_type],
        'maxResultCount': 20,  # API limit per request
        'rankPreference': 'DISTANCE',  # Prioritize closest results for better coverage
        'locationRestriction': {
            'circle': {
                'center': {
                    'latitude': lat,
                    'longitude': lng
                },
                'radius': radius_meters
            }
        }
    }

    # Override to popularity ranking for restaurants (better quality results)
    if place_type == 'restaurant' and min_rating:
        body['rankPreference'] = 'POPULARITY'

    try:
        response = requests.post(PLACES_API_BASE, headers=headers, json=body)
        response.raise_for_status()
        data = response.json()

        places = data.get('places', [])

        # Filter by primary type for coffee shops to avoid misclassification (gas stations)
        # For other types, just check if type is anywhere in the list
        if place_type == 'cafe':
            places = [p for p in places if p.get('types', []) and p['types'][0] == place_type]
        else:
            places = [p for p in places if place_type in p.get('types', [])]

        # Filter by rating if specified (for restaurants)
        if place_type == 'restaurant' and min_rating:
            places = [p for p in places if p.get('rating', 0) >= min_rating]

        # Calculate distances and build detailed list
        detailed_places = []
        for place in places:
            place_lat = place.get('location', {}).get('latitude')
            place_lng = place.get('location', {}).get('longitude')

            if place_lat and place_lng:
                # Calculate distance using Haversine formula approximation
                lat_diff = abs(lat - place_lat) * 69  # ~69 miles per degree lat
                lng_diff = abs(lng - place_lng) * 54.6  # ~54.6 miles per degree lng
                distance = round((lat_diff**2 + lng_diff**2)**0.5, 2)

                detailed_places.append({
                    'name': place.get('displayName', {}).get('text', 'Unknown'),
                    'distance': distance,
                    'rating': place.get('rating'),
                    'url': place.get('googleMapsUri', ''),
                    'lat': place_lat,
                    'lng': place_lng
                })

        # Sort by distance (closest first)
        detailed_places.sort(key=lambda x: x['distance'])

        # Return all places (up to API limit of 20)
        # Frontend will display them in a scrollable list
        return {
            'count': len(places),
            'places': detailed_places
        }
    except Exception as e:
        print(f"Places API error for {place_type}: {e}")
        return {'count': 0, 'places': []}


def search_by_text(lat: float, lng: float, query: str, radius_meters: int) -> dict:
    """
    Search for places by text query (e.g., business name like "Starbucks")
    Uses Google Places Text Search API
    Returns count and detailed list with names and distances
    """
    headers = {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_API_KEY,
        'X-Goog-FieldMask': 'places.displayName,places.rating,places.location,places.types,places.googleMapsUri'
    }

    body = {
        'textQuery': query,
        'maxResultCount': 20,
        'rankPreference': 'DISTANCE',
        'locationBias': {
            'circle': {
                'center': {
                    'latitude': lat,
                    'longitude': lng
                },
                'radius': radius_meters
            }
        }
    }

    try:
        response = requests.post(TEXT_SEARCH_API_BASE, headers=headers, json=body)
        response.raise_for_status()
        data = response.json()

        places = data.get('places', [])

        # Calculate distances and build detailed list
        detailed_places = []
        for place in places:
            place_lat = place.get('location', {}).get('latitude')
            place_lng = place.get('location', {}).get('longitude')

            if place_lat and place_lng:
                # Calculate distance using Haversine formula approximation
                lat_diff = abs(lat - place_lat) * 69  # ~69 miles per degree lat
                lng_diff = abs(lng - place_lng) * 54.6  # ~54.6 miles per degree lng
                distance = round((lat_diff**2 + lng_diff**2)**0.5, 2)

                # Only include places within the radius
                radius_miles = radius_meters / 1609.34
                if distance <= radius_miles:
                    detailed_places.append({
                        'name': place.get('displayName', {}).get('text', 'Unknown'),
                        'distance': distance,
                        'rating': place.get('rating'),
                        'url': place.get('googleMapsUri', ''),
                        'lat': place_lat,
                        'lng': place_lng
                    })

        detailed_places.sort(key=lambda x: x['distance'])

        return {
            'count': len(detailed_places),
            'places': detailed_places
        }
    except Exception as e:
        print(f"Text search error for '{query}': {e}")
        return {'count': 0, 'places': []}


def get_climate_data(lat: float, lng: float) -> Dict:
    """
    Get historical climate averages using Open-Meteo
    Calculates averages from past year
    """
    # Get data for past year
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=365)
    
    params = {
        'latitude': lat,
        'longitude': lng,
        'start_date': start_date.isoformat(),
        'end_date': end_date.isoformat(),
        'daily': 'temperature_2m_max,temperature_2m_min,precipitation_sum',
        'temperature_unit': 'fahrenheit',
        'precipitation_unit': 'inch',
        'timezone': 'auto'
    }
    
    try:
        response = requests.get(METEO_API_BASE, params=params)
        response.raise_for_status()
        data = response.json()
        
        daily = data.get('daily', {})
        temp_max = daily.get('temperature_2m_max', [])
        temp_min = daily.get('temperature_2m_min', [])
        precip = daily.get('precipitation_sum', [])
        
        # Calculate averages
        avg_temp = round((sum(temp_max) + sum(temp_min)) / (len(temp_max) + len(temp_min)), 1)
        total_precip = round(sum(precip), 1)
        
        # Estimate sunny days (days with < 0.1 inch precipitation)
        sunny_days = sum(1 for p in precip if p < 0.1)
        
        return {
            'avg_temp_f': f"{avg_temp}°F",
            'annual_precipitation': f"{total_precip} in/yr",
            'sunny_days': f"{sunny_days} days/yr"
        }
    except Exception as e:
        print(f"Climate API error: {e}")
        return {
            'avg_temp_f': 'N/A',
            'annual_precipitation': 'N/A',
            'sunny_days': 'N/A'
        }


def find_nearest_airport(lat: float, lng: float, radius_meters: int = 50000) -> Dict:
    """Find nearest airport (searches within ~31 miles - Google API max)"""
    headers = {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_API_KEY,
        'X-Goog-FieldMask': 'places.displayName,places.location'
    }
    
    body = {
        'includedTypes': ['airport'],
        'maxResultCount': 5,
        'locationRestriction': {
            'circle': {
                'center': {'latitude': lat, 'longitude': lng},
                'radius': radius_meters
            }
        }
    }
    
    try:
        response = requests.post(PLACES_API_BASE, headers=headers, json=body)
        response.raise_for_status()
        data = response.json()
        
        places = data.get('places', [])
        if not places:
            return {'name': 'None nearby', 'distance_mi': 'N/A'}
        
        # Get closest airport
        closest = places[0]
        airport_lat = closest['location']['latitude']
        airport_lng = closest['location']['longitude']
        
        # Calculate distance (simple Euclidean approximation)
        lat_diff = abs(lat - airport_lat) * 69  # ~69 miles per degree lat
        lng_diff = abs(lng - airport_lng) * 54.6  # ~54.6 miles per degree lng at mid-latitudes
        distance = round((lat_diff**2 + lng_diff**2)**0.5, 1)
        
        return {
            'name': closest['displayName']['text'],
            'distance_mi': f"{distance} mi"
        }
    except Exception as e:
        print(f"Airport search error: {e}")
        return {'name': 'Error', 'distance_mi': 'N/A'}


def evaluate_location(location: str, radius_miles: float,
                     selected_criteria: Optional[List[str]] = None,
                     custom_amenities: Optional[List[str]] = None,
                     restaurant_min_rating: float = 0) -> Dict:
    """
    Main function to evaluate a location

    Args:
        location: Address or city name
        radius_miles: Search radius in miles
        selected_criteria: List of criteria keys to evaluate (defaults to all)
        custom_amenities: List of custom place types to search for
        restaurant_min_rating: Minimum rating for restaurants (0-5, default 0 for all)

    Returns:
        Dictionary with location evaluation data
    """
    # Geocode location
    geo_data = geocode_location(location)
    if not geo_data:
        return {'error': 'Location not found'}

    lat = geo_data['lat']
    lng = geo_data['lng']
    radius_meters = int(radius_miles * 1609.34)  # Convert miles to meters

    # Default to all criteria if none specified
    if selected_criteria is None:
        selected_criteria = list(CRITERIA_MAP.keys())

    # Gather amenity data (counts and details)
    amenities = {}
    for criterion in selected_criteria:
        if criterion in CRITERIA_MAP:
            place_type = CRITERIA_MAP[criterion]
            # Special handling for restaurants with configurable minimum rating
            if criterion == 'restaurants' and restaurant_min_rating > 0:
                result = count_nearby_places(lat, lng, place_type, radius_meters, min_rating=restaurant_min_rating)
            else:
                result = count_nearby_places(lat, lng, place_type, radius_meters)
            amenities[criterion] = result

    # Add custom amenities using text search (supports business names and queries)
    if custom_amenities:
        for query in custom_amenities:
            if query and query.strip():
                result = search_by_text(lat, lng, query.strip(), radius_meters)
                amenities[query.strip()] = result
    
    # Get climate data
    climate = get_climate_data(lat, lng)
    
    # Find nearest airport
    airport = find_nearest_airport(lat, lng)
    
    return {
        'location': geo_data['formatted_address'],
        'coordinates': {'lat': lat, 'lng': lng},
        'radius_miles': radius_miles,
        'climate': climate,
        'amenities': amenities,
        'transportation': {
            'nearest_airport': airport['name'],
            'airport_distance': airport['distance_mi']
        }
    }


# Example usage
if __name__ == '__main__':
    # Test with Austin, TX
    result = evaluate_location(
        location='Austin, TX',
        radius_miles=5,
        selected_criteria=['grocery_stores', 'restaurants', 'coffee_shops', 'breweries']
    )
    
    print(json.dumps(result, indent=2))
