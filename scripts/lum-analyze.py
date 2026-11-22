import struct, zlib, sys, json
from pathlib import Path

def luma(path):
    data = Path(path).read_bytes()
    assert data[:8] == b"\x89PNG\r\n\x1a\n"
    pos = 8
    w = h = ct = None
    idats = []
    while pos < len(data):
        ln = struct.unpack(">I", data[pos:pos+4])[0]
        typ = data[pos+4:pos+8]
        chunk = data[pos+8:pos+8+ln]
        pos += 12 + ln
        if typ == b"IHDR":
            w, h, bit, ct = struct.unpack(">IIBB", chunk[:10])
        elif typ == b"IDAT":
            idats.append(chunk)
        elif typ == b"IEND":
            break
    raw = zlib.decompress(b"".join(idats))
    bpp = {0:1, 2:3, 3:1, 4:2, 6:4}[ct]
    stride = w * bpp
    out = bytearray()
    i = 0
    prev = bytearray(stride)
    def paeth(a,b,c):
        p = a + b - c
        pa, pb, pc = abs(p-a), abs(p-b), abs(p-c)
        return a if pa <= pb and pa <= pc else (b if pb <= pc else c)
    for y in range(h):
        f = raw[i]; i += 1
        row = bytearray(raw[i:i+stride]); i += stride
        if f == 1:
            for x in range(stride):
                row[x] = (row[x] + (row[x-bpp] if x >= bpp else 0)) & 255
        elif f == 2:
            for x in range(stride):
                row[x] = (row[x] + prev[x]) & 255
        elif f == 3:
            for x in range(stride):
                a = row[x-bpp] if x >= bpp else 0
                row[x] = (row[x] + ((a + prev[x]) // 2)) & 255
        elif f == 4:
            for x in range(stride):
                a = row[x-bpp] if x >= bpp else 0
                c = prev[x-bpp] if x >= bpp else 0
                row[x] = (row[x] + paeth(a, prev[x], c)) & 255
        elif f != 0:
            raise SystemExit("bad filter %s" % f)
        out.extend(row)
        prev = row
    s = 0.0
    n = w * h
    step = 4 if ct == 6 else 3 if ct == 2 else None
    if step is None:
        raise SystemExit("color type %s" % ct)
    for i in range(0, len(out), step):
        r, g, b = out[i], out[i+1], out[i+2]
        s += 0.2126*r + 0.7152*g + 0.0722*b
    return s / n

paths = sys.argv[1:]
vals = [luma(p) for p in paths]
max_d, at = 0.0, 0
for i in range(1, len(vals)):
    d = abs(vals[i] - vals[i-1])
    if d > max_d:
        max_d, at = d, i
mean = sum(vals)/len(vals) if vals else 0
print(json.dumps({"values":[round(v,4) for v in vals], "maxD": round(max_d,4), "at": at, "mean": round(mean,4)}))
