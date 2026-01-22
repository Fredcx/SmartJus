import pdf from 'pdf-parse';
import fs from 'fs/promises';

export const extractTextFromPDF = async (input: string | Buffer): Promise<string> => {
  try {
    const dataBuffer = Buffer.isBuffer(input) ? input : await fs.readFile(input);
    const data = await pdf(dataBuffer);
    return data.text;
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
};