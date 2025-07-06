import React, { useState, useEffect } from "react";
import apiService from "../services/api";

const TOP_OPTIONS = [25, 50, 100];

const CryptoPage = () => {
  const [topN, setTopN] = useState(50);
  const [cryptos, setCryptos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    apiService.getCryptoPrices(topN)
      .then(data => {
        if (Array.isArray(data)) {
          setCryptos(data);
        } else if (data && data.detail) {
          setError(data.detail);
          setCryptos([]);
        } else {
          setError("Unexpected response from server.");
          setCryptos([]);
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [topN]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Top {topN} Cryptocurrencies</h1>
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
      {loading ? (
        <div className="text-center text-gray-500 dark:text-gray-100">Loading...</div>
      ) : error ? (
        <div className="text-center text-red-500">{error}</div>
      ) : Array.isArray(cryptos) && cryptos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {cryptos.map(crypto => (
            <div key={crypto.symbol} className="card-light dark:card-dark p-4 rounded shadow transition-colors">
              <div className="font-bold text-lg">{crypto.name} <span className="text-xs text-gray-500 dark:text-gray-300">({crypto.symbol})</span></div>
              <div className="mt-2 text-xl font-semibold">${crypto.price?.toLocaleString()}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 dark:text-gray-100">No data available.</div>
      )}
    </div>
  );
};

export default CryptoPage; 