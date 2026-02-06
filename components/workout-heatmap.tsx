"use client";

import { useEffect, useMemo, useRef } from "react";

interface WorkoutHeatmapProps {
  workoutDates: string[];
  weeklyGoal: number;
}

export function WorkoutHeatmap({ workoutDates, weeklyGoal }: WorkoutHeatmapProps) {
  // Filter workout dates to only include current year
  const today = new Date();
  const currentYear = today.getFullYear();
  
  const currentYearWorkoutDates = useMemo(() => {
    const filtered = workoutDates.filter(date => {
      const workoutYear = new Date(date).getFullYear();
      return workoutYear === currentYear;
    });
    return filtered;
  }, [workoutDates, currentYear]);
  
  const workoutDateSet = useMemo(() => new Set(currentYearWorkoutDates), [currentYearWorkoutDates]);
  
  const scrollViewRef = useRef<HTMLDivElement>(null);

  const heatmapData = useMemo(() => {
    // Get current year's January 1st and today
    const now = new Date();
    const yearStart = new Date(currentYear, 0, 1); // January 1st of current year
    
    // Generate all weeks
    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];
    
    // Start from January 1st of current year
    const current = new Date(yearStart);
    
    // Pad the beginning of the first week
    const firstDayOfWeek = current.getDay();
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push(new Date(0)); // Placeholder for empty cells
    }
    
    // Fill in all days from January 1st to today
    while (current <= now) {
      currentWeek.push(new Date(current));
      
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      
      current.setDate(current.getDate() + 1);
    }
    
    // Add remaining days to the last week
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(new Date(0)); // Placeholder
      }
      weeks.push(currentWeek);
    }
    
    return weeks;
  }, [currentYear]);
  
  const getWorkoutCount = (date: Date) => {
    if (date.getTime() === 0) return 0; // Placeholder cell
    const dateStr = date.toISOString().split('T')[0];
    return workoutDateSet.has(dateStr) ? 1 : 0;
  };
  
  const getWeekWorkoutCount = (week: Date[]) => {
    return week.filter(date => {
      if (date.getTime() === 0) return false;
      const dateStr = date.toISOString().split('T')[0];
      return workoutDateSet.has(dateStr);
    }).length;
  };
  
  const getIntensityClass = (count: number, isPlaceholder: boolean) => {
    if (isPlaceholder) return "bg-transparent";
    if (count === 0) return "bg-zinc-100 dark:bg-zinc-800";
    return "bg-green-500 dark:bg-green-600";
  };
  
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  // Get month labels for the top
  const getMonthLabels = () => {
    const labels: { month: string; offset: number }[] = [];
    let lastMonth = -1;
    
    heatmapData.forEach((week, weekIndex) => {
      const firstValidDate = week.find(d => d.getTime() !== 0);
      if (firstValidDate) {
        const month = firstValidDate.getMonth();
        if (month !== lastMonth) {
          labels.push({ month: months[month], offset: weekIndex });
          lastMonth = month;
        }
      }
    });
    
    return labels;
  };
  
  const monthLabels = getMonthLabels();

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollLeft = scrollViewRef.current.scrollWidth;
    }
  }, []);
  
  return (
    <div className="w-full overflow-x-auto"
      ref={scrollViewRef}
    >
      <div className="inline-block min-w-full">
        {/* Month labels */}
        <div className="flex mb-2 ml-8 relative" style={{ height: '16px' }}>
          {monthLabels.map((label, idx) => (
            <div
              key={idx}
              className="text-xs text-zinc-600 dark:text-zinc-400 absolute"
              style={{ left: `${label.offset * (12 + 8 + 4)}px` }}
            >
              {label.month}
            </div>
          ))}
        </div>
        
        <div className="flex gap-1">
          {/* Day labels */}
          <div className="flex flex-col gap-1 text-xs text-zinc-600 dark:text-zinc-400 mr-2">
            <div className="h-3"></div>
            <div className="h-3">Mon</div>
            <div className="h-3"></div>
            <div className="h-3">Wed</div>
            <div className="h-3"></div>
            <div className="h-3">Fri</div>
            <div className="h-3"></div>
          </div>
          
          {/* Heatmap grid */}
          <div className="flex gap-1">
            {heatmapData.map((week, weekIndex) => {
              const weekWorkoutCount = getWeekWorkoutCount(week);
              const meetsGoal = weekWorkoutCount >= weeklyGoal;
              
              return (
                <div key={weekIndex} className={`flex flex-col gap-1 p-1 rounded ${meetsGoal ? 'border-2 border-yellow-400 dark:border-yellow-500' : ''}`}>
                  {week.map((date, dayIndex) => {
                    const isPlaceholder = date.getTime() === 0;
                    const count = getWorkoutCount(date);
                    const dateStr = !isPlaceholder 
                      ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : '';
                    
                    return (
                      <div
                        key={dayIndex}
                        className={`w-3 h-3 rounded-sm ${getIntensityClass(count, isPlaceholder)} transition-colors hover:ring-2 hover:ring-zinc-400 dark:hover:ring-zinc-600`}
                        title={!isPlaceholder ? `${dateStr}${count > 0 ? ' - Workout day' : ' - Rest day'}` : ''}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex items-center gap-2 mt-4 text-xs text-zinc-600 dark:text-zinc-400">
          <span>Rest Day</span>
          <div className="w-3 h-3 rounded-sm bg-zinc-100 dark:bg-zinc-800"></div>
          <div className="w-3 h-3 rounded-sm bg-green-500 dark:bg-green-600"></div>
          <span>Session</span>
        </div>
      </div>
    </div>
  );
}
