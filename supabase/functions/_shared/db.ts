// ============================================================================
// Conexión a PostgreSQL (reemplaza a MikroORM)
// ============================================================================
// Las Edge Functions se conectan directo a la base con postgres.js usando
// SUPABASE_DB_URL, una variable que Supabase inyecta automáticamente.
//
// ¿Por qué conexión directa y no la API REST de Supabase?
//   - Permite transacciones reales (sql.begin), que el backend anterior obtenía
//     con em.flush(): varias escrituras se confirman todas juntas o ninguna.
//   - Las consultas quedan en SQL explícito, fáciles de leer y de auditar.
//
// IMPORTANTE: esta conexión tiene privilegios de servicio y NO pasa por RLS.
// Por eso cada ruta valida la sesión y el rol antes de tocar datos (ver auth.ts).
// ============================================================================
import postgres from 'npm:postgres@3.4.5';

const connectionString = Deno.env.get('SUPABASE_DB_URL');

if (!connectionString) {
  throw new Error('Falta la variable de entorno SUPABASE_DB_URL');
}

export const sql = postgres(connectionString, {
  // Sin sentencias preparadas: es lo que exige el pooler de Supabase en modo transacción
  prepare: false,
  // Pocas conexiones por instancia: cada Edge Function atiende de a poco tráfico
  max: 2,
  idle_timeout: 20,
  connect_timeout: 10,
  // Las columnas se leen en camelCase (created_at -> createdAt) y se escriben en
  // snake_case con el helper sql({...}). Así las respuestas salen con los mismos
  // nombres de campo que devolvía el backend anterior.
  transform: {
    column: { from: postgres.toCamel, to: postgres.fromCamel },
  },
  types: {
    // NUMERIC llega como texto por defecto: lo convertimos a número para que
    // precios y totales viajen como números en el JSON.
    numeric: {
      to: 1700,
      from: [1700],
      serialize: (value: number) => String(value),
      parse: (value: string) => Number(value),
    },
  },
});

/** Conexión o transacción activa: permite que los helpers participen de un sql.begin(). */
// deno-lint-ignore no-explicit-any
export type Db = any;
