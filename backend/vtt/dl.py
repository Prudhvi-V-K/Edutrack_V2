import os
from io import BytesIO

import yt_dlp
from pydub import AudioSegment


def get_audio_data(url: str) -> AudioSegment | None:
    try:
        ydl_opts = {
            "format": "bestaudio/best",
            "extract_audio": True,
            "outtmpl": "videos/%(title)s.%(ext)s",
            "noplaylist": True,
            "quiet": True,
            "no_warnings": True,
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            print(f"Downloading audio from URL: {url}")
            info_dict = ydl.extract_info(url, download=True)
            if not info_dict:
                print("Failed to extract video information")
                return None
                
            print(f"Successfully downloaded video: {info_dict['title']}")
            audio_path = f"videos/{info_dict['title']}.{info_dict['audio_ext']}"
            print(f"Converting audio file: {audio_path}")
            
            audio = convert_to_audio(audio_path, info_dict["audio_ext"])
            if audio is None:
                print("Failed to convert audio file")
                return None
                
            print("Audio conversion successful")
            return audio

    except Exception as e:
        print(f"An error occurred in get_audio_data: {str(e)}")
        return None


def convert_to_audio(filename: str, ext: str) -> AudioSegment | None:
    try:
        with open(filename, "rb") as f:
            content = BytesIO(f.read())

        os.remove(filename)

        print(f"Converting audio to required format")
        audio = AudioSegment.from_file(content, format=ext)
        return audio
    except Exception as e:
        print(f"An error occurred in convert_to_audio: {str(e)}")
        return None
