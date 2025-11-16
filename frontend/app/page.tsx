'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { ArrowRight, Sparkles, MessageCircle, User, LogOut, Lightbulb, TrendingUp, Zap, Users } from 'lucide-react';

const DEBATE_SUGGESTIONS = [
  "Should AI be regulated by government?",
  "Universal Basic Income: Solution or Problem?",
  "Climate change: Individual vs. Corporate responsibility",
  "Social Media age restrictions necessary?",
  "Remote work: Future of employment?",
  "Cryptocurrency as mainstream currency?",
  "Healthcare: Private vs. Public system",
  "Space exploration funding priorities"
];

export default function HomePage() {
  const { user, signInWithGoogle, signOut } = useAuth();
  const router = useRouter();
  const [topic, setTopic] = useState('');
  const [bridgeMode, setBridgeMode] = useState(true);
  const [perspectiveSwap, setPerspectiveSwap] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0);
  const [participantCount, setParticipantCount] = useState(2);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSuggestionIndex((prev) => (prev + 1) % DEBATE_SUGGESTIONS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateDebate = async () => {
    if (!topic.trim()) {
      alert('Please enter a debate topic');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('http://localhost:8000/api/conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: topic.trim(),
          bridge_mode: bridgeMode,
          perspective_swap: perspectiveSwap,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create conversation');
      }

      const data = await response.json();
      router.push(`/analysis/${data.conversation_id}`);
    } catch (error) {
      console.error('Error creating debate:', error);
      alert('Failed to create debate. Please try again.');
      setIsCreating(false);
    }
  };

  const selectSuggestion = (suggestion: string) => {
    setTopic(suggestion);
    setShowSuggestions(false);
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Multi-layer Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-pink-900/10 via-transparent to-cyan-900/10 animate-pulse" style={{ animationDuration: '8s' }}></div>
        
        {/* Floating Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-float" style={{animationDelay: '4s'}} />        {/* Particles */}
        <div className="particle particle-1"></div>
        <div className="particle particle-2"></div>
        <div className="particle particle-3"></div>
        <div className="particle particle-4"></div>
        <div className="particle particle-5"></div>
        <div className="particle particle-6"></div>
      </div>

      {/* Header */}
      <header className="fixed top-0 w-full z-50 border-b border-white/10 backdrop-blur-xl bg-black/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-4">
              <div className="relative group">
                <img src="/logo.png" alt="DivergentUnity" className="w-10 h-10 animate-breathe" />
                <div className="absolute inset-0 bg-emerald-400/30 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>
              <h1 className="text-3xl font-black tracking-[0.15em]">
                <span className="text-white hover:text-emerald-400 transition-colors duration-300 inline-block">DIVERGENT</span>
                <span className="text-cyan-400 hover:text-white transition-colors duration-300 ml-3 inline-block">UNITY</span>
              </h1>
            </Link>

            <div className="flex items-center gap-4">
              <Link href="/analytics" className="hidden md:block text-sm font-semibold text-gray-400 hover:text-white transition-colors">
                Analytics
              </Link>
              
              {user ? (
                <>
                  <Link 
                    href="/profile"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all backdrop-blur-lg border border-white/10"
                  >
                    <User className="w-4 h-4" />
                    <span className="text-sm font-semibold hidden md:block">{user.displayName || 'Profile'}</span>
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all border border-white/10"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => signInWithGoogle()}
                  className="gradient-border-fast group"
                >
                  <div className="px-6 py-2 bg-black rounded-[10px] font-bold text-sm group-hover:bg-white/5 transition-all">
                    Sign In
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-32 pb-20">
        {/* Hero Section */}
        <div className="text-center mb-16 animate-fade-slide-up">
          <div className="inline-block mb-6">
            <div className="px-6 py-3 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-full border border-white/20 backdrop-blur-lg">
              <p className="text-sm font-bold text-white/90 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                AI-POWERED CONSENSUS BUILDING
              </p>
            </div>
          </div>
          
          <h2 className="text-6xl md:text-7xl font-black mb-6 leading-tight">
            Turn Debate into
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 animate-gradient">
              Understanding
            </span>
          </h2>
          
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Real-time AI analysis finds common ground, reveals biases, and suggests compromises
            <span className="text-white font-bold"> backed by evidence</span>
          </p>
        </div>

        {/* Main Card */}
        <div className="gradient-border animate-scale-up mb-12" style={{ animationDelay: '0.2s' }}>
          <div className="bg-gradient-to-br from-black via-emerald-900/5 to-black rounded-[10px] p-8 md:p-12">
            {/* Topic Input */}
            <div className="mb-8">
              <label className="block text-sm font-bold text-white mb-3 flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                What's the debate topic?
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder={DEBATE_SUGGESTIONS[currentSuggestionIndex]}
                  className="w-full px-6 py-5 bg-white/5 border-2 border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-all text-lg backdrop-blur-lg"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !isCreating) {
                      handleCreateDebate();
                    }
                  }}
                />
                
                {/* AI Suggestion Button */}
                {!topic && (
                  <button
                    onClick={() => setShowSuggestions(!showSuggestions)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 hover:from-purple-500/30 hover:to-blue-500/30 rounded-lg text-sm font-semibold transition-all border border-white/10 flex items-center gap-2"
                  >
                    <Lightbulb className="w-4 h-4" />
                    Suggest
                  </button>
                )}
              </div>
              
              {/* Suggestions Dropdown */}
              {showSuggestions && (
                <div className="mt-3 p-4 bg-white/5 rounded-xl border border-white/10 backdrop-blur-lg animate-slide-up">
                  <p className="text-xs font-bold text-gray-400 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-3 h-3" />
                    TRENDING DEBATE TOPICS
                  </p>
                  <div className="space-y-2">
                    {DEBATE_SUGGESTIONS.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => selectSuggestion(suggestion)}
                        className="w-full text-left px-4 py-3 bg-white/5 hover:bg-white/10 rounded-lg transition-all text-sm border border-white/5 hover:border-white/20 group"
                      >
                        <span className="text-gray-300 group-hover:text-white transition-colors">{suggestion}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Advanced Features - Always On */}
            <div className="mb-8 grid md:grid-cols-2 gap-4">
              <div className="p-5 bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-xl border border-purple-500/20">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <div className="w-5 h-5 rounded bg-purple-500 flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-white mb-1 flex items-center gap-2">
                      Bridge Mode
                      <span className="text-xs px-2 py-0.5 bg-purple-500/20 rounded-full text-purple-300">ACTIVE</span>
                    </h4>
                    <p className="text-sm text-gray-400">
                      AI actively identifies common ground and suggests compromise paths
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-xl border border-blue-500/20">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <div className="w-5 h-5 rounded bg-blue-500 flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-white mb-1 flex items-center gap-2">
                      Perspective Swap
                      <span className="text-xs px-2 py-0.5 bg-blue-500/20 rounded-full text-blue-300">ACTIVE</span>
                    </h4>
                    <p className="text-sm text-gray-400">
                      See arguments from opposing viewpoints with empathy-driven reframing
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Participant Count Selector */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Number of Participants
              </label>
              <div className="flex gap-3">
                {[2, 3, 4].map((count) => (
                  <button
                    key={count}
                    onClick={() => setParticipantCount(count)}
                    className={`flex-1 px-6 py-4 rounded-xl font-bold text-lg transition-all ${
                      participantCount === count
                        ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 text-white shadow-lg shadow-emerald-500/30'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            {/* Create Button - Epic Animated */}
            <button
              onClick={handleCreateDebate}
              disabled={isCreating || !topic.trim()}
              className="group relative w-full disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
            >
              {/* Animated border gradient */}
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 via-cyan-600 to-teal-600 rounded-xl blur-lg opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-gradient-xy"></div>
              
              {/* Main button */}
              <div className="relative px-8 py-6 bg-gradient-to-r from-emerald-600 via-cyan-600 to-teal-600 rounded-xl transition-all duration-300 group-hover:scale-[1.02] disabled:from-gray-700 disabled:to-gray-800">
                {/* Animated shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
                
                {/* Particle effects */}
                <div className="absolute inset-0 overflow-hidden rounded-xl">
                  <div className="absolute w-2 h-2 bg-white/60 rounded-full top-1/4 left-1/4 animate-ping"></div>
                  <div className="absolute w-2 h-2 bg-white/60 rounded-full top-3/4 right-1/4 animate-ping" style={{animationDelay: '0.5s'}}></div>
                  <div className="absolute w-1.5 h-1.5 bg-white/40 rounded-full top-1/2 left-1/2 animate-ping" style={{animationDelay: '0.3s'}}></div>
                </div>
                
                {/* Content */}
                <div className="relative flex items-center justify-center gap-4 font-black text-xl text-white">
                  {isCreating ? (
                    <>
                      <div className="quantum-loader"></div>
                      <span className="animate-pulse">Initializing Debate Chamber...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-7 h-7 animate-spin-slow" />
                      <span className="tracking-wide">Launch AI-Powered Debate</span>
                      <div className="relative">
                        <ArrowRight className="w-7 h-7 group-hover:translate-x-3 transition-all duration-300" />
                        <div className="absolute inset-0 bg-white/30 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-4 gap-6">
          <div className="gradient-border group animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="p-6 bg-black rounded-[10px] h-full hover:bg-white/5 transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <MessageCircle className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="font-bold text-white mb-2">Dual-Pane Chat</h3>
              <p className="text-sm text-gray-400">
                Side-by-side participant views with color-coded arguments
              </p>
            </div>
          </div>

          <div className="gradient-border group animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <div className="p-6 bg-black rounded-[10px] h-full hover:bg-white/5 transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Lightbulb className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="font-bold text-white mb-2">Live AI Insights</h3>
              <p className="text-sm text-gray-400">
                Real-time bias detection and perspective analysis
              </p>
            </div>
          </div>

          <div className="gradient-border group animate-slide-up" style={{ animationDelay: '0.5s' }}>
            <div className="p-6 bg-black rounded-[10px] h-full hover:bg-white/5 transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500/20 to-teal-600/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6 text-teal-400" />
              </div>
              <h3 className="font-bold text-white mb-2">Evidence Aggregator</h3>
              <p className="text-sm text-gray-400">
                Auto-sourced facts and data supporting each viewpoint
              </p>
            </div>
          </div>

          <div className="gradient-border group animate-slide-up" style={{ animationDelay: '0.6s' }}>
            <div className="p-6 bg-black rounded-[10px] h-full hover:bg-white/5 transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="font-bold text-white mb-2">Smart Compromises</h3>
              <p className="text-sm text-gray-400">
                AI-generated solutions honoring all perspectives
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
}
