import { useState, useEffect, useRef, useCallback } from 'react';
import { videosApi } from '../api/videos.api';

interface UseVideoPlaybackProps {
  lessonId: string;
  onLocked?: () => void;
}

export function useVideoPlayback({ lessonId, onLocked }: UseVideoPlaybackProps) {
  const [watermarkToken, setWatermarkToken] = useState<string | null>(null);
  const [isWatermarkLoading, setIsWatermarkLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockMessage, setLockMessage] = useState<string | null>(null);
  const [viewCount, setViewCount] = useState<number>(0);

  // Maximum seconds reached (must never decrease)
  const maxWatchedSecondsRef = useRef<number>(0);
  const heartbeatIntervalRef = useRef<any>(null);
  const isLockedRef = useRef<boolean>(false);

  // 1. Fetch watermark token on mount or lesson change
  useEffect(() => {
    let isMounted = true;
    maxWatchedSecondsRef.current = 0;
    setIsLocked(false);
    isLockedRef.current = false;
    setLockMessage(null);

    async function loadToken() {
      if (!lessonId) return;
      setIsWatermarkLoading(true);
      try {
        const res = await videosApi.getWatermarkToken(lessonId);
        if (isMounted) {
          setWatermarkToken(res.watermarkToken);
        }
      } catch (err: any) {
        if (isMounted) {
          if (err?.isForbidden || err?.status === 403) {
            setIsLocked(true);
            isLockedRef.current = true;
            setLockMessage('تم قفل الفيديو أو تجاوز عدد المشاهدات المسموح بها.');
            if (onLocked) onLocked();
          }
        }
      } finally {
        if (isMounted) setIsWatermarkLoading(false);
      }
    }

    loadToken();

    return () => {
      isMounted = false;
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [lessonId]);

  // Update current playback time without ever decreasing maxWatchedSeconds
  const updateProgress = useCallback((currentTimeSeconds: number) => {
    if (currentTimeSeconds > maxWatchedSecondsRef.current) {
      maxWatchedSecondsRef.current = Math.floor(currentTimeSeconds);
    }
  }, []);

  // Send single heartbeat
  const sendHeartbeat = useCallback(async () => {
    if (isLockedRef.current || !lessonId || !watermarkToken) return;

    try {
      const res = await videosApi.sendHeartbeat(lessonId, {
        watchedSeconds: maxWatchedSecondsRef.current,
        videoToken: watermarkToken,
      });

      if (res.progress) {
        setViewCount(res.progress.ViewCount);
        if (res.progress.IsLocked) {
          setIsLocked(true);
          isLockedRef.current = true;
          setLockMessage('تم قفل الفيديو لاكتمال الحد الأقصى للمشاهدة.');
          if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
          if (onLocked) onLocked();
        }
      }
    } catch (err: any) {
      if (err?.isForbidden || err?.status === 403) {
        setIsLocked(true);
        isLockedRef.current = true;
        setLockMessage(err?.message || 'تم قفل الفيديو. تم إيقاف المشغل.');
        if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
        if (onLocked) onLocked();
      }
    }
  }, [lessonId, watermarkToken, onLocked]);

  // Heartbeat periodic loop (every 15 seconds)
  const startHeartbeatLoop = useCallback(() => {
    if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
    heartbeatIntervalRef.current = setInterval(() => {
      sendHeartbeat();
    }, 15000);
  }, [sendHeartbeat]);

  const stopHeartbeatLoop = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  return {
    watermarkToken,
    isWatermarkLoading,
    isLocked,
    lockMessage,
    viewCount,
    maxWatchedSeconds: maxWatchedSecondsRef.current,
    updateProgress,
    sendHeartbeat,
    startHeartbeatLoop,
    stopHeartbeatLoop,
  };
}
