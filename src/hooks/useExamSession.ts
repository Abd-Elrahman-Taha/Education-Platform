import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { examsApi } from '../api/exams.api';
import {
  ExamInfo,
  ExamQuestion,
  SubmitExamRequest,
  SubmitExamResponse,
} from '../types/api.types';
import { getFriendlyErrorMessage } from '../utils/errors';

export function useExamSession(examId: string) {
  const { currentUser } = useAuth();
  const userRole = (currentUser?.role || (currentUser as any)?.Role || '').toString().toLowerCase();
  const isAdminUser = userRole === 'admin' || userRole === 'superadmin' || userRole === 'teacher';

  const [exam, setExam] = useState<ExamInfo | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [result, setResult] = useState<SubmitExamResponse | null>(null);
  const [isFinished, setIsFinished] = useState(false);

  // Anti-cheating states (POST /exams/:id/warning)
  const [warningCount, setWarningCount] = useState<number>(0);
  const [showWarningModal, setShowWarningModal] = useState<boolean>(false);
  const [autoSubmittedByCheating, setAutoSubmittedByCheating] = useState<boolean>(false);
  const lastWarningTimeRef = useRef<number>(0);

  // Timer states (in seconds)
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number>(0);
  const [isTimerExpired, setIsTimerExpired] = useState(false);
  const timerRef = useRef<any>(null);

  // Start exam session
  const startExam = useCallback(async () => {
    if (!examId) {
      const msg = 'لم يتم العثور على معرّف الاختبار المطلوب.';
      setError(msg);
      throw new Error(msg);
    }
    setIsLoading(true);
    setError(null);
    try {
      let examObj: any = null;
      let rawQuestions: any[] = [];
      let attemptIdVal = '';
      let startError: any = null;

      if (isAdminUser) {
        // Admin preview mode: bypass student attempt creation (/start) which gives 403
        attemptIdVal = 'preview-admin-attempt';
        try {
          const [qList, singleExam] = await Promise.all([
            examsApi.getQuestions(examId).catch(() => []),
            examsApi.getExamById(examId).catch(() => null),
          ]);

          if (Array.isArray(qList) && qList.length > 0) {
            rawQuestions = qList;
          }
          if (singleExam) {
            examObj = singleExam;
            if (rawQuestions.length === 0 && Array.isArray((singleExam as any)?.questions) && (singleExam as any).questions.length > 0) {
              rawQuestions = (singleExam as any).questions;
            }
          }
        } catch (adminErr) {
          console.warn('[useExamSession] Admin preview questions fetch error:', adminErr);
        }
      } else {
        // Normal student attempt flow
        try {
          const data: any = await examsApi.startExam(examId);
          examObj =
            data.data?.exam ||
            data.exam ||
            (data.data && !Array.isArray(data.data) && !(data.data as any).questions ? (data.data as any) : null);

          rawQuestions =
            data.data?.questions ||
            data.questions ||
            (data.data?.exam as any)?.questions ||
            (data.exam as any)?.questions ||
            (data.data as any)?.attempt?.questions ||
            (data as any).attempt?.questions ||
            (data.data as any)?.items ||
            (Array.isArray(data.data) ? data.data : []) ||
            [];

          attemptIdVal =
            data.data?.attemptId ||
            data.attemptId ||
            (data.data as any)?.attempt?._id ||
            (data as any).attempt?._id ||
            (data.data as any)?._id ||
            '';
        } catch (err: any) {
          startError = err;
          console.warn('[useExamSession] POST /exams/:id/start error:', err);
        }

        // Student Fallbacks if needed (e.g. questions returned inside getExamById)
        if (rawQuestions.length === 0) {
          try {
            const singleExam = await examsApi.getExamById(examId);
            if (singleExam) {
              if (!examObj) examObj = singleExam;
              if (rawQuestions.length === 0 && Array.isArray((singleExam as any)?.questions) && (singleExam as any).questions.length > 0) {
                rawQuestions = (singleExam as any).questions;
              }
            }
          } catch (eErr) {
            console.warn('[useExamSession] Fallback getExamById error:', eErr);
          }
        }
      }

      // If no questions found at all:
      if (rawQuestions.length === 0) {
        if (startError) {
          const rawErrMsg =
            startError?.backendMessage ||
            startError?.rawMessage ||
            startError?.response?.data?.message ||
            startError?.message ||
            '';
          if (rawErrMsg.toLowerCase().includes('prerequisite')) {
            throw new Error('يجب اجتياز الاختبار التأهيلي السابق أولاً قبل البدء في هذا الاختبار.');
          }
          const status = startError?.response?.status || startError?.status;
          if (status === 403) {
            throw new Error(
              'عفواً، لا يمكنك خوض هذا الاختبار لأنك غير مشترك في هذا الكورس. يرجى الاشتراك في الكورس أولاً.'
            );
          }
          throw startError;
        }
        if (isAdminUser) {
          throw new Error('لا توجد أسئلة مضافة لهذا الاختبار بعد. يمكنك إضافة الأسئلة من لوحة تحكم الامتحانات.');
        }
        throw new Error('تعذر العثور على بيانات هذا الامتحان أو أسئلته.');
      }

      const normalizedQuestions: ExamQuestion[] = rawQuestions.map((q: any, idx: number) => {
        const qId = q._id || q.id || q.questionId || `q-${idx + 1}`;
        const qText =
          q.QuestionText ||
          q.questionText ||
          q.question ||
          q.title ||
          q.text ||
          q.prompt ||
          `السؤال رقم ${idx + 1}`;
        const qType = q.QuestionType || q.questionType || q.type || 'MCQ';
        const qPoints = Number(q.Points ?? q.points ?? q.score ?? 1);

        let qOptions: string[] = [];
        if (Array.isArray(q.Options)) {
          qOptions = q.Options;
        } else if (Array.isArray(q.options)) {
          qOptions = q.options;
        } else if (Array.isArray(q.choices)) {
          qOptions = q.choices;
        }
        qOptions = qOptions.map((opt: any) =>
          typeof opt === 'string' ? opt : opt?.text || opt?.title || opt?.label || opt?.value || String(opt)
        );

        if (qType === 'TrueFalse' && qOptions.length === 0) {
          qOptions = ['true', 'false'];
        }

        return {
          _id: qId,
          ExamId: q.ExamId || q.examId || examId,
          QuestionType: qType,
          QuestionText: qText,
          Options: qOptions,
          Points: qPoints,
        };
      });

      if (examObj) {
        setExam(examObj);
        const durationSec = (examObj.DurationMinutes || 10) * 60;
        setTimeRemainingSeconds(durationSec);
      }
      setQuestions(normalizedQuestions);
      setAttemptId(attemptIdVal);
      setIsTimerExpired(false);
      setWarningCount(0);
      setAutoSubmittedByCheating(false);
      return { exam: examObj, questions: normalizedQuestions, attemptId: attemptIdVal };
    } catch (err: any) {
      const msg = getFriendlyErrorMessage(err, 'تعذر بدء الاختبار حالياً. يرجى المحاولة مرة أخرى.');
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [examId, isAdminUser]);

  // Answer selection
  const selectAnswer = useCallback((questionId: string, answer: string) => {
    if (isFinished || isTimerExpired) return;
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  }, [isFinished, isTimerExpired]);

  // Submit exam
  const submitExam = useCallback(async () => {
    if (!examId || isSubmitting || isFinished) return;
    setIsSubmitting(true);
    setError(null);
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      // Build complete answers list covering all exam questions
      const payloadAnswers = questions.map((q) => ({
        questionId: q._id,
        answer: answers[q._id] !== undefined && answers[q._id] !== null ? String(answers[q._id]) : '',
      }));

      const submitPayload: SubmitExamRequest = {
        answers: payloadAnswers,
      };

      let normalizedResult: SubmitExamResponse;

      if (isAdminUser || attemptId === 'preview-admin-attempt') {
        try {
          const res = await examsApi.submitExam(examId, submitPayload);
          const scoreVal =
            res.data?.score ??
            (res as any).data?.attempt?.score ??
            res.score ??
            (res as any).attempt?.score ??
            0;
          const statusVal =
            res.data?.status ??
            (res as any).data?.attempt?.status ??
            res.status ??
            (res as any).attempt?.status ??
            'Passed';
          const passingScoreVal =
            res.data?.passingScore ??
            (res as any).data?.attempt?.passingScore ??
            res.passingScore ??
            (res as any).attempt?.passingScore;
          const totalPointsVal =
            (res as any).data?.totalPoints ??
            (res as any).data?.attempt?.totalPoints ??
            (res as any).totalPoints ??
            questions.reduce((acc, q) => acc + (q.Points || 1), 0);

          normalizedResult = {
            message: res.message || 'تم تسليم الاختبار بنجاح',
            score: scoreVal,
            totalPoints: totalPointsVal,
            status: statusVal,
            passingScore: passingScoreVal,
            data: res.data,
          };
        } catch {
          // Graceful preview calculation for Admin / SuperAdmin
          const totalPointsVal = questions.reduce((acc, q) => acc + (q.Points || 1), 0);
          const answeredCount = payloadAnswers.filter(a => a.answer && a.answer.trim() !== '').length;
          const simulatedScore = Math.round((answeredCount / (questions.length || 1)) * totalPointsVal);
          const passingScoreVal = (exam as any)?.PassingScore ?? 50;

          normalizedResult = {
            message: 'معاينة تجريبية: تم تسليم إجابات الاختبار بنجاح (وضع معاينة الإدارة)',
            score: simulatedScore,
            totalPoints: totalPointsVal,
            status: simulatedScore >= passingScoreVal ? 'Passed' : 'Failed',
            passingScore: passingScoreVal,
          };
        }
      } else {
        const res = await examsApi.submitExam(examId, submitPayload);
        const scoreVal =
          res.data?.score ??
          (res as any).data?.attempt?.score ??
          res.score ??
          (res as any).attempt?.score ??
          0;
        const statusVal =
          res.data?.status ??
          (res as any).data?.attempt?.status ??
          res.status ??
          (res as any).attempt?.status ??
          'Passed';
        const passingScoreVal =
          res.data?.passingScore ??
          (res as any).data?.attempt?.passingScore ??
          res.passingScore ??
          (res as any).attempt?.passingScore;
        const totalPointsVal =
          (res as any).data?.totalPoints ??
          (res as any).data?.attempt?.totalPoints ??
          (res as any).totalPoints;

        normalizedResult = {
          message: res.message || 'تم تسليم الاختبار بنجاح',
          score: scoreVal,
          totalPoints: totalPointsVal,
          status: statusVal,
          passingScore: passingScoreVal,
          data: res.data,
        };
      }

      setResult(normalizedResult);
      setIsFinished(true);
      return normalizedResult;
    } catch (err: any) {
      const msg = getFriendlyErrorMessage(err, 'تعذر تسليم الاختبار، يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى.');
      setError(msg);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [examId, questions, answers, isSubmitting, isFinished, isAdminUser, attemptId, exam]);

  // Register cheating warning (tab switch / blur / devtools)
  const registerCheatingWarning = useCallback(async () => {
    if (!examId || !attemptId || isFinished || isSubmitting || isAdminUser) return;

    // Cooldown of 3 seconds to prevent double triggers
    const now = Date.now();
    if (now - lastWarningTimeRef.current < 3000) return;
    lastWarningTimeRef.current = now;

    try {
      const res = await examsApi.registerWarning(examId);
      const newCount = res.warningCount ?? (res as any).data?.warningCount ?? (warningCount + 1);
      const isAutoSub = res.autoSubmitted || (res as any).data?.autoSubmitted || newCount >= 3;
      setWarningCount(newCount);
      setShowWarningModal(true);

      if (isAutoSub) {
        setAutoSubmittedByCheating(true);
        await submitExam();
      }
    } catch (err) {
      console.warn('[Anti-Cheat] Failed to register warning on server:', err);
      // Local fallback increment if network fails
      const fallbackCount = warningCount + 1;
      setWarningCount(fallbackCount);
      setShowWarningModal(true);
      if (fallbackCount >= 3) {
        setAutoSubmittedByCheating(true);
        await submitExam();
      }
    }
  }, [examId, attemptId, isFinished, isSubmitting, warningCount, submitExam, isAdminUser]);

  // Tab switch & window blur detection
  useEffect(() => {
    if (!attemptId || isFinished || isAdminUser) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        registerCheatingWarning();
      }
    };

    const handleWindowBlur = () => {
      registerCheatingWarning();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [attemptId, isFinished, registerCheatingWarning, isAdminUser]);

  // Countdown timer effect
  useEffect(() => {
    if (!exam || isFinished) return;

    timerRef.current = setInterval(() => {
      setTimeRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setIsTimerExpired(true);
          // Trigger auto submission on timeout
          submitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [exam, isFinished, submitExam]);

  // Format timer as mm:ss
  const formatTimeRemaining = (): string => {
    const minutes = Math.floor(timeRemainingSeconds / 60);
    const seconds = timeRemainingSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return {
    exam,
    questions,
    attemptId,
    answers,
    isLoading,
    isSubmitting,
    error,
    result,
    isFinished,
    isAdminUser,
    timeRemainingSeconds,
    isTimerExpired,
    warningCount,
    showWarningModal,
    setShowWarningModal,
    autoSubmittedByCheating,
    formatTimeRemaining,
    startExam,
    selectAnswer,
    submitExam,
    registerCheatingWarning,
  };
}
