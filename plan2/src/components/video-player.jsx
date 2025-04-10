"use client";

import { useEffect, useRef, useState } from "react";
import { QuizModal } from "./quiz-modal";

export function VideoPlayer({ videoUrl }) {
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizData, setQuizData] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const timeUpdateInterval = useRef(null);
  const quizzesRef = useRef([]);
  const isQuizShownRef = useRef(false);
  const lastQuizTimeRef = useRef(0);
  const shownSegmentsRef = useRef(new Set());

  const fetchQuizzes = async () => {
    try {
      setIsGeneratingQuiz(true);
      const requestBody = {
        url: videoUrl,
        duration: Math.ceil(videoDuration / 60).toString()
      };
      
      console.log("Sending request to /transcribe with:", requestBody);
      
      const transcribeResponse = await fetch("http://localhost:5000/transcribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!transcribeResponse.ok) {
        const errorData = await transcribeResponse.json();
        console.error("Transcribe error details:", errorData);
        throw new Error(`Transcription failed: ${errorData.message || 'Unknown error'}`);
      }

      const transcribeData = await transcribeResponse.json();
      console.log("Transcribe response:", transcribeData);
      
      if (transcribeData.message === "success") {
        const quizResponse = await fetch("http://localhost:5000/quiz", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: videoUrl
          }),
        });

        if (!quizResponse.ok) {
          const errorData = await quizResponse.json();
          throw new Error(`Quiz fetch failed: ${errorData.message || 'Unknown error'}`);
        }

        const quizData = await quizResponse.json();
        console.log("Quiz data received:", quizData);
        const newQuizzes = quizData.segment_quizzes || [];
        setQuizzes(newQuizzes);
        quizzesRef.current = newQuizzes;
        lastQuizTimeRef.current = 0;
        shownSegmentsRef.current = new Set();
      }
    } catch (error) {
      console.error("Error fetching quizzes:", error);
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const showNextQuiz = (segmentIndex) => {
    if (quizzesRef.current.length > 0 && 
        segmentIndex < quizzesRef.current.length && 
        !isQuizShownRef.current && 
        !shownSegmentsRef.current.has(segmentIndex)) {
      
      console.log("Showing quiz for segment:", segmentIndex, "Quiz data:", quizzesRef.current[segmentIndex]);
      
      const segmentQuiz = quizzesRef.current[segmentIndex];
      if (segmentQuiz && segmentQuiz.questions && segmentQuiz.questions["1"] && segmentQuiz.questions["1"].questions) {
        const questions = segmentQuiz.questions["1"].questions;
        console.log("Questions for segment:", segmentIndex, questions);
        setQuizData({
          questions: questions,
          currentQuestionIndex: 0
        });
        setShowQuiz(true);
        isQuizShownRef.current = true;
        shownSegmentsRef.current.add(segmentIndex);
        
        if (playerRef.current) {
          playerRef.current.pauseVideo();
        }
      } else {
        console.error("Invalid quiz data structure for segment:", segmentIndex, segmentQuiz);
      }
    }
  };

  // Initialize YouTube player immediately
  useEffect(() => {
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      console.log("YouTube API Ready, initializing player...");
      playerRef.current = new window.YT.Player(containerRef.current, {
        height: "100%",
        width: "100%",
        videoId: getVideoId(videoUrl),
        playerVars: {
          autoplay: 1,
          modestbranding: 1,
          rel: 0,
          enablejsapi: 1
        },
        events: {
          onReady: (event) => {
            console.log("Player ready");
            const duration = event.target.getDuration();
            console.log("Video duration:", duration);
            setVideoDuration(duration);
            setIsPlayerReady(true);

            timeUpdateInterval.current = setInterval(() => {
              if (playerRef.current && playerRef.current.getCurrentTime) {
                const currentTime = Math.floor(playerRef.current.getCurrentTime());
                if (currentTime === 600 && !shownSegmentsRef.current.has(0)) {
                  console.log("10-minute mark reached, showing first quiz");
                  showNextQuiz(0);
                }
              }
            }, 1000);
          },
          onStateChange: (event) => {
            console.log("Player state changed:", event.data);
            if (event.data === window.YT.PlayerState.ENDED) {
              console.log("Video ended, showing next unseen quiz");
              // Show the next unseen segment's quiz
              for (let i = 0; i < quizzesRef.current.length; i++) {
                if (!shownSegmentsRef.current.has(i)) {
                  showNextQuiz(i);
                  break;
                }
              }
            }
          }
        },
      });
    };

    return () => {
      if (timeUpdateInterval.current) {
        clearInterval(timeUpdateInterval.current);
      }
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [videoUrl]);

  // Fetch quizzes after player is ready and duration is known
  useEffect(() => {
    if (isPlayerReady && videoDuration > 0) {
      console.log("Player is ready, fetching quizzes with duration:", videoDuration);
      fetchQuizzes();
    }
  }, [isPlayerReady, videoDuration]);

  const getVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const handleQuizComplete = () => {
    console.log("Quiz completed");
    setShowQuiz(false);
    isQuizShownRef.current = false;
    if (playerRef.current) {
      playerRef.current.playVideo();
    }
  };

  return (
    <>
      <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-lg">
        <div ref={containerRef} className="absolute inset-0" />
        {isGeneratingQuiz && (
          <div className="absolute bottom-4 right-4 bg-black/80 text-white px-4 py-2 rounded-full text-sm flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating Quizzes...
          </div>
        )}
      </div>
      {showQuiz && quizData && (
        <QuizModal
          quiz={quizData}
          onComplete={handleQuizComplete}
          onClose={() => {
            setShowQuiz(false);
            isQuizShownRef.current = false;
            if (playerRef.current) {
              playerRef.current.playVideo();
            }
          }}
        />
      )}
    </>
  );
} 