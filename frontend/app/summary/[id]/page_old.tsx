'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { conversationAPI, compromiseAPI, analyticsAPI } from '@/lib/api';
import { 
  Lightbulb, Users, TrendingDown, TrendingUp, 
  Activity, MessageSquare, Home, ArrowLeft 
} from 'lucide-react';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function SummaryPage() {
  const params = useParams();
  const conversationId = params.id as string;

  const { data: conversation, isLoading: conversationLoading } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => conversationAPI.get(conversationId),
  });

  const { data: timeline } = useQuery({
    queryKey: ['timeline', conversationId],
    queryFn: () => analyticsAPI.getTimeline(conversationId),
  });

  const compromiseMutation = useMutation({
    mutationFn: () => compromiseAPI.generate(conversationId),
  });

  const { data: compromise } = compromiseMutation;

  if (conversationLoading || !conversation) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading conversation...</p>
        </div>
      </div>
    );
  }

  const { consensus_map } = conversation;
  const speakers = Object.keys(consensus_map.participant_positions);

  // Prepare timeline data for chart
  const chartData = timeline?.map((point, index) => ({
    index,
    tension: point.tension_level * 100,
    empathy: point.empathy_level * 100,
  })) || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span>New Discussion</span>
          </Link>
          <h1 className="text-xl font-bold text-white">DivergentUnity</h1>
          <Link href="/analytics" className="text-gray-400 hover:text-white transition-colors">
            Analytics
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Topic */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-2">
            {conversation.topic}
          </h2>
          <p className="text-gray-400">
            Discussion with {conversation.utterances.length} statements from {speakers.length} participants
          </p>
        </div>

        {/* Metrics Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <MetricCard
            icon={<Activity className="w-6 h-6" />}
            title="Tension Level"
            value={consensus_map.tension_score}
            color="red"
            isLower={true}
          />
          <MetricCard
            icon={<Users className="w-6 h-6" />}
            title="Empathy Score"
            value={consensus_map.empathy_score}
            color="green"
            isLower={false}
          />
          <MetricCard
            icon={<Lightbulb className="w-6 h-6" />}
            title="Common Ground"
            value={consensus_map.alignment_edges.length / Math.max(speakers.length, 1) / 5}
            color="blue"
            isLower={false}
          />
        </div>

        {/* Timeline Chart */}
        {chartData.length > 1 && (
          <div className="glass rounded-xl p-6 mb-12">
            <h3 className="text-xl font-bold text-white mb-6">Conversation Dynamics</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="index" 
                  stroke="rgba(255,255,255,0.5)" 
                  label={{ value: 'Statement #', position: 'insideBottom', offset: -5, fill: 'rgba(255,255,255,0.7)' }}
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.5)"
                  label={{ value: 'Level (%)', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.7)' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0,0,0,0.9)', 
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="tension" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  name="Tension"
                  dot={{ fill: '#ef4444' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="empathy" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Empathy"
                  dot={{ fill: '#10b981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Value Nodes */}
        <div className="glass rounded-xl p-6 mb-12">
          <h3 className="text-xl font-bold text-white mb-6">Extracted Values</h3>
          <div className="space-y-4">
            {speakers.map(speaker => {
              const speakerNodes = consensus_map.value_nodes.filter(n => n.speaker_name === speaker);
              return (
                <div key={speaker} className="bg-gray-900 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-3">{speaker}</h4>
                  <div className="flex flex-wrap gap-2">
                    {speakerNodes.map(node => (
                      <div 
                        key={node.id}
                        className="px-3 py-1 rounded-full text-sm bg-blue-500/20 text-blue-300 border border-blue-500/30"
                        title={node.description}
                      >
                        {node.value_type} ({Math.round(node.importance * 100)}%)
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Alignment Bridges */}
        {consensus_map.alignment_edges.length > 0 && (
          <div className="glass rounded-xl p-6 mb-12">
            <h3 className="text-xl font-bold text-white mb-6">Common Ground Found</h3>
            <div className="space-y-3">
              {consensus_map.alignment_edges.map((edge, index) => (
                <div key={index} className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-green-400" />
                      <span className="text-sm font-semibold text-green-300">
                        Alignment Score: {Math.round(edge.alignment_score * 100)}%
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-300">{edge.bridge_text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Generate Compromise */}
        {!compromise ? (
          <div className="text-center">
            <button
              onClick={() => compromiseMutation.mutate()}
              disabled={compromiseMutation.isPending}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg shadow-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
            >
              {compromiseMutation.isPending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating Compromise...
                </>
              ) : (
                <>
                  <Lightbulb className="w-5 h-5" />
                  Generate AI Compromise
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="glass rounded-xl p-8 border-2 border-blue-500/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Lightbulb className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-white">AI-Generated Compromise</h3>
            </div>
            
            <p className="text-lg text-gray-200 mb-8 leading-relaxed">
              {compromise.compromise_text}
            </p>

            <div className="border-t border-gray-700 pt-6">
              <h4 className="text-lg font-semibold text-white mb-4">Rationale</h4>
              <ul className="space-y-3">
                {compromise.rationale.map((point, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </span>
                    <span className="text-gray-300">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Participant Statements */}
        <div className="mt-12">
          <h3 className="text-xl font-bold text-white mb-6">Full Discussion</h3>
          <div className="space-y-4">
            {conversation.utterances.map((utterance) => (
              <div key={utterance.utterance_id} className="glass rounded-lg p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-gray-400" />
                    <span className="font-semibold text-white">{utterance.speaker_name}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    utterance.sentiment === 'positive' 
                      ? 'bg-green-500/20 text-green-400' 
                      : utterance.sentiment === 'negative'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {utterance.sentiment}
                  </span>
                </div>
                <p className="text-gray-300 mb-3">{utterance.text}</p>
                {utterance.extracted_values.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {utterance.extracted_values.map((value, idx) => (
                      <span 
                        key={idx}
                        className="text-xs px-2 py-1 bg-blue-500/10 text-blue-300 rounded border border-blue-500/20"
                      >
                        {value.value_type}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ 
  icon, 
  title, 
  value, 
  color,
  isLower 
}: { 
  icon: React.ReactNode; 
  title: string; 
  value: number;
  color: 'red' | 'green' | 'blue';
  isLower?: boolean;
}) {
  const percentage = Math.round(value * 100);
  const colorClasses = {
    red: 'bg-red-500/20 text-red-400 border-red-500/30',
    green: 'bg-green-500/20 text-green-400 border-green-500/30',
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  };

  const Icon = isLower ? TrendingDown : TrendingUp;

  return (
    <div className="glass rounded-lg p-6">
      <div className={`inline-flex p-3 rounded-lg mb-4 ${colorClasses[color]}`}>
        {icon}
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm text-gray-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-white">{percentage}%</p>
        </div>
        <Icon className={`w-8 h-8 ${color === 'red' ? 'text-red-400' : color === 'green' ? 'text-green-400' : 'text-blue-400'}`} />
      </div>
    </div>
  );
}
