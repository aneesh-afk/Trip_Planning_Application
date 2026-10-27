import os
from PIL import Image, ImageDraw, ImageFont

def get_font(name="segoeuib.ttf", size=24):
    try:
        font_path = os.path.join(r"C:\Windows\Fonts", name)
        return ImageFont.truetype(font_path, size)
    except Exception:
        return ImageFont.load_default()

def create_slide_frame(
    screenshot_path,
    module_tag,
    session_tag,
    session_color,
    timestamp_str,
    narration_title,
    narration_text,
    callout_title=None,
    callout_lines=None,
    callout_badge=None,
    out_path="test_slide.png"
):
    canvas_w, canvas_h = 1920, 1080
    bg = Image.new("RGB", (canvas_w, canvas_h), (13, 17, 23)) # Deep slate / charcoal
    draw = ImageDraw.Draw(bg)

    # Top Header Bar (Height: 80px)
    draw.rectangle([(0, 0), (canvas_w, 80)], fill=(22, 27, 34))
    draw.line([(0, 80), (canvas_w, 80)], fill=(48, 54, 61), width=2)

    # Header Left: Logo & Project Title
    font_bold_26 = get_font("segoeuib.ttf", 26)
    font_bold_20 = get_font("segoeuib.ttf", 20)
    font_reg_18 = get_font("segoeui.ttf", 18)
    font_mono_18 = get_font("consola.ttf", 18)

    # Orange accent circle icon
    draw.ellipse([(25, 22), (57, 54)], fill=(249, 115, 22))
    draw.text((34, 25), "G", font=font_bold_26, fill=(255, 255, 255))
    draw.text((70, 24), "GLOBETROTTER", font=font_bold_26, fill=(255, 255, 255))

    # Header Middle: Module Tag Pill
    mod_bbox = draw.textbbox((0, 0), module_tag, font=font_bold_20)
    mod_w = mod_bbox[2] - mod_bbox[0] + 30
    mod_x = (canvas_w - mod_w) // 2
    draw.rounded_rectangle([(mod_x, 20), (mod_x + mod_w, 60)], radius=12, fill=(33, 38, 45), outline=(56, 139, 253), width=2)
    draw.text((mod_x + 15, 26), module_tag, font=font_bold_20, fill=(88, 166, 255))

    # Header Right: Session Badge Pill + Timestamp
    sess_bbox = draw.textbbox((0, 0), session_tag, font=font_bold_20)
    sess_w = sess_bbox[2] - sess_bbox[0] + 30
    sess_x = canvas_w - sess_w - 180
    draw.rounded_rectangle([(sess_x, 20), (sess_x + sess_w, 60)], radius=12, fill=session_color[0], outline=session_color[1], width=2)
    draw.text((sess_x + 15, 26), session_tag, font=font_bold_20, fill=session_color[2])

    # Timestamp Pill
    draw.rounded_rectangle([(canvas_w - 160, 20), (canvas_w - 25, 60)], radius=10, fill=(15, 23, 42), outline=(100, 116, 139), width=1)
    draw.text((canvas_w - 145, 27), timestamp_str, font=font_mono_18, fill=(226, 232, 240))

    # Center Workspace: Place live application screenshot
    content_y = 100
    content_h = 810
    if os.path.exists(screenshot_path):
        app_img = Image.open(screenshot_path).convert("RGBA")
        # Resize to fit height cleanly (e.g. max 1420 x 800)
        target_h = 790
        ratio = target_h / float(app_img.height)
        target_w = int(app_img.width * ratio)
        if target_w > 1450:
            target_w = 1450
            ratio = target_w / float(app_img.width)
            target_h = int(app_img.height * ratio)

        app_resized = app_img.resize((target_w, target_h), Image.Resampling.LANCZOS)
        
        # Position slightly left to leave room for callout card
        app_x = 35
        app_y = content_y + (content_h - target_h) // 2

        # Screenshot frame & shadow
        draw.rounded_rectangle([(app_x - 4, app_y - 4), (app_x + target_w + 4, app_y + target_h + 4)], radius=14, fill=(15, 23, 42), outline=(71, 85, 105), width=2)
        bg.paste(app_resized, (app_x, app_y), app_resized)

        # Right-side Information / Calculation Callout Card
        card_x = app_x + target_w + 25
        card_w = canvas_w - card_x - 35
        card_y = app_y
        card_h = target_h

        draw.rounded_rectangle([(card_x, card_y), (card_x + card_w, card_y + card_h)], radius=16, fill=(22, 27, 34), outline=(48, 54, 61), width=2)

        # Callout Card Header
        draw.rounded_rectangle([(card_x, card_y), (card_x + card_w, card_y + 70)], radius=16, fill=(30, 41, 59))
        if callout_badge:
            draw.text((card_x + 20, card_y + 14), callout_badge.upper(), font=font_bold_20, fill=(245, 158, 11))
        if callout_title:
            draw.text((card_x + 20, card_y + 38), callout_title, font=font_bold_20, fill=(255, 255, 255))

        # Callout Lines
        line_y = card_y + 90
        font_callout_body = get_font("segoeui.ttf", 19)
        font_callout_bold = get_font("segoeuib.ttf", 20)
        font_mono_22 = get_font("consola.ttf", 22)

        if callout_lines:
            for item in callout_lines:
                if isinstance(item, tuple) and len(item) == 2:
                    label, val = item
                    draw.text((card_x + 20, line_y), label, font=font_callout_body, fill=(148, 163, 184))
                    draw.text((card_x + 20, line_y + 24), val, font=font_mono_22, fill=(56, 189, 248))
                    line_y += 65
                elif isinstance(item, str):
                    if item.startswith("---"):
                        draw.line([(card_x + 20, line_y + 10), (card_x + card_w - 20, line_y + 10)], fill=(51, 65, 85), width=2)
                        line_y += 25
                    elif item.startswith("✔") or item.startswith("★") or item.startswith("➜"):
                        draw.text((card_x + 20, line_y), item, font=font_callout_bold, fill=(74, 222, 128))
                        line_y += 38
                    else:
                        draw.text((card_x + 20, line_y), item, font=font_callout_body, fill=(226, 232, 240))
                        line_y += 32

    # Bottom Lower Third (Height: 140px)
    draw.rectangle([(0, canvas_h - 140), (canvas_w, canvas_h)], fill=(15, 23, 42))
    draw.line([(0, canvas_h - 140), (canvas_w, canvas_h - 140)], fill=(59, 130, 246), width=3)

    # Narration Title
    draw.text((40, canvas_h - 128), narration_title.upper(), font=font_bold_20, fill=(96, 165, 250))
    # Narration Text (readable white text)
    draw.text((40, canvas_h - 96), narration_text[:145], font=font_reg_18, fill=(248, 250, 252))
    if len(narration_text) > 145:
        draw.text((40, canvas_h - 68), narration_text[145:290], font=font_reg_18, fill=(248, 250, 252))

    bg.save(out_path, quality=95)
    print("Slide saved to:", out_path)

if __name__ == "__main__":
    test_img = r"C:\Users\Aneesh Suvarna\.gemini\antigravity-ide\brain\3451ed12-4f18-406b-a49e-94dd88dc8dc8\landing_page_1792558572887.png"
    create_slide_frame(
        screenshot_path=test_img,
        module_tag="GLOBETROTTER OVERVIEW",
        session_tag="PUBLIC PORTAL",
        session_color=((30, 41, 59), (71, 85, 105), (203, 213, 225)),
        timestamp_str="00:10 / 05:00",
        narration_title="0:00-0:20 • System Introduction",
        narration_text="Welcome to Globetrotter, a full-stack trip planning and collaborative travel platform. Streamlining itinerary building, budget tracking, bookings, and automated group debt settlement.",
        callout_badge="Core Platform",
        callout_title="Travel Planning Architecture",
        callout_lines=[
            ("Target Platform", "Web & Mobile Cloud App"),
            ("Real-Time Engine", "Supabase WebSockets"),
            ("Test Coverage", "100% (13 Passing Tests)"),
            "---",
            "➜ Multi-city Indian Route Builder",
            "➜ Target vs Actual Budgeting",
            "➜ PNR & Booking Validations",
            "➜ Greedy Debt Simplification",
        ],
        out_path="render_assets/test_slide.png"
    )
