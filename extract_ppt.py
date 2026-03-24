import zipfile
import xml.etree.ElementTree as ET
import sys

def extract_text_from_pptx(filepath):
    try:
        with zipfile.ZipFile(filepath, 'r') as z:
            slide_files = [f for f in z.namelist() if f.startswith('ppt/slides/slide') and f.endswith('.xml')]
            slide_files.sort(key=lambda s: int(s.replace('ppt/slides/slide', '').replace('.xml', '')))
            
            for slide_idx, slide_file in enumerate(slide_files, 1):
                print(f"--- Slide {slide_idx} ---")
                xml_content = z.read(slide_file)
                root = ET.fromstring(xml_content)
                
                # The namespace map for pptx XML
                namespaces = {
                    'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
                    'p': 'http://schemas.openxmlformats.org/presentationml/2006/main'
                }
                
                # Find all text elements
                texts = []
                for node in root.findall('.//a:t', namespaces):
                    if node.text:
                        texts.append(str(node.text))
                
                print('\n'.join(texts))
                print()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    extract_text_from_pptx(sys.argv[1])
