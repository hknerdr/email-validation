import React, { useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { parseCSV } from '../utils/csvParser';

const FileUpload: React.FC = () => {
  const { dispatch } = useAppContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const emails = await parseCSV(file);
      dispatch({ type: 'SET_EMAILS', payload: emails });
    }
  };

  return (
    <div>
      <input
        type="file"
        accept=".csv"
        ref={fileInputRef}
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />
      <button onClick={() => fileInputRef.current?.click()}>Upload CSV</button>
    </div>
  );
};

export default FileUpload;
