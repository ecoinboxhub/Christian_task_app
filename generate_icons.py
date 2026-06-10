from PIL import Image, ImageDraw
import os

def create_icon(size):
    img = Image.new('RGBA', (size, size), color=(52, 152, 219, 255))
    draw = ImageDraw.Draw(img)
    padding = size // 4
    thickness = size // 6
    v_start = (size // 2 - thickness // 2, padding)
    v_end = (size // 2 + thickness // 2, size - padding)
    draw.rectangle([v_start, v_end], fill=(255, 255, 255, 255))
    h_start = (padding, size // 3)
    h_end = (size - padding, size // 3 + thickness)
    draw.rectangle([h_start, h_end], fill=(255, 255, 255, 255))
    return img

sizes = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}
base_path = "android/app/src/main/res"
for name, size in sizes.items():
    icon = create_icon(size)
    folder = os.path.join(base_path, f"mipmap-{name}")
    if not os.path.exists(folder): os.makedirs(folder)
    icon.save(os.path.join(folder, "ic_launcher.png"))
    icon.save(os.path.join(folder, "ic_launcher_round.png"))
print("Icons generated successfully.")
