# Draws icons/{16,32,48,128}.png: a sage-teal rounded square with a soft wave and a white search bar.
# No dependencies: shapes are signed-distance functions, supersampled for antialiasing.
# Run from the extension folder: python3 tools/make_icons.py
import math, struct, zlib

BG_TOP, BG_BOTTOM = (150, 214, 196), (72, 150, 140)
WAVE = (255, 255, 255, .16)   # lighter band, blended over the background
WHITE, ACCENT, LINE = (255, 255, 255), (63, 143, 134), (205, 228, 222)

def rrect(x, y, cx, cy, hw, hh, r):
    dx, dy = abs(x - cx) - hw + r, abs(y - cy) - hh + r
    return math.hypot(max(dx, 0), max(dy, 0)) + min(max(dx, dy), 0) - r

def capsule(x, y, ax, ay, bx, by, r):
    px, py, vx, vy = x - ax, y - ay, bx - ax, by - ay
    t = max(0, min(1, (px * vx + py * vy) / (vx * vx + vy * vy)))
    return math.hypot(px - vx * t, py - vy * t) - r

def color(x, y):
    """Colour at a point in the unit square, or None if outside the icon."""
    if rrect(x, y, .5, .5, .47, .47, .22) > 0:
        return None
    c = tuple(round(a + (b - a) * y) for a, b in zip(BG_TOP, BG_BOTTOM))
    if y > .76 + .035 * math.sin(x * 2 * math.pi):         # calm water line
        c = tuple(round(v + (w - v) * WAVE[3]) for v, w in zip(c, WAVE))
    if rrect(x, y, .5, .5, .36, .12, .12) <= 0:          # the bar
        c = WHITE
        ring = abs(math.hypot(x - .27, y - .49) - .045) - .016
        handle = capsule(x, y, .305, .525, .335, .555, .016)
        if min(ring, handle) <= 0:                         # magnifier inside the bar
            c = ACCENT
        elif rrect(x, y, .53, .5, .14, .018, .018) <= 0:  # placeholder line
            c = LINE
    return c

def render(size, ss=8):
    rows = []
    for py in range(size):
        row = bytearray([0])
        for px in range(size):
            acc, n = [0, 0, 0], 0
            for sy in range(ss):
                for sx in range(ss):
                    c = color((px + (sx + .5) / ss) / size, (py + (sy + .5) / ss) / size)
                    if c:
                        n += 1
                        for i in range(3): acc[i] += c[i]
            row += bytes([*(round(a / n) if n else 0 for a in acc), round(255 * n / ss ** 2)])
        rows.append(bytes(row))
    raw = zlib.compress(b''.join(rows), 9)
    chunk = lambda t, d: struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d))
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0)) + chunk(b'IDAT', raw) + chunk(b'IEND', b'')

for s in (16, 32, 48, 128):
    open(f'icons/{s}.png', 'wb').write(render(s))
    print('icons/%d.png' % s)
