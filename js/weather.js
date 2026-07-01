import { $ } from './utils.js';
import { WEATHER_API_KEY } from './config.js';

/* Weather uses the OpenWeather Current Weather API + browser geolocation,
   cached in chrome.storage.local for CACHE_TTL_MS before refetching. */

const CACHE_KEY = 'weatherCache';
const CACHE_TTL_MS = 15 * 60 * 1000;
const DEFAULT_CITY = 'Patna';
const GEO_TIMEOUT_MS = 8000;
const WEATHER_ENDPOINT = 'https://api.openweathermap.org/data/2.5/weather';

let fetchInFlight = null;

export function initWeather() {
  $('#weather-refresh')?.addEventListener('click', () => loadWeather({ forceRefresh: true }));
  loadWeather({ forceRefresh: false });
}

async function loadWeather({ forceRefresh }) {
  if (!forceRefresh) {
    const cache = await loadWeatherCache();
    if (cache && isCacheValid(cache)) {
      renderWeather(cache.data);
      return;
    }
  }
  await refreshWeather();
}

function refreshWeather() {
  if (fetchInFlight) return fetchInFlight;

  fetchInFlight = (async () => {
    showLoadingState();
    try {
      const coords = await getCurrentLocation();
      const data = await fetchWeather(coords);
      await saveWeatherCache(data);
      renderWeather(data);
    } catch (err) {
      console.error('[weather] failed to load weather:', err);
      showErrorState();
    }
  })().finally(() => {
    fetchInFlight = null;
  });

  return fetchInFlight;
}

function getCurrentLocation() {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => resolve(null),
      { timeout: GEO_TIMEOUT_MS, maximumAge: 0 }
    );
  });
}

async function fetchWeather(coords) {
  const params = new URLSearchParams({ appid: WEATHER_API_KEY, units: 'metric' });
  if (coords) {
    params.set('lat', coords.lat);
    params.set('lon', coords.lon);
  } else {
    params.set('q', DEFAULT_CITY);
  }

  let res;
  try {
    res = await fetch(`${WEATHER_ENDPOINT}?${params.toString()}`);
  } catch {
    throw new Error('Network request failed');
  }
  if (!res.ok) throw new Error(`OpenWeather responded with status ${res.status}`);

  return normalizeWeatherResponse(await res.json());
}

function normalizeWeatherResponse(json) {
  const condition = json.weather?.[0] || {};
  return {
    city: json.name || DEFAULT_CITY,
    temp: Math.round(json.main.temp),
    feelsLike: Math.round(json.main.feels_like),
    condition: toTitleCase(condition.description || 'Unknown'),
    icon: condition.icon || '01d',
    humidity: json.main.humidity,
    wind: Math.round(json.wind.speed * 3.6),
    sunrise: formatLocalTime(json.sys.sunrise, json.timezone),
    sunset: formatLocalTime(json.sys.sunset, json.timezone),
  };
}

function toTitleCase(str) {
  return str.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1));
}

function formatLocalTime(unixSeconds, timezoneOffsetSeconds) {
  const date = new Date((unixSeconds + timezoneOffsetSeconds) * 1000);
  let h = date.getUTCHours();
  const m = String(date.getUTCMinutes()).padStart(2, '0');
  const period = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${period}`;
}

function isCacheValid(cache) {
  return Date.now() - cache.timestamp < CACHE_TTL_MS;
}

function saveWeatherCache(data) {
  return storageSet({ [CACHE_KEY]: { city: data.city, data, timestamp: Date.now() } });
}

async function loadWeatherCache() {
  return (await storageGet(CACHE_KEY)) || null;
}

function storageSet(items) {
  return new Promise((resolve) => {
    if (chrome?.storage?.local) {
      chrome.storage.local.set(items, resolve);
    } else {
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(items[CACHE_KEY])); } catch {}
      resolve();
    }
  });
}

function storageGet(key) {
  return new Promise((resolve) => {
    if (chrome?.storage?.local) {
      chrome.storage.local.get(key, (result) => resolve(result[key]));
    } else {
      try {
        const raw = localStorage.getItem(key);
        resolve(raw ? JSON.parse(raw) : null);
      } catch {
        resolve(null);
      }
    }
  });
}

function showLoadingState() {
  hide('#weather-error');
  const body = $('#weather-body');
  const loading = $('#weather-loading');
  if (body) body.style.opacity = '0.4';
  if (loading) loading.style.display = 'flex';
}

function showErrorState() {
  const loading = $('#weather-loading');
  if (loading) loading.style.display = 'none';
  hide('#weather-body');
  const error = $('#weather-error');
  if (error) error.style.display = 'flex';
}

function renderWeather(data) {
  const loading = $('#weather-loading');
  if (loading) loading.style.display = 'none';
  hide('#weather-error');
  const body = $('#weather-body');
  if (body) {
    body.style.display = '';
    body.style.opacity = '1';
  }

  const icon = $('#weather-icon');
  if (icon) {
    icon.src = `https://openweathermap.org/img/wn/${data.icon}@2x.png`;
    icon.alt = data.condition;
  }
  setText('#weather-temp', `${data.temp}°C`);
  setText('#weather-feelslike', `Feels like ${data.feelsLike}°C`);
  setText('#weather-condition', data.condition);
  setText('#weather-location', data.city);
  setText('#weather-humidity', `${data.humidity}%`);
  setText('#weather-wind', `${data.wind} km/h`);
  setText('#weather-sunrise', data.sunrise);
  setText('#weather-sunset', data.sunset);
}

function setText(sel, text) {
  const el = $(sel);
  if (el) el.textContent = text;
}

function hide(sel) {
  const el = $(sel);
  if (el) el.style.display = 'none';
}
