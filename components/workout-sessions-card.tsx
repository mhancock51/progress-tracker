import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkoutHeatmap } from "@/components/workout-heatmap";

interface DateGroup {
  date: string;
  count: number;
  volume?: number;
  durationMinutes?: number;
  distance?: number;
}

interface WorkoutSessionsCardProps {
  totalGroups: number;
  groups: DateGroup[];
  weeklyGoal: number;
}

export function WorkoutSessionsCard({ totalGroups, groups, weeklyGoal }: WorkoutSessionsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Workout Sessions</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs defaultValue="calendar" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>
          
          <TabsContent value="list" className="mt-4">
            <div className="max-h-96 overflow-y-auto space-y-2">
              {groups.map((group) => (
                <div
                  key={group.date}
                  className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-900 rounded-md"
                >
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">
                    {new Date(group.date).toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                  <div className="flex flex-row justify-center items-center gap-1">
                    {
                      group.durationMinutes &&
                      <span className={`w-[90px] text-center px-3 py-1 ${group.durationMinutes > 60 ? "bg-green-500" : "bg-zinc-900 dark:bg-zinc-50"} text-zinc-50 dark:text-zinc-900 rounded-full text-sm font-semibold`}>
                        {Math.floor(group.durationMinutes / 60)} h {group.durationMinutes % 60} m
                      </span>
                    }
                    <span className="w-[90px] text-center px-3 py-1 bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900 rounded-full text-sm font-semibold">
                      {group.count} sets
                    </span>
                    <span className="w-[90px] text-center px-3 py-1 text-primary text-sm font-semibold">
                      {group.volume} kg
                    </span>
                    <span className="w-[90px] text-center px-3 py-1 text-primary text-sm font-semibold">
                      {group.distance} km
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="calendar" className="mt-4">
            <WorkoutHeatmap 
              workoutDates={groups
                .map(g => g.date)
                .filter(date => {
                  const year = new Date(date).getFullYear();
                  return year === new Date().getFullYear();
                })
              } 
              weeklyGoal={weeklyGoal}
            />
            <p className="text-center text-sm text-zinc-600 dark:text-zinc-400 mt-4">
              Green squares indicate workout days • Yellow border indicates weeks meeting goal ({weeklyGoal}+ workouts) • Showing {new Date().getFullYear()} year-to-date
            </p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
