import { useState, useEffect, useRef, useCallback } from 'react';
import { examsApi } from '../api/exams.api';
import {
  ExamInfo,
  ExamQuestion,
  SubmitExamResponse,
} from '../types/api.types';

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
      setExam(data.exam);
      setQuestions(data.questions || []);
      setAttemptId(data.attemptId);

      const durationSec = (data.exam.DurationMinutes || 10) * 60;
      setTimeRemainingSeconds(durationSec);
      setIsTimerExpired(false);
    } catch (err: any) {
      setError(err?.message || 'فشل في بدء جلسة الامتحان');
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
      setResult(res);
      setIsFinished(true);
      return res;
    } catch (err: any) {
      setError(err?.message || 'حدث خطأ أثناء تسليم الامتحان');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [examId, answers, isSubmitting, isFinished]);

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
    formatTimeRemaining,
    startExam,
    selectAnswer,
    submitExam,
  };
}
