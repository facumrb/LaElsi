import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Filtro para aceptar solamente imágenes
const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('No es un archivo de imagen válido'), false);
  }
};

// 2. Función generadora de almacenamiento (Storage Factory)
// Recibe el nombre de la subcarpeta ('products' o 'users') y devuelve la configuración
const createStorage = (subFolder: string) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      // Ruta: raíz/uploads/products  o  raíz/uploads/users
      const uploadPath = path.join(process.cwd(), 'uploads', subFolder);

      // Creación de la carpeta (y subcarpetas) si no existen
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }

      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      // Generación de nombre único: uuid + extensión original
      const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    }
  });
};

// Configuración para PRODUCTOS
// Carpeta: uploads/products | Límite: 5MB
export const uploadProduct = multer({
  storage: createStorage('products'),
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Configuración para USUARIOS (Perfiles)
// Carpeta: uploads/users | Límite: 2MB
export const uploadProfile = multer({
  storage: createStorage('users'),
  fileFilter: fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }
});
