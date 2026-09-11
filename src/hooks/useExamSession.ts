import { useState, useEffect, useRef, useCallback } from 'react';
import { examsApi } from '../api/exams.api';
import {
  ExamInfo,
  ExamQuestion,
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
    if (!examId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await examsApi.startExam(examId);
      const examObj = data.data?.exam || data.exam;
      const questionsList = data.data?.questions || data.questions || [];
      const attemptIdVal = data.data?.attemptId || data.attemptId || '';

      if (examObj) {
        setExam(examObj);
        const durationSec = (examObj.DurationMinutes || 10) * 60;
        setTimeRemainingSeconds(durationSec);
      }
      setQuestions(questionsList);
      setAttemptId(attemptIdVal);
      setIsTimerExpired(false);
      setWarningCount(0);
      setAutoSubmittedByCheating(false);
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err, 'تعذر بدء الاختبار حالياً. يرجى المحاولة مرة أخرى.'));
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
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      const payloadAnswers = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer,
      }));

      const res = await examsApi.submitExam(examId, { answers: payloadAnswers });
      const scoreVal = res.data?.score ?? res.score ?? 0;
      const statusVal = res.data?.status ?? res.status ?? 'Passed';
      const passingScoreVal = res.data?.passingScore ?? res.passingScore;
      const normalizedResult: SubmitExamResponse = {
        message: res.message,
        score: scoreVal,
        status: statusVal,
        passingScore: passingScoreVal,
        data: res.data,
      };
      setResult(normalizedResult);
      setIsFinished(true);
      return normalizedResult;
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err, 'تعذر تسليم الاختبار، يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى.'));
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [examId, answers, isSubmitting, isFinished]);

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
