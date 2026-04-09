#!/usr/bin/env python3
"""
Remove background from image using rembg
Usage: python remove-bg.py <input_path> <output_path>
"""

import sys
from rembg import remove
from PIL import Image

def remove_background(input_path: str, output_path: str):
    """Remove background from image and save with transparent background."""
    try:
        # Open input image
        input_image = Image.open(input_path)

        # Remove background
        output_image = remove(input_image)

        # Save as PNG with transparency
        output_image.save(output_path, 'PNG')

        print(f"Background removed: {output_path}")
        return 0
    except Exception as e:
        print(f"Error removing background: {e}", file=sys.stderr)
        return 1

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python remove-bg.py <input_path> <output_path>", file=sys.stderr)
        sys.exit(1)

    sys.exit(remove_background(sys.argv[1], sys.argv[2]))
