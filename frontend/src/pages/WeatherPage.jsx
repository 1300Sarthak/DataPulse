import React, { useState } from "react";

const TOP_OPTIONS = [25, 50, 100];

const WeatherPage = () => {
  const [topN, setTopN] = useState(50);

  // Placeholder data
  const cities = Array.from({ length: topN }, (_, i) => ({
    name: `City ${i + 1}`,
    temp: Math.floor(Math.random() * 35),
    desc: "Clear Sky"
  }));

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Top {topN} Cities (Weather)</h1>
        <select
          className="border rounded px-3 py-1 dark:bg-gray-800 dark:text-white"
          value={topN}
          onChange={e => setTopN(Number(e.target.value))}
        >
          {TOP_OPTIONS.map(opt => (
            <option key={opt} value={opt}>Top {opt}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {cities.map(city => (
          <div key={city.name} className="card-light dark:card-dark p-4 rounded shadow transition-colors">
            <div className="font-bold text-lg">{city.name}</div>
            <div className="text-sm text-gray-500 dark:text-gray-100">{city.desc}</div>
            <div className="mt-2 text-xl font-semibold">{city.temp}&deg;C</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeatherPage; 