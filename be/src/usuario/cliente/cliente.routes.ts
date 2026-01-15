import { Router } from 'express';
import { sanitizeClienteInput, findAll, findOne, add, update, remove, login, getAccountInfo } from './cliente.controler.js';

export const clienteRouter = Router();

// No se usan:
clienteRouter.get('/', findAll);
clienteRouter.get('/:id', findOne);
clienteRouter.post('/', sanitizeClienteInput, add);

// Se usan:
clienteRouter.post('/login', login); // Ruta para el login
clienteRouter.get('/account/:id', getAccountInfo); // Obtener información de cuenta
clienteRouter.delete('/:id', remove);
clienteRouter.patch('/:id', sanitizeClienteInput, update);
// clienteRouter.put('/account/:id', sanitizeClienteInput, updateAccount); // Actualizar información de cuenta
