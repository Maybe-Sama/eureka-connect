/**
 * Genera el contenido HTML para el email de verificación.
 * @param verifyUrl URL de verificación que se incluirá en el correo.
 */
export function verificationEmailTemplate(verifyUrl: string): string {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2>Verificación de correo electrónico</h2>
      <p>Hola,</p>
      <p>Has solicitado verificar tu dirección de correo electrónico. Haz clic en el botón de abajo para completar el proceso:</p>
      <p style="text-align: center; margin: 20px 0;">
        <a href="${verifyUrl}" style="background-color:#2563EB; color:#FFFFFF; padding:12px 20px; text-decoration:none; border-radius:4px;">Verificar correo</a>
      </p>
      <p>Si no has solicitado esto, puedes ignorar este correo.</p>
      <p>¡Gracias!</p>
    </div>
  `;
}











