import { Course } from '../types/api.types';
import { AcademicYear } from '../types';

/**
 * Checks if a course matches a selected Academic Year.
 * Accurately handles:
 * 1. Backend EducationStage ('Secondary') and Grade ('1', '2', '3')
 * 2. Explicit academicYear property ('first_secondary', 'second_secondary', 'third_secondary')
 * 3. Arabic & English keyword matching in Title and Description for legacy/unmigrated courses
 */
function normalizeYear(val: string): 'first_secondary' | 'second_secondary' | 'third_secondary' | string {
  const s = String(val || '').toLowerCase().trim();
  if (s === '1' || s === 'first' || s.includes('first') || s.includes('الأول') || s.includes('الاول') || s.includes('1 ثانوي') || s.includes('1ث')) return 'first_secondary';
  if (s === '2' || s === 'second' || s.includes('second') || s.includes('الثاني') || s.includes('التاني') || s.includes('2 ثانوي') || s.includes('2ث')) return 'second_secondary';
  if (s === '3' || s === 'third' || s.includes('third') || s.includes('الثالث') || s.includes('التالت') || s.includes('3 ثانوي') || s.includes('3ث')) return 'third_secondary';
  return s;
}

export function matchesAcademicYear(
  course: Course,
  year: AcademicYear | 'all' | string
): boolean {
  if (!year || year === 'all') return true;

  const targetYear = normalizeYear(year);

  // 1. Direct academicYear or AcademicYear property
  const rawYear = (course as any).academicYear || (course as any).AcademicYear;
  if (rawYear && normalizeYear(rawYear) === targetYear) return true;

  // 2. Structured EducationStage + Grade from backend
  const grade = String(course.Grade ?? '').trim();
  if (grade && normalizeYear(grade) === targetYear) return true;

  const stage = course.EducationStage;
  const isSecondaryStage = !stage || stage === 'Secondary';
  if (isSecondaryStage && grade) {
    if (targetYear === 'first_secondary' && (grade === '1' || grade.toLowerCase().includes('first'))) return true;
    if (targetYear === 'second_secondary' && (grade === '2' || grade.toLowerCase().includes('second'))) return true;
    if (targetYear === 'third_secondary' && (grade === '3' || grade.toLowerCase().includes('third'))) return true;
  }

  // 3. Fallback: Semantic title & description search
  const text = `${course.Title || ''} ${course.Description || ''}`.toLowerCase();

  if (year === 'first_secondary') {
    return (
      text.includes('الأول الثانوي') ||
      text.includes('الصف الأول') ||
      text.includes('الصف الاول') ||
      text.includes('أول ثانوي') ||
      text.includes('اول ثانوي') ||
      text.includes('1 ثانوي') ||
      text.includes('1ث') ||
      text.includes('sec1') ||
      text.includes('sec 1') ||
      text.includes('first secondary')
    );
  }

  if (year === 'second_secondary') {
    return (
      text.includes('الثاني الثانوي') ||
      text.includes('الصف الثاني') ||
      text.includes('تاني ثانوي') ||
      text.includes('ثاني ثانوي') ||
      text.includes('2 ثانوي') ||
      text.includes('2ث') ||
      text.includes('sec2') ||
      text.includes('sec 2') ||
      text.includes('second secondary')
    );
  }

  if (year === 'third_secondary') {
    return (
      text.includes('الثالث الثانوي') ||
      text.includes('الصف الثالث') ||
      text.includes('تالت ثانوي') ||
      text.includes('ثالث ثانوي') ||
      text.includes('3 ثانوي') ||
      text.includes('3ث') ||
      text.includes('sec3') ||
      text.includes('sec 3') ||
      text.includes('third secondary')
    );
  }

  return false;
}
