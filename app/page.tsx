'use client';

import { useState, useEffect } from 'react';

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

async function saveWeather({ city, date, temp, weather }: { city: string; date: string; temp: number; weather: string }) {
  try {
    const response = await fetch(`${BASE_URL}/saveWeather`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ city, date, temp, weather }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Weather saved:", data);
    return data;
  } catch (error) {
    console.error("Failed to save weather:", error);
    throw error;
  }
}

const getBackgroundClass = (iconCode: string | undefined) => {
  switch (iconCode) {
    case '01d': return 'bg-blue-400';
    case '01n': return 'bg-gray-900';
    case '02d':
    case '03d':
    case '04d': return 'bg-gray-400';
    case '02n':
    case '03n':
    case '04n': return 'bg-gray-700';
    case '09d':
    case '10d': return 'bg-blue-600';
    case '09n':
    case '10n': return 'bg-blue-900';
    case '11d':
    case '11n': return 'bg-purple-700';
    case '13d':
    case '13n': return 'bg-white';
    case '50d':
    case '50n': return 'bg-gray-500';
    default: return 'bg-gray-200';
  }
};

export default function Home() {
  const [city, setCity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [weather, setWeather] = useState<any>(null);
  const [forecast, setForecast] = useState<any>(null);
  const [error, setError] = useState('');
  const [savedRecords, setSavedRecords] = useState<any[]>([]);
  const [showPMAInfo, setShowPMAInfo] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const BACKEND_URL = 'https://getweather-m2u5.onrender.com'; // Adjust backend URL if needed
  const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

  const fetchWeather = async () => {
    if (!city.trim()) {
      setError('Please enter a city name');
      setWeather(null);
      setForecast(null);
      return;
    }

    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`
      );
      const data = await res.json();

      if (data.cod !== 200) {
        setError(data.message);
        setWeather(null);
        setForecast(null);
      } else {
        setWeather(data);
        setError('');
        saveWeatherToBackend(data);
        fetchForecast(city);
      }
    } catch (err) {
      setError('Failed to fetch weather');
    }
  };

  const fetchForecast = async (cityName: string) => {
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&appid=${apiKey}&units=metric`
      );
      const data = await res.json();
      setForecast(data);
    } catch (err) {
      console.error('Failed to fetch forecast:', err);
    }
  };

  const saveWeatherToBackend = async (weatherData: Record<string, any>) => {
    try {
      console.log('Raw weather data:', weatherData);
      const dataToSave = {
        city: weatherData.name,
        date: new Date().toISOString().slice(0, 10),
        temp: weatherData.main.temp,
        weather: weatherData.weather[0].description,
      };

      console.log('Saving to backend:', dataToSave);
      const res = await fetch(`${BACKEND_URL}/saveWeather`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave),
      });

      const result = await res.json();
      console.log('Backend response:', result);
      fetchSavedRecords();
    } catch (e) {
      console.error('Error saving weather:', e);
    }
  };

  const fetchSavedRecords = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/getWeather`);
      const data = await res.json();
      console.log('Fetched saved records:', data);
      setSavedRecords(data);
    } catch (e) {
      console.error(e);
    }
  };

  interface WeatherUpdateData {
    city?: string;
    date?: string;
    temp?: number;
    weather?: string;
    start_date?: string;
    end_date?: string;
  }

  async function updateWeatherRecord(id: string, updatedData: WeatherUpdateData): Promise<string> {
    const res = await fetch(`${BACKEND_URL}/updateWeather/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedData),
    });

    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || 'Update failed');
    }
    return result.message;
  }

  const deleteRecord = async (id: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/deleteWeather/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete record');
      fetchSavedRecords();
    } catch (e) {
      console.error(e);
    }
  };

  const detectLocationAndFetch = () => {
    if (!navigator.geolocation) {
      alert('Geolocation not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        fetchWeatherByCoords(latitude, longitude);
      },
      (error) => {
        console.error('Geolocation error:', error);
      }
    );
  };

  const fetchWeatherByCoords = async (lat: number, lon: number) => {
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
      );
      const data = await res.json();

      setCity(data.name);
      setWeather(data);
      setError('');
      saveWeatherToBackend(data);
      fetchForecast(data.name);
    } catch (err) {
      setError('Failed to fetch location weather');
    }
  };

  useEffect(() => {
    fetchSavedRecords();
  }, []);

  const exportToCSV = () => {
    if (!savedRecords.length) return;

    const headers = ['City', 'Date', 'Temp (°C)', 'Weather'];

    const rows = savedRecords.map((record) => [
      record.city || 'N/A',
      record.date || 'N/A',
      record.temp !== undefined ? record.temp : 'N/A',
      typeof record.weather === 'string'
        ? record.weather
        : record.weather?.description || 'N/A',
    ]);

    console.log('Exporting CSV rows:', rows);

    // Wrap fields with quotes to handle commas inside text
    const csvContent =
      [headers, ...rows]
        .map((row) => row.map(field => `"${field}"`).join(','))
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'weather_records.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handlers for editing form inputs
  const [editCity, setEditCity] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTemp, setEditTemp] = useState('');
  const [editWeather, setEditWeather] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');

  // When editingItem changes, update edit form states
  useEffect(() => {
    if (editingItem) {
      setEditCity(editingItem.city || '');
      setEditDate(editingItem.date || '');
      setEditTemp(editingItem.temp !== undefined ? String(editingItem.temp) : '');
      setEditWeather(
        typeof editingItem.weather === 'string'
          ? editingItem.weather
          : editingItem.weather?.description || ''
      );
      setEditStartDate(editingItem.start_date || '');
      setEditEndDate(editingItem.end_date || '');
    } else {
      setEditCity('');
      setEditDate('');
      setEditTemp('');
      setEditWeather('');
      setEditStartDate('');
      setEditEndDate('');
    }
  }, [editingItem]);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const updatedData: WeatherUpdateData = {
      city: editCity,
      date: editDate,
      temp: editTemp !== '' ? Number(editTemp) : undefined,
      weather: editWeather,
      start_date: editStartDate,
      end_date: editEndDate,
    };

    try {
      await updateWeatherRecord(editingItem._id, updatedData);
      setEditingItem(null);
      fetchSavedRecords();
    } catch (error) {
      alert('Failed to update record: ' + (error as Error).message);
    }
  };

  return (
    <main
      className={`flex flex-col items-center justify-center min-h-screen p-4 transition-colors duration-700 ${
        weather ? getBackgroundClass(weather.weather[0].icon) : 'bg-gray-200'
      }`}
    >
      <h1 className="text-2xl font-bold mb-4">Weather App</h1>

      {/* Button to toggle PMA info */}
      <button
        onClick={() => setShowPMAInfo(!showPMAInfo)}
        className="mb-6 bg-yellow-500 text-black px-4 py-2 rounded hover:bg-yellow-600"
      >
        {showPMAInfo ? 'Hide' : 'Show'} Info
      </button>

      {showPMAInfo && (
        <section className="mb-6 p-4 border rounded bg-yellow-50 text-yellow-900 max-w-3xl text-sm leading-relaxed">
          <h2 className="text-xl font-bold mb-2">Developed By: Martin Long Hoang Tran</h2>
          {/* ... PMA info content unchanged ... */}
          <h2 className="text-xl font-bold mb-2">Overview</h2>
          <p>
            The Product Manager Accelerator Program is designed to support PM professionals through every stage of their careers. From students looking for entry-level jobs to Directors looking to take on a leadership role, our program has helped over hundreds of students fulfill their career aspirations.
          </p>
          {/* (Rest omitted for brevity but unchanged) */}
          <ul className="list-disc list-inside mt-3 space-y-2">
            <li>
              <strong>🚀 PMA Pro</strong> — End-to-end product manager job hunting program that helps you master FAANG-level Product Management skills, conduct unlimited mock interviews, and gain job referrals through our largest alumni network. 25% of our offers came from tier 1 companies and get paid as high as $800K/year.
            </li>
            <li>
              <strong>🎯 PMA Talks</strong> — Workshops, panels, and fireside chats hosted by current FAANG PMs that share their career journeys and interview experiences. In these sessions, you will also have the opportunity to connect with peers, alumni, and FAANG PMs who can serve as mentors.
            </li>
            <li>
              <strong>🤝 PMA Mentors</strong> — One-on-one mentorship with expert PMs who provide personalized feedback on your resume and interview preparation.
            </li>
            <li>
              <strong>🔥 PMA Career</strong> — Personalized career coaching that helps you build the right mindset, create a job search strategy, and prepare you for the real-world product management roles.
            </li>
          </ul>
          <p className="mt-3">
            We also offer lifelong access to our PMA community and resources. Whether you are new to product management or a seasoned professional, PMA will help you elevate your career.
          </p>
          <a
            href="https://productmanageraccelerator.com"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-blue-600 hover:underline"
          >
            Learn more at productmanageraccelerator.com
          </a>
        </section>
      )}

      {/* Search form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          fetchWeather();
        }}
        className="flex gap-2 mb-4"
      >
        <input
          type="text"
          placeholder="Enter city"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="px-3 py-2 border rounded"
          required
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Search
        </button>
        <button
          type="button"
          onClick={detectLocationAndFetch}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Use Current Location
        </button>
      </form>

      {/* Weather display */}
      {error && <p className="text-red-600">{error}</p>}
      {weather && (
        <div className="mb-6 p-4 bg-white rounded shadow max-w-md w-full">
          <h2 className="text-xl font-semibold mb-2">
            {weather.name}, {weather.sys.country}
          </h2>
          <p>Temperature: {weather.main.temp} °C</p>
          <div className="flex items-center gap-2">
            <img
              src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
              alt={weather.weather[0].description}
              className="w-12 h-12"
            />
            <span>{weather.weather[0].description}</span>
          </div>
        </div>
      )}


      {/* Forecast display */}
      {forecast && (
        <div className="mb-6 max-w-md w-full bg-white p-4 rounded shadow overflow-auto">
          <h3 className="font-semibold mb-2">5-Day Forecast</h3>
          <ul>
            {forecast.list.slice(0, 5).map((item: any) => (
              <li key={item.dt} className="mb-1 flex items-center gap-2">
                <span>{new Date(item.dt * 1000).toLocaleString()}:</span>
                <img
                  src={`https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`}
                  alt={item.weather[0].description}
                  className="w-8 h-8"
                />
                <span>{item.main.temp}°C, {item.weather[0].description}</span>
              </li>
            ))}
          </ul>
        </div>
      )}


      {/* Saved records list */}
      <section className="max-w-3xl w-full">
        <h2 className="text-xl font-bold mb-2">Saved Weather Records</h2>

        <button
          onClick={exportToCSV}
          className="mb-4 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          disabled={savedRecords.length === 0}
        >
          Export to CSV
        </button>

        {savedRecords.length === 0 && <p>No saved records found.</p>}

        <ul className="space-y-3">
          {savedRecords.map((record) => (
            <li
              key={record._id}
              className="p-3 border rounded flex justify-between items-center bg-white"
            >
              <div>
                <p><strong>City:</strong> {record.city}</p>
                <p><strong>Date:</strong> {record.date}</p>
                <p><strong>Temp:</strong> {record.temp} °C</p>
                <p><strong>Weather:</strong> {typeof record.weather === 'string' ? record.weather : record.weather?.description}</p>
                {record.start_date && <p><strong>Start Date & Time:</strong> {new Date(record.start_date).toLocaleString()}</p>}
                {record.end_date && <p><strong>End Date & Time:</strong> {new Date(record.end_date).toLocaleString()}</p>}
              </div>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => setEditingItem(record)}
                  className="bg-yellow-400 text-black px-2 py-1 rounded hover:bg-yellow-500"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteRecord(record._id)}
                  className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Edit form modal */}
      {editingItem && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setEditingItem(null)}
        >
          <form
            onSubmit={handleEditSubmit}
            onClick={(e) => e.stopPropagation()}
            className="bg-white p-6 rounded shadow-md w-full max-w-lg"
          >
            <h3 className="text-lg font-bold mb-4">Edit Weather Record</h3>

            <label className="block mb-2">
              City:
              <input
                type="text"
                value={editCity}
                onChange={(e) => setEditCity(e.target.value)}
                className="w-full border px-2 py-1 rounded mt-1"
                required
              />
            </label>

            <label className="block mb-2">
              Date:
              <input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className="w-full border px-2 py-1 rounded mt-1"
                required
              />
            </label>

            <label className="block mb-2">
              Temperature (°C):
              <input
                type="number"
                value={editTemp}
                onChange={(e) => setEditTemp(e.target.value)}
                className="w-full border px-2 py-1 rounded mt-1"
                required
                step="0.1"
              />
            </label>

            <label className="block mb-2">
              Weather Description:
              <input
                type="text"
                value={editWeather}
                onChange={(e) => setEditWeather(e.target.value)}
                className="w-full border px-2 py-1 rounded mt-1"
                required
              />
            </label>

            <label className="block mb-2">
              Start Date & Time (optional):
              <input
                type="datetime-local"
                value={editStartDate}
                onChange={(e) => setEditStartDate(e.target.value)}
                className="w-full border px-2 py-1 rounded mt-1"
              />
            </label>

            <label className="block mb-4">
              End Date & Time (optional):
            <input
              type="datetime-local"
              value={editEndDate}
              onChange={(e) => setEditEndDate(e.target.value)}
              className="w-full border px-2 py-1 rounded mt-1"
            />
          </label>


            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
