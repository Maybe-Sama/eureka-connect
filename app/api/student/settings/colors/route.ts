import { NextRequest, NextResponse } from 'next/server';
import { validateSession, hashPassword } from '@/lib/auth-complex';
import { getPreferencesForCurrentStudent, updatePreferencesForCurrentStudent } from '@/lib/repos/preferences.repo';

/**
 * Devuelve los colores personalizados del alumno actual.
 * Espera recibir el token de sesión en la query (?token=...).
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');
    if (!token) {
      return NextResponse.json({ success: false, error: 'Token requerido' }, { status: 400 });
    }
    const result = await validateSession(token);
    if (!result.success || !result.user || result.user.userType !== 'student') {
      return NextResponse.json({ success: false, error: 'Sesión inválida' }, { status: 401 });
    }
    const prefs = await getPreferencesForCurrentStudent(result.user.id);
    return NextResponse.json({ success: true, primary_color: prefs.primary_color, accent_color: prefs.accent_color });
  } catch (error: any) {
    console.error('Error obteniendo preferencias:', error);
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}

/**
 * Actualiza los colores personalizados del alumno actual.
 * Requiere token, primary_color y accent_color en el body.
 */
export async function PUT(request: NextRequest) {
  try {
    const { token, primary_color, accent_color } = await request.json();
    if (!token || !primary_color || !accent_color) {
      return NextResponse.json({ success: false, error: 'Datos requeridos' }, { status: 400 });
    }
    const result = await validateSession(token);
    if (!result.success || !result.user || result.user.userType !== 'student') {
      return NextResponse.json({ success: false, error: 'Sesión inválida' }, { status: 401 });
    }
    await updatePreferencesForCurrentStudent(result.user.id, { primary_color, accent_color });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error actualizando preferencias:', error);
    return NextResponse.json({ success: false, error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}






