import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface TrackCardProps {
  track: {
    id: string;
    title: string;
    artist: string;
    bpm: number;
    key: string;
  };
  votes: number;
  percentage: number;
  isSelected?: boolean;
  onClick: () => void;
}

export const TrackCard = ({ 
  track, 
  votes, 
  percentage, 
  isSelected = false, 
  onClick 
}: TrackCardProps) => {
  return (
    <Card className={cn(
      "relative overflow-hidden cursor-pointer transition-all duration-300",
      "bg-card/50 backdrop-blur-sm border-2",
      "hover:bg-card/80 hover:border-primary/50",
      isSelected && "bg-gradient-rave border-secondary shadow-neon animate-pulse-glow"
    )}>
      <Button
        onClick={onClick}
        variant="ghost"
        className="w-full h-full p-4 flex flex-col items-start justify-between min-h-[120px]"
      >
        <div className="flex flex-col items-start w-full">
          <h3 className="font-bold text-lg mb-1 text-left">{track.title}</h3>
          <p className="text-muted-foreground text-sm mb-2 text-left">{track.artist}</p>
          
          <div className="flex gap-4 text-xs">
            <span className="px-2 py-1 bg-primary/20 text-primary rounded">
              {track.bpm} BPM
            </span>
            <span className="px-2 py-1 bg-accent/20 text-accent rounded">
              {track.key}
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between w-full mt-3">
          <div className="flex items-center gap-2">
            <span className="text-secondary font-bold">{votes}</span>
            <span className="text-muted-foreground text-sm">votes</span>
          </div>
          <span className="text-accent font-mono font-bold">{percentage}%</span>
        </div>
      </Button>
      
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-border overflow-hidden">
        <div 
          className="h-full bg-gradient-festival transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </Card>
  );
};