from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import whisper
import os
import subprocess

app = Flask(__name__, static_folder="frontend")
CORS(app)  # Habilitar CORS para todas las rutas

def download_audio(video_url):
    """
    Descarga el audio de un video de YouTube usando yt-dlp.
    """
    audio_path = "audio.mp3"  # Ruta donde se guardará el archivo descargado
    command = [
        "yt-dlp",               # Llamada a yt-dlp
        "-f", "bestaudio",      # Selecciona el mejor stream de audio
        "--extract-audio",      # Extrae solo el audio
        "--audio-format", "mp3",  # Convierte el audio a formato mp3
        "--output", audio_path, # Especifica la ruta de salida
        video_url               # URL del video de YouTube
    ]

    try:
        subprocess.run(command, check=True)  # Ejecuta el comando
        return audio_path  # Retorna la ruta del archivo descargado
    except subprocess.CalledProcessError as e:
        raise ValueError(f"Error al descargar el audio con yt-dlp: {str(e)}")

@app.route("/generate", methods=["POST"])
def generate():
    data = request.json
    video_url = data.get("videoUrl")
    print("URL recibida:", video_url)  # Log para confirmar el enlace

    if not video_url:
        return jsonify({"error": "URL no proporcionada"}), 400

    try:
        # Descargar el audio usando yt-dlp
        print("Descargando audio...")
        audio_path = download_audio(video_url)
        print("Audio descargado en:", audio_path)

        # Transcribir el audio usando Whisper
        print("Transcribiendo audio...")
        model = whisper.load_model("tiny")  # tiny para menos recursos
        result = model.transcribe(audio_path, language="es")
        
        # Eliminar el archivo de audio después de transcribir
        os.remove(audio_path)

        print("Subtítulos generados")
        return jsonify({"subtitles": result["segments"]})
    except Exception as e:
        print("Error procesando la solicitud:", str(e))  # Imprime el error en la consola
        return jsonify({"error": str(e)}), 500

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    if path and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, "index.html")

if __name__ == "__main__":
    app.run(debug=True)
