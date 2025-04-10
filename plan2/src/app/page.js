import { CourseCard } from "@/components/course-card";
import { YoutubeForm } from "@/components/youtube-form";
import { Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-center text-center mb-12">
          <div className="flex items-center gap-2 mb-4">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Edutrack
            </h1>
            <Sparkles className="h-8 w-8 text-yellow-500" />
          </div>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl">
            Discover interactive courses with built-in quizzes and track your
            progress as you learn
          </p>
        </div>

        <div className="mb-16">
          <h2 className="text-2xl font-semibold mb-6 text-slate-800 dark:text-slate-100">
            Choose a Learning Path
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <CourseCard
              title="Web Development"
              description="Master HTML, CSS, JavaScript and modern frameworks"
              image="/web.jpg?height=200&width=400"
              color="from-blue-500 to-cyan-400"
              href="/tutorial?category=web"
            />
            <CourseCard
              title="Machine Learning"
              description="Dive into AI, neural networks and data science"
              image="/ml.jpg?height=200&width=400"
              color="from-purple-500 to-indigo-500"
              href="/tutorial?category=ml"
            />
            <CourseCard
              title="C++ Programming"
              description="Learn system programming and game development"
              image="/cplus.webp?height=200&width=400"
              color="from-red-500 to-orange-500"
              href="/tutorial?category=cpp"
            />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg max-w-2xl mx-auto">
          <h2 className="text-2xl font-semibold mb-6 text-slate-800 dark:text-slate-100">
            Or Import Your Own Course
          </h2>
          <YoutubeForm />
        </div>
      </div>
    </main>
  );
}
