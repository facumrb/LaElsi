import { Request, Response } from 'express';
import { orm } from '../shared/db/orm.js';
import { User, UserRole } from './user.entity.js';
import { Client } from './client/client.entity.js';
import { Admin } from './admin/admin.entity.js';
import { generateToken } from '../shared/auth.middleware.js';
import { asyncHandler } from '../shared/errors/asyncHandler.js';
import { AppError } from '../shared/errors/appError.js';
import { ApiResponse } from '../shared/utils/apiResponse.js';

const login = asyncHandler(async (req: Request, res: Response) => {
  const em = orm.em;
  const { username, email, identifier, password } = req.body;
  const loginValue = identifier || username || email;

  if (!loginValue) {
    throw new AppError('Usuario o Email requerido', 400);
  }

  const user = await em.findOne(
    User,
    {
      $or: [{ email: loginValue }, { username: loginValue }]
    },
    {
      populate: ['photo']
    }
  );

  if (!user) {
    throw new AppError('Credenciales inválidas', 401);
  }

  const isValid = await user.verifyPassword(password);
  if (!isValid) {
    throw new AppError('Credenciales inválidas', 401);
  }

  // Generar Token
  const token = generateToken({
    id: user.id,
    role: user.role,
    email: user.email
  });

  return res.status(200).json(
    ApiResponse.success('Login exitoso', {
      token,
      user: {
        id: user.id,
        name: user.name,
        lastName: user.lastName,
        role: user.role,
        photo: user.photo
          ? {
              id: user.photo.id,
              fileName: user.photo.fileName
            }
          : null
      }
    })
  );
});

const register = asyncHandler(async (req: Request, res: Response) => {
  const em = orm.em;
  const { name, lastName, dni, phone, username, password, email, cuit, fiscalCondition, ...addressFields } = req.body;

  // Verificar duplicados (email o username) en ambas tablas
  const existingAdmin = await em.findOne(Admin, { $or: [{ email }, { username }] });
  const existingClient = await em.findOne(Client, { $or: [{ email }, { username }] });

  if (existingAdmin || existingClient) {
    throw new AppError('El usuario o email ya existe', 400);
  }

  // Crear Cliente por defecto
  const newClient = new Client();
  newClient.name = name;
  newClient.lastName = lastName;
  newClient.dni = dni;
  newClient.phone = phone;
  newClient.username = username;
  newClient.email = email;
  newClient.role = UserRole.Client;

  // Asignar campos de facturación si vienen
  if (cuit) newClient.cuit = cuit;
  if (fiscalCondition) newClient.fiscalCondition = fiscalCondition;

  // Asignar campos de dirección si vienen
  if (addressFields.street) newClient.street = addressFields.street;
  if (addressFields.streetNumber) newClient.streetNumber = Number(addressFields.streetNumber);
  if (addressFields.city) newClient.city = addressFields.city;
  if (addressFields.province) newClient.province = addressFields.province;
  if (addressFields.postalCode) newClient.postalCode = addressFields.postalCode;
  if (addressFields.floor) newClient.floor = addressFields.floor;
  if (addressFields.apartment) newClient.apartment = addressFields.apartment;

  await newClient.setPassword(password);

  em.persist(newClient);
  await em.flush();

  return res.status(201).json(ApiResponse.created('Usuario registrado exitosamente', { id: newClient.id }));
});

export { login, register };
