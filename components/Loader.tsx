import React from 'react';

const Loader: React.FC = () => {
  return (
    <div className="text-center py-10" aria-label="Loading content">
      <div className="ios-loader mx-auto">
        <div className="ios-loader-bar"></div>
        <div className="ios-loader-bar"></div>
        <div className="ios-loader-bar"></div>
        <div className="ios-loader-bar"></div>
        <div className="ios-loader-bar"></div>
        <div className="ios-loader-bar"></div>
        <div className="ios-loader-bar"></div>
        <div className="ios-loader-bar"></div>
        <div className="ios-loader-bar"></div>
        <div className="ios-loader-bar"></div>
        <div className="ios-loader-bar"></div>
        <div className="ios-loader-bar"></div>
      </div>
      <p className="mt-6 text-lg font-semibold text-gray-200 tracking-wider">GENERATING</p>
      <p className="text-gray-400 text-sm">Please wait while the system processes your request.</p>
    </div>
  );
};

export default Loader;