import google.generativeai as genai
import json
import os
from typing import List, Dict, Any
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class QuizGenerator:
    def __init__(self, api_key: str):
        """Initialize the QuizGenerator with Gemini API key."""
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-1.5-pro')  # Ensure model name is correct

    def load_prompt_template(self) -> str:
        """Load the prompt template from prompt.md."""
        with open('prompt.md', 'r', encoding='utf-8') as file:
            return file.read()
    
    def generate_quiz(self, transcription_text: str, num_questions: int = 3) -> Dict[str, Any]:
        """
        Generate quiz questions from transcription text using Gemini API.
        
        Args:
            transcription_text (str): The text to generate questions from
            num_questions (int): Number of questions to generate
            
        Returns:
            Dict containing the generated questions in JSON format
        """
        # Load and prepare the prompt
        prompt_template = self.load_prompt_template()
        prompt = prompt_template.replace("[INSERT TRANSCRIPTION HERE]", transcription_text)
        
        # Add instruction for number of questions
        prompt += f"\n\nGenerate exactly {num_questions} questions."
      
        try:
            # Generate response from Gemini
            response = self.model.generate_content(prompt)
            
            # Extract JSON from response
            # The response might include markdown code blocks, so we need to extract the JSON
            response_text = response.text
            
            # Find JSON content between json and

            start_idx = response_text.find('```json')
            end_idx = response_text.find('```', start_idx + 7)
            
            if start_idx != -1 and end_idx != -1:
                json_str = response_text[start_idx + 7:end_idx].strip()
            else:
                # If no code blocks found, try to find JSON directly
                json_str = response_text.strip()
            
            # Parse JSON
            quiz_data = json.loads(json_str)
            return quiz_data
            
        except Exception as e:
            print(f"Error generating quiz: {str(e)}")
            return {"questions": []}

    def split_transcription(self, transcription: str, words_per_minute: int = 150, interval_minutes: int = 10) -> List[str]:
        """
        Splits a transcription into segments of approximately 10 minutes.
        
        Args:
            transcription (str): The full transcription text.
            words_per_minute (int): Approximate words spoken per minute.
            interval_minutes (int): Number of minutes per segment.
        
        Returns:
            List of transcription segments.
        """
        words = transcription.split()  # Split text into words
        chunk_size = words_per_minute * interval_minutes  # Words per 10 min
        segments = [" ".join(words[i:i + chunk_size]) for i in range(0, len(words), chunk_size)]
        return segments

    def generate_quizzes_for_video(self, transcription: str, num_questions: int = 3) -> Dict[int, Dict]:
        """
        Generates quizzes for each 10-minute segment of the video transcription.

        Args:
            transcription (str): Full transcription text of the video.
            num_questions (int): Number of questions per quiz.

        Returns:
            Dictionary mapping segment number to quiz questions.
        """
        segments = self.split_transcription(transcription)
        quizzes = {}

        for idx, segment in enumerate(segments):
            print(f"Generating quiz for segment {idx + 1}...")
            quizzes[idx + 1] = self.generate_quiz(segment, num_questions)

        return quizzes

def main():
    # Get API key from environment variable
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        print("Please set GEMINI_API_KEY environment variable in .env file")
        print("You can get an API key from: https://makersuite.google.com/app/apikey")
        return
    print(f"API Key: {api_key}")
    # Example usage
    generator = QuizGenerator(api_key)
    
    # Example transcription text
    transcription = """
    The Industrial Revolution was a period of major industrialization and innovation during the late 18th and early 19th centuries. 
    It began in Great Britain and quickly spread to Western Europe and North America. 
    Key innovations included the steam engine, textile manufacturing, and iron production. 
    This period marked a major turning point in human history, as it led to significant social and economic changes.
    """
    
    # Generate quiz
    quiz = generator.generate_quiz(transcription)
    
    # Print the generated quiz
    print(json.dumps(quiz, indent=2))

if __name__ == "__main__":
    main()