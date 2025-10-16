// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { validateSession, hashPassword } from '@/lib/auth-complex';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const { token, currentPassword, newPassword } = await request.json();
    if (!token || !currentPassword || !newPassword) {
      return NextResponse.json({ success: false, error: 'Token, contraseña actual y nueva son requeridos' }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ success: false, error: 'La nueva contraseña debe tener al menos 8 caracteres' }, { status: 400 });
    }
    const result = await validateSession(token);
    if (!result.success || !result.user || result.user.userType !== 'student') {
      return NextResponse.json({ success: false, error: 'Sesión inválida' }, { status: 401 });
    }
    const userId = result.user.id;
    // Obtener el hash actual
    const { data: userRow, error } = await supabaseAdmin
      .from('system_users')
      .select('password_hash')
      .eq('id', userId)
      .single();
    if (error || !userRow) {
      return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 });
    }
    const currentHash = hashPassword(currentPassword);
    if (userRow.password_hash !== currentHash) {
      return NextResponse.json({ success: false, error: 'Contraseña actual incorrecta' }, { status: 400 });
    }
    const newHash = hashPassword(newPassword);
    if (newHash === userRow.password_hash) {
      return NextResponse.json({ success: false, error: 'La nueva contraseña no puede ser igual a la anterior' }, { status: 400 });
    }
    const { error: updateError } = await supabaseAdmin
      .from('system_users')
      .update({ password_hash: newHash })
      .eq('id', userId);
    if (updateError) {
      return NextResponse.json({ success: false, error: 'No se pudo actualizar la contraseña' }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error cambiando contraseña:', err);
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}

















