import { Request, Response, NextFunction } from 'express';
import { Client } from './client.entity.js';
import { orm } from '../../shared/db/orm.js';
// import bcrypt from 'bcryptjs';
// Crear endpoint, verificar credencial y manejar respuesta.

const em = orm.em;

function sanitizeClientInput(req: Request, res: Response, next: NextFunction) {
  req.body.sanitizedInput = {
    // foto: req.body.foto,
    name: req.body.name,
    last_name: req.body.last_name,
    phone: req.body.phone,
    // address: req.body.address,
    // registration_date: req.body.registration_date,
    user: req.body.user,
    password: req.body.password,
    email: req.body.email
  };
  //more checks here

  Object.keys(req.body.sanitizedInput).forEach((key) => {
    if (req.body.sanitizedInput[key] === undefined) {
      delete req.body.sanitizedInput[key];
    }
  });
  next();
}

// Obtener información de cuenta del cliente
async function getAccountInfo(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id);
    const client = await em.findOneOrFail(Client, id);
    // Filtrar los datos que se enviarán al cliente
    const accountInfo = {
      // foto: cliente.foto,
      id: client.id,
      name: client.name,
      last_name: client.last_name,
      phone: client.phone,
      user: client.user,
      email: client.email
      // password: cliente.password, // Considera no enviar la contraseña en la respuesta
    };

    res.status(200).json({ message: 'Información de cuenta obtenida', data: accountInfo });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

async function findOne(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id);
    const client = await em.findOneOrFail(Client, id);
    res.status(200).json({ message: 'Cliente encontrado', data: client });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

//Agregar Políticas de Contraseña y Autenticación y Tokens

async function login(req: Request, res: Response) {
  const { user, password } = req.body;

  // Validaciones para asegurarse de que el usuario y la contraseña fueron ingresados
  /*if (!user) {
    return res.status(400).json({ message: 'El usuario es requerido' });
  }
  if (!password) {
    return res.status(400).json({ message: 'La contraseña es requerida' });
  }*/

  try {
    // Buscar el cliente por usuario y contraseña
    const client = await em.findOneOrFail(Client, { user, password });

    if (!client) {
      return res.status(401).json({ message: 'Usuario o contraseña incorrecta' });
    }
    // Este enfoque es incorrecto porque no se deben almacenar contraseñas en texto plano en la base de datos. Las contraseñas deberían ser almacenadas en forma hasheada por razones de seguridad.
    // En el futuro generar un token de autenticación

    /* Comparar la contraseña proporcionada con la contraseña hasheada
    const passwordValida = await bcrypt.compare(password, cliente.password);

    if (!passwordValida) {
      return res.status(401).json({ message: 'Usuario o contraseña incorrecta' });
    }
    */

    const accountInfo = {
      // foto: cliente.foto,
      id: client.id, // Obtengo el id de Cliente porque luego es el que uso para acceder al cliente mediante otras funciones
      name: client.name,
      last_name: client.last_name,
      phone: client.phone,
      user: client.user,
      email: client.email
      // password: cliente.password, // Considera no enviar la contraseña en la respuesta
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
    const clients = await em.find(Client, {});
    res.status(200).json({ message: 'Todos los Clientes fueron encontrados', data: clients });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

async function add(req: Request, res: Response) {
  try {
    const client = em.create(Client, req.body.sanitizedInput);
    /* Si la contraseña se está creando, hashearla
    if (req.body.sanitizedInput.password) {
      client.password = await bcrypt.hash(req.body.sanitizedInput.password, 10);
    }
    */
    await em.flush();
    res.status(201).json({ message: 'Cliente creado', data: client });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

// Actualizar información de cuenta del cliente
async function update(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id);
    const clientToUpdate = await em.getReference(Client, id);
    em.assign(clientToUpdate, req.body.sanitizedInput);

    /* Si la contraseña se está actualizando, hashearla
    if (req.body.sanitizedInput.password) {
      clientToUpdate.password = await bcrypt.hash(req.body.sanitizedInput.password, 10);
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
    const client = em.findOneOrFail(Client, { id });
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

export { login, sanitizeClientInput, findAll, findOne, add, update, remove, getAccountInfo };
