import { createClient } from '@supabase/supabase-js';
import { environment } from 'src/environments/environment';

/**
 * Cliente único de Supabase para toda la aplicación.
 *
 * Solo se usa para la AUTENTICACIÓN (sesión, Google OAuth, renovación de tokens).
 * Los datos de negocio no se consultan con este cliente: pasan por las Edge
 * Functions a través de HttpClient, igual que antes pasaban por el backend Express.
 *
 * Usa la anon key, que es pública: lo que cada usuario puede hacer lo definen
 * las políticas RLS y las validaciones de las Edge Functions.
 */
export const supabase = createClient(
  environment.supabaseUrl,
  environment.supabaseAnonKey,
  {
    auth: {
      // PKCE es el flujo recomendado para una SPA: el token nunca viaja en la URL
      flowType: 'pkce',
      // La sesión se guarda en localStorage y sobrevive a recargar la página
      persistSession: true,
      // Renueva el access token automáticamente antes de que venza
      autoRefreshToken: true,
      // Al volver de Google, toma el código de la URL y completa el inicio de sesión
      detectSessionInUrl: true,
    },
  },
);
