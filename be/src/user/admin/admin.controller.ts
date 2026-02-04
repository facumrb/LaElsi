import { Request, Response, NextFunction } from 'express';
import { Admin } from './admin.entity.js';
import { orm } from '../../shared/db/orm.js';
import { UserRole } from '../user.entity.js';

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
    const admin = await em.findOneOrFail(Admin, id, { populate: ['photo'] as any });
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
      photo: admin.photo?.fileName || null
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
    const admin = await em.findOneOrFail(Admin, id);
    res.status(200).json({ message: 'Administrador encontrado', data: admin });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

async function findAll(req: Request, res: Response) {
  const em = orm.em;
  try {
    const admins = await em.find(Admin, {});
    res.status(200).json({ message: 'Todos los Administradores fueron encontrados', data: admins });
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

// Actualizar información de cuenta del administrador
async function update(req: Request, res: Response) {
  const em = orm.em;
  try {
    const id = Number.parseInt(req.params.id);
    const adminToUpdate = await em.getReference(Admin, id);
    em.assign(adminToUpdate, req.body.sanitizedInput);

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
    const admin = em.findOneOrFail(Admin, { id });
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

export { sanitizeAdminInput, findAll, findOne, add, update, remove, getAccountInfo };
