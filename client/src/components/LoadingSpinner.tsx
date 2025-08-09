import React from 'react';

export const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-screen">
    <div className="relative">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-opacity-50"></div>
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-purple-500 border-opacity-50 absolute top-0 left-0" style={{ animationDelay: '-0.5s' }}></div>
    </div>
  </div>
);

interface LoadingSkeletonProps {
  className?: string;
  count?: number;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ className = '', count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`animate-pulse bg-gray-700/50 rounded-lg ${className}`}
        />
      ))}
    </>
  );
};