import google.generativeai as genai
import json
from typing import List, Dict, Any
from sqlmodel import Session, select
from models import Utterance, ValueNode, AlignmentEdge
from schemas import CompromiseResponse, ConsensusMap
from services.consensus_map import generate_consensus_map
import os


async def generate_compromise(conversation_id: str, topic: str, session: Session) -> CompromiseResponse:
    """
    Use Gemini to synthesize a compromise statement based on the debate.
    
    Args:
        conversation_id: ID of the conversation
        topic: Debate topic
        session: Database session
    
    Returns:
        CompromiseResponse with compromise text, rationale, and consensus map
    """
    # Get all utterances
    utterances = list(session.exec(
        select(Utterance).where(Utterance.conversation_id == conversation_id)
    ).all())
    
    # Get alignment bridges
    alignments = list(session.exec(
        select(AlignmentEdge).join(ValueNode, AlignmentEdge.node1_id == ValueNode.id).where(
            ValueNode.conversation_id == conversation_id
        )
    ).all())
    
    # Format utterances
    utterances_formatted = "\n".join([
        f"{u.speaker_name}: {u.text}"
        for u in utterances
    ])
    
    # Format alignment bridges
    bridges_formatted = "\n".join([
        f"- {a.bridge_text} (strength: {a.alignment_score:.2f})"
        for a in alignments
    ])
    
    if not bridges_formatted:
        bridges_formatted = "No strong alignments found yet. Focus on identifying shared concerns."
    
    # Generate compromise using Gemini
    try:
        model = genai.GenerativeModel('gemini-2.5-flash-lite')
        
        prompt = f"""Generate a consensus-based compromise for this debate.

Topic: {topic}

Perspectives:
{utterances_formatted}

Common Ground Found:
{bridges_formatted}

Create a solution that:
1. Honors both perspectives authentically
2. Builds on the shared values identified
3. Addresses the core concerns of all parties
4. Is specific, actionable, and balanced
5. Doesn't dismiss either side's priorities

Return ONLY a valid JSON object (no markdown, no code blocks):
{{
  "compromise": "A clear, specific compromise statement that synthesizes both positions",
  "rationale": [
    "Explanation of how this addresses speaker 1's concerns",
    "Explanation of how this addresses speaker 2's concerns", 
    "Explanation of how this builds on common ground",
    "Why this solution is balanced and actionable"
  ]
}}

The compromise should be 2-4 sentences. Each rationale point should be 1-2 sentences."""

        response = model.generate_content(prompt)
        
        # Clean response
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        
        result = json.loads(text)
        
        # Validate structure
        if "compromise" not in result or "rationale" not in result:
            raise ValueError("Invalid response structure")
        
        compromise_text = result["compromise"]
        rationale = result["rationale"]
        
    except Exception as e:
        print(f"Error generating compromise: {e}")
        # Fallback compromise
        compromise_text = f"A balanced approach to {topic} that considers multiple perspectives while finding practical middle ground."
        rationale = [
            "This solution aims to address concerns from all participants.",
            "It builds on areas of potential agreement identified in the discussion.",
            "The approach prioritizes practical implementation while respecting diverse values.",
            "Further dialogue can refine specific details while maintaining this framework."
        ]
    
    # Generate consensus map
    consensus_map = await generate_consensus_map(conversation_id, session)
    
    return CompromiseResponse(
        compromise_text=compromise_text,
        rationale=rationale,
        consensus_map=consensus_map
    )


async def generate_summary(conversation_id: str, topic: str, session: Session) -> Dict[str, Any]:
    """
    Generate a neutral summary of the conversation.
    
    Returns:
        {
            "summary_text": str,
            "key_points": List[str],
            "participant_perspectives": Dict[speaker_name, summary]
        }
    """
    # Get all utterances
    utterances = list(session.exec(
        select(Utterance).where(Utterance.conversation_id == conversation_id)
    ).all())
    
    if not utterances:
        return {
            "summary_text": f"No discussion yet on: {topic}",
            "key_points": [],
            "participant_perspectives": {}
        }
    
    # Format conversation
    conversation = "\n".join([f"{u.speaker_name}: {u.text}" for u in utterances])
    
    # Get unique speakers
    speakers = list(set(u.speaker_name for u in utterances))
    
    try:
        model = genai.GenerativeModel('gemini-2.5-flash-lite')
        
        prompt = f"""Summarize this debate neutrally and fairly.

Topic: {topic}

Conversation:
{conversation}

Return ONLY a valid JSON object (no markdown):
{{
  "summary_text": "A 2-3 sentence neutral summary of the overall discussion",
  "key_points": [
    "Key point or theme 1",
    "Key point or theme 2",
    "Key point or theme 3"
  ],
  "participant_perspectives": {{
    "{speakers[0]}": "1-2 sentence summary of their main position",
    {', '.join([f'"{s}": "1-2 sentence summary"' for s in speakers[1:]])}
  }}
}}

Be fair to all perspectives. Don't editorialize or take sides."""

        response = model.generate_content(prompt)
        
        # Clean response
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        
        result = json.loads(text)
        return result
        
    except Exception as e:
        print(f"Error generating summary: {e}")
        # Fallback summary
        return {
            "summary_text": f"Discussion on {topic} with {len(speakers)} participants and {len(utterances)} statements.",
            "key_points": [
                "Multiple perspectives were shared",
                "Participants expressed different priorities",
                "The discussion touched on various values and concerns"
            ],
            "participant_perspectives": {
                speaker: f"{speaker} shared their perspective on {topic}."
                for speaker in speakers
            }
        }
