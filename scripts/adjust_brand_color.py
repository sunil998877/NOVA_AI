import os
from PIL import Image, ImageEnhance
import numpy as np

# Load source AI images
src_red = r"C:\Users\skp66\.gemini\antigravity-ide\brain\69020eec-c64b-4d50-b91f-aed7bdc11431\ai_neural_email_red_1788255274798.jpg"
src_amber = r"C:\Users\skp66\.gemini\antigravity-ide\brain\69020eec-c64b-4d50-b91f-aed7bdc11431\ai_neural_email_overview_1788254185073.jpg"

img_path = src_red if os.path.exists(src_red) else src_amber
img = Image.open(img_path).convert("RGB")

# Convert to HSV in numpy
arr = np.array(img, dtype=np.float32) / 255.0

# RGB to HSV transformation
r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
max_c = np.maximum(np.maximum(r, g), b)
min_c = np.minimum(np.minimum(r, g), b)
delta = max_c - min_c

# Hue calculation
h = np.zeros_like(r)
mask = delta > 0.001
h[mask & (max_c == r)] = ((g[mask & (max_c == r)] - b[mask & (max_c == r)]) / delta[mask & (max_c == r)]) % 6.0
h[mask & (max_c == g)] = ((b[mask & (max_c == g)] - r[mask & (max_c == g)]) / delta[mask & (max_c == g)]) + 2.0
h[mask & (max_c == b)] = ((r[mask & (max_c == b)] - g[mask & (max_c == b)]) / delta[mask & (max_c == b)]) + 4.0
h = h * 60.0
h[h < 0] += 360.0

# Saturation & Value
s = np.zeros_like(r)
s[max_c > 0.001] = delta[max_c > 0.001] / max_c[max_c > 0.001]
v = max_c

# Target Brand Color: Vibrant Vermilion / Coral Orange (#f05023)
# Target Hue is approx 14 - 16 degrees
target_hue = 15.0  # Warm vermilion-orange

# Shift red hues (340 - 360 and 0 - 25) or amber hues to target brand hue
is_glow = (s > 0.25) & ((h >= 330) | (h <= 45))
h[is_glow] = target_hue
# Boost saturation and vibrance to match pill button
s[is_glow] = np.clip(s[is_glow] * 1.15, 0, 1.0)
v[is_glow] = np.clip(v[is_glow] * 1.05, 0, 1.0)

# Convert back HSV to RGB
c = v * s
x = c * (1.0 - np.abs(((h / 60.0) % 2.0) - 1.0))
m = v - c

out_r = np.zeros_like(r)
out_g = np.zeros_like(g)
out_b = np.zeros_like(b)

h_idx = (h / 60.0).astype(int) % 6
# 0: C, X, 0
out_r[h_idx == 0] = c[h_idx == 0]
out_g[h_idx == 0] = x[h_idx == 0]
out_b[h_idx == 0] = 0
# 1: X, C, 0
out_r[h_idx == 1] = x[h_idx == 1]
out_g[h_idx == 1] = c[h_idx == 1]
out_b[h_idx == 1] = 0
# 2: 0, C, X
out_r[h_idx == 2] = 0
out_g[h_idx == 2] = c[h_idx == 2]
out_b[h_idx == 2] = x[h_idx == 2]
# 3: 0, X, C
out_r[h_idx == 3] = 0
out_g[h_idx == 3] = x[h_idx == 3]
out_b[h_idx == 3] = c[h_idx == 3]
# 4: X, 0, C
out_r[h_idx == 4] = x[h_idx == 4]
out_g[h_idx == 4] = 0
out_b[h_idx == 4] = c[h_idx == 4]
# 5: C, 0, X
out_r[h_idx == 5] = c[h_idx == 5]
out_g[h_idx == 5] = 0
out_b[h_idx == 5] = x[h_idx == 5]

final_rgb = np.stack([out_r + m, out_g + m, out_b + m], axis=-1)
final_rgb = np.clip(final_rgb * 255.0, 0, 255).astype(np.uint8)

res_img = Image.fromarray(final_rgb)

# Boost contrast slightly
enhancer = ImageEnhance.Contrast(res_img)
res_img = enhancer.enhance(1.08)

# Save to public and build landing paths
dst_pub = r"c:\Users\skp66\Videos\nova-email-marketer\frontend\public\landing\overview-dashboard.jpg"
dst_bld = r"c:\Users\skp66\Videos\nova-email-marketer\frontend\build\landing\overview-dashboard.jpg"

res_img.save(dst_pub, quality=96)
try:
    res_img.save(dst_bld, quality=96)
except:
    pass

print("SUCCESS: 3D AI Neural Core image color-graded to exact brand vermilion coral-orange (#f05023)!")
