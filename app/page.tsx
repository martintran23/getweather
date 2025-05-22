'use client';

import {useState} from 'react';

export default function Home() {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState<any>(null);
  const [error, setError] = useState('');

  const fetchWeather = async () => {
    try {
      console.log("API KEY:", process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY);
      const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`
      );
      const data = await res.json()

      if (data.cod != 200) {
        setError(data.message);
        setWeather(null);
      } else {
        setWeather(data);
        setError('');
      }
    } catch (err) {
      setError('Failed to fetch weather');
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">Weather App</h1>

      <input
        type="text"
        placeholder="Enter city"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        className="nprder p-2 mb-2"
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
          <p>{weather.weather[0].description}</p>
          <p>🌡 {weather.main.temp} °C</p>
          <p>💨 {weather.wind.speed} m/s</p>
        </div>
      )}
    </main>
  );
}