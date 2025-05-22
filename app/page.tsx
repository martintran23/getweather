'use client';

import { useState, useEffect } from 'react';

const getBackgroundClass = (iconCode: string | undefined) => {
  switch (iconCode) {
    case '01d': // clear sky day
      return 'bg-blue-400';
    case '01n': // clear sky night
      return 'bg-gray-900';
    case '02d': // few clouds day
    case '03d': // scattered clouds day
    case '04d': // broken clouds day
      return 'bg-gray-400';
    case '02n': // few clouds night
    case '03n': // scattered clouds night
    case '04n': // broken clouds night
      return 'bg-gray-700';
    case '09d': // shower rain day
    case '10d': // rain day
      return 'bg-blue-600';
    case '09n': // shower rain night
    case '10n': // rain night
      return 'bg-blue-900';
    case '11d': // thunderstorm day
    case '11n': // thunderstorm night
      return 'bg-purple-700';
    case '13d': // snow day
    case '13n': // snow night
      return 'bg-white';
    case '50d': // mist day
    case '50n': // mist night
      return 'bg-gray-500';
    default:
      return 'bg-gray-200'; // fallback
  }
};

export default function Home() {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState<any>(null);
  const [error, setError] = useState('');
  const [forecast, setForecast] = useState<any>(null);

  // Fetch weather by city name
  const fetchWeather = async () => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`
      );
      const data = await res.json();

     if (data.cod != 200) {
       setError(data.message);
       setWeather(null);
       setForecast(null);
     } else {
       setWeather(data);
       setError('');
       fetchForecast(city);  // <-- fetch 5-day forecast here
     }
   } catch (err) {
     setError('Failed to fetch weather');
   }
  };
  
  // Fetch weather forecast by city name
  const fetchForecast = async (cityName: string) => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&appid=${apiKey}&units=metric`
      );
      const data = await res.json();

      if (data.cod !== "200") {
        setError(data.message);
        setForecast(null);
      } else {
        setForecast(data);
       setError('');
     }
    } catch (err) {
      setError('Failed to fetch forecast');
    }
  };

  // New: Fetch weather by lat/lon coordinates
  const fetchWeatherByCoords = async (lat: number, lon: number) => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
      );
      const data = await res.json();

      if (data.cod != 200) {
        setError(data.message);
        setWeather(null);
      } else {
        setWeather(data);
        setError('');
        setCity(data.name); // update city input with detected city
      }
    } catch (err) {
      setError('Failed to fetch weather by location');
    }
  };

  // New: Detect user location and fetch weather
  const detectLocationAndFetch = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        fetchWeatherByCoords(position.coords.latitude, position.coords.longitude);
      },
      () => {
        setError('Unable to retrieve your location');
      }
    );
  };

  // Call geolocation fetch once on mount
  useEffect(() => {
    detectLocationAndFetch();
  }, []);

  return (
    <main
      className={`flex flex-col items-center justify-center min-h-screen p-4 transition-colors duration-700 ${
        weather ? getBackgroundClass(weather.weather[0].icon) : 'bg-gray-200'
      }`}
    >
      <h1 className="text-2xl font-bold mb-4">Weather App</h1>

      <input
        type="text"
        placeholder="Enter city"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        className="border p-2 mb-2"
      />

      <button
        onClick={fetchWeather}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Get Weather
      </button>

      {error && <p className="text-red-500 mt-4">{error}</p>}

      {weather && (
        <div className="mt-4 text-center">
          <h2 className="text-xl font-semibold">{weather.name}</h2>
          <img
            src={`http://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
            alt={weather.weather[0].description}
            className="mx-auto"
          />
          <p>{weather.weather[0].description}</p>
          <p>🌡 {weather.main.temp} °C</p>
          <p>💨 {weather.wind.speed} m/s</p>
        </div>
      )}

      {forecast && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">5-Day Forecast</h3>
           <div className="grid grid-cols-5 gap-4 text-center">
            {forecast.list.filter((_: any, i: number) => i % 8 === 0).map((day: any) => (
              <div key={day.dt} className="p-2 border rounded">
               <p>{new Date(day.dt * 1000).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
               <img
                 src={`http://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`}
                alt={day.weather[0].description}
                className="mx-auto"
                />
                <p>{day.weather[0].description}</p>
                <p>🌡 {day.main.temp.toFixed(1)} °C</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
