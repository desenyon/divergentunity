from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlmodel import Field, SQLModel, Relationship, Column, JSON
import uuid


def generate_uuid():
    return str(uuid.uuid4())


class Conversation(SQLModel, table=True):
    """Main discussion container"""
    __tablename__ = "conversations"
    
    id: str = Field(default_factory=generate_uuid, primary_key=True)
    topic: str = Field(index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    bridge_mode: bool = Field(default=False)
    perspective_swap: bool = Field(default=False)
    
    # Relationships
    utterances: List["Utterance"] = Relationship(back_populates="conversation")
    value_nodes: List["ValueNode"] = Relationship(back_populates="conversation")


class Utterance(SQLModel, table=True):
    """Individual participant statements"""
    __tablename__ = "utterances"
    
    id: str = Field(default_factory=generate_uuid, primary_key=True)
    conversation_id: str = Field(foreign_key="conversations.id", index=True)
    speaker_name: str = Field(index=True)
    text: str
    sentiment: str = Field(default="neutral")  # positive, negative, neutral
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    tension_level: float = Field(default=0.0)  # 0-1
    empathy_level: float = Field(default=0.0)  # 0-1
    judge_analysis: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    
    # Relationships
    conversation: Optional[Conversation] = Relationship(back_populates="utterances")
    value_nodes: List["ValueNode"] = Relationship(back_populates="utterance")


class ValueNode(SQLModel, table=True):
    """Extracted values/principles from utterances"""
    __tablename__ = "value_nodes"
    
    id: str = Field(default_factory=generate_uuid, primary_key=True)
    conversation_id: str = Field(foreign_key="conversations.id", index=True)
    utterance_id: str = Field(foreign_key="utterances.id", index=True)
    value_type: str = Field(index=True)  # safety, freedom, fairness, etc.
    description: str
    importance: float = Field(default=0.5)  # 0-1
    speaker_name: str = Field(index=True)
    
    # Relationships
    conversation: Optional[Conversation] = Relationship(back_populates="value_nodes")
    utterance: Optional[Utterance] = Relationship(back_populates="value_nodes")
    outgoing_relations: List["RelationEdge"] = Relationship(
        back_populates="from_node",
        sa_relationship_kwargs={"foreign_keys": "RelationEdge.from_node_id"}
    )
    incoming_relations: List["RelationEdge"] = Relationship(
        back_populates="to_node",
        sa_relationship_kwargs={"foreign_keys": "RelationEdge.to_node_id"}
    )
    alignments_as_node1: List["AlignmentEdge"] = Relationship(
        back_populates="node1",
        sa_relationship_kwargs={"foreign_keys": "AlignmentEdge.node1_id"}
    )
    alignments_as_node2: List["AlignmentEdge"] = Relationship(
        back_populates="node2",
        sa_relationship_kwargs={"foreign_keys": "AlignmentEdge.node2_id"}
    )


class RelationEdge(SQLModel, table=True):
    """Relationships between values (supports/contradicts)"""
    __tablename__ = "relation_edges"
    
    id: str = Field(default_factory=generate_uuid, primary_key=True)
    from_node_id: str = Field(foreign_key="value_nodes.id", index=True)
    to_node_id: str = Field(foreign_key="value_nodes.id", index=True)
    relation_type: str  # supports, contradicts
    strength: float = Field(default=0.5)  # 0-1
    
    # Relationships
    from_node: Optional[ValueNode] = Relationship(
        back_populates="outgoing_relations",
        sa_relationship_kwargs={"foreign_keys": "[RelationEdge.from_node_id]"}
    )
    to_node: Optional[ValueNode] = Relationship(
        back_populates="incoming_relations",
        sa_relationship_kwargs={"foreign_keys": "[RelationEdge.to_node_id]"}
    )


class AlignmentEdge(SQLModel, table=True):
    """Cross-speaker value alignments (common ground)"""
    __tablename__ = "alignment_edges"
    
    id: str = Field(default_factory=generate_uuid, primary_key=True)
    node1_id: str = Field(foreign_key="value_nodes.id", index=True)
    node2_id: str = Field(foreign_key="value_nodes.id", index=True)
    alignment_score: float = Field(default=0.5)  # 0-1
    bridge_text: str  # Explanation of the common ground
    
    # Relationships
    node1: Optional[ValueNode] = Relationship(
        back_populates="alignments_as_node1",
        sa_relationship_kwargs={"foreign_keys": "[AlignmentEdge.node1_id]"}
    )
    node2: Optional[ValueNode] = Relationship(
        back_populates="alignments_as_node2",
        sa_relationship_kwargs={"foreign_keys": "[AlignmentEdge.node2_id]"}
    )
