import os
import sys
from PIL import Image, ImageDraw, ImageFont

# === Configuration ===
ANDROID_RES = os.path.join(os.path.dirname(__file__), '..', 'android', 'app', 'src', 'main', 'res')

# Android mipmap densities and their sizes for ic_launcher
DENSITIES = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192,
}

# For adaptive icons (v26), the foreground is 108x108dp inside a 432x432dp viewport.
# We generate at each density directly as ic_launcher_foreground.png
# But the simplest approach: generate the foreground at the full icon size with the "M" on transparent,
# since the background is handled by the XML color.

INDIGO_START = (79, 70, 229)   # #4f46e5
INDIGO_END = (30, 27, 75)      # #1e1b4b

def create_gradient_background(width, height, radius):
    """Create a rounded-rect gradient background from indigo to navy."""
    gradient = Image.new('RGB', (width, height), '#1e1b4b')
    draw_grad = ImageDraw.Draw(gradient)
    
    for y in range(height):
        ratio = y / float(height - 1) if height > 1 else 0
        r = int(INDIGO_START[0] + (INDIGO_END[0] - INDIGO_START[0]) * ratio)
        g = int(INDIGO_START[1] + (INDIGO_END[1] - INDIGO_START[1]) * ratio)
        b = int(INDIGO_START[2] + (INDIGO_END[2] - INDIGO_START[2]) * ratio)
        draw_grad.line([(0, y), (width, y)], fill=(r, g, b))
    
    # Rounded rectangle mask
    mask = Image.new('L', (width, height), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle([(0, 0), (width - 1, height - 1)], radius, fill=255)
    
    return gradient, mask

def create_icon(size):
    """Generate a full icon (background + 'M' letter) at the given size."""
    radius = int(size * 0.22)
    
    # Create transparent RGBA image
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    
    # Draw gradient background with rounded corners
    gradient, mask = create_gradient_background(size, size, radius)
    img.paste(gradient, (0, 0), mask)
    
    # Draw "M" letter
    draw = ImageDraw.Draw(img)
    font_size = int(size * 0.55)
    
    # Try to load a bold font
    font = None
    font_names = [
        "arialbd.ttf", "calibrib.ttf", "segoeuib.ttf",
        "Arial Bold", "Arial",
        "DejaVuSans-Bold.ttf", "DejaVuSans.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for font_name in font_names:
        try:
            font = ImageFont.truetype(font_name, font_size)
            break
        except (IOError, OSError):
            continue
    
    if font is None:
        font = ImageFont.load_default()
    
    text = "M"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    x = (size - text_w) / 2 - bbox[0]
    y = (size - text_h) / 2 - bbox[1]
    y += size * 0.015  # optical adjustment
    
    draw.text((x, y), text, fill="white", font=font)
    
    return img

def create_foreground_only(size):
    """Generate only the 'M' letter on transparent background for adaptive icons foreground."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    font_size = int(size * 0.55)
    
    font = None
    font_names = [
        "arialbd.ttf", "calibrib.ttf", "segoeuib.ttf",
        "Arial Bold", "Arial",
        "DejaVuSans-Bold.ttf", "DejaVuSans.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for font_name in font_names:
        try:
            font = ImageFont.truetype(font_name, font_size)
            break
        except (IOError, OSError):
            continue
    
    if font is None:
        font = ImageFont.load_default()
    
    text = "M"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    x = (size - text_w) / 2 - bbox[0]
    y = (size - text_h) / 2 - bbox[1]
    y += size * 0.015
    
    draw.text((x, y), text, fill="white", font=font)
    
    return img


def main():
    print("=" * 60)
    print("  MannaDaily - Android Icon Generator")
    print("=" * 60)
    
    # 1. Generate ic_launcher.png for each density (full icon with gradient background)
    for density, size in DENSITIES.items():
        target_dir = os.path.join(ANDROID_RES, density)
        os.makedirs(target_dir, exist_ok=True)
        
        # Full launcher icon
        icon = create_icon(size)
        icon_path = os.path.join(target_dir, 'ic_launcher.png')
        icon.save(icon_path, 'PNG')
        print(f"  [OK] {density}/ic_launcher.png ({size}x{size})")
        
        # Round icon (same as normal for simple approach)
        round_path = os.path.join(target_dir, 'ic_launcher_round.png')
        icon.save(round_path, 'PNG')
        print(f"  [OK] {density}/ic_launcher_round.png ({size}x{size})")
        
        # Foreground for adaptive icon (M on transparent)
        foreground = create_foreground_only(size)
        fg_path = os.path.join(target_dir, 'ic_launcher_foreground.png')
        foreground.save(fg_path, 'PNG')
        print(f"  [OK] {density}/ic_launcher_foreground.png ({size}x{size})")
    
    # 2. Update the adaptive icon XML background color to indigo
    values_dir = os.path.join(ANDROID_RES, 'values')
    os.makedirs(values_dir, exist_ok=True)
    bg_xml_path = os.path.join(values_dir, 'ic_launcher_background.xml')
    with open(bg_xml_path, 'w', encoding='utf-8') as f:
        f.write('<?xml version="1.0" encoding="utf-8"?>\n')
        f.write('<resources>\n')
        f.write('    <color name="ic_launcher_background">#4f46e5</color>\n')
        f.write('</resources>\n')
    print(f"  [OK] values/ic_launcher_background.xml -> indigo (#4f46e5)")
    
    # 3. Also update any color reference in styles or other places
    # Update the mipmap-anydpi-v26 XML to ensure it references colors correctly (already fine)
    
    print()
    print("=" * 60)
    print("  All Android icons generated successfully!")
    print("=" * 60)

if __name__ == '__main__':
    main()