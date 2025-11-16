from typing import List, Dict, Any, Tuple
from sqlmodel import Session, select
from models import ValueNode, RelationEdge, Utterance
import uuid


def calculate_relation_strength(value1: ValueNode, value2: ValueNode) -> Tuple[str, float]:
    """
    Calculate relationship type and strength between two values.
    
    Returns:
        (relation_type, strength) where relation_type is 'supports' or 'contradicts'
    """
    # Define value oppositions
    oppositions = {
        "safety": ["freedom", "progress"],
        "freedom": ["safety", "responsibility"],
        "tradition": ["progress"],
        "progress": ["tradition", "safety"],
        "community": ["autonomy"],
        "autonomy": ["community", "responsibility"],
        "fairness": [],
        "responsibility": ["freedom", "autonomy"]
    }
    
    # Check if values contradict
    if value2.value_type in oppositions.get(value1.value_type, []):
        # Different speakers with opposing values = contradiction
        if value1.speaker_name != value2.speaker_name:
            strength = (value1.importance + value2.importance) / 2
            return ("contradicts", strength)
        # Same speaker can hold nuanced positions
        else:
            return ("supports", 0.3)
    
    # Same value type = support
    if value1.value_type == value2.value_type:
        strength = (value1.importance + value2.importance) / 2
        return ("supports", strength * 0.8)
    
    # Different speakers, non-opposing values = weak support
    if value1.speaker_name != value2.speaker_name:
        return ("supports", 0.2)
    
    # Same speaker, different non-opposing values = moderate support
    return ("supports", 0.4)


async def build_value_graph(conversation_id: str, session: Session) -> Dict[str, Any]:
    """
    Build the value graph for a conversation.
    Creates RelationEdge records connecting ValueNodes.
    
    Returns:
        Statistics about the graph: {
            "nodes_count": int,
            "edges_count": int,
            "contradiction_count": int,
            "support_count": int
        }
    """
    # Get all value nodes for this conversation
    statement = select(ValueNode).where(ValueNode.conversation_id == conversation_id)
    value_nodes = session.exec(statement).all()
    
    if len(value_nodes) < 2:
        return {
            "nodes_count": len(value_nodes),
            "edges_count": 0,
            "contradiction_count": 0,
            "support_count": 0
        }
    
    edges_created = 0
    contradiction_count = 0
    support_count = 0
    
    # Create edges between all pairs of nodes
    for i, node1 in enumerate(value_nodes):
        for node2 in value_nodes[i+1:]:
            # Skip self-connections
            if node1.id == node2.id:
                continue
            
            # Calculate relationship
            relation_type, strength = calculate_relation_strength(node1, node2)
            
            # Only create edges with meaningful strength
            if strength >= 0.2:
                # Check if edge already exists
                existing_edge = session.exec(
                    select(RelationEdge).where(
                        RelationEdge.from_node_id == node1.id,
                        RelationEdge.to_node_id == node2.id
                    )
                ).first()
                
                if not existing_edge:
                    edge = RelationEdge(
                        id=str(uuid.uuid4()),
                        from_node_id=node1.id,
                        to_node_id=node2.id,
                        relation_type=relation_type,
                        strength=strength
                    )
                    session.add(edge)
                    edges_created += 1
                    
                    if relation_type == "contradicts":
                        contradiction_count += 1
                    else:
                        support_count += 1
    
    session.commit()
    
    return {
        "nodes_count": len(value_nodes),
        "edges_count": edges_created,
        "contradiction_count": contradiction_count,
        "support_count": support_count
    }


async def calculate_importance_scores(conversation_id: str, session: Session) -> None:
    """
    Recalculate importance scores for all value nodes based on:
    - Initial importance from extraction
    - Number of connections (centrality)
    - Strength of connections
    """
    statement = select(ValueNode).where(ValueNode.conversation_id == conversation_id)
    value_nodes = session.exec(statement).all()
    
    for node in value_nodes:
        # Get all edges for this node
        outgoing = session.exec(
            select(RelationEdge).where(RelationEdge.from_node_id == node.id)
        ).all()
        incoming = session.exec(
            select(RelationEdge).where(RelationEdge.to_node_id == node.id)
        ).all()
        
        # Calculate centrality bonus
        connection_count = len(outgoing) + len(incoming)
        centrality_bonus = min(connection_count * 0.05, 0.3)
        
        # Calculate strength bonus
        total_strength = sum(e.strength for e in outgoing + incoming)
        strength_bonus = min(total_strength * 0.1, 0.2)
        
        # Update importance (capped at 1.0)
        original_importance = node.importance
        node.importance = min(original_importance + centrality_bonus + strength_bonus, 1.0)
        session.add(node)
    
    session.commit()
