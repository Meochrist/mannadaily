import os
from PIL import Image, ImageDraw, ImageFont

sizes = [72, 96, 128, 144, 152, 192, 384, 512]
icons_dir = os.path.join(os.path.dirname(__file__), '../public/icons')

# Créer le dossier icons s'il n'existe pas
os.makedirs(icons_dir, exist_ok=True)

# Dégradé de fond indigo vers navy avec coins arrondis
def draw_gradient_rect(width, height, r):
    # 1. Image de dégradé
    gradient = Image.new('RGB', (width, height), '#1e1b4b')
    draw_grad = ImageDraw.Draw(gradient)
    
    # Remplir ligne par ligne pour le dégradé indigo (#4f46e5) à navy (#1e1b4b)
    c1 = (0x4f, 0x46, 0xe5)
    c2 = (0x1e, 0x1b, 0x4b)
    
    for y in range(height):
        ratio = y / float(height - 1) if height > 1 else 0
        r_val = int(c1[0] + (c2[0] - c1[0]) * ratio)
        g_val = int(c1[1] + (c2[1] - c1[1]) * ratio)
        b_val = int(c1[2] + (c2[2] - c1[2]) * ratio)
        draw_grad.line([(0, y), (width, y)], fill=(r_val, g_val, b_val))
        
    # 2. Masque pour les coins arrondis
    mask = Image.new('L', (width, height), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle([(0, 0), (width - 1, height - 1)], r, fill=255)
    
    return gradient, mask

for size in sizes:
    r = int(size * 0.22)
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    
    # Dessiner le fond dégradé avec coins arrondis
    gradient, mask = draw_gradient_rect(size, size, r)
    img.paste(gradient, (0, 0), mask)
    
    # Dessiner la lettre "M" au centre
    draw = ImageDraw.Draw(img)
    font_size = int(size * 0.55)
    
    font = None
    # Polices courantes sous Windows et autres OS
    font_names = ["arialbd.ttf", "calibrib.ttf", "segoeuib.ttf", "Arial Bold", "Arial"]
    for font_name in font_names:
        try:
            font = ImageFont.truetype(font_name, font_size)
            break
        except:
            continue
            
    if font is None:
        try:
            font = ImageFont.load_default()
        except:
            pass

    text = "M"
    if font:
        bbox = draw.textbbox((0, 0), text, font=font)
        text_w = bbox[2] - bbox[0]
        text_h = bbox[3] - bbox[1]
        x = (size - text_w) / 2 - bbox[0]
        y = (size - text_h) / 2 - bbox[1]
        
        # Équilibre optique (léger décalage vertical)
        y += size * 0.015
        draw.text((x, y), text, fill="white", font=font)
    else:
        draw.text((size // 2 - 5, size // 2 - 5), text, fill="white")
        
    output_path = os.path.join(icons_dir, f'icon-{size}.png')
    img.save(output_path, 'PNG')
    print(f"[OK] Icon generated: icon-{size}.png ({size}x{size})")

print("=== PWA Icons generation finished ===")
