/**
 * Helper to determine if a string is a role or generic placeholder rather than a real user name.
 */
export function isPlaceholderName(name?: string | null): boolean {
  if (!name || typeof name !== 'string') return true;
  const clean = name.trim().toLowerCase();
  if (!clean) return true;

  const placeholders = new Set([
    'student',
    'admin',
    'teacher',
    'user',
    'superadmin',
    'administrator',
    'parent',
    'guest',
    'null',
    'undefined',
    'demo',
    'طالب',
    'طالب المنصة',
    'طالب مسجل',
    'طالب المنظومة',
    'مدير',
    'مدير المنصة',
    'معلم',
    'معلم المنصة',
    'المشرف العام',
    'ولي أمر',
    'مستخدم',
    'مستخدم المنصة',
    'حساب الطالب',
    'حساب الإدارة',
    'حساب المعلم',
  ]);

  if (placeholders.has(clean)) return true;
  // If it matches phone numbers or only numbers/symbols
  if (/^\+?[0-9\s\-]+$/.test(clean)) return true;
  // If too short (less than 2 characters)
  if (clean.length < 2) return true;

  return false;
}
