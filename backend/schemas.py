from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


# Request Models
class ConversationCreate(BaseModel):
    topic: str
    bridge_mode: bool = False
    perspective_swap: bool = False


class UtteranceCreate(BaseModel):
    speaker_name: str
    text: str


# Response Models
class ValueExtraction(BaseModel):
    value_type: str
    description: str
    importance: float


class ConversationResponse(BaseModel):
    conversation_id: str
    topic: str
    created_at: datetime


class UtteranceResponse(BaseModel):
    utterance_id: str
    speaker_name: str
    text: str
    sentiment: str
    tension_level: float
    empathy_level: float
    extracted_values: List[ValueExtraction] = []
    judge_analysis: Optional[Dict[str, Any]] = None


class ValueNodeData(BaseModel):
    id: str
    value_type: str
    description: str
    importance: float
    speaker_name: str


class RelationEdgeData(BaseModel):
    from_node_id: str
    to_node_id: str
    relation_type: str
    strength: float


class AlignmentEdgeData(BaseModel):
    node1_id: str
    node2_id: str
    alignment_score: float
    bridge_text: str


class ConsensusMap(BaseModel):
    value_nodes: List[ValueNodeData]
    relation_edges: List[RelationEdgeData]
    alignment_edges: List[AlignmentEdgeData]
    participant_positions: Dict[str, Any]
    tension_score: float
    empathy_score: float


class CompromiseResponse(BaseModel):
    compromise_text: str
    rationale: List[str]
    consensus_map: ConsensusMap


class ConversationDetail(BaseModel):
    conversation_id: str
    topic: str
    created_at: datetime
    utterances: List[UtteranceResponse]
    consensus_map: ConsensusMap


class SessionHistoryItem(BaseModel):
    conversation_id: str
    topic: str
    participant_count: int
    utterance_count: int
    created_at: datetime
    final_empathy: float
    final_tension: float


class ImpactMetrics(BaseModel):
    total_sessions: int
    total_participants: int
    average_tension_reduction: float
    average_empathy_increase: float
    compromises_generated: int
    total_debate_minutes: float
    value_alignments_found: int
    most_discussed_topics: List[Dict[str, Any]]


class DebateQualityMetrics(BaseModel):
    overall_quality: float
    participation_balance: float
    value_depth: float
    constructive_engagement: float
    sentiment_progression: List[Dict[str, float]]


class TimelinePoint(BaseModel):
    timestamp: datetime
    tension_level: float
    empathy_level: float
    speaker_name: str
    text: str


class SummaryResponse(BaseModel):
    conversation_id: str
    topic: str
    summary_text: str
    key_points: List[str]
    participant_perspectives: Dict[str, str]
