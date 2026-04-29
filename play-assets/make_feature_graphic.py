"""
Play Store Feature Graphic 1024x500 for 위시맵.
Extracts the orange pin from icon.png (which has a white background)
and composites it onto a soft gradient with brand text.
"""
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import os

HERE = os.path.dirname(os.path.abspath(__file__))
ICON_SRC = os.path.abspath(os.path.join(HERE, "..", "assets", "images", "icon.png"))
OUT = os.path.join(HERE, "feature-graphic-1024x500.png")

W, H = 1024, 500
PRIMARY = (232, 89, 12)
BG_TOP = (255, 252, 249)
BG_BOT = (255, 229, 208)
DARK = (32, 18, 6)
MUTE = (120, 88, 66)


def gradient_bg(img):
    d = ImageDraw.Draw(img)
    for y in range(H):
        t = y / H
        r = int(BG_TOP[0] * (1 - t) + BG_BOT[0] * t)
        g = int(BG_TOP[1] * (1 - t) + BG_BOT[1] * t)
        b = int(BG_TOP[2] * (1 - t) + BG_BOT[2] * t)
        d.line([(0, y), (W, y)], fill=(r, g, b))


def remove_white_bg(img):
    """Replace near-white pixels with transparent. Keeps soft edges."""
    img = img.convert("RGBA")
    px = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            # brightness
            lum = (r + g + b) / 3
            if lum > 240:
                px[x, y] = (r, g, b, 0)
            elif lum > 200:
                # fade edges: map 200..240 linearly to alpha 255..0
                alpha = int((240 - lum) / 40 * 255)
                px[x, y] = (r, g, b, alpha)
    return img


def load_icon(size):
    ic = Image.open(ICON_SRC)
    ic = remove_white_bg(ic)
    ic.thumbnail((size, size), Image.LANCZOS)
    return ic


APPLE_SD = "/System/Library/Fonts/AppleSDGothicNeo.ttc"
# TTC weight indices (verified on macOS):
# 0=Regular, 2=Medium, 4=SemiBold, 6=Bold, 8=Light, 14=ExtraBold


def font(size, weight="Regular"):
    idx = {"Regular": 0, "Medium": 2, "SemiBold": 4, "Bold": 6, "Light": 8, "ExtraBold": 14}[weight]
    return ImageFont.truetype(APPLE_SD, size, index=idx)


def paste_icon_with_shadow(canvas, icon, pos, shadow_offset=(0, 18), shadow_blur=24, shadow_alpha=0.25):
    layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    layer.alpha_composite(icon, dest=pos)
    r, g, b, a = layer.split()
    black = Image.new("RGBA", canvas.size, (0, 0, 0, 255))
    black.putalpha(a.point(lambda v: int(v * shadow_alpha)))
    shifted = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    shifted.alpha_composite(black, dest=shadow_offset)
    blurred = shifted.filter(ImageFilter.GaussianBlur(shadow_blur))
    canvas.alpha_composite(blurred)
    canvas.alpha_composite(layer)


def main():
    img = Image.new("RGBA", (W, H), (255, 255, 255, 255))
    gradient_bg(img)

    # Layout: icon block on the left, text block on the right, balanced padding.
    SIDE_PAD = 90
    GAP = 50

    d = ImageDraw.Draw(img)
    title_font = font(110, "ExtraBold")
    sub_font = font(40, "Bold")
    tag_font = font(26, "Medium")

    title = "위시맵"
    subtitle = "동료와 함께 쓰는 맛집 지도"
    tagline = "우리 팀만의 맛집 리스트를 지도에 기록하세요"

    # Measure text widths so nothing overflows on the right.
    def tw(text, f):
        b = d.textbbox((0, 0), text, font=f)
        return b[2] - b[0], b[3] - b[1]

    t_w, t_h = tw(title, title_font)
    s_w, s_h = tw(subtitle, sub_font)
    g_w, g_h = tw(tagline, tag_font)

    text_block_w = max(t_w, s_w, g_w)
    icon_size = 300

    content_w = icon_size + GAP + text_block_w
    max_content_w = W - SIDE_PAD * 2
    if content_w > max_content_w:
        # scale icon down to fit
        icon_size = max_content_w - GAP - text_block_w
        content_w = max_content_w

    start_x = (W - content_w) // 2
    icon = load_icon(icon_size)
    ic_w, ic_h = icon.size
    iy = (H - ic_h) // 2
    paste_icon_with_shadow(img, icon, (start_x, iy))

    tx = start_x + icon_size + GAP
    block_h = t_h + 22 + s_h + 14 + g_h
    top = (H - block_h) // 2 - 12

    d.text((tx, top), title, fill=PRIMARY, font=title_font)
    d.text((tx + 2, top + t_h + 22), subtitle, fill=DARK, font=sub_font)
    d.text(
        (tx + 2, top + t_h + 22 + s_h + 14),
        tagline,
        fill=MUTE,
        font=tag_font,
    )

    img.convert("RGB").save(OUT, "PNG", optimize=True)
    print("wrote", OUT, os.path.getsize(OUT), "bytes")


if __name__ == "__main__":
    main()
