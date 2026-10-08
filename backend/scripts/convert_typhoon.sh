#!/bin/bash
# One-off: convert Typhoon Whisper turbo to CTranslate2 int8 (~780MB), then set in backend/.env:
#   WHISPER_MODEL=<absolute path printed below>
# Benchmarked on 200 Thai clips: CER 1.9% vs 2.9% (biodatlab default), ~1.8x faster on a GTX 1060.
set -e
OUT="${1:-$HOME/models/typhoon-whisper-turbo-ct2}"
ct2-transformers-converter --model typhoon-ai/typhoon-whisper-turbo --output_dir "$OUT" \
  --quantization int8 --copy_files tokenizer.json preprocessor_config.json --force
echo "WHISPER_MODEL=$OUT"
