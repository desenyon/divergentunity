'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { conversationAPI, analyticsAPI } from '@/lib/api';
import { 
  TrendingUp, TrendingDown, Target, Sparkles, Brain, Heart, 
  AlertTriangle, Eye, BookOpen, Users, ArrowRight, CheckCircle,
  Lightbulb, MessageCircle, Shield, Scale, Zap, Mic, Send, Newspaper,
  ExternalLink, BarChart3, RefreshCw
} from 'lucide-react';
import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';

export default function AnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id as string;
  const [activeTab, setActiveTab] = useState<'chat' | 'biases' | 'common-ground' | 'understanding' | 'evidence'>('chat');
  
  // Live chat state
  const [message, setMessage] = useState('');
  const [speakerName, setSpeakerName] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [lastInsight, setLastInsight] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showNewMessageToast, setShowNewMessageToast] = useState(false);
  const [previousMessageCount, setPreviousMessageCount] = useState(0);
  const recognitionRef = useRef<any>(null);
  const queryClient = useQueryClient();

  // Load saved participant name from localStorage
  useEffect(() => {
    const savedName = localStorage.getItem(`participant_${conversationId}`);
    if (savedName) {
      setSpeakerName(savedName);
    }
  }, [conversationId]);

  // Save participant name to localStorage
  const updateSpeakerName = (name: string) => {
    setSpeakerName(name);
    if (name) {
      localStorage.setItem(`participant_${conversationId}`, name);
    }
  };

  const { data: conversation, isLoading: loadingConv } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => conversationAPI.get(conversationId),
    refetchInterval: 1000, // Poll every 1s for live updates
    refetchOnWindowFocus: true,
  });

  const { data: quality, isLoading: loadingQuality } = useQuery({
    queryKey: ['quality', conversationId],
    queryFn: () => analyticsAPI.getQuality(conversationId),
    refetchInterval: 5000,
  });

  // Detect new messages and show toast
  useEffect(() => {
    if (conversation?.utterances) {
      const currentCount = conversation.utterances.length;
      if (previousMessageCount > 0 && currentCount > previousMessageCount) {
        const latestMessage = conversation.utterances[currentCount - 1];
        if (latestMessage.speaker_name !== speakerName) {
          setShowNewMessageToast(true);
          setTimeout(() => setShowNewMessageToast(false), 3000);
        }
      }
      setPreviousMessageCount(currentCount);
    }
  }, [conversation?.utterances, previousMessageCount, speakerName]);

  // Fetch AI insights
  const { data: biases } = useQuery({
    queryKey: ['biases', conversationId],
    queryFn: async () => {
      const res = await fetch(`http://localhost:8000/api/insights/${conversationId}/biases`);
      return res.json();
    },
    enabled: activeTab === 'biases' && !!conversation,
  });

  const { data: commonGround } = useQuery({
    queryKey: ['common-ground', conversationId],
    queryFn: async () => {
      const res = await fetch(`http://localhost:8000/api/insights/${conversationId}/common-ground`);
      return res.json();
    },
    enabled: activeTab === 'common-ground' && !!conversation,
  });

  const { data: perspectives } = useQuery({
    queryKey: ['perspectives', conversationId],
    queryFn: async () => {
      const res = await fetch(`http://localhost:8000/api/insights/${conversationId}/perspectives`);
      return res.json();
    },
    enabled: activeTab === 'understanding' && !!conversation,
  });

  const { data: evidence } = useQuery({
    queryKey: ['evidence', conversationId],
    queryFn: async () => {
      const res = await fetch(`http://localhost:8000/api/insights/${conversationId}/evidence`);
      return res.json();
    },
    enabled: activeTab === 'evidence' && !!conversation,
  });

  // Add message mutation
  const addMessageMutation = useMutation({
    mutationFn: async ({ text, speaker }: { text: string; speaker: string }) => {
      setIsTyping(false);
      const res = await fetch(`http://localhost:8000/api/conversations/${conversationId}/utterances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          speaker_name: speaker,
          text,
          timestamp: Date.now() / 1000,
        }),
      });
      if (!res.ok) throw new Error('Failed to send message');
      return res.json();
    },
    onSuccess: async (data) => {
      // Force immediate refetch
      await queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
      await queryClient.refetchQueries({ queryKey: ['conversation', conversationId] });
      
      // Get live insight in background
      try {
        const insight = await fetch(`http://localhost:8000/api/insights/${conversationId}/live`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: data.text,
            speaker: data.speaker_name,
          }),
        });
        const insightData = await insight.json();
        setLastInsight(insightData.insight);
      } catch (error) {
        console.error('Failed to get insight:', error);
      }
    },
    onError: (error) => {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Please try again.');
    },
  });

  // Voice recognition setup
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setMessage(prev => prev + ' ' + transcript);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) return;
    
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const sendMessage = () => {
    if (!message.trim() || !speakerName.trim()) return;
    
    addMessageMutation.mutate({
      text: message.trim(),
      speaker: speakerName.trim(),
    });
    
    setMessage('');
  };

  const isLoading = loadingConv || loadingQuality;

  // Memoize participants before any conditional returns
  const uniqueParticipants = useMemo(() => {
    if (!conversation?.utterances) return [];
    const participants = conversation.utterances.map((u: any) => u.speaker_name);
    return Array.from(new Set(participants));
  }, [conversation?.utterances]);

  if (isLoading || !quality || !conversation) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-8">
          <div className="relative inline-block">
            <div className="w-32 h-32 border-4 border-gray-800 border-t-white rounded-full animate-spin" />
            <Sparkles className="w-12 h-12 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-white tracking-wide">
              ANALYZING PERSPECTIVES
            </h2>
            <div className="space-y-2 text-gray-400">
              <p className="animate-pulse">→ Extracting core values...</p>
              <p className="animate-pulse" style={{animationDelay: '0.2s'}}>→ Identifying biases...</p>
              <p className="animate-pulse" style={{animationDelay: '0.4s'}}>→ Mapping common ground...</p>
              <p className="animate-pulse" style={{animationDelay: '0.6s'}}>→ Building understanding...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* New Message Toast */}
      {showNewMessageToast && (
        <div className="fixed top-24 right-6 z-50 animate-slide-left">
          <div className="gradient-border p-0.5">
            <div className="bg-black rounded-[10px] px-6 py-4 flex items-center gap-3">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-white font-semibold">New message received</span>
              <MessageCircle className="w-4 h-4 text-green-400" />
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-gray-800/50 backdrop-blur-lg bg-black/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
              <div className="relative group">
                <img src="/logo.png" alt="DivergentUnity" className="w-10 h-10" />
                <div className="absolute inset-0 bg-emerald-400/30 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>
              <h1 className="text-3xl font-black tracking-[0.15em]">
                <span className="text-white hover:text-emerald-400 transition-colors duration-300 inline-block">DIVERGENT</span>
                <span className="text-cyan-400 hover:text-white transition-colors duration-300 ml-3 inline-block">UNITY</span>
              </h1>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <p className="text-sm text-gray-400">{conversation.topic}</p>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 rounded-full">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-400 font-semibold">Live</span>
                </div>
              </div>
            </div>
            <Link 
              href={`/summary/${conversationId}`}
              className="gradient-border p-0.5 group"
            >
              <div className="px-5 py-2.5 rounded-[10px] bg-black group-hover:bg-gray-900 transition-all flex items-center gap-2">
                <span className="text-sm font-semibold text-white">View Summary</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </div>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Tab Navigation */}
        <div className="flex gap-4 mb-12 overflow-x-auto pb-2">
          <TabButton
            active={activeTab === 'chat'}
            onClick={() => setActiveTab('chat')}
            icon={<MessageCircle className="w-5 h-5" />}
            label="Live Chat"
          />
          <TabButton
            active={activeTab === 'biases'}
            onClick={() => setActiveTab('biases')}
            icon={<AlertTriangle className="w-5 h-5" />}
            label="Biases & Assumptions"
          />
          <TabButton
            active={activeTab === 'common-ground'}
            onClick={() => setActiveTab('common-ground')}
            icon={<Heart className="w-5 h-5" />}
            label="Common Ground"
          />
          <TabButton
            active={activeTab === 'understanding'}
            onClick={() => setActiveTab('understanding')}
            icon={<Brain className="w-5 h-5" />}
            label="Deep Understanding"
          />
          <TabButton
            active={activeTab === 'evidence'}
            onClick={() => setActiveTab('evidence')}
            icon={<Newspaper className="w-5 h-5" />}
            label="Evidence & News"
          />
        </div>

        {/* Content based on active tab */}
        {activeTab === 'chat' && (
          <LiveChatTab 
            conversation={conversation}
            message={message}
            setMessage={setMessage}
            speakerName={speakerName}
            setSpeakerName={updateSpeakerName}
            isRecording={isRecording}
            toggleRecording={toggleRecording}
            sendMessage={sendMessage}
            lastInsight={lastInsight}
            uniqueParticipants={uniqueParticipants}
            isLoading={addMessageMutation.isPending}
            isTyping={isTyping}
            setIsTyping={setIsTyping}
          />
        )}
        {activeTab === 'biases' && (
          <BiasesTab conversation={conversation} participants={uniqueParticipants} biasesData={biases} />
        )}
        {activeTab === 'common-ground' && (
          <CommonGroundTab conversation={conversation} participants={uniqueParticipants} commonGroundData={commonGround} />
        )}
        {activeTab === 'understanding' && (
          <UnderstandingTab conversation={conversation} participants={uniqueParticipants} perspectivesData={perspectives} />
        )}
        {activeTab === 'evidence' && (
          <EvidenceTab conversation={conversation} participants={uniqueParticipants} evidenceData={evidence} />
        )}
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, description }: { title: string; value: number; icon: React.ReactNode; description: string }) {
  return (
    <div className="gradient-border-slow animate-slide-up">
      <div className="p-6 bg-black rounded-[10px]">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-2 rounded-lg ${value >= 70 ? 'bg-green-500/20 text-green-400' : value >= 50 ? 'bg-white/10 text-white' : 'bg-yellow-500/20 text-yellow-400'}`}>
            {icon}
          </div>
          <span className="text-2xl font-bold text-white">
            {Math.round(value)}%
          </span>
        </div>
        <h3 className="text-sm font-semibold text-white mb-1">{title}</h3>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
        active
          ? 'bg-white text-black'
          : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function LiveChatTab({ conversation, message, setMessage, speakerName, setSpeakerName, isRecording, toggleRecording, sendMessage, lastInsight, uniqueParticipants, isLoading, isTyping, setIsTyping }: any) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const participantRefs = useRef<{[key: string]: HTMLDivElement | null}>({});

  // Memoize participant messages to prevent recalculation
  const participantMessagesMap = useMemo(() => {
    const map: {[key: string]: any[]} = {};
    uniqueParticipants.forEach((participant: string) => {
      map[participant] = conversation.utterances.filter((u: any) => u.speaker_name === participant);
    });
    return map;
  }, [conversation.utterances, uniqueParticipants]);

  // Memoize judge alerts
  const judgeAlerts = useMemo(() => {
    const alerts: any[] = [];
    conversation.utterances.forEach((utt: any, index: number) => {
      if (utt.judge_analysis?.has_issues && utt.judge_analysis.severity !== 'none') {
        alerts.push({
          speaker: utt.speaker_name,
          severity: utt.judge_analysis.severity,
          analysis: utt.judge_analysis,
          index: index
        });
      }
    });
    return alerts.slice(-3); // Only show last 3 alerts
  }, [conversation.utterances]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    Object.entries(participantRefs.current).forEach(([participant, ref]) => {
      if (ref) {
        ref.scrollTop = ref.scrollHeight;
      }
    });
  }, [conversation.utterances.length]);

  // Focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Typing indicator
  useEffect(() => {
    setIsTyping(message.trim().length > 0);
  }, [message, setIsTyping]);

  // Participant color mapping
  const getParticipantColor = (index: number) => {
    const colors = [
      { border: 'border-cyan-500/50', bg: 'bg-cyan-500/10', text: 'text-cyan-400', avatar: 'bg-cyan-500' },
      { border: 'border-emerald-500/50', bg: 'bg-emerald-500/10', text: 'text-emerald-400', avatar: 'bg-emerald-500' },
      { border: 'border-teal-500/50', bg: 'bg-teal-500/10', text: 'text-teal-400', avatar: 'bg-teal-500' },
      { border: 'border-blue-500/50', bg: 'bg-blue-500/10', text: 'text-blue-400', avatar: 'bg-blue-500' },
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="space-y-6">
      {/* AI Judge Alert Banner */}
      {judgeAlerts.length > 0 && (
        <div className="gradient-border animate-slide-up">
          <div className="p-6 bg-black rounded-[10px]">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50">
                <Shield className="w-6 h-6 text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-black text-white mb-2 flex items-center gap-2">
                  AI JUDGE ALERTS
                  <span className="px-3 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">
                    {judgeAlerts.length} issue{judgeAlerts.length !== 1 ? 's' : ''} detected
                  </span>
                </h3>
                <div className="space-y-3 max-h-[200px] overflow-y-auto">
                  {judgeAlerts.slice(-3).map((alert: any, idx: number) => (
                    <div 
                      key={idx}
                      className={`p-4 rounded-lg border ${
                        alert.severity === 'high' ? 'bg-red-500/10 border-red-500/30' :
                        alert.severity === 'medium' ? 'bg-yellow-500/10 border-yellow-500/30' :
                        'bg-blue-500/10 border-blue-500/30'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold text-white">{alert.speaker}</span>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          alert.severity === 'high' ? 'bg-red-500/20 text-red-400' :
                          alert.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {alert.severity.toUpperCase()}
                        </span>
                      </div>
                      {alert.analysis.bias_issues?.length > 0 && (
                        <div className="mb-2">
                          <div className="text-xs text-red-400 font-semibold mb-1">⚠️ Bias:</div>
                          <div className="text-sm text-gray-300">{alert.analysis.bias_issues[0].explanation}</div>
                        </div>
                      )}
                      {alert.analysis.factual_issues?.length > 0 && (
                        <div className="mb-2">
                          <div className="text-xs text-yellow-400 font-semibold mb-1">📊 Fact Check:</div>
                          <div className="text-sm text-gray-300">{alert.analysis.factual_issues[0].problem}</div>
                        </div>
                      )}
                      {alert.analysis.civility_issues?.length > 0 && (
                        <div className="mb-2">
                          <div className="text-xs text-blue-400 font-semibold mb-1">🤝 Civility:</div>
                          <div className="text-sm text-gray-300">{alert.analysis.civility_issues[0].problem}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Bar */}
      <div className="flex gap-4 items-center justify-between px-6 py-4 bg-black/50 rounded-lg border border-white/10">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-semibold text-white">
            {uniqueParticipants.length} participant{uniqueParticipants.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="text-gray-600">•</div>
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-cyan-400" />
          <span className="text-sm font-semibold text-white">
            {conversation.utterances.length} message{conversation.utterances.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="text-gray-600">•</div>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-red-400" />
          <span className="text-sm font-semibold text-white">
            {judgeAlerts.length} alert{judgeAlerts.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Multi-Pane Debate View */}
      {uniqueParticipants.length === 0 ? (
        <div className="gradient-border animate-slide-up">
          <div className="bg-black rounded-[10px] p-20 text-center">
            <MessageCircle className="w-16 h-16 text-gray-600 mx-auto mb-4 animate-pulse" />
            <p className="text-gray-400 mb-2 text-xl">No participants yet</p>
            <p className="text-sm text-gray-500">Enter your name below to start the debate!</p>
          </div>
        </div>
      ) : (
        <div className={`grid gap-6 ${
          uniqueParticipants.length === 2 ? 'md:grid-cols-2' :
          uniqueParticipants.length === 3 ? 'md:grid-cols-3' :
          'md:grid-cols-2 lg:grid-cols-4'
        }`}>
          {uniqueParticipants.map((participant: string, pIdx: number) => {
            const participantMessages = participantMessagesMap[participant] || [];
            const colors = getParticipantColor(pIdx);
            
            return (
              <div key={participant} className="gradient-border animate-slide-up" style={{animationDelay: `${pIdx * 100}ms`}}>
                <div className="bg-black rounded-[10px] p-6 flex flex-col" style={{height: '650px'}}>
                  {/* Participant Header */}
                  <div className={`flex items-center gap-3 pb-4 mb-4 border-b-2 ${colors.border}`}>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-lg ${colors.avatar}`}>
                      {participant.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-black text-white">{participant}</h3>
                      <p className="text-xs text-gray-400">{participantMessages.length} messages</p>
                    </div>
                  </div>

                  {/* Messages Container */}
                  <div 
                    ref={el => { participantRefs.current[participant] = el; }}
                    className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
                    style={{minHeight: 0}}
                  >
                    {participantMessages.length === 0 ? (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-gray-500 text-sm">Waiting for messages...</p>
                      </div>
                    ) : (
                      participantMessages.map((utt: any, idx: number) => (
                        <div key={utt.utterance_id || idx} className="space-y-2">
                          {/* Message Bubble */}
                          <div className={`p-4 rounded-lg border ${colors.border} ${colors.bg} transition-all hover:brightness-110`}>
                            <p className="text-white text-sm leading-relaxed whitespace-pre-wrap break-words">
                              {utt.text}
                            </p>
                            {utt.judge_analysis?.has_issues && (
                              <div className="mt-2 flex items-center gap-2">
                                <Shield className={`w-3 h-3 ${
                                  utt.judge_analysis.severity === 'high' ? 'text-red-400' :
                                  utt.judge_analysis.severity === 'medium' ? 'text-yellow-400' :
                                  'text-blue-400'
                                }`} />
                                <span className={`text-xs font-semibold ${
                                  utt.judge_analysis.severity === 'high' ? 'text-red-400' :
                                  utt.judge_analysis.severity === 'medium' ? 'text-yellow-400' :
                                  'text-blue-400'
                                }`}>
                                  AI Judge Alert
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Judge Analysis Details */}
                          {utt.judge_analysis?.has_issues && (
                            <div className={`ml-4 p-3 rounded-lg text-xs space-y-2 ${
                              utt.judge_analysis.severity === 'high' ? 'bg-red-500/10 border border-red-500/30' :
                              utt.judge_analysis.severity === 'medium' ? 'bg-yellow-500/10 border border-yellow-500/30' :
                              'bg-blue-500/10 border border-blue-500/30'
                            }`}>
                              {utt.judge_analysis.bias_issues?.length > 0 && (
                                <div>
                                  <div className="font-semibold text-red-400 mb-1">⚠️ Bias:</div>
                                  <div className="text-gray-300">{utt.judge_analysis.bias_issues[0].explanation}</div>
                                  {utt.judge_analysis.bias_issues[0].better_approach && (
                                    <div className="text-emerald-400 mt-1">💡 {utt.judge_analysis.bias_issues[0].better_approach}</div>
                                  )}
                                </div>
                              )}
                              {utt.judge_analysis.factual_issues?.length > 0 && (
                                <div>
                                  <div className="font-semibold text-yellow-400 mb-1">📊 Fact Check:</div>
                                  <div className="text-gray-300">{utt.judge_analysis.factual_issues[0].problem}</div>
                                  {utt.judge_analysis.factual_issues[0].correction && (
                                    <div className="text-emerald-400 mt-1">✓ {utt.judge_analysis.factual_issues[0].correction}</div>
                                  )}
                                </div>
                              )}
                              {utt.judge_analysis.civility_issues?.length > 0 && (
                                <div>
                                  <div className="font-semibold text-blue-400 mb-1">🤝 Civility:</div>
                                  <div className="text-gray-300">{utt.judge_analysis.civility_issues[0].problem}</div>
                                  {utt.judge_analysis.civility_issues[0].reframe && (
                                    <div className="text-emerald-400 mt-1">💬 {utt.judge_analysis.civility_issues[0].reframe}</div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    )}

                    {/* Typing Indicator */}
                    {isTyping && speakerName === participant && (
                      <div className={`p-4 rounded-lg border ${colors.border} ${colors.bg} opacity-60`}>
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Input Area */}
      <div className="gradient-border">
        <div className="bg-black rounded-[10px] p-6">
          <div className="space-y-4">
            {/* Quick Participant Selection */}
            {uniqueParticipants.length > 0 ? (
              <div className="space-y-3">
                <div className="flex gap-2 flex-wrap">
                  <span className="text-sm text-gray-400 py-3">Speaking as:</span>
                  {uniqueParticipants.map((p: string, idx: number) => {
                    const colors = getParticipantColor(idx);
                    return (
                      <button
                        key={p}
                        onClick={() => setSpeakerName(p)}
                        className={`px-6 py-3 rounded-lg font-bold transition-all border-2 ${
                          speakerName === p
                            ? `${colors.border} ${colors.bg} ${colors.text}`
                            : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border-white/10'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setSpeakerName('')}
                    className="px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all border border-white/10 text-sm"
                  >
                    + New
                  </button>
                </div>
                
                {/* Name Input - Show when "+ New" is clicked */}
                {speakerName === '' && uniqueParticipants.length > 0 && (
                  <div>
                    <input
                      type="text"
                      value={speakerName}
                      onChange={(e) => setSpeakerName(e.target.value)}
                      placeholder="Enter your name (e.g., Alex, Jordan)"
                      autoFocus
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                  </div>
                )}
              </div>
            ) : (
              /* Show name input for first participant */
              <div className="mb-3">
                <label className="text-sm text-gray-400 mb-2 block">Enter your name to start:</label>
                <input
                  type="text"
                  value={speakerName}
                  onChange={(e) => setSpeakerName(e.target.value)}
                  placeholder="Your name (e.g., Alex, Jordan)"
                  autoFocus
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>
            )}
            
            <div className="flex gap-2">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Type your perspective... (Press Enter to send, Shift+Enter for new line)"
                rows={3}
                className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/30 focus:ring-2 focus:ring-white/20 transition-all resize-none"
              />
              
              <div className="flex flex-col gap-2">
                <button
                  onClick={toggleRecording}
                  className={`p-3 rounded-lg transition-all ${
                    isRecording 
                      ? 'bg-red-500 animate-pulse' 
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  <Mic className="w-6 h-6 text-white" />
                </button>
                
                <button
                  onClick={sendMessage}
                  disabled={!message.trim() || !speakerName.trim() || isLoading}
                  className="p-3 rounded-lg bg-white text-black hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                >
                  {isLoading ? (
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  ) : (
                    <Send className="w-6 h-6" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{uniqueParticipants.length} {uniqueParticipants.length === 1 ? 'participant' : 'participants'}</span>
              </div>
              <span className="text-xs">
                {speakerName ? `Speaking as: ${speakerName}` : 'Enter your name to join'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OverviewTab({ quality, conversation, participants }: any) {
  return (
    <div className="space-y-8">
      {/* Quality Score Hero */}
      <div className="gradient-border animate-slide-up">
        <div className="p-12 bg-black rounded-[10px] text-center">
          <div className="inline-block mb-6">
            <div className="relative w-40 h-40">
              <svg className="transform -rotate-90 w-40 h-40">
                <circle cx="80" cy="80" r="70" stroke="rgba(255,255,255,0.1)" strokeWidth="10" fill="none" />
                <circle
                  cx="80" cy="80" r="70"
                  stroke="white"
                  strokeWidth="10"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 70}`}
                  strokeDashoffset={`${2 * Math.PI * 70 * (1 - quality.overall_quality / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-5xl font-black text-white">{Math.round(quality.overall_quality)}</span>
              </div>
            </div>
          </div>
          <h2 className="text-4xl font-black text-white mb-2">DIALOGUE QUALITY</h2>
          <p className="text-xl text-gray-400">
            {quality.overall_quality >= 70 ? 'Exceptional understanding & depth' : quality.overall_quality >= 50 ? 'Good foundation for dialogue' : 'Room for deeper engagement'}
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        <MetricCard title="Participation Balance" value={quality.participation_balance} icon={<Target className="w-6 h-6" />} description="How evenly all voices were heard" />
        <MetricCard title="Value Depth" value={quality.value_depth} icon={<Sparkles className="w-6 h-6" />} description="Richness of principles expressed" />
        <MetricCard title="Constructive Tone" value={quality.constructive_engagement} icon={quality.constructive_engagement >= 50 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />} description="Level of productive exchange" />
      </div>

      {/* Participants Overview */}
      <div className="gradient-border animate-slide-up" style={{animationDelay: '0.2s'}}>
        <div className="p-8 bg-black rounded-[10px]">
          <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
            <Users className="w-6 h-6" />
            PARTICIPANTS
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {participants.map((name: string, idx: number) => {
              const utterances = conversation.utterances.filter((u: any) => u.speaker_name === name);
              const totalValues = utterances.reduce((sum: number, u: any) => sum + (u.values?.length || 0), 0);
              return (
                <div key={idx} className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-white">{name}</span>
                    <span className="text-sm text-gray-400">{utterances.length} statement{utterances.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="text-sm text-gray-400">
                    {totalValues} core values identified
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function BiasesTab({ conversation, participants, biasesData }: any) {
  if (!biasesData) {
    return (
      <div className="gradient-border">
        <div className="p-12 bg-black rounded-[10px] text-center">
          <Brain className="w-16 h-16 text-gray-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-400">Analyzing cognitive patterns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="gradient-border animate-slide-up">
        <div className="p-8 bg-black rounded-[10px]">
          <h2 className="text-3xl font-black text-white mb-4 flex items-center gap-3">
            <AlertTriangle className="w-7 h-7" />
            COGNITIVE BIASES DETECTED
          </h2>
          <p className="text-gray-400 mb-8">Based on actual statements in this debate.</p>
          
          {biasesData.speaker_analyses?.map((speakerAnalysis: any, idx: number) => (
            <div key={idx} className="mb-8 last:mb-0">
              <h3 className="text-2xl font-bold text-white mb-6">{speakerAnalysis.speaker}</h3>
              
              {/* Biases Section */}
              {speakerAnalysis.biases && speakerAnalysis.biases.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-bold text-red-400 mb-4">⚠️ Cognitive Biases</h4>
                  <div className="space-y-4">
                    {speakerAnalysis.biases.map((bias: any, bidx: number) => (
                      <div key={bidx} className="p-6 bg-white/5 rounded-lg border border-red-500/30">
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-red-500/20 rounded-lg shrink-0">
                            <AlertTriangle className="w-6 h-6 text-red-400" />
                          </div>
                          <div className="flex-1">
                            <h5 className="text-lg font-bold text-white mb-2">{bias.type}</h5>
                            {bias.direct_quote && (
                              <div className="mb-3 p-3 bg-black/50 rounded border-l-4 border-red-500">
                                <p className="text-sm text-gray-300 italic">"{bias.direct_quote}"</p>
                              </div>
                            )}
                            <p className="text-gray-400 mb-2"><span className="font-semibold text-gray-300">Evidence:</span> {bias.evidence}</p>
                            <p className="text-gray-400"><span className="font-semibold text-gray-300">Why it matters:</span> {bias.explanation}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Assumptions Section */}
              {speakerAnalysis.assumptions && speakerAnalysis.assumptions.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-bold text-yellow-400 mb-4">💭 Assumptions</h4>
                  <div className="space-y-3">
                    {speakerAnalysis.assumptions.map((assumption: any, aidx: number) => (
                      <div key={aidx} className="p-4 bg-white/5 rounded-lg border border-yellow-500/30">
                        <p className="text-white font-semibold mb-1">{assumption.assumption}</p>
                        <p className="text-sm text-gray-400">Based on: {assumption.based_on}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Blind Spots Section */}
              {speakerAnalysis.blind_spots && speakerAnalysis.blind_spots.length > 0 && (
                <div>
                  <h4 className="text-lg font-bold text-blue-400 mb-4">👁️ Blind Spots</h4>
                  <div className="space-y-3">
                    {speakerAnalysis.blind_spots.map((spot: any, sidx: number) => (
                      <div key={sidx} className="p-4 bg-white/5 rounded-lg border border-blue-500/30">
                        <p className="text-white font-semibold mb-2">Missing: {spot.blind_spot}</p>
                        {spot.other_speaker_covers && (
                          <div className="mt-2 p-3 bg-emerald-500/10 rounded border-l-4 border-emerald-500">
                            <p className="text-sm text-gray-300">
                              <span className="font-bold text-emerald-400">Other perspective: </span>
                              {spot.other_speaker_covers}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CommonGroundTab({ conversation, participants, commonGroundData }: any) {
  if (!commonGroundData) {
    return (
      <div className="gradient-border">
        <div className="p-12 bg-black rounded-[10px] text-center">
          <Heart className="w-16 h-16 text-gray-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-400">Finding shared values...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <div className="gradient-border animate-slide-up">
        <div className="p-8 bg-black rounded-[10px]">
          <h2 className="text-3xl font-black text-white mb-4 flex items-center gap-3">
            <Heart className="w-7 h-7" />
            SHARED VALUES
          </h2>
          <p className="text-gray-400 mb-8">What both sides actually care about.</p>
          
          <div className="space-y-6">
            {commonGroundData.shared_values?.map((value: any, idx: number) => (
              <div key={idx} className="p-6 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-white text-xl">{value.value}</h3>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-24 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-400 rounded-full" 
                        style={{width: `${value.strength * 100}%`}}
                      />
                    </div>
                    <span className="text-sm font-bold text-white">{Math.round(value.strength * 100)}%</span>
                  </div>
                </div>
                
                <div className="space-y-4 mb-4">
                  {Object.entries(value.speaker_quotes || {}).map(([speaker, quote]: [string, any]) => (
                    <div key={speaker} className="p-3 bg-black/50 rounded border-l-4 border-blue-500">
                      <p className="text-sm font-bold text-white mb-1">{speaker}</p>
                      <p className="text-gray-300 italic">"{quote}"</p>
                    </div>
                  ))}
                </div>
                
                <p className="text-gray-400">{value.analysis}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Agreement Areas */}
      <div className="gradient-border animate-slide-up" style={{animationDelay: '0.2s'}}>
        <div className="p-8 bg-black rounded-[10px]">
          <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
            <CheckCircle className="w-6 h-6" />
            AREAS OF AGREEMENT
          </h3>
          <div className="space-y-4">
            {commonGroundData.agreements?.map((agreement: any, idx: number) => (
              <div key={idx} className="p-6 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-white">{agreement.area}</h4>
                  <span className="text-sm font-bold text-green-400">{Math.round(agreement.strength * 100)}%</span>
                </div>
                <div className="space-y-2 mb-3">
                  <div className="p-2 bg-black/50 rounded text-sm text-gray-300">
                    <span className="text-white">→ </span>"{agreement.quote1}"
                  </div>
                  <div className="p-2 bg-black/50 rounded text-sm text-gray-300">
                    <span className="text-white">→ </span>"{agreement.quote2}"
                  </div>
                </div>
                <p className="text-gray-400 text-sm">{agreement.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Compatible Goals */}
      {commonGroundData.compatible_goals && commonGroundData.compatible_goals.length > 0 && (
        <div className="gradient-border animate-slide-up" style={{animationDelay: '0.4s'}}>
          <div className="p-8 bg-black rounded-[10px]">
            <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
              <Target className="w-6 h-6" />
              COMPATIBLE GOALS
            </h3>
            <div className="space-y-3">
              {commonGroundData.compatible_goals.map((goal: any, idx: number) => (
                <div key={idx} className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <h4 className="font-bold text-white mb-2">{goal.goal}</h4>
                  <p className="text-gray-400 text-sm">{goal.evidence}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UnderstandingTab({ conversation, participants, perspectivesData }: any) {
  if (!perspectivesData) {
    return (
      <div className="gradient-border">
        <div className="p-12 bg-black rounded-[10px] text-center">
          <Brain className="w-16 h-16 text-gray-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-400">Understanding perspectives...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="gradient-border animate-slide-up">
        <div className="p-8 bg-black rounded-[10px]">
          <h2 className="text-3xl font-black text-white mb-4 flex items-center gap-3">
            <Brain className="w-7 h-7" />
            DEEP PERSPECTIVE ANALYSIS
          </h2>
          <p className="text-gray-400 mb-8">Understanding what drives each viewpoint.</p>
        </div>
      </div>

      {/* Deep Dive per Participant */}
      {perspectivesData.perspectives?.map((perspective: any, idx: number) => (
        <div key={idx} className="gradient-border-slow animate-slide-up" style={{animationDelay: `${idx * 0.1}s`}}>
          <div className="p-8 bg-black rounded-[10px]">
            <h3 className="text-2xl font-bold text-white mb-6">{perspective.speaker}'s Worldview</h3>
            
            {/* Key Quotes */}
            {perspective.key_quotes && perspective.key_quotes.length > 0 && (
              <div className="mb-8">
                <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Key Statements
                </h4>
                <div className="space-y-2">
                  {perspective.key_quotes.map((quote: string, qidx: number) => (
                    <div key={qidx} className="p-3 bg-white/5 rounded border-l-4 border-purple-500">
                      <p className="text-gray-300 italic">"{quote}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Worldview */}
            <div className="mb-8">
              <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Their Worldview
              </h4>
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-gray-300">{perspective.worldview}</p>
              </div>
            </div>

            {/* Core Fears */}
            {perspective.core_fears && perspective.core_fears.length > 0 && (
              <div className="mb-8">
                <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  What They Fear
                </h4>
                <div className="space-y-3">
                  {perspective.core_fears.map((fear: any, fidx: number) => (
                    <div key={fidx} className="p-4 bg-red-500/10 rounded-lg border border-red-500/30">
                      <h5 className="font-bold text-white mb-2">{fear.fear}</h5>
                      <p className="text-sm text-gray-400">Evidence: {fear.evidence_in_text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* What They're Protecting */}
            {perspective.protecting && (
              <div className="mb-8">
                <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  What They're Protecting
                </h4>
                <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
                  <h5 className="font-bold text-white mb-2">{perspective.protecting.what}</h5>
                  <p className="text-gray-400">{perspective.protecting.why_it_matters}</p>
                </div>
              </div>
            )}

            {/* Likely Experiences */}
            {perspective.likely_experiences && (
              <div className="mb-8">
                <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Likely Background
                </h4>
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-gray-300">{perspective.likely_experiences}</p>
                </div>
              </div>
            )}

            {/* How to Connect */}
            {perspective.how_other_can_connect && perspective.how_other_can_connect.length > 0 && (
              <div>
                <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  How Others Can Connect
                </h4>
                <div className="space-y-3">
                  {perspective.how_other_can_connect.map((strategy: any, sidx: number) => (
                    <div key={sidx} className="p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                      <h5 className="font-bold text-white mb-2">{strategy.strategy}</h5>
                      <p className="text-sm text-gray-400 mb-2">Addresses: {strategy.addresses}</p>
                      {strategy.example_language && (
                        <div className="mt-2 p-2 bg-black/50 rounded">
                          <p className="text-sm text-gray-300 italic">Try saying: "{strategy.example_language}"</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function AgreementItem({ text, strength }: { text: string; strength: number }) {
  return (
    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
      <div className="flex items-center justify-between mb-2">
        <span className="text-white">{text}</span>
        <span className="text-sm font-bold text-white">{strength}%</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full bg-white rounded-full transition-all duration-1000" style={{width: `${strength}%`}}></div>
      </div>
    </div>
  );
}

function MotivationItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
      <Zap className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
      <span className="text-gray-400">{text}</span>
    </div>
  );
}

function BridgeItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
      <ArrowRight className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
      <span className="text-gray-400 text-sm">{text}</span>
    </div>
  );
}

function EvidenceTab({ conversation, participants, evidenceData }: any) {
  if (!evidenceData) {
    return (
      <div className="gradient-border">
        <div className="p-12 bg-black rounded-[10px] text-center">
          <Newspaper className="w-16 h-16 text-gray-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-400">Aggregating evidence from news and research...</p>
        </div>
      </div>
    );
  }

  const { evidence_by_speaker, neutral_context } = evidenceData;

  return (
    <div className="space-y-8">
      {/* Neutral Context */}
      {neutral_context && (
        <div className="gradient-border animate-slide-up">
          <div className="p-8 bg-black rounded-[10px]">
            <h2 className="text-3xl font-black text-white mb-4 flex items-center gap-3">
              <BarChart3 className="w-7 h-7" />
              CONTEXT & BACKGROUND
            </h2>
            <p className="text-gray-300 mb-6 text-lg">{neutral_context.background}</p>
            
            {neutral_context.key_facts && neutral_context.key_facts.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-bold text-gray-400 mb-3">KEY FACTS</h4>
                <div className="grid md:grid-cols-2 gap-3">
                  {neutral_context.key_facts.map((fact: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 p-3 bg-white/5 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-300">{fact}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {neutral_context.recent_developments && neutral_context.recent_developments.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-gray-400 mb-3">RECENT DEVELOPMENTS</h4>
                <div className="space-y-2">
                  {neutral_context.recent_developments.map((dev: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 p-3 bg-blue-500/5 rounded-lg border border-blue-500/20">
                      <TrendingUp className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-300">{dev}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Evidence by Speaker */}
      {Object.entries(evidence_by_speaker).map(([speaker, data]: [string, any], idx: number) => (
        <div key={speaker} className="gradient-border animate-slide-up" style={{ animationDelay: `${idx * 0.1}s` }}>
          <div className="p-8 bg-black rounded-[10px]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center font-bold text-xl">
                {speaker.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-2xl font-black text-white">{speaker}'s Evidence</h3>
                <p className="text-sm text-gray-400">Supporting research and counter-perspectives</p>
              </div>
            </div>

            {/* Claims */}
            {data.claims && data.claims.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  KEY CLAIMS
                </h4>
                <div className="space-y-2">
                  {data.claims.map((claim: string, cidx: number) => (
                    <div key={cidx} className="p-3 bg-white/5 rounded-lg border-l-4 border-purple-500">
                      <p className="text-gray-300">{claim}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Supporting Evidence */}
            {data.supporting_evidence && data.supporting_evidence.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  SUPPORTING EVIDENCE
                </h4>
                <div className="space-y-3">
                  {data.supporting_evidence.map((evidence: any, eidx: number) => (
                    <div key={eidx} className="p-4 bg-gradient-to-br from-green-500/5 to-green-500/0 rounded-lg border border-green-500/20">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                            evidence.type === 'statistic' ? 'bg-blue-500/20 text-blue-300' :
                            evidence.type === 'news' ? 'bg-purple-500/20 text-purple-300' :
                            evidence.type === 'study' ? 'bg-green-500/20 text-green-300' :
                            'bg-orange-500/20 text-orange-300'
                          }`}>
                            {evidence.type.toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-400">{evidence.source}</span>
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-500" />
                      </div>
                      <h5 className="font-bold text-white mb-2">{evidence.headline}</h5>
                      <p className="text-sm text-gray-300 mb-2">{evidence.summary}</p>
                      <p className="text-xs text-gray-400 italic">↳ {evidence.relevance}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Counter Evidence */}
            {data.counter_evidence && data.counter_evidence.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-400" />
                  COUNTER-EVIDENCE TO CONSIDER
                </h4>
                <div className="space-y-3">
                  {data.counter_evidence.map((evidence: any, ceidx: number) => (
                    <div key={ceidx} className="p-4 bg-gradient-to-br from-orange-500/5 to-orange-500/0 rounded-lg border border-orange-500/20">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                            evidence.type === 'statistic' ? 'bg-blue-500/20 text-blue-300' :
                            evidence.type === 'news' ? 'bg-purple-500/20 text-purple-300' :
                            evidence.type === 'study' ? 'bg-green-500/20 text-green-300' :
                            'bg-orange-500/20 text-orange-300'
                          }`}>
                            {evidence.type.toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-400">{evidence.source}</span>
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-500" />
                      </div>
                      <h5 className="font-bold text-white mb-2">{evidence.headline}</h5>
                      <p className="text-sm text-gray-300 mb-2">{evidence.summary}</p>
                      <p className="text-xs text-gray-400 italic">↳ {evidence.relevance}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
