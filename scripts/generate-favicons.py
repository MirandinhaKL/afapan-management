from pathlib import Path
from PIL import Image, ImageChops


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public" / "afapan-favicon-master.png"
PUBLIC = ROOT / "public"

LIME = (204, 207, 69, 255)
DARK = (88, 89, 87, 255)
WHITE = (255, 255, 255, 255)


def emblem_mask(source: Image.Image) -> Image.Image:
    rgb = source.convert("RGB")
    saturation = rgb.convert("HSV").getchannel("S")
    mask = ImageChops.invert(saturation)
    return mask.point(lambda value: 255 if value >= 170 else 0)


def compose(mask: Image.Image, foreground: tuple[int, ...], background: tuple[int, ...]) -> Image.Image:
    foreground_layer = Image.new("RGBA", mask.size, foreground)
    background_layer = Image.new("RGBA", mask.size, background)
    return Image.composite(foreground_layer, background_layer, mask)


def resized(image: Image.Image, size: int) -> Image.Image:
    return image.resize((size, size), Image.Resampling.LANCZOS)


source = Image.open(SOURCE)
mask = emblem_mask(source)
light = compose(mask, WHITE, LIME)
dark = compose(mask, LIME, DARK)

resized(light, 32).save(PUBLIC / "icon-light-32x32.png", optimize=True)
resized(dark, 32).save(PUBLIC / "icon-dark-32x32.png", optimize=True)
resized(light, 180).save(PUBLIC / "apple-icon.png", optimize=True)
resized(light, 192).save(PUBLIC / "icon-192x192.png", optimize=True)
resized(light, 512).save(PUBLIC / "icon-512x512.png", optimize=True)

resized(light, 256).save(
    ROOT / "app" / "favicon.ico",
    format="ICO",
    sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
)
