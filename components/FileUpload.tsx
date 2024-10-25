import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';

const FileUpload = () => {
  const { dispatch } = useAppContext();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Validate file type
      if (!selectedFile.name.endsWith('.csv')) {
        dispatch({ 
          type: 'SET_ERROR', 
          payload: 'Please upload a CSV file' 
        });
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const handleFileUpload = async () => {
    if (!file) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: 'Please select a file first' 
      });
      return;
    }

    setIsUploading(true);
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const result = event.target?.result;
          if (typeof result === 'string') {
            // Split by common CSV delimiters and handle potential quoted emails
            const emails = result
              .split(/[\r\n,]+/)
              .map(email => email.trim().replace(/^["']|["']$/g, '')) // Remove quotes
              .filter(email => {
                // Basic email validation
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return email && emailRegex.test(email);
              });

            if (emails.length === 0) {
              throw new Error('No valid email addresses found in the file');
            }

            // Remove duplicates
            const uniqueEmails = [...new Set(emails)];
            
            dispatch({ type: 'SET_EMAILS', payload: uniqueEmails });
            dispatch({ 
              type: 'SET_ERROR', 
              payload: uniqueEmails.length !== emails.length 
                ? `Loaded ${uniqueEmails.length} unique emails (${emails.length - uniqueEmails.length} duplicates removed)`
                : `Loaded ${emails.length} emails successfully`
            });
          }
        } catch (error) {
          dispatch({ 
            type: 'SET_ERROR', 
            payload: error instanceof Error ? error.message : 'Failed to parse the file' 
          });
        }
      };

      reader.onerror = () => {
        dispatch({ 
          type: 'SET_ERROR', 
          payload: 'Error reading the file' 
        });
      };

      reader.readAsText(file);
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: 'Failed to process the file' 
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 items-center">
        <input 
          type="file" 
          accept=".csv"
          onChange={handleFileChange}
          className="border p-2 rounded"
        />
        <button
          onClick={handleFileUpload}
          disabled={!file || isUploading}
          className={`px-4 py-2 rounded ${
            !file || isUploading 
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {isUploading ? 'Processing...' : 'Upload Emails'}
        </button>
      </div>
      {file && (
        <p className="text-sm text-gray-600">
          Selected file: {file.name}
        </p>
      )}
    </div>
  );
};

export default FileUpload;