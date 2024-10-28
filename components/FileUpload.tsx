// components/FileUpload.tsx

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { parseCSV } from '../utils/csvParser'; // Ensure this utility exists

interface FileUploadProps {
  className?: string;
  onEmailsUploaded: (emails: string[]) => void;
  maxEmailsPerBatch?: number; // Optional prop to display max limit
}

const FileUpload: React.FC<FileUploadProps> = ({ className = '', onEmailsUploaded, maxEmailsPerBatch = 500 }) => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploadedFiles(acceptedFiles);
    setError(null);

    try {
      const emails = await parseCSV(acceptedFiles[0]);
      
      if (emails.length > maxEmailsPerBatch * 10) { // Assuming a maximum total of 5000 emails
        setError(`Uploaded file contains ${emails.length} emails. Please ensure the total number does not exceed ${maxEmailsPerBatch * 10}.`);
        onEmailsUploaded([]);
        return;
      }

      onEmailsUploaded(emails);
    } catch (error) {
      console.error('Error parsing CSV:', error);
      setError('Failed to parse the uploaded file. Please ensure it is a valid CSV or TXT file.');
      onEmailsUploaded([]);
    }
  }, [onEmailsUploaded, maxEmailsPerBatch]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'text/plain': ['.txt'],
    },
    multiple: false,
  });

  return (
    <div className={className}>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ease-in-out ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          stroke="currentColor"
          fill="none"
          viewBox="0 0 48 48"
          aria-hidden="true"
        >
          <path
            d="M28 8H12a4 4 0 00-4 4v20a4 4 0 004 4h20a4 4 0 004-4V16a4 4 0 00-4-4z"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M28 8v20m0 0l-4-4m4 4l4-4"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <p className="mt-4 text-sm text-gray-600">
          {isDragActive
            ? 'Drop the file here...'
            : `Drag & drop a TXT or CSV file here, or click to select files. (Max per batch: ${maxEmailsPerBatch} emails)`}
        </p>
      </div>

      {/* Display Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Uploaded File:</h4>
          <ul className="list-disc list-inside text-sm text-gray-600">
            {uploadedFiles.map((file, index) => (
              <li key={index}>{file.name}</li>
            ))}
          </ul>
          {error && (
            <p className="text-red-500 text-sm mt-2">{error}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
