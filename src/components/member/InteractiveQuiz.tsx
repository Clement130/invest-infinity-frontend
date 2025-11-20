import { useState } from 'react';
import { CheckCircle2, XCircle, Award, RotateCcw } from 'lucide-react';

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'single' | 'multiple';
  options: QuizOption[];
  explanation?: string;
  points: number;
}

export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface InteractiveQuizProps {
  questions: QuizQuestion[];
  onComplete?: (score: number, totalPoints: number) => void;
}

export default function InteractiveQuiz({ questions, onComplete }: InteractiveQuizProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Set<string>>(new Set());
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;

  const handleAnswerSelect = (optionId: string) => {
    if (showResult) return;

    const newSelected = new Set(selectedAnswers);
    if (currentQuestion.type === 'single') {
      newSelected.clear();
      newSelected.add(optionId);
    } else {
      if (newSelected.has(optionId)) {
        newSelected.delete(optionId);
      } else {
        newSelected.add(optionId);
      }
    }
    setSelectedAnswers(newSelected);
  };

  const handleSubmit = () => {
    if (selectedAnswers.size === 0) return;

    const correctAnswers = currentQuestion.options
      .filter((opt) => opt.isCorrect)
      .map((opt) => opt.id);
    const selectedArray = Array.from(selectedAnswers);

    const isCorrect =
      correctAnswers.length === selectedArray.length &&
      correctAnswers.every((id) => selectedArray.includes(id));

    if (isCorrect) {
      setScore(score + currentQuestion.points);
    }
    setTotalPoints(totalPoints + currentQuestion.points);
    setShowResult(true);
    setAnsweredQuestions(new Set([...answeredQuestions, currentQuestionIndex]));
  };

  const handleNext = () => {
    if (isLastQuestion) {
      onComplete?.(score, totalPoints);
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswers(new Set());
      setShowResult(false);
    }
  };

  const handlePrevious = () => {
    if (!isFirstQuestion) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setSelectedAnswers(new Set());
      setShowResult(false);
    }
  };

  const handleReset = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers(new Set());
    setShowResult(false);
    setScore(0);
    setTotalPoints(0);
    setAnsweredQuestions(new Set());
  };

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const finalScore = isLastQuestion && showResult ? (score / totalPoints) * 100 : null;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-white">Quiz Interactif</h3>
          <span className="text-sm text-gray-400">
            Question {currentQuestionIndex + 1} / {questions.length}
          </span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium text-white">{currentQuestion.question}</h4>

        {/* Options */}
        <div className="space-y-2">
          {currentQuestion.options.map((option) => {
            const isSelected = selectedAnswers.has(option.id);
            const showCorrect = showResult && option.isCorrect;
            const showIncorrect = showResult && isSelected && !option.isCorrect;

            return (
              <button
                key={option.id}
                onClick={() => handleAnswerSelect(option.id)}
                disabled={showResult}
                className={`w-full text-left p-4 rounded-lg border transition ${
                  showCorrect
                    ? 'bg-green-500/20 border-green-500/50'
                    : showIncorrect
                    ? 'bg-red-500/20 border-red-500/50'
                    : isSelected
                    ? 'bg-purple-500/20 border-purple-500/50'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                } ${showResult ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <div className="flex items-center gap-3">
                  {showResult && option.isCorrect && (
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                  )}
                  {showIncorrect && (
                    <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  )}
                  <span className="text-white">{option.text}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {showResult && currentQuestion.explanation && (
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
            <p className="text-sm text-blue-200">{currentQuestion.explanation}</p>
          </div>
        )}

        {/* Final Score */}
        {finalScore !== null && (
          <div className="p-6 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-center space-y-2">
            <Award className="w-12 h-12 text-yellow-400 mx-auto" />
            <h4 className="text-2xl font-bold text-white">Quiz Terminé !</h4>
            <p className="text-lg text-gray-300">
              Score : {score} / {totalPoints} points ({finalScore.toFixed(0)}%)
            </p>
            {finalScore >= 80 && (
              <p className="text-green-400 font-semibold">Excellent travail ! 🎉</p>
            )}
            {finalScore >= 60 && finalScore < 80 && (
              <p className="text-yellow-400 font-semibold">Bien joué ! 👍</p>
            )}
            {finalScore < 60 && (
              <p className="text-orange-400 font-semibold">
                Continuez à réviser ! 💪
              </p>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <div className="flex items-center gap-2">
          {!isFirstQuestion && (
            <button
              onClick={handlePrevious}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition"
            >
              Précédent
            </button>
          )}
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded-lg bg-gray-500/20 hover:bg-gray-500/30 border border-gray-500/30 transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {!showResult ? (
          <button
            onClick={handleSubmit}
            disabled={selectedAnswers.size === 0}
            className="px-6 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 disabled:bg-gray-500/20 disabled:cursor-not-allowed transition font-medium"
          >
            Valider
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="px-6 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 transition font-medium"
          >
            {isLastQuestion ? 'Voir les résultats' : 'Question suivante'}
          </button>
        )}
      </div>
    </div>
  );
}


