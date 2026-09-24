import os
import re

def clean_svg_file(filepath):
    print(f"Analyse de {filepath}...")
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    modified = False

    # 1. Recherche du premier grand tracé de fond blanc/jaunâtre de VTracer
    # regex pour capturer le premier path avec fill presque blanc
    # Groupe 1: (<path\s+d=")
    # Groupe 2: ([^"]+) - le contenu du d
    # Groupe 3: ("\s+fill="#(?:...)"") - le fill
    # Groupe 4: ([^>]*) - le reste des attributs
    # Groupe 5: (/>|></path>) - la fermeture
    path_regex = re.compile(r'(<path\s+d=")([^"]+)("\s+fill="#(?:[fF]{6}|[fF][eE][fF][eE][fF][eE]|[fF][dD][fF][dD][fF][dD]|[fF][eE][fF][cC][fF][aA])")([^>]*)(/>|></path>)')
    
    match = path_regex.search(content)
    if match:
        full_tag = match.group(0)
        prefix = match.group(1)
        d_attribute = match.group(2)
        suffix = match.group(3) + match.group(4) + match.group(5)
        
        subpaths = d_attribute.split('M')
        first_subpath_idx = 1 if d_attribute.startswith('M') else 0
        
        if first_subpath_idx < len(subpaths):
            first_subpath = subpaths[first_subpath_idx]
            if ('1024' in first_subpath or '500' in first_subpath) and ('Z' in first_subpath or 'z' in first_subpath):
                print("-> Rectangle de fond détecté dans le premier path. Suppression...")
                z_idx = first_subpath.find('Z')
                if z_idx == -1:
                    z_idx = first_subpath.find('z')
                
                remaining_first_subpath = first_subpath[z_idx+1:].strip()
                subpaths[first_subpath_idx] = remaining_first_subpath
                
                new_subpaths = []
                for sp in subpaths:
                    if sp.strip():
                        new_subpaths.append(sp.strip())
                
                if new_subpaths:
                    new_d = "M " + " M ".join(new_subpaths) if d_attribute.startswith('M') else " M ".join(new_subpaths)
                    new_d = re.sub(r'\s+', ' ', new_d).strip()
                    new_tag = f'{prefix}{new_d}{suffix}'
                    content = content.replace(full_tag, new_tag)
                else:
                    content = content.replace(full_tag, '')
                
                modified = True

    # 2. Remplacer les rects de fond blanc explicites
    rect_regex = re.compile(r'<rect([^>]+)fill="#(?:[fF]{6}|[fF][eE][fF][eE][fF][eE]|[fF][dD][fF][dD][fF][dD]|[fF][eE][fF][cC][fF][aA]|white)"([^>]*)(/>|></rect>)')
    if rect_regex.search(content):
        print("-> Balise <rect> de fond blanc détectée. Modification en fill=\"none\"...")
        content = rect_regex.sub(r'<rect\1fill="none"\2\3', content)
        modified = True

    # 3. Remplacer les paths de fond blanc purs qui ne font que dessiner un rectangle
    pure_path_regex = re.compile(r'<path([^>]+)fill="#(?:[fF]{6}|[fF][eE][fF][eE][fF][eE]|[fF][dD][fF][dD][fF][dD]|white)"([^>]*)(/>|></path>)')
    for m in pure_path_regex.finditer(content):
        tag = m.group(0)
        if 'M0 0' in tag or 'M 0 0' in tag:
            if tag.count('M') + tag.count('m') <= 1:
                print("-> Path pur de fond blanc détecté. Modification en fill=\"none\"...")
                new_tag = re.sub(r'fill="#[a-zA-Z0-9]+"', 'fill="none"', tag)
                new_tag = re.sub(r'fill="white"', 'fill="none"', new_tag)
                content = content.replace(tag, new_tag)
                modified = True

    if modified:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"-> {filepath} NETTOYÉ AVEC SUCCÈS.")
    else:
        print("-> Aucun fond blanc détecté ou déjà transparent.")

def clean_all_characters(base_dir):
    print(f"Nettoyage global des mascottes dans : {base_dir}")
    if not os.path.exists(base_dir):
        print("Erreur : Le dossier spécifié n'existe pas.")
        return
        
    for root, dirs, files in os.walk(base_dir):
        for file in files:
            if file.endswith('.svg'):
                filepath = os.path.join(root, file)
                clean_svg_file(filepath)

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        characters_dir = sys.argv[1]
    else:
        characters_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "public", "assets", "characters"))
    clean_all_characters(characters_dir)
