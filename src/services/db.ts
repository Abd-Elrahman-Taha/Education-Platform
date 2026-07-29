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
} from '../types';

const STORAGE_KEYS = {
  DASHBOARD: 'syntax_mock_dashboard',
  LESSONS: 'syntax_mock_lessons',
  EXAM_HISTORY: 'syntax_mock_exam_history',
  MESSAGES: 'syntax_mock_messages',
  NOTIFICATIONS: 'syntax_mock_notifications',
  AI_CHAT: 'syntax_mock_ai_chat',
};

// ── INITIAL SEED DATA ──────────────────────────────────────────

const initialDashboard: StudentDashboardData = {
  studentName: 'أحمد طالب',
  currentGrade: 'الصف الثالث الثانوي — علمي رياضة',
  overallProgress: 75,
  lessonsCompleted: 6,
  lessonsRemaining: 2,
  homeworkCompletionRate: 90,
  examsPassed: 5,
  averageExamScore: 88,
  totalStudyHours: 42.5,
  lastLogin: 'اليوم، 10:30 صباحاً',
  currentLearningStreak: 7,
  continueLearningLesson: {
    id: 'lesson-2',
    title: 'المحاضرة 2: مشتقات الدوال المثلثية والهندسية',
    subject: 'التفاضل والتكامل',
    duration: '1:30:00',
    progressPercentage: 45,
    thumbnail: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=600&q=80',
  },
};

const initialProgressTimeline: ProgressTimelineData = {
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
};

const initialLessons: Lesson[] = [
  {
    id: 'lesson-1',
    title: 'المحاضرة 1: المشتقات وقاعدة السلسلة',
    subtitle: 'تفاضل الدوال المركبة وتطبيقاتها في المسائل الفيزيائية والهندسية',
    subject: 'التفاضل والتكامل',
    description: 'شرح تفصيلي لقواعد اشتقاق الدوال المركبة وكيفية تطبيق قاعدة السلسلة مع أفكار امتحانات الثانوية العامة.',
    duration: '1:45:00',
    order: 1,
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
        {
          id: 102,
          text: 'مشتقة الدالة f(x) = √(3x² + 4) هي:',
          options: [
            { key: 'A', label: '3x / √(3x² + 4)' },
            { key: 'B', label: '6x / √(3x² + 4)' },
            { key: 'C', label: '1 / (2√(3x² + 4))' },
            { key: 'D', label: '3x² / √(3x² + 4)' },
          ],
          correctAnswer: 'A',
          explanation: 'مشتقة الجذر = مشتقة ما تحت الجذر ÷ (2 × الجذر) = 6x / (2√(3x² + 4)) = 3x / √(3x² + 4)',
        },
      ],
    },
    exam: {
      id: 'exam-1',
      title: 'اختبار المحاضرة الأولى: المشتقات وقاعدة السلسلة',
      durationMinutes: 20,
      passingScorePercentage: 60,
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
        {
          id: 3,
          text: 'في أي نقطة يكون المماس لمنحنى f(x) = x² − 4x + 3 أفقياً؟',
          options: [
            { key: 'A', label: 'x = 4' },
            { key: 'B', label: 'x = 2' },
            { key: 'C', label: 'x = 1' },
            { key: 'D', label: 'x = 0' },
          ],
          correctAnswer: 'B',
          explanation: 'f\'(x) = 2x − 4 = 0 ⟹ x = 2',
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
        {
          id: 202,
          text: 'إذا كانت y = ln(cos x)، فإن dy/dx =',
          options: [
            { key: 'A', label: '−tan x' },
            { key: 'B', label: 'tan x' },
            { key: 'C', label: 'cot x' },
            { key: 'D', label: '−1 / sin x' },
          ],
          correctAnswer: 'A',
          explanation: 'dy/dx = (−sin x) / (cos x) = −tan x',
        },
      ],
    },
    exam: {
      id: 'exam-2',
      title: 'اختبار المحاضرة الثانية: مشتقات الدوال المثلثية',
      durationMinutes: 25,
      passingScorePercentage: 60,
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
        {
          id: 2,
          text: 'مشتقة الدالة h(x) = ln(5x) هي:',
          options: [
            { key: 'A', label: '1/x' },
            { key: 'B', label: '5/x' },
            { key: 'C', label: '1/(5x)' },
            { key: 'D', label: 'ln(5)' },
          ],
          correctAnswer: 'A',
          explanation: 'h\'(x) = 5/(5x) = 1/x',
        },
        {
          id: 3,
          text: 'إذا كان y = e^(sin x)، فإن dy/dx =',
          options: [
            { key: 'A', label: 'cos x · e^(sin x)' },
            { key: 'B', label: 'e^(cos x)' },
            { key: 'C', label: 'sin x · e^(sin x)' },
            { key: 'D', label: 'e^(sin x)' },
          ],
          correctAnswer: 'A',
          explanation: 'dy/dx = (sin x)\' · e^(sin x) = cos x · e^(sin x)',
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
      questions: [
        {
          id: 301,
          text: 'ميل المماس للمنحنى y = x³ − 3x عند النقطة (2, 2) هو:',
          options: [
            { key: 'A', label: '9' },
            { key: 'B', label: '12' },
            { key: 'C', label: '6' },
            { key: 'D', label: '3' },
          ],
          correctAnswer: 'A',
          explanation: 'dy/dx = 3x² − 3. عند x=2: 3(4) − 3 = 9',
        },
      ],
    },
    exam: {
      id: 'exam-3',
      title: 'اختبار المحاضرة الثالثة: المماس والعمودي',
      durationMinutes: 30,
      passingScorePercentage: 60,
      questions: [
        {
          id: 1,
          text: 'معادلة المماس للمنحنى y = x² عند النقطة (1, 1) هي:',
          options: [
            { key: 'A', label: 'y = 2x − 1' },
            { key: 'B', label: 'y = 2x + 1' },
            { key: 'C', label: 'y = x + 1' },
            { key: 'D', label: 'y = 2x' },
          ],
          correctAnswer: 'A',
          explanation: 'dy/dx = 2x = 2. y − 1 = 2(x − 1) ⟹ y = 2x − 1',
        },
      ],
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
    isLocked: true,
    prerequisiteLessonId: 'lesson-3',
    prerequisiteExamTitle: 'اختبار المحاضرة الثالثة: المماس والعمودي',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    pdfUrl: 'https://www.w3.org/W3C/DesignIssues/Overview.html',
    pdfTitle: 'ملزمة المحاضرة الرابعة — المعدلات الزمنية.pdf',
    homework: {
      id: 'hw-4',
      title: 'واجب المحاضرة الرابعة — المعدلات الزمنية',
      description: 'تمارين ومسائل امتحانات سابقة على معدلات التغير الزمني.',
      dueDate: '2026-08-25',
      isSubmitted: false,
      questions: [],
    },
    exam: {
      id: 'exam-4',
      title: 'اختبار المحاضرة الرابعة: المعدلات الزمنية المرتبطة',
      durationMinutes: 30,
      passingScorePercentage: 60,
      questions: [],
    },
  },
];

const initialExamHistory: ExamRecord[] = [
  {
    id: 'record-1',
    lessonId: 'lesson-1',
    lessonTitle: 'المحاضرة 1: المشتقات وقاعدة السلسلة',
    date: '2026-07-20 14:30',
    score: 3,
    totalQuestions: 3,
    percentage: 100,
    isPassed: true,
    durationSpent: '12 دقيقة',
    details: [
      {
        questionId: 1,
        questionText: 'إذا كانت f(x) = 3x³ − 5x² + 2x − 7، فإن f\'(x) =',
        studentAnswer: 'A',
        correctAnswer: 'A',
        isCorrect: true,
        explanation: 'f\'(x) = 9x² − 10x + 2',
      },
      {
        questionId: 2,
        questionText: 'إذا كانت y = e^(3x)، فإن dy/dx =',
        studentAnswer: 'B',
        correctAnswer: 'B',
        isCorrect: true,
        explanation: 'dy/dx = 3·e^(3x)',
      },
      {
        questionId: 3,
        questionText: 'في أي نقطة يكون المماس أفقياً؟',
        studentAnswer: 'B',
        correctAnswer: 'B',
        isCorrect: true,
        explanation: 'f\'(x) = 0 ⟹ x = 2',
      },
    ],
  },
  {
    id: 'record-2',
    lessonId: 'diagnostic-exam',
    lessonTitle: 'الامتحان التشخيصي الشامل لأساسيات الرياضيات',
    date: '2026-07-05 18:00',
    score: 4,
    totalQuestions: 5,
    percentage: 80,
    isPassed: true,
    durationSpent: '22 دقيقة',
    details: [],
  },
  {
    id: 'record-3',
    lessonId: 'trial-exam-1',
    lessonTitle: 'الاختبار التجريبي الأول — الجبر والهندسة',
    date: '2026-06-15 11:15',
    score: 2,
    totalQuestions: 5,
    percentage: 40,
    isPassed: false,
    durationSpent: '28 دقيقة',
    details: [],
  },
];

const initialTeacherMessages: TeacherMessage[] = [
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
  {
    id: 'msg-100',
    studentId: 'u_student_demo',
    studentName: 'أحمد طالب',
    studentAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
    lessonId: 'lesson-1',
    lessonTitle: 'المحاضرة 1: المشتقات وقاعدة السلسلة',
    text: 'شكراً يا مستر على الشرح الرائع! تم حل واجب قاعدة السلسلة بنجاح.',
    timestamp: '2026-07-28 16:40',
    isRead: true,
    reply: 'ممتاز يا أحمد! استمر في التميز وبانتظار تقفيلك للاختبار القادم.',
    replyTimestamp: '2026-07-28 17:05',
  },
];

const initialNotifications: SystemNotification[] = [
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
  {
    id: 'notif-2',
    userId: 'u_student_demo',
    title: 'تهانينا! تم فتح درس جديد 🎉',
    message: 'اجتزت اختبار المحاضرة 1 بنسبة 100%. تم فتح المحاضرة 2 بنجاح.',
    type: 'lesson_unlock',
    timestamp: 'أمس',
    isRead: true,
    link: 'lesson-2',
  },
];

const initialAIChat: Record<string, AIMessage[]> = {
  'lesson-1': [
    {
      id: 'ai-1',
      sender: 'bot',
      text: 'مرحباً بك في المساعد الذكي الخاص بالمحاضرة الأولى! يمكنك سؤالي عن قاعدة السلسلة أو مشتقات الدوال المركبة.',
      timestamp: '10:00 AM',
    },
  ],
  'lesson-2': [
    {
      id: 'ai-2',
      sender: 'bot',
      text: 'أهلاً بك! أنا جاهز لمساعدتك في تفاضل الدوال المثلثية (sin, cos, tan) واللوغاريتمية.',
      timestamp: '10:30 AM',
    },
  ],
};

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
  getStudentDashboard(): StudentDashboardData {
    return getStored(STORAGE_KEYS.DASHBOARD, initialDashboard);
  },

  getProgressTimeline(): ProgressTimelineData {
    return initialProgressTimeline;
  },

  getLessons(): Lesson[] {
    return getStored(STORAGE_KEYS.LESSONS, initialLessons);
  },

  getLessonById(id: string): Lesson | undefined {
    const lessons = this.getLessons();
    return lessons.find(l => l.id === id);
  },

  submitHomework(lessonId: string, answers: Record<number, string>): LessonHomework {
    const lessons = this.getLessons();
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
    const lessons = this.getLessons();
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

        // Push unlock notification for student
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

    // Record Exam Result
    const newRecord: ExamRecord = {
      id: `record-${Date.now()}`,
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      score: correctCount,
      totalQuestions,
      percentage,
      isPassed,
      durationSpent: timeSpent || '15 دقيقة',
      details,
    };

    const history = getStored<ExamRecord[]>(STORAGE_KEYS.EXAM_HISTORY, initialExamHistory);
    history.unshift(newRecord);
    setStored(STORAGE_KEYS.EXAM_HISTORY, history);

    // Update Dashboard Stats
    const dashboard = this.getStudentDashboard();
    const passedExamsList = history.filter(h => h.isPassed);
    dashboard.examsPassed = passedExamsList.length;
    dashboard.averageExamScore = Math.round(
      history.reduce((acc, curr) => acc + curr.percentage, 0) / (history.length || 1)
    );
    const completedCount = lessons.filter(l => l.userExamPassed).length;
    dashboard.lessonsCompleted = completedCount;
    dashboard.lessonsRemaining = lessons.length - completedCount;
    dashboard.overallProgress = Math.round((completedCount / lessons.length) * 100);

    if (unlockedNextLesson && lessonIndex + 1 < lessons.length) {
      const nextL = lessons[lessonIndex + 1];
      dashboard.continueLearningLesson = {
        id: nextL.id,
        title: nextL.title,
        subject: nextL.subject,
        duration: nextL.duration,
        progressPercentage: 0,
        thumbnail: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=600&q=80',
      };
    }

    setStored(STORAGE_KEYS.DASHBOARD, dashboard);

    return { examRecord: newRecord, unlockedNextLesson };
  },

  submitLessonFeedback(lessonId: string, rating: number, comment: string): void {
    const lessons = this.getLessons();
    const lesson = lessons.find(l => l.id === lessonId);
    if (lesson) {
      lesson.userFeedback = {
        rating,
        comment,
        createdAt: new Date().toISOString(),
      };
      setStored(STORAGE_KEYS.LESSONS, lessons);
    }
  },

  getExamHistory(): ExamRecord[] {
    return getStored(STORAGE_KEYS.EXAM_HISTORY, initialExamHistory);
  },

  getExamStats(): ExamStats {
    const history = this.getExamHistory();
    const totalAttempted = history.length;
    const passedCount = history.filter(h => h.isPassed).length;
    const failedCount = totalAttempted - passedCount;
    const averageScore = Math.round(history.reduce((acc, curr) => acc + curr.percentage, 0) / (totalAttempted || 1));
    const highestScore = Math.max(...history.map(h => h.percentage), 0);
    const overallPassRate = Math.round((passedCount / (totalAttempted || 1)) * 100);

    return {
      totalAttempted,
      passedCount,
      failedCount,
      averageScore,
      highestScore,
      overallPassRate,
    };
  },

  getTeacherMessages(): TeacherMessage[] {
    return getStored(STORAGE_KEYS.MESSAGES, initialTeacherMessages);
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

    // Notify Teacher
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

    // Notify Student
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
    const allChat = getStored<Record<string, AIMessage[]>>(STORAGE_KEYS.AI_CHAT, initialAIChat);
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
    const allChat = getStored<Record<string, AIMessage[]>>(STORAGE_KEYS.AI_CHAT, initialAIChat);
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
    const allChat = getStored<Record<string, AIMessage[]>>(STORAGE_KEYS.AI_CHAT, initialAIChat);
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
    const allNotifs = getStored<SystemNotification[]>(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);
    return allNotifs.filter(n => n.userId === userId);
  },

  addNotification(notif: Omit<SystemNotification, 'id' | 'timestamp' | 'isRead'>): SystemNotification {
    const allNotifs = getStored<SystemNotification[]>(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);
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
    const allNotifs = getStored<SystemNotification[]>(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);
    const item = allNotifs.find(n => n.id === id);
    if (item) {
      item.isRead = true;
      setStored(STORAGE_KEYS.NOTIFICATIONS, allNotifs);
    }
  },

  markAllNotificationsAsRead(userId: string): void {
    const allNotifs = getStored<SystemNotification[]>(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);
    allNotifs.forEach(n => {
      if (n.userId === userId) n.isRead = true;
    });
    setStored(STORAGE_KEYS.NOTIFICATIONS, allNotifs);
  },
};
