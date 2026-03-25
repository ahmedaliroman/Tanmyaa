import React from 'react';

interface AISuggestionButtonProps {
    onClick: () => void;
    isLoading: boolean;
    disabled?: boolean;
    className?: string;
}

const AISuggestionButton: React.FC<AISuggestionButtonProps> = ({ onClick, isLoading, disabled, className = "" }) => {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={isLoading || disabled}
            className={`flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 disabled:text-gray-500 disabled:cursor-not-allowed transition ${className}`}
        >
            {isLoading ? 'Thinking...' : 'Suggest'}
        </button>
    );
};

export default AISuggestionButton;
