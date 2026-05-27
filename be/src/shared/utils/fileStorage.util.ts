import fs from 'fs/promises';
import path from 'path';

export class FileStorageUtil {
  /**
   * Elimina un archivo físico de forma segura, verificando que no escape del directorio base.
   * Útil para prevenir vulnerabilidades de Path Traversal (CWE-22).
   */
  static async safeDeleteFile(basePath: string, fileName: string): Promise<void> {
    const joinedPath = path.join(basePath, fileName);
    // Normalize path, removing any '..'
    const fullPath = path.normalize(joinedPath);
    // Verify the fullPath is contained within our basePath
    if (!fullPath.startsWith(basePath)) {
      console.warn('Invalid path specified!');
    } else {
      try {
        await fs.unlink(fullPath);
      } catch (err) {
        console.warn(`No se pudo borrar el archivo físico: ${err}`);
      }
    }
  }

  /**
   * Elimina un archivo temporal de Multer de forma segura.
   */
  static async deleteTempMulterFile(basePath: string, file: Express.Multer.File): Promise<void> {
    const safeBasename = path.basename(file.path);
    const fullPath = path.normalize(path.join(basePath, safeBasename));

    if (!fullPath.startsWith(basePath + path.sep) && fullPath !== basePath) {
      console.warn('Ruta de archivo temporal inválida detectada, omitiendo eliminación.');
      return;
    }

    try {
      await fs.unlink(fullPath);
    } catch (e) {
      console.warn('No se pudo borrar archivo temporal:', file.filename);
    }
  }

  /**
   * Elimina múltiples archivos temporales de Multer de forma segura.
   */
  static async deleteTempMulterFiles(basePath: string, files: Express.Multer.File[]): Promise<void> {
    for (const file of files) {
      await this.deleteTempMulterFile(basePath, file);
    }
  }
}
