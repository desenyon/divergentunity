from typing import Dict, Any, List
from sqlmodel import Session, select
from models import ValueNode, RelationEdge, AlignmentEdge
from schemas import ConsensusMap, ValueNodeData, RelationEdgeData, AlignmentEdgeData


async def generate_consensus_map(conversation_id: str, session: Session) -> ConsensusMap:
    """
    Generate visual consensus map data for frontend visualization.
    
    Returns:
        ConsensusMap with nodes, edges, positions, and metrics
    """
    # Get all value nodes
    value_nodes = list(session.exec(
        select(ValueNode).where(ValueNode.conversation_id == conversation_id)
    ).all())
    
    # Get all relation edges
    relation_edges = list(session.exec(
        select(RelationEdge).join(ValueNode, RelationEdge.from_node_id == ValueNode.id).where(
            ValueNode.conversation_id == conversation_id
        )
    ).all())
    
    # Get all alignment edges
    alignment_edges = list(session.exec(
        select(AlignmentEdge).join(ValueNode, AlignmentEdge.node1_id == ValueNode.id).where(
            ValueNode.conversation_id == conversation_id
        )
    ).all())
    
    # Convert to response format
    node_data = [
        ValueNodeData(
            id=node.id,
            value_type=node.value_type,
            description=node.description,
            importance=node.importance,
            speaker_name=node.speaker_name
        )
        for node in value_nodes
    ]
    
    relation_data = [
        RelationEdgeData(
            from_node_id=edge.from_node_id,
            to_node_id=edge.to_node_id,
            relation_type=edge.relation_type,
            strength=edge.strength
        )
        for edge in relation_edges
    ]
    
    alignment_data = [
        AlignmentEdgeData(
            node1_id=edge.node1_id,
            node2_id=edge.node2_id,
            alignment_score=edge.alignment_score,
            bridge_text=edge.bridge_text
        )
        for edge in alignment_edges
    ]
    
    # Calculate participant positions (for visualization)
    participant_positions = calculate_participant_positions(value_nodes)
    
    # Calculate metrics
    tension_score = calculate_tension_from_edges(relation_edges)
    empathy_score = calculate_empathy_from_alignments(alignment_edges)
    
    return ConsensusMap(
        value_nodes=node_data,
        relation_edges=relation_data,
        alignment_edges=alignment_data,
        participant_positions=participant_positions,
        tension_score=tension_score,
        empathy_score=empathy_score
    )


def calculate_participant_positions(value_nodes: List[ValueNode]) -> Dict[str, Any]:
    """
    Calculate position data for each participant (for visualization).
    Groups values by speaker and calculates centroid.
    """
    speakers = {}
    
    for node in value_nodes:
        if node.speaker_name not in speakers:
            speakers[node.speaker_name] = {
                "value_types": [],
                "total_importance": 0,
                "value_count": 0
            }
        
        speakers[node.speaker_name]["value_types"].append(node.value_type)
        speakers[node.speaker_name]["total_importance"] += node.importance
        speakers[node.speaker_name]["value_count"] += 1
    
    # Calculate average importance and dominant values
    for speaker, data in speakers.items():
        data["average_importance"] = (
            data["total_importance"] / data["value_count"] 
            if data["value_count"] > 0 
            else 0
        )
        
        # Find most common value types
        value_counts = {}
        for v in data["value_types"]:
            value_counts[v] = value_counts.get(v, 0) + 1
        
        data["dominant_values"] = sorted(
            value_counts.items(), 
            key=lambda x: x[1], 
            reverse=True
        )[:3]
    
    return speakers


def calculate_tension_from_edges(relation_edges: List[RelationEdge]) -> float:
    """Calculate tension score from relation edges."""
    if not relation_edges:
        return 0.0
    
    contradiction_strength = sum(
        e.strength for e in relation_edges 
        if e.relation_type == "contradicts"
    )
    total_strength = sum(e.strength for e in relation_edges)
    
    if total_strength == 0:
        return 0.0
    
    return contradiction_strength / total_strength


def calculate_empathy_from_alignments(alignment_edges: List[AlignmentEdge]) -> float:
    """Calculate empathy score from alignment edges."""
    if not alignment_edges:
        return 0.3
    
    avg_alignment = sum(a.alignment_score for a in alignment_edges) / len(alignment_edges)
    count_bonus = min(len(alignment_edges) * 0.1, 0.4)
    
    return min(avg_alignment * 0.6 + count_bonus, 1.0)
