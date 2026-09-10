import numpy as np
from PIL import Image, ImageFilter
import os

W, H = 1200, 760

def value_noise(w, h, cells, rng):
    cy = max(2, int(round(cells * h / w)))
    g = rng.random((cy + 1, int(cells) + 1)).astype(np.float32)
    img = Image.fromarray((g * 255).astype(np.uint8), 'L').resize((w, h), Image.BICUBIC)
    return np.asarray(img, np.float32) / 255.0

def fbm(w, h, seed, octaves=6, base=4, gain=0.52):
    rng = np.random.default_rng(seed)
    tot = np.zeros((h, w), np.float32); amp, cells, norm = 1.0, base, 0.0
    for _ in range(octaves):
        tot += amp * value_noise(w, h, cells, rng); norm += amp
        amp *= gain; cells *= 2
    return tot / norm

def blur(a, r):
    im = Image.fromarray(np.clip(a * 255, 0, 255).astype(np.uint8), 'L')
    return np.asarray(im.filter(ImageFilter.GaussianBlur(r)), np.float32) / 255.0

def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t)

def make_cloud(seed, path, lobes=None, label=''):
    rng = np.random.default_rng(seed)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)

    # A cumulus as a union of soft spheres: a flat-ish base row with taller
    # lobes stacked above it. Metaballs give a silhouette you can actually
    # control, unlike an implicit ellipse.
    if lobes is None:
        # Radii and spacing are set so neighbours genuinely overlap, both
        # across a row and between rows. Anything tighter and the lobes stay
        # separate islands instead of fusing into one mass.
        lobes = []
        for i in range(11):                                    # flat base
            t = i / 10
            lobes.append((0.08 + 0.84 * t, 0.615 + rng.uniform(-0.012, 0.012),
                          rng.uniform(0.082, 0.10)))
        for i in range(7):                                     # first tier
            t = i / 6
            lobes.append((0.16 + 0.68 * t, 0.525 + rng.uniform(-0.025, 0.025),
                          rng.uniform(0.088, 0.112)))
        for i in range(5):                                     # second tier
            t = i / 4
            lobes.append((0.24 + 0.52 * t, 0.445 + rng.uniform(-0.03, 0.03),
                          rng.uniform(0.078, 0.104)))
        for i in range(3):                                     # crown
            t = i / 2
            lobes.append((0.34 + 0.30 * t, 0.375 + rng.uniform(-0.025, 0.02),
                          rng.uniform(0.066, 0.088)))

    field = np.zeros((H, W), np.float32)
    for cx, cy, r in lobes:
        px, py, rr = cx * W, cy * H, r * W
        # True pixel distance, so the lobes are round rather than squashed
        # into the sausages a vertical scale factor produced.
        d2 = ((xx - px) ** 2 + (yy - py) ** 2) / (rr * rr)
        # Compact-support metaball: exactly 1 at the centre, exactly 0 at r,
        # smooth in between. A gaussian never reaches zero and its tail made
        # the effective radius less than half the nominal one.
        field += np.clip(1.0 - d2, 0.0, 1.0) ** 3

    n = fbm(W, H, seed, octaves=6, base=4)
    # Billow the edge: the noise pushes the threshold in and out.
    density = field - 0.42 + 0.30 * (n - 0.5)
    density = blur(np.clip(density, 0, None), 4)
    alpha = smoothstep(0.015, 0.24, density)

    hgt = blur(np.clip(density, 0, None), 26)
    gy = np.roll(hgt, -8, 0) - np.roll(hgt, 8, 0)
    gx = np.roll(hgt, -8, 1) - np.roll(hgt, 8, 1)
    lit = np.clip(0.52 + 3.2 * gy + 1.8 * gx, 0, 1)
    ny = (yy / H - 0.5) * 2
    ao = np.clip(1.0 - 0.5 * blur(np.clip(density, 0, None), 45) * smoothstep(-0.3, 1.0, ny), 0.4, 1.0)
    shade = np.clip(lit * 0.7 + 0.3, 0, 1) * ao

    top   = np.array([255, 255, 255], np.float32)
    under = np.array([171, 178, 194], np.float32)
    rgb = under + (top - under) * shade[..., None] ** 0.9

    out = np.dstack([np.clip(rgb, 0, 255), np.clip(alpha * 255, 0, 255)]).astype(np.uint8)
    im = Image.fromarray(out, 'RGBA')
    a = np.asarray(im.getchannel('A'), np.float32) / 255
    print(f'{label} alpha: opaque {(a>0.95).mean()*100:.1f}%  transparent {(a<0.02).mean()*100:.1f}%  soft {(0.02<=a).mean()*100-(a>0.95).mean()*100:.1f}%')
    im = im.crop(im.getchannel('A').getbbox())
    im.save(path, quality=82, method=6)
    print(f'{label} {im.size}  {os.path.getsize(path)} bytes')
    return im

a = make_cloud(11, 'repo/assets/cloud-a.webp', label='cloud-a')
b = make_cloud(29, 'repo/assets/cloud-b.webp', label='cloud-b')

sheet = Image.new('RGBA', (1560, 560), (250, 250, 250, 255))
for im, x, w in ((a, 30, 700), (b, 800, 700)):
    sheet.alpha_composite(im.resize((w, int(im.height * w / im.width))), (x, 60))
sheet.convert('RGB').save('cloud-sheet.png')
print('sheet written')
