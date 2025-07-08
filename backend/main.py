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

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})

mongo_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
client = MongoClient(mongo_uri)
db = client['video2text']
quizzes_collection = db['quizzes']

transcriber = WhisperTranscribe()

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
    quiz_data = quiz_generator.generate_quiz(transcription, num_questions=3)
    
    if not isinstance(quiz_data, dict) or 'questions' not in quiz_data:
        quiz_data = {"questions": []}
    
    return {
        "segment_number": segment_number,
        "time_range": {
            "start": start_time,
            "end": end_time
        },
        "questions": quiz_data["questions"] 
    }

@app.route("/ping", methods=["GET"])
def hello():
    return jsonify({"message": "pong"})

@app.route("/transcribe", methods=["POST"])
def transcribe():
    url = request.json.get("url")
    try:
        video_duration = int(request.json.get("duration", 0)) 
    except (ValueError, TypeError):
        return jsonify({
            "error": "Duration must be a valid number"
        }), 400
    
    if not url:
        return jsonify({
            "error": "URL is required"
        }), 400
        
    if not video_duration or video_duration <= 0:
        return jsonify({
            "error": "Valid video duration (in minutes) is required"
        }), 400
    
    existing_quiz = quizzes_collection.find_one({"url": url})
    if existing_quiz:
        return jsonify({
            "message": "success",
            "details": "Quiz already exists for this URL"
        })
    
    print(f"Processing video from URL: {url}")
    audio = get_audio_data(url)
    if audio is None:
        return jsonify({
            "error": "Failed to download or process audio from the video"
        }), 500
    
    print("Audio downloaded successfully, starting transcription...")
   
    transcriptions = list(transcriber.transcribe_audio(audio))
    
    if not transcriptions:
        return jsonify({
            "error": "Failed to transcribe audio"
        }), 500
    
    print(f"Transcription completed successfully. Number of chunks: {len(transcriptions)}")
    
    num_segments = max(1, math.ceil(video_duration / 10))  
    segment_size = len(transcriptions) // num_segments
    
    all_segment_quizzes = []
    for i in range(num_segments):
        start_idx = i * segment_size
        end_idx = start_idx + segment_size if i < num_segments - 1 else len(transcriptions)
        
        segment_transcriptions = transcriptions[start_idx:end_idx]
        segment_text = "\n".join(segment_transcriptions)
        
        start_time = i * 10
        end_time = min((i + 1) * 10, video_duration)
        
        print(f"Generating quiz for segment {i + 1} ({start_time}-{end_time} minutes)")
        segment_quiz = generate_segment_quiz(
            segment_text,
            i + 1,
            start_time,
            end_time
        )
        all_segment_quizzes.append(segment_quiz)
    
    all_segment_quizzes = convert_int_keys_to_str(all_segment_quizzes)
    
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
    
    existing_quiz = quizzes_collection.find_one({"url": url})
    
    if existing_quiz:
     
        existing_quiz.pop('_id', None)
        return jsonify(existing_quiz)
    
    return jsonify({
        "error": "No quiz found for this URL. Please use /transcribe endpoint first."
    }), 404

if __name__ == "__main__":
    try:
        app.run(debug=True, port=5000, host="0.0.0.0")
    except KeyboardInterrupt:
        print("\nShutting down server...")
       
        exit(0)