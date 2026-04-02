
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { FileText, Search, Check, Database } from 'lucide-react';

interface KnowledgeBaseFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  created_at: string;
}

interface KnowledgeBaseSelectorProps {
  selectedFileIds: string[];
  onToggleFile: (fileId: string) => void;
  disabled?: boolean;
}

const KnowledgeBaseSelector: React.FC<KnowledgeBaseSelectorProps> = ({ selectedFileIds, onToggleFile, disabled }) => {
  const { user } = useAuth();
  const [files, setFiles] = useState<KnowledgeBaseFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchFiles = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('knowledge_base')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setFiles(data || []);
      } catch (error) {
        console.error('Error fetching knowledge base files:', error);
        // Fallback to localStorage if Supabase fails
        const savedFiles = localStorage.getItem(`kb_files_${user.id}`);
        if (savedFiles) {
          setFiles(JSON.parse(savedFiles));
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchFiles();
  }, [user]);

  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-800/30 rounded-xl border border-dashed border-gray-700">
        <Database className="mx-auto h-12 w-12 text-gray-600 mb-3" />
        <p className="text-gray-400 text-sm">Your Knowledge Base is empty.</p>
        <p className="text-gray-500 text-xs mt-1">Upload files in the Knowledge Base section first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <input
          type="text"
          placeholder="Search Knowledge Base..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-gray-800/50 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          disabled={disabled}
        />
      </div>

      <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
        {filteredFiles.map((file) => {
          const isSelected = selectedFileIds.includes(file.id);
          return (
            <button
              key={file.id}
              onClick={() => onToggleFile(file.id)}
              disabled={disabled}
              className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                isSelected 
                  ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' 
                  : 'bg-gray-800/30 border-gray-700/50 text-gray-400 hover:bg-gray-800/50 hover:border-gray-600'
              }`}
            >
              <div className="flex items-center space-x-3 text-left">
                <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-500/20' : 'bg-gray-700/50'}`}>
                  <FileText size={16} />
                </div>
                <div className="overflow-hidden">
                  <p className={`text-sm font-medium truncate ${isSelected ? 'text-blue-300' : 'text-gray-300'}`}>
                    {file.name}
                  </p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                    {(file.size / 1024 / 1024).toFixed(2)} MB • {new Date(file.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {isSelected && (
                <div className="bg-blue-500 rounded-full p-1">
                  <Check size={12} className="text-white" />
                </div>
              )}
            </button>
          );
        })}
        {filteredFiles.length === 0 && (
          <p className="text-center text-gray-500 text-sm py-4">No files match your search.</p>
        )}
      </div>
      
      <div className="flex items-center justify-between text-[10px] text-gray-500 uppercase tracking-widest px-1">
        <span>{selectedFileIds.length} files selected from Knowledge Base</span>
        <span>{files.length} total files available</span>
      </div>
    </div>
  );
};

export default KnowledgeBaseSelector;
