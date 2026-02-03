import { Request, Response } from 'express';
import { orm } from '../shared/db/orm.js';
import { User, UserRole } from './user.entity.js';
import { Client } from './client/client.entity.js';
import { Admin } from './admin/admin.entity.js';
import { generateToken } from '../shared/auth.middleware.js';

async function login(req: Request, res: Response) {
  const em = orm.em.fork();
  const { user, email, identifier, password } = req.body;
  const loginValue = identifier || user || email;

  if (!loginValue) {
    return res.status(400).json({ message: 'Usuario o Email requerido' });
  }

  try {
    // Intentamos buscar en Admin primero (o Client, da igual orden si son disjuntos)
    // Al ser clases abstractas/mapped superclass, consultar 'User' puede no funcionar si no es STI.
    // Buscamos manualmente en ambos para asegurar.

    let user: User | null = await em.findOne(Admin, {
      $or: [{ email: loginValue }, { user: loginValue }]
    });

    if (!user) {
      user = await em.findOne(Client, {
        $or: [{ email: loginValue }, { user: loginValue }]
      });
    }

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

    return res.status(200).json({
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role
      }
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}

async function register(req: Request, res: Response) {
  const em = orm.em.fork();
  const { name, last_name, phone, user, password, email, ...otherClientFields } = req.body;

  try {
    // Verificar duplicados (email o user) en ambas tablas
    const existingAdmin = await em.findOne(Admin, { $or: [{ email }, { user }] });
    const existingClient = await em.findOne(Client, { $or: [{ email }, { user }] });

    if (existingAdmin || existingClient) {
      return res.status(400).json({ message: 'El usuario o email ya existe' });
    }

    // Crear Cliente por defecto
    const newClient = new Client();
    newClient.name = name;
    newClient.last_name = last_name;
    newClient.phone = phone;
    newClient.user = user;
    newClient.email = email;
    newClient.role = UserRole.CLIENT;

    // Asignar campos específicos de cliente si vienen
    if (otherClientFields.street) newClient.street = otherClientFields.street;
    if (otherClientFields.streetNumber) newClient.streetNumber = Number(otherClientFields.streetNumber);
    if (otherClientFields.city) newClient.city = otherClientFields.city;
    // ... mapear el resto si es necesario o usar Object.assign con cuidado

    await newClient.setPassword(password);

    em.persist(newClient);
    await em.flush();

    return res.status(201).json({ message: 'Usuario registrado exitosamente', id: newClient.id });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}

export { login, register };
