"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WorkoutSessionsCard } from "@/components/workout-sessions-card";
import { UserSettingsDialog } from "@/components/user-settings-dialog";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowLeft, ArrowRight, BicepsFlexed } from "lucide-react";

interface DateGroup {
  date: string;
  count: number;
  volume?: number;
  durationMinutes?: number;
  distance?: number;
}

interface CSVData {
  success: boolean;
  dateColumn: string;
  totalGroups: number;
  totalRows: number;
  averageDurationMinutes: number;
  thisMonthSessionCount: number;
  thisMonthAverageDuration: number;
  prevMonthAverageDuration: number;
  thisMonthAverageSets: number;
  prevMonthAverageSets: number;
  thisMonthAverageDistance: number;
  prevMonthAverageDistance: number;
  thisMonthAverageExercises: number;
  prevMonthAverageExercises: number;
  thisMonthAverageReps: number;
  prevMonthAverageReps: number;
  weeklyGoal: number;
  volumeIncreaseGoal: number;
  groups: DateGroup[];
  last10Sessions: DateGroup[];
}

export default function WorkoutsPage() {
  const [data, setData] = useState<CSVData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [chartView, setChartView] = useState<'volume' | 'duration' | 'cardio'>('volume');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get<CSVData>("/api/csv-data", {
          params: {
            year: selectedYear,
            month: selectedMonth
          }
        });
        setData(response.data);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data");
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedYear, selectedMonth]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-zinc-950 p-8">
      <main className="w-full max-w-4xl">
        <div className="flex items-center justify-center mb-8 relative">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
            Fitness Progress Tracker
          </h1>
          <UserSettingsDialog />
        </div>

        {loading && !data && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-zinc-600 dark:text-zinc-400">Loading data...</p>
            </CardContent>
          </Card>
        )}

        {error && !data && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-red-600 dark:text-red-400">Error: {error}</p>
            </CardContent>
          </Card>
        )}


        {data && (
          <div className="space-y-6">
            {/* Volume Progression Chart */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{chartView === 'volume' ? 'Volume' : chartView === 'duration' ? 'Duration' : 'Cardio'} Progression - {new Date(selectedYear, selectedMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</CardTitle>
                    <CardDescription>
                      {chartView === 'volume' 
                        ? `Total volume (weight × reps) with ${data.volumeIncreaseGoal}% increase goal per session`
                        : chartView === 'duration'
                        ? 'Workout duration per session'
                        : 'Total distance covered per session'
                      }
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex gap-1 mr-2">
                      <Button 
                        variant={chartView === 'volume' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setChartView('volume')}
                      >
                        Volume
                      </Button>
                      <Button 
                        variant={chartView === 'duration' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setChartView('duration')}
                      >
                        Duration
                      </Button>
                      <Button 
                        variant={chartView === 'cardio' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setChartView('cardio')}
                      >
                        Cardio
                      </Button>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const newDate = new Date(selectedYear, selectedMonth - 1);
                        setSelectedYear(newDate.getFullYear());
                        setSelectedMonth(newDate.getMonth());
                        setLoading(true);
                      }}
                    >
                      <ArrowLeft/>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const now = new Date();
                        setSelectedYear(now.getFullYear());
                        setSelectedMonth(now.getMonth());
                        setLoading(true);
                      }}
                      disabled={selectedYear === new Date().getFullYear() && selectedMonth === new Date().getMonth()}
                    >
                      Today
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const newDate = new Date(selectedYear, selectedMonth + 1);
                        setSelectedYear(newDate.getFullYear());
                        setSelectedMonth(newDate.getMonth());
                        setLoading(true);
                      }}
                      disabled={selectedYear === new Date().getFullYear() && selectedMonth === new Date().getMonth()}
                    >
                      <ArrowRight/>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart 
                    data={data.last10Sessions.map((session, idx) => {
                      const baseVolume = data.last10Sessions[0]?.volume || 0;
                      const targetVolume = baseVolume * Math.pow(1 + data.volumeIncreaseGoal / 100, idx);
                      const prevVolume = idx > 0 ? data.last10Sessions[idx - 1]?.volume || 0 : 0;
                      const percentChange = idx > 0 && prevVolume > 0 
                        ? ((session.volume || 0) - prevVolume) / prevVolume * 100 
                        : 0;
                      return {
                        ...session,
                        date: new Date(session.date).getTime(),
                        dateStr: session.date,
                        targetVolume: Math.round(targetVolume),
                        percentChange: percentChange
                      };
                    })}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-800" />
                    <XAxis 
                      dataKey="date"
                      type="number"
                      domain={[
                        new Date(selectedYear, selectedMonth, 1).getTime(),
                        new Date(selectedYear, selectedMonth + 1, 0).getTime()
                      ]}
                      scale="time"
                      tickFormatter={(timestamp) => new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      ticks={(() => {
                        const startOfMonth = new Date(selectedYear, selectedMonth, 1);
                        const endOfMonth = new Date(selectedYear, selectedMonth + 1, 0);
                        const ticks: number[] = [];
                        
                        // Add first day of month
                        ticks.push(startOfMonth.getTime());
                        
                        // Find first Monday of the month
                        const firstMonday = new Date(startOfMonth);
                        const dayOfWeek = firstMonday.getDay();
                        const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek) % 7;
                        firstMonday.setDate(firstMonday.getDate() + daysUntilMonday);
                        
                        // Add all Mondays in the month
                        for (let d = new Date(firstMonday); d <= endOfMonth; d.setDate(d.getDate() + 7)) {
                          if (d.getTime() !== startOfMonth.getTime()) {
                            ticks.push(d.getTime());
                          }
                        }
                        
                        // Add last day of month if not already included
                        if (ticks[ticks.length - 1] !== endOfMonth.getTime()) {
                          ticks.push(endOfMonth.getTime());
                        }
                        
                        return ticks;
                      })()}
                      className="text-xs"
                    />
                    {chartView === 'volume' ? (
                      <>
                        <YAxis 
                          yAxisId="left"
                          tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                          className="text-xs"
                        />
                        <YAxis 
                          yAxisId="right"
                          orientation="right"
                          tickFormatter={(value) => `${value}m`}
                          className="text-xs"
                        />
                      </>
                    ) : chartView === 'duration' ? (
                      <YAxis 
                        tickFormatter={(value) => `${value}m`}
                        className="text-xs"
                      />
                    ) : (
                      <YAxis 
                        tickFormatter={(value) => `${value.toFixed(1)}km`}
                        className="text-xs"
                      />
                    )}
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          const change = data.percentChange || 0;
                          const isIncrease = change > 0;
                          return (
                            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 shadow-lg">
                              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                                {new Date(data.dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                              {chartView === 'volume' ? (
                                <>
                                  <p className="text-sm text-blue-600 dark:text-blue-400">
                                    Actual: <span className="font-semibold">{data.volume?.toLocaleString()}</span>
                                  </p>
                                  <p className="text-sm text-green-600 dark:text-green-400">
                                    Target: <span className="font-semibold">{data.targetVolume?.toLocaleString()}</span>
                                  </p>
                                  {change !== 0 && (
                                    <p className={`text-sm ${isIncrease ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                      Change: <span className="font-semibold">{isIncrease ? '+' : ''}{change.toFixed(1)}%</span>
                                    </p>
                                  )}
                                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                    Sets: <span className="font-semibold">{data.count}</span>
                                  </p>
                                </>
                              ) : chartView === 'duration' ? (
                                <>
                                  {data.durationMinutes && (
                                    <p className="text-sm text-purple-600 dark:text-purple-400">
                                      Duration: <span className="font-semibold">{Math.floor(data.durationMinutes / 60)}h {data.durationMinutes % 60}m</span>
                                    </p>
                                  )}
                                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                    Sets: <span className="font-semibold">{data.count}</span>
                                  </p>
                                </>
                              ) : (
                                <>
                                  {data.distance && (
                                    <p className="text-sm text-orange-600 dark:text-orange-400">
                                      Distance: <span className="font-semibold">{data.distance.toFixed(2)} km</span>
                                    </p>
                                  )}
                                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                    Sets: <span className="font-semibold">{data.count}</span>
                                  </p>
                                </>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    {chartView === 'volume' ? (
                      <>
                        <Line 
                          yAxisId="left"
                          type="monotone" 
                          dataKey="volume" 
                          stroke="#3b82f6" 
                          strokeWidth={3}
                          dot={{ fill: '#3b82f6', r: 5 }}
                          activeDot={{ r: 7 }}
                          name="Actual Volume"
                        />
                        <Line 
                          yAxisId="left"
                          type="monotone" 
                          dataKey="targetVolume" 
                          stroke="#22c55e" 
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={{ fill: '#22c55e', r: 4 }}
                          name="Target Volume"
                        />
                      </>
                    ) : chartView === 'duration' ? (
                      <Line 
                        type="monotone" 
                        dataKey="durationMinutes" 
                        stroke="#a855f7" 
                        strokeWidth={3}
                        dot={{ fill: '#a855f7', r: 5 }}
                        activeDot={{ r: 7 }}
                        name="Duration"
                      />
                    ) : (
                      <Line 
                        type="monotone" 
                        dataKey="distance" 
                        stroke="#f97316" 
                        strokeWidth={3}
                        dot={{ fill: '#f97316', r: 5 }}
                        activeDot={{ r: 7 }}
                        name="Distance"
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-6 mt-4 text-sm">
                  {chartView === 'volume' ? (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-0.5 bg-blue-500"></div>
                        <span className="text-zinc-600 dark:text-zinc-400">Actual Volume</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-0.5 bg-green-500 border-dashed" style={{ borderTop: '2px dashed' }}></div>
                        <span className="text-zinc-600 dark:text-zinc-400">Target (+{data.volumeIncreaseGoal}% per session)</span>
                      </div>
                    </>
                  ) : chartView === 'duration' ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-0.5 bg-purple-500"></div>
                      <span className="text-zinc-600 dark:text-zinc-400">Duration</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-0.5 bg-orange-500"></div>
                      <span className="text-zinc-600 dark:text-zinc-400">Distance (km)</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardDescription>Sessions</CardDescription>
                  <CardTitle className="text-4xl">
                    {data.thisMonthSessionCount}
                  </CardTitle>
                </CardHeader>
              </Card> 

              <Card>
                <CardHeader>
                  <CardDescription>Average Sets per Workout</CardDescription>
                  <CardTitle className="text-4xl">
                    {data.thisMonthAverageSets > 0 ? data.thisMonthAverageSets.toFixed(1) : 'N/A'}
                  </CardTitle>
                  {data.prevMonthAverageSets > 0 && data.thisMonthAverageSets > 0 && (() => {
                    const percentChange = ((data.thisMonthAverageSets - data.prevMonthAverageSets) / data.prevMonthAverageSets) * 100;
                    const isIncrease = percentChange > 0;
                    return (
                      <p className={`text-sm font-semibold mt-2 ${isIncrease ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {isIncrease ? '+' : ''}{percentChange.toFixed(1)}% vs last month
                      </p>
                    );
                  })()}
                </CardHeader>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardDescription>Average Workout Duration</CardDescription>
                  <CardTitle className="text-4xl">
                    {data.thisMonthAverageDuration > 0 
                      ? `${Math.floor(data.thisMonthAverageDuration / 60)}h ${data.thisMonthAverageDuration % 60}m`
                      : 'N/A'
                    }
                  </CardTitle>
                  {data.prevMonthAverageDuration > 0 && data.thisMonthAverageDuration > 0 && (() => {
                    const percentChange = ((data.thisMonthAverageDuration - data.prevMonthAverageDuration) / data.prevMonthAverageDuration) * 100;
                    const isIncrease = percentChange > 0;
                    return (
                      <p className={`text-sm font-semibold mt-2 ${isIncrease ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {isIncrease ? '+' : ''}{percentChange.toFixed(1)}% vs last month
                      </p>
                    );
                  })()}
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <CardDescription>Average Cardio Distance</CardDescription>
                  <CardTitle className="text-4xl">
                    {data.thisMonthAverageDistance > 0 
                      ? `${data.thisMonthAverageDistance.toFixed(2)} km`
                      : 'N/A'
                    }
                  </CardTitle>
                  {data.prevMonthAverageDistance > 0 && data.thisMonthAverageDistance > 0 && (() => {
                    const percentChange = ((data.thisMonthAverageDistance - data.prevMonthAverageDistance) / data.prevMonthAverageDistance) * 100;
                    const isIncrease = percentChange > 0;
                    return (
                      <p className={`text-sm font-semibold mt-2 ${isIncrease ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {isIncrease ? '+' : ''}{percentChange.toFixed(1)}% vs last month
                      </p>
                    );
                  })()}
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <CardDescription>Average Exercises per Session</CardDescription>
                  <CardTitle className="text-4xl">
                    {data.thisMonthAverageExercises > 0 ? data.thisMonthAverageExercises.toFixed(1) : 'N/A'}
                  </CardTitle>
                  {data.prevMonthAverageExercises > 0 && data.thisMonthAverageExercises > 0 && (() => {
                    const percentChange = ((data.thisMonthAverageExercises - data.prevMonthAverageExercises) / data.prevMonthAverageExercises) * 100;
                    const isIncrease = percentChange > 0;
                    return (
                      <p className={`text-sm font-semibold mt-2 ${isIncrease ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {isIncrease ? '+' : ''}{percentChange.toFixed(1)}% vs last month
                      </p>
                    );
                  })()}
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <CardDescription>Average Reps per Set</CardDescription>
                  <CardTitle className="text-4xl">
                    {data.thisMonthAverageReps > 0 ? data.thisMonthAverageReps.toFixed(1) : 'N/A'}
                  </CardTitle>
                  {data.prevMonthAverageReps > 0 && data.thisMonthAverageReps > 0 && (() => {
                    const percentChange = ((data.thisMonthAverageReps - data.prevMonthAverageReps) / data.prevMonthAverageReps) * 100;
                    const isIncrease = percentChange > 0;
                    return (
                      <p className={`text-sm font-semibold mt-2 ${isIncrease ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {isIncrease ? '+' : ''}{percentChange.toFixed(1)}% vs last month
                      </p>
                    );
                  })()}
                </CardHeader>
              </Card>
            </div>

            <WorkoutSessionsCard
              totalGroups={data.totalGroups}
              groups={data.groups}
              weeklyGoal={data.weeklyGoal}
            />

            <div>
              <h2 className="text-2xl font-bold mb-4 text-zinc-900 dark:text-zinc-50">
                All Time Stats
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardDescription>Total Workout Sessions</CardDescription>
                    <CardTitle className="text-4xl">{data.totalGroups}</CardTitle>
                  </CardHeader>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardDescription>Total Sets</CardDescription>
                    <CardTitle className="text-4xl">{data.totalRows}</CardTitle>
                  </CardHeader>
                </Card>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
