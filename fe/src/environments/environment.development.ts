// Configuración de DESARROLLO (ng serve).
//
// Todos estos valores son PÚBLICOS por diseño: viajan al navegador. La seguridad
// no depende de ocultarlos, sino de las políticas RLS y de las validaciones de
// las Edge Functions. Lo que NUNCA va acá es la service role key ni las claves de R2.
//
// Dónde conseguir cada valor: ver "Puesta en marcha" en el README.
const supabaseUrl = 'https://TU-PROYECTO.supabase.co';

export const environment = {
  production: false,
  // Supabase: Project Settings → API
  supabaseUrl,
  supabaseAnonKey: 'TU_SUPABASE_ANON_KEY',
  // Las Edge Functions reemplazan al backend Express (antes http://localhost:3000/api)
  apiUrl: `${supabaseUrl}/functions/v1`,
  // Cloudflare R2: URL pública de cada bucket (con la barra final)
  productImagesUrl: 'https://pub-XXXXXXXX.r2.dev/',
  userImagesUrl: 'https://pub-YYYYYYYY.r2.dev/',
  // Cloudflare Turnstile: si queda vacío, el checkout no muestra el widget anti-bots
  turnstileSiteKey: '',
};
