import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-zinc-950 p-8">
      <main className="w-full max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-5xl font-bold mb-4">
              Fitness Progress Tracker
            </CardTitle>
            <CardDescription className="text-lg">
              Track your workout progress, monitor volume increases, and visualize your fitness journey
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full text-center">
              <div className="p-4 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">📊</div>
                <div className="mt-2 font-semibold text-zinc-900 dark:text-zinc-50">Volume Tracking</div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">Monitor progressive overload</div>
              </div>
              <div className="p-4 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">📅</div>
                <div className="mt-2 font-semibold text-zinc-900 dark:text-zinc-50">Calendar View</div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">Visualize workout consistency</div>
              </div>
              <div className="p-4 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">🎯</div>
                <div className="mt-2 font-semibold text-zinc-900 dark:text-zinc-50">Weekly Goals</div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">Stay on track with targets</div>
              </div>
            </div>
            <Link href="/workouts" className="w-full max-w-xs">
              <Button size="lg" className="w-full text-lg">
                View My Workouts
              </Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
