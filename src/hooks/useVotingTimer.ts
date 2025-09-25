import { useState, useEffect, useCallback } from 'react';

export const useVotingTimer = (initialTime: number, onComplete: () => void) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isActive, setIsActive] = useState(false);

  const start = useCallback(() => {
    setIsActive(true);
    setTimeLeft(initialTime);
  }, [initialTime]);

  const stop = useCallback(() => {
    setIsActive(false);
    setTimeLeft(initialTime);
  }, [initialTime]);

  const reset = useCallback(() => {
    setTimeLeft(initialTime);
  }, [initialTime]);

useEffect(() => {
  let intervalId: NodeJS.Timeout | undefined;

  if (isActive && timeLeft > 0) {
    intervalId = setInterval(() => {
      setTimeLeft((time) => {
        if (time <= 1) {
          setIsActive(false);
          return 0;
        }
        return time - 1;
      });
    }, 1000);
  }

  return () => {
    if (intervalId) clearInterval(intervalId);
  };
}, [isActive, timeLeft]);

// Call onComplete after render when timer hits 0 to avoid render-phase updates
useEffect(() => {
  if (!isActive && timeLeft === 0) {
    onComplete();
  }
}, [isActive, timeLeft, onComplete]);

  return {
    timeLeft,
    isActive,
    start,
    stop,
    reset
  };
};