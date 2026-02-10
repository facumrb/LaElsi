import { Request, Response, NextFunction } from 'express';
import { Admin } from './admin.entity.js';
import { orm } from '../../shared/db/orm.js';
import { UserRole } from '../user.entity.js';
import fs from 'fs/promises';
import path from 'path';

const USERS_PATH = path.join(process.cwd(), 'uploads', 'users');

function sanitizeAdminInput(req: Request, res: Response, next: NextFunction) {
  req.body.sanitizedInput = {
    name: req.body.name,
    last_name: req.body.last_name,
    phone: req.body.phone,
    username: req.body.username,
    password: req.body.password,
    email: req.body.email,
    dni: req.body.dni
  };

  Object.keys(req.body.sanitizedInput).forEach((key) => {
    if (req.body.sanitizedInput[key] === undefined) {
      delete req.body.sanitizedInput[key];
    }
  });
  next();
}

// Obtener información de cuenta del administrador
async function getAccountInfo(req: Request, res: Response) {
  const em = orm.em;
  try {
    const id = Number.parseInt(req.params.id);
    const admin = await em.findOneOrFail(Admin, id, { populate: ['photo'] });
    // Filtrar los datos que se enviarán al cliente
    const accountInfo = {
      id: admin.id,
      name: admin.name,
      last_name: admin.last_name,
      phone: admin.phone,
      username: admin.username,
      email: admin.email,
      dni: admin.dni,
      role: admin.role,
      photo: admin.photo
        ? {
            id: admin.photo.id,
            fileName: admin.photo.fileName
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
    const admin = await em.findOneOrFail(Admin, id, { populate: ['photo'] });
    res.status(200).json({ message: 'Administrador encontrado', data: admin });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

async function findAll(req: Request, res: Response) {
  const em = orm.em;
  try {
    const admins = await em.find(Admin, {}, { populate: ['photo'] });
    res.status(200).json({ message: 'Todos los Administradores fueron encontrados', data: admins });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

async function searchAdminByText(req: Request, res: Response) {
  const em = orm.em;
  const { query } = req.query;

  try {
    const admins = await em.find(
      Admin,
      {
        $or: [{ name: { $like: `%${query}%` } }, { last_name: { $like: `%${query}%` } }, { username: { $like: `%${query}%` } }, { dni: { $like: `%${query}%` } }]
      },
      { populate: ['photo'] }
    );
    res.status(200).json({ message: 'Administradores encontrados', data: admins });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

async function add(req: Request, res: Response) {
  const em = orm.em;
  try {
    const admin = new Admin();
    // Asignar propiedades manualmente o con assign, pero cuidando el password
    const { password, ...rest } = req.body.sanitizedInput;
    em.assign(admin, rest);

    admin.role = UserRole.ADMIN;

    if (password) {
      await admin.setPassword(password);
    } // Si no hay password, fallará en la base si es required.

    em.persist(admin);
    await em.flush();
    res.status(201).json({ message: 'Administrador creado', data: admin });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

// Actualizar información de la cuenta del administrador
async function update(req: Request, res: Response) {
  const em = orm.em;
  try {
    const id = Number.parseInt(req.params.id);
    const adminToUpdate = await em.findOneOrFail(Admin, id);

    const { password, ...rest } = req.body.sanitizedInput;

    em.assign(adminToUpdate, rest);

    if (password) {
      await adminToUpdate.setPassword(password);
    }

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
    const admin = await em.findOneOrFail(Admin, { id }, { populate: ['photo'] });

    // Si tiene foto, intentamos borrar el archivo físico
    if (admin.photo) {
      const filePath = path.join(USERS_PATH, admin.photo.fileName);
      try {
        await fs.unlink(filePath);
      } catch (err) {
        // Solo advertimos, no detenemos el proceso si el archivo ya no existe
        console.warn(`No se pudo borrar el archivo físico: ${err}`);
      }
    }

    em.remove(admin);
    await em.flush();
    res.status(200).send({ message: 'Administrador eliminado' });
  } catch (error: any) {
    if (error.name === 'NotFoundError') {
      return res.status(404).json({ message: 'El administrador no existe' });
    }
    res.status(500).json({ message: error.message });
  }
}

export { sanitizeAdminInput, findOne, findAll, searchAdminByText, add, update, remove, getAccountInfo };
