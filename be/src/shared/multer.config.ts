import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Definimos dónde se guardan
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Generamos un nombre único: uuid + extensión original
    // Ej: 5b78-4f5a... .jpg
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// Filtro para aceptar solo imágenes
const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('No es un archivo de imagen válido'), false);
  }
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // Límite de 5MB por foto
});
