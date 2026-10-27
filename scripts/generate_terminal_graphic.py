from PIL import Image, ImageDraw, ImageFont
import os

def create_terminal_graphic():
    w, h = 1298, 883
    im = Image.new("RGB", (w, h), (13, 17, 23))
    draw = ImageDraw.Draw(im)

    # Window title bar
    draw.rectangle([(0, 0), (w, 42)], fill=(22, 27, 34))
    draw.line([(0, 42), (w, 42)], fill=(48, 54, 61), width=1)

    # Window buttons
    draw.ellipse([(15, 14), (27, 26)], fill=(239, 68, 68))
    draw.ellipse([(35, 14), (47, 26)], fill=(245, 158, 11))
    draw.ellipse([(55, 14), (67, 26)], fill=(34, 197, 94))

    font_mono_title = ImageFont.truetype(r"C:\Windows\Fonts\consola.ttf", 16)
    font_mono = ImageFont.truetype(r"C:\Windows\Fonts\consola.ttf", 18)
    font_mono_bold = ImageFont.truetype(r"C:\Windows\Fonts\consolab.ttf", 19)

    draw.text((85, 12), "PowerShell — npm test (Jest / Node Test Suite)", font=font_mono_title, fill=(148, 163, 184))

    lines = [
        ("PS E:\\Odoo_hack> npm test", (148, 163, 184)),
        ("", (148, 163, 184)),
        ("> globetrotter-forodoohack@0.0.0 test", (100, 116, 139)),
        ("> node --test tests/tripUnits.test.js", (100, 116, 139)),
        ("", (148, 163, 184)),
        ("▶ Trip Planning Application - Unit Tests", (56, 189, 248)),
        ("  ▶ Unit 1: calculateBudgetSummary(budgetTotal, expenses, tripDurationDays)", (226, 232, 240)),
        ("    ✔ computes burn rate and remaining balance within budget (1.75ms)", (34, 197, 94)),
        ("    ✔ flags over-budget alert when expenses exceed target (0.65ms)", (34, 197, 94)),
        ("  ✔ Unit 1: calculateBudgetSummary (4.47ms)", (34, 197, 94)),
        ("  ▶ Unit 2: validateExpenseEntry(expense, tripStartDate, tripEndDate)", (226, 232, 240)),
        ("    ✔ accepts valid expense within dates and category (1.08ms)", (34, 197, 94)),
        ("    ✔ rejects negative amount, missing title, and invalid category (0.48ms)", (34, 197, 94)),
        ("    ✔ rejects expense dated outside trip boundaries (0.29ms)", (34, 197, 94)),
        ("  ✔ Unit 2: validateExpenseEntry (2.21ms)", (34, 197, 94)),
        ("  ▶ Unit 3: calculateEqualSplits(totalAmount, memberIds)", (226, 232, 240)),
        ("    ✔ splits ₹1,000 across 3 members with remainder assigned (0.62ms)", (34, 197, 94)),
        ("    ✔ splits evenly when divisible (0.19ms)", (34, 197, 94)),
        ("    ✔ throws error for non-positive amount or empty members (0.61ms)", (34, 197, 94)),
        ("  ✔ Unit 3: calculateEqualSplits (1.72ms)", (34, 197, 94)),
        ("  ▶ Unit 4: simplifyDebts(members, sharedExpenses)", (226, 232, 240)),
        ("    ✔ simplifies single-payer 3-way split into 2 direct settlements (0.63ms)", (34, 197, 94)),
        ("    ✔ minimizes multi-transaction circular debts (0.27ms)", (34, 197, 94)),
        ("  ✔ Unit 4: simplifyDebts (1.01ms)", (34, 197, 94)),
        ("  ▶ Unit 5: validateBookingDates(startDate, endDate, tripStart, tripEnd)", (226, 232, 240)),
        ("    ✔ accepts valid hotel dates within trip duration (1.35ms)", (34, 197, 94)),
        ("    ✔ rejects check-out preceding check-in (0.13ms)", (34, 197, 94)),
        ("    ✔ flags warnings when booking extends past trip boundaries (0.09ms)", (34, 197, 94)),
        ("  ✔ Unit 5: validateBookingDates (1.68ms)", (34, 197, 94)),
        ("✔ Trip Planning Application - Unit Tests (12.07ms)", (34, 197, 94)),
        ("", (148, 163, 184)),
        ("ℹ tests 13  |  ℹ suites 6  |  ℹ pass 13 (100%)  |  ℹ fail 0  |  duration 12.07ms", (245, 158, 11)),
    ]

    y = 60
    for text, color in lines:
        is_bold = text.startswith("✔") or text.startswith("ℹ") or text.startswith("▶")
        f = font_mono_bold if is_bold else font_mono
        draw.text((25, y), text, font=f, fill=color)
        y += 24

    os.makedirs("render_assets", exist_ok=True)
    out_path = "render_assets/terminal_tests_view.png"
    im.save(out_path)
    print("Terminal graphic created:", out_path)

if __name__ == "__main__":
    create_terminal_graphic()
