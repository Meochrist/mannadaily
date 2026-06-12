import os
import sys
import re
import argparse
from PIL import Image
import vtracer

def vectorize_image(input_path, output_path):
    print(f"Vectorisation de {input_path} vers {output_path}...")
    
    # 1. Créer le dossier parent de sortie s'il n'existe pas
    output_dir = os.path.dirname(output_path)
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)
        
    # 2. VTracer fonctionne mieux avec un JPEG de qualité pour la vectorisation couleur
    temp_jpg = input_path + ".temp.jpg"
    
    try:
        # Convertir en JPEG avec fond blanc (pour s'assurer que la transparence est blanche)
        with Image.open(input_path) as img:
            # Créer un fond blanc
            background = Image.new("RGB", img.size, (255, 255, 255))
            if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
                # Coller l'image avec son canal alpha comme masque
                background.paste(img, mask=img.split()[3] if img.mode == 'RGBA' else img.convert('RGBA').split()[3])
                background.save(temp_jpg, 'JPEG', quality=95)
            else:
                img.convert('RGB').save(temp_jpg, 'JPEG', quality=95)
        
        # Temp SVG path
        temp_svg = output_path + ".temp.svg"
        
        # 3. Vectorisation
        vtracer.convert_image_to_svg_py(
            temp_jpg, 
            temp_svg, 
            colormode='color',
            hierarchical='cutout',
            mode='spline',
            filter_speckle=10,        # Plus petit pour capter les détails fins du cartoon
            color_precision=5,        # Bonne fidélité des couleurs
            corner_threshold=60,      # Courbes plus douces
            path_precision=1
        )
        
        if not os.path.exists(temp_svg):
            print("Erreur: VTracer n'a pas pu générer le fichier SVG temporaire.")
            return False
            
        # 4. Nettoyage du SVG
        with open(temp_svg, "r", encoding="utf-8") as f:
            svg_content = f.read()
            
        # Supprimer le fond blanc (généralement le premier rect blanc de VTracer)
        # On remplace fill="#ffffff" ou fill="#FFFFFF" par fill="none" dans le premier rect
        cleaned_content = re.sub(
            r'<rect([^>]+)fill="#[fF]{6}"([^>]*)(/>|></rect>)', 
            r'<rect\1fill="none"\2\3', 
            svg_content, 
            count=1
        )
        
        # S'assurer que la viewBox est normalisée à 0 0 500 500 pour Next.js/CSS
        cleaned_content = re.sub(r'viewBox="[^"]+"', 'viewBox="0 0 500 500"', cleaned_content)
        
        # Enregistrer le SVG final
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(cleaned_content)
            
        print(f"Vectorisation réussie ! Fichier SVG écrit : {output_path}")
        
        # Nettoyage des fichiers temporaires
        if os.path.exists(temp_jpg):
            os.remove(temp_jpg)
        if os.path.exists(temp_svg):
            os.remove(temp_svg)
            
        return True
        
    except Exception as e:
        print(f"Une erreur est survenue lors de la vectorisation : {e}")
        # Nettoyage en cas d'erreur
        if os.path.exists(temp_jpg):
            os.remove(temp_jpg)
        if 'temp_svg' in locals() and os.path.exists(temp_svg):
            os.remove(temp_svg)
        return False

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Vectorise un dessin de personnage PNG en SVG transparent avec VTracer.")
    parser.add_argument("-i", "--input", required=True, help="Chemin du fichier d'entrée PNG/JPG")
    parser.add_argument("-o", "--output", required=True, help="Chemin de sortie du fichier SVG dans le projet")
    
    args = parser.parse_args()
    
    success = vectorize_image(args.input, args.output)
    sys.exit(0 if success else 1)
