"""Import approved PPTX and rendered slides into the shared presentation manifest.

Rendering is performed separately; this importer never rewrites source content.
"""
import argparse
import hashlib
import io
import json
import posixpath
import shutil
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path
from PIL import Image

p = argparse.ArgumentParser()
p.add_argument('--source', required=True)
p.add_argument('--rendered', required=True)
p.add_argument('--infographic', required=True)
p.add_argument('--slug', required=True)
args = p.parse_args()
assert __import__('re').fullmatch('[a-z0-9-]+', args.slug)
root = Path(__file__).resolve().parent.parent
relative = Path('assets/presentations') / args.slug
out = root / relative
out.mkdir(parents=True, exist_ok=True)
digest = lambda b: hashlib.sha256(b).hexdigest()
source = Path(args.source).read_bytes()
poster = Path(args.infographic).read_bytes()
with Image.open(io.BytesIO(poster)) as im:
    assert im.size[0] / im.size[1] == 16 / 9, 'Approved infographic must be 16:9'
with zipfile.ZipFile(io.BytesIO(source)) as z:
    assert z.testzip() is None
    ns = {'p':'http://schemas.openxmlformats.org/presentationml/2006/main', 'a':'http://schemas.openxmlformats.org/drawingml/2006/main', 'r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
    rels = {r.attrib['Id']:r.attrib['Target'] for r in ET.fromstring(z.read('ppt/_rels/presentation.xml.rels'))}
    deck = ET.fromstring(z.read('ppt/presentation.xml'))
    slides = [posixpath.normpath('ppt/' + rels[s.attrib['{'+ns['r']+'}id']]) for s in deck.find('p:sldIdLst', ns)]
    rendered = Path(args.rendered)
    assert len(list(rendered.glob('slide-*.png'))) == len(slides), 'Rendered slide count mismatch'
    pages = []
    for index, name in enumerate(slides, 1):
        xml = z.read(name)
        tree = ET.fromstring(xml)
        # Paragraph order and characters are retained, including source numbering/typos.
        text = '\n'.join(''.join(n.text or '' for n in para.findall('.//a:t', ns)) for para in tree.findall('.//a:p', ns))
        image = rendered / f'slide-{index}.png'
        target = out / f'page-{index}.png'
        shutil.copyfile(image, target)
        with Image.open(target) as im:
            width, height = im.size
        pages.append({'page':index, 'sourceSlide':name, 'sourceSlideSha256':digest(xml), 'image':(relative / target.name).as_posix(), 'imageSha256':digest(target.read_bytes()), 'text':text, 'width':width, 'height':height, 'figures':[]})
    media = {n:digest(z.read(n)) for n in z.namelist() if n.startswith('ppt/media/') and not n.endswith('/')}
    manifest = {'schemaVersion':1, 'sourceFormat':'PPTX', 'sourceSha256':digest(source), 'infographicSha256':digest(poster), 'sourceMediaSha256':media, 'pageAspect':height/width, 'pages':pages}
(out / 'original.pptx').write_bytes(source)
(out / 'infographic.jpg').write_bytes(poster)
(out / 'pages.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
print(f'{args.slug}: {len(pages)} slides; source and infographic bytes unchanged')
