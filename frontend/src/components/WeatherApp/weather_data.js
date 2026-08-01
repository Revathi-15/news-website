const WeatherData = ({ weatherData, weather, city, windData }) => {
  const fmt = (ts) => {
    if (!ts) return "—";
    const d = new Date(ts * 1000);
    return `${d.getHours()}:${d.getMinutes().toString().padStart(2, "0")}`;
  };

  // Emoji icons — clear, readable at any size, no SVG box needed
  const weatherEmoji = (main) => {
    const m = (main || "").toLowerCase();
    if (m.includes("thunder"))  return "⛈️";
    if (m.includes("rain") || m.includes("drizzle")) return "🌧️";
    if (m.includes("snow"))     return "❄️";
    if (m.includes("clear"))    return "☀️";
    if (m.includes("cloud"))    return "☁️";
    if (m.includes("mist") || m.includes("fog")) return "🌫️";
    return "🌤️";
  };

  const stats = [
    { label: "Sunrise",  emoji: "🌅", value: fmt(city?.sunrise) },
    { label: "Sunset",   emoji: "🌇", value: fmt(city?.sunset)  },
    { label: "Humidity", emoji: "💧", value: weatherData?.humidity ? `${weatherData.humidity}%` : "—" },
    { label: "Wind",     emoji: "💨", value: windData?.speed    ? `${windData.speed} mph`        : "—" },
    { label: "Pressure", emoji: "🌡️", value: weatherData?.pressure ? `${weatherData.pressure} hPa` : "—" },
  ];

  return (
    <div className="wd-root">

      {/* ── Hero temperature block ── */}
      <div className="wd-hero">
        <div className="wd-emoji">{weatherEmoji(weather?.main)}</div>
        <div className="wd-temp">{weatherData?.temp ? `${Math.round(weatherData.temp)}°C` : "—"}</div>
        <div className="wd-desc">{weather?.description || ""}</div>

        {/* Min / Max inline under description */}
        <div className="wd-minmax">
          <span>
            <span className="wd-mm-label">Low</span>
            {weatherData?.temp_min ? `${Math.round(weatherData.temp_min)}°` : "—"}
          </span>
          <span className="wd-mm-sep">·</span>
          <span>
            <span className="wd-mm-label">High</span>
            {weatherData?.temp_max ? `${Math.round(weatherData.temp_max)}°` : "—"}
          </span>
          <span className="wd-mm-sep">·</span>
          <span>
            <span className="wd-mm-label">Feels</span>
            {weatherData?.feels_like ? `${Math.round(weatherData.feels_like)}°` : "—"}
          </span>
        </div>
      </div>

      {/* ── Stats strip — all 5 in one horizontal row ── */}
      <div className="wd-stats-strip">
        {stats.map((s) => (
          <div key={s.label} className="wd-stat">
            <span className="wd-stat-emoji">{s.emoji}</span>
            <span className="wd-stat-value">{s.value}</span>
            <span className="wd-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

    </div>
  );
};

export default WeatherData;
