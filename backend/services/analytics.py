from typing import List, Dict, Any
from sqlmodel import Session, select, func
from models import Conversation, Utterance, ValueNode, AlignmentEdge, RelationEdge
from schemas import SessionHistoryItem, ImpactMetrics, DebateQualityMetrics, TimelinePoint
from datetime import datetime
import google.generativeai as genai
import json


async def get_session_history(session: Session) -> List[SessionHistoryItem]:
    """
    Get list of all conversations with metadata.
    """
    conversations = list(session.exec(select(Conversation)).all())
    
    history = []
    for conv in conversations:
        # Count utterances
        utterance_count = len(session.exec(
            select(Utterance).where(Utterance.conversation_id == conv.id)
        ).all())
        
        # Count unique participants
        speakers = session.exec(
            select(Utterance.speaker_name).where(
                Utterance.conversation_id == conv.id
            ).distinct()
        ).all()
        participant_count = len(speakers)
        
        # Get final metrics
        final_utterances = session.exec(
            select(Utterance).where(
                Utterance.conversation_id == conv.id
            ).order_by(Utterance.timestamp.desc()).limit(1)
        ).first()
        
        final_empathy = final_utterances.empathy_level if final_utterances else 0.0
        final_tension = final_utterances.tension_level if final_utterances else 0.0
        
        history.append(SessionHistoryItem(
            conversation_id=conv.id,
            topic=conv.topic,
            participant_count=participant_count,
            utterance_count=utterance_count,
            created_at=conv.created_at,
            final_empathy=final_empathy,
            final_tension=final_tension
        ))
    
    return sorted(history, key=lambda x: x.created_at, reverse=True)


async def get_impact_metrics(session: Session) -> ImpactMetrics:
    """
    Calculate platform-wide impact metrics.
    """
    # Total sessions
    total_sessions = len(session.exec(select(Conversation)).all())
    
    # Total participants (unique speakers across all conversations)
    all_speakers = session.exec(select(Utterance.speaker_name).distinct()).all()
    total_participants = len(all_speakers)
    
    # Get all conversations for calculations
    conversations = session.exec(select(Conversation)).all()
    
    tension_reductions = []
    empathy_increases = []
    total_utterances = 0
    compromises_generated = 0
    
    for conv in conversations:
        utterances = list(session.exec(
            select(Utterance).where(
                Utterance.conversation_id == conv.id
            ).order_by(Utterance.timestamp)
        ).all())
        
        total_utterances += len(utterances)
        
        if len(utterances) >= 2:
            # Calculate tension reduction
            first_tension = utterances[0].tension_level
            last_tension = utterances[-1].tension_level
            if first_tension > 0:
                reduction = (first_tension - last_tension) / first_tension
                tension_reductions.append(max(0, reduction))
            
            # Calculate empathy increase
            first_empathy = utterances[0].empathy_level
            last_empathy = utterances[-1].empathy_level
            increase = last_empathy - first_empathy
            empathy_increases.append(max(0, increase))
            
            # Count if compromise was generated (has alignment edges)
            alignments = session.exec(
                select(AlignmentEdge).join(
                    ValueNode, AlignmentEdge.node1_id == ValueNode.id
                ).where(ValueNode.conversation_id == conv.id)
            ).all()
            if alignments:
                compromises_generated += 1
    
    # Calculate averages
    avg_tension_reduction = (
        sum(tension_reductions) / len(tension_reductions) 
        if tension_reductions else 0.0
    )
    avg_empathy_increase = (
        sum(empathy_increases) / len(empathy_increases) 
        if empathy_increases else 0.0
    )
    
    # Estimate debate time (2 minutes per utterance)
    total_debate_minutes = total_utterances * 2.0
    
    # Count total value alignments
    total_alignments = len(session.exec(select(AlignmentEdge)).all())
    
    # Most discussed topics
    topic_counts = {}
    for conv in conversations:
        topic = conv.topic.lower()
        topic_counts[topic] = topic_counts.get(topic, 0) + 1
    
    most_discussed = [
        {"topic": topic, "count": count}
        for topic, count in sorted(topic_counts.items(), key=lambda x: x[1], reverse=True)[:5]
    ]
    
    return ImpactMetrics(
        total_sessions=total_sessions,
        total_participants=total_participants,
        average_tension_reduction=avg_tension_reduction,
        average_empathy_increase=avg_empathy_increase,
        compromises_generated=compromises_generated,
        total_debate_minutes=total_debate_minutes,
        value_alignments_found=total_alignments,
        most_discussed_topics=most_discussed
    )


async def get_conversation_timeline(conversation_id: str, session: Session) -> List[TimelinePoint]:
    """
    Get tension/empathy timeline for a conversation.
    """
    utterances = list(session.exec(
        select(Utterance).where(
            Utterance.conversation_id == conversation_id
        ).order_by(Utterance.timestamp)
    ).all())
    
    timeline = [
        TimelinePoint(
            timestamp=u.timestamp,
            tension_level=u.tension_level,
            empathy_level=u.empathy_level,
            speaker_name=u.speaker_name,
            text=u.text[:100] + "..." if len(u.text) > 100 else u.text
        )
        for u in utterances
    ]
    
    return timeline


async def get_debate_quality(conversation_id: str, session: Session) -> DebateQualityMetrics:
    """
    Calculate debate quality metrics.
    """
    utterances = list(session.exec(
        select(Utterance).where(
            Utterance.conversation_id == conversation_id
        ).order_by(Utterance.timestamp)
    ).all())
    
    if not utterances:
        return DebateQualityMetrics(
            overall_quality=0.0,
            participation_balance=0.0,
            value_depth=0.0,
            constructive_engagement=0.0,
            sentiment_progression=[]
        )
    
    # Participation balance (lower std dev = better balance)
    speaker_counts = {}
    for u in utterances:
        speaker_counts[u.speaker_name] = speaker_counts.get(u.speaker_name, 0) + 1
    
    counts = list(speaker_counts.values())
    if len(counts) > 1:
        mean = sum(counts) / len(counts)
        variance = sum((x - mean) ** 2 for x in counts) / len(counts)
        std_dev = variance ** 0.5
        # Normalize: lower std dev = higher score
        participation_balance = max(0, 100 - (std_dev * 20))
    else:
        participation_balance = 50.0  # Single speaker = moderate score
    
    # Value depth (average importance of extracted values)
    value_nodes = session.exec(
        select(ValueNode).where(ValueNode.conversation_id == conversation_id)
    ).all()
    
    if value_nodes:
        avg_importance = sum(v.importance for v in value_nodes) / len(value_nodes)
        value_depth = avg_importance * 100
    else:
        value_depth = 0.0
    
    # Constructive engagement (ratio of alignments to contradictions)
    alignments = len(session.exec(
        select(AlignmentEdge).join(
            ValueNode, AlignmentEdge.node1_id == ValueNode.id
        ).where(ValueNode.conversation_id == conversation_id)
    ).all())
    
    contradictions = len(session.exec(
        select(RelationEdge).join(
            ValueNode, RelationEdge.from_node_id == ValueNode.id
        ).where(
            ValueNode.conversation_id == conversation_id,
            RelationEdge.relation_type == "contradicts"
        )
    ).all())
    
    total_relations = alignments + contradictions
    if total_relations > 0:
        constructive_engagement = (alignments / total_relations) * 100
    else:
        constructive_engagement = 50.0
    
    # Sentiment progression
    sentiment_progression = []
    for i, u in enumerate(utterances):
        sentiment_map = {"positive": 1.0, "neutral": 0.5, "negative": 0.0}
        sentiment_progression.append({
            "index": i,
            "sentiment_score": sentiment_map.get(u.sentiment, 0.5),
            "tension": u.tension_level,
            "empathy": u.empathy_level
        })
    
    # Overall quality (weighted average)
    overall_quality = (
        participation_balance * 0.25 +
        value_depth * 0.35 +
        constructive_engagement * 0.40
    )
    
    return DebateQualityMetrics(
        overall_quality=overall_quality,
        participation_balance=participation_balance,
        value_depth=value_depth,
        constructive_engagement=constructive_engagement,
        sentiment_progression=sentiment_progression
    )
