import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';

const FileUpload = () => {
  const { dispatch } = useAppContext();
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
      console.log('File selected:', e.target.files[0].name); // Debugging log
    }
  };

  const handleFileUpload = () => {
    if (!file) {
      console.error('No file selected'); // Debugging log
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        const emails = result
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter((line) => line);

        console.log('Parsed emails:', emails); // Debugging log
        dispatch({ type: 'SET_EMAILS', payload: emails });
        console.log('Emails dispatched to state'); // Debugging log
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Unable to read the file. Please ensure it is a text-based CSV.' });
        console.error('File reading failed or file format not supported'); // Debugging log
      }
    };
    reader.readAsText(file);
  };

  return (
    <div>
      <input type="file" accept=".csv" onChange={handleFileChange} />
      <button onClick={handleFileUpload} disabled={!file}>
        Upload Emails
      </button>
    </div>
  );
};

export default FileUpload;
