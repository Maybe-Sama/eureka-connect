import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');
    if (!token) {
      return NextResponse.json({ success: false, error: 'Token requerido' }, { status: 400 });
    }
    // Buscar al usuario con ese token
    const { data: userRow, error: userError } = await supabaseAdmin
      .from('system_users')
      .select('id, email_verification_expires, user_type')
      .eq('email_verification_token', token)
      .maybeSingle();
    if (userError || !userRow) {
      return NextResponse.json({ success: false, error: 'Token inválido' }, { status: 400 });
    }
    if (userRow.user_type !== 'student') {
      return NextResponse.json({ success: false, error: 'Token no corresponde a un estudiante' }, { status: 400 });
    }
    const expiresAt = new Date(userRow.email_verification_expires as string);
    if (expiresAt < new Date()) {
      return NextResponse.json({ success: false, error: 'Token caducado' }, { status: 400 });
    }
    // Marcar email como verificado y limpiar token
    const { error: updateError } = await supabaseAdmin
      .from('system_users')
      .update({ email_verified: true, email_verification_token: null, email_verification_expires: null })
      .eq('id', userRow.id);
    if (updateError) {
      return NextResponse.json({ success: false, error: 'No se pudo verificar el correo' }, { status: 500 });
    }
    // Redirigir al panel con parámetro de éxito
    return NextResponse.redirect('/student-dashboard/settings?email=verified');
  } catch (err: any) {
    console.error('Error verificando email:', err);
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}


