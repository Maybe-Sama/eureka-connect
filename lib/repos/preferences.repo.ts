import { supabaseAdmin } from '../supabase-server';
import type { StudentPreferences } from '@/types/settings';

/**
 * Obtiene las preferencias de colores del alumno actual a partir de su userId (UUID de system_users).
 */
export async function getPreferencesForCurrentStudent(userId: string): Promise<StudentPreferences> {
  // Buscar el student_id asociado al userId
  const { data: userRow, error: userError } = await supabaseAdmin
    .from('system_users')
    .select('student_id')
    .eq('id', userId)
    .maybeSingle();

  if (userError || !userRow || !userRow.student_id) {
    throw new Error('No se pudo obtener el alumno asociado al usuario.');
  }

  const studentId = userRow.student_id;

  // Obtener las preferencias del alumno
  const { data: prefs, error: prefsError } = await supabaseAdmin
    .from('student_preferences')
    .select('student_id, primary_color, accent_color, updated_at')
    .eq('student_id', studentId)
    .maybeSingle();

  if (prefsError || !prefs) {
    throw new Error('No se encontraron preferencias para el alumno.');
  }

  return prefs as StudentPreferences;
}

/**
 * Actualiza las preferencias de colores del alumno actual.
 * Valida que los colores sean códigos HEX válidos y los normaliza a formato #RRGGBB en mayúsculas.
 */
export async function updatePreferencesForCurrentStudent(
  userId: string,
  data: { primary_color: string; accent_color: string },
): Promise<void> {
  // Validar y normalizar color
  function normalizeColor(color: string): string {
    let hex = color.trim().toUpperCase();
    if (!hex.startsWith('#')) hex = `#${hex}`;
    // #RGB → #RRGGBB
    const rgbMatch = /^#([0-9A-F]{3})$/i.exec(hex);
    if (rgbMatch) {
      const [_, rgb] = rgbMatch;
      hex = `#${rgb[0]}${rgb[0]}${rgb[1]}${rgb[1]}${rgb[2]}${rgb[2]}`;
    }
    // Validar formato #RRGGBB o #RRGGBBAA
    if (!/^#([0-9A-F]{6})([0-9A-F]{2})?$/i.test(hex)) {
      throw new Error(`Formato de color inválido: ${color}`);
    }
    return hex;
  }

  const primaryColor = normalizeColor(data.primary_color);
  const accentColor = normalizeColor(data.accent_color);

  // Obtener el student_id desde system_users
  const { data: userRow, error: userError } = await supabaseAdmin
    .from('system_users')
    .select('student_id')
    .eq('id', userId)
    .maybeSingle();

  if (userError || !userRow || !userRow.student_id) {
    throw new Error('No se pudo obtener el alumno asociado al usuario.');
  }

  const studentId = userRow.student_id;

  // Actualizar las preferencias
  const { error: updateError } = await supabaseAdmin
    .from('student_preferences')
    .update({
      primary_color: primaryColor,
      accent_color: accentColor,
      updated_at: new Date().toISOString(),
    })
    .eq('student_id', studentId);

  if (updateError) {
    throw new Error('No se pudieron actualizar las preferencias.');
  }
}


