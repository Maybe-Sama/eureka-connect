/**
 * Archivo de prueba para verificar la configuración de email
 * NO usar en producción - solo para testing
 */

import { sendMail } from './mailer';
import { verificationEmailTemplate } from './templates';

/**
 * Prueba básica de envío de email
 */
export async function testEmailConfiguration(): Promise<void> {
  try {
    console.log('🧪 Probando configuración de email...');
    
    const testEmail = process.env.TEST_EMAIL || 'test@example.com';
    const verifyUrl = 'https://tu-app.com/verify?token=test123';
    
    // Probar plantilla
    const html = verificationEmailTemplate(verifyUrl);
    console.log('✅ Plantilla generada correctamente');
    
    // Probar envío (solo si TEST_EMAIL está configurado)
    if (process.env.TEST_EMAIL) {
      await sendMail(
        testEmail,
        'Prueba de Configuración Email - Eureka CRM',
        html
      );
      console.log('✅ Email enviado correctamente a:', testEmail);
    } else {
      console.log('⚠️  TEST_EMAIL no configurado - saltando envío real');
    }
    
    console.log('🎉 Configuración de email funcionando correctamente');
  } catch (error) {
    console.error('❌ Error en configuración de email:', error);
    throw error;
  }
}

/**
 * Prueba solo la generación de plantillas (sin envío)
 */
export function testEmailTemplates(): void {
  console.log('🧪 Probando plantillas de email...');
  
  const testUrls = [
    'https://localhost:3000/api/auth/verify-email?token=abc123',
    'https://tu-app.vercel.app/api/auth/verify-email?token=def456',
    'https://eureka-crm.com/api/auth/verify-email?token=ghi789'
  ];
  
  testUrls.forEach((url, index) => {
    const html = verificationEmailTemplate(url);
    console.log(`✅ Plantilla ${index + 1} generada correctamente`);
    console.log(`   URL: ${url}`);
    console.log(`   HTML length: ${html.length} caracteres`);
  });
  
  console.log('🎉 Plantillas de email funcionando correctamente');
}



