import { Request, Response, NextFunction } from 'express';
import { Admin } from './admin.entity.js';
import { orm } from '../../shared/db/orm.js';
// import bcrypt from 'bcryptjs';
// Crear endpoint, verificar credencial y manejar respuesta.
import { UserRole } from '../user.entity.js';

const em = orm.em;

function sanitizeAdminInput(req: Request, res: Response, next: NextFunction) {
  req.body.sanitizedInput = {
    name: req.body.name,
    last_name: req.body.last_name,
    phone: req.body.phone,
    user: req.body.user,
    password: req.body.password,
    email: req.body.email
    // address: req.body.address,
    // registration_date: req.body.registration_date,
    // photo: req.body.photo,
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
  try {
    const id = Number.parseInt(req.params.id);
    const admin = await em.findOneOrFail(Admin, id);
    // Filtrar los datos que se enviarán al cliente
    const accountInfo = {
      id: admin.id,
      name: admin.name,
      last_name: admin.last_name,
      phone: admin.phone,
      user: admin.user,
      password: admin.password,
      email: admin.email
      // photo: admin.photo,
      // address: admin.address,
      // registration_date: admin.registration_date,
      // password: admin.password, // Considera no enviar la contraseña en la respuesta
    };

    res.status(200).json({ message: 'Información de cuenta obtenida', data: accountInfo });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

async function findOne(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id);
    const admin = await em.findOneOrFail(Admin, id);
    res.status(200).json({ message: 'Administrador encontrado', data: admin });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

//Agregar Políticas de Contraseña y Autenticación y Tokens

async function login(req: Request, res: Response) {
  const { user, password } = req.body;

  // Validaciones para asegurarse de que el usuario y la contraseña fueron ingresados
  /*if (!usuario) {
    return res.status(400).json({ message: 'El usuario es requerido' });
  }
  if (!password) {
    return res.status(400).json({ message: 'La contraseña es requerida' });
  }*/

  try {
    // Buscar el administrador por usuario y contraseña
    const admin = await em.findOneOrFail(Admin, { user, password });

    if (!admin) {
      return res.status(401).json({ message: 'Usuario o contraseña incorrecta' });
    }
    // Este enfoque es incorrecto porque no se deben almacenar contraseñas en texto plano en la base de datos. Las contraseñas deberían ser almacenadas en forma hasheada por razones de seguridad.
    // En el futuro generar un token de autenticación

    /* Comparar la contraseña proporcionada con la contraseña hasheada
    const passwordValida = await bcrypt.compare(password, administrador.password);

    if (!passwordValida) {
      return res.status(401).json({ message: 'Usuario o contraseña incorrecta' });
    }
    */

    const accountInfo = {
      id: admin.id, // Obtengo el id de Admin porque luego es el que uso para acceder al administrador mediante otras funciones
      name: admin.name,
      last_name: admin.last_name,
      phone: admin.phone,
      user: admin.user,
      email: admin.email
      // foto: admin.foto,
      // password: admin.password, // Considera no enviar la contraseña en la respuesta
    };

    // Si todo es correcto, puedes devolver algún tipo de token o mensaje
    res.status(200).json({ message: 'Inicio de sesión exitoso', data: accountInfo });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
  // Recomendaciones:
  /*
  Bloqueo después de varios intentos fallidos
  Registro de auditoría para inicios de sesión: IP del usuario, fecha y hora, dispositivo utilizado
  Implementar sistema de tokens para manejar autenticación
  */
}

async function findAll(req: Request, res: Response) {
  try {
    const admins = await em.find(Admin, {});
    res.status(200).json({ message: 'Todos los Administradores fueron encontrados', data: admins });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

async function add(req: Request, res: Response) {
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
  try {
    const id = Number.parseInt(req.params.id);
    const adminToUpdate = await em.getReference(Admin, id);
    em.assign(adminToUpdate, req.body.sanitizedInput);

    /* Si la contraseña se está actualizando, hashearla
    if (req.body.sanitizedInput.password) {
      adminToUpdate.password = await bcrypt.hash(req.body.sanitizedInput.password, 10);
    }
    */

    await em.flush();
    res.status(200).json({ message: 'Información de cuenta actualizada' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

async function remove(req: Request, res: Response) {
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
