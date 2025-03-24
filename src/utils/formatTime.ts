/**
 * Formats seconds into a MM:SS string display
 * @param seconds Number of seconds to format
 * @returns Formatted time string (MM:SS)
 */
export const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };
  
  export default formatTime;