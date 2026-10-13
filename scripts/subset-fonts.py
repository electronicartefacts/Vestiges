"""Generate local webfont subsets; originals and OFL notices remain untouched.
Build dependency: fonttools[woff]==4.60.1, installed in an isolated environment.
Run from any directory: python scripts/subset-fonts.py
"""
from pathlib import Path
import hashlib
import json
from fontTools import __version__, subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
FONTS = ROOT / 'assets/fonts'
RANGES = [(0, 0x00FF), (0x0152, 0x0153), (0x0178, 0x0178), (0x0300, 0x036F), (0x2000, 0x206F), (0x20A0, 0x20CF), (0x2190, 0x21FF), (0x2212, 0x2212), (0xFEFF, 0xFEFF), (0xFFFD, 0xFFFD)]
UNICODES = {point for first, last in RANGES for point in range(first, last + 1)}
SOURCES = [
    ('inter/Inter-Variable.woff2', 'inter/VestigesSans-Latin-20261013a.woff2', 'Vestiges Sans', 'normal', '100 900'),
    ('newsreader/Newsreader-Variable.woff2', 'newsreader/VestigesSerif-Latin-20261013a.woff2', 'Vestiges Serif', 'normal', '200 800'),
    ('newsreader/Newsreader-Variable-Italic.woff2', 'newsreader/VestigesSerif-LatinItalic-20261013a.woff2', 'Vestiges Serif', 'italic', '200 800'),
]
def css_ranges(points):
    groups = []
    for point in sorted(points):
        if groups and point == groups[-1][1] + 1:
            groups[-1][1] = point
        else:
            groups.append([point, point])
    return ', '.join(f'U+{first:04X}' if first == last else f'U+{first:04X}-{last:04X}' for first, last in groups)

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

manifest = {'generator': f'fonttools {__version__}', 'version': '20261013a', 'policy': 'Latin, combining accents, punctuation and common interface symbols; original fonts cover their remaining characters.', 'sources_preserved': True, 'fonts': []}
css = []
for source_name, target_name, family, style, weight in SOURCES:
    source, target = FONTS / source_name, FONTS / target_name
    original = TTFont(source, recalcTimestamp=False)
    coverage = set(original.getBestCmap())
    axes = [(axis.axisTag, axis.minValue, axis.maxValue) for axis in original['fvar'].axes]
    options = subset.Options()
    options.layout_features = ['*']
    options.name_IDs = ['*']
    options.name_languages = ['*']
    options.recalc_timestamp = False
    subsetter = subset.Subsetter(options=options)
    subsetter.populate(unicodes=UNICODES)
    subsetter.subset(original)
    # Derivatives have distinct internal names; copyright/license records remain.
    for name in original['name'].names:
        if name.nameID in (1, 4, 6, 16):
            value = family + (' Italic' if style == 'italic' and name.nameID in (4, 6) else '')
            if name.nameID == 6: value = value.replace(' ', '')
            name.string = value.encode(name.getEncoding())
        elif name.nameID == 3:
            name.string = f'{family};20261013a;{style}'.encode(name.getEncoding())
    original.flavor = 'woff2'
    original.save(target)
    generated = TTFont(target)
    retained = set(generated.getBestCmap())
    if not coverage.intersection(UNICODES).issubset(retained):
        raise ValueError(f'Lost requested characters: {target}')
    if axes != [(axis.axisTag, axis.minValue, axis.maxValue) for axis in generated['fvar'].axes]:
        raise ValueError(f'Changed variable font axes: {target}')
    css_family = 'Inter' if source_name.startswith('inter/') else 'Newsreader'
    for file_name, points in [(target_name, retained), (source_name, coverage - retained)]:
        if not points: continue
        css.append(f'''@font-face {{
  font-family: "{css_family}";
  src: url("/assets/fonts/{file_name}") format("woff2");
  font-style: {style};
  font-weight: {weight};
  font-display: swap;
  unicode-range: {css_ranges(points)};
}}
''')
    manifest['fonts'].append({'source': source_name, 'derivative': target_name, 'source_bytes': source.stat().st_size, 'derivative_bytes': target.stat().st_size, 'source_sha256': digest(source), 'derivative_sha256': digest(target), 'axes': axes, 'subset_unicode_range': css_ranges(retained), 'fallback_unicode_range': css_ranges(coverage - retained), 'license': 'SIL Open Font License 1.1'})
(FONTS / 'subset-manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
(FONTS / 'font-faces.generated.css').write_text('\n'.join(css))
for item in manifest['fonts']:
    print(item['source'], item['source_bytes'], '->', item['derivative_bytes'])
