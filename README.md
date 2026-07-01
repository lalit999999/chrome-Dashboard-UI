# Productivity Dashboard

A Chrome new-tab productivity dashboard (clock, focus timer, tasks, quotes, calendar, weather, and more).

## Setup

1. Clone the repository.
2. Create `js/config.js` by copying the example file:
   ```sh
   cp js/config.example.js js/config.js
   ```
3. Open `js/config.js` and replace the placeholder with your own weather API key:
   ```js
   export const WEATHER_API_KEY = 'YOUR_ACTUAL_KEY';
   ```
4. Load the project as an unpacked extension in Chrome (`chrome://extensions` → Developer mode → Load unpacked).

### Why `js/config.js` is gitignored

`js/config.js` holds real secrets (API keys) and is listed in `.gitignore` so it is never pushed to GitHub. `js/config.example.js` is the tracked template that shows collaborators which values they need to supply after cloning the repo.

### Note on the weather module

`js/weather.js` uses the [OpenWeather Current Weather API](https://openweathermap.org/current) plus browser geolocation, and requires `WEATHER_API_KEY` in `js/config.js` to be set to a valid OpenWeather API key. Weather data is cached in `chrome.storage.local` for 15 minutes to avoid unnecessary requests. If geolocation is denied or unavailable, the widget falls back to a default city (`Patna`, configurable via `DEFAULT_CITY` in `js/weather.js`).
