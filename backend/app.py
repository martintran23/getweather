from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from bson.objectid import ObjectId
import os
from dotenv import load_dotenv
import csv
import io
from datetime import datetime
import requests

load_dotenv()  # Load environment variables from .env file

app = Flask(__name__)
CORS(app)

uri = os.getenv("MONGODB_URI")
client = MongoClient(uri, server_api=ServerApi('1'))
db = client.weatherappdb
weather_collection = db.weather_data

def is_valid_date(date_str):
    try:
        datetime.strptime(date_str, '%Y-%m-%d')
        return True
    except ValueError:
        return False

def location_exists(city):
    geo_api_key = os.getenv("OPENWEATHERMAP_API_KEY")
    response = requests.get(
        f"http://api.openweathermap.org/geo/1.0/direct?q={city}&limit=1&appid={geo_api_key}"
    )
    return response.status_code == 200 and len(response.json()) > 0

@app.route('/saveWeather', methods=['POST'])
def save_weather():
    try:
        data = request.get_json()

        if not all(k in data for k in ('city', 'date', 'temp', 'weather')):
            return jsonify({'error': 'Missing required fields'}), 400

        record = {
            'city': data['city'],
            'date': data['date'],
            'temp': data['temp'],
            'weather': data['weather']  # should be a string
        }
        db.weather.insert_one(record)
        return jsonify({'message': 'Weather saved successfully'}), 200

    except Exception as e:
        print('Error in /saveWeather:', e)
        return jsonify({'error': str(e)}), 500

@app.route('/getWeather', methods=['GET'])
def get_weather():
    records = list(weather_collection.find())
    for r in records:
        r['_id'] = str(r['_id'])
    return jsonify(records)

@app.route('/getWeatherByDateRange', methods=['GET'])
def get_weather_by_date_range():
    city = request.args.get('city')
    start = request.args.get('start_date')
    end = request.args.get('end_date')

    if not city or not start or not end:
        return jsonify({"error": "Missing required query parameters"}), 400

    if not is_valid_date(start) or not is_valid_date(end):
        return jsonify({"error": "Invalid date format, use YYYY-MM-DD"}), 400

    query = {
        "city": city,
        "date": {
            "$gte": start,
            "$lte": end
        }
    }

    records = list(weather_collection.find(query))
    for r in records:
        r['_id'] = str(r['_id'])

    return jsonify(records)

@app.route('/updateWeather/<id>', methods=['PUT'])
def update_weather(id):
    data = request.json
    if "start_date" in data and not is_valid_date(data["start_date"]):
        return jsonify({"error": "Invalid start date format"}), 400
    if "end_date" in data and not is_valid_date(data["end_date"]):
        return jsonify({"error": "Invalid end date format"}), 400
    if "city" in data and not location_exists(data["city"]):
        return jsonify({"error": "Invalid city"}), 400

    result = weather_collection.update_one({"_id": ObjectId(id)}, {"$set": data})
    if result.matched_count == 0:
        return jsonify({"error": "Record not found"}), 404
    return jsonify({"message": "Weather record updated"})

@app.route('/deleteWeather/<id>', methods=['DELETE'])
def delete_weather(id):
    result = weather_collection.delete_one({"_id": ObjectId(id)})
    if result.deleted_count == 0:
        return jsonify({"error": "Record not found"}), 404
    return jsonify({"message": "Weather record deleted"})

@app.route('/exportWeatherCSV', methods=['GET'])
def export_weather_csv():
    records = list(weather_collection.find())

    def generate():
        data = io.StringIO()
        writer = csv.writer(data)

        writer.writerow(("City", "Temperature", "_id"))
        yield data.getvalue()
        data.seek(0)
        data.truncate(0)

        for record in records:
            writer.writerow([
                record.get("city", "N/A"),
                record.get("temp", "N/A"),
                str(record.get("_id"))
            ])
            yield data.getvalue()
            data.seek(0)
            data.truncate(0)

    return Response(
        generate(),
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment; filename=weather_data.csv"}
    )

@app.route('/exportWeather', methods=['GET'])
def export_weather():
    records = list(weather_collection.find())
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(['City', 'Date', 'Temp (°C)', 'Weather Description'])
    for r in records:
        writer.writerow([
            r.get('city', ''),
            r.get('date', ''),
            r.get('temp', ''),
            r.get('weather') if isinstance(r.get('weather'), str) else r.get('weather', {}).get('description', '')
        ])

    return Response(
        output.getvalue(),
        mimetype='text/csv',
        headers={"Content-Disposition": "attachment; filename=weather_data.csv"}
    )

if __name__ == '__main__':
    app.run(debug=True)
