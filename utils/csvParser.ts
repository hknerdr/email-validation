// utils/csvParser.ts

export const parseCSV = async (file: File): Promise<string[]> => {
  const text = await file.text();
  const lines = text.split('\n');
  const emails = lines
    .map((line) => line.trim())
    .filter((line) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(line)); // Enhanced regex for better email validation
  return emails;
};
