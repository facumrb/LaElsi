import { Admin } from '../../user/admin/admin.entity.js';
import { Client } from '../../user/client/client.entity.js';
import { FiscalCondition } from '../../shared/enums/fiscal-condition.enum.js';
import { UserRole } from '../../user/user.entity.js';
import bcrypt from 'bcrypt';
import { Category } from '../../category/category.entity.js';
import { Product } from '../../product/product.entity.js';
import { Price } from '../../product/price/price.entity.js';
import { ProductPhoto } from '../../photo/productPhoto/productPhoto.entity.js';
import { Currency } from '../enums/currency.enum.js';
import { orm } from './orm.js';
import { EntityManager } from '@mikro-orm/core';
import { CategoryState, ProductState } from '../../shared/enums/state.enum.js';
import { UserPhoto } from '../../photo/userPhoto/userPhoto.entity.js';

// --- DATOS CONSTANTES (Configuración) ---

const ADMINS_DATA = [
  { name: 'Super', lastName: 'Admin', dni: '11111111', email: 'admin@laelsi.com', phone: '123456789', username: 'admin', password: 'admin123', photoFileName: 'adminprincipal.webp' },
  { name: 'Julio', lastName: 'Cezar', dni: '44222123', email: 'juliocezar@gmail.com', phone: '122345678', username: 'admin1', password: 'admin123' }
];

const CLIENTS_DATA = [
  {
    name: 'Juan',
    lastName: 'Perez',
    dni: '22222222',
    email: 'cliente@laelsi.com',
    phone: '3411111111',
    username: 'cliente',
    password: 'password123',
    role: UserRole.Client,
    fiscalCondition: FiscalCondition.ConsumidorFinal,
    street: 'Av. Pellegrini',
    streetNumber: 1500,
    city: 'Rosario',
    province: 'Santa Fe',
    postalCode: '2000',
    photoFileName: 'clienteprincipal.webp'
  },
  {
    name: 'Empresa',
    lastName: 'Demo S.A.',
    dni: '33333333',
    email: 'empresa@laelsi.com',
    phone: '3412222222',
    username: 'empresa',
    password: 'password123',
    role: UserRole.Client,
    cuit: '20333333339',
    fiscalCondition: FiscalCondition.ResponsableInscripto,
    street: 'Bv. Oroño',
    streetNumber: 500,
    floor: '4',
    apartment: 'B',
    city: 'Rosario',
    province: 'Santa Fe',
    postalCode: '2000'
  },
  {
    name: 'Carlos',
    lastName: 'Tevez',
    dni: '55555555',
    email: 'monotributo@laelsi.com',
    phone: '3413333333',
    username: 'monotributo',
    password: 'password123',
    role: UserRole.Client,
    cuit: '20555555559',
    fiscalCondition: FiscalCondition.Monotributista,
    street: 'Av. Corrientes',
    streetNumber: 1234,
    city: 'Rosario',
    province: 'Santa Fe',
    postalCode: '2000'
  },
  {
    name: 'Asociacion',
    lastName: 'Civil',
    dni: '66666666',
    email: 'exento@laelsi.com',
    phone: '3414444444',
    username: 'exento',
    password: 'password123',
    role: UserRole.Client,
    cuit: '30666666669',
    fiscalCondition: FiscalCondition.Exento,
    street: 'Bv. 27 de Febrero',
    streetNumber: 2500,
    city: 'Rosario',
    province: 'Santa Fe',
    postalCode: '2000'
  }
];

const CATEGORIES_DATA = [
  { name: 'Libreria', description: 'Productos de Libreria', state: CategoryState.Activo },
  { name: 'Jugueteria', description: 'Productos de Jugueteria', state: CategoryState.Activo },
  { name: 'Tecnologia', description: 'Productos de Tecnologia', state: CategoryState.Activo },
  { name: 'Indumentaria', description: 'Productos de Indumentaria', state: CategoryState.Inactivo }
];

interface IProductSeed {
  name: string;
  description: string;
  brand: string;
  stock: number;
  categoryName: string;
  price: number;
  totalSold?: number;
  photos: { fileName: string }[];
  state?: ProductState;
}

const PRODUCTS_DATA: IProductSeed[] = [
  // --- LIBRERIA ---
  {
    name: 'Lápiz HB Classic',
    description: 'Lápiz de grafito HB para escritura graduada y dibujo artístico',
    brand: 'Faber-Castell',
    stock: 120,
    categoryName: 'Libreria',
    price: 350,
    totalSold: 85,
    state: ProductState.Activo,
    photos: [{ fileName: 'lapiz-hb-classic.jpg' }, { fileName: 'lapiz-hb-classic-2.jpg' }]
  },
  {
    name: 'Cuaderno Universitario Éxito',
    description: 'Cuaderno rayado de 100 hojas tamaño A4 con espiral reforzado',
    brand: 'Éxito',
    stock: 5,
    categoryName: 'Libreria',
    price: 4800,
    totalSold: 32,
    state: ProductState.Activo,
    photos: [{ fileName: 'cuaderno-universitario-exito.jpg' }, { fileName: 'cuaderno-universitario-exito-2.jpg' }]
  },
  {
    name: 'Goma de Borrar Dos Banderas',
    description: 'Goma blanca de caucho natural, no mancha ni daña el papel',
    brand: 'Dos Banderas',
    stock: 200,
    categoryName: 'Libreria',
    price: 450,
    totalSold: 150,
    state: ProductState.Activo,
    photos: [{ fileName: 'goma-de-borrar-dos-banderas.png' }]
  },
  {
    name: 'Set de Reglas Pizzini',
    description: 'Regla de 30cm técnica de alta precisión, fabricada en poliestireno cristal',
    brand: 'Pizzini',
    stock: 0,
    categoryName: 'Libreria',
    price: 1500,
    totalSold: 210,
    state: ProductState.Inactivo,
    photos: [
      { fileName: 'set-de-reglas-pizzini.webp' },
      { fileName: 'set-de-reglas-pizzini-2.webp' },
      { fileName: 'set-de-reglas-pizzini-3.webp' },
      { fileName: 'set-de-reglas-pizzini-4.png' },
      { fileName: 'set-de-reglas-pizzini-5.webp' },
      { fileName: 'set-de-reglas-pizzini-6.webp' },
      { fileName: 'set-de-reglas-pizzini-7.jpg' },
      { fileName: 'set-de-reglas-pizzini-8.png' },
      { fileName: 'set-de-reglas-pizzini-9.png' },
      { fileName: 'set-de-reglas-pizzini-10.png' }
    ]
  },
  {
    name: 'Remera Algodón Premium',
    description: 'Remera 100% algodón peinado, ideal para personalización o uso diario',
    brand: 'La Elsi',
    stock: 30,
    categoryName: 'Libreria',
    price: 12500,
    totalSold: 18,
    state: ProductState.Activo,
    photos: [{ fileName: 'remera-algodon-premium-1.jpeg' }, { fileName: 'remera-algodon-premium-2.jpeg' }, { fileName: 'remera-algodon-premium-3.jpeg' }, { fileName: 'remera-algodon-premium-4.jpeg' }]
  },
  {
    name: 'Resma A4 75g',
    description: 'Resma de papel blanco alcalino de 75gr, ideal para impresiones diarias',
    brand: 'Autor',
    stock: 500,
    categoryName: 'Libreria',
    price: 5000,
    state: ProductState.Activo,
    photos: [{ fileName: 'resma-a4-75g.jpg' }]
  },
  {
    name: 'Bolígrafos Azul x10',
    description: 'Caja de bolígrafos tinta azul trazo fino',
    brand: 'Bic',
    stock: 8,
    categoryName: 'Libreria',
    price: 2000,
    state: ProductState.Activo,
    photos: [{ fileName: 'boligrafos-azul-x10.jpg' }]
  },
  {
    name: 'Carpeta N3',
    description: 'Carpeta escolar N3 con 3 anillos redondos',
    brand: 'Rivadavia',
    stock: 100,
    categoryName: 'Libreria',
    price: 3500,
    state: ProductState.Activo,
    photos: [{ fileName: 'carpeta-n3.jpg' }]
  },
  {
    name: 'Folios x100',
    description: 'Paquete de folios transparentes tamaño A4 reforzados',
    brand: 'Laprida',
    stock: 0,
    categoryName: 'Libreria',
    price: 1500,
    state: ProductState.Inactivo,
    photos: [{ fileName: 'folios-x100.jpg' }]
  },
  {
    name: 'Resaltadores Pastel x4',
    description: 'Set de 4 resaltadores colores pastel',
    brand: 'Trabi',
    stock: 80,
    categoryName: 'Libreria',
    price: 2200,
    state: ProductState.Activo,
    photos: [{ fileName: 'resaltadores-pastel-x4.jpg' }]
  },
  {
    name: 'Tijera Escolar',
    description: 'Tijera escolar punta redonda 13cm',
    brand: 'Maped',
    stock: 120,
    categoryName: 'Libreria',
    price: 900,
    state: ProductState.Activo,
    photos: [{ fileName: 'tijera-escolar.jpg' }]
  },
  {
    name: 'Adhesivo Sintético 30ml',
    description: 'Adhesivo escolar lavable',
    brand: 'Voligoma',
    stock: 300,
    categoryName: 'Libreria',
    price: 800,
    state: ProductState.Activo,
    photos: [{ fileName: 'adhesivo-sintetico-30ml.jpg' }]
  },
  {
    name: 'Cartuchera 2 Pisos',
    description: 'Cartuchera rígida con dos compartimentos y elásticos',
    brand: 'Canopla',
    stock: 3,
    categoryName: 'Libreria',
    price: 4500,
    state: ProductState.Activo,
    photos: [{ fileName: 'cartuchera-2-pisos.jpg' }]
  },
  {
    name: 'Mochila Espalda 18p',
    description: 'Mochila reforzada lisa ideal secundaria',
    brand: 'Jansport',
    stock: 25,
    categoryName: 'Libreria',
    price: 25000,
    state: ProductState.Activo,
    photos: [{ fileName: 'mochila-espalda-18p.jpg' }]
  },
  {
    name: 'Agenda 2025',
    description: 'Agenda diaria tapa dura diseño clásico',
    brand: 'Rivadavia',
    stock: 40,
    categoryName: 'Libreria',
    price: 8000,
    state: ProductState.Activo,
    photos: [{ fileName: 'agenda-2025.jpg' }]
  },
  {
    name: 'Calculadora Científica',
    description: 'Calculadora con 240 funciones y pantalla de 2 líneas',
    brand: 'Casio',
    stock: 0,
    categoryName: 'Libreria',
    price: 12000,
    state: ProductState.Inactivo,
    photos: [{ fileName: 'calculadora-cientifica.jpg' }]
  },
  {
    name: 'Abrochadora Mediana',
    description: 'Abrochadora metálica para ganchos nro 10',
    brand: 'Pizzini',
    stock: 90,
    categoryName: 'Libreria',
    price: 3000,
    state: ProductState.Activo,
    photos: [{ fileName: 'abrochadora-mediana.jpg' }]
  },

  // --- JUGUETERÍA ---
  {
    name: 'Pelota de Fútbol N5',
    description: 'Pelota de fútbol tamaño oficial cosida a máquina',
    brand: 'Adidas',
    stock: 50,
    categoryName: 'Jugueteria',
    price: 15000,
    state: ProductState.Activo,
    photos: [{ fileName: 'pelota-de-futbol-n5.jpg' }]
  },
  {
    name: 'Muñeca Articulada',
    description: 'Muñeca de moda con accesorios',
    brand: 'Barbie',
    stock: 4,
    categoryName: 'Jugueteria',
    price: 12000,
    state: ProductState.Activo,
    photos: [{ fileName: 'muneca-articulada.jpg' }]
  },
  {
    name: 'Auto a Control Remoto',
    description: 'Auto deportivo escala 1:12 con control remoto',
    brand: 'Rastar',
    stock: 30,
    categoryName: 'Jugueteria',
    price: 20000,
    state: ProductState.Activo,
    photos: [{ fileName: 'auto-a-control-remoto.jpg' }]
  },
  {
    name: 'Juego de Mesa Estanciero',
    description: 'Clásico juego de compra y venta de propiedades',
    brand: 'ToyCo',
    stock: 60,
    categoryName: 'Jugueteria',
    price: 9000,
    state: ProductState.Activo,
    photos: [{ fileName: 'juego-de-mesa-estanciero.jpg' }]
  },
  {
    name: 'Bloques de Construcción',
    description: 'Caja básica de ladrillos de encastre 500 piezas',
    brand: 'Rasti',
    stock: 45,
    categoryName: 'Jugueteria',
    price: 11000,
    state: ProductState.Activo,
    photos: [{ fileName: 'bloques-de-construccion.jpg' }]
  },
  {
    name: 'Peluche Oso 50cm',
    description: 'Oso de peluche gigante extrasuave',
    brand: 'Phi Phi Toys',
    stock: 0,
    categoryName: 'Jugueteria',
    price: 8500,
    state: ProductState.Inactivo,
    photos: [{ fileName: 'peluche-oso-50cm.jpg' }]
  },
  {
    name: 'Rompecabezas 1000 Piezas',
    description: 'Puzzle paisaje montañas alta calidad',
    brand: 'Ravensburger',
    stock: 35,
    categoryName: 'Jugueteria',
    price: 7000,
    state: ProductState.Activo,
    photos: [{ fileName: 'rompecabezas-1000-piezas.jpg' }]
  },
  {
    name: 'Pistola de Agua',
    description: 'Lanzador de agua alcance 10 metros',
    brand: 'Nerf',
    stock: 55,
    categoryName: 'Jugueteria',
    price: 6500,
    state: ProductState.Activo,
    photos: [{ fileName: 'pistola-de-agua.jpg' }]
  },
  {
    name: 'Set de Cocina',
    description: 'Juego de cocina infantil con accesorios plásticos',
    brand: 'Duravit',
    stock: 25,
    categoryName: 'Jugueteria',
    price: 5000,
    state: ProductState.Activo,
    photos: [{ fileName: 'set-de-cocina.jpg' }]
  },
  {
    name: 'Pista de Autos',
    description: 'Pista de carreras con lanzador y giros',
    brand: 'Hot Wheels',
    stock: 8,
    categoryName: 'Jugueteria',
    price: 18000,
    state: ProductState.Activo,
    photos: [{ fileName: 'pista-de-autos.jpg' }]
  },
  {
    name: 'Masa para Modelar x4',
    description: 'Set de 4 potes de masa colores surtidos',
    brand: 'Play-Doh',
    stock: 100,
    categoryName: 'Jugueteria',
    price: 4000,
    state: ProductState.Activo,
    photos: [{ fileName: 'masa-para-modelar-x4.jpg' }]
  },
  {
    name: 'Juego de Cartas UNO',
    description: 'Juego de cartas familiar para todas las edades',
    brand: 'Mattel',
    stock: 150,
    categoryName: 'Jugueteria',
    price: 3500,
    state: ProductState.Activo,
    photos: [{ fileName: 'juego-de-cartas-uno.jpg' }]
  },
  {
    name: 'Jenga de Madera',
    description: 'Juego de habilidad fisica y mental',
    brand: 'Jenga',
    stock: 40,
    categoryName: 'Jugueteria',
    price: 5500,
    state: ProductState.Activo,
    photos: [{ fileName: 'jenga-de-madera.jpg' }]
  },
  {
    name: 'Ajedrez Magnético',
    description: 'Juego de ajedrez tablero plegable magnético',
    brand: 'Generic',
    stock: 0,
    categoryName: 'Jugueteria',
    price: 4500,
    state: ProductState.Inactivo,
    photos: [{ fileName: 'ajedrez-magnetico.jpg' }]
  },
  {
    name: 'Cubo Mágico 3x3',
    description: ' Cubo de velocidad sistema anti-pop',
    brand: 'Rubik',
    stock: 80,
    categoryName: 'Jugueteria',
    price: 3000,
    state: ProductState.Activo,
    photos: [{ fileName: 'cubo-magico-3x3.jpg' }]
  },
  {
    name: 'Yo-Yo Profesional',
    description: 'Yo-yo con ruleman para trucos',
    brand: 'Duncan',
    stock: 6,
    categoryName: 'Jugueteria',
    price: 2500,
    state: ProductState.Activo,
    photos: [{ fileName: 'yoyo-profesional.jpg' }]
  },
  {
    name: 'Trompo Luminoso',
    description: 'Trompo con luces led al girar',
    brand: 'Generic',
    stock: 120,
    categoryName: 'Jugueteria',
    price: 1500,
    state: ProductState.Activo,
    photos: [{ fileName: 'trompo-luminoso.jpg' }]
  },

  // --- TECNOLOGÍA ---
  {
    name: 'Mouse Inalámbrico',
    description: 'Mouse óptico inalámbrico 2.4Ghz ergonómico',
    brand: 'Logitech',
    stock: 80,
    categoryName: 'Tecnologia',
    price: 9000,
    state: ProductState.Activo,
    photos: [{ fileName: 'mouse-inalambrico.jpg' }]
  },
  {
    name: 'Teclado Mecánico Gamer',
    description: 'Teclado mecánico luces RGB switches azules',
    brand: 'Redragon',
    stock: 40,
    categoryName: 'Tecnologia',
    price: 25000,
    state: ProductState.Activo,
    photos: [{ fileName: 'teclado-mecanico-gamer.jpg' }]
  },
  {
    name: 'Monitor 24 FHD',
    description: 'Monitor LED 24 pulgadas Full HD HDMI',
    brand: 'Samsung',
    stock: 5,
    categoryName: 'Tecnologia',
    price: 80000,
    state: ProductState.Activo,
    photos: [{ fileName: 'monitor-24-fhd.jpg' }]
  },
  {
    name: 'Auriculares Bluetooth',
    description: 'Auriculares supraaurales inalámbricos con micrófono',
    brand: 'JBL',
    stock: 50,
    categoryName: 'Tecnologia',
    price: 15000,
    state: ProductState.Activo,
    photos: [{ fileName: 'auriculares-bluetooth.jpg' }]
  },
  {
    name: 'Pendrive 64GB 3.0',
    description: 'Memoria USB 64GB velocidad 3.0',
    brand: 'Kingston',
    stock: 200,
    categoryName: 'Tecnologia',
    price: 4000,
    state: ProductState.Activo,
    photos: [{ fileName: 'pendrive-64gb-3-0.jpg' }]
  },
  {
    name: 'Disco SSD 480GB',
    description: 'Disco estado sólido interno SATA III',
    brand: 'Western Digital',
    stock: 35,
    categoryName: 'Tecnologia',
    price: 22000,
    state: ProductState.Activo,
    photos: [{ fileName: 'disco-ssd-480gb.jpg' }]
  },
  {
    name: 'Cable HDMI 2m',
    description: 'Cable HDMI mallado puntas doradas 4K',
    brand: 'Noga',
    stock: 150,
    categoryName: 'Tecnologia',
    price: 1500,
    state: ProductState.Activo,
    photos: [{ fileName: 'cable-hdmi-2m.jpg' }]
  },
  {
    name: 'Cargador Carga Rápida',
    description: 'Cargador de pared tipo C 25W',
    brand: 'Samsung',
    stock: 0,
    categoryName: 'Tecnologia',
    price: 8000,
    state: ProductState.Inactivo,
    photos: [{ fileName: 'cargador-carga-rapida.jpg' }]
  },
  {
    name: 'Funda Notebook 15.6',
    description: 'Funda de neoprene protectora para laptop',
    brand: 'Case Logic',
    stock: 60,
    categoryName: 'Tecnologia',
    price: 6000,
    state: ProductState.Activo,
    photos: [{ fileName: 'funda-notebook-15-6.jpg' }]
  },
  {
    name: 'Soporte para Celular',
    description: 'Soporte escritorio ajustable universal',
    brand: 'Generic',
    stock: 100,
    categoryName: 'Tecnologia',
    price: 2500,
    state: ProductState.Activo,
    photos: [{ fileName: 'soporte-para-celular.jpg' }]
  },
  {
    name: 'Webcam 1080p',
    description: 'Cámara web Full HD con micrófono incorporado',
    brand: 'Logitech',
    stock: 25,
    categoryName: 'Tecnologia',
    price: 18000,
    state: ProductState.Inactivo,
    photos: [{ fileName: 'webcam-1080p.jpg' }]
  },
  {
    name: 'Parlante Portátil',
    description: 'Parlante bluetooth resistente al agua',
    brand: 'JBL',
    stock: 45,
    categoryName: 'Tecnologia',
    price: 20000,
    state: ProductState.Activo,
    photos: [{ fileName: 'parlante-portatil.jpg' }]
  },
  {
    name: 'Smartwatch Band 7',
    description: 'Reloj inteligente monitor ritmo cardiaco',
    brand: 'Xiaomi',
    stock: 7,
    categoryName: 'Tecnologia',
    price: 12000,
    state: ProductState.Activo,
    photos: [{ fileName: 'smartwatch-band-7.jpg' }]
  },
  {
    name: 'Tablet 10 Android',
    description: 'Tablet 64GB 4GB RAM procesador Octa Core',
    brand: 'Lenovo',
    stock: 15,
    categoryName: 'Tecnologia',
    price: 90000,
    state: ProductState.Activo,
    photos: [{ fileName: 'tablet-10-android.jpg' }]
  },
  {
    name: 'Power Bank 10000mAh',
    description: 'Cargador portátil doble salida USB',
    brand: 'Xiaomi',
    stock: 80,
    categoryName: 'Tecnologia',
    price: 10000,
    state: ProductState.Activo,
    photos: [{ fileName: 'power-bank-10000mah.jpg' }]
  },
  {
    name: 'Impresora Multifunción',
    description: 'Impresora escáner copia sistema continuo',
    brand: 'HP',
    stock: 0,
    categoryName: 'Tecnologia',
    price: 60000,
    state: ProductState.Inactivo,
    photos: [{ fileName: 'impresora-multifuncion.jpg' }]
  },
  {
    name: 'Router Wi-Fi 6',
    description: 'Router doble banda gigabit alta velocidad',
    brand: 'TP-Link',
    stock: 22,
    categoryName: 'Tecnologia',
    price: 25000,
    state: ProductState.Activo,
    photos: [{ fileName: 'router-wi-fi-6.jpg' }]
  }
];

// --------- FUNCIONES DE LÓGICA ---------

async function seedAdmins(em: EntityManager) {
  const adminCount = await em.count(Admin, {});
  if (adminCount > 0) return;

  for (const adminData of ADMINS_DATA) {
    const admin = new Admin();
    admin.name = adminData.name;
    admin.lastName = adminData.lastName;
    admin.dni = adminData.dni;
    admin.email = adminData.email;
    admin.phone = adminData.phone;
    admin.username = adminData.username;
    admin.role = UserRole.Admin;
    admin.password = await bcrypt.hash(adminData.password, 10);

    em.persist(admin);

    if ('photoFileName' in adminData && adminData.photoFileName) {
      const photo = new UserPhoto();
      photo.fileName = adminData.photoFileName;
      photo.user = admin;
      admin.photo = photo;
      em.persist(photo);
    }
  }
}

async function seedClients(em: EntityManager) {
  const clientCount = await em.count(Client, {});
  if (clientCount > 0) return;

  for (const clientData of CLIENTS_DATA) {
    const client = new Client();
    client.name = clientData.name;
    client.lastName = clientData.lastName;
    client.dni = clientData.dni;
    client.email = clientData.email;
    client.phone = clientData.phone;
    client.username = clientData.username;
    client.role = clientData.role;
    client.password = await bcrypt.hash(clientData.password, 10);

    client.fiscalCondition = clientData.fiscalCondition;
    client.street = clientData.street;
    client.streetNumber = clientData.streetNumber;
    client.city = clientData.city;
    client.province = clientData.province;
    client.postalCode = clientData.postalCode;
    if (clientData.cuit) client.cuit = clientData.cuit;
    if (clientData.floor) client.floor = clientData.floor;
    if (clientData.apartment) client.apartment = clientData.apartment;

    em.persist(client);

    if ('photoFileName' in clientData && clientData.photoFileName) {
      const photo = new UserPhoto();
      photo.fileName = clientData.photoFileName;
      photo.user = client;
      client.photo = photo;
      em.persist(photo);
    }
  }
}

async function seedCategories(em: EntityManager): Promise<Record<string, Category>> {
  const categoryCount = await em.count(Category, {});
  // Mapa para devolver las categorías creadas o encontradas y usarlas en productos
  const categoryMap: Record<string, Category> = {};

  if (categoryCount === 0) {
    for (const catData of CATEGORIES_DATA) {
      const category = new Category();
      category.name = catData.name;
      category.description = catData.description;
      category.state = catData.state;
      em.persist(category);
      categoryMap[category.name] = category;
    }
  } else {
    // Si ya existen, las buscamos para poder asignar productos si hiciera falta
    const existingCats = await em.find(Category, {});
    existingCats.forEach((c) => (categoryMap[c.name] = c));
  }

  return categoryMap;
}

function createProductEntity(data: IProductSeed, category: Category): Product {
  const product = new Product();
  product.name = data.name;
  product.description = data.description;
  product.brand = data.brand;
  product.totalSold = data.totalSold || 0;
  product.stock = data.stock;
  product.category = category;
  product.state = data.state || ProductState.Activo;

  // Crear Precio
  const price = new Price();
  price.amount = data.price;
  price.currency = Currency.ARS;
  price.product = product;
  product.prices.add(price);

  // Crear Fotos (Iteramos el array de fotos data)
  data.photos.forEach((photoData, index) => {
    const photo = new ProductPhoto();
    photo.fileName = photoData.fileName;
    // Asumimos que el original es igual al file si no se especifica

    photo.order = index; // El orden es el índice del array
    photo.product = product;
    product.photos.add(photo);
  });

  return product;
}

// --- FUNCIÓN PRINCIPAL ---

export async function seedDatabase() {
  const em = orm.em.fork();

  try {
    // 1. Admins
    await seedAdmins(em);

    // 2. Clientes
    await seedClients(em);

    // 3. Categorías (Obtenemos el mapa de categorías para usarlo abajo)
    const categoriesMap = await seedCategories(em);

    // 4. Productos
    const existingProducts = await em.find(Product, {});
    const existingProductNames = new Set(existingProducts.map((p) => p.name));

    for (const prodData of PRODUCTS_DATA) {
      // Si el producto ya existe por nombre, lo saltamos
      if (existingProductNames.has(prodData.name)) continue;

      const category = categoriesMap[prodData.categoryName];
      if (category) {
        const product = createProductEntity(prodData, category);
        em.persist(product);
      } else {
        console.warn(`Categoría no encontrada para el producto: ${prodData.name} (${prodData.categoryName})`);
      }
    }

    // 5. Guardar todo junto al final (Transacción implícita)
    await em.flush();
    console.log('🚀 Base de datos inicializada correctamente.');
  } catch (error) {
    console.error('❌ Error ejecutando seedDatabase:', error);
  }
}
