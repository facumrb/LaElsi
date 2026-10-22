// ============================================================================
// Plantillas de los correos transaccionales
// ============================================================================
// Funciones puras: reciben datos y devuelven el asunto y el contenido. No
// dependen de Deno ni de Resend, así que se pueden probar por separado.
//
// Cada correo lleva dos versiones del contenido:
//   - html: la que ven casi todos los clientes de correo.
//   - text: texto plano, para los que no muestran HTML y para los filtros de
//     spam (un correo sin versión de texto suma puntos en contra).
// ============================================================================

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

const BRAND_COLOR = '#3d4494';

/** Escapa un texto para insertarlo en HTML sin que se interprete como etiquetas. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Estructura común de todos los correos (encabezado con la marca y pie). */
function layout(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:24px;background-color:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#111827;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background-color:#ffffff;border-radius:12px;">
      <tr>
        <td style="padding:24px 32px;border-bottom:1px solid #e5e7eb;">
          <span style="font-size:22px;font-weight:bold;color:${BRAND_COLOR};">Laelsi</span>
        </td>
      </tr>
      <tr>
        <td style="padding:32px;font-size:15px;line-height:1.6;">
          ${bodyHtml}
        </td>
      </tr>
      <tr>
        <td style="padding:16px 32px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;">
          Este es un mensaje automático de Laelsi. Por favor, no respondas a este correo.
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function greeting(name: string | null | undefined): string {
  const clean = (name ?? '').trim();
  return clean ? `Hola, ${clean}:` : 'Hola:';
}

/**
 * Correo con el enlace para elegir una contraseña nueva.
 * Nunca incluye una contraseña: solo el enlace, que vence y es de un solo uso.
 */
export function passwordResetEmail(data: {
  name?: string | null;
  resetUrl: string;
  expiresInMinutes: number;
}): EmailContent {
  const hello = greeting(data.name);
  const url = escapeHtml(data.resetUrl);

  const html = layout(
    'Recuperar tu contraseña',
    `<p style="margin:0 0 16px;">${escapeHtml(hello)}</p>
          <p style="margin:0 0 16px;">Recibimos una solicitud para restablecer la contraseña de tu cuenta en Laelsi.</p>
          <p style="margin:0 0 24px;">Hacé clic en el botón para elegir una contraseña nueva:</p>
          <p style="margin:0 0 24px;text-align:center;">
            <a href="${url}" style="display:inline-block;padding:12px 28px;background-color:${BRAND_COLOR};color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold;">Restablecer contraseña</a>
          </p>
          <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">Si el botón no funciona, copiá y pegá este enlace en tu navegador:</p>
          <p style="margin:0 0 24px;font-size:13px;word-break:break-all;"><a href="${url}" style="color:${BRAND_COLOR};">${url}</a></p>
          <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">El enlace vence en ${data.expiresInMinutes} minutos y solo se puede usar una vez.</p>
          <p style="margin:0;font-size:13px;color:#6b7280;">Si vos no pediste este cambio, podés ignorar este mensaje: tu contraseña sigue siendo la misma.</p>`,
  );

  const text = [
    hello,
    '',
    'Recibimos una solicitud para restablecer la contraseña de tu cuenta en Laelsi.',
    '',
    'Abrí este enlace para elegir una contraseña nueva:',
    data.resetUrl,
    '',
    `El enlace vence en ${data.expiresInMinutes} minutos y solo se puede usar una vez.`,
    'Si vos no pediste este cambio, podés ignorar este mensaje: tu contraseña sigue siendo la misma.',
  ].join('\n');

  return { subject: 'Recuperar tu contraseña de Laelsi', html, text };
}

/**
 * Aviso de que la contraseña se cambió. Si no fue la persona, es la señal de
 * alarma que le permite reaccionar a tiempo.
 */
export function passwordChangedEmail(data: { name?: string | null }): EmailContent {
  const hello = greeting(data.name);

  const html = layout(
    'Tu contraseña fue actualizada',
    `<p style="margin:0 0 16px;">${escapeHtml(hello)}</p>
          <p style="margin:0 0 16px;">Te confirmamos que la contraseña de tu cuenta en Laelsi se cambió correctamente.</p>
          <p style="margin:0;font-size:13px;color:#6b7280;">Si vos no hiciste este cambio, recuperá el acceso desde “¿Olvidaste tu contraseña?” y contactanos cuanto antes.</p>`,
  );

  const text = [
    hello,
    '',
    'Te confirmamos que la contraseña de tu cuenta en Laelsi se cambió correctamente.',
    '',
    'Si vos no hiciste este cambio, recuperá el acceso desde "¿Olvidaste tu contraseña?" y contactanos cuanto antes.',
  ].join('\n');

  return { subject: 'Tu contraseña de Laelsi fue actualizada', html, text };
}

const SHOP_WHATSAPP = '+54 9 341 712-1860';

/**
 * Constancia para quien usó el botón de arrepentimiento: lleva el código de
 * identificación que exige la Disposición 954/2025 (que además se muestra en pantalla).
 */
export function revocationReceivedEmail(data: { name: string; code: string }): EmailContent {
  const hello = greeting(data.name);
  const code = escapeHtml(data.code);

  const html = layout(
    'Recibimos tu solicitud de arrepentimiento',
    `<p style="margin:0 0 16px;">${escapeHtml(hello)}</p>
          <p style="margin:0 0 16px;">Recibimos tu solicitud para revocar tu compra en Laelsi. Este es tu <strong>código de identificación</strong>:</p>
          <p style="margin:0 0 24px;text-align:center;">
            <span style="display:inline-block;padding:12px 24px;background-color:#f3f4f6;border-radius:8px;font-size:22px;font-weight:bold;letter-spacing:1px;color:${BRAND_COLOR};">${code}</span>
          </p>
          <p style="margin:0 0 16px;">Guardalo: lo vas a necesitar para consultar cómo va tu solicitud.</p>
          <p style="margin:0 0 16px;">Nos vamos a comunicar con vos para coordinar la devolución del producto y el reintegro del importe pagado, que se hace por el mismo medio de pago. Los gastos de la devolución corren por cuenta de Laelsi.</p>
          <p style="margin:0;font-size:13px;color:#6b7280;">Si tenés dudas, escribinos por WhatsApp al ${SHOP_WHATSAPP}. Si vos no hiciste esta solicitud, avisanos.</p>`,
  );

  const text = [
    hello,
    '',
    'Recibimos tu solicitud para revocar tu compra en Laelsi.',
    `Tu código de identificación es: ${data.code}`,
    '',
    'Guardalo: lo vas a necesitar para consultar cómo va tu solicitud.',
    'Nos vamos a comunicar con vos para coordinar la devolución del producto y el reintegro del importe pagado, que se hace por el mismo medio de pago. Los gastos de la devolución corren por cuenta de Laelsi.',
    '',
    `Si tenés dudas, escribinos por WhatsApp al ${SHOP_WHATSAPP}. Si vos no hiciste esta solicitud, avisanos.`,
  ].join('\n');

  return { subject: `Recibimos tu solicitud de arrepentimiento (${data.code})`, html, text };
}

/** Aviso al comercio: una persona pidió revocar una compra. Hay que contactarla. */
export function revocationNotificationEmail(data: {
  code: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  orderNumber: number | null;
  details: string;
  createdAt: Date;
}): EmailContent {
  const fullName = `${data.firstName} ${data.lastName}`;
  const when = data.createdAt.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });
  const rows: [string, string][] = [
    ['Código', data.code],
    ['Nombre', fullName],
    ['Email', data.email],
    ['Teléfono', data.phone ?? 'No indicó'],
    ['Número de pedido', data.orderNumber === null ? 'No indicó' : String(data.orderNumber)],
    ['Fecha', when],
  ];

  // Todo lo que escribió la persona se escapa: el contenido no es de confianza
  const rowsHtml = rows
    .map(
      ([label, value]) =>
        `<p style="margin:0 0 8px;"><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</p>`,
    )
    .join('\n          ');
  const detailsHtml = escapeHtml(data.details).replace(/\n/g, '<br>');

  const html = layout(
    'Nueva solicitud de arrepentimiento',
    `<p style="margin:0 0 16px;">Una persona usó el <strong>Botón de arrepentimiento</strong> del sitio.</p>
          ${rowsHtml}
          <p style="margin:16px 0 8px;"><strong>Lo que escribió:</strong></p>
          <p style="margin:0 0 16px;padding:12px;background-color:#f3f4f6;border-radius:8px;">${detailsHtml}</p>
          <p style="margin:0;font-size:13px;color:#6b7280;">Tenés que contactarla para coordinar la devolución y el reintegro. La solicitud queda guardada en la tabla revocation_request.</p>`,
  );

  const text = [
    'Una persona usó el Botón de arrepentimiento del sitio.',
    '',
    ...rows.map(([label, value]) => `${label}: ${value}`),
    '',
    'Lo que escribió:',
    data.details,
    '',
    'Tenés que contactarla para coordinar la devolución y el reintegro. La solicitud queda guardada en la tabla revocation_request.',
  ].join('\n');

  return { subject: `Nueva solicitud de arrepentimiento ${data.code}`, html, text };
}
