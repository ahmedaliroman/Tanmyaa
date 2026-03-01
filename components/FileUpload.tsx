
import React, { useCallback, useState } from 'react';

interface FileUploadProps {
  files: File[];
  setFiles: (files: File[] | ((prevFiles: File[]) => File[])) => void;
  disabled: boolean;
}

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

const FileUpload: React.FC<FileUploadProps> = ({ files, setFiles, disabled }) => {
  const [error, setError] = useState<string | null>(null);

  const processFiles = useCallback((newFiles: File[]) => {
    setError(null);
    const validFiles: File[] = [];
    let oversizedFilesExist = false;

    for (const file of newFiles) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        oversizedFilesExist = true;
      } else {
        validFiles.push(file);
      }
    }

    if (oversizedFilesExist) {
      setError(`One or more files exceed the 50MB size limit and were not added.`);
    }

    if (validFiles.length > 0) {
      setFiles((prevFiles) => [...prevFiles, ...validFiles]);
    }
  }, [setFiles]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      processFiles(Array.from(event.target.files));
      event.target.value = ''; // Allow re-uploading the same file if removed
    }
  };

  const removeFile = (fileToRemove: File) => {
    setFiles(files.filter(file => file !== fileToRemove));
    setError(null);
  };

  const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (disabled) return;
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      processFiles(Array.from(event.dataTransfer.files));
      event.dataTransfer.clearData();
    }
  }, [disabled, processFiles]);

  const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div>
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        className="mt-2 flex flex-col items-center justify-center p-6 border border-white/10 rounded-xl cursor-pointer hover:border-blue-400/50 transition-colors bg-black/20"
      >
        <div className="space-y-1 text-center">
            <svg className="mx-auto h-10 w-10 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" /></svg>
            <div className="flex text-sm text-gray-300">
                <label htmlFor="file-upload" className="relative cursor-pointer bg-transparent rounded-md font-semibold text-blue-400 hover:text-blue-300 focus-within:outline-none">
                <span>Click to upload</span>
                <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple onChange={handleFileChange} disabled={disabled} />
                </label>
                <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-gray-500">PDF, DOCX, TXT, etc. (Max 50MB each)</p>
        </div>
      </div>
      {error && (
        <div className="mt-2 text-sm text-red-400 bg-red-900/30 border border-red-500/50 p-2 rounded-md">
          {error}
        </div>
      )}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-300">Attached files:</h4>
          <ul className="divide-y divide-white/10 rounded-md border border-white/10 bg-black/20">
            {files.map((file, index) => (
              <li key={index} className="flex items-center justify-between py-2 px-3 text-sm">
                <span className="truncate text-gray-300">{file.name}</span>
                <button onClick={() => removeFile(file)} disabled={disabled} className="ml-4 text-red-400 hover:text-red-300 disabled:text-gray-500 text-lg font-bold">&times;</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
