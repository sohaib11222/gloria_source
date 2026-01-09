import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ArrowLeft, Search, AlertCircle, FileQuestion, Globe } from 'lucide-react';

const NotFound: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get base path for navigation
  const basePath = import.meta.env.PROD ? '/source' : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-100 flex items-center justify-center px-4 py-12">
      <div className="max-w-3xl w-full">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-8 md:p-12">
          {/* 404 Number with Animation */}
          <div className="mb-8 text-center">
            <div className="relative inline-block mb-6">
              <h1 className="text-9xl md:text-[12rem] font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4 animate-pulse">
                404
              </h1>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 opacity-10 blur-3xl -z-10"></div>
            </div>
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="p-2 bg-orange-100 rounded-full">
                <AlertCircle className="w-7 h-7 text-orange-600" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Page Not Found</h2>
            </div>
            <p className="text-lg md:text-xl text-gray-600 max-w-md mx-auto mb-2">
              Oops! The page you're looking for doesn't exist or has been moved.
            </p>
            {location.pathname && (
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
                <FileQuestion className="w-4 h-4 text-gray-500" />
                <code className="text-sm text-gray-700 font-mono">{location.pathname}</code>
              </div>
            )}
          </div>

          {/* Illustration */}
          <div className="mb-12 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-200 to-indigo-200 rounded-full blur-2xl opacity-50 animate-pulse"></div>
              <div className="relative inline-flex items-center justify-center w-40 h-40 bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 rounded-full border-4 border-white shadow-xl">
                <Search className="w-20 h-20 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
            >
              <ArrowLeft className="w-5 h-5" />
              Go Back
            </button>
            <button
              onClick={() => navigate(`${basePath}/source`)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <Home className="w-5 h-5" />
              Go to Dashboard
            </button>
            <button
              onClick={() => navigate(`${basePath}/docs-fullscreen`)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <Globe className="w-5 h-5" />
              View Documentation
            </button>
          </div>

          {/* Help Section */}
          <div className="mt-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl">
            <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Need Help?
            </h3>
            <p className="text-sm text-blue-800 mb-3">
              If you believe this is an error, here are some things you can try:
            </p>
            <ul className="text-sm text-blue-800 space-y-2 list-disc list-inside">
              <li>Check the URL for typos or errors</li>
              <li>Go back to the previous page</li>
              <li>Navigate to the Dashboard or Documentation</li>
              <li>Contact support if the problem persists</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

