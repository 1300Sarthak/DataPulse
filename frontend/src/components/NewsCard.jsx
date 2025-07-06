import React from "react";
import { Card, CardBody, Skeleton } from "@heroui/react";

const NewsCard = ({ 
  title, 
  source, 
  image, 
  publishedAt, 
  url, 
  loading = false 
}) => {
  const formatTime = (publishedAt) => {
    if (!publishedAt) return "Just now";
    
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

  const handleClick = () => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  if (loading) {
    return (
      <Card className="col-span-1 row-span-1 rounded-2xl shadow-md hover:scale-[1.02] transition-transform duration-200">
        <CardBody className="p-4">
          <div className="animate-pulse">
            <div className="h-20 bg-gray-200 rounded-lg mb-3"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
          </div>
        </CardBody>
      </Card>
    );
  }

  // Use <a> for accessibility and to ensure the whole card is clickable
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block col-span-1 row-span-1 rounded-2xl shadow-md hover:scale-[1.02] transition-transform duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
      tabIndex={0}
    >
      <Card className="rounded-2xl shadow-md h-full">
        <CardBody className="p-4">
          <div className="flex flex-col h-full">
            {/* Image */}
            <div className="relative mb-3">
              <img
                src={image ? image : "https://via.placeholder.com/300x150?text=News"}
                alt={title}
                className="w-full h-20 object-cover rounded-lg"
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/300x150?text=News";
                }}
                loading="lazy"
              />
              <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                {source}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2 mb-2">
                {title}
              </h4>
              <div className="text-xs text-gray-500">
                {formatTime(publishedAt)}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </a>
  );
};

export default NewsCard; 