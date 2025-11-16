// API Types

export interface ConversationCreate {
  topic: string;
  bridge_mode?: boolean;
  perspective_swap?: boolean;
}

export interface ConversationResponse {
  conversation_id: string;
  topic: string;
  created_at: string;
}

export interface UtteranceCreate {
  speaker_name: string;
  text: string;
}

export interface ValueExtraction {
  value_type: string;
  description: string;
  importance: number;
}

export interface UtteranceResponse {
  utterance_id: string;
  speaker_name: string;
  text: string;
  sentiment: string;
  tension_level: number;
  empathy_level: number;
  extracted_values: ValueExtraction[];
  judge_analysis?: {
    has_issues: boolean;
    severity: 'none' | 'low' | 'medium' | 'high';
    bias_issues?: Array<{
      type: string;
      quote: string;
      explanation: string;
      better_approach?: string;
    }>;
    factual_issues?: Array<{
      claim: string;
      problem: string;
      correction?: string;
    }>;
    civility_issues?: Array<{
      quote: string;
      problem: string;
      reframe?: string;
    }>;
    overall_assessment: string;
  };
}

export interface ValueNodeData {
  id: string;
  value_type: string;
  description: string;
  importance: number;
  speaker_name: string;
}

export interface RelationEdgeData {
  from_node_id: string;
  to_node_id: string;
  relation_type: string;
  strength: number;
}

export interface AlignmentEdgeData {
  node1_id: string;
  node2_id: string;
  alignment_score: number;
  bridge_text: string;
}

export interface ConsensusMap {
  value_nodes: ValueNodeData[];
  relation_edges: RelationEdgeData[];
  alignment_edges: AlignmentEdgeData[];
  participant_positions: Record<string, any>;
  tension_score: number;
  empathy_score: number;
}

export interface ConversationDetail {
  conversation_id: string;
  topic: string;
  created_at: string;
  utterances: UtteranceResponse[];
  consensus_map: ConsensusMap;
}

export interface CompromiseResponse {
  compromise_text: string;
  rationale: string[];
  consensus_map: ConsensusMap;
}

export interface SummaryResponse {
  conversation_id: string;
  topic: string;
  summary_text: string;
  key_points: string[];
  participant_perspectives: Record<string, string>;
}

export interface SessionHistoryItem {
  conversation_id: string;
  topic: string;
  participant_count: number;
  utterance_count: number;
  created_at: string;
  final_empathy: number;
  final_tension: number;
}

export interface ImpactMetrics {
  total_sessions: number;
  total_participants: number;
  average_tension_reduction: number;
  average_empathy_increase: number;
  compromises_generated: number;
  total_debate_minutes: number;
  value_alignments_found: number;
  most_discussed_topics: Array<{ topic: string; count: number }>;
}

export interface DebateQualityMetrics {
  overall_quality: number;
  participation_balance: number;
  value_depth: number;
  constructive_engagement: number;
  sentiment_progression: Array<{
    index: number;
    sentiment_score: number;
    tension: number;
    empathy: number;
  }>;
}

export interface TimelinePoint {
  timestamp: string;
  tension_level: number;
  empathy_level: number;
  speaker_name: string;
  text: string;
}
