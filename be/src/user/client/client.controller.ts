import { Request, Response, NextFunction } from 'express';
import { Client } from './client.entity.js';
import { orm } from '../../shared/db/orm.js';
import { UserRole } from '../user.entity.js';
import fs from 'fs/promises';
import path from 'path';

const USERS_PATH = path.join(process.cwd(), 'uploads', 'users');

function sanitizeClientInput(req: Request, res: Response, next: NextFunction) {
  req.body.sanitizedInput = {
    name: req.body.name,
    last_name: req.body.last_name,
    phone: req.body.phone,
    username: req.body.username,
    password: req.body.password,
    email: req.body.email,
    dni: req.body.dni,
    cuit: req.body.cuit,
    fiscalCondition: req.body.fiscalCondition,
    street: req.body.street,
    streetNumber: req.body.streetNumber,
    city: req.body.city,
    province: req.body.province,
    postalCode: req.body.postalCode,
    floor: req.body.floor,
    apartment: req.body.apartment
  };

  Object.keys(req.body.sanitizedInput).forEach((key) => {
    if (req.body.sanitizedInput[key] === undefined) {
      delete req.body.sanitizedInput[key];
    }
  });
  next();
}

// Obtener información de cuenta del cliente
async function getAccountInfo(req: Request, res: Response) {
  const em = orm.em;
  try {
    const id = Number.parseInt(req.params.id);
    const client = await em.findOneOrFail(Client, id, { populate: ['photo'] });
    // Filtrar los datos que se enviarán al cliente
    const accountInfo = {
      id: client.id,
      name: client.name,
      last_name: client.last_name,
      phone: client.phone,
      username: client.username,
      email: client.email,
      dni: client.dni,
      cuit: client.cuit,
      fiscalCondition: client.fiscalCondition,
      street: client.street,
      streetNumber: client.streetNumber,
      city: client.city,
      province: client.province,
      postalCode: client.postalCode,
      floor: client.floor,
      apartment: client.apartment,
      role: client.role,
      photo: client.photo
        ? {
            id: client.photo.id,
            fileName: client.photo.fileName
          }
        : null
    };

    res.status(200).json({ message: 'Información de cuenta obtenida', data: accountInfo });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

async function findOne(req: Request, res: Response) {
  const em = orm.em;
  try {
    const id = Number.parseInt(req.params.id);
    const client = await em.findOneOrFail(Client, id, { populate: ['photo'] });
    res.status(200).json({ message: 'Cliente encontrado', data: client });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

async function findAll(req: Request, res: Response) {
  const em = orm.em;
  try {
    const clients = await em.find(Client, {}, { populate: ['photo'] });
    res.status(200).json({ message: 'Todos los Clientes fueron encontrados', data: clients });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

async function searchClientByText(req: Request, res: Response) {
  const em = orm.em;
  const { query } = req.query;

  try {
    const clients = await em.find(
      Client,
      {
        $or: [{ name: { $like: `%${query}%` } }, { last_name: { $like: `%${query}%` } }, { username: { $like: `%${query}%` } }, { dni: { $like: `%${query}%` } }]
      },
      { populate: ['photo'] }
    );
    res.status(200).json({ message: 'Clientes encontrados', data: clients });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

async function add(req: Request, res: Response) {
  const em = orm.em;
  try {
    const client = new Client();
    const { password, ...rest } = req.body.sanitizedInput;
    em.assign(client, rest);

    client.role = UserRole.CLIENT;

    if (password) {
      await client.setPassword(password);
    }

    em.persist(client);
    await em.flush();
    res.status(201).json({ message: 'Cliente creado', data: client });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

// Actualizar información de cuenta del cliente
async function update(req: Request, res: Response) {
  const em = orm.em;
  try {
    const id = Number.parseInt(req.params.id);

    // Seguridad: Si no es Admin, solo puede actualizarse a sí mismo
    if (req.user?.role !== UserRole.ADMIN && req.user?.id !== id) {
      return res.status(403).json({ message: 'No tienes permisos para actualizar este perfil' });
    }

    const clientToUpdate = await em.getReference(Client, id);
    em.assign(clientToUpdate, req.body.sanitizedInput);
    await em.flush();
    res.status(200).json({ message: 'Información de cuenta actualizada' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

async function remove(req: Request, res: Response) {
  const em = orm.em;
  try {
    const id = Number.parseInt(req.params.id);
    const client = await em.findOneOrFail(Client, { id }, { populate: ['photo'] });

    // Si tiene foto, intentamos borrar el archivo físico
    if (client.photo) {
      const filePath = path.join(USERS_PATH, client.photo.fileName);
      try {
        await fs.unlink(filePath);
      } catch (err) {
        // Solo advertimos, no detenemos el proceso si el archivo ya no existe
        console.warn(`No se pudo borrar el archivo físico: ${err}`);
      }
    }
    em.remove(client);
    await em.flush();
    res.status(200).send({ message: 'Cliente eliminado' });
  } catch (error: any) {
    if (error.name === 'NotFoundError') {
      return res.status(404).json({ message: 'El cliente no existe' });
    }
    res.status(500).json({ message: error.message });
  }
}

export { sanitizeClientInput, findAll, findOne, searchClientByText, add, update, remove, getAccountInfo };
