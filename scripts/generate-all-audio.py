#!/usr/bin/env python3
"""
Master Audio Generator for Basic Russian (basicrussian.org)
Uses Microsoft Edge Neural TTS (ru-RU-SvetlanaNeural) to generate crystal-clear,
native studio-quality Russian audio files for the entire application:
  - Alphabet (33 letters)
  - Examples (33 letter example words)
  - Basic Phrases (20 everyday phrases)
  - Numbers (30 numbers from 0 to 1,000)
  - Common Words (38 essential vocabulary words)
  - Telling Time (34 time expressions and hours)

Usage:
  python3 scripts/generate-all-audio.py           # Generates all missing or updated files
  python3 scripts/generate-all-audio.py --force   # Overwrites all existing files with new neural audio
  python3 scripts/generate-all-audio.py --category alphabet
"""

import os
import re
import sys
import json
import asyncio
import unicodedata
from datetime import datetime
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
AUDIO_DIR = PROJECT_ROOT / "public" / "audio"
INDEX_FILE = AUDIO_DIR / "index.json"


def normalize_text(text: str) -> str:
    """Normalize unicode to standard NFC form"""
    return unicodedata.normalize("NFC", text.strip())


def get_audio_filename(text: str) -> str:
    """Matches the exact filename logic in PronunciationButton.tsx"""
    clean_text = re.sub(r"[?.,!]", "", text).strip().lower()
    clean_text = unicodedata.normalize("NFC", clean_text)
    return re.sub(r"\s+", "_", clean_text) + ".mp3"


def parse_data():
    """Extract all curriculum sections from russianData.ts"""
    if not DATA_FILE.exists():
        raise FileNotFoundError(f"Cannot find {DATA_FILE}")

    content = DATA_FILE.read_text(encoding="utf-8")

    # 1. Alphabet & Examples
    alpha_match = re.search(r"const alphabet:\s*AlphabetItem\[\]\s*=\s*\[([\s\S]*?)\];", content)
    if not alpha_match:
        raise ValueError("Could not find alphabet in russianData.ts")
    alpha_block = alpha_match.group(1)

    letters = [normalize_text(m) for m in re.findall(r"letter:\s*['\"]([^'\"]+)['\"]", alpha_block)]
    examples = [normalize_text(m) for m in re.findall(r"russianWord:\s*['\"]([^'\"]+)['\"]", alpha_block)]

    # 2. Basic Phrases
    phrases_match = re.search(r"const basicPhrases:\s*PhraseItem\[\]\s*=\s*\[([\s\S]*?)\];", content)
    phrases_block = phrases_match.group(1) if phrases_match else ""
    phrases = [normalize_text(m) for m in re.findall(r"russian:\s*['\"]([^'\"]+)['\"]", phrases_block)]

    # 3. Numbers
    numbers_match = re.search(r"const numbers:\s*PhraseItem\[\]\s*=\s*\[([\s\S]*?)\];", content)
    numbers_block = numbers_match.group(1) if numbers_match else ""
    numbers = [normalize_text(m) for m in re.findall(r"russian:\s*['\"]([^'\"]+)['\"]", numbers_block)]

    # 4. Common Words
    words_match = re.search(r"const commonWords:\s*PhraseItem\[\]\s*=\s*\[([\s\S]*?)\];", content)
    words_block = words_match.group(1) if words_match else ""
    words = [normalize_text(m) for m in re.findall(r"russian:\s*['\"]([^'\"]+)['\"]", words_block)]

    # 5. Telling Time
    time_match = re.search(r"const time:\s*PhraseItem\[\]\s*=\s*\[([\s\S]*?)\];", content)
    time_block = time_match.group(1) if time_match else ""
    time_phrases = [normalize_text(m) for m in re.findall(r"russian:\s*['\"]([^'\"]+)['\"]", time_block)]

    categories = {
        "alphabet": [],
        "examples": [],
        "phrases": [],
        "numbers": [],
        "words": [],
        "time": []
    }

    # Build items for alphabet (special spoken names for signs)
    for letter in letters:
        lower_l = letter.lower()
        if lower_l == "ъ":
            spoken = "твёрдый знак"
        elif lower_l == "ь":
            spoken = "мягкий знак"
        else:
            spoken = lower_l

        categories["alphabet"].append({
            "text": letter,
            "spoken": spoken,
            "filename": f"{lower_l}.mp3"
        })

    # Examples
    for ex in examples:
        categories["examples"].append({
            "text": ex,
            "spoken": ex,
            "filename": get_audio_filename(ex)
        })

    # Phrases
    for phrase in phrases:
        categories["phrases"].append({
            "text": phrase,
            "spoken": phrase,
            "filename": get_audio_filename(phrase)
        })

    # Numbers
    for num in numbers:
        categories["numbers"].append({
            "text": num,
            "spoken": num,
            "filename": get_audio_filename(num)
        })

    # Words
    for word in words:
        categories["words"].append({
            "text": word,
            "spoken": word,
            "filename": get_audio_filename(word)
        })

    # Time
    for t in time_phrases:
        categories["time"].append({
            "text": t,
            "spoken": t,
            "filename": get_audio_filename(t)
        })

    return categories


async def synthesize_file(sem, spoken_text: str, out_path: Path, force: bool = False):
    async with sem:
        if out_path.exists() and not force:
            return "skipped"

        temp_path = out_path.with_suffix(".tmp.mp3")
        try:
            communicate = edge_tts.Communicate(spoken_text, VOICE)
            await communicate.save(str(temp_path))
            temp_path.replace(out_path)
            return "success"
        except Exception as e:
            if temp_path.exists():
                temp_path.unlink()
            print(f"    ❌ Error generating '{spoken_text}' -> {out_path.name}: {e}")
            return "error"


def generate_index_json(categories_data):
    """Generates an accurate public/audio/index.json file"""
    manifest = {
        "generated": datetime.utcnow().isoformat() + "Z",
        "voice": VOICE,
        "count": 0,
        "files": {}
    }

    total_files = 0
    for cat_name, items in categories_data.items():
        cat_dir = AUDIO_DIR / cat_name
        manifest["files"][cat_name] = []
        for item in items:
            filepath = cat_dir / item["filename"]
            size = filepath.stat().st_size if filepath.exists() else 0
            manifest["files"][cat_name].append({
                "filename": item["filename"],
                "path": f"/audio/{cat_name}/{item['filename']}",
                "size": size,
                "text": item["text"]
            })
            total_files += 1

    manifest["count"] = total_files
    INDEX_FILE.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\n📄 Updated audio manifest: {INDEX_FILE.relative_to(PROJECT_ROOT)} ({total_files} files)")


async def main():
    force = "--force" in sys.argv
    target_category = None
    if "--category" in sys.argv:
        idx = sys.argv.index("--category")
        if idx + 1 < len(sys.argv):
            target_category = sys.argv[idx + 1]

    categories = parse_data()

    total_items = sum(len(items) for items in categories.values())
    print("=" * 60)
    print(f"🎙️  BASIC RUSSIAN AUDIO GENERATOR (Neural TTS)")
    print(f"🗣️  Voice: {VOICE}")
    print(f"📁 Destination Base: {AUDIO_DIR.relative_to(PROJECT_ROOT)}/")
    print(f"📊 Total Curriculum Items: {total_items}")
    print(f"⚡ Mode: {'FORCE OVERWRITE (all new neural audio)' if force else 'SAFE UPDATE (skip existing)'}")
    print("=" * 60)

    sem = asyncio.Semaphore(5)
    overall_success = 0
    overall_skipped = 0
    overall_errors = 0

    for cat_name, items in categories.items():
        if target_category and cat_name != target_category:
            continue

        cat_dir = AUDIO_DIR / cat_name
        cat_dir.mkdir(parents=True, exist_ok=True)
        print(f"\n📂 [{cat_name.upper()}] ({len(items)} items)")

        tasks = []
        for item in items:
            out_path = cat_dir / item["filename"]
            tasks.append((item, out_path, synthesize_file(sem, item["spoken"], out_path, force=force)))

        for item, out_path, task in tasks:
            result = await task
            if result == "success":
                overall_success += 1
                print(f"  ✅ {out_path.name:<25} '{item['text']}'")
            elif result == "skipped":
                overall_skipped += 1
                print(f"  ⏭️  {out_path.name:<25} (already exists)")
            else:
                overall_errors += 1

    # Regenerate index.json
    generate_index_json(categories)

    print("\n" + "=" * 60)
    print(f"🎉 AUDIO GENERATION COMPLETE!")
    print(f"   Generated / Updated : {overall_success}")
    print(f"   Preserved (Skipped) : {overall_skipped}")
    print(f"   Failed (Errors)     : {overall_errors}")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
