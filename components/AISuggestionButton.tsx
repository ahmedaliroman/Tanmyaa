import React from 'react';

interface AISuggestionButtonProps {
    onClick: () => void;
    isLoading: boolean;
    disabled?: boolean;
    className?: string;
}

const SparklesIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M10 2.5a.75.75 0 01.75.75v.5a.75.75 0 01-1.5 0v-.5a.75.75 0 01.75-.75zM8.345 4.345a.75.75 0 011.06 0l.354.354a.75.75 0 01-1.06 1.06l-.354-.354a.75.75 0 010-1.06zm3.31 0a.75.75 0 011.06 0l.354.354a.75.75 0 11-1.06 1.06l-.354-.354a.75.75 0 010-1.06zM2.5 10a.75.75 0 01.75-.75h.5a.75.75 0 010 1.5h-.5a.75.75 0 01-.75-.75zm13.5 0a.75.75 0 01.75-.75h.5a.75.75 0 010 1.5h-.5a.75.75 0 01-.75-.75zM4.345 11.655a.75.75 0 011.06 0l.354.354a.75.75 0 01-1.06 1.06l-.354-.354a.75.75 0 010-1.06zm10.31 0a.75.75 0 011.06 0l.354.354a.75.75 0 11-1.06 1.06l-.354-.354a.75.75 0 010-1.06zM10 16.5a.75.75 0 01.75.75v.5a.75.75 0 01-1.5 0v-.5a.75.75 0 01.75-.75zM8.345 15.655a.75.75 0 011.06 0l.354.354a.75.75 0 01-1.06 1.06l-.354-.354a.75.75 0 010-1.06zm3.31 0a.75.75 0 011.06 0l.354.354a.75.75 0 11-1.06 1.06l-.354-.354a.75.75 0 010-1.06z" clipRule="evenodd" />
    </svg>
);

const AISuggestionButton: React.FC<AISuggestionButtonProps> = ({ onClick, isLoading, disabled, className = "" }) => {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={isLoading || disabled}
            className={`flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 disabled:text-gray-500 disabled:cursor-not-allowed transition ${className}`}
        >
            <SparklesIcon className={`w-4 h-4 ${isLoading ? 'animate-pulse' : ''}`} />
            {isLoading ? 'Thinking...' : 'Suggest'}
        </button>
    );
};

export default AISuggestionButton;
