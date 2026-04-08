import { CategoryState } from '../../enums/state.enum.js';

export const CATEGORIES_DATA = [
  { name: 'Libreria', description: 'Productos de Libreria', state: CategoryState.Activo, order: 1 },
  { name: 'Jugueteria', description: 'Productos de Jugueteria', state: CategoryState.Activo, order: 2 },
  { name: 'Tecnologia', description: 'Productos de Tecnologia', state: CategoryState.Activo, order: 3 },
  { name: 'Indumentaria', description: 'Productos de Indumentaria', state: CategoryState.Inactivo, order: 4 }
];

export const SUBCATEGORIES_DATA = [
  { name: 'Útiles Escolares', description: 'Útiles para el colegio', parentName: 'Libreria', state: CategoryState.Activo, order: 1 },
  { name: 'Papelería', description: 'Resmas, folios y papeles varios', parentName: 'Libreria', state: CategoryState.Activo, order: 2 },
  { name: 'Arte y Dibujo', description: 'Materiales para arte y dibujo técnico', parentName: 'Libreria', state: CategoryState.Activo, order: 3 },
  { name: 'Encuadernación', description: 'Productos de encuadernación y organización', parentName: 'Libreria', state: CategoryState.Activo, order: 4 },
  { name: 'Indumentaria Escolar', description: 'Ropa y accesorios para el colegio', parentName: 'Libreria', state: CategoryState.Activo, order: 5 },
  { name: 'Juegos de Mesa', description: 'Juegos de mesa y cartas', parentName: 'Jugueteria', state: CategoryState.Activo, order: 1 },
  { name: 'Juguetes al Aire Libre', description: 'Pelotas, pistolas de agua y más', parentName: 'Jugueteria', state: CategoryState.Activo, order: 2 },
  { name: 'Periféricos', description: 'Mouse, teclados y accesorios', parentName: 'Tecnologia', state: CategoryState.Activo, order: 1 },
  { name: 'Audio y Video', description: 'Auriculares, parlantes y monitores', parentName: 'Tecnologia', state: CategoryState.Inactivo, order: 2 }
];

export const LEVEL3_CATEGORIES_DATA = [
  { name: 'Escritura', description: 'Lápices, bolígrafos y afines', parentName: 'Útiles Escolares', state: CategoryState.Activo, order: 1 },
  { name: 'Geometría', description: 'Reglas, escuadras, compases y transportadores', parentName: 'Útiles Escolares', state: CategoryState.Activo, order: 2 },
  { name: 'Papel Estampado', description: 'Papel decorativo y de scrapbook', parentName: 'Papelería', state: CategoryState.Activo, order: 1 },
  { name: 'Sobres y Carpetas', description: 'Sobres manila, sobres oficio y carpetas de archivo', parentName: 'Papelería', state: CategoryState.Activo, order: 2 },
  { name: 'Pinturas y Acuarelas', description: 'Temperas, acuarelas y pinturas al óleo', parentName: 'Arte y Dibujo', state: CategoryState.Activo, order: 1 },
  { name: 'Lápices de Color', description: 'Sets de lápices de colores y pasteles', parentName: 'Arte y Dibujo', state: CategoryState.Activo, order: 2 },
  { name: 'Anillado y Espiral', description: 'Anillos plásticos y espirales metálicos', parentName: 'Encuadernación', state: CategoryState.Activo, order: 1 },
];
