from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from typing import List
import uuid

from database import init_db, get_session
from models import Conversation, Utterance, ValueNode
from schemas import (
    ConversationCreate, ConversationResponse, ConversationDetail,
    UtteranceCreate, UtteranceResponse, ValueExtraction,
    CompromiseResponse, SummaryResponse,
    SessionHistoryItem, ImpactMetrics, DebateQualityMetrics, TimelinePoint
)
from services.nlp_extraction import extract_values_from_utterance
from services.value_graph_builder import build_value_graph, calculate_importance_scores
from services.alignment_engine import find_alignments, update_utterance_metrics
from services.consensus_map import generate_consensus_map
from services.compromise_generator import generate_compromise, generate_summary
from services.ai_insights import (
    generate_bias_analysis, generate_common_ground, 
    generate_perspective_understanding, generate_live_insight, judge_message
)
from services.analytics import (
    get_session_history, get_impact_metrics, 
    get_conversation_timeline, get_debate_quality
)

app = FastAPI(title="DivergentUnity API", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    """Initialize database on startup"""
    init_db()


@app.get("/")
def read_root():
    """Health check endpoint"""
    return {"status": "ok", "message": "DivergentUnity API is running"}


@app.post("/api/conversation", response_model=ConversationResponse)
async def create_conversation(
    conversation: ConversationCreate,
    session: Session = Depends(get_session)
):
    """Create a new conversation"""
    db_conversation = Conversation(
        id=str(uuid.uuid4()),
        topic=conversation.topic,
        bridge_mode=conversation.bridge_mode,
        perspective_swap=conversation.perspective_swap
    )
    session.add(db_conversation)
    session.commit()
    session.refresh(db_conversation)
    
    return ConversationResponse(
        conversation_id=db_conversation.id,
        topic=db_conversation.topic,
        created_at=db_conversation.created_at
    )


@app.get("/api/conversation/{conversation_id}", response_model=ConversationDetail)
async def get_conversation(
    conversation_id: str,
    session: Session = Depends(get_session)
):
    """Get conversation details with full graph"""
    conversation = session.get(Conversation, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Get all utterances
    utterances = list(session.exec(
        select(Utterance).where(Utterance.conversation_id == conversation_id)
    ).all())
    
    # Build utterance responses with extracted values
    utterance_responses = []
    for utterance in utterances:
        # Get value nodes for this utterance
        value_nodes = session.exec(
            select(ValueNode).where(ValueNode.utterance_id == utterance.id)
        ).all()
        
        extracted_values = [
            ValueExtraction(
                value_type=v.value_type,
                description=v.description,
                importance=v.importance
            )
            for v in value_nodes
        ]
        
        utterance_responses.append(UtteranceResponse(
            utterance_id=utterance.id,
            speaker_name=utterance.speaker_name,
            text=utterance.text,
            sentiment=utterance.sentiment,
            tension_level=utterance.tension_level,
            empathy_level=utterance.empathy_level,
            extracted_values=extracted_values,
            judge_analysis=utterance.judge_analysis
        ))
    
    # Generate consensus map
    consensus_map = await generate_consensus_map(conversation_id, session)
    
    return ConversationDetail(
        conversation_id=conversation.id,
        topic=conversation.topic,
        created_at=conversation.created_at,
        utterances=utterance_responses,
        consensus_map=consensus_map
    )


@app.post("/api/conversation/{conversation_id}/utterance", response_model=UtteranceResponse)
@app.post("/api/conversations/{conversation_id}/utterances", response_model=UtteranceResponse)
async def add_utterance(
    conversation_id: str,
    utterance: UtteranceCreate,
    session: Session = Depends(get_session)
):
    """Add an utterance to a conversation"""
    # Check conversation exists
    conversation = session.get(Conversation, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Get conversation history for AI judge
    existing_utterances = session.exec(
        select(Utterance).where(Utterance.conversation_id == conversation_id)
    ).all()
    
    conversation_history = [
        {"speaker": u.speaker_name, "text": u.text}
        for u in existing_utterances
    ]
    
    # AI Judge analyzes the message
    judge_analysis = await judge_message(
        message=utterance.text,
        speaker=utterance.speaker_name,
        topic=conversation.topic,
        conversation_history=conversation_history
    )
    
    # Extract values from utterance using Gemini
    extraction_result = await extract_values_from_utterance(
        utterance.text, 
        utterance.speaker_name
    )
    
    # Create utterance
    db_utterance = Utterance(
        id=str(uuid.uuid4()),
        conversation_id=conversation_id,
        speaker_name=utterance.speaker_name,
        text=utterance.text,
        sentiment=extraction_result.get("sentiment", "neutral"),
        tension_level=0.0,
        empathy_level=0.0,
        judge_analysis=judge_analysis
    )
    session.add(db_utterance)
    session.commit()
    session.refresh(db_utterance)
    
    # Create value nodes
    extracted_values = []
    for value_data in extraction_result.get("values", []):
        value_node = ValueNode(
            id=str(uuid.uuid4()),
            conversation_id=conversation_id,
            utterance_id=db_utterance.id,
            value_type=value_data["type"],
            description=value_data["description"],
            importance=value_data["importance"],
            speaker_name=utterance.speaker_name
        )
        session.add(value_node)
        extracted_values.append(ValueExtraction(
            value_type=value_node.value_type,
            description=value_node.description,
            importance=value_node.importance
        ))
    
    session.commit()
    
    # Build/update value graph
    await build_value_graph(conversation_id, session)
    await calculate_importance_scores(conversation_id, session)
    
    # Find alignments
    await find_alignments(conversation_id, session)
    
    # Update metrics for all utterances
    await update_utterance_metrics(conversation_id, session)
    
    # Refresh to get updated metrics
    session.refresh(db_utterance)
    
    return UtteranceResponse(
        utterance_id=db_utterance.id,
        speaker_name=db_utterance.speaker_name,
        text=db_utterance.text,
        sentiment=db_utterance.sentiment,
        tension_level=db_utterance.tension_level,
        empathy_level=db_utterance.empathy_level,
        extracted_values=extracted_values,
        judge_analysis=judge_analysis
    )


@app.post("/api/compromise/{conversation_id}")
async def generate_compromise_endpoint(
    conversation_id: str,
    session: Session = Depends(get_session)
):
    """Generate AI compromise for a conversation"""
    conversation = session.get(Conversation, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    compromise = await generate_compromise(
        conversation_id, 
        conversation.topic, 
        session
    )
    
    # Return only the compromise text (compromise is a Pydantic model)
    return {"compromise_text": compromise.compromise_text if hasattr(compromise, 'compromise_text') else str(compromise)}


@app.post("/api/conversation/{conversation_id}/summary", response_model=SummaryResponse)
async def generate_summary_endpoint(
    conversation_id: str,
    session: Session = Depends(get_session)
):
    """Generate neutral summary of conversation"""
    conversation = session.get(Conversation, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    summary_data = await generate_summary(
        conversation_id,
        conversation.topic,
        session
    )
    
    return SummaryResponse(
        conversation_id=conversation_id,
        topic=conversation.topic,
        summary_text=summary_data["summary_text"],
        key_points=summary_data["key_points"],
        participant_perspectives=summary_data["participant_perspectives"]
    )


# Analytics Endpoints

@app.get("/api/analytics/sessions", response_model=List[SessionHistoryItem])
async def get_sessions(session: Session = Depends(get_session)):
    """List all conversation sessions"""
    return await get_session_history(session)


@app.get("/api/analytics/impact", response_model=ImpactMetrics)
async def get_impact(session: Session = Depends(get_session)):
    """Get platform-wide impact metrics"""
    return await get_impact_metrics(session)


@app.get("/api/analytics/conversation/{conversation_id}/timeline", response_model=List[TimelinePoint])
async def get_timeline(
    conversation_id: str,
    session: Session = Depends(get_session)
):
    """Get tension/empathy timeline for conversation"""
    conversation = session.get(Conversation, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    return await get_conversation_timeline(conversation_id, session)


@app.get("/api/analytics/conversation/{conversation_id}/quality", response_model=DebateQualityMetrics)
async def get_quality(
    conversation_id: str,
    session: Session = Depends(get_session)
):
    """Get debate quality metrics"""
    conversation = session.get(Conversation, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    return await get_debate_quality(conversation_id, session)


# AI Insights Endpoints

@app.get("/api/insights/{conversation_id}/biases")
async def get_bias_analysis(
    conversation_id: str,
    session: Session = Depends(get_session)
):
    """Get AI-powered bias analysis"""
    conversation = session.get(Conversation, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    utterances = [{"speaker": u.speaker_name, "text": u.text} for u in conversation.utterances]
    return await generate_bias_analysis(utterances, conversation.topic)


@app.get("/api/insights/{conversation_id}/common-ground")
async def get_common_ground_analysis(
    conversation_id: str,
    session: Session = Depends(get_session)
):
    """Get AI-powered common ground analysis"""
    conversation = session.get(Conversation, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    utterances = [{"speaker": u.speaker_name, "text": u.text} for u in conversation.utterances]
    return await generate_common_ground(utterances, conversation.topic)


@app.get("/api/insights/{conversation_id}/perspectives")
async def get_perspective_analysis(
    conversation_id: str,
    session: Session = Depends(get_session)
):
    """Get deep perspective understanding"""
    conversation = session.get(Conversation, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    utterances = [{"speaker": u.speaker_name, "text": u.text} for u in conversation.utterances]
    return await generate_perspective_understanding(utterances, conversation.topic)


@app.get("/api/insights/{conversation_id}/evidence")
async def get_evidence_aggregator(
    conversation_id: str,
    session: Session = Depends(get_session)
):
    """Get AI-generated evidence and news supporting each perspective"""
    conversation = session.get(Conversation, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    from services.ai_insights import generate_evidence_support
    
    utterances = [{"speaker": u.speaker_name, "text": u.text} for u in conversation.utterances]
    return await generate_evidence_support(utterances, conversation.topic)


@app.post("/api/insights/{conversation_id}/live")
async def get_live_insight(
    conversation_id: str,
    message: dict,
    session: Session = Depends(get_session)
):
    """Get real-time AI insight for live chat"""
    conversation = session.get(Conversation, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    history = [{"speaker": u.speaker_name, "text": u.text} for u in conversation.utterances]
    insight = await generate_live_insight(history, message.get("text", ""), message.get("speaker", ""), conversation.topic)
    return {"insight": insight}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
