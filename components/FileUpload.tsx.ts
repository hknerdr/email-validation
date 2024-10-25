import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';

export const FileUpload = () => {
  const { dispatch } = useAppContext();
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleFileUpload = () => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (text) {
        const emails = text.split(/\r?\n/).map((line) => line.trim()).filter((line) => line);
        dispatch({ type: 'SET_EMAILS', payload: emails });
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
