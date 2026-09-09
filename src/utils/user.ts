/**
 * Helper to determine if a string is a role or generic placeholder rather than a real user name.
 */
export function isPlaceholderName(name?: string | null, role?: string): boolean {
  if (!name || typeof name !== 'string') return true;
  const clean = name.trim().toLowerCase();
  if (!clean) return true;

  // Phone numbers or pure digits: ALWAYS a placeholder/invalid name!
  if (/^\+?[0-9\s\-]+$/.test(clean)) return true;

  // If role is admin/teacher, "admin", "administrator", "مدير", "مدير المنصة" ARE valid usernames!
  const isAdmin = role === 'admin' || role === 'Admin' || role === 'teacher';
  if (isAdmin) {
    if (['admin', 'administrator', 'superadmin', 'مدير', 'مدير المنصة', 'admin user'].includes(clean)) {
      return false; // Valid admin username!
    }
  }

  const placeholders = new Set([
    'student',
    'user',
    'null',
    'undefined',
    'demo',
    'guest',
    'زائر',
    'مستخدم',
    'مستخدم المنصة',
    'طالب',
    'طالب المنصة',
    'طالب مسجل',
    'طالب المنظومة',
    'حساب الطالب',
    'ولي أمر',
    'parent',
    'المشرف العام',
  ]);

  if (!isAdmin) {
    placeholders.add('admin');
    placeholders.add('administrator');
    placeholders.add('superadmin');
    placeholders.add('مدير');
    placeholders.add('مدير المنصة');
  }

  if (placeholders.has(clean)) return true;

  // If too short (less than 2 characters)
  if (clean.length < 2) return true;

  return false;
}
