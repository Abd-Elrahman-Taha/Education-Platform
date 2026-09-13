import { Course, EducationStage } from '../types/api.types';
import { AcademicYear } from '../types';

/**
 * Normalizes stage value to match canonical EducationStage keys.
 * Handles 'Primary', 'Preparatory', 'Secondary', 'University' and common aliases/Arabic names.
 */
export function normalizeStage(val?: string): EducationStage | string {
  if (!val) return '';
  const s = String(val).toLowerCase().trim();
  if (s === 'primary' || s.includes('ابتدائي') || s.includes('ابتدائية')) return 'Primary';
  if (
    s === 'preparatory' ||
    s === 'middle' ||
    s === 'prep' ||
    s.includes('إعدادي') ||
    s.includes('اعدادي') ||
    s.includes('إعدادية') ||
    s.includes('اعدادية')
  ) {
    return 'Preparatory';
  }
  if (s === 'secondary' || s === 'sec' || s.includes('ثانوي') || s.includes('ثانوية')) return 'Secondary';
  if (s === 'university' || s === 'college' || s.includes('جامع') || s.includes('كلية')) return 'University';
  return val;
}

/**
 * Normalizes grade value to canonical string ('1', '2', '3', '4', '5', '6').
 */
export function normalizeGrade(val?: string | number): string {
  if (val === undefined || val === null) return '';
  const s = String(val).toLowerCase().trim();
  if (
    s === '1' ||
    s === '١' ||
    s.includes('first') ||
    s.includes('أول') ||
    s.includes('اول') ||
    s.includes('الأول') ||
    s.includes('الاول') ||
    s.includes('الفرقة الأولى') ||
    s.includes('الفرقة الاولي')
  ) {
    return '1';
  }
  if (
    s === '2' ||
    s === '٢' ||
    s.includes('second') ||
    s.includes('ثاني') ||
    s.includes('تاني') ||
    s.includes('الثاني') ||
    s.includes('التاني') ||
    s.includes('الفرقة الثانية') ||
    s.includes('الفرقة التانية')
  ) {
    return '2';
  }
  if (
    s === '3' ||
    s === '٣' ||
    s.includes('third') ||
    s.includes('ثالث') ||
    s.includes('تالت') ||
    s.includes('الثالث') ||
    s.includes('التالت') ||
    s.includes('الفرقة الثالثة') ||
    s.includes('الفرقة التالتة')
  ) {
    return '3';
  }
  if (s === '4' || s === '٤' || s.includes('fourth') || s.includes('رابع') || s.includes('الرابع') || s.includes('الفرقة الرابعة')) return '4';
  if (s === '5' || s === '٥' || s.includes('fifth') || s.includes('خامس') || s.includes('الخامس')) return '5';
  if (s === '6' || s === '٦' || s.includes('sixth') || s.includes('سادس') || s.includes('السادس')) return '6';
  return s;
}

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

  // If the course explicitly belongs to another stage (e.g. Primary, Preparatory, University),
  // it should not match secondary academic years.
  const stage = normalizeStage(course.EducationStage || (course as any).educationStage);
  if (stage && stage !== 'Secondary') {
    return false;
  }

  // 1. Direct academicYear or AcademicYear property
  const rawYear = (course as any).academicYear || (course as any).AcademicYear;
  if (rawYear && normalizeYear(rawYear) === targetYear) return true;

  // 2. Structured EducationStage + Grade from backend
  const grade = String(course.Grade ?? '').trim();
  const isSecondaryStage = !stage || stage === 'Secondary';
  if (isSecondaryStage && grade) {
    if (targetYear === 'first_secondary' && (grade === '1' || grade.toLowerCase().includes('first') || grade.includes('الأول'))) return true;
    if (targetYear === 'second_secondary' && (grade === '2' || grade.toLowerCase().includes('second') || grade.includes('الثاني'))) return true;
    if (targetYear === 'third_secondary' && (grade === '3' || grade.toLowerCase().includes('third') || grade.includes('الثالث'))) return true;
  }

  // 3. Fallback: Semantic title & description search
  const text = `${course.Title || ''} ${course.Description || ''}`.toLowerCase();

  if (targetYear === 'first_secondary') {
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

  if (targetYear === 'second_secondary') {
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

  if (targetYear === 'third_secondary') {
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

/**
 * Filter courses specifically for a student based on their EducationStage and Grade.
 * When a student signs in, they only see courses matching their stage & grade.
 * Admins, superadmins, and teachers see all courses.
 */
export function matchesCourseForStudent(
  course: Course,
  student?: {
    educationStage?: string;
    grade?: string | number;
    academicYear?: string;
    role?: string;
    Role?: string;
    isSuperAdmin?: boolean;
  } | null
): boolean {
  if (!student) return true;

  // Admins and teachers have full visibility
  const role = (student.role || student.Role || '').toLowerCase();
  if (role === 'admin' || role === 'superadmin' || role === 'teacher' || student.isSuperAdmin) {
    return true;
  }

  const studentStage = normalizeStage(student.educationStage || (student as any).EducationStage);
  const studentGrade = normalizeGrade(student.grade ?? (student as any).Grade);

  // If student has explicit EducationStage and Grade
  if (studentStage && studentGrade) {
    const courseStage = normalizeStage(course.EducationStage || (course as any).educationStage);
    const courseGrade = normalizeGrade(course.Grade ?? (course as any).grade);

    // 1. If course has structured stage and grade, match strictly
    if (courseStage && courseGrade) {
      return courseStage === studentStage && courseGrade === studentGrade;
    }

    // 2. If course only has stage without explicit grade
    if (courseStage && !courseGrade) {
      if (courseStage !== studentStage) return false;
      const text = `${course.Title || ''} ${course.Description || ''}`.toLowerCase();
      if (studentStage === 'Secondary') {
        const mentionsGrade1 = text.includes('أول') || text.includes('اول') || text.includes('1 ثانوي') || text.includes('1ث') || text.includes('sec1') || text.includes('sec 1');
        const mentionsGrade2 = text.includes('ثاني') || text.includes('تاني') || text.includes('2 ثانوي') || text.includes('2ث') || text.includes('sec2') || text.includes('sec 2');
        const mentionsGrade3 = text.includes('ثالث') || text.includes('تالت') || text.includes('3 ثانوي') || text.includes('3ث') || text.includes('sec3') || text.includes('sec 3');
        if (mentionsGrade1 || mentionsGrade2 || mentionsGrade3) {
          if (studentGrade === '1') return mentionsGrade1;
          if (studentGrade === '2') return mentionsGrade2;
          if (studentGrade === '3') return mentionsGrade3;
          return false;
        }
      }
      return true;
    }

    // 3. If student is Secondary stage, test against academicYear matcher
    if (studentStage === 'Secondary') {
      const yearKey: AcademicYear = studentGrade === '1' ? 'first_secondary' : studentGrade === '2' ? 'second_secondary' : 'third_secondary';
      return matchesAcademicYear(course, yearKey);
    }

    // 4. Fallback: Semantic title & description search
    const text = `${course.Title || ''} ${course.Description || ''}`.toLowerCase();
    const stageKeywords: Record<string, string[]> = {
      Primary: ['ابتدائي', 'ابتدائية', 'primary'],
      Preparatory: ['إعدادي', 'اعدادي', 'إعدادية', 'اعدادية', 'preparatory', 'prep', 'middle'],
      Secondary: ['ثانوي', 'ثانوية', 'secondary', 'sec'],
      University: ['جامعي', 'جامعية', 'كلية', 'جامعة', 'university', 'college'],
    };

    const keywords = stageKeywords[studentStage] || [];
    const stageMatches = keywords.some((kw) => text.includes(kw));

    if (stageMatches) {
      if (text.includes(studentGrade) || text.includes(`صف ${studentGrade}`) || text.includes(`الصف ${studentGrade}`)) {
        return true;
      }
    }

    return false;
  }

  // If student only has academicYear
  const studentYear = student.academicYear || (student as any).AcademicYear;
  if (studentYear) {
    return matchesAcademicYear(course, studentYear);
  }

  return true;
}
