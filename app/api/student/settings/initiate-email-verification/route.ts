import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth-complex';
import { supabaseAdmin } from '@/lib/supabase-server';
import crypto from 'crypto';
import { sendMail } from '@/lib/email/mailer';
import { verificationEmailTemplate } from '@/lib/email/templates';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    if (!token) {
      return NextResponse.json({ success: false, error: 'Token requerido' }, { status: 400 });
    }
    const result = await validateSession(token);
    if (!result.success || !result.user || result.user.userType !== 'student') {
      return NextResponse.json({ success: false, error: 'Sesión inválida' }, { status: 401 });
    }
    const userId = result.user.id;
    // Obtener email y verificación
    const { data: userRow, error: userError } = await supabaseAdmin
      .from('system_users')
      .select('email, email_verified')
      .eq('id', userId)
      .single();
    if (userError || !userRow) {
      return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 });
    }
    if (userRow.email_verified) {
      return NextResponse.json({ success: false, error: 'Tu email ya está verificado' }, { status: 400 });
    }
    // Generar token y expiración (24h)
    const verifToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const { error: updateError } = await supabaseAdmin
      .from('system_users')
      .update({
        email_verification_token: verifToken,
        email_verification_expires: expires,
      })
      .eq('id', userId);
    if (updateError) {
      return NextResponse.json({ success: false, error: 'No se pudo generar el token' }, { status: 500 });
    }
    // Construir URL de verificación
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'http://localhost:3000';
    const verifyUrl = `${appUrl}/api/auth/verify-email?token=${verifToken}`;
    const html = verificationEmailTemplate(verifyUrl);
    await sendMail(userRow.email, 'Verifica tu correo electrónico', html);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error iniciando verificación de email:', err);
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}



