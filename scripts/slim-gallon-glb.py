"""Slims the gallon jug model for the site: keeps positions, normals and triangles only (the site
draws it in its own clear plastic, so the label texture and UVs go), bakes the node transforms,
stores metres with y up and the origin at the centre of the base, and uses 16-bit indices.
The source surface is slightly bumpy, which clear plastic exaggerates into a crinkled look, so
the mesh is welded and Taubin-smoothed (a low-pass filter that keeps the shape) and its normals
are recomputed from the smoothed surface.

Source: "Milk 1 gallon jug from USA" by boost5u, CC BY 4.0,
https://sketchfab.com/3d-models/milk-1-gallon-jug-from-usa-7e64723df1854c5b8d45419fe86d96b5
(credited in the site footer). Needs numpy and scipy.

Usage: python3 -I scripts/slim-gallon-glb.py milk_1_gallon_jug_from_usa.glb public/models/gallon-jug.glb
"""
import json
import struct
import sys

import numpy as np
from scipy import sparse

src, out = sys.argv[1], sys.argv[2]
data = open(src, 'rb').read()
offset, chunks = 12, []
while offset < len(data):
    length, _ = struct.unpack('<I4s', data[offset:offset + 8])
    chunks.append(data[offset + 8:offset + 8 + length])
    offset += 8 + length
gltf, binary = json.loads(chunks[0]), chunks[1]


def accessor(i):
    a = gltf['accessors'][i]
    view = gltf['bufferViews'][a['bufferView']]
    width = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3}[a['type']]
    dtype = {5126: np.float32, 5125: np.uint32, 5123: np.uint16}[a['componentType']]
    arr = np.frombuffer(binary, dtype, a['count'] * width, view.get('byteOffset', 0) + a.get('byteOffset', 0))
    return arr.reshape(-1, width) if width > 1 else arr


def matrix(node):
    m = node.get('matrix')
    return np.array(m, np.float64).reshape(4, 4).T if m else np.eye(4)


prim = gltf['meshes'][0]['primitives'][0]
transform = matrix(gltf['nodes'][0]) @ matrix(gltf['nodes'][1])
pos = np.c_[accessor(prim['attributes']['POSITION']).astype(np.float64), np.ones(len(accessor(prim['attributes']['POSITION'])))] @ transform.T
pos = pos[:, :3]
pos[:, 0] -= (pos[:, 0].min() + pos[:, 0].max()) / 2
pos[:, 2] -= (pos[:, 2].min() + pos[:, 2].max()) / 2
pos[:, 1] -= pos[:, 1].min()
idx = accessor(prim['indices']).astype(np.int64).reshape(-1, 3)

# Weld the copies of each vertex that the texture seams split apart.
_, first, weld = np.unique(np.round(pos / 1e-6).astype(np.int64), axis=0, return_index=True, return_inverse=True)
weld = weld.ravel()
pos = pos[first]
idx = weld[idx]
idx = idx[(idx[:, 0] != idx[:, 1]) & (idx[:, 1] != idx[:, 2]) & (idx[:, 0] != idx[:, 2])]

# Taubin smoothing over the vertex graph: alternate shrink (lambda) and inflate (mu) steps.
edges = np.concatenate([idx[:, [0, 1]], idx[:, [1, 2]], idx[:, [2, 0]]])
adj = sparse.coo_matrix((np.ones(len(edges)), (edges[:, 0], edges[:, 1])), shape=(len(pos), len(pos))).tocsr()
adj = ((adj + adj.T) > 0).astype(np.float64)
walk = sparse.diags(1 / np.asarray(adj.sum(axis=1)).ravel()) @ adj
for _ in range(12):
    for step in (0.5, -0.53):
        pos = pos + step * (walk @ pos - pos)

# Smooth, area-weighted normals from the cleaned surface.
face = np.cross(pos[idx[:, 1]] - pos[idx[:, 0]], pos[idx[:, 2]] - pos[idx[:, 0]])
nrm = np.zeros_like(pos)
for k in range(3):
    np.add.at(nrm, idx[:, k], face)
nrm /= np.linalg.norm(nrm, axis=1, keepdims=True)

idx = idx.astype(np.uint16).ravel()
assert len(pos) < 65536

blobs = [pos.astype(np.float32).tobytes(), nrm.astype(np.float32).tobytes(), idx.tobytes()]
views, offset = [], 0
for i, blob in enumerate(blobs):
    views.append({'buffer': 0, 'byteOffset': offset, 'byteLength': len(blob), 'target': 34963 if i == 2 else 34962})
    offset += (len(blob) + 3) // 4 * 4
body = b''.join(blob + b'\0' * ((4 - len(blob) % 4) % 4) for blob in blobs)
doc = {
    'asset': {'version': '2.0', 'generator': 'scripts/slim-gallon-glb.py', 'extras': {
        **gltf['asset'].get('extras', {}),
        'modifications': 'Texture, UVs and materials removed; transforms baked; welded and Taubin-smoothed; normals recomputed; metres, y up, origin at base centre.',
    }},
    'scene': 0, 'scenes': [{'nodes': [0]}], 'nodes': [{'mesh': 0, 'name': 'gallon-jug'}],
    'meshes': [{'name': 'gallon-jug', 'primitives': [{'attributes': {'POSITION': 0, 'NORMAL': 1}, 'indices': 2, 'mode': 4}]}],
    'accessors': [
        {'bufferView': 0, 'componentType': 5126, 'count': len(pos), 'type': 'VEC3',
         'min': pos.min(0).astype(np.float32).tolist(), 'max': pos.max(0).astype(np.float32).tolist()},
        {'bufferView': 1, 'componentType': 5126, 'count': len(nrm), 'type': 'VEC3'},
        {'bufferView': 2, 'componentType': 5123, 'count': len(idx), 'type': 'SCALAR'},
    ],
    'bufferViews': views, 'buffers': [{'byteLength': len(body)}],
}
js = json.dumps(doc, separators=(',', ':')).encode()
js += b' ' * ((4 - len(js) % 4) % 4)
glb = struct.pack('<4sII', b'glTF', 2, 12 + 8 + len(js) + 8 + len(body))
glb += struct.pack('<I4s', len(js), b'JSON') + js + struct.pack('<I4s', len(body), b'BIN\0') + body
open(out, 'wb').write(glb)
print(out, len(glb), 'bytes,', len(pos), 'vertices,', len(idx) // 3, 'triangles')
