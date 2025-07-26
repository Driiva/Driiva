import { useState } from "react";
import { askAI } from "@/lib/aiClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Brain, Send, Loader2 } from "lucide-react";

interface AIInsightsProps {
  className?: string;
}

export default function AIInsights({ className = "" }: AIInsightsProps) {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    try {
      const result = await askAI(prompt);
      setResponse(result.answer);
    } catch (error) {
      setResponse("Sorry, I couldn't process your request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const suggestedQuestions = [
    "Why might my EV premium drop if my drive score hits 90?",
    "How does night driving affect my insurance premium?",
    "What are the best practices for improving my driving score?",
    "How does telematics insurance work?"
  ];

  return (
    <section className={`mb-6 ${className}`}>
      <div className="glass-morphism rounded-3xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
            <Brain className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">AI Driving Insights</h3>
            <p className="text-sm text-gray-400">Ask questions about your driving and insurance</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask me anything about driving, insurance, or safety..."
              className="min-h-[100px] bg-white/5 border-white/10 text-white placeholder:text-gray-400 resize-none"
            />
            <Button
              onClick={handleAsk}
              disabled={loading || !prompt.trim()}
              className="absolute bottom-3 right-3 bg-purple-500 hover:bg-purple-600 text-white"
              size="sm"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Suggested Questions */}
          <div className="grid grid-cols-1 gap-2">
            <p className="text-xs text-gray-400 mb-2">Try these questions:</p>
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => setPrompt(question)}
                className="text-left text-sm text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg p-2 transition-colors"
              >
                {question}
              </button>
            ))}
          </div>

          {/* Response */}
          {response && (
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center space-x-2 mb-2">
                <Brain className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium text-purple-400">AI Response</span>
              </div>
              <div className="text-sm text-white whitespace-pre-wrap">{response}</div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}