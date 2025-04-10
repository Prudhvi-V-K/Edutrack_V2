"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { VideoPlayer } from "@/components/video-player";
import { QuizModal } from "@/components/quiz-modal";
import { AiChat } from "@/components/ai-chat";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowLeft, BookOpen } from "lucide-react";
import Link from "next/link";

const MOCK_COURSES = {
  web: {
    title: "Web Development Fundamentals",
    videos: [
      {
        id: "1",
        title: "HTML Basics",
        url: "https://www.youtube.com/watch?v=FQdaUv95mR8&pp=ygUbaHRtbCB0dXRvcmlhbCBmb3IgYmVnaW5uZXJz",
      },
      {
        id: "2",
        title: "CSS Styling",
        url: "https://www.youtube.com/watch?v=1PnVor36_40",
      },
      {
        id: "3",
        title: "JavaScript Intro",
        url: "https://www.youtube.com/watch?v=W6NZfCO5SIk",
      },
    ],
  },
  ml: {
    title: "Machine Learning Essentials",
    videos: [
      {
        id: "1",
        title: "ML Fundamentals",
        url: "https://www.youtube.com/watch?v=_xIwjmCH6D4&pp=ygULbWwgdHV0b3JpYWw%3D",
      },
      {
        id: "2",
        title: "Neural Networks",
        url: "https://www.youtube.com/watch?v=CqOfi41LfDw",
      },
      {
        id: "3",
        title: "Deep Learning",
        url: "https://www.youtube.com/watch?v=5tvmMX8r_OM",
      },
    ],
  },
  cpp: {
    title: "C++ Programming",
    videos: [
      {
        id: "1",
        title: "C++ Basics",
        url: "https://www.youtube.com/watch?v=vLnPwxZdW4Y",
      },
      {
        id: "2",
        title: "Object-Oriented C++",
        url: "https://www.youtube.com/watch?v=wN0x9eZLix4",
      },
      {
        id: "3",
        title: "Advanced C++",
        url: "https://www.youtube.com/watch?v=18c3MTX0PK0",
      },
    ],
  },
};

export default function TutorialPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const category = searchParams.get("category") || "web";
  const youtubeUrl = searchParams.get("youtube");

  const [currentCourse, setCurrentCourse] = useState(null);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizData, setQuizData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeCourse = () => {
      setIsLoading(true);
      if (youtubeUrl) {
        const customCourse = {
          title: "Custom YouTube Course",
          videos: [{ id: "custom", title: "Custom Video", url: youtubeUrl }],
        };
        setCurrentCourse(customCourse);
        setCurrentVideo(customCourse.videos[0]);
      } else {
        const course = MOCK_COURSES[category];
        if (course) {
          setCurrentCourse(course);
          setCurrentVideo(course.videos[0]);
        } else {
          // If category is invalid, redirect to home
          router.push('/');
        }
      }
      setIsLoading(false);
    };

    initializeCourse();
  }, [category, youtubeUrl, router]);

  const handleVideoChange = (video) => {
    setCurrentVideo(video);
    setShowQuiz(false);
    setQuizData(null);
  };

  const handleQuizReady = () => {
    // Handle quiz ready state if needed
  };

  const handleQuizComplete = (score) => {
    setShowQuiz(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-2xl font-semibold">Loading...</div>
      </div>
    );
  }

  if (!currentCourse || !currentVideo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-2xl font-semibold">Course not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Button variant="ghost" asChild className="mr-4">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {currentCourse.title}
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <VideoPlayer
              key={currentVideo.url} // Add key to force VideoPlayer remount
              videoUrl={currentVideo.url}
              onQuizReady={handleQuizReady}
            />

            <div className="mt-6 bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md">
              <h2 className="text-xl font-semibold mb-4">{currentVideo.title}</h2>

              <div className="flex flex-wrap gap-4 mt-6">
                {currentCourse.videos.map((video) => (
                  <Button
                    key={video.id}
                    variant={currentVideo.id === video.id ? "default" : "outline"}
                    onClick={() => handleVideoChange(video)}
                  >
                    {video.title}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showQuiz && quizData && (
        <QuizModal
          quiz={quizData}
          quizNumber="1"
          onComplete={handleQuizComplete}
          onClose={() => setShowQuiz(false)}
        />
      )}

      <AiChat />
    </div>
  );
}