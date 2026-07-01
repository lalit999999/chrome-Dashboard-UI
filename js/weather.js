import { $, toast } from './utils.js';
import { storage } from './storage.js';

/* Weather uses the Open-Meteo API (free, no key required) + browser geolocation.
   Falls back to a pleasant placeholder if location is denied. */

const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

const WMO_CODES = {
  0:  { label: 'Clear Sky',        icon: '☀️' },
  1:  { label: 'Mainly Clear',     icon: '🌤️' },
  2:  { label: 'Partly Cloudy',    icon: '⛅' },
  3:  { label: 'Overcast',         icon: '☁️' },
  45: { label: 'Foggy',            icon: '🌫️' },
  48: { label: 'Icy Fog',          icon: '🌫️' },
  51: { label: 'Light Drizzle',    icon: '🌦️' },
  53: { label: 'Moderate Drizzle', icon: '🌦️' },
  55: { label: 'Dense Drizzle',    icon: '🌧️' },
  61: { label: 'Slight Rain',      icon: '🌧️' },
  63: { label: 'Moderate Rain',    icon: '🌧️' },
  65: { label: 'Heavy Rain',       icon: '🌧️' },
  71: { label: 'Slight Snow',      icon: '🌨️' },
  73: { label: 'Moderate Snow',    icon: '❄️' },
  75: { label: 'Heavy Snow',       icon: '❄️' },
  80: { label: 'Rain Showers',     icon: '🌦️' },
  85: { label: 'Snow Showers',     icon: '🌨️' },
  95: { label: 'Thunderstorm',     icon: '⛈️' },
  99: { label: 'Thunderstorm',     icon: '⛈️' },
};

export function initWeather() {
  const cached = storage.get('weather_cache');
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    render(cached.data);
  } else {
    fetchWeather();
  }
  $('#weather-refresh')?.addEventListener('click', fetchWeather);
}

function fetchWeather() {
  setLoading(true);
  if (!navigator.geolocation) {
    renderFallback();
    return;
  }
  navigator.geolocation.getCurrentPosition(
    pos => getWeatherData(pos.coords.latitude, pos.coords.longitude),
    ()  => renderFallback(),
    { timeout: 8000 }
  );
}

async function getWeatherData(lat, lon) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weathercode&temperature_unit=celsius&wind_speed_unit=kmh`;
    const res  = await fetch(url);
    if (!res.ok) throw new Error('API error');
    const json = await res.json();
    const c    = json.current;
    const cond = WMO_CODES[c.weathercode] || { label: 'Unknown', icon: '🌡️' };

    let city = 'Your Location';
    try {
      const geo = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
      const gj  = await geo.json();
      city = gj.address?.city || gj.address?.town || gj.address?.village || gj.address?.county || city;
    } catch {}

    const data = {
      temp:      Math.round(c.temperature_2m),
      humidity:  c.relative_humidity_2m,
      wind:      Math.round(c.wind_speed_10m),
      condition: cond.label,
      icon:      cond.icon,
      city,
    };

    storage.set('weather_cache', { ts: Date.now(), data });
    render(data);
  } catch {
    renderFallback();
  } finally {
    setLoading(false);
  }
}

function render(data) {
  setLoading(false);
  const icon      = $('#weather-icon');
  const temp      = $('#weather-temp');
  const condition = $('#weather-condition');
  const location  = $('#weather-location');
  const humidity  = $('#weather-humidity');
  const wind      = $('#weather-wind');

  if (icon)      icon.textContent      = data.icon;
  if (temp)      temp.textContent      = `${data.temp}°C`;
  if (condition) condition.textContent = data.condition;
  if (location)  location.textContent  = data.city;
  if (humidity)  humidity.textContent  = `${data.humidity}%`;
  if (wind)      wind.textContent      = `${data.wind} km/h`;
}

function renderFallback() {
  setLoading(false);
  render({ temp: '--', humidity: '--', wind: '--', condition: 'Enable location for weather', icon: '🌡️', city: 'Unknown location' });
}

function setLoading(on) {
  const el = $('#weather-loading');
  if (el) el.style.display = on ? 'flex' : 'none';
  const body = $('#weather-body');
  if (body) body.style.opacity = on ? '0.4' : '1';
}
