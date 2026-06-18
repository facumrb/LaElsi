import path from 'path';

export const UPLOADS_BASE_PATH = path.join(process.cwd(), 'uploads');
export const USERS_PATH = path.join(UPLOADS_BASE_PATH, 'users');
export const PRODUCTS_PATH = path.join(UPLOADS_BASE_PATH, 'products');
