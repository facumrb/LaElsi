import multer from 'multer';

// Filtro para aceptar solamente imágenes
const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('No es un archivo de imagen válido'), false);
  }
};

const storage = multer.memoryStorage();

// Configuración para PRODUCTOS
// Límite: 5MB
export const uploadProduct = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Configuración para USUARIOS (Perfiles)
// Límite: 2MB
export const uploadProfile = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }
});
