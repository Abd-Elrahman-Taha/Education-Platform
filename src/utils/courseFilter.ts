import { Course } from '../types/api.types';
import { AcademicYear } from '../types';

/**
 * Checks if a course matches a selected Academic Year.
 * Accurately handles:
 * 1. Backend EducationStage ('Secondary') and Grade ('1', '2', '3')
 * 2. Explicit academicYear property ('first_secondary', 'second_secondary', 'third_secondary')
 * 3. Arabic & English keyword matching in Title and Description for legacy/unmigrated courses
 */
export function matchesAcademicYear(
  course: Course,
  year: AcademicYear | 'all' | string
): boolean {
  if (!year || year === 'all') return true;

  // 1. Direct academicYear property if present (legacy / mock / payload)
  const rawYear = (course as any).academicYear || (course as any).AcademicYear;
  if (rawYear === year) return true;

  // 2. Structured EducationStage + Grade from backend
  const stage = course.EducationStage;
  const grade = String(course.Grade ?? '').trim();

  // If EducationStage is set to non-Secondary (e.g. Primary, Preparatory), it shouldn't match secondary years
  const isSecondaryStage = !stage || stage === 'Secondary';

  if (isSecondaryStage && grade) {
    if (year === 'first_secondary' && grade === '1') return true;
    if (year === 'second_secondary' && grade === '2') return true;
    if (year === 'third_secondary' && grade === '3') return true;
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
