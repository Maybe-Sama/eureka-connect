import nodemailer from 'nodemailer';

/**
 * Envía un correo electrónico con el HTML proporcionado.
 * Usa variables de entorno para la configuración SMTP:
 *  - SMTP_HOST
 *  - SMTP_PORT
 *  - SMTP_USER
 *  - SMTP_PASS
 *  - SMTP_FROM (dirección del remitente)
 */
export async function sendMail(to: string, subject: string, html: string): Promise<void> {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;

  if (!host || !user || !pass || !from) {
    throw new Error('Configuración SMTP incompleta: define SMTP_HOST, SMTP_USER, SMTP_PASS y SMTP_FROM en .env');
  }

  const transporter = nodemailer.createTransporter({
    host,
    port,
    secure: port === 465, // TLS en puerto 465
    auth: { user, pass },
  });

  try {
    await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error('Error enviando correo:', error);
    throw new Error('No se pudo enviar el correo electrónico.');
  }
}



