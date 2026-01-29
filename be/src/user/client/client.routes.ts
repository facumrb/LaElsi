import { Router } from 'express';
import { sanitizeClientInput, findAll, findOne, add, update, remove, login, getAccountInfo } from './client.controler.js';

export const clientRouter = Router();

// No se usan:
clientRouter.get('/', findAll);
clientRouter.get('/:id', findOne);
clientRouter.post('/', sanitizeClientInput, add);

// Se usan:
clientRouter.post('/login', login); // Ruta para el login
clientRouter.get('/account/:id', getAccountInfo); // Obtener información de cuenta
clientRouter.delete('/:id', remove);
clientRouter.patch('/:id', sanitizeClientInput, update);
// clientRouter.put('/account/:id', sanitizeClienteInput, updateAccount); // Actualizar información de cuenta
