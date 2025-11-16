'use client';

import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '@/lib/api';
import { 
  TrendingUp, Users, Clock, Target, 
  MessageSquare, Sparkles, ArrowLeft 
} from 'lucide-react';
import Link from 'next/link';

export default function AnalyticsPage() {
  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: analyticsAPI.getSessions,
  });

  const { data: impact, isLoading: impactLoading } = useQuery({
    queryKey: ['impact'],
    queryFn: analyticsAPI.getImpact,
  });

  if (sessionsLoading || impactLoading || !sessions || !impact) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
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
            <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to App
          </Link>
          <h1 className="text-xl font-bold text-white">Platform Analytics</h1>
          <div className="w-20"></div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Page Title */}
        <div className="mb-12">
          <h2 className="text-4xl font-bold text-white mb-2">Platform Impact</h2>
          <p className="text-gray-400">
            Measuring consensus-building across all conversations
          </p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard
            icon={<MessageSquare className="w-6 h-6" />}
            label="Total Sessions"
            value={impact.total_sessions}
            color="blue"
          />
          <StatCard
            icon={<Users className="w-6 h-6" />}
            label="Participants"
            value={impact.total_participants}
            color="green"
          />
          <StatCard
            icon={<Sparkles className="w-6 h-6" />}
            label="Compromises"
            value={impact.compromises_generated}
            color="purple"
          />
          <StatCard
            icon={<Target className="w-6 h-6" />}
            label="Alignments Found"
            value={impact.value_alignments_found}
            color="yellow"
          />
        </div>

        {/* Impact Metrics */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <ImpactCard
            title="Avg. Tension Reduction"
            value={impact.average_tension_reduction}
            isPercentage={true}
            isPositive={true}
            icon={<TrendingUp className="w-6 h-6" />}
          />
          <ImpactCard
            title="Avg. Empathy Increase"
            value={impact.average_empathy_increase}
            isPercentage={true}
            isPositive={true}
            icon={<TrendingUp className="w-6 h-6" />}
          />
          <ImpactCard
            title="Total Debate Time"
            value={impact.total_debate_minutes}
            suffix=" min"
            isPositive={false}
            icon={<Clock className="w-6 h-6" />}
          />
        </div>

        {/* Most Discussed Topics */}
        {impact.most_discussed_topics.length > 0 && (
          <div className="glass rounded-xl p-6 mb-12">
            <h3 className="text-xl font-bold text-white mb-6">Most Discussed Topics</h3>
            <div className="space-y-3">
              {impact.most_discussed_topics.map((topic, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-900 rounded-lg p-4">
                  <span className="text-gray-300">{topic.topic}</span>
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm font-semibold">
                    {topic.count} sessions
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Session History */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">Recent Sessions</h3>
          <div className="space-y-4">
            {sessions.length === 0 ? (
              <p className="text-center text-gray-400 py-8">No sessions yet</p>
            ) : (
              sessions.slice(0, 10).map((session) => (
                <Link
                  key={session.conversation_id}
                  href={`/summary/${session.conversation_id}`}
                  className="block bg-gray-900 hover:bg-gray-800 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-white mb-1">{session.topic}</h4>
                      <p className="text-sm text-gray-400">
                        {session.participant_count} participants • {session.utterance_count} statements
                      </p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(session.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                      <span className="text-gray-400">
                        Empathy: {Math.round(session.final_empathy * 100)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-red-400" />
                      <span className="text-gray-400">
                        Tension: {Math.round(session.final_tension * 100)}%
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ 
  icon, 
  label, 
  value, 
  color 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: number;
  color: 'blue' | 'green' | 'purple' | 'yellow';
}) {
  const colorClasses = {
    blue: 'bg-blue-500/20 text-blue-400',
    green: 'bg-green-500/20 text-green-400',
    purple: 'bg-purple-500/20 text-purple-400',
    yellow: 'bg-yellow-500/20 text-yellow-400',
  };

  return (
    <div className="glass rounded-lg p-6">
      <div className={`inline-flex p-3 rounded-lg mb-4 ${colorClasses[color]}`}>
        {icon}
      </div>
      <p className="text-sm text-gray-400 mb-1">{label}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  );
}

function ImpactCard({
  title,
  value,
  isPercentage,
  isPositive,
  suffix,
  icon,
}: {
  title: string;
  value: number;
  isPercentage?: boolean;
  isPositive?: boolean;
  suffix?: string;
  icon: React.ReactNode;
}) {
  const displayValue = isPercentage 
    ? `${Math.round(value * 100)}%` 
    : value.toFixed(1) + (suffix || '');

  const colorClass = isPositive 
    ? 'bg-green-500/20 text-green-400 border-green-500/30'
    : 'bg-blue-500/20 text-blue-400 border-blue-500/30';

  return (
    <div className="glass rounded-lg p-6">
      <div className={`inline-flex p-3 rounded-lg mb-4 ${colorClass}`}>
        {icon}
      </div>
      <p className="text-sm text-gray-400 mb-1">{title}</p>
      <p className="text-3xl font-bold text-white">{displayValue}</p>
    </div>
  );
}
