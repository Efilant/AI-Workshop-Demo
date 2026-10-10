/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Briefcase,
  UserCheck,
  GraduationCap,
  MessageSquare,
  Sparkles,
  ChevronRight,
  Send,
  Star,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  BookOpen,
  Award,
  RefreshCw,
  Play,
  ArrowRight,
  HelpCircle,
  User,
  ShieldCheck,
  TrendingUp,
  Clock,
  Check,
  Layers,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface InterviewQuestion {
  category: string;
  question: string;
  interviewerPerspective: string;
  whatTheyLookFor: string[];
  starTip: string;
}

interface EvaluationResult {
  score: number;
  starAnalysis: {
    situation: string;
    task: string;
    action: string;
    result: string;
  };
  strengths: string[];
  improvements: string[];
  modelAnswer: string;
}

interface TrainingRecommendation {
  title: string;
  platformOrType: string;
  reason: string;
  estimatedWeeks: number;
}

interface ActionPlanStep {
  step: number;
  title: string;
  description: string;
}

interface TrainingAnalysisResult {
  currentLevelAssessment: string;
  skillGaps: string[];
  nextTrainingRecommendations: TrainingRecommendation[];
  careerActionPlan: ActionPlanStep[];
}

interface ChatMessage {
  role: "user" | "model";
  content: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<"simulator" | "mock" | "training" | "coach">("simulator");

  // Tab 1 & 2: Interview Simulator State
  const [interviewerTitle, setInterviewerTitle] = useState("Engineering Manager");
  const [companyType, setCompanyType] = useState("Teknoloji / Scale-up");
  const [experienceLevel, setExperienceLevel] = useState("Senior / Tech Lead");
  const [department, setDepartment] = useState("Yazılım Mühendisliği");
  const [context, setContext] = useState("Bulut tabanlı mikroservis dönüşümü yapan global bir şirket.");
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);

  // Selected question for mock practice
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);

  // Tab 3: Training & Gap Analysis State
  const [completedTrainings, setCompletedTrainings] = useState(
    "1. İleri Seviye React ve TypeScript Mimarisi (Patika.dev - 2025)\n2. System Design & Distributed Systems (Udemy - 2024)\n3. Agile & Scrum Master Başlangıç Eğitimi (Scrum.org - 2024)"
  );
  const [targetRole, setTargetRole] = useState("Principal Software Engineer / Staff Architect");
  const [careerGoals, setCareerGoals] = useState("Büyük ölçekli sistemlerin mimari kararlarını almak, teknik liderlik yapmak ve bulut maliyetlerini optimize etmek.");
  const [loadingTraining, setLoadingTraining] = useState(false);
  const [trainingAnalysis, setTrainingAnalysis] = useState<TrainingAnalysisResult | null>(null);

  // Tab 4: Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "model",
      content: "Merhaba! Ben senin yapay zeka mülakat ve kariyer koçunum. Hangi pozisyon için mülakata hazırlanıyorsun ya da kariyerinde hangi adımı atmak istiyorsun? Bana anlatsan hemen başlayalım! 🚀"
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // Load sample questions on mount if empty
  useEffect(() => {
    // Initial quick questions
    generateQuestions();
  }, []);

  const generateQuestions = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoadingQuestions(true);
    setEvaluation(null);
    try {
      const res = await fetch("/api/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interviewerTitle,
          companyType,
          experienceLevel,
          department,
          context,
        }),
      });
      const data = await res.json();
      if (data.questions) {
        setQuestions(data.questions);
        if (data.questions.length > 0) {
          setSelectedQuestionIndex(0);
        }
      }
    } catch (err) {
      console.error(err);
      alert("Sorular üretilirken bir hata oluştu.");
    } finally {
      setLoadingQuestions(false);
    }
  };

  const evaluateAnswer = async () => {
    if (selectedQuestionIndex === null || !questions[selectedQuestionIndex]) return;
    if (!userAnswer.trim()) {
      alert("Lütfen yanıtınızı yazın.");
      return;
    }

    setEvaluating(true);
    setEvaluation(null);
    try {
      const currentQ = questions[selectedQuestionIndex];
      const res = await fetch("/api/evaluate-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: currentQ.question,
          answer: userAnswer,
          interviewerTitle,
          targetRole: department,
        }),
      });
      const data = await res.json();
      setEvaluation(data);
    } catch (err) {
      console.error(err);
      alert("Yanıt değerlendirilirken hata oluştu.");
    } finally {
      setEvaluating(false);
    }
  };

  const analyzeTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingTraining(true);
    try {
      const res = await fetch("/api/analyze-training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          completedTrainings,
          targetRole,
          careerGoals,
        }),
      });
      const data = await res.json();
      setTrainingAnalysis(data);
    } catch (err) {
      console.error(err);
      alert("Eğitim analizi yapılırken hata oluştu.");
    } finally {
      setLoadingTraining(false);
    }
  };

  const sendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || chatLoading) return;

    const userMsg: ChatMessage = { role: "user", content: inputMessage };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputMessage("");
    setChatLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      if (data.reply) {
        setMessages([...newMessages, { role: "model", content: data.reply }]);
      }
    } catch (err) {
      console.error(err);
      setMessages([
        ...newMessages,
        { role: "model", content: "Üzgünüm, şu anda yanıt oluştururken bir teknik sorun yaşadım." },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Header / Navigation */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
                CareerPulse AI
              </span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
                Mülakat & Kariyer Koçu
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-1 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab("simulator")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === "simulator"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Mülakat Simülatörü</span>
            </button>

            <button
              onClick={() => setActiveTab("mock")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === "mock"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Canlı Soru Koçu</span>
              {questions.length > 0 && (
                <span className="ml-1 w-5 h-5 bg-indigo-400/20 text-indigo-200 rounded-full text-xs flex items-center justify-center">
                  {questions.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("training")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === "training"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Eğitim & Kariyer Gelişimi</span>
            </button>

            <button
              onClick={() => setActiveTab("coach")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === "coach"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>AI Kariyer Asistanı</span>
            </button>
          </nav>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="md:hidden flex overflow-x-auto space-x-2 px-4 py-2 bg-slate-900 border-t border-slate-800 scrollbar-none">
          <button
            onClick={() => setActiveTab("simulator")}
            className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium ${
              activeTab === "simulator" ? "bg-indigo-600 text-white" : "text-slate-400"
            }`}
          >
            Mülakat Simülatörü
          </button>
          <button
            onClick={() => setActiveTab("mock")}
            className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium ${
              activeTab === "mock" ? "bg-indigo-600 text-white" : "text-slate-400"
            }`}
          >
            Canlı Soru Koçu
          </button>
          <button
            onClick={() => setActiveTab("training")}
            className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium ${
              activeTab === "training" ? "bg-indigo-600 text-white" : "text-slate-400"
            }`}
          >
            Eğitim Analizi
          </button>
          <button
            onClick={() => setActiveTab("coach")}
            className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium ${
              activeTab === "coach" ? "bg-indigo-600 text-white" : "text-slate-400"
            }`}
          >
            Kariyer Asistanı
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ================= TAB 1: MÜLAKAT SİMÜLATÖRÜ ================= */}
        {activeTab === "simulator" && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            <div className="bg-gradient-to-r from-indigo-900/40 via-purple-900/20 to-slate-900/50 p-6 sm:p-8 rounded-2xl border border-indigo-500/20 shadow-xl">
              <div className="max-w-3xl">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3">
                  Mülakatçı Perspektifi & Soru Üreteci
                </h1>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  Karşınızda olacak mülakatçının unvanını ve şirket profilini girin. Yapay zeka, o kişinin gözünden size yöneltilebilecek en kritik soruları, niyetleri ve STAR metodolojisi ipuçlarını anında üretsin.
                </p>
              </div>

              <form onSubmit={generateQuestions} className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-indigo-300 mb-1.5">
                    Mülakatçının Unvanı
                  </label>
                  <input
                    type="text"
                    value={interviewerTitle}
                    onChange={(e) => setInterviewerTitle(e.target.value)}
                    placeholder="Örn: VP of Engineering, CTO, HR Director"
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-indigo-300 mb-1.5">
                    Departman / Rol
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Örn: Frontend Lead, Product Manager"
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-indigo-300 mb-1.5">
                    Şirket Tipi / Sektör
                  </label>
                  <input
                    type="text"
                    value={companyType}
                    onChange={(e) => setCompanyType(e.target.value)}
                    placeholder="Örn: Fintech Scale-up, Global Kurumsal"
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-indigo-300 mb-1.5">
                    Deneyim Seviyesi
                  </label>
                  <input
                    type="text"
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    placeholder="Örn: Senior, Lead, Manager"
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-indigo-300 mb-1.5">
                    Ek Bağlam / Şirket Kültürü Notları
                  </label>
                  <input
                    type="text"
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder="Örn: Hızlı ölçeklenen bir ekip, mikroservis mimarisi, remote çalışma..."
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={loadingQuestions}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium py-2.5 px-4 rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
                  >
                    {loadingQuestions ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Sorular Üretiliyor...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Soruları Üret</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Questions Result Grid */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                    <span>Mülakatçı Gözünden Olası Sorular</span>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-normal">
                      {interviewerTitle} ({questions.length} Soru)
                    </span>
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">
                    Bu soruları yanıtlayarak canlı koç modunda pratik yapabilir ve puanlama alabilirsiniz.
                  </p>
                </div>
                {questions.length > 0 && (
                  <button
                    onClick={() => setActiveTab("mock")}
                    className="hidden sm:flex items-center space-x-2 text-sm font-medium text-indigo-400 hover:text-indigo-300 bg-indigo-950/60 px-4 py-2 rounded-xl border border-indigo-800/50 transition-colors"
                  >
                    <span>Canlı Koç Moduna Geç</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>

              {loadingQuestions ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 animate-pulse space-y-4">
                      <div className="h-4 bg-slate-800 rounded w-1/3"></div>
                      <div className="h-6 bg-slate-800 rounded w-full"></div>
                      <div className="h-16 bg-slate-800/50 rounded w-full"></div>
                    </div>
                  ))}
                </div>
              ) : questions.length === 0 ? (
                <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-2xl">
                  <HelpCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 font-medium">Henüz soru üretilmedi. Yukarıdaki butona tıklayın.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {questions.map((q, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between group shadow-xl"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                            {q.category}
                          </span>
                          <span className="text-xs text-slate-500 font-mono">#{idx + 1}</span>
                        </div>
                        <h3 className="text-base font-semibold text-white group-hover:text-indigo-200 transition-colors mb-3">
                          "{q.question}"
                        </h3>
                        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 mb-4 text-xs text-slate-300 space-y-1">
                          <p className="font-semibold text-indigo-300 flex items-center space-x-1">
                            <Lightbulb className="w-3.5 h-3.5" />
                            <span>Mülakatçının Niyeti:</span>
                          </p>
                          <p className="text-slate-400 leading-relaxed">{q.interviewerPerspective}</p>
                        </div>

                        <div className="space-y-2 mb-4">
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Aranan Kriterler:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {q.whatTheyLookFor.map((item, i) => (
                              <span key={i} className="text-xs bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded-md">
                                • {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedQuestionIndex(idx);
                          setActiveTab("mock");
                        }}
                        className="w-full mt-4 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white py-2 px-3 rounded-xl text-xs font-medium transition-all flex items-center justify-center space-x-1.5 border border-indigo-500/30"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Bu Soruyu Pratik Yap</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ================= TAB 2: CANLI SORU KOÇU & PRATİK ================= */}
        {activeTab === "mock" && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Left sidebar: Question Navigator */}
            <div className="lg:col-span-1 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-semibold text-white flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>Mülakat Soruları ({questions.length})</span>
                </h3>
                <button
                  onClick={() => setActiveTab("simulator")}
                  className="text-xs text-indigo-400 hover:underline"
                >
                  Yeni Üret
                </button>
              </div>

              {questions.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  Henüz soru yok. Lütfen mülakat simülatöründen soru üretin.
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {questions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedQuestionIndex(idx);
                        setUserAnswer("");
                        setEvaluation(null);
                      }}
                      className={`w-full text-left p-3 rounded-xl text-xs transition-all border ${
                        selectedQuestionIndex === idx
                          ? "bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-600/10"
                          : "bg-slate-950/40 border-slate-800/80 text-slate-300 hover:bg-slate-800/50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-indigo-300">{q.category}</span>
                        <span className="text-slate-500 font-mono">#{idx + 1}</span>
                      </div>
                      <p className="line-clamp-2 font-medium">{q.question}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right main: Practice & Feedback */}
            <div className="lg:col-span-2 space-y-6">
              {selectedQuestionIndex !== null && questions[selectedQuestionIndex] ? (
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
                  {/* Question Banner */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        {questions[selectedQuestionIndex].category}
                      </span>
                      <span className="text-xs text-slate-400">
                        Soru {selectedQuestionIndex + 1} / {questions.length}
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">
                      "{questions[selectedQuestionIndex].question}"
                    </h2>
                    <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2 text-sm text-slate-300">
                      <div className="flex items-center space-x-2 text-indigo-300 font-semibold text-xs uppercase tracking-wider">
                        <Lightbulb className="w-4 h-4" />
                        <span>Mülakatçı Bu Soruda Ne Arıyor?</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">
                        {questions[selectedQuestionIndex].interviewerPerspective}
                      </p>
                      <div className="pt-2">
                        <span className="text-xs font-semibold text-slate-400">STAR Metodu İpucu:</span>
                        <p className="text-slate-300 text-xs italic mt-1 bg-indigo-950/30 p-2.5 rounded-lg border border-indigo-900/40">
                          {questions[selectedQuestionIndex].starTip}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Answer Input Area */}
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-slate-200">
                      Yanıtınızı Yazın (STAR metoduna uygun olarak Situation, Task, Action, Result içermesini öneririz):
                    </label>
                    <textarea
                      rows={6}
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      placeholder="Durum (Situation) neydi? Görevin (Task) neydi? Hangi aksiyonları (Action) aldın? Sonuç (Result) ne oldu?"
                      className="w-full bg-slate-950/90 border border-slate-800 rounded-xl p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                    ></textarea>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        {userAnswer.length} karakter • Yapay zeka ile anlık değerlendirme
                      </span>
                      <button
                        onClick={evaluateAnswer}
                        disabled={evaluating || !userAnswer.trim()}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium py-2.5 px-6 rounded-xl shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition-all disabled:opacity-50"
                      >
                        {evaluating ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Değerlendiriliyor...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            <span>Yanıtı Değerlendir</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Evaluation Result */}
                  {evaluation && (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-slate-950/90 border border-indigo-500/30 rounded-2xl p-6 space-y-6 shadow-2xl"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                        <div>
                          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                            <Award className="w-5 h-5 text-indigo-400" />
                            <span>AI Mülakat Koçu Değerlendirmesi</span>
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5">STAR analizi ve profesyonel geri bildirim</p>
                        </div>
                        <div className="flex items-center space-x-2 bg-indigo-950/80 border border-indigo-500/40 px-4 py-2 rounded-xl">
                          <span className="text-xs text-indigo-300 font-semibold uppercase">Puan:</span>
                          <span className={`text-xl font-black ${evaluation.score >= 80 ? 'text-emerald-400' : evaluation.score >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>
                            {evaluation.score}/100
                          </span>
                        </div>
                      </div>

                      {/* STAR Breakdown */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                          <span className="text-xs font-bold text-indigo-400 uppercase">Situation (Durum):</span>
                          <p className="text-xs text-slate-300 mt-1 leading-relaxed">{evaluation.starAnalysis.situation}</p>
                        </div>
                        <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                          <span className="text-xs font-bold text-indigo-400 uppercase">Task (Görev):</span>
                          <p className="text-xs text-slate-300 mt-1 leading-relaxed">{evaluation.starAnalysis.task}</p>
                        </div>
                        <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                          <span className="text-xs font-bold text-indigo-400 uppercase">Action (Aksiyon):</span>
                          <p className="text-xs text-slate-300 mt-1 leading-relaxed">{evaluation.starAnalysis.action}</p>
                        </div>
                        <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                          <span className="text-xs font-bold text-indigo-400 uppercase">Result (Sonuç):</span>
                          <p className="text-xs text-slate-300 mt-1 leading-relaxed">{evaluation.starAnalysis.result}</p>
                        </div>
                      </div>

                      {/* Strengths & Improvements */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Güçlü Yönler</span>
                          </h4>
                          <ul className="space-y-1.5">
                            {evaluation.strengths.map((s, i) => (
                              <li key={i} className="text-xs text-slate-300 bg-emerald-950/20 border border-emerald-900/30 p-2.5 rounded-lg">
                                • {s}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="space-y-2">
                          <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1">
                            <AlertCircle className="w-4 h-4" />
                            <span>Gelişim Alanları</span>
                          </h4>
                          <ul className="space-y-1.5">
                            {evaluation.improvements.map((imp, i) => (
                              <li key={i} className="text-xs text-slate-300 bg-amber-950/20 border border-amber-900/30 p-2.5 rounded-lg">
                                • {imp}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Model Answer */}
                      <div className="bg-indigo-950/30 border border-indigo-900/50 p-4 rounded-xl space-y-2">
                        <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center space-x-1.5">
                          <Sparkles className="w-4 h-4" />
                          <span>İdeal Örnek Yanıt (Model Answer)</span>
                        </h4>
                        <p className="text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-line">
                          {evaluation.modelAnswer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>
              ) : (
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-12 text-center">
                  <HelpCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-300 font-medium">Lütfen soldaki listeden bir soru seçin.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ================= TAB 3: EĞİTİM & KARİYER GELİŞİM ANALİZİ ================= */}
        {activeTab === "training" && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            <div className="bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-slate-900/60 p-6 sm:p-8 rounded-2xl border border-purple-500/20 shadow-xl">
              <div className="max-w-3xl">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3">
                  Eğitim & Kariyer Gelişim Analizi
                </h1>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  Tamamladığınız eğitimleri, sertifikaları ve katıldığınız kurs içeriklerini aşağıya girin. Yapay zeka, hedeflediğiniz pozisyona göre eksiklerinizi (skill gap) analiz etsin ve bir sonraki adımda almanız gereken eğitimler ile kariyer yol haritasını çıkarsın.
                </p>
              </div>

              <form onSubmit={analyzeTraining} className="mt-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-purple-300 mb-1.5">
                      Hedeflenen Pozisyon / Unvan
                    </label>
                    <input
                      type="text"
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      placeholder="Örn: Principal Engineer, Engineering Director"
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-purple-300 mb-1.5">
                      Kariyer Hedefleri & Vizyon
                    </label>
                    <input
                      type="text"
                      value={careerGoals}
                      onChange={(e) => setCareerGoals(e.target.value)}
                      placeholder="Örn: Global şirketlerde liderlik yapmak, ölçeklenebilir sistemler kurmak..."
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-purple-300 mb-1.5">
                    Tamamlanan Eğitimler, Sertifikalar ve Kurs İçerikleri
                  </label>
                  <textarea
                    rows={4}
                    value={completedTrainings}
                    onChange={(e) => setCompletedTrainings(e.target.value)}
                    placeholder="Aldığınız eğitimlerin listesini ve içerik özetlerini buraya yazın..."
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 leading-relaxed"
                    required
                  ></textarea>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loadingTraining}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium py-2.5 px-6 rounded-xl shadow-lg shadow-purple-600/30 flex items-center space-x-2 transition-all disabled:opacity-50"
                  >
                    {loadingTraining ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Analiz Ediliyor...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Eğitim ve Gelişim Analizi Yap</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Training Analysis Results */}
            {trainingAnalysis && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Assessment & Gaps */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-3">
                    <h3 className="text-base font-bold text-white flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5 text-purple-400" />
                      <span>Mevcut Seviye Değerlendirmesi</span>
                    </h3>
                    <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                      {trainingAnalysis.currentLevelAssessment}
                    </p>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-3">
                    <h3 className="text-base font-bold text-white flex items-center space-x-2">
                      <AlertCircle className="w-5 h-5 text-amber-400" />
                      <span>Tespit Edilen Yetkinlik Boşlukları (Skill Gaps)</span>
                    </h3>
                    <ul className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                      {trainingAnalysis.skillGaps.map((gap, i) => (
                        <li key={i} className="text-xs text-slate-300 flex items-start space-x-2">
                          <span className="text-amber-400 font-bold">•</span>
                          <span>{gap}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Recommended Next Trainings */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                    <BookOpen className="w-5 h-5 text-indigo-400" />
                    <span>Önerilen Sonraki Eğitimler ve Sertifikalar</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {trainingAnalysis.nextTrainingRecommendations.map((rec, i) => (
                      <div key={i} className="bg-slate-950/70 border border-slate-800 hover:border-purple-500/40 rounded-xl p-5 space-y-3 transition-all flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                              {rec.platformOrType}
                            </span>
                            <span className="text-xs text-slate-400 flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>~{rec.estimatedWeeks} Hafta</span>
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-white mb-2">{rec.title}</h4>
                          <p className="text-xs text-slate-300 leading-relaxed">{rec.reason}</p>
                        </div>
                        <div className="pt-3 border-t border-slate-800 text-xs text-indigo-400 font-medium flex items-center space-x-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>Kariyer Hedefine Doğrudan Katkı</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Career Action Plan */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                    <Award className="w-5 h-5 text-emerald-400" />
                    <span>Stratejik Kariyer Eylem Planı</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {trainingAnalysis.careerActionPlan.map((step, i) => (
                      <div key={i} className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-3 relative overflow-hidden">
                        <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl"></div>
                        <div className="flex items-center space-x-2">
                          <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-xs flex items-center justify-center border border-emerald-500/30">
                            0{step.step}
                          </span>
                          <h4 className="text-sm font-bold text-white">{step.title}</h4>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{step.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ================= TAB 4: AI KARİYER ASİSTANI (CHAT) ================= */}
        {activeTab === "coach" && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl flex flex-col h-[700px]"
          >
            {/* Chat Header */}
            <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/40 rounded-t-2xl">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Kıdemli Kariyer & Mülakat Koçu</h2>
                  <p className="text-xs text-slate-400">Maaş pazarlığı, özgeçmiş tavsiyesi veya mülakat taktikleri sorun</p>
                </div>
              </div>
              <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Aktif AI Koç</span>
              </span>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex items-start space-x-3 ${msg.role === "user" ? "flex-row-reverse space-x-reverse" : ""}`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      msg.role === "user"
                        ? "bg-indigo-600 text-white"
                        : "bg-purple-600/20 text-purple-300 border border-purple-500/30"
                    }`}
                  >
                    {msg.role === "user" ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                  </div>
                  <div
                    className={`max-w-[80%] sm:max-w-[70%] p-4 rounded-2xl text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-600/20"
                        : "bg-slate-950 text-slate-200 border border-slate-800 rounded-tl-none shadow-lg"
                    }`}
                  >
                    <div className="whitespace-pre-line">{msg.content}</div>
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="bg-slate-950 p-4 rounded-2xl rounded-tl-none border border-slate-800 text-sm text-slate-400 flex items-center space-x-2">
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    <span className="ml-2">Koç yanıtı hazırlıyor...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <form onSubmit={sendChatMessage} className="p-4 sm:p-6 border-t border-slate-800 bg-slate-950/40 rounded-b-2xl flex items-center space-x-3">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Kariyer koçunuza bir soru sorun (Örn: 'Senior mülakatında maaş pazarlığı nasıl yapılır?')..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={chatLoading || !inputMessage.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-xl transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50 flex items-center justify-center flex-shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </motion.div>
        )}
      </main>
    </div>
  );
}
