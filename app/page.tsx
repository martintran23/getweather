'use client';

import { useState, useEffect } from 'react';

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


  const BACKEND_URL = 'http://127.0.0.1:5000'; // Adjust backend URL if needed
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
        {showPMAInfo ? 'Hide' : 'Show'} Product Manager Accelerator Info
      </button>

      {showPMAInfo && (
        <section className="mb-6 p-4 border rounded bg-yellow-50 text-yellow-900 max-w-3xl text-sm leading-relaxed">
          <h2 className="text-xl font-bold mb-2">Overview</h2>
          <p>
            The Product Manager Accelerator Program is designed to support PM professionals through every stage of their careers. From students looking for entry-level jobs to Directors looking to take on a leadership role, our program has helped over hundreds of students fulfill their career aspirations.
          </p>
          <p className="mt-2">
            Our Product Manager Accelerator community are ambitious and committed. Through our program they have learnt, honed and developed new PM and leadership skills, giving them a strong foundation for their future endeavors.
          </p>
          <p className="mt-2">
            Here are the examples of services we offer. Check out our website (link under my profile) to learn more about our services.
          </p>

          <ul className="list-disc list-inside mt-3 space-y-2">
            <li>
              <strong>🚀 PMA Pro</strong> — End-to-end product manager job hunting program that helps you master FAANG-level Product Management skills, conduct unlimited mock interviews, and gain job referrals through our largest alumni network. 25% of our offers came from tier 1 companies and get paid as high as $800K/year.
            </li>
            <li>
              <strong>🚀 AI PM Bootcamp</strong> — Gain hands-on AI Product Management skills by building a real-life AI product with a team of AI Engineers, data scientists, and designers. We will also help you launch your product with real user engagement using our 100,000+ PM community and social media channels.
            </li>
            <li>
              <strong>🚀 PMA Power Skills</strong> — Designed for existing product managers to sharpen their product management skills, leadership skills, and executive presentation skills.
            </li>
            <li>
              <strong>🚀 PMA Leader</strong> — We help you accelerate your product management career, get promoted to Director and product executive levels, and win in the board room.
            </li>
            <li>
              <strong>🚀 1:1 Resume Review</strong> — We help you rewrite your killer product manager resume to stand out from the crowd, with an interview guarantee. Get started by using our FREE killer PM resume template used by over 14,000 product managers. <a href="https://www.drnancyli.com/pmresume" target="_blank" rel="noopener noreferrer" className="underline text-blue-600">https://www.drnancyli.com/pmresume</a>
            </li>
            <li>
              <strong>🚀</strong> We also published over 500+ free training and courses. Please go to my YouTube channel <a href="https://www.youtube.com/c/drnancyli" target="_blank" rel="noopener noreferrer" className="underline text-blue-600">https://www.youtube.com/c/drnancyli</a> and Instagram <a href="https://www.instagram.com/drnancyli" target="_blank" rel="noopener noreferrer" className="underline text-blue-600">@drnancyli</a> to start learning for free today.
            </li>
          </ul>

          <h3 className="mt-4 font-semibold">Website</h3>
          <p><a href="https://www.pmaccelerator.io/" target="_blank" rel="noopener noreferrer" className="underline text-blue-600">https://www.pmaccelerator.io/</a></p>

          <h3 className="mt-2 font-semibold">Phone</h3>
          <p>+19548891063</p>

          <h3 className="mt-2 font-semibold">Industry</h3>
          <p>E-Learning Providers</p>

          <h3 className="mt-2 font-semibold">Company size</h3>
          <p>2-10 employees</p>

          <h3 className="mt-2 font-semibold">LinkedIn members</h3>
          <p>105 associated members LinkedIn members who’ve listed Product Manager Accelerator as their current workplace on their profile.</p>

          <h3 className="mt-2 font-semibold">Headquarters</h3>
          <p>Boston, MA</p>

          <h3 className="mt-2 font-semibold">Founded</h3>
          <p>2020</p>

          <h3 className="mt-2 font-semibold">Specialties</h3>
          <p>
            Product Management, Product Manager, Product Management Training, Product Management Certification, Product Lead, Product Executive, Associate Product Manager, product management coaching, product manager resume, Product Management Interview, VP of Product, Director of Product, Chief Product Officer, and AI Product Management
          </p>
        </section>
      )}

      <input
        type="text"
        placeholder="Enter city"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        className="border p-2 mb-3 w-full max-w-xs rounded"
      />

      <div className="mb-3 w-full max-w-xs">
        <label htmlFor="startDate" className="block mb-1 font-semibold">Start Date</label>
        <input
          id="startDate"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="border p-2 w-full rounded"
        />
      </div>

      <div className="mb-3 w-full max-w-xs">
        <label htmlFor="endDate" className="block mb-1 font-semibold">End Date</label>
        <input
          id="endDate"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="border p-2 w-full rounded"
        />
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={fetchWeather}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Get Weather
        </button>
        <button
          onClick={detectLocationAndFetch}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Use My Location
        </button>
      </div>

      {error && <p className="text-red-500 mt-2">{error}</p>}

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
            {forecast.list
              .filter((_: any, i: number) => i % 8 === 0)
              .map((day: any) => {
                const weather = day.weather && day.weather.length > 0 ? day.weather[0] : null;

                return (
                  <div key={day.dt} className="p-2 border rounded">
                    <p>
                      {new Date(day.dt * 1000).toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                    {weather ? (
                      <>
                        <img
                          src={`http://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                          alt={weather.description}
                          className="mx-auto"
                        />
                        <p>{weather.description}</p>
                      </>
                    ) : (
                      <p>No weather data</p>
                    )}
                    <p>🌡 {day.main.temp.toFixed(1)} °C</p>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      <section className="mt-8 w-full max-w-md">
        <h3 className="text-xl font-semibold mb-3">Saved Weather Records</h3>

        <button
          onClick={exportToCSV}
          className="mb-4 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          Export CSV
        </button>

        {savedRecords.length === 0 && <p>No saved records yet.</p>}

        <ul>
          {savedRecords.map((record) => (
            <li
              key={record._id}
              className="flex justify-between items-center border p-2 mb-2 rounded"
            >
              <div>
                <p><strong>City:</strong> {record.city}</p>
                <p><strong>Date:</strong> {record.date}</p>
                <p><strong>Temp:</strong> {record.temp} °C</p>
                <p><strong>Weather:</strong> {
                  typeof record.weather === 'string'
                    ? record.weather
                    : record.weather?.description || 'N/A'
                }</p>
              </div>
              <button
                onClick={() => deleteRecord(record._id)}
                className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
