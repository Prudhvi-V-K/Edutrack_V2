"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function QuizModal({ quiz, onComplete, onClose }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const currentQuestion = quiz.questions[currentQuestionIndex];

  const getAnswerLetter = (option) => {
    // Extract the letter from the option (e.g., "A. Some text" -> "A")
    return option.split('.')[0].trim();
  };

  const handleAnswerSelect = (option) => {
    if (isCompleted) return;
    
    setSelectedAnswer(option);
    setShowExplanation(true);
    const selectedLetter = getAnswerLetter(option);
    if (selectedLetter === currentQuestion.correct_answer) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setIsCompleted(true);
      onComplete(score);
    }
  };

  const handleClose = () => {
    if (!isCompleted) {
      setIsCompleted(true);
      onComplete(score);
    }
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto overflow-x-hidden w-[90vw]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Quiz Time!</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <CardContent className="p-6">
              <div className="space-y-4">
                <p className="text-lg font-medium whitespace-pre-wrap break-words">
                  {currentQuestion.question}
                </p>
                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => (
                    <Button
                      key={index}
                      variant={selectedAnswer === option ? "default" : "outline"}
                      className="w-full justify-start text-left whitespace-normal min-h-[44px] h-auto py-2 px-4"
                      onClick={() => !showExplanation && handleAnswerSelect(option)}
                      disabled={showExplanation || isCompleted}
                    >
                      <span className="break-words">{option}</span>
                    </Button>
                  ))}
                </div>
                {showExplanation && (
                  <div className="mt-6 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <p className="font-medium text-lg mb-2">
                      {getAnswerLetter(selectedAnswer) === currentQuestion.correct_answer
                        ? "✅ Correct!"
                        : "❌ Incorrect"}
                    </p>
                    <p className="whitespace-pre-wrap break-words">
                      {currentQuestion.explanation}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-end sticky bottom-0 pt-4 bg-transparent">
            <Button 
              onClick={handleNext} 
              disabled={isCompleted}
              className="px-6 py-2 text-lg bg-black text-white rounded-md shadow-md"
            >
              {currentQuestionIndex < quiz.questions.length - 1
                ? "Next Question"
                : "Complete Quiz"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 