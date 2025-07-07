import React, { useState, useEffect } from "react";
import { 
  Card, 
  CardBody, 
  Button, 
  Spinner, 
  Chip,
  Pagination
} from "@heroui/react";
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  ArrowTopRightOnSquareIcon
} from "@heroicons/react/24/outline";
import { useErrorToast } from "../context/ErrorToastContext";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://datapulse-ztzi.onrender.com/api';

const NewsPage = () => {
  const [newsData, setNewsData] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentIndices, setCurrentIndices] = useState({});
  const { showError } = useErrorToast();

  const categories = [
    { key: "business", label: "Business", color: "primary" },
    { key: "technology", label: "Technology", color: "secondary" },
    { key: "sports", label: "Sports", color: "success" },
    { key: "entertainment", label: "Entertainment", color: "warning" },
    { key: "health", label: "Health", color: "danger" },
    { key: "science", label: "Science", color: "default" }
  ];

  const fetchNewsByCategory = async (category) => {
    try {
      const response = await fetch(`${API_BASE_URL}/news/category/${category}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${category} news: ${response.status}`);
      }
      let data;
      try {
        data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (jsonError) {
        console.error(`JSON parsing error for ${category}:`, jsonError);
        return [];
      }
    } catch (error) {
      console.error(`Error fetching ${category} news:`, error);
      return [];
    }
  };

  const fetchAllNews = async () => {
    setLoading(true);
    const newsPromises = categories.map(cat => fetchNewsByCategory(cat.key));
    
    try {
      const results = await Promise.all(newsPromises);
      const newsObject = {};
      const indicesObject = {};
      
      categories.forEach((cat, index) => {
        const articles = Array.isArray(results[index]) ? results[index] : [];
        newsObject[cat.key] = articles;
        indicesObject[cat.key] = 0;
      });
      
      setNewsData(newsObject);
      setCurrentIndices(indicesObject);
    } catch (error) {
      console.error("Error fetching news:", error);
      if (typeof showError === 'function') {
        showError("Failed to fetch news data");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllNews();
  }, []);

  const nextArticle = (category) => {
    setCurrentIndices(prev => ({
      ...prev,
      [category]: Math.min(
        (prev[category] || 0) + 1,
        (newsData[category]?.length || 1) - 1
      )
    }));
  };

  const prevArticle = (category) => {
    setCurrentIndices(prev => ({
      ...prev,
      [category]: Math.max((prev[category] || 0) - 1, 0)
    }));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateText = (text, maxLength = 120) => {
    if (!text) return "";
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  };

  const openArticle = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-screen-2xl mx-auto">
          <div className="text-center py-20">
            <Spinner size="lg" />
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading latest news...</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">API URL: {API_BASE_URL}</p>
          </div>
        </div>
      </div>
    );
  }



  return (
    <div className="p-8">
      <div className="max-w-screen-2xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Latest News
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Top stories from the last 24 hours across all categories
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">API URL: {API_BASE_URL}</p>
          
          {/* API Rate Limit Notice */}
          {Object.values(newsData).every(articles => articles.length === 0) && (
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    API Rate Limit Reached
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                    <p>
                      The news API has reached its daily request limit. News articles will be available again after midnight UTC. 
                      This is a limitation of the free tier API service.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>



        {/* News Categories */}
        <div className="space-y-8">
          {categories.map((category) => {
            const articles = newsData[category.key] || [];
            const currentIndex = currentIndices[category.key] || 0;
            const currentArticle = articles[currentIndex];

            if (!currentArticle) {
              return (
                <Card key={category.key} className="card-light dark:card-dark">
                  <CardBody className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Chip color={category.color} variant="flat" size="lg">
                        {category.label}
                      </Chip>
                    </div>
                    <div className="text-center py-8">
                      <div className="text-gray-500 dark:text-gray-400 mb-2">
                        No {category.label.toLowerCase()} news available
                      </div>
                      <div className="text-sm text-gray-400 dark:text-gray-500">
                        This might be due to API rate limits. Please try again later.
                      </div>
                    </div>
                  </CardBody>
                </Card>
              );
            }

            return (
              <Card key={category.key} className="card-light dark:card-dark">
                <CardBody className="p-6">
                  {/* Category Header */}
                  <div className="flex items-center justify-between mb-6">
                    <Chip color={category.color} variant="flat" size="lg">
                      {category.label}
                    </Chip>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {currentIndex + 1} of {articles.length}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onClick={() => prevArticle(category.key)}
                          disabled={currentIndex === 0}
                        >
                          <ChevronLeftIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onClick={() => nextArticle(category.key)}
                          disabled={currentIndex === articles.length - 1}
                        >
                          <ChevronRightIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Article Content */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Image */}
                    <div className="lg:col-span-1">
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                        {currentArticle.image ? (
                          <img
                            src={currentArticle.image}
                            alt={currentArticle.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = "https://via.placeholder.com/400x225?text=News";
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="text-gray-400 text-center">
                              <div className="text-4xl mb-2">📰</div>
                              <div className="text-sm">No Image</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Article Details */}
                    <div className="lg:col-span-2 flex flex-col justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-2">
                          {currentArticle.title}
                        </h2>
                        {currentArticle.description && (
                          <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                            {truncateText(currentArticle.description, 200)}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <span className="font-medium">{currentArticle.source}</span>
                          <span>•</span>
                          <span>{formatDate(currentArticle.publishedAt)}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between mt-6">
                        <Button
                          color={category.color}
                          variant="solid"
                          endContent={<ArrowTopRightOnSquareIcon className="h-4 w-4" />}
                          onClick={() => openArticle(currentArticle.url)}
                        >
                          Read Full Article
                        </Button>
                        
                        {/* Pagination Dots */}
                        <div className="flex gap-1">
                          {articles.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentIndices(prev => ({
                                ...prev,
                                [category.key]: index
                              }))}
                              className={`w-2 h-2 rounded-full transition-colors ${
                                index === currentIndex
                                  ? `bg-${category.color}-500`
                                  : 'bg-gray-300 dark:bg-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>

        {/* Refresh Button */}
        <div className="text-center mt-10">
          <Button
            color="primary"
            variant="solid"
            onClick={fetchAllNews}
            disabled={loading}
            className="px-8 py-3"
          >
            {loading ? "Refreshing..." : "Refresh News"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NewsPage; 