import google.generativeai as genai
import os
import json
from typing import Dict, List, Any
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)


def get_gemini_model():
    """Get configured Gemini model"""
    return genai.GenerativeModel('gemini-2.5-flash-lite')


async def extract_values_from_utterance(utterance_text: str, speaker_name: str) -> Dict[str, Any]:
    """
    Extract underlying values and principles from an utterance using Gemini.
    
    Returns:
        {
            "values": [{"type": str, "description": str, "importance": float}],
            "sentiment": "positive|negative|neutral",
            "misunderstandings": [str]
        }
    """
    try:
        model = get_gemini_model()
        
        prompt = f"""Analyze this statement and extract underlying values/principles.
Statement: "{utterance_text}"
Speaker: {speaker_name}

Identify the core values being expressed. Valid value types are:
- safety: Protection, security, risk avoidance
- freedom: Liberty, autonomy, independence
- fairness: Justice, equality, equity
- tradition: Heritage, customs, proven methods
- progress: Innovation, change, advancement
- community: Collective good, solidarity, belonging
- autonomy: Self-determination, individual choice
- responsibility: Duty, accountability, obligation

Return ONLY a valid JSON object with this exact structure (no markdown, no code blocks):
{{
  "values": [
    {{
      "type": "one of the valid types above",
      "description": "brief explanation of how this value appears in the statement",
      "importance": 0.7
    }}
  ],
  "sentiment": "positive",
  "misunderstandings": []
}}

The importance should be between 0.0 and 1.0, with higher values for more central concerns.
Sentiment should be "positive", "negative", or "neutral".
Misunderstandings should list any apparent misconceptions or false assumptions."""

        response = model.generate_content(prompt)
        
        # Clean response text
        text = response.text.strip()
        # Remove markdown code blocks if present
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        
        result = json.loads(text)
        
        # Validate structure
        if "values" not in result:
            result["values"] = []
        if "sentiment" not in result:
            result["sentiment"] = "neutral"
        if "misunderstandings" not in result:
            result["misunderstandings"] = []
            
        return result
        
    except Exception as e:
        print(f"Error extracting values: {e}")
        # Fallback response
        return {
            "values": [{
                "type": "autonomy",
                "description": "General perspective expressed",
                "importance": 0.5
            }],
            "sentiment": "neutral",
            "misunderstandings": []
        }


async def detect_misunderstandings(utterances: List[Dict[str, str]]) -> List[str]:
    """
    Detect potential misunderstandings between speakers.
    
    Args:
        utterances: List of {"speaker": str, "text": str}
    
    Returns:
        List of misunderstanding descriptions
    """
    try:
        model = get_gemini_model()
        
        conversation = "\n".join([f"{u['speaker']}: {u['text']}" for u in utterances])
        
        prompt = f"""Analyze this conversation for misunderstandings or miscommunications between speakers.

Conversation:
{conversation}

Identify any places where speakers seem to be:
- Talking past each other
- Making false assumptions about the other's position
- Misinterpreting the other's intent
- Using the same words but meaning different things

Return ONLY a JSON array of strings (no markdown):
["misunderstanding 1", "misunderstanding 2"]

If there are no clear misunderstandings, return an empty array: []"""

        response = model.generate_content(prompt)
        text = response.text.strip()
        
        # Clean markdown
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        
        misunderstandings = json.loads(text)
        return misunderstandings if isinstance(misunderstandings, list) else []
        
    except Exception as e:
        print(f"Error detecting misunderstandings: {e}")
        return []
