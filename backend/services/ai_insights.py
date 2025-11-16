import google.generativeai as genai
import os
import json
from typing import Dict, List, Any
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)


def get_gemini_model():
    """Get Gemini 2.5 Flash Lite model"""
    return genai.GenerativeModel('gemini-2.5-flash-lite')


async def generate_bias_analysis(utterances: List[Dict[str, str]], topic: str) -> Dict[str, Any]:
    """Generate AI-powered bias analysis for the conversation"""
    try:
        model = get_gemini_model()
        
        conversation = "\n\n".join([f"{u['speaker']}: {u['text']}" for u in utterances])
        
        prompt = f"""You are analyzing a REAL debate about "{topic}". Read the actual statements below and give SPECIFIC analysis.

ACTUAL CONVERSATION:
{conversation}

For EACH speaker above, provide:

1. SPECIFIC cognitive biases you can see in THEIR ACTUAL WORDS (not generic descriptions)
   - Quote the exact phrase that shows the bias
   - Explain HOW that specific quote demonstrates the bias
   
2. SPECIFIC assumptions THEY are making in THIS conversation
   - Must be based on what they ACTUALLY said
   - Be concrete and specific to this topic

3. SPECIFIC blind spots - what are they NOT considering that the OTHER speaker IS considering?
   - Must be derived from comparing their actual statements

CRITICAL: Use DIRECT QUOTES from the conversation. Be SPECIFIC to this exact debate about {topic}.

Return ONLY valid JSON (no markdown):
{{
  "speaker_analyses": [
    {{
      "speaker": "exact name from conversation",
      "biases": [
        {{
          "type": "Specific Bias Name",
          "direct_quote": "EXACT quote from their statement",
          "evidence": "How this quote shows the bias",
          "explanation": "Why this matters in the context of {topic}"
        }}
      ],
      "assumptions": [
        {{
          "assumption": "specific assumption they're making",
          "based_on": "which part of their statement shows this"
        }}
      ],
      "blind_spots": [
        {{
          "blind_spot": "what they're missing",
          "other_speaker_covers": "how the other speaker addresses this"
        }}
      ]
    }}
  ]
}}"""

        response = model.generate_content(prompt)
        text = response.text.strip()
        
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        
        return json.loads(text)
        
    except Exception as e:
        print(f"Error generating bias analysis: {e}")
        return {"speaker_analyses": []}


async def generate_common_ground(utterances: List[Dict[str, str]], topic: str) -> Dict[str, Any]:
    """Generate AI-powered common ground analysis"""
    try:
        model = get_gemini_model()
        
        conversation = "\n\n".join([f"{u['speaker']}: {u['text']}" for u in utterances])
        
        prompt = f"""You are finding REAL common ground in this debate about "{topic}". Use ACTUAL QUOTES.

ACTUAL CONVERSATION:
{conversation}

Find:

1. Shared values that BOTH speakers express (even if worded differently)
   - Use DIRECT QUOTES showing how each person expresses this value
   - Be SPECIFIC to {topic}
   
2. Concrete areas where they ACTUALLY agree (not hypothetical)
   - Quote the specific statements that align
   - Calculate strength based on how explicitly they agree
   
3. Compatible goals they share for solving {topic}
   - Must be derived from what they ACTUALLY said

CRITICAL: Use DIRECT QUOTES. Don't make up generic values - find what's ACTUALLY in their words.

Return ONLY valid JSON (no markdown):
{{
  "shared_values": [
    {{
      "value": "specific value name",
      "speaker_quotes": {{
        "speaker1_name": "EXACT quote showing this value",
        "speaker2_name": "EXACT quote showing same value"
      }},
      "strength": 0.85,
      "analysis": "why these quotes show the same underlying value"
    }}
  ],
  "agreements": [
    {{
      "area": "specific area of agreement",
      "quote1": "exact quote from speaker 1",
      "quote2": "exact quote from speaker 2",  
      "strength": 0.75,
      "explanation": "how these align on {topic}"
    }}
  ],
  "compatible_goals": [
    {{
      "goal": "specific goal",
      "evidence": "quotes showing both want this"
    }}
  ]
}}"""

        response = model.generate_content(prompt)
        text = response.text.strip()
        
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        
        return json.loads(text)
        
    except Exception as e:
        print(f"Error generating common ground: {e}")
        return {"shared_values": [], "agreements": [], "compatible_goals": []}


async def generate_perspective_understanding(utterances: List[Dict[str, str]], topic: str) -> Dict[str, Any]:
    """Generate deep understanding of each perspective"""
    try:
        model = get_gemini_model()
        
        conversation = "\n\n".join([f"{u['speaker']}: {u['text']}" for u in utterances])
        
        prompt = f"""Deep analysis of ACTUAL perspectives on "{topic}". Use what they REALLY said.

ACTUAL CONVERSATION:
{conversation}

For EACH speaker above:

1. What worldview does THEIR ACTUAL STATEMENT reveal?
   - Quote the phrases that show their fundamental beliefs
   - Be specific to {topic}
   
2. What are they REALLY afraid of? (read between the lines of what they said)
   - What negative outcome do their words suggest they fear?
   - Must be grounded in their actual statement
   
3. What are they trying to PROTECT based on their words?
   - What do they value that they don't want to lose?
   - Infer from their actual language
   
4. What life experiences might lead someone to say what they said?
   - Be specific and realistic
   - Connect to the actual content of {topic}
   
5. CONCRETE strategies for the other speaker to connect with them
   - Based on what they ACTUALLY care about (from their statement)
   - Address their real concerns about {topic}

CRITICAL: Ground everything in their ACTUAL words. No generic analysis.

Return ONLY valid JSON (no markdown):
{{
  "perspectives": [
    {{
      "speaker": "exact name",
      "key_quotes": ["quote 1", "quote 2"],
      "worldview": "what their actual words reveal",
      "core_fears": [
        {{
          "fear": "specific fear",
          "evidence_in_text": "which part of their statement shows this"
        }}
      ],
      "protecting": {{
        "what": "what they're protecting",
        "why_it_matters": "based on their statement about {topic}"
      }},
      "likely_experiences": "realistic background that would lead to this view on {topic}",
      "how_other_can_connect": [
        {{
          "strategy": "concrete action",
          "addresses": "which of their concerns this addresses",
          "example_language": "actual words the other speaker could use"
        }}
      ]
    }}
  ]
}}"""

        response = model.generate_content(prompt)
        text = response.text.strip()
        
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        
        return json.loads(text)
        
    except Exception as e:
        print(f"Error generating perspective understanding: {e}")
        return {"perspectives": []}


async def generate_live_insight(conversation_history: List[Dict[str, str]], latest_message: str, speaker: str, topic: str) -> str:
    """Generate real-time insight for live chat"""
    try:
        model = get_gemini_model()
        
        history = "\n".join([f"{msg['speaker']}: {msg['text']}" for msg in conversation_history[-5:]])
        
        prompt = f"""You're analyzing a live debate about "{topic}".

{speaker} just said: "{latest_message}"

Recent context:
{history}

Provide ONE insightful observation (1-2 sentences max):
- What specific value or fear this reveals about {topic}
- OR which cognitive pattern you see in this specific statement  
- OR a concrete connection to what another speaker said
- OR a specific bridge that could be built

Be SPECIFIC to their actual words and {topic}. No generic insights."""

        response = model.generate_content(prompt)
        return response.text.strip()
        
    except Exception as e:
        print(f"Error generating live insight: {e}")
        return "Processing..."


async def generate_evidence_support(utterances: List[Dict[str, str]], topic: str) -> Dict[str, Any]:
    """Generate evidence and news articles supporting each perspective"""
    try:
        model = get_gemini_model()
        
        conversation = "\n\n".join([f"{u['speaker']}: {u['text']}" for u in utterances])
        
        prompt = f"""You are a research assistant finding evidence for a debate about "{topic}".

ACTUAL DEBATE:
{conversation}

For EACH speaker above, generate:

1. **Key Claims** they are making (extract 2-3 specific claims)
2. **Supporting Evidence** for each claim:
   - Statistical data or research findings (cite realistic sources)
   - News headlines that would support their view (create realistic headlines)
   - Expert quotes or studies (attribute to real-sounding sources)
3. **Counter-Evidence** they should be aware of:
   - Facts or data that challenge their position
   - Alternative perspectives from credible sources

Format as JSON:
{{
  "evidence_by_speaker": {{
    "Speaker Name": {{
      "claims": ["Claim 1", "Claim 2"],
      "supporting_evidence": [
        {{
          "type": "statistic|news|study|expert",
          "headline": "Brief headline or finding",
          "source": "Source name",
          "summary": "1-2 sentence explanation",
          "relevance": "Why this supports their argument"
        }}
      ],
      "counter_evidence": [
        {{
          "type": "statistic|news|study|expert",
          "headline": "Brief headline",
          "source": "Source name",
          "summary": "1-2 sentence challenge to their view",
          "relevance": "What they should consider"
        }}
      ]
    }}
  }},
  "neutral_context": {{
    "background": "1-2 sentence context about {topic}",
    "key_facts": ["Fact 1", "Fact 2", "Fact 3"],
    "recent_developments": ["Recent news 1", "Recent news 2"]
  }}
}}

Make evidence SPECIFIC to {topic} and their ACTUAL arguments."""

        response = model.generate_content(prompt)
        text = response.text.strip()
        
        # Clean JSON
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        
        import json
        return json.loads(text)
        
    except Exception as e:
        print(f"Error generating evidence: {e}")
        return {
            "evidence_by_speaker": {},
            "neutral_context": {
                "background": "Evidence aggregation in progress...",
                "key_facts": [],
                "recent_developments": []
            }
        }


async def judge_message(message: str, speaker: str, topic: str, conversation_history: List[Dict[str, str]]) -> Dict[str, Any]:
    """AI Judge analyzes message for bias, factual accuracy, and civility"""
    try:
        model = get_gemini_model()
        
        recent_context = "\n".join([f"{msg['speaker']}: {msg['text']}" for msg in conversation_history[-5:]])
        
        prompt = f"""You are an AI Judge monitoring a debate about "{topic}". Analyze this message for issues:

SPEAKER: {speaker}
MESSAGE: "{message}"

RECENT CONTEXT:
{recent_context}

Analyze for:

1. **BIAS DETECTION** - Is this message showing:
   - Emotional reasoning without logic?
   - Strawman arguments (misrepresenting the other side)?
   - Ad hominem attacks (attacking person, not ideas)?
   - False dichotomies (only presenting 2 options when more exist)?
   - Confirmation bias (only seeing evidence that supports their view)?
   
2. **FACTUAL ACCURACY** - Check for:
   - Specific claims that may be incorrect or misleading
   - Overgeneralizations ("Everyone knows...", "Nobody would...")
   - Unsubstantiated statistics or facts
   - Logical fallacies
   
3. **CIVILITY CHECK** - Flag if message contains:
   - Personal attacks or insults
   - Dismissive language
   - Condescending tone
   - Inflammatory rhetoric
   - Disrespectful framing

For EACH issue found, provide:
- Exact quote showing the problem
- Why it's problematic
- How to rephrase constructively

Return ONLY valid JSON (no markdown):
{{
  "has_issues": true/false,
  "severity": "none|low|medium|high",
  "bias_issues": [
    {{
      "type": "Specific bias name",
      "quote": "exact problematic phrase",
      "explanation": "why this is biased",
      "better_approach": "how to say it fairly"
    }}
  ],
  "factual_issues": [
    {{
      "claim": "the questionable claim",
      "problem": "what's wrong with it",
      "correction": "more accurate way to frame it"
    }}
  ],
  "civility_issues": [
    {{
      "quote": "uncivil phrase",
      "problem": "why it's uncivil",
      "reframe": "respectful alternative"
    }}
  ],
  "overall_assessment": "brief summary of message quality"
}}

Be strict but fair. If the message is fine, return empty arrays and severity: "none"."""

        response = model.generate_content(prompt)
        text = response.text.strip()
        
        # Clean JSON
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        
        return json.loads(text)
        
    except Exception as e:
        print(f"Error in judge_message: {e}")
        return {
            "has_issues": False,
            "severity": "none",
            "bias_issues": [],
            "factual_issues": [],
            "civility_issues": [],
            "overall_assessment": "Analysis unavailable"
        }
