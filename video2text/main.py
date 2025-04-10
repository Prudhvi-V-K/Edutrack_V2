from flask import Flask, jsonify, request
from vtt.whisper import WhisperTranscribe
from vtt.dl import get_audio_data
import json
from quiz_generator import QuizGenerator
from dotenv import load_dotenv
import os
from flask_cors import CORS
from pymongo import MongoClient
from datetime import datetime
import math

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})

# Initialize MongoDB client
mongo_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
client = MongoClient(mongo_uri)
db = client['video2text']
quizzes_collection = db['quizzes']

transcriber = WhisperTranscribe()

# Initialize QuizGenerator with API key
api_key = os.getenv('GEMINI_API_KEY')
if not api_key:
    raise ValueError("GEMINI_API_KEY environment variable is not set")
quiz_generator = QuizGenerator(api_key)

def load_prompt():
    with open('prompt.md', 'r') as file:
        return file.read()

def convert_int_keys_to_str(obj):
    if isinstance(obj, dict):
        return {str(key): convert_int_keys_to_str(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_int_keys_to_str(item) for item in obj]
    return obj

def generate_segment_quiz(transcription, segment_number, start_time, end_time):
    """Generate quiz for a specific segment of the video"""
    segment_info = f"Segment {segment_number} ({start_time}-{end_time} minutes)"
    questions = quiz_generator.generate_quizzes_for_video(transcription, num_questions=3)
    
    return {
        "segment_number": segment_number,
        "time_range": {
            "start": start_time,
            "end": end_time
        },
        "questions": questions
    }

@app.route("/ping", methods=["GET"])
def hello():
    return jsonify({"message": "pong"})

@app.route("/transcribe", methods=["POST"])
def transcribe():
    url = request.json.get("url")
    try:
        video_duration = int(request.json.get("duration", 0))  # Convert to integer
    except (ValueError, TypeError):
        return jsonify({
            "error": "Duration must be a valid number"
        }), 400
    
    # Validate input
    if not url:
        return jsonify({
            "error": "URL is required"
        }), 400
        
    if not video_duration or video_duration <= 0:
        return jsonify({
            "error": "Valid video duration (in minutes) is required"
        }), 400
    
    # Check if quiz already exists
    existing_quiz = quizzes_collection.find_one({"url": url})
    if existing_quiz:
        return jsonify({
            "message": "success",
            "details": "Quiz already exists for this URL"
        })
    
    audio = get_audio_data(url)
    # Convert generator to list
    transcriptions = list(transcriber.transcribe_audio(audio))
    
    # Calculate number of segments (10 minutes each)
    num_segments = max(1, math.ceil(video_duration / 10))  # Ensure at least 1 segment
    segment_size = len(transcriptions) // num_segments
    
    # Generate quizzes for each segment
    all_segment_quizzes = []
    for i in range(num_segments):
        start_idx = i * segment_size
        end_idx = start_idx + segment_size if i < num_segments - 1 else len(transcriptions)
        
        segment_transcriptions = transcriptions[start_idx:end_idx]
        segment_text = "\n".join(segment_transcriptions)
        
        start_time = i * 10
        end_time = min((i + 1) * 10, video_duration)
        
        segment_quiz = generate_segment_quiz(
            segment_text,
            i + 1,
            start_time,
            end_time
        )
        all_segment_quizzes.append(segment_quiz)
    
    # Convert integer keys to strings before storing in MongoDB
    all_segment_quizzes = convert_int_keys_to_str(all_segment_quizzes)
    
    # Store quizzes in MongoDB
    quiz_document = {
        "url": url,
        "video_duration": video_duration,
        "num_segments": num_segments,
        "segment_quizzes": all_segment_quizzes,
        "created_at": datetime.utcnow()
    }
    quizzes_collection.insert_one(quiz_document)

    return jsonify({
        "message": "success",
        "details": f"Generated {num_segments} quizzes for video segments successfully"
    })

@app.route("/quiz", methods=["POST"])
def get_quiz():
    url = request.json.get("url")
    if not url:
        return jsonify({"error": "URL is required"}), 400
    
    # Check if quiz exists in database
    existing_quiz = quizzes_collection.find_one({"url": url})
    
    if existing_quiz:
        # Remove MongoDB _id field as it's not JSON serializable
        existing_quiz.pop('_id', None)
        return jsonify(existing_quiz)
    
    return jsonify({
        "error": "No quiz found for this URL. Please use /transcribe endpoint first."
    }), 404

if __name__ == "__main__":
    app.run(debug=True, port=5000, host="0.0.0.0")