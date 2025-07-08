"use client";

import { useEffect, useRef, useState } from "react";
import { QuizModal } from "./quiz-modal";

export function VideoPlayer({ url }) {
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizData, setQuizData] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [error, setError] = useState(null);
  const timeUpdateInterval = useRef(null);
  const quizzesRef = useRef([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [quizTimes, setQuizTimes] = useState([]);
  const [shownQuizzes, setShownQuizzes] = useState(new Set());
  const [isQuizShown, setIsQuizShown] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const getVideoId = (url) => {
    if (!url) {
      setError("No video URL provided");
      return null;
    }
    
    try {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      if (!match || match[2].length !== 11) {
        setError("Invalid YouTube URL");
        return null;
      }
      return match[2];
    } catch (err) {
      setError("Error parsing YouTube URL");
      return null;
    }
  };

  const fetchQuizzes = async () => {
    try {
      setIsGeneratingQuiz(true);
      
      // Get the current duration from the player
      const currentDuration = playerRef.current?.getDuration() || 0;
      console.log("Current video duration:", currentDuration);
      
      const requestBody = {
        url: url,
        duration: Math.ceil(currentDuration / 60).toString()
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
            url: url
          }),
        });

        if (!quizResponse.ok) {
          const errorData = await quizResponse.json();
          throw new Error(`Quiz fetch failed: ${errorData.message || 'Unknown error'}`);
        }

        const quizData = await quizResponse.json();
        console.log("Quiz data received:", quizData);
        
        // Store the segment quizzes
        const newQuizzes = quizData.segment_quizzes || [];
        setQuizzes(newQuizzes);
        quizzesRef.current = newQuizzes;
        
        // Calculate quiz times
        const quizInterval = 600; // 10 minutes in seconds
        const times = [];
        
        // Map each segment quiz to a 10-minute interval
        for (let i = 0; i < newQuizzes.length; i++) {
          let quizTime;
          if (i === newQuizzes.length - 1) {
            // Last quiz at video end
            quizTime = currentDuration;
          } else {
            // Other quizzes at 10-minute intervals
            quizTime = quizInterval * (i + 1);
          }
          times.push(quizTime);
          console.log(`Mapped quiz ${i + 1} to time ${quizTime} seconds`);
        }
        
        setQuizTimes(times);
        setShownQuizzes(new Set());
        setCurrentQuizIndex(0);
        
        console.log("All quiz times calculated:", times);
      }
    } catch (error) {
      console.error("Error fetching quizzes:", error);
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const initializePlayer = (videoId) => {
    playerRef.current = new window.YT.Player(containerRef.current, {
      height: "100%",
      width: "100%",
      videoId: videoId,
      playerVars: {
        autoplay: 1,
        modestbranding: 1,
        rel: 0,
        enablejsapi: 1
      },
      events: {
        onReady: (event) => {
          console.log("Player ready");
          // Wait a moment for the duration to be available
          setTimeout(() => {
            const duration = event.target.getDuration();
            console.log("Video duration:", duration);
            setVideoDuration(duration);
            setIsPlayerReady(true);
            // Start transcription process immediately when player is ready
            fetchQuizzes();
          }, 1000);
        },
        onStateChange: (event) => {
          console.log("Player state changed:", event.data);
          if (event.data === window.YT.PlayerState.ENDED) {
            console.log("Video ended, showing final quiz");
            // Only show the final quiz if it hasn't been shown yet
            const finalQuizIndex = quizzesRef.current.length - 1;
            if (finalQuizIndex >= 0 && !shownQuizzes.has(finalQuizIndex)) {
              showNextQuiz(finalQuizIndex);
            }
          }
        }
      },
    });

    // Start tracking video time
    timeUpdateInterval.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        const time = playerRef.current.getCurrentTime();
        setCurrentTime(time);
      }
    }, 1000); // Check every second
  };

  const showNextQuiz = (segmentIndex) => {
    console.log("Attempting to show quiz for segment:", segmentIndex);
    console.log("Current quizzes:", quizzesRef.current);
    console.log("Shown quizzes:", shownQuizzes);
    console.log("Is quiz shown:", isQuizShown);

    if (quizzesRef.current.length > 0 && 
        segmentIndex < quizzesRef.current.length && 
        !isQuizShown && 
        !shownQuizzes.has(segmentIndex)) {
      
      console.log("Showing quiz for segment:", segmentIndex, "Quiz data:", quizzesRef.current[segmentIndex]);
      
      const segmentQuiz = quizzesRef.current[segmentIndex];
      if (segmentQuiz && segmentQuiz.questions) {
        console.log("Questions for segment:", segmentIndex, segmentQuiz.questions);
        setQuizData({
          questions: segmentQuiz.questions,
          currentQuestionIndex: 0
        });
        setShowQuiz(true);
        setIsQuizShown(true);
        setShownQuizzes(prev => new Set([...prev, segmentIndex]));
        
        if (playerRef.current) {
          playerRef.current.pauseVideo();
        }
      } else {
        console.error("Invalid quiz data structure for segment:", segmentIndex, segmentQuiz);
      }
    } else {
      console.log("Quiz not shown because:", {
        hasQuizzes: quizzesRef.current.length > 0,
        validIndex: segmentIndex < quizzesRef.current.length,
        notShown: !isQuizShown,
        notInShownQuizzes: !shownQuizzes.has(segmentIndex)
      });
    }
  };

  const handleQuizComplete = () => {
    console.log("Quiz completed");
    setShowQuiz(false);
    setIsQuizShown(false);
    if (playerRef.current) {
      playerRef.current.playVideo();
    }
  };

  // Initialize YouTube player immediately
  useEffect(() => {
    const videoId = getVideoId(url);
    if (!videoId) return;

    // Clean up previous player if it exists
    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
    }

    // Reset states for new video
    setQuizzes([]);
    quizzesRef.current = [];
    setShownQuizzes(new Set());
    setCurrentQuizIndex(0);
    setQuizTimes([]);
    setIsPlayerReady(false);
    setVideoDuration(0);
    setIsQuizShown(false);
    setShowQuiz(false);
    setQuizData(null);
    setCurrentTime(0);

    // Clear any existing interval
    if (timeUpdateInterval.current) {
      clearInterval(timeUpdateInterval.current);
      timeUpdateInterval.current = null;
    }

    // Check if YouTube API is already loaded
    if (window.YT) {
      initializePlayer(videoId);
    } else {
      // Load YouTube API if not already loaded
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        console.log("YouTube API Ready, initializing player...");
        initializePlayer(videoId);
      };
    }

    return () => {
      if (timeUpdateInterval.current) {
        clearInterval(timeUpdateInterval.current);
        timeUpdateInterval.current = null;
      }
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [url]);

  // Add effect to handle quiz timing
  useEffect(() => {
    if (quizTimes.length > 0 && currentQuizIndex < quizTimes.length) {
      const nextQuizTime = quizTimes[currentQuizIndex];
      console.log("Current time:", currentTime, "Next quiz time:", nextQuizTime);
      
      // Check if we've passed the next quiz time
      if (currentTime >= nextQuizTime && !isQuizShown) {
        console.log("Time to show quiz at:", nextQuizTime);
        showNextQuiz(currentQuizIndex);
        setCurrentQuizIndex(prev => prev + 1);
      }
    }
  }, [currentTime, quizTimes, currentQuizIndex, isQuizShown]);

  if (error) {
    return (
      <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
        <div className="text-center p-4">
          <p className="text-red-500 font-medium">{error}</p>
        </div>
      </div>
    );
  }

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
            setIsQuizShown(false);
            if (playerRef.current) {
              playerRef.current.playVideo();
            }
          }}
        />
      )}
    </>
  );
} 