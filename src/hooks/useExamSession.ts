import { useState, useEffect, useRef, useCallback } from 'react';
import { examsApi } from '../api/exams.api';
import {
  ExamInfo,
  ExamQuestion,
  SubmitExamRequest,
  SubmitExamResponse,
} from '../types/api.types';
import { getFriendlyErrorMessage } from '../utils/errors';

export function useExamSession(examId: string) {
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
      const data = await examsApi.startExam(examId);
      const examObj =
        data.data?.exam ||
        data.exam ||
        (data.data && !Array.isArray(data.data) && !(data.data as any).questions ? (data.data as any) : null);

      let rawQuestions: any[] =
        data.data?.questions ||
        data.questions ||
        (data.data?.exam as any)?.questions ||
        (data.exam as any)?.questions ||
        (data.data as any)?.attempt?.questions ||
        (data as any).attempt?.questions ||
        (data.data as any)?.items ||
        (Array.isArray(data.data) ? data.data : []) ||
        [];

      const attemptIdVal =
        data.data?.attemptId ||
        data.attemptId ||
        (data.data as any)?.attempt?._id ||
        (data as any).attempt?._id ||
        (data.data as any)?._id ||
        '';

      // Fallback 1: If questions array from /start is empty, fetch questions from /exams/:id/questions
      if (rawQuestions.length === 0) {
        try {
          const qList = await examsApi.getQuestions(examId);
          if (Array.isArray(qList) && qList.length > 0) {
            rawQuestions = qList;
          }
        } catch (qErr) {
          console.warn('[useExamSession] Fallback getQuestions error:', qErr);
        }
      }

      // Fallback 2: If still empty, check GET /exams/:id
      if (rawQuestions.length === 0) {
        try {
          const singleExam = await examsApi.getExamById(examId);
          if (Array.isArray((singleExam as any)?.questions) && (singleExam as any).questions.length > 0) {
            rawQuestions = (singleExam as any).questions;
          }
        } catch (eErr) {
          console.warn('[useExamSession] Fallback getExamById error:', eErr);
        }
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
  }, [examId]);

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

      const normalizedResult: SubmitExamResponse = {
        message: res.message || 'تم تسليم الاختبار بنجاح',
        score: scoreVal,
        totalPoints: totalPointsVal,
        status: statusVal,
        passingScore: passingScoreVal,
        data: res.data,
      };
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
  }, [examId, questions, answers, isSubmitting, isFinished]);

  // Register cheating warning (tab switch / blur / devtools)
  const registerCheatingWarning = useCallback(async () => {
    if (!examId || !attemptId || isFinished || isSubmitting) return;

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
  }, [examId, attemptId, isFinished, isSubmitting, warningCount, submitExam]);

  // Tab switch & window blur detection
  useEffect(() => {
    if (!attemptId || isFinished) return;

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
  }, [attemptId, isFinished, registerCheatingWarning]);

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
