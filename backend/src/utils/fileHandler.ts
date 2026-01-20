import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

export const saveFile = async (
  file: any,
  subDir: string = ''
): Promise<{ path: string; filename: string }> => {
  const uploadPath = path.join(UPLOAD_DIR, subDir);
  
  // Criar diretório se não existir
  await fs.mkdir(uploadPath, { recursive: true });

  const fileExtension = path.extname(file.name);
  const filename = `${uuidv4()}${fileExtension}`;
  const filePath = path.join(uploadPath, filename);

  await file.mv(filePath);

  return {
    path: filePath,
    filename,
  };
};

export const deleteFile = async (filePath: string): Promise<void> => {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error('Error deleting file:', error);
  }
};

export const fileExists = async (filePath: string): Promise<boolean> => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};