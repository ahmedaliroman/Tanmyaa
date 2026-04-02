
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { FileText, Trash2, Upload, Database, Search, Info } from 'lucide-react';

interface KnowledgeBaseFile {
    id: string;
    name: string;
    size: number;
    type: string;
    url: string;
    created_at: string;
}

const KnowledgeBaseManager: React.FC = () => {
    const { user } = useAuth();
    const [files, setFiles] = useState<KnowledgeBaseFile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchFiles = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('knowledge_base')
                .select('*')
                .eq('user_id', user?.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setFiles(data || []);
        } catch (error) {
            console.error('Error fetching knowledge base files:', error);
            // Fallback to local storage if table doesn't exist
            const saved = localStorage.getItem(`kb_files_${user?.id}`);
            if (saved) setFiles(JSON.parse(saved));
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchFiles();
        }
    }, [user, fetchFiles]);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const uploadedFiles = event.target.files;
        if (!uploadedFiles || uploadedFiles.length === 0 || !user) return;

        setIsUploading(true);
        const newFiles: KnowledgeBaseFile[] = [];

        for (let i = 0; i < uploadedFiles.length; i++) {
            const file = uploadedFiles[i];
            const fileName = `${Date.now()}_${file.name}`;
            const filePath = `knowledge_base/${user.id}/${fileName}`;

            try {
                // 1. Upload to Storage
                const { error: uploadError } = await supabase.storage
                    .from('documents')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                // 2. Get Public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('documents')
                    .getPublicUrl(filePath);

                // 3. Save to Database
                const newFile = {
                    user_id: user.id,
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    url: publicUrl,
                };

                const { data, error: dbError } = await supabase
                    .from('knowledge_base')
                    .insert([newFile])
                    .select();

                if (dbError) {
                    // Fallback to local storage
                    const localFile = { ...newFile, id: Math.random().toString(36).substr(2, 9), created_at: new Date().toISOString() };
                    const currentLocal = JSON.parse(localStorage.getItem(`kb_files_${user.id}`) || '[]');
                    localStorage.setItem(`kb_files_${user.id}`, JSON.stringify([localFile, ...currentLocal]));
                    newFiles.push(localFile as KnowledgeBaseFile);
                } else if (data) {
                    newFiles.push(data[0]);
                }
            } catch (error) {
                console.error('Upload error:', error);
                toast.error(`Failed to upload ${file.name}`);
            }
        }

        if (newFiles.length > 0) {
            setFiles(prev => [...newFiles, ...prev]);
            toast.success(`Successfully uploaded ${newFiles.length} file(s) to your Knowledge Base.`);
        }
        setIsUploading(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to remove this document from your Knowledge Base?')) return;

        try {
            // 1. Delete from Database
            const { error: dbError } = await supabase
                .from('knowledge_base')
                .delete()
                .eq('id', id);

            if (dbError) {
                // Fallback delete from local storage
                const currentLocal = JSON.parse(localStorage.getItem(`kb_files_${user?.id}`) || '[]');
                const filtered = currentLocal.filter((f: KnowledgeBaseFile) => f.id !== id);
                localStorage.setItem(`kb_files_${user?.id}`, JSON.stringify(filtered));
            }

            // 2. Delete from Storage (optional, but good practice)
            // Extract path from URL if possible
            
            setFiles(prev => prev.filter(f => f.id !== id));
            toast.success('Document removed.');
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Failed to delete document.');
        }
    };

    const filteredFiles = files.filter(f => 
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (!user) return null;

    return (
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-white/10 bg-gradient-to-r from-blue-500/10 to-transparent">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400">
                            <Database className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Knowledge Base</h2>
                            <p className="text-gray-400 text-sm">Feed the AI with your own urban planning data, reports, and libraries.</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <label className="cursor-pointer bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20">
                            <Upload className="w-4 h-4" />
                            {isUploading ? 'Uploading...' : 'Upload Data'}
                            <input type="file" multiple className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                        </label>
                    </div>
                </div>
            </div>

            <div className="p-8">
                <div className="flex flex-col md:flex-row gap-6 mb-8">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input 
                            type="text" 
                            placeholder="Search your library..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-blue-500/50 transition-all"
                        />
                    </div>
                    
                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/5 border border-blue-500/10 rounded-2xl text-blue-300 text-sm">
                        <Info className="w-4 h-4" />
                        <span>The AI uses these files as primary references for all generations.</span>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                        <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                        <p className="text-gray-500 animate-pulse">Accessing your library...</p>
                    </div>
                ) : filteredFiles.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredFiles.map((file) => (
                            <div key={file.id} className="group relative bg-white/5 border border-white/10 rounded-2xl p-4 hover:border-blue-500/30 hover:bg-white/10 transition-all duration-300">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center space-x-3 overflow-hidden">
                                        <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center text-blue-400 flex-shrink-0">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div className="overflow-hidden">
                                            <h4 className="text-white font-medium truncate pr-8" title={file.name}>{file.name}</h4>
                                            <p className="text-gray-500 text-xs">{formatSize(file.size)} • {new Date(file.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={() => handleDelete(file.id)}
                                        className="absolute top-4 right-4 p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 text-gray-600">
                            <Database className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Your Knowledge Base is Empty</h3>
                        <p className="text-gray-400 max-w-sm mx-auto mb-8">
                            Upload your urban planning reports, data sets, and library references to give the AI a deeper understanding of your specific context.
                        </p>
                        <label className="cursor-pointer bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-xl font-bold transition-all">
                            Start Feeding the AI
                            <input type="file" multiple className="hidden" onChange={handleFileUpload} />
                        </label>
                    </div>
                )}
            </div>
        </div>
    );
};

export default KnowledgeBaseManager;
