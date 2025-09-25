import { cn } from "@/lib/utils";

interface ProgressBarProps {
  timeLeft: number;
  totalTime: number;
  className?: string;
}

export const ProgressBar = ({ timeLeft, totalTime, className }: ProgressBarProps) => {
  const percentage = ((totalTime - timeLeft) / totalTime) * 100;
  
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-foreground">Time Remaining</span>
        <span className="text-lg font-mono font-bold text-primary">{timeLeft}s</span>
      </div>
      
      <div className="relative h-3 bg-muted rounded-full overflow-hidden">
        <div 
          className={cn(
            "absolute left-0 top-0 h-full transition-all duration-1000 ease-linear",
            "bg-gradient-festival shadow-glow",
            timeLeft <= 5 && "animate-neon-flicker"
          )}
          style={{ width: `${percentage}%` }}
        />
        
        {/* Pulsing effect when time is low */}
        {timeLeft <= 5 && (
          <div 
            className="absolute left-0 top-0 h-full bg-gradient-rave opacity-50 animate-pulse"
            style={{ width: `${percentage}%` }}
          />
        )}
      </div>
    </div>
  );
};