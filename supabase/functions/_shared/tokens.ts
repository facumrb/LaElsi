// ============================================================================
// Tokens de un solo uso (enlaces de recuperación de contraseña)
// ============================================================================
// Usa la Web Crypto API, que es estándar: funciona igual en Deno y en Node.
// ============================================================================

/** Formato de los tokens que genera generateToken(): 43 caracteres base64url. */
export const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

/**
 * Genera un token aleatorio de 256 bits, codificado en base64url para que
 * pueda viajar en una URL sin escaparse.
 *
 * Con 256 bits de aleatoriedad criptográfica es imposible adivinarlo probando
 * combinaciones, así que no hace falta limitar los intentos de canje.
 */
export function generateToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));

  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * SHA-256 en hexadecimal (64 caracteres).
 *
 * En la base se guarda este hash y no el token. No hace falta "sal": la sal
 * protege valores predecibles (como las contraseñas), y un token aleatorio de
 * 256 bits no lo es.
 */
export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
