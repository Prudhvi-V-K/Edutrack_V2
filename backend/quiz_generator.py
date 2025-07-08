import google.generativeai as genai
import json
import os
from typing import List, Dict, Any
from dotenv import load_dotenv

load_dotenv()

class QuizGenerator:
    def __init__(self, api_key: str):
        
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-1.5-flash')  

    def load_prompt_template(self) -> str:
        
        with open('prompt.md', 'r', encoding='utf-8') as file:
            return file.read()
    
    def generate_quiz(self, transcription_text: str, num_questions: int = 3) -> Dict[str, Any]:
        
        
        prompt_template = self.load_prompt_template()
        prompt = prompt_template.replace("[INSERT TRANSCRIPTION HERE]", transcription_text)
        
        prompt += f"\n\nGenerate exactly {num_questions} questions."
      
        try:
        
            response = self.model.generate_content(prompt)
            
            response_text = response.text
            
            
            start_idx = response_text.find('```json')
            end_idx = response_text.find('```', start_idx + 7)
            
            if start_idx != -1 and end_idx != -1:
                json_str = response_text[start_idx + 7:end_idx].strip()
            else:
                
                json_str = response_text.strip()
            
            
            quiz_data = json.loads(json_str)
            
            
            if not isinstance(quiz_data, dict):
                quiz_data = {"questions": []}
            elif 'questions' not in quiz_data:
                quiz_data = {"questions": []}
            elif not isinstance(quiz_data['questions'], list):
                quiz_data['questions'] = []
            
            return quiz_data
            
        except Exception as e:
            print(f"Error generating quiz: {str(e)}")
            return {"questions": []}

    def split_transcription(self, transcription: str, words_per_minute: int = 150, interval_minutes: int = 10) -> List[str]:
        
        words = transcription.split()  # Split text into words
        chunk_size = words_per_minute * interval_minutes  # Words per 10 min
        segments = [" ".join(words[i:i + chunk_size]) for i in range(0, len(words), chunk_size)]
        return segments

    def generate_quizzes_for_video(self, transcription: str, num_questions: int = 3) -> Dict[int, Dict]:
        
        segments = self.split_transcription(transcription)
        quizzes = {}

        for idx, segment in enumerate(segments):
            print(f"Generating quiz for segment {idx + 1}...")
            quizzes[idx + 1] = self.generate_quiz(segment, num_questions)

        return quizzes

def main():
    
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        print("Please set GEMINI_API_KEY environment variable in .env file")
        print("You can get an API key from: https://makersuite.google.com/app/apikey")
        return
    print(f"API Key: {api_key}")
    
    generator = QuizGenerator(api_key)
    
    transcription = """
    The Industrial Revolution was a period of major industrialization and innovation during the late 18th and early 19th centuries. 
    This period marked a major turning point in human history, as it led to significant social and economic changes.
    """
    
    
    quiz = generator.generate_quiz(transcription)
    
    
    print(json.dumps(quiz, indent=2))

if __name__ == "__main__":
    main()