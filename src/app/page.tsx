'use client'
import { useState } from "react";
import generateQuestions from "./api";

export default function Home() {
  type Question = {
    question: string;
    answers: string[];
    correctAnswer: number; // 0-based index
  };

  const [prompt, setPrompt] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unanswered, setUnanswered] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const handlePromptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrompt(e.target.value);
  };

const handleGenerateQuestions = async () => {
  setLoading(true);
  setError(null);
  setShowResults(false);
  setUnanswered([]);
  try {
    const qs = await generateQuestions(prompt); // await here!
    setQuestions(qs);
    setSelectedAnswers(Array(qs.length).fill(-1));
  } catch (_) { 
    setError("Failed to generate questions.");
  } finally {
    setLoading(false);
    renderQuestions();
  }
};

  const handleSelect = (qIdx: number, aIdx: number) => {
    const updated = [...selectedAnswers];
    updated[qIdx] = aIdx;
    setSelectedAnswers(updated);
    setShowResults(false);
    setError(null);
    setUnanswered([]);
  };

  const checkAnswers = () => {
    const unansweredQuestions = selectedAnswers
      .map((ans, idx) => (ans === -1 ? idx + 1 : null))
      .filter((v) => v !== null) as number[];
    if (unansweredQuestions.length > 0) {
      setError(
        `Please answer all questions. Unanswered: ${unansweredQuestions.join(", ")}`
      );
      setUnanswered(unansweredQuestions);
      setShowResults(false);
      return;
    }
    setError(null);
    setUnanswered([]);
    setShowResults(true);
  };

  const getScore = () => {
    return questions.reduce(
      (score, q, idx) => score + (selectedAnswers[idx] === q.correctAnswer ? 1 : 0),
      0
    );
  };

  function renderQuestions() {
    return questions.map((q, qIdx) => {
      const isUnanswered = unanswered.includes(qIdx + 1);
      return (
        <div
          key={qIdx}
          className={`w-full max-w-xl flex flex-col justify-between border-neutral-700 ${isUnanswered ? 'border-2 border-red-500 rounded' : ''}`}
        >
          <h2 className="text-lg font-bold mb-5">{`Question ${qIdx + 1}`}</h2>
          <p>{q.question}</p>
          <p className="my-4 text-gray-600 dark:text-gray-300">Select the correct answer:</p>
          <form>
            <div className="flex flex-col divide-y divide-neutral-300 dark:divide-neutral-700" id={`question-${qIdx + 1}`}>
              {q.answers.map((answer, aIdx) => {
                const isSelected = selectedAnswers[qIdx] === aIdx;
                const isCorrect =
                  showResults &&
                  isSelected &&
                  aIdx === q.correctAnswer;
                const isWrong =
                  showResults &&
                  isSelected &&
                  aIdx !== q.correctAnswer;
                return (
                  <label
                    key={aIdx}
                    className={`
                      flex items-center p-2 rounded text-gray-700 dark:text-gray-200 transition-colors cursor-pointer
                      hover:bg-neutral-200 dark:hover:bg-neutral-700
                      ${isWrong ? 'text-red-600 dark:text-red-400 font-bold' : ''}
                      ${isCorrect ? 'text-green-600 dark:text-green-400 font-bold' : ''}
                    `}
                  >
                    <input
                      type="radio"
                      name={`answer-${qIdx}`}
                      className="mr-2"
                      checked={isSelected}
                      onChange={() => handleSelect(qIdx, aIdx)}
                    />
                    {answer}
                  </label>
                );
              })}
            </div>
          </form>
          {isUnanswered && (
            <div className="text-red-600 dark:text-red-400 mt-2 text-sm">
              Please answer this question.
            </div>
          )}
        </div>
      );
    });
  }

  return (
    <main className="flex grow flex-col items-center justify-between gap-7.5 p-10">
      <div className="w-full max-w-xl flex flex-col gap-4 mb-8">
        <input
          type="text"
          value={prompt}
          onChange={handlePromptChange}
          placeholder="Enter your quiz topic or prompt"
          className="border border-neutral-400 rounded px-3 py-2"
          disabled={loading}
        />
        <button
          onClick={handleGenerateQuestions}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          disabled={loading || !prompt.trim()}
        >
          {loading ? "Generating..." : "Generate Questions"}
        </button>
      </div>
      {error && (
        <div className="text-red-600 dark:text-red-400 mb-4">{error}</div>
      )}
      {questions.length > 0 && renderQuestions()}
      {questions.length > 0 && (
        <button
          onClick={checkAnswers}
          className="bg-transparent text-neutral-900 dark:text-neutral-100 border border-neutral-900 dark:border-neutral-100 px-4 py-2 rounded hover:bg-neutral-900 hover:text-neutral-100 dark:hover:bg-neutral-100 dark:hover:text-neutral-900 mt-6 w-fit transition-colors"
        >
          Check Answers
        </button>
      )}
      {showResults && (
        <div className="mt-6 text-lg font-semibold">
          Score: {getScore()} / {questions.length}
        </div>
      )}
    </main>
  );
}
