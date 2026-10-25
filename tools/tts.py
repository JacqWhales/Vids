"""Synthesizes voice lines with Piper.

Usage: python3 tools/tts.py jobs.json voices_dir
jobs.json is a list of {out, voice, text, length, pitch}. Each line is rendered with Piper, pitch-shifted
with ffmpeg (keeping its speed) and written to `out` as raw 48 kHz mono float32. Existing outputs are skipped.
"""
import json
import os
import subprocess
import sys
import tempfile
import wave

from piper import PiperVoice, SynthesisConfig


def main():
    jobs_path, voices_dir = sys.argv[1], sys.argv[2]
    with open(jobs_path) as f:
        jobs = [j for j in json.load(f) if not os.path.exists(j["out"])]
    voices = {}
    for i, job in enumerate(jobs, 1):
        name = job["voice"]
        if name not in voices:
            voices[name] = PiperVoice.load(os.path.join(voices_dir, name + ".onnx"))
        voice = voices[name]
        with tempfile.NamedTemporaryFile(suffix=".wav") as tmp:
            with wave.open(tmp.name, "wb") as wav:
                voice.synthesize_wav(job["text"], wav, SynthesisConfig(length_scale=job["length"]))
            rate = voice.config.sample_rate
            p = job["pitch"]
            filt = f"asetrate={rate * p:.0f},aresample=48000,atempo={1 / p:.5f}"
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp.name, "-af", filt,
                            "-ac", "1", "-ar", "48000", "-f", "f32le", job["out"] + ".part"], check=True)
            os.replace(job["out"] + ".part", job["out"])
        print(f"tts {i}/{len(jobs)}: {job['text'][:60]}", flush=True)


if __name__ == "__main__":
    main()
