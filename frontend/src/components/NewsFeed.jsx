import React, { useState, useEffect } from "react";
import { Link, Skeleton } from "@heroui/react";
import { useApiService } from '../services/api';

// Error Boundary Component
class NewsErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("NewsFeed Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-center">
          <div className="text-red-500 mb-2">
            <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-sm">Something went wrong loading news</p>
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="text-blue-500 hover:text-blue-700 text-sm underline"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const NewsFeed = () => {
  const apiService = useApiService();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNews = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiService.getNews();
      setNews(data);
    } catch (err) {
      setError("Failed to load news");
      console.error("News fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatTime = (publishedAt) => {
    const now = new Date();
    const published = new Date(publishedAt);
    const diffInHours = Math.floor((now - published) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const handleNewsClick = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (error) {
    return (
      <div className="p-4 text-center">
        <div className="text-red-500 mb-2">
          <svg className="w-6 h-6 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm">{error}</p>
        </div>
        <button
          onClick={fetchNews}
          className="text-blue-500 hover:text-blue-700 text-sm underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Latest News</h3>
        <p className="text-sm text-gray-500">Top headlines from around the world</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="p-3 border rounded-lg">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/4 mb-1" />
              <Skeleton className="h-3 w-1/6" />
            </div>
          ))}
        </div>
      ) : (
        <ul className="space-y-2">
          {news.map((item) => (
            <li
              key={item.id}
              className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
              onClick={() => handleNewsClick(item.url)}
            >
              <div className="flex flex-col space-y-1">
                <h4 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2">
                  {item.title}
                </h4>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="font-medium">{item.source}</span>
                  <span>{formatTime(item.publishedAt)}</span>
                </div>
                <Link
                  href={item.url}
                  className="text-blue-500 hover:text-blue-700 text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  Read more 
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// Wrapped component with error boundary
const NewsFeedWithErrorBoundary = () => (
  <NewsErrorBoundary>
    <NewsFeed />
  </NewsErrorBoundary>
);

export default NewsFeedWithErrorBoundary; 