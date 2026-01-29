import { Router } from 'express';
import { sanitizeAdminInput, findAll, findOne, add, update, remove, login, getAccountInfo } from './admin.controler.js';

export const adminRouter = Router();

// No se usan:
adminRouter.get('/', findAll);
adminRouter.get('/:id', findOne);
adminRouter.post('/', sanitizeAdminInput, add);

// Se usan:
adminRouter.post('/login', login); // Ruta para el login
adminRouter.get('/account/:id', getAccountInfo); // Obtener información de cuenta
adminRouter.delete('/:id', remove);
adminRouter.patch('/:id', sanitizeAdminInput, update);
// adminRouter.put('/account/:id', sanitizeAdminInput, updateAccount); // Actualizar información de cuenta
