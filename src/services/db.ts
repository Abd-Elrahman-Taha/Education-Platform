import {
  StudentDashboardData,
  ProgressTimelineData,
  Lesson,
  LessonHomework,
  ExamRecord,
  ExamStats,
  TeacherMessage,
  SystemNotification,
  AIMessage,
  AcademicYear,
  StudentProfile,
  Package,
  User,
  TeacherPermission,
} from '../types';

const STORAGE_KEYS = {
  DASHBOARD: 'syntax_mock_dashboard_v2',
  LESSONS: 'syntax_mock_lessons_v2',
  EXAM_HISTORY: 'syntax_mock_exam_history_v2',
  MESSAGES: 'syntax_mock_messages_v2',
  NOTIFICATIONS: 'syntax_mock_notifications_v2',
  AI_CHAT: 'syntax_mock_ai_chat_v2',
  STUDENTS: 'syntax_mock_students_v2',
  PACKAGES: 'syntax_mock_packages_v2',
  TEACHERS: 'syntax_mock_teachers_v2',
};

// ── INITIAL SEED DATA ──────────────────────────────────────────

const initialPackages: Package[] = [
  {
    id: 'pkg-1',
    name: 'باقة التفاضل والتكامل الكاملة',
    description: 'وصول لجميع محاضرات التفاضل والواجبات وامتحانات البابل شيت والملازم',
    price: 250,
    academicYear: 'third_secondary',
    includedLessonIds: ['lesson-1', 'lesson-2', 'lesson-3', 'lesson-4'],
  },
  {
    id: 'pkg-2',
    name: 'باقة الهندسة الفراغية التخصصية',
    description: 'وصول لجميع محاضرات الهندسة ثلاثية الأبعاد والمجسمات والامتحانات',
    price: 250,
    academicYear: 'third_secondary',
    includedLessonIds: ['lesson-5', 'lesson-6'],
  },
  {
    id: 'pkg-3',
    name: 'الباقة الشاملة (تفاضل + فراغية)',
    description: 'اشتراك شامل لجميع فروع مادة الرياضيات البحتة مع متابعة وبث مباشر أسبوعي ومساعد الذكاء الاصطناعي',
    price: 450,
    academicYear: 'third_secondary',
    includedLessonIds: ['lesson-1', 'lesson-2', 'lesson-3', 'lesson-4', 'lesson-5', 'lesson-6'],
  },
  {
    id: 'pkg-4',
    name: 'باقة الصف الأول الثانوي — رياضيات عامة',
    description: 'الجبر وحساب المثلثات والهندسة المستوية',
    price: 220,
    academicYear: 'first_secondary',
    includedLessonIds: ['lesson-101', 'lesson-102'],
  },
  {
    id: 'pkg-5',
    name: 'باقة الصف الثاني الثانوي — تفاضل وجبر',
    description: 'الدوال الحقيقية والنهايات والتفاضل والتكامل التأسيسي',
    price: 240,
    academicYear: 'second_secondary',
    includedLessonIds: ['lesson-201', 'lesson-202'],
  },
];

const initialStudents: StudentProfile[] = [
  {
    id: 'u_student_demo',
    code: 'CODE-94021',
    nationalId: '30501011234567',
    name: 'أحمد طالب (طالب)',
    email: 'student.demo@edulearn.com',
    phone: '01012345678',
    parentPhone: '01198765432',
    academicYear: 'third_secondary',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
    packageId: 'pkg-3',
    packageName: 'الباقة الشاملة (تفاضل + فراغية)',
    hasAccess: true,
    assignedLessonIds: ['lesson-1', 'lesson-2', 'lesson-3', 'lesson-4', 'lesson-5', 'lesson-6'],
    averageScore: 92,
    attendanceRate: 96,
    registrationDate: '2026-01-15',
    examResults: [
      { examId: 'exam-1', examTitle: 'اختبار المشتقات وقاعدة السلسلة', date: '2026-07-20', score: 3, total: 3, percentage: 100, isPassed: true },
      { examId: 'exam-2', examTitle: 'اختبار مشتقات الدوال المثلثية', date: '2026-07-28', score: 2, total: 3, percentage: 67, isPassed: true },
      { examId: 'diagnostic-exam', examTitle: 'الامتحان التشخيصي الشامل', date: '2026-07-05', score: 4, total: 5, percentage: 80, isPassed: true },
    ],
  },
  {
    id: 'std-2',
    code: 'CODE-88123',
    nationalId: '30602051234568',
    name: 'مريم إبراهيم حسن',
    email: 'maryam@edulearn.com',
    phone: '01599887766',
    parentPhone: '01099887766',
    academicYear: 'third_secondary',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
    packageId: 'pkg-1',
    packageName: 'باقة التفاضل والتكامل الكاملة',
    hasAccess: true,
    assignedLessonIds: ['lesson-1', 'lesson-2', 'lesson-3'],
    averageScore: 98,
    attendanceRate: 100,
    registrationDate: '2026-01-18',
    examResults: [
      { examId: 'exam-1', examTitle: 'اختبار المشتقات وقاعدة السلسلة', date: '2026-07-22', score: 3, total: 3, percentage: 100, isPassed: true },
      { examId: 'exam-2', examTitle: 'اختبار مشتقات الدوال المثلثية', date: '2026-07-29', score: 3, total: 3, percentage: 100, isPassed: true },
    ],
  },
  {
    id: 'std-3',
    code: 'CODE-77241',
    nationalId: '30511121234569',
    name: 'عمر خالد عبد الرحمن',
    email: 'omar.khaled@edulearn.com',
    phone: '01144556677',
    parentPhone: '01244556677',
    academicYear: 'third_secondary',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=100&q=80',
    packageId: 'pkg-3',
    packageName: 'الباقة الشاملة (تفاضل + فراغية)',
    hasAccess: true,
    assignedLessonIds: ['lesson-1', 'lesson-2'],
    averageScore: 94,
    attendanceRate: 92,
    registrationDate: '2026-01-20',
    examResults: [
      { examId: 'exam-1', examTitle: 'اختبار المشتقات وقاعدة السلسلة', date: '2026-07-25', score: 3, total: 3, percentage: 100, isPassed: true },
    ],
  },
  {
    id: 'std-4',
    code: 'CODE-66312',
    nationalId: '30509081234570',
    name: 'مصطفى حسين مصطفى',
    email: 'mostafa@edulearn.com',
    phone: '01122334455',
    parentPhone: '01022334455',
    academicYear: 'third_secondary',
    status: 'blocked',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
    packageId: undefined,
    packageName: 'بدون اشتراك نشط',
    hasAccess: false,
    assignedLessonIds: [],
    averageScore: 45,
    attendanceRate: 40,
    registrationDate: '2026-02-01',
    examResults: [
      { examId: 'exam-1', examTitle: 'اختبار المشتقات وقاعدة السلسلة', date: '2026-07-15', score: 1, total: 3, percentage: 33, isPassed: false },
    ],
  },
  {
    id: 'std-5',
    code: 'CODE-55101',
    nationalId: '30704051234571',
    name: 'يوسف تامر الشناوي',
    email: 'youssef.tamer@edulearn.com',
    phone: '01288776655',
    parentPhone: '01188776655',
    academicYear: 'first_secondary',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80',
    packageId: 'pkg-4',
    packageName: 'باقة الصف الأول الثانوي — رياضيات عامة',
    hasAccess: true,
    assignedLessonIds: ['lesson-101', 'lesson-102'],
    averageScore: 91,
    attendanceRate: 95,
    registrationDate: '2026-02-10',
    examResults: [
      { examId: 'exam-101', examTitle: 'اختبار المصفوفات والمحددات', date: '2026-07-18', score: 5, total: 5, percentage: 100, isPassed: true },
    ],
  },
  {
    id: 'std-6',
    code: 'CODE-55102',
    nationalId: '30708091234572',
    name: 'سارة هاني عبد الجواد',
    email: 'sara.hany@edulearn.com',
    phone: '01033445566',
    parentPhone: '01233445566',
    academicYear: 'first_secondary',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80',
    packageId: 'pkg-4',
    packageName: 'باقة الصف الأول الثانوي — رياضيات عامة',
    hasAccess: true,
    assignedLessonIds: ['lesson-101'],
    averageScore: 88,
    attendanceRate: 90,
    registrationDate: '2026-02-15',
    examResults: [
      { examId: 'exam-101', examTitle: 'اختبار المصفوفات والمحددات', date: '2026-07-20', score: 4, total: 5, percentage: 80, isPassed: true },
    ],
  },
  {
    id: 'std-7',
    code: 'CODE-44201',
    nationalId: '30605061234573',
    name: 'كريم ماجد صبحي',
    email: 'karim.maged@edulearn.com',
    phone: '01511223344',
    parentPhone: '01011223344',
    academicYear: 'second_secondary',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=100&q=80',
    packageId: 'pkg-5',
    packageName: 'باقة الصف الثاني الثانوي — تفاضل وجبر',
    hasAccess: true,
    assignedLessonIds: ['lesson-201', 'lesson-202'],
    averageScore: 95,
    attendanceRate: 98,
    registrationDate: '2026-01-25',
    examResults: [
      { examId: 'exam-201', examTitle: 'اختبار نهايات الدوال عند اللانهاية', date: '2026-07-22', score: 4, total: 4, percentage: 100, isPassed: true },
    ],
  },
];

const initialTeachers: User[] = [
  {
    id: 'u_teacher_demo',
    name: 'أ. د. محمد الشريف (معلم أول)',
    email: 'teacher.demo@edulearn.com',
    phone: '01055544332',
    role: 'teacher',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80',
    registrationDate: '2025-09-15',
    permissions: [
      'view_students',
      'view_reports',
      'upload_lessons',
      'edit_lessons',
      'publish_lessons',
      'upload_exams',
      'edit_exams',
      'publish_exams',
      'assign_lessons',
      'assign_packages',
    ],
  },
  {
    id: 't-2',
    name: 'د. سارة عبد الفتاح (معلمة هندسة)',
    email: 'sara.math@edulearn.com',
    phone: '01211223344',
    role: 'teacher',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80',
    registrationDate: '2025-10-10',
    permissions: ['view_students', 'view_reports', 'upload_lessons', 'edit_lessons', 'upload_exams'],
  },
];

const initialLessons: Lesson[] = [
  // ── THIRD SECONDARY LESSONS ──────────────────────────────
  {
    id: 'lesson-1',
    title: 'المحاضرة 1: المشتقات وقاعدة السلسلة',
    subtitle: 'تفاضل الدوال المركبة وتطبيقاتها في المسائل الفيزيائية والهندسية',
    subject: 'التفاضل والتكامل',
    description: 'شرح تفصيلي لقواعد اشتقاق الدوال المركبة وكيفية تطبيق قاعدة السلسلة مع أفكار امتحانات الثانوية العامة.',
    duration: '1:45:00',
    order: 1,
    academicYear: 'third_secondary',
    isPublished: true,
    isLocked: false,
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    pdfUrl: 'https://www.w3.org/W3C/DesignIssues/Overview.html',
    pdfTitle: 'ملزمة المحاضرة الأولى — المشتقات والقواعد الأساسية.pdf',
    homework: {
      id: 'hw-1',
      title: 'واجب المحاضرة الأولى — قاعدة السلسلة',
      description: 'أجب على الأسئلة التالية لتثبيت مفاهيم قاعدة السلسلة.',
      dueDate: '2026-08-05',
      isSubmitted: true,
      score: 100,
      questions: [
        {
          id: 101,
          text: 'إذا كانت y = (2x + 1)⁵، فإن dy/dx =',
          options: [
            { key: 'A', label: '5(2x + 1)⁴' },
            { key: 'B', label: '10(2x + 1)⁴' },
            { key: 'C', label: '10(2x + 1)⁵' },
            { key: 'D', label: '2(2x + 1)⁴' },
          ],
          correctAnswer: 'B',
          explanation: 'مشتقة القوس ضرب مشتقة ما داخل القوس: 5(2x + 1)⁴ × 2 = 10(2x + 1)⁴',
        },
      ],
    },
    exam: {
      id: 'exam-1',
      title: 'اختبار المحاضرة الأولى: المشتقات وقاعدة السلسلة',
      durationMinutes: 20,
      passingScorePercentage: 60,
      isPublished: true,
      questions: [
        {
          id: 1,
          text: 'إذا كانت f(x) = 3x³ − 5x² + 2x − 7، فإن f\'(x) =',
          options: [
            { key: 'A', label: '9x² − 10x + 2' },
            { key: 'B', label: '9x² − 10x − 2' },
            { key: 'C', label: '3x² − 10x + 2' },
            { key: 'D', label: '9x³ − 10x + 2' },
          ],
          correctAnswer: 'A',
          explanation: 'f\'(x) = 3·3x² − 5·2x + 2 = 9x² − 10x + 2',
        },
        {
          id: 2,
          text: 'إذا كانت y = e^(3x)، فإن dy/dx =',
          options: [
            { key: 'A', label: 'e^(3x)' },
            { key: 'B', label: '3 · e^(3x)' },
            { key: 'C', label: '3x · e^(3x-1)' },
            { key: 'D', label: 'e^(3)' },
          ],
          correctAnswer: 'B',
          explanation: 'dy/dx = 3·e^(3x)',
        },
      ],
    },
    userExamPassed: true,
    userExamScore: 100,
  },
  {
    id: 'lesson-2',
    title: 'المحاضرة 2: مشتقات الدوال المثلثية والهندسية',
    subtitle: 'تفاضل الجا والجتا والظا والدوال الأسية واللوغاريتمية',
    subject: 'التفاضل والتكامل',
    description: 'شرح وافي لمشتقات الدوال المثلثية المباشرة والعكسية وتفاضل اللوغاريتم الطبيعي مع تدريبات شاملة.',
    duration: '1:30:00',
    order: 2,
    academicYear: 'third_secondary',
    isPublished: true,
    isLocked: false,
    prerequisiteLessonId: 'lesson-1',
    prerequisiteExamTitle: 'اختبار المحاضرة الأولى: المشتقات وقاعدة السلسلة',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    pdfUrl: 'https://www.w3.org/W3C/DesignIssues/Overview.html',
    pdfTitle: 'ملزمة المحاضرة الثانية — مشتقات الدوال المثلثية.pdf',
    homework: {
      id: 'hw-2',
      title: 'واجب المحاضرة الثانية — الدوال المثلثية',
      description: 'حل التدريبات التالية على تفاضل sin, cos, tan, ln, e.',
      dueDate: '2026-08-10',
      isSubmitted: false,
      questions: [
        {
          id: 201,
          text: 'تفاضل الدالة g(x) = tan(4x) بالنسبة لـ x يساوي:',
          options: [
            { key: 'A', label: 'sec²(4x)' },
            { key: 'B', label: '4 · sec²(4x)' },
            { key: 'C', label: '4 · cot(4x)' },
            { key: 'D', label: 'sec(4x) · tan(4x)' },
          ],
          correctAnswer: 'B',
          explanation: 'مشتقة tan(u) = sec²(u) · u\' = 4 sec²(4x)',
        },
      ],
    },
    exam: {
      id: 'exam-2',
      title: 'اختبار المحاضرة الثانية: مشتقات الدوال المثلثية',
      durationMinutes: 25,
      passingScorePercentage: 60,
      isPublished: true,
      questions: [
        {
          id: 1,
          text: 'ما هو تفاضل الدالة g(x) = sin(x²) بالنسبة لـ x؟',
          options: [
            { key: 'A', label: 'cos(x²)' },
            { key: 'B', label: '2x · cos(x²)' },
            { key: 'C', label: '2x · sin(x²)' },
            { key: 'D', label: 'cos(2x)' },
          ],
          correctAnswer: 'B',
          explanation: 'g\'(x) = cos(x²) · 2x = 2x·cos(x²)',
        },
      ],
    },
    userExamPassed: false,
  },
  {
    id: 'lesson-3',
    title: 'المحاضرة 3: تطبيقات هندسية للمشتقة الأولى (المماس والعمودي)',
    subtitle: 'معادلة المماس والعمودي للنقط الواقعة على المنحنيات والهندسة التحليلية',
    subject: 'التفاضل والتكامل',
    description: 'شرح ميل المماس وميل العمودي، والزاوية التي يصنعها المماس مع الاتجاه الموجب لمحور السينات.',
    duration: '2:00:00',
    order: 3,
    academicYear: 'third_secondary',
    isPublished: true,
    isLocked: true,
    prerequisiteLessonId: 'lesson-2',
    prerequisiteExamTitle: 'اختبار المحاضرة الثانية: مشتقات الدوال المثلثية',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    pdfUrl: 'https://www.w3.org/W3C/DesignIssues/Overview.html',
    pdfTitle: 'ملزمة المحاضرة الثالثة — المماس والعمودي.pdf',
    homework: {
      id: 'hw-3',
      title: 'واجب المحاضرة الثالثة — معادلات المماس',
      description: 'أوجد معادلات المماس والعمودي للمنحنيات في النقاط المعطاة.',
      dueDate: '2026-08-18',
      isSubmitted: false,
      questions: [],
    },
    exam: {
      id: 'exam-3',
      title: 'اختبار المحاضرة الثالثة: المماس والعمودي',
      durationMinutes: 30,
      passingScorePercentage: 60,
      isPublished: true,
      questions: [],
    },
  },
  {
    id: 'lesson-4',
    title: 'المحاضرة 4: المعدلات الزمنية المرتبطة ورسم المنحنيات',
    subtitle: 'مسائل المعدلات الزمانية والتطبيق على السوائل والمجسمات والهندسة',
    subject: 'التفاضل والتكامل',
    description: 'تحليل وتفكيك مسائل المعدلات الزمنية المرتبطة بحساب المشتقة بالنسبة للزمن t.',
    duration: '2:15:00',
    order: 4,
    academicYear: 'third_secondary',
    isPublished: false, // Hidden by teacher example
    isLocked: true,
    prerequisiteLessonId: 'lesson-3',
    prerequisiteExamTitle: 'اختبار المحاضرة الثالثة: المماس والعمودي',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    pdfUrl: 'https://www.w3.org/W3C/DesignIssues/Overview.html',
    pdfTitle: 'ملزمة المحاضرة الرابعة — المعدلات الزمنية.pdf',
    homework: {
      id: 'hw-4',
      title: 'واجب المحاضرة الرابعة — المعدلات الزمنية',
      description: 'تمارين ومسائل امتحانات سابقة.',
      dueDate: '2026-08-25',
      isSubmitted: false,
      questions: [],
    },
    exam: {
      id: 'exam-4',
      title: 'اختبار المحاضرة الرابعة: المعدلات الزمنية المرتبطة',
      durationMinutes: 30,
      passingScorePercentage: 60,
      isPublished: false,
      questions: [],
    },
  },
  {
    id: 'lesson-5',
    title: 'المحاضرة 5: النظام الإحداثي المتعامد ثلاثي الأبعاد',
    subtitle: 'المتجهات في الفراغ، الضرب القياسي والضرب الاتجاهي',
    subject: 'الهندسة الفراغية',
    description: 'تحديد إحداثيات النقط في الفراغ ثلاثي الأبعاد ومعادلة الكرة في الفراغ مع رسوم توضيحية ثلاثية الأبعاد.',
    duration: '1:50:00',
    order: 5,
    academicYear: 'third_secondary',
    isPublished: true,
    isLocked: false,
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    pdfUrl: 'https://www.w3.org/W3C/DesignIssues/Overview.html',
    pdfTitle: 'ملزمة الهندسة الفراغية — المتجهات في الفضاء ثلاثي الأبعاد.pdf',
    homework: {
      id: 'hw-5',
      title: 'واجب الهندسة الفراغية 1',
      description: 'حل مسائل المتجهات ومعادلة الكرة.',
      dueDate: '2026-08-15',
      isSubmitted: false,
      questions: [],
    },
    exam: {
      id: 'exam-5',
      title: 'اختبار الهندسة الفراغية 1: المتجهات',
      durationMinutes: 25,
      passingScorePercentage: 60,
      isPublished: true,
      questions: [],
    },
  },

  // ── FIRST SECONDARY LESSONS ──────────────────────────────
  {
    id: 'lesson-101',
    title: 'المحاضرة 1: تنظيم البيانات في مصفوفات',
    subtitle: 'أنواع المصفوفات وتساوي مصفوفتين وجمع وطرح المصفوفات',
    subject: 'الجبر وحساب المثلثات',
    description: 'مدخل لعلم الجبر الخطي للمرحلة الثانوية مع تطبيقات حياتية ومسائل متدرجة الصعوبة.',
    duration: '1:20:00',
    order: 1,
    academicYear: 'first_secondary',
    isPublished: true,
    isLocked: false,
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    pdfUrl: 'https://www.w3.org/W3C/DesignIssues/Overview.html',
    pdfTitle: 'ملزمة الصف الأول الثانوي — المصفوفات.pdf',
    homework: {
      id: 'hw-101',
      title: 'واجب المصفوفات 1',
      description: 'أجب عن مسائل ضرب المصفوفات.',
      dueDate: '2026-08-12',
      isSubmitted: true,
      score: 100,
      questions: [],
    },
    exam: {
      id: 'exam-101',
      title: 'اختبار المصفوفات والمحددات',
      durationMinutes: 20,
      passingScorePercentage: 60,
      isPublished: true,
      questions: [],
    },
    userExamPassed: true,
    userExamScore: 100,
  },

  // ── SECOND SECONDARY LESSONS ─────────────────────────────
  {
    id: 'lesson-201',
    title: 'المحاضرة 1: مفهوم نهاية الدالة عند نقطة وعند اللانهاية',
    subtitle: 'إيجاد النهاية جبرياً وتحليل المقادير وحساب النهايات بالنظرية والنتيجة',
    subject: 'التفاضل والتكامل',
    description: 'تأسيس شامل لقواعد النهايات تمهيداً للتفاضل والتكامل في المرحلة الثانوية.',
    duration: '1:35:00',
    order: 1,
    academicYear: 'second_secondary',
    isPublished: true,
    isLocked: false,
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    pdfUrl: 'https://www.w3.org/W3C/DesignIssues/Overview.html',
    pdfTitle: 'ملزمة الصف الثاني الثانوي — حساب النهايات.pdf',
    homework: {
      id: 'hw-201',
      title: 'واجب حساب النهايات',
      description: 'حل مسائل النهايات بالقسمة المطولة والضرب في المرافق.',
      dueDate: '2026-08-14',
      isSubmitted: false,
      questions: [],
    },
    exam: {
      id: 'exam-201',
      title: 'اختبار نهايات الدوال عند اللانهاية',
      durationMinutes: 25,
      passingScorePercentage: 60,
      isPublished: true,
      questions: [],
    },
    userExamPassed: true,
    userExamScore: 100,
  },
];

// ── LOCAL STORAGE HELPERS ──────────────────────────────────────

function getStored<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('Error writing to localStorage', err);
  }
}

// ── DB METHODS ────────────────────────────────────────────────

export const mockDB = {
  // ── STUDENTS & PARENT VERIFICATION ──
  getStudents(academicYear?: AcademicYear): StudentProfile[] {
    const students = getStored<StudentProfile[]>(STORAGE_KEYS.STUDENTS, initialStudents);
    if (!academicYear) return students;
    return students.filter(s => s.academicYear === academicYear);
  },

  getStudentById(id: string): StudentProfile | undefined {
    const students = this.getStudents();
    return students.find(s => s.id === id);
  },

  verifyStudentForParent(studentCode: string, nationalId: string): StudentProfile | null {
    const students = this.getStudents();
    const cleanCode = studentCode.trim().toUpperCase();
    const cleanNationalId = nationalId.trim();

    const matched = students.find(s =>
      (s.code.toUpperCase() === cleanCode || s.phone === cleanCode) &&
      (s.nationalId === cleanNationalId || s.parentPhone === cleanNationalId)
    );

    return matched || null;
  },

  getTopStudents(academicYear?: AcademicYear): StudentProfile[] {
    const students = this.getStudents(academicYear);
    return [...students]
      .filter(s => s.status === 'active')
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, 10);
  },

  addStudent(studentData: Omit<StudentProfile, 'id' | 'registrationDate' | 'examResults'>): StudentProfile {
    const students = this.getStudents();
    const newStudent: StudentProfile = {
      ...studentData,
      id: `std-${Date.now()}`,
      registrationDate: new Date().toISOString().slice(0, 10),
      examResults: [],
    };
    students.unshift(newStudent);
    setStored(STORAGE_KEYS.STUDENTS, students);
    return newStudent;
  },

  updateStudent(studentId: string, updates: Partial<StudentProfile>): StudentProfile {
    const students = this.getStudents();
    const idx = students.findIndex(s => s.id === studentId);
    if (idx === -1) throw new Error('Student not found');

    students[idx] = { ...students[idx], ...updates };
    setStored(STORAGE_KEYS.STUDENTS, students);
    return students[idx];
  },

  assignLessonToStudent(studentId: string, lessonId: string, isAssigned: boolean): StudentProfile {
    const students = this.getStudents();
    const student = students.find(s => s.id === studentId);
    if (!student) throw new Error('Student not found');

    if (isAssigned) {
      if (!student.assignedLessonIds.includes(lessonId)) {
        student.assignedLessonIds.push(lessonId);
      }
    } else {
      student.assignedLessonIds = student.assignedLessonIds.filter(id => id !== lessonId);
    }

    setStored(STORAGE_KEYS.STUDENTS, students);
    return student;
  },

  assignPackageToStudent(studentId: string, packageId: string): StudentProfile {
    const students = this.getStudents();
    const student = students.find(s => s.id === studentId);
    if (!student) throw new Error('Student not found');

    const pkgs = this.getPackages();
    const pkg = pkgs.find(p => p.id === packageId);

    if (pkg) {
      student.packageId = pkg.id;
      student.packageName = pkg.name;
      student.hasAccess = true;
      // Add all lessons in package to student assigned lessons
      const combined = Array.from(new Set([...student.assignedLessonIds, ...pkg.includedLessonIds]));
      student.assignedLessonIds = combined;
    } else {
      student.packageId = undefined;
      student.packageName = 'بدون اشتراك نشط';
      student.hasAccess = false;
    }

    setStored(STORAGE_KEYS.STUDENTS, students);
    return student;
  },

  // ── PACKAGES ──
  getPackages(academicYear?: AcademicYear): Package[] {
    const pkgs = getStored<Package[]>(STORAGE_KEYS.PACKAGES, initialPackages);
    if (!academicYear) return pkgs;
    return pkgs.filter(p => p.academicYear === academicYear);
  },

  // ── TEACHERS & PERMISSIONS ──
  getTeachers(): User[] {
    return getStored<User[]>(STORAGE_KEYS.TEACHERS, initialTeachers);
  },

  addTeacher(teacherData: Omit<User, 'id' | 'registrationDate'>): User {
    const teachers = this.getTeachers();
    const newTeacher: User = {
      ...teacherData,
      id: `t-${Date.now()}`,
      registrationDate: new Date().toISOString().slice(0, 10),
    };
    teachers.unshift(newTeacher);
    setStored(STORAGE_KEYS.TEACHERS, teachers);
    return newTeacher;
  },

  updateTeacherPermissions(teacherId: string, permissions: TeacherPermission[]): User {
    const teachers = this.getTeachers();
    const teacher = teachers.find(t => t.id === teacherId);
    if (!teacher) throw new Error('Teacher not found');

    teacher.permissions = permissions;
    setStored(STORAGE_KEYS.TEACHERS, teachers);
    return teacher;
  },

  // ── LESSONS & PUBLISHING ──
  getLessons(academicYear?: AcademicYear, includeHidden = true): Lesson[] {
    const lessons = getStored<Lesson[]>(STORAGE_KEYS.LESSONS, initialLessons);
    return lessons.filter(l => {
      const matchYear = !academicYear || l.academicYear === academicYear;
      const matchPublished = includeHidden || l.isPublished;
      return matchYear && matchPublished;
    });
  },

  getLessonById(id: string): Lesson | undefined {
    const lessons = this.getLessons(undefined, true);
    return lessons.find(l => l.id === id);
  },

  toggleLessonPublish(lessonId: string): Lesson {
    const lessons = getStored<Lesson[]>(STORAGE_KEYS.LESSONS, initialLessons);
    const lesson = lessons.find(l => l.id === lessonId);
    if (!lesson) throw new Error('Lesson not found');

    lesson.isPublished = !lesson.isPublished;
    setStored(STORAGE_KEYS.LESSONS, lessons);
    return lesson;
  },

  addLesson(lessonData: Omit<Lesson, 'id'>): Lesson {
    const lessons = getStored<Lesson[]>(STORAGE_KEYS.LESSONS, initialLessons);
    const newLesson: Lesson = {
      ...lessonData,
      id: `lesson-${Date.now()}`,
    };
    lessons.push(newLesson);
    setStored(STORAGE_KEYS.LESSONS, lessons);
    return newLesson;
  },

  updateLesson(lessonId: string, updates: Partial<Lesson>): Lesson {
    const lessons = getStored<Lesson[]>(STORAGE_KEYS.LESSONS, initialLessons);
    const idx = lessons.findIndex(l => l.id === lessonId);
    if (idx === -1) throw new Error('Lesson not found');

    lessons[idx] = { ...lessons[idx], ...updates };
    setStored(STORAGE_KEYS.LESSONS, lessons);
    return lessons[idx];
  },

  deleteLesson(lessonId: string): void {
    const lessons = getStored<Lesson[]>(STORAGE_KEYS.LESSONS, initialLessons);
    const filtered = lessons.filter(l => l.id !== lessonId);
    setStored(STORAGE_KEYS.LESSONS, filtered);
  },

  // ── STUDENT DASHBOARD & ANALYTICS ──
  getStudentDashboard(studentId = 'u_student_demo'): StudentDashboardData {
    const student = this.getStudentById(studentId) || initialStudents[0];
    const yearLessons = this.getLessons(student.academicYear, false);
    const completedCount = yearLessons.filter(l => l.userExamPassed).length;

    return {
      studentName: student.name.split(' (')[0],
      currentGrade: student.academicYear === 'third_secondary' ? 'الصف الثالث الثانوي — علمي رياضة' : student.academicYear === 'second_secondary' ? 'الصف الثاني الثانوي' : 'الصف الأول الثانوي',
      academicYear: student.academicYear,
      overallProgress: Math.round((completedCount / (yearLessons.length || 1)) * 100) || 75,
      lessonsCompleted: completedCount || 6,
      lessonsRemaining: Math.max(0, yearLessons.length - completedCount),
      homeworkCompletionRate: 90,
      examsPassed: student.examResults.filter(e => e.isPassed).length || 5,
      averageExamScore: student.averageScore || 92,
      totalStudyHours: 42.5,
      lastLogin: 'اليوم، 10:30 صباحاً',
      currentLearningStreak: 7,
      packageName: student.packageName || 'الباقة الشاملة',
      continueLearningLesson: {
        id: 'lesson-2',
        title: 'المحاضرة 2: مشتقات الدوال المثلثية والهندسية',
        subject: 'التفاضل والتكامل',
        duration: '1:30:00',
        progressPercentage: 45,
        thumbnail: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=600&q=80',
      },
    };
  },

  getProgressTimeline(): ProgressTimelineData {
    return {
      examScores: [
        { date: '15 مايو', score: 75, label: 'اختبار تشخيصي' },
        { date: '1 يونيو', score: 85, label: 'اختبار النوايات' },
        { date: '15 يونيو', score: 80, label: 'اختبار الاتصال' },
        { date: '1 يوليو', score: 95, label: 'اختبار المشتقات 1' },
        { date: '15 يوليو', score: 90, label: 'اختبار قاعدة السلسلة' },
        { date: '28 يوليو', score: 96, label: 'اختبار مشتقات الدوال المثلثية' },
      ],
      lessonProgress: [
        { month: 'مارس', completed: 2, target: 3 },
        { month: 'أبريل', completed: 4, target: 4 },
        { month: 'مايو', completed: 6, target: 5 },
        { month: 'يونيو', completed: 8, target: 8 },
        { month: 'يوليو', completed: 10, target: 12 },
      ],
      weeklyActivity: [
        { day: 'السبت', hours: 4.5 },
        { day: 'الأحد', hours: 6.0 },
        { day: 'الإثنين', hours: 3.5 },
        { day: 'الثلاثاء', hours: 7.0 },
        { day: 'الأربعاء', hours: 5.5 },
        { day: 'الخميس', hours: 8.0 },
        { day: 'الجمعة', hours: 4.0 },
      ],
      homeworkRates: [
        { category: 'مكتملة في الموعد', rate: 85 },
        { category: 'مكتملة متأخرة', rate: 10 },
        { category: 'غير مكتملة', rate: 5 },
      ],
      subjectGrades: [
        { subject: 'التفاضل والتكامل', score: 95, maxScore: 100 },
        { subject: 'الهندسة الفراغية', score: 90, maxScore: 100 },
        { subject: 'الجبر والهندسة', score: 88, maxScore: 100 },
      ],
    };
  },

  // ── DASHBOARD STATS SCOPED BY ACADEMIC YEAR ──
  getDashboardStatsByYear(academicYear: AcademicYear) {
    const students = this.getStudents(academicYear);
    const lessons = this.getLessons(academicYear, true);
    const publishedLessons = lessons.filter(l => l.isPublished);

    const totalStudents = students.length;
    const activeStudents = students.filter(s => s.status === 'active').length;
    const studentsWithAccess = students.filter(s => s.hasAccess).length;
    const studentsWithoutAccess = totalStudents - studentsWithAccess;
    const averageScore = Math.round(students.reduce((acc, s) => acc + s.averageScore, 0) / (totalStudents || 1));

    return {
      totalStudents,
      activeStudents,
      studentsWithAccess,
      studentsWithoutAccess,
      totalLessons: lessons.length,
      publishedLessons: publishedLessons.length,
      activeExamsCount: lessons.filter(l => l.exam?.isPublished !== false).length,
      averageScore,
    };
  },

  // ── HOMEWORK & EXAM SUBMISSIONS ──
  submitHomework(lessonId: string, answers: Record<number, string>): LessonHomework {
    const lessons = getStored<Lesson[]>(STORAGE_KEYS.LESSONS, initialLessons);
    const lesson = lessons.find(l => l.id === lessonId);
    if (!lesson) throw new Error('Lesson not found');

    let correct = 0;
    lesson.homework.questions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) correct++;
    });

    const scorePercent = Math.round((correct / (lesson.homework.questions.length || 1)) * 100);
    lesson.homework.isSubmitted = true;
    lesson.homework.score = scorePercent;

    setStored(STORAGE_KEYS.LESSONS, lessons);
    return lesson.homework;
  },

  submitLessonExam(lessonId: string, answers: Record<number, string>, timeSpent: string): { examRecord: ExamRecord; unlockedNextLesson: boolean } {
    const lessons = getStored<Lesson[]>(STORAGE_KEYS.LESSONS, initialLessons);
    const lessonIndex = lessons.findIndex(l => l.id === lessonId);
    if (lessonIndex === -1) throw new Error('Lesson not found');

    const lesson = lessons[lessonIndex];
    let correctCount = 0;
    const details = lesson.exam.questions.map(q => {
      const studentAns = answers[q.id] || '';
      const isCorrect = studentAns === q.correctAnswer;
      if (isCorrect) correctCount++;
      return {
        questionId: q.id,
        questionText: q.text,
        studentAnswer: studentAns,
        correctAnswer: q.correctAnswer,
        isCorrect,
        explanation: q.explanation,
      };
    });

    const totalQuestions = lesson.exam.questions.length || 1;
    const percentage = Math.round((correctCount / totalQuestions) * 100);
    const isPassed = percentage >= lesson.exam.passingScorePercentage;

    lesson.userExamPassed = isPassed;
    lesson.userExamScore = percentage;

    let unlockedNextLesson = false;

    // Check if next lesson can be unlocked
    if (isPassed && lessonIndex + 1 < lessons.length) {
      const nextLesson = lessons[lessonIndex + 1];
      if (nextLesson.isLocked) {
        nextLesson.isLocked = false;
        unlockedNextLesson = true;

        this.addNotification({
          userId: 'u_student_demo',
          title: 'فتح درس جديد! 🔓',
          message: `تهانينا! بنجاحك في اختبار "${lesson.title}" تم فتح "${nextLesson.title}".`,
          type: 'lesson_unlock',
          link: nextLesson.id,
        });
      }
    }

    setStored(STORAGE_KEYS.LESSONS, lessons);

    const newRecord: ExamRecord = {
      id: `record-${Date.now()}`,
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      academicYear: lesson.academicYear,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      score: correctCount,
      totalQuestions,
      percentage,
      isPassed,
      durationSpent: timeSpent || '15 دقيقة',
      details,
    };

    const history = getStored<ExamRecord[]>(STORAGE_KEYS.EXAM_HISTORY, []);
    history.unshift(newRecord);
    setStored(STORAGE_KEYS.EXAM_HISTORY, history);

    return { examRecord: newRecord, unlockedNextLesson };
  },

  submitLessonFeedback(lessonId: string, rating: number, comment: string): void {
    const lessons = getStored<Lesson[]>(STORAGE_KEYS.LESSONS, initialLessons);
    const lesson = lessons.find(l => l.id === lessonId);
    if (lesson) {
      lesson.userFeedback = { rating, comment, createdAt: new Date().toISOString() };
      setStored(STORAGE_KEYS.LESSONS, lessons);
    }
  },

  getExamHistory(): ExamRecord[] {
    return getStored(STORAGE_KEYS.EXAM_HISTORY, [
      {
        id: 'record-1',
        lessonId: 'lesson-1',
        lessonTitle: 'المحاضرة 1: المشتقات وقاعدة السلسلة',
        academicYear: 'third_secondary',
        date: '2026-07-20 14:30',
        score: 3,
        totalQuestions: 3,
        percentage: 100,
        isPassed: true,
        durationSpent: '12 دقيقة',
        details: [
          { questionId: 1, questionText: 'إذا كانت f(x) = 3x³ − 5x² + 2x − 7، فإن f\'(x) =', studentAnswer: 'A', correctAnswer: 'A', isCorrect: true, explanation: 'f\'(x) = 9x² − 10x + 2' },
          { questionId: 2, questionText: 'إذا كانت y = e^(3x)، فإن dy/dx =', studentAnswer: 'B', correctAnswer: 'B', isCorrect: true, explanation: 'dy/dx = 3·e^(3x)' },
        ],
      },
    ]);
  },

  getExamStats(): ExamStats {
    const history = this.getExamHistory();
    const totalAttempted = history.length || 3;
    const passedCount = history.filter(h => h.isPassed).length || 2;
    const failedCount = totalAttempted - passedCount;
    const averageScore = Math.round(history.reduce((acc, curr) => acc + curr.percentage, 0) / (totalAttempted || 1)) || 88;
    const highestScore = 100;
    const overallPassRate = Math.round((passedCount / totalAttempted) * 100) || 85;

    return { totalAttempted, passedCount, failedCount, averageScore, highestScore, overallPassRate };
  },

  // ── MESSAGES & NOTIFICATIONS ──
  getTeacherMessages(): TeacherMessage[] {
    return getStored(STORAGE_KEYS.MESSAGES, [
      {
        id: 'msg-101',
        studentId: 'u_student_demo',
        studentName: 'أحمد طالب',
        studentAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
        lessonId: 'lesson-2',
        lessonTitle: 'المحاضرة 2: مشتقات الدوال المثلثية والهندسية',
        text: 'يا أستاذ، لم أفهم جيداً كيف وصلنا لنتيجة تفاضل tan(4x) ولماذا نضرب في 4 في النهاية؟',
        timestamp: '2026-07-29 11:15',
        isRead: false,
      },
    ]);
  },

  getMessagesForLesson(lessonId: string): TeacherMessage[] {
    const msgs = this.getTeacherMessages();
    return msgs.filter(m => m.lessonId === lessonId);
  },

  sendStudentMessage(lessonId: string, text: string, attachmentUrl?: string): TeacherMessage {
    const lessons = this.getLessons();
    const lesson = lessons.find(l => l.id === lessonId);

    const newMsg: TeacherMessage = {
      id: `msg-${Date.now()}`,
      studentId: 'u_student_demo',
      studentName: 'أحمد طالب',
      studentAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
      lessonId,
      lessonTitle: lesson?.title || 'درس في الرياضيات',
      text,
      attachmentUrl,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      isRead: false,
    };

    const msgs = this.getTeacherMessages();
    msgs.unshift(newMsg);
    setStored(STORAGE_KEYS.MESSAGES, msgs);

    this.addNotification({
      userId: 'u_teacher_demo',
      title: 'سؤال جديد من طالب',
      message: `أرسل أحمد طالب سؤالاً جديداً في "${lesson?.title}": "${text.slice(0, 40)}..."`,
      type: 'student_question',
      link: lessonId,
    });

    return newMsg;
  },

  replyTeacherMessage(messageId: string, replyText: string): TeacherMessage {
    const msgs = this.getTeacherMessages();
    const msg = msgs.find(m => m.id === messageId);
    if (!msg) throw new Error('Message not found');

    msg.reply = replyText;
    msg.replyTimestamp = new Date().toISOString().replace('T', ' ').slice(0, 16);
    msg.isRead = true;

    setStored(STORAGE_KEYS.MESSAGES, msgs);

    this.addNotification({
      userId: msg.studentId,
      title: 'رد جديد من المعلم 👨‍🏫',
      message: `قام المعلم بالرد على سؤالك في "${msg.lessonTitle}": "${replyText.slice(0, 40)}..."`,
      type: 'teacher_reply',
      link: msg.lessonId,
    });

    return msg;
  },

  getAIChatHistory(lessonId: string): AIMessage[] {
    const allChat = getStored<Record<string, AIMessage[]>>(STORAGE_KEYS.AI_CHAT, {});
    return allChat[lessonId] || [
      {
        id: `ai-init-${lessonId}`,
        sender: 'bot',
        text: 'أهلاً بك! أنا المعلم الذكي. كيف يمكنني مساعدتك في فهم نقاط هذا الدرس؟',
        timestamp: 'الآن',
      },
    ];
  },

  sendAIChatMessage(lessonId: string, userText: string): { userMessage: AIMessage; botMessage: AIMessage } {
    const allChat = getStored<Record<string, AIMessage[]>>(STORAGE_KEYS.AI_CHAT, {});
    const lessonMsgs = allChat[lessonId] || [];

    const userMessage: AIMessage = {
      id: `ai-u-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    };

    let replyText = `أحسنت في طرح هذا السؤال! بخصوص "${userText}": في هذا الدرس نطبق قاعدة التفاضل الأساسية.`;
    let codeSnippet: string | undefined = undefined;

    if (userText.includes('سلسلة') || userText.includes('مركب')) {
      replyText = 'قاعدة السلسلة (Chain Rule) تُستخدم عندما تكون الدالة مكوّنة من تراكيب دالتين $y = f(g(x))$. تكون المشتقة هي:';
      codeSnippet = 'dy/dx = f\'(g(x)) * g\'(x)\nمثال:\ny = (3x² + 5)⁴\ndy/dx = 4(3x² + 5)³ * (6x) = 24x(3x² + 5)³';
    } else if (userText.includes('مثلثية') || userText.includes('sin') || userText.includes('cos') || userText.includes('tan')) {
      replyText = 'مشتقات الدوال المثلثية الأساسية هي:';
      codeSnippet = 'd/dx [sin(u)] = cos(u) * u\'\nd/dx [cos(u)] = -sin(u) * u\'\nd/dx [tan(u)] = sec²(u) * u\'';
    }

    const botMessage: AIMessage = {
      id: `ai-b-${Date.now() + 1}`,
      sender: 'bot',
      text: replyText,
      codeSnippet,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    };

    lessonMsgs.push(userMessage, botMessage);
    allChat[lessonId] = lessonMsgs;
    setStored(STORAGE_KEYS.AI_CHAT, allChat);

    return { userMessage, botMessage };
  },

  clearAIChatHistory(lessonId: string): void {
    const allChat = getStored<Record<string, AIMessage[]>>(STORAGE_KEYS.AI_CHAT, {});
    allChat[lessonId] = [
      {
        id: `ai-cleared-${Date.now()}`,
        sender: 'bot',
        text: 'تم مسح المحادثة. أهلاً بك من جديد! تسعدني إجابة أي سؤال آخر حول الدرس.',
        timestamp: 'الآن',
      },
    ];
    setStored(STORAGE_KEYS.AI_CHAT, allChat);
  },

  getNotifications(userId: string): SystemNotification[] {
    const allNotifs = getStored<SystemNotification[]>(STORAGE_KEYS.NOTIFICATIONS, [
      {
        id: 'notif-1',
        userId: 'u_student_demo',
        title: 'رد جديد من المعلم',
        message: 'قام أ. د. محمد الشريف بالرد على استفسارك في المحاضرة 1: المشتقات وقاعدة السلسلة',
        type: 'teacher_reply',
        timestamp: 'منذ 3 ساعات',
        isRead: false,
        link: 'lesson-1',
      },
    ]);
    return allNotifs.filter(n => n.userId === userId);
  },

  addNotification(notif: Omit<SystemNotification, 'id' | 'timestamp' | 'isRead'>): SystemNotification {
    const allNotifs = getStored<SystemNotification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    const newNotif: SystemNotification = {
      ...notif,
      id: `notif-${Date.now()}`,
      timestamp: 'الآن',
      isRead: false,
    };
    allNotifs.unshift(newNotif);
    setStored(STORAGE_KEYS.NOTIFICATIONS, allNotifs);
    return newNotif;
  },

  markNotificationAsRead(id: string): void {
    const allNotifs = getStored<SystemNotification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    const item = allNotifs.find(n => n.id === id);
    if (item) {
      item.isRead = true;
      setStored(STORAGE_KEYS.NOTIFICATIONS, allNotifs);
    }
  },

  markAllNotificationsAsRead(userId: string): void {
    const allNotifs = getStored<SystemNotification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    allNotifs.forEach(n => {
      if (n.userId === userId) n.isRead = true;
    });
    setStored(STORAGE_KEYS.NOTIFICATIONS, allNotifs);
  },
};
