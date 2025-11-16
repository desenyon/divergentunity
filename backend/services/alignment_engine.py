from typing import List, Dict, Any
from sqlmodel import Session, select
from models import ValueNode, AlignmentEdge, RelationEdge, Utterance
import uuid


async def find_alignments(conversation_id: str, session: Session) -> Dict[str, Any]:
    """
    Identify common ground between opposing speakers.
    Creates AlignmentEdge records for shared values.
    
    Returns:
        {
            "alignment_count": int,
            "tension_score": float,
            "empathy_score": float,
            "bridges": [{"text": str, "score": float}]
        }
    """
    # Get all value nodes for this conversation
    statement = select(ValueNode).where(ValueNode.conversation_id == conversation_id)
    value_nodes = list(session.exec(statement).all())
    
    # Get unique speakers
    speakers = list(set(node.speaker_name for node in value_nodes))
    
    if len(speakers) < 2:
        return {
            "alignment_count": 0,
            "tension_score": 0.0,
            "empathy_score": 0.5,
            "bridges": []
        }
    
    # Find alignments between different speakers
    alignments_created = 0
    bridges = []
    
    for i, node1 in enumerate(value_nodes):
        for node2 in value_nodes[i+1:]:
            # Only align values from different speakers
            if node1.speaker_name == node2.speaker_name:
                continue
            
            # Check if values align
            alignment_score = calculate_alignment_score(node1, node2)
            
            if alignment_score >= 0.4:
                # Check if alignment already exists
                existing = session.exec(
                    select(AlignmentEdge).where(
                        AlignmentEdge.node1_id == node1.id,
                        AlignmentEdge.node2_id == node2.id
                    )
                ).first()
                
                if not existing:
                    bridge_text = generate_bridge_text(node1, node2)
                    
                    alignment = AlignmentEdge(
                        id=str(uuid.uuid4()),
                        node1_id=node1.id,
                        node2_id=node2.id,
                        alignment_score=alignment_score,
                        bridge_text=bridge_text
                    )
                    session.add(alignment)
                    alignments_created += 1
                    
                    bridges.append({
                        "text": bridge_text,
                        "score": alignment_score
                    })
    
    session.commit()
    
    # Calculate tension and empathy scores
    tension_score = calculate_tension_score(conversation_id, session)
    empathy_score = calculate_empathy_score(conversation_id, session, alignments_created)
    
    return {
        "alignment_count": alignments_created,
        "tension_score": tension_score,
        "empathy_score": empathy_score,
        "bridges": sorted(bridges, key=lambda x: x["score"], reverse=True)[:5]
    }


def calculate_alignment_score(node1: ValueNode, node2: ValueNode) -> float:
    """
    Calculate how well two values from different speakers align.
    """
    # Same value type = high alignment
    if node1.value_type == node2.value_type:
        base_score = 0.8
        # Boost by average importance
        importance_boost = (node1.importance + node2.importance) / 4
        return min(base_score + importance_boost, 1.0)
    
    # Compatible value types
    compatible_pairs = {
        ("safety", "responsibility"): 0.6,
        ("freedom", "autonomy"): 0.7,
        ("fairness", "community"): 0.6,
        ("tradition", "community"): 0.5,
        ("progress", "autonomy"): 0.5,
    }
    
    pair = tuple(sorted([node1.value_type, node2.value_type]))
    if pair in compatible_pairs:
        return compatible_pairs[pair]
    
    # No clear alignment
    return 0.2


def generate_bridge_text(node1: ValueNode, node2: ValueNode) -> str:
    """
    Generate explanation text for an alignment.
    """
    if node1.value_type == node2.value_type:
        return f"Both {node1.speaker_name} and {node2.speaker_name} value {node1.value_type}, though they may emphasize different aspects."
    
    return f"{node1.speaker_name}'s concern for {node1.value_type} and {node2.speaker_name}'s focus on {node2.value_type} can work together toward a balanced solution."


def calculate_tension_score(conversation_id: str, session: Session) -> float:
    """
    Calculate tension score based on contradiction edges.
    Higher score = more tension.
    """
    # Get all relation edges for this conversation
    statement = select(RelationEdge).join(ValueNode, RelationEdge.from_node_id == ValueNode.id).where(
        ValueNode.conversation_id == conversation_id
    )
    edges = list(session.exec(statement).all())
    
    if not edges:
        return 0.0
    
    contradiction_count = sum(1 for e in edges if e.relation_type == "contradicts")
    total_edges = len(edges)
    
    # Weight by edge strengths
    contradiction_strength = sum(e.strength for e in edges if e.relation_type == "contradicts")
    total_strength = sum(e.strength for e in edges)
    
    if total_strength == 0:
        return 0.0
    
    return contradiction_strength / total_strength


def calculate_empathy_score(conversation_id: str, session: Session, new_alignments: int = 0) -> float:
    """
    Calculate empathy score based on alignments and understanding.
    Higher score = more empathy.
    """
    # Get all alignment edges
    statement = select(AlignmentEdge).join(ValueNode, AlignmentEdge.node1_id == ValueNode.id).where(
        ValueNode.conversation_id == conversation_id
    )
    alignments = list(session.exec(statement).all())
    
    if not alignments:
        return 0.3  # Baseline empathy
    
    # Calculate based on alignment count and quality
    alignment_score = min(len(alignments) * 0.15, 0.7)
    quality_score = sum(a.alignment_score for a in alignments) / len(alignments) * 0.3
    
    return min(alignment_score + quality_score, 1.0)


async def update_utterance_metrics(conversation_id: str, session: Session) -> None:
    """
    Update tension and empathy levels for all utterances in conversation.
    """
    tension = calculate_tension_score(conversation_id, session)
    empathy = calculate_empathy_score(conversation_id, session)
    
    # Update all utterances
    statement = select(Utterance).where(Utterance.conversation_id == conversation_id)
    utterances = session.exec(statement).all()
    
    for utterance in utterances:
        utterance.tension_level = tension
        utterance.empathy_level = empathy
        session.add(utterance)
    
    session.commit()
