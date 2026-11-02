"""Render the original eight-bar Night Patrol loop. Requires Python 3 and FFmpeg."""

import math
import random
import subprocess
import sys
from array import array
from pathlib import Path

RATE = 32000
BEAT = 60 / 96
mix = array("f", [0]) * round(32 * BEAT * RATE)
noise = random.Random(96)


def note(beat, midi, beats, level, voice):
    start = round(beat * BEAT * RATE)
    length = round(beats * BEAT * RATE)
    omega = math.tau * 440 * 2 ** ((midi - 69) / 12) / RATE
    for i in range(length):
        t = i / RATE
        phase = omega * i
        envelope = min(1, t / 0.009, (length - i) / (RATE * 0.055))
        tone = math.sin(phase)
        if voice == "mallet":
            tone += 0.32 * math.sin(phase * 3.01) * math.exp(-12 * t)
        elif voice == "bass":
            tone += 0.35 * math.sin(2 * phase)
        else:
            tone += 0.22 * math.sin(phase * 1.004)
        sample = level * envelope * math.exp(-3 * t) * tone
        mix[(start + i) % len(mix)] += sample


# Root, upper voicing and melody. Each pair of bars answers the previous motif.
bars = [
    (38, (53, 57, 60, 64), (69, 72, 76)),
    (38, (53, 57, 60, 64), (74, 72, 69)),
    (43, (58, 62, 65, 69), (70, 74, 77)),
    (45, (55, 61, 64, 70), (76, 73, 67)),
    (46, (53, 57, 62, 65), (69, 74, 77)),
    (43, (58, 62, 65, 69), (79, 77, 74)),
    (38, (53, 57, 60, 64), (76, 72, 69)),
    (45, (55, 61, 64, 70), (70, 67, 73)),
]
for bar, (root, chord, melody) in enumerate(bars):
    downbeat = bar * 4
    for at, pitch in [(0, root), (1.65, root + 7), (2.5, root + 12)]:
        note(downbeat + at, pitch, 0.72, 0.15, "bass")
    for at in (0.55, 2.55):
        for pitch in chord:
            note(downbeat + at, pitch, 0.8, 0.030, "keys")
    for at, pitch in zip((0.05, 1.55, 3.05), melody):
        note(downbeat + at, pitch, 0.75, 0.105, "mallet")
        note(downbeat + at + 0.75, pitch, 0.5, 0.022, "mallet")
    for eighth in range(8):
        start = round((downbeat + eighth / 2 + 0.05 * (eighth % 2)) * BEAT * RATE)
        prev = 0
        for i in range(round(0.06 * RATE)):
            sample = noise.uniform(-1, 1)
            mix[start + i] += (sample - prev) * 0.025 * math.exp(-i / (RATE * 0.014))
            prev = sample

output = Path(__file__).resolve().parents[1] / "src/assets/night-patrol.mp3"
output.parent.mkdir(exist_ok=True)
pcm = array("h", (round(value * 32767) for value in mix))
if sys.byteorder != "little":
    pcm.byteswap()
subprocess.run([
    "ffmpeg", "-v", "error", "-y", "-f", "s16le", "-ar", str(RATE), "-ac", "1",
    "-i", "pipe:0", "-codec:a", "libmp3lame", "-q:a", "4", str(output),
], input=pcm.tobytes(), check=True)
