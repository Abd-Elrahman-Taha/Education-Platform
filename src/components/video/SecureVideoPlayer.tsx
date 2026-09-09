import React, { useRef, useEffect, useState } from 'react';
import { Lock, AlertOctagon } from 'lucide-react';
import { useVideoPlayback } from '../../hooks/useVideoPlayback';

interface SecureVideoPlayerProps {
  lessonId: string;
  videoUrl?: string;
  title: string;
  userPhone?: string;
  userName?: string;
}

export const SecureVideoPlayer: React.FC<SecureVideoPlayerProps> = ({
  lessonId,
  videoUrl = 'https://www.w3schools.com/html/mov_bbb.mp4',
  title,
  userPhone,
  userName,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const {
    watermarkToken,
    isWatermarkLoading,
    isLocked,
    lockMessage,
    updateProgress,
    startHeartbeatLoop,
    stopHeartbeatLoop,
    sendHeartbeat,
  } = useVideoPlayback({
    lessonId,
    onLocked: () => {
      if (videoRef.current) {
        videoRef.current.pause();
      }
    },
  });

  // Handle play/pause & heartbeats
  const handlePlay = () => {
    if (isLocked) {
      if (videoRef.current) videoRef.current.pause();
      return;
    }
    startHeartbeatLoop();
  };

  const handlePause = () => {
    stopHeartbeatLoop();
    sendHeartbeat(); // send last position on pause
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      if (isLocked) {
        videoRef.current.pause();
        return;
      }
      updateProgress(videoRef.current.currentTime);
    }
  };

  // If locked, ensure video is paused immediately
  useEffect(() => {
    if (isLocked && videoRef.current) {
      videoRef.current.pause();
      stopHeartbeatLoop();
    }
  }, [isLocked, stopHeartbeatLoop]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopHeartbeatLoop();
    };
  }, [stopHeartbeatLoop]);

  const [watermarkCoords, setWatermarkCoords] = useState({ top: 18, left: 22 });

  // Dynamically drift watermark across video to prevent cropping/recording
  useEffect(() => {
    const interval = setInterval(() => {
      const top = Math.floor(Math.random() * 55) + 15;
      const left = Math.floor(Math.random() * 55) + 15;
      setWatermarkCoords({ top, left });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        background: '#000',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
      }}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={videoUrl}
        controls={!isLocked}
        controlsList="nodownload nofullscreen"
        onContextMenu={(e) => e.preventDefault()}
        onPlay={handlePlay}
        onPause={handlePause}
        onTimeUpdate={handleTimeUpdate}
        style={{
          width: '100%',
          aspectRatio: '16/9',
          display: 'block',
          filter: isLocked ? 'blur(8px) brightness(0.3)' : 'none',
          pointerEvents: isLocked ? 'none' : 'auto',
          transition: 'filter 0.3s ease',
        }}
      />

      {/* Floating Dynamic DRM Watermark Overlay */}
      {!isLocked && (
        <div
          style={{
            position: 'absolute',
            top: `${watermarkCoords.top}%`,
            left: `${watermarkCoords.left}%`,
            transition: 'top 2.5s ease-in-out, left 2.5s ease-in-out',
            pointerEvents: 'none',
            opacity: 0.32,
            color: '#FFF',
            fontSize: '0.85rem',
            fontFamily: 'monospace',
            letterSpacing: '1px',
            transform: 'rotate(-12deg)',
            zIndex: 10,
            userSelect: 'none',
            textShadow: '0 1px 3px rgba(0,0,0,0.8)',
          }}
        >
          <div style={{ fontWeight: 700 }}>{userPhone || 'Syntax Math'}</div>
          {userName && <div style={{ fontSize: '0.72rem', opacity: 0.9 }}>{userName}</div>}
          {watermarkToken && (
            <div style={{ fontSize: '0.62rem', opacity: 0.75 }}>
              DRM: {watermarkToken.substring(0, 16)}...
            </div>
          )}
        </div>
      )}

      {/* Locked State Overlay */}
      {isLocked && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(10, 15, 20, 0.92)',
            zIndex: 20,
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.2)',
              color: 'var(--danger)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
            }}
          >
            <Lock size={32} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFF', margin: '0 0 0.5rem' }}>
            المحتوى محمي ومقفل
          </h3>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.88rem', maxWidth: '420px', margin: 0 }}>
            {lockMessage || 'تم قفل المحاضرة لتجاوز الحد الأقصى للمشاهدات المسموح بها.'}
          </p>
        </div>
      )}
    </div>
  );
};
