"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { VideoPlayer } from "@/components/video-player";
import { QuizModal } from "@/components/quiz-modal";
import { AiChat } from "@/components/ai-chat";
import { StarsDisplay } from "@/components/stars-display";
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
        url: "https://www.youtube.com/watch?v=FQdaUv95mR8",
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
        url: "https://www.youtube.com/watch?v=7eh4d6sabA0",
      },
      {
        id: "2",
        title: "Neural Networks",
        url: "https://www.youtube.com/watch?v=CqOfi41LfDw",
      },
      {
        id: "3",
        title: "Deep Learning",
        url: "https://www.youtube.com/watch?v=VyWAvY2CF9c",
      },
    ],
  },
  cpp: {
    title: "C++ Programming",
    videos: [
      {
        id: "1",
        title: "C++ Basics",
        url: "https://www.youtube.com/watch?v=ZzaPdXTrSb8",
      },

      // {
      //   id: "2",
      //   title: "Advanced C++",
      //   url: "https://www.youtube.com/watch?v=18c3MTX0PK0",
      // },
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
  const [videoKey, setVideoKey] = useState(Date.now());

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
          setVideoKey(Date.now());
        } else {
          // If category is invalid, redirect to home
          router.push('/');
        }
      }
      setIsLoading(false);
    };

    initializeCourse();

    return () => {
      setCurrentCourse(null);
      setCurrentVideo(null);
      setVideoKey(Date.now());
    };
  }, [category, youtubeUrl, router]);

  const handleVideoChange = (video) => {
    setCurrentVideo(video);
    setShowQuiz(false);
    setQuizData(null);
    setVideoKey(Date.now());
  };

  useEffect(() => {
    if (currentVideo) {
      setIsLoading(false);
    }
  }, [currentVideo]);

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
        <div className="flex items-center gap-4 mb-6">
          <Button asChild variant="ghost" size="icon">
            <Link href="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{currentCourse?.title}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {currentVideo && (
              <VideoPlayer
                key={videoKey}
                url={currentVideo.url}
                onVideoChange={() => {
                  setShowQuiz(false);
                  setQuizData(null);
                }}
              />
            )}
          </div>

          <div className="space-y-6">
            <StarsDisplay />
            <Card>
              <CardHeader>
                <CardTitle>Course Content</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {currentCourse?.videos.map((video) => (
                    <Button
                      key={video.id}
                      variant={currentVideo?.id === video.id ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => handleVideoChange(video)}
                    >
                      <BookOpen className="mr-2 h-4 w-4" />
                      {video.title}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {showQuiz && (
          <QuizModal
            quiz={quizData}
            onComplete={handleQuizComplete}
            onClose={() => setShowQuiz(false)}
          />
        )}

        <AiChat />
      </div>
    </div>
  );
}