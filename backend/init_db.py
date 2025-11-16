"""
Initial database setup and verification script.
Run this to initialize the database and verify the setup.
"""

from database import init_db, get_session
from models import Conversation, Utterance, ValueNode, RelationEdge, AlignmentEdge
from sqlmodel import select
import sys

def main():
    print("🔧 Initializing DivergentUnity Database...")
    print()
    
    try:
        # Initialize database
        init_db()
        print("✅ Database tables created successfully")
        
        # Verify tables
        with next(get_session()) as session:
            # Check each table
            conversations = session.exec(select(Conversation)).all()
            print(f"✅ Conversation table: {len(conversations)} records")
            
            utterances = session.exec(select(Utterance)).all()
            print(f"✅ Utterance table: {len(utterances)} records")
            
            values = session.exec(select(ValueNode)).all()
            print(f"✅ ValueNode table: {len(values)} records")
            
            relations = session.exec(select(RelationEdge)).all()
            print(f"✅ RelationEdge table: {len(relations)} records")
            
            alignments = session.exec(select(AlignmentEdge)).all()
            print(f"✅ AlignmentEdge table: {len(alignments)} records")
        
        print()
        print("🎉 Database setup complete!")
        print()
        print("Next steps:")
        print("1. Make sure GEMINI_API_KEY is set in .env")
        print("2. Start the server: python -m uvicorn main:app --reload --port 8000")
        print("3. Visit http://localhost:8000/docs for API documentation")
        
    except Exception as e:
        print(f"❌ Error during setup: {e}")
        print()
        print("Troubleshooting:")
        print("- Make sure you're in the backend directory")
        print("- Activate virtual environment: source venv/bin/activate")
        print("- Install dependencies: pip install -r requirements.txt")
        sys.exit(1)

if __name__ == "__main__":
    main()
