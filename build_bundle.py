import re

modules = [
    'js/textures.js',
    'js/modelManager.js',
    'js/roomManager.js',
    'js/scene3d.js',
    'js/boardManager.js',
    'js/snapEngine.js',
    'js/authManager.js',
    'js/catalogManager.js',
    'js/cutListManager.js',
    'js/presetFurniture.js',
    'js/kitchenCorpusGenerator.js',
    'js/objExporter.js',
    'js/app.js'
]

def clean_module(code):
    # Remove import lines
    lines = code.splitlines()
    cleaned = []
    in_import = False
    for line in lines:
        stripped = line.strip()
        if in_import:
            if ';' in line or stripped.endswith("'") or stripped.endswith('"'):
                in_import = False
            continue
        if stripped.startswith('import ') or stripped.startswith('import{'):
            if not (';' in line or stripped.endswith("'") or stripped.endswith('"')):
                in_import = True
            continue

        # Strip export statements
        if stripped.startswith('export default '):
            line = line.replace('export default ', '')
        elif stripped.startswith('export const '):
            line = line.replace('export const ', 'const ')
        elif stripped.startswith('export let '):
            line = line.replace('export let ', 'let ')
        elif stripped.startswith('export var '):
            line = line.replace('export var ', 'var ')
        elif stripped.startswith('export class '):
            line = line.replace('export class ', 'class ')
        elif stripped.startswith('export function '):
            line = line.replace('export function ', 'function ')
        elif stripped.startswith('export async function '):
            line = line.replace('export async function ', 'async function ')
        elif stripped.startswith('export ') and '{' in stripped and '}' in stripped:
            continue

        cleaned.append(line)
    return '\n'.join(cleaned)

# Read the original embedded models header from HEAD~1 to ensure a clean base
import subprocess
try:
    orig_bundle = subprocess.check_output(['git', 'show', 'HEAD~1:js/bundle.js']).decode('utf-8', errors='ignore')
    pos = orig_bundle.find('// --- MODULE: js/textures.js ---')
    if pos != -1:
        header = orig_bundle[:pos]
    else:
        raise ValueError('Module header not found in git bundle')
except Exception as e:
    with open('js/bundle.js', 'r', encoding='utf-8') as f:
        text = f.read()
    pos = text.find('// --- MODULE: js/textures.js ---')
    header = text[:pos]

out = [header]
for m in modules:
    out.append(f'// --- MODULE: {m} ---\n')
    with open(m, 'r', encoding='utf-8') as mf:
        content = mf.read()
    cleaned = clean_module(content)
    out.append(cleaned)
    out.append('\n\n')

# Close the outer IIFE (function() { ... })();
out.append('\n})();\n')

bundle_content = ''.join(out)

# Check for any remaining export or import keywords
remaining_exports = re.findall(r'^\s*export\s+.*', bundle_content, re.M)
remaining_imports = re.findall(r'^\s*import\s+.*', bundle_content, re.M)
print(f'Remaining exports in bundle: {len(remaining_exports)}')
print(f'Remaining imports in bundle: {len(remaining_imports)}')
if remaining_exports:
    for e in remaining_exports[:5]:
        print('  export:', e)
if remaining_imports:
    for im in remaining_imports[:5]:
        print('  import:', im)

with open('js/bundle.js', 'w', encoding='utf-8') as f:
    f.write(bundle_content)

print('js/bundle.js successfully rebuilt with closing IIFE and cleaned ESM keywords!')
