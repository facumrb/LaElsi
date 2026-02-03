import { EntityManager } from '@mikro-orm/core';
import { Admin } from '../../user/admin/admin.entity.js'; // Verifica que esta ruta sea correcta
import { UserRole } from '../../user/user.entity.js'; // Verifica que esta ruta sea correcta

export async function seedDatabase(em: EntityManager) {
  try {
    // Usamos un fork para tener un contexto limpio
    const forkEm = em.fork();

    // 1. Verificamos si ya existen admins
    const adminCount = await forkEm.count(Admin, {});

    if (adminCount > 0) {
      // Si ya hay admins, no hacemos nada para no duplicar ni reiniciar passwords
      return;
    }

    console.log('🌱 Base de datos sin Admins. Creando Super Admin...');

    // 2. Crear el Admin por defecto
    const superAdmin = new Admin();
    superAdmin.name = 'Super';
    superAdmin.last_name = 'Admin';
    superAdmin.email = 'admin@laelsi.com';
    superAdmin.phone = '123456789';

    // IMPORTANTE: Este es el usuario con el que te vas a loguear
    superAdmin.username = 'admin';
    superAdmin.role = UserRole.ADMIN;

    // IMPORTANTE: Usamos el método de la entidad para hashear la password
    await superAdmin.setPassword('admin123');

    // 3. Guardar en BD
    forkEm.persist(superAdmin);
    await forkEm.flush();

    console.log('✅ Admin creado exitosamente');
    console.log('👉 Username: admin');
    console.log('👉 Pass: admin123');
  } catch (error) {
    console.error('❌ Error ejecutando seedDatabase:', error);
  }
}
