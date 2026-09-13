import { EducationStage } from '../types/api.types';
import { AcademicYear } from '../types';

export interface StageDefinition {
  key: EducationStage;
  label: string;
  grades: { value: string; label: string }[];
}

/**
 * Supported Backend Education Stages (Exact Choices):
 * 1. Primary
 * 2. Secondary
 * 3. University
 * 4. Preparatory
 */
export const EDUCATION_STAGES: StageDefinition[] = [
  {
    key: 'Primary',
    label: 'المرحلة الابتدائية (Primary)',
    grades: [
      { value: '1', label: 'الصف الأول الابتدائي' },
      { value: '2', label: 'الصف الثاني الابتدائي' },
      { value: '3', label: 'الصف الثالث الابتدائي' },
      { value: '4', label: 'الصف الرابع الابتدائي' },
      { value: '5', label: 'الصف الخامس الابتدائي' },
      { value: '6', label: 'الصف السادس الابتدائي' },
    ],
  },
  {
    key: 'Secondary',
    label: 'المرحلة الثانوية (Secondary)',
    grades: [
      { value: '1', label: 'الصف الأول الثانوي' },
      { value: '2', label: 'الصف الثاني الثانوي' },
      { value: '3', label: 'الصف الثالث الثانوي' },
    ],
  },
  {
    key: 'University',
    label: 'المرحلة الجامعية (University)',
    grades: [
      { value: '1', label: 'الفرقة الأولى' },
      { value: '2', label: 'الفرقة الثانية' },
      { value: '3', label: 'الفرقة الثالثة' },
      { value: '4', label: 'الفرقة الرابعة' },
    ],
  },
  {
    key: 'Preparatory',
    label: 'المرحلة الإعدادية (Preparatory)',
    grades: [
      { value: '1', label: 'الصف الأول الإعدادي' },
      { value: '2', label: 'الصف الثاني الإعدادي' },
      { value: '3', label: 'الصف الثالث الإعدادي' },
    ],
  },
];

export function getStageLabel(stage?: string): string {
  if (!stage) return 'المرحلة الثانوية';
  const norm = stage.toLowerCase().trim();
  if (norm === 'primary' || norm.includes('ابتدائ')) return 'المرحلة الابتدائية';
  if (norm === 'secondary' || norm.includes('ثانو')) return 'المرحلة الثانوية';
  if (norm === 'university' || norm === 'college' || norm.includes('جامع') || norm.includes('كلية')) {
    return 'المرحلة الجامعية';
  }
  if (
    norm === 'preparatory' ||
    norm === 'middle' ||
    norm === 'prep' ||
    norm.includes('إعداد') ||
    norm.includes('اعداد')
  ) {
    return 'المرحلة الإعدادية';
  }
  return stage;
}

export function getGradeLabel(stage?: string, grade?: string | number): string {
  if (grade === undefined || grade === null) return 'الصف الدراسي';
  const gStr = String(grade).trim();
  const stageDef = EDUCATION_STAGES.find(
    (s) => s.key === stage || s.label.includes(stage || '') || getStageLabel(s.key) === getStageLabel(stage)
  );
  const found = stageDef?.grades.find((g) => g.value === gStr);
  if (found) return found.label;

  if (gStr === '1') return 'الصف الأول';
  if (gStr === '2') return 'الصف الثاني';
  if (gStr === '3') return 'الصف الثالث';
  if (gStr === '4') return 'الصف الرابع';
  if (gStr === '5') return 'الصف الخامس';
  if (gStr === '6') return 'الصف السادس';
  return `الصف ${gStr}`;
}

export function mapStageGradeToAcademicYear(stage?: string, grade?: string | number): AcademicYear | undefined {
  if (!stage && !grade) return undefined;
  const s = (stage || '').toLowerCase();
  const g = String(grade || '').trim();
  if (s.includes('secondary') || s.includes('ثانو') || !stage) {
    if (g === '1') return 'first_secondary';
    if (g === '2') return 'second_secondary';
    if (g === '3') return 'third_secondary';
  }
  return undefined;
}
