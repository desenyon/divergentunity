'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { conversationAPI, compromiseAPI, analyticsAPI } from '@/lib/api';
import { 
  Lightbulb, Users, TrendingDown, TrendingUp, Activity, MessageSquare, 
  Home, ArrowLeft, Sparkles, Heart, Brain, CheckCircle, Target, 
  RefreshCw, Download, Share2
} from 'lucide-react';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function SummaryPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id as string;

  const { data: conversation, isLoading: conversationLoading } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => conversationAPI.get(conversationId),
  });

  const { data: timeline } = useQuery({
    queryKey: ['timeline', conversationId],
    queryFn: () => analyticsAPI.getTimeline(conversationId),
  });

  const { data: quality } = useQuery({
    queryKey: ['quality', conversationId],
    queryFn: () => analyticsAPI.getQuality(conversationId),
  });

  const compromiseMutation = useMutation({
    mutationFn: () => compromiseAPI.generate(conversationId),
  });

  const { data: compromise } = compromiseMutation;

  if (conversationLoading || !conversation || !quality) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-8">
          <div className="relative inline-block">
            <div className="w-32 h-32 border-4 border-gray-800 border-t-white rounded-full animate-spin" />
            <Sparkles className="w-12 h-12 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <h2 className="text-3xl font-black text-white">GENERATING SUMMARY</h2>
        </div>
      </div>
    );
  }

  const { consensus_map } = conversation;
  const speakers = Array.from(new Set(conversation.utterances.map((u: any) => u.speaker_name)));

  // Chart data
  const chartData = timeline?.map((point, index) => ({
    index: index + 1,
    tension: Math.round(point.tension_level * 100),
    empathy: Math.round(point.empathy_level * 100),
  })) || [];

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-gray-800/50 backdrop-blur-lg bg-black/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="relative">
                <Sparkles className="w-7 h-7 text-white" />
                <div className="absolute inset-0 bg-white/20 blur-xl rounded-full"></div>
              </div>
              <h1 className="text-xl font-black tracking-tight">
                <span className="text-white">Divergent</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Unity</span>
              </h1>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group">
                <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-all">
                  <Home className="w-5 h-5" />
                </div>
                <span className="font-semibold">New Debate</span>
              </Link>
              <Link 
                href={`/analysis/${conversationId}`}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
              >
                <span className="font-semibold">Back to Analysis</span>
                <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-all">
                  <Brain className="w-5 h-5" />
                </div>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="gradient-border animate-slide-up inline-block">
            <div className="px-8 py-4 bg-black rounded-[10px]">
              <h2 className="text-5xl font-black text-white mb-4 tracking-tight">
                {conversation.topic}
              </h2>
              <div className="flex items-center justify-center gap-8 text-gray-400">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  <span>{conversation.utterances.length} statements</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <span>{speakers.length} participants</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quality Score Hero */}
        <div className="gradient-border animate-slide-up mb-12" style={{animationDelay: '0.1s'}}>
          <div className="p-12 bg-black rounded-[10px]">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-3xl font-black text-white mb-4">DIALOGUE QUALITY</h3>
                <p className="text-xl text-gray-400 mb-6">
                  {quality.overall_quality >= 70 
                    ? 'Exceptional understanding & depth achieved' 
                    : quality.overall_quality >= 50 
                    ? 'Good foundation for continued dialogue' 
                    : 'Room for deeper engagement'}
                </p>
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <div className="text-sm text-gray-400 mb-2">Participation Balance</div>
                    <div className="text-2xl font-bold text-white">{Math.round(quality.participation_balance)}%</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-2">Value Depth</div>
                    <div className="text-2xl font-bold text-white">{Math.round(quality.value_depth)}%</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-2">Constructiveness</div>
                    <div className="text-2xl font-bold text-white">{Math.round(quality.constructive_engagement)}%</div>
                  </div>
                </div>
              </div>
              <div className="relative w-48 h-48">
                <svg className="transform -rotate-90 w-48 h-48">
                  <circle cx="96" cy="96" r="80" stroke="rgba(255,255,255,0.1)" strokeWidth="12" fill="none" />
                  <circle
                    cx="96" cy="96" r="80"
                    stroke="white"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 80}`}
                    strokeDashoffset={`${2 * Math.PI * 80 * (1 - quality.overall_quality / 100)}`}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-6xl font-black text-white">{Math.round(quality.overall_quality)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Chart */}
        {chartData.length > 1 && (
          <div className="gradient-border animate-slide-up mb-12" style={{animationDelay: '0.2s'}}>
            <div className="p-8 bg-black rounded-[10px]">
              <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                <Activity className="w-6 h-6" />
                CONVERSATION DYNAMICS
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    dataKey="index" 
                    stroke="#6b7280"
                    label={{ value: 'Statement #', position: 'insideBottom', offset: -5, fill: '#6b7280' }}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    label={{ value: 'Level (%)', angle: -90, position: 'insideLeft', fill: '#6b7280' }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="tension" 
                    stroke="#ef4444" 
                    strokeWidth={3}
                    dot={{ fill: '#ef4444', r: 4 }}
                    name="Tension"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="empathy" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={{ fill: '#10b981', r: 4 }}
                    name="Empathy"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* AI Compromise Generation */}
        <div className="gradient-border animate-slide-up mb-12" style={{animationDelay: '0.3s'}}>
          <div className="p-8 bg-black rounded-[10px]">
            <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
              <Lightbulb className="w-6 h-6" />
              AI-GENERATED COMPROMISE
            </h3>
            
            {!compromise ? (
              <div className="text-center py-8">
                <button
                  onClick={() => compromiseMutation.mutate()}
                  disabled={compromiseMutation.isPending}
                  className="group relative overflow-hidden px-8 py-4 bg-white text-black font-bold rounded-xl hover:scale-105 transition-transform disabled:opacity-50"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {compromiseMutation.isPending ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Generate Compromise
                      </>
                    )}
                  </span>
                </button>
              </div>
            ) : (
              <div className="space-y-6 animate-slide-up">
                {/* Compromise Text */}
                <div className="p-6 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 rounded-lg border border-white/20">
                  <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-400" />
                    Proposed Compromise
                  </h4>
                  <p className="text-gray-200 leading-relaxed text-lg">
                    {typeof compromise === 'string' 
                      ? compromise 
                      : (compromise as any)?.compromise || (compromise as any)?.text || (compromise as any)?.solution || JSON.stringify(compromise, null, 2)}
                  </p>
                </div>

                {/* Summary if available */}
                {(compromise as any)?.summary && (
                  <div>
                    <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-yellow-400" />
                      Key Insights
                    </h4>
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <p className="text-gray-300">{(compromise as any).summary}</p>
                    </div>
                  </div>
                )}
                
                {/* Regenerate button */}
                <div className="text-center pt-4">
                  <button
                    onClick={() => compromiseMutation.mutate()}
                    disabled={compromiseMutation.isPending}
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all flex items-center gap-2 mx-auto disabled:opacity-50"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Regenerate
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Participants Summary */}
        <div className="gradient-border animate-slide-up mb-12" style={{animationDelay: '0.4s'}}>
          <div className="p-8 bg-black rounded-[10px]">
            <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
              <Users className="w-6 h-6" />
              PARTICIPANT CONTRIBUTIONS
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              {speakers.map((speaker: string, idx: number) => {
                const speakerUtterances = conversation.utterances.filter((u: any) => u.speaker_name === speaker);
                const totalValues = speakerUtterances.reduce((sum: number, u: any) => sum + (u.values?.length || 0), 0);
                
                return (
                  <div key={idx} className="p-6 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xl font-bold text-white">{speaker}</h4>
                      <span className="text-sm text-gray-400">{speakerUtterances.length} statements</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Core values expressed</span>
                        <span className="text-white font-semibold">{totalValues}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Contribution</span>
                        <span className="text-white font-semibold">
                          {Math.round((speakerUtterances.length / conversation.utterances.length) * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-4">
          <Link 
            href={`/analysis/${conversationId}`}
            className="gradient-border p-0.5 group"
          >
            <div className="px-6 py-3 rounded-[10px] bg-black group-hover:bg-gray-900 transition-all flex items-center gap-2">
              <Brain className="w-5 h-5 text-white" />
              <span className="font-semibold text-white">Continue Analyzing</span>
            </div>
          </Link>
          
          <Link 
            href="/product"
            className="gradient-border p-0.5 group"
          >
            <div className="px-6 py-3 rounded-[10px] bg-black group-hover:bg-gray-900 transition-all flex items-center gap-2">
              <Home className="w-5 h-5 text-white" />
              <span className="font-semibold text-white">Start New Debate</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
