import { Request, Response } from 'express';
import { orm } from '../shared/db/orm.js';
import { User, UserRole } from './user.entity.js';
import { Client } from './client/client.entity.js';
import { Admin } from './admin/admin.entity.js';
import { generateToken } from '../shared/auth.middleware.js';

async function login(req: Request, res: Response) {
  const em = orm.em;
  const { username, email, identifier, password } = req.body;
  const loginValue = identifier || username || email;

  if (!loginValue) {
    return res.status(400).json({ message: 'Usuario o Email requerido' });
  }

  try {
    // Intentamos buscar en Admin primero (o Client, da igual orden si son disjuntos)
    // Al ser clases abstractas/mapped superclass, consultar 'User' puede no funcionar si no es STI.
    // Buscamos manualmente en ambos para asegurar.

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
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const isValid = await user.verifyPassword(password);
    if (!isValid) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Generar Token
    const token = generateToken({
      id: user.id,
      role: user.role,
      email: user.email
    });

    // Recomendaciones:
    /*
    Bloqueo después de varios intentos fallidos
    Registro de auditoría para inicios de sesión: IP del usuario, fecha y hora, dispositivo utilizado
    Implementar sistema de tokens para manejar autenticación
    */

    return res.status(200).json({
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        name: user.name,
        last_name: user.last_name,
        role: user.role,
        photo: user.photo
          ? {
              id: user.photo.id,
              fileName: user.photo.fileName
            }
          : null
      }
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}

async function register(req: Request, res: Response) {
  const em = orm.em;
  const { name, last_name, dni, phone, username, password, email, cuit, fiscalCondition, ...addressFields } = req.body;

  try {
    // Verificar duplicados (email o username) en ambas tablas
    const existingAdmin = await em.findOne(Admin, { $or: [{ email }, { username }] });
    const existingClient = await em.findOne(Client, { $or: [{ email }, { username }] });

    if (existingAdmin || existingClient) {
      return res.status(400).json({ message: 'El usuario o email ya existe' });
    }

    // Crear Cliente por defecto
    const newClient = new Client();
    newClient.name = name;
    newClient.last_name = last_name;
    newClient.dni = dni;
    newClient.phone = phone;
    newClient.username = username;
    newClient.email = email;
    newClient.role = UserRole.CLIENT;

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

    return res.status(201).json({ message: 'Usuario registrado exitosamente', id: newClient.id });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}

export { login, register };
