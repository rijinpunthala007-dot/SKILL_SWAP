import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Award, CheckCircle, XCircle, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { quizzesApi } from '../../services/api.service';
import { toast } from 'react-hot-toast';

interface QuizModalProps {
  skillName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function QuizModal({ skillName, isOpen, onClose }: QuizModalProps) {
  const qc = useQueryClient();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [quizFinished, setQuizFinished] = useState(false);
  const [result, setResult] = useState<{ passed: boolean; score: number; totalQuestions: number; pointsAwarded: number } | null>(null);

  const { data: quizData, isLoading, error } = useQuery({
    queryKey: ['quiz', skillName],
    queryFn: () => quizzesApi.getQuiz(skillName),
    enabled: isOpen && !quizFinished,
  });

  const submitMutation = useMutation({
    mutationFn: () => quizzesApi.submitQuiz(skillName, answers),
    onSuccess: (res) => {
      setResult(res.data.data);
      setQuizFinished(true);
      if (res.data.data.passed) {
        toast.success(`You passed the quiz! Verified badge unlocked! 🏅`);
        qc.invalidateQueries({ queryKey: ['profile', 'me'] });
      } else {
        toast.error(`You didn't pass this time. Keep learning!`);
      }
    },
    onError: () => {
      toast.error('Failed to submit quiz.');
    },
  });

  if (!isOpen) return null;

  const quiz = quizData?.data?.data;
  const totalQuestions = quiz?.questions.length ?? 0;

  const handleSelectAnswer = (choiceIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentIdx] = choiceIndex;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentIdx < totalQuestions - 1) {
      setCurrentIdx(currentIdx + 1);
    }
  };

  const handleBack = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
    }
  };

  const handleSubmit = () => {
    if (answers.length < totalQuestions || answers.includes(undefined as any)) {
      toast.error('Please answer all questions before submitting');
      return;
    }
    submitMutation.mutate();
  };

  const handleReset = () => {
    setCurrentIdx(0);
    setAnswers([]);
    setQuizFinished(false);
    setResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="glass-card w-full max-w-lg p-6 relative flex flex-col max-h-[90vh] shadow-2xl border-white/10">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-brand-400" />
            <h3 className="font-bold text-white text-lg">{skillName} Skill Quiz</h3>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-brand-400 animate-spin mb-3" />
              <p className="text-white/50 text-sm">Loading quiz questions...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <XCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
              <p className="text-white/60 text-sm">Failed to load quiz</p>
            </div>
          ) : quizFinished && result ? (
            // Quiz Results Step
            <div className="text-center py-4 space-y-4">
              {result.passed ? (
                <div className="space-y-3">
                  <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto animate-bounce" />
                  <h4 className="text-xl font-bold text-white">Congratulations! You Passed! 🎉</h4>
                  <p className="text-white/60 text-sm">
                    You scored <strong className="text-white">{result.score}</strong> out of {result.totalQuestions}.
                  </p>
                  <p className="text-emerald-300 font-medium text-sm">
                    +{result.pointsAwarded} XP awarded! Verified badge unlocked! 🏆
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <XCircle className="w-16 h-16 text-red-400 mx-auto" />
                  <h4 className="text-xl font-bold text-white">Quiz Not Passed</h4>
                  <p className="text-white/60 text-sm">
                    You scored <strong className="text-white">{result.score}</strong> out of {result.totalQuestions}.
                    You need {quiz?.passThreshold} correct answers to pass.
                  </p>
                  <button onClick={handleReset} className="btn-secondary text-sm mt-2">
                    Try Again
                  </button>
                </div>
              )}
            </div>
          ) : quiz ? (
            // Active Quiz Question Step
            <div className="space-y-5">
              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-xs text-white/40 mb-1.5 font-medium">
                  <span>Question {currentIdx + 1} of {totalQuestions}</span>
                  <span>{Math.round(((currentIdx) / totalQuestions) * 100)}% Complete</span>
                </div>
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-brand-500 h-full transition-all duration-300"
                    style={{ width: `${((currentIdx + 1) / totalQuestions) * 100}%` }}
                  />
                </div>
              </div>

              {/* Question Text */}
              <div className="py-2">
                <h4 className="text-white font-semibold text-base leading-relaxed">
                  {quiz.questions[currentIdx]?.questionText}
                </h4>
              </div>

              {/* Choices */}
              <div className="space-y-2.5">
                {quiz.questions[currentIdx]?.choices.map((choice: string, idx: number) => {
                  const isSelected = answers[currentIdx] === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectAnswer(idx)}
                      className={`w-full text-left p-3.5 rounded-xl border text-sm transition-all duration-200 ${
                        isSelected 
                          ? 'bg-brand-500/20 border-brand-500 text-white font-medium shadow-md shadow-brand-900/10'
                          : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      <span className="inline-block w-6 h-6 rounded-lg bg-white/5 border border-white/10 text-center leading-5 mr-3 text-xs">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      {choice}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        {!quizFinished && quiz && (
          <div className="flex items-center justify-between pt-4 border-t border-white/10 mt-auto">
            <button
              onClick={handleBack}
              disabled={currentIdx === 0}
              className="btn-secondary px-3 py-2 flex items-center gap-1 text-xs disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>

            {currentIdx === totalQuestions - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={submitMutation.isPending}
                className="btn-primary px-4 py-2 text-xs flex items-center gap-1.5"
              >
                {submitMutation.isPending ? 'Submitting...' : 'Submit Quiz'}
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={answers[currentIdx] === undefined}
                className="btn-secondary px-3 py-2 flex items-center gap-1 text-xs disabled:opacity-50"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {quizFinished && (
          <div className="flex justify-end pt-4 border-t border-white/10 mt-auto">
            <button onClick={onClose} className="btn-primary px-4 py-2 text-xs">
              Done
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
