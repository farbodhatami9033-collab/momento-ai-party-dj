import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VoteButtonProps {
  label: string;
  count: number;
  percentage: number;
  isSelected?: boolean;
  onClick: () => void;
  className?: string;
}

export const VoteButton = ({ 
  label, 
  count, 
  percentage, 
  isSelected = false, 
  onClick, 
  className 
}: VoteButtonProps) => {
  return (
    <Button
      onClick={onClick}
      className={cn(
        "relative h-20 w-full flex flex-col items-center justify-center",
        "transition-all duration-300 border-2",
        "bg-card/50 backdrop-blur-sm hover:bg-card/80",
        "text-foreground font-bold text-lg",
        isSelected && "bg-gradient-festival border-primary shadow-glow animate-pulse-glow",
        !isSelected && "border-border hover:border-primary/50",
        className
      )}
      variant="outline"
    >
      <div className="relative z-10 flex flex-col items-center">
        <span className="mb-1">{label}</span>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-primary font-mono">{count}</span>
          <span className="text-muted-foreground">({percentage}%)</span>
        </div>
      </div>
      
      {/* Progress bar background */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-border rounded-b-lg overflow-hidden">
        <div 
          className="h-full bg-gradient-festival transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </Button>
  );
};