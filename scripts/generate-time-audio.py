#!/usr/bin/env python3
"""
Automated Audio Generator for Russian Time Section
Uses Microsoft Edge Neural TTS (ru-RU-SvetlanaNeural) to generate crystal-clear,
native Russian audio files directly into public/audio/time/.

Usage:
  python3 scripts/generate-time-audio.py
  python3 scripts/generate-time-audio.py --force
"""

import os
import re
import sys
import asyncio
from pathlib import Path

try:
    import edge_tts
except ImportError:
    print("Error: edge-tts is not installed. Install via: pip3 install edge-tts")
    sys.exit(1)

VOICE = "ru-RU-SvetlanaNeural"
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
DATA_FILE = PROJECT_ROOT / "src" / "data" / "russianData.ts"
OUTPUT_DIR = PROJECT_ROOT / "public" / "audio" / "time"


def parse_time_phrases():
    """Extract Russian time items from russianData.ts"""
    if not DATA_FILE.exists():
        raise FileNotFoundError(f"Cannot find {DATA_FILE}")

    content = DATA_FILE.read_text(encoding="utf-8")
    time_match = re.search(r"const time:\s*PhraseItem\[\]\s*=\s*\[([\s\S]*?)\];", content)
    if not time_match:
        raise ValueError("Could not find 'const time: PhraseItem[] = [...]' in russianData.ts")

    time_block = time_match.group(1)
    russian_matches = re.findall(r"russian:\s*['\"]([^'\"]+)['\"]", time_block)
    return russian_matches


def get_audio_filename(russian_text: str) -> str:
    """Matches the exact filename logic in PronunciationButton.tsx"""
    clean_text = re.sub(r"[?.,!]", "", russian_text).strip().lower()
    return re.sub(r"\s+", "_", clean_text) + ".mp3"


async def generate_phrase_audio(sem, phrase: str, out_path: Path, force: bool = False):
    async with sem:
        if out_path.exists() and not force:
            print(f"  ⏭️  Skipping existing: {out_path.name}")
            return "skipped"

        try:
            communicate = edge_tts.Communicate(phrase, VOICE)
            await communicate.save(str(out_path))
            print(f"  ✅ Generated: {out_path.name}  (Text: '{phrase}')")
            return "success"
        except Exception as e:
            print(f"  ❌ Error generating '{phrase}': {e}")
            return "error"


async def main():
    force = "--force" in sys.argv
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    phrases = parse_time_phrases()
    print(f"🎙️  Found {len(phrases)} time phrases in russianData.ts")
    print(f"🗣️  Using Neural Voice: {VOICE}")
    print(f"📁 Destination: {OUTPUT_DIR.relative_to(PROJECT_ROOT)}/\n")

    sem = asyncio.Semaphore(4)
    tasks = []
    for phrase in phrases:
        filename = get_audio_filename(phrase)
        out_path = OUTPUT_DIR / filename
        tasks.append(generate_phrase_audio(sem, phrase, out_path, force=force))

    results = await asyncio.gather(*tasks)

    success_count = results.count("success")
    skip_count = results.count("skipped")
    err_count = results.count("error")

    print("\n" + "=" * 50)
    print(f"🎉 Done! {success_count} generated, {skip_count} skipped, {err_count} errors.")
    print("=" * 50)


if __name__ == "__main__":
    asyncio.run(main())
