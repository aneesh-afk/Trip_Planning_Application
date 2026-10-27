import os
import subprocess
import shutil
from PIL import Image, ImageDraw, ImageFont

ARTIFACT_DIR = r"C:\Users\Aneesh Suvarna\.gemini\antigravity-ide\brain\3451ed12-4f18-406b-a49e-94dd88dc8dc8"
ASSETS_DIR = r"e:\Odoo_hack\render_assets"
os.makedirs(ASSETS_DIR, exist_ok=True)

def get_font(name="segoeuib.ttf", size=24):
    try:
        font_path = os.path.join(r"C:\Windows\Fonts", name)
        return ImageFont.truetype(font_path, size)
    except Exception:
        return ImageFont.load_default()

def create_slide_frame(
    screenshot_path,
    module_tag=None,
    session_tag=None,
    session_color=None,
    timestamp_str=None,
    narration_title=None,
    narration_text=None,
    callout_badge=None,
    callout_title=None,
    callout_lines=None,
    out_path="slide.png"
):
    if not os.path.exists(screenshot_path):
        raise FileNotFoundError(f"Screenshot not found: {screenshot_path}")

    app_img = Image.open(screenshot_path).convert("RGB")

    # If it is a browser screenshot (1298x883), crop the outer 28px
    # to eliminate any browser subagent automation glow / window borders
    if "terminal_tests_view" not in screenshot_path and app_img.size == (1298, 883):
        app_img = app_img.crop((28, 28, app_img.width - 28, app_img.height - 28))

    # Resize directly to 1920x1080 full screen (edge-to-edge pure website screen)
    app_resized = app_img.resize((1920, 1080), Image.Resampling.LANCZOS)
    app_resized.save(out_path, quality=98)

# Color themes for sessions
COLOR_PUBLIC = ((26, 35, 54), (71, 85, 105), (203, 213, 225))
COLOR_ACC1   = ((20, 83, 45), (34, 197, 94), (187, 247, 208))   # Vibrant Emerald for Account 1
COLOR_ACC2   = ((88, 28, 135), (168, 85, 247), (243, 232, 255)) # Royal Violet for Account 2
COLOR_ADMIN  = ((120, 53, 15), (245, 158, 11), (254, 243, 199)) # Amber for Admin
COLOR_TESTS  = ((12, 74, 110), (14, 165, 233), (224, 242, 254)) # Cyan for Tests

slides_data = [
    # Scene 1: Introduction (20s)
    {
        "id": "slide_01",
        "duration": 20.0,
        "screenshot": os.path.join(ARTIFACT_DIR, "landing_page_1792558572887.png"),
        "module_tag": "GLOBETROTTER PLATFORM OVERVIEW",
        "session_tag": "LIVE DEMO • LOCALHOST:5173",
        "session_color": COLOR_PUBLIC,
        "timestamp_str": "00:10 / 05:00",
        "narration_title": "0:00–0:20 • System Introduction",
        "narration_text": "Welcome to Globetrotter, a full-stack trip planning and collaborative travel platform. Globetrotter streamlines every stage of group travel, from itinerary building and target-versus-actual budget tracking, to verified booking management, multi-user collaboration, and automated group debt settlement.",
        "callout_badge": "Architecture",
        "callout_title": "Full-Stack Travel Suite",
        "callout_lines": [
            ("Frontend Stack", "React 19 + Vite 8 + CSS"),
            ("Database Engine", "Supabase + PostgreSQL"),
            ("Real-Time Comms", "Postgres Realtime WebSockets"),
            ("Test Coverage", "100% (13 Passing Tests)"),
            "---",
            "➜ Multi-City Route Builder",
            "➜ Target vs Actual Budgeting",
            "➜ Booking PNR Validations",
            "➜ Greedy Debt Simplification",
        ]
    },
    # Scene 2: Login and Dashboard (25s total = 10s + 15s)
    {
        "id": "slide_02a",
        "duration": 10.0,
        "screenshot": os.path.join(ARTIFACT_DIR, "scene_login_1792559253347.png"),
        "module_tag": "AUTHENTICATION & ACCESS",
        "session_tag": "ACCOUNT 1: AARAV SHARMA",
        "session_color": COLOR_ACC1,
        "timestamp_str": "00:25 / 05:00",
        "narration_title": "0:20–0:45 • Account 1 Authentication",
        "narration_text": "We begin by authenticating as Account 1, Aarav Sharma, our trip organizer. The dashboard provides immediate visibility into active trips, planned destinations across India, and upcoming group travels.",
        "callout_badge": "Credentials",
        "callout_title": "Account 1 (Organizer)",
        "callout_lines": [
            ("User Email", "demo.traveler2026@gmail.com"),
            ("Assigned Role", "Trip Organizer (Member A)"),
            ("Auth Provider", "Supabase Auth Engine"),
            "---",
            "✔ Verified Session Active",
            "✔ No Demo Banner or Mock Data",
        ]
    },
    {
        "id": "slide_02b",
        "duration": 15.0,
        "screenshot": os.path.join(ARTIFACT_DIR, "scene_dashboard_1792559214013.png"),
        "module_tag": "CENTRAL TRAVELER DASHBOARD",
        "session_tag": "ACCOUNT 1: AARAV SHARMA",
        "session_color": COLOR_ACC1,
        "timestamp_str": "00:40 / 05:00",
        "narration_title": "0:20–0:45 • Traveler Dashboard",
        "narration_text": "From here, users can create new trips, monitor active itineraries, and access shared expenses.",
        "callout_badge": "Dashboard KPIs",
        "callout_title": "Active Travel Overview",
        "callout_lines": [
            ("Showcase Trip", "Rajasthan Heritage Tour"),
            ("Planned Stops", "3 Cities (Delhi, Jaipur, Udaipur)"),
            ("Target Budget", "₹45,000 INR"),
            ("Collaborators", "2 Group Members"),
            "---",
            "➜ Quick Action: Create New Trip",
            "➜ Direct Budget & Split Navigation",
        ]
    },
    # Scene 3: Create a Trip (30s total = 15s + 15s)
    {
        "id": "slide_03a",
        "duration": 15.0,
        "screenshot": os.path.join(ARTIFACT_DIR, "scene_create_trip_1792559291128.png"),
        "module_tag": "NEW TRIP CREATION WORKFLOW",
        "session_tag": "ACCOUNT 1: AARAV SHARMA",
        "session_color": COLOR_ACC1,
        "timestamp_str": "00:55 / 05:00",
        "narration_title": "0:45–1:15 • Creating a New Trip",
        "narration_text": "Here we demonstrate creating a new trip. We name it Goa Beach and Heritage Getaway, select the Western India region, and set our travel dates from November 10th to 14th with a target budget of 25,000 rupees.",
        "callout_badge": "Form Fields",
        "callout_title": "Goa Trip Configuration",
        "callout_lines": [
            ("Destination", "Goa, Western India"),
            ("Dates", "Nov 10 – Nov 14, 2026 (5 Days)"),
            ("Target Budget", "₹25,000 INR"),
            ("Date Validation", "Start Date <= End Date"),
            "---",
            "✔ 100% Indian Geographic Scope",
            "✔ Custom User Destination Input",
        ]
    },
    {
        "id": "slide_03b",
        "duration": 15.0,
        "screenshot": os.path.join(ARTIFACT_DIR, "trip_itinerary_view_1792558622266.png"),
        "module_tag": "ITINERARY BUILDER & ROUTE TIMELINE",
        "session_tag": "ACCOUNT 1: AARAV SHARMA",
        "session_color": COLOR_ACC1,
        "timestamp_str": "01:10 / 05:00",
        "narration_title": "0:45–1:15 • Multi-City Route Planning",
        "narration_text": "The system initializes the itinerary, allowing travelers to add custom stops, daily activities, and transport legs without any template restrictions.",
        "callout_badge": "Route Stops",
        "callout_title": "Rajasthan Heritage Tour",
        "callout_lines": [
            ("Stop 1 (Delhi)", "Nov 1 – Nov 3 (2 Nights)"),
            ("Stop 2 (Jaipur)", "Nov 3 – Nov 5 (2 Nights)"),
            ("Stop 3 (Udaipur)", "Nov 5 – Nov 8 (3 Nights)"),
            "---",
            "➜ Amber Fort Elephant Tour (₹1,500)",
            "➜ Lake Pichola Boat Cruise (₹2,200)",
            "➜ Vande Bharat Express Transit (₹1,850)",
        ]
    },
    # Scene 4: Add a Group Member (25s total = 12s + 13s)
    {
        "id": "slide_04a",
        "duration": 12.0,
        "screenshot": os.path.join(ARTIFACT_DIR, "scene_group_members_1792559303131.png"),
        "module_tag": "MODULE 4.6: GROUP COLLABORATION (FR-21)",
        "session_tag": "ACCOUNT 1: AARAV SHARMA",
        "session_color": COLOR_ACC1,
        "timestamp_str": "01:22 / 05:00",
        "narration_title": "1:15–1:40 • Inviting Account 2",
        "narration_text": "Next, we invite our travel partner into the group trip. Using the group members panel, we invite Account 2, Aneesh Suvarna.",
        "callout_badge": "Member Invite",
        "callout_title": "Trip Member Delegation",
        "callout_lines": [
            ("Invited Member", "aneesh.suvarna24@spit.ac.in"),
            ("Assigned Role", "Trip Member (Collaborator)"),
            ("Invitation Modal", "Live Registered Users Lookup"),
            "---",
            "✔ Shared Financial Visibility",
            "✔ Multi-Payer Expense Rights",
        ]
    },
    {
        "id": "slide_04b",
        "duration": 13.0,
        "screenshot": os.path.join(ARTIFACT_DIR, "scene_shared_expenses_1792559330087.png"),
        "module_tag": "REAL-TIME MULTI-ACCOUNT SYNC",
        "session_tag": "ACCOUNT 2: ANEESH (INCOGNITO)",
        "session_color": COLOR_ACC2,
        "timestamp_str": "01:35 / 05:00",
        "narration_title": "1:15–1:40 • Separate Session Verified",
        "narration_text": "We switch over to a separate browser profile logged in as Account 2. The shared trip immediately synchronizes in real time, granting both travelers collaborative access to the itinerary and finances.",
        "callout_badge": "Cloud Sync",
        "callout_title": "Cross-Account Verification",
        "callout_lines": [
            ("Active Session", "Account 2 (Separate Browser)"),
            ("Traveler", "Aneesh Suvarna (Member B)"),
            ("Channel", "public.trip_members Realtime"),
            "---",
            "★ Live Collaborative Access",
            "★ Instant Real-Time Updates",
        ]
    },
    # Scene 5: Itinerary, Budget, and Bookings (25s total = 13s + 12s)
    {
        "id": "slide_05a",
        "duration": 13.0,
        "screenshot": os.path.join(ARTIFACT_DIR, "scene_budget_kpis_1792559340355.png"),
        "module_tag": "MODULE 4.4: BUDGET TRACKING (FR-13–16)",
        "session_tag": "ACCOUNT 1: AARAV SHARMA",
        "session_color": COLOR_ACC1,
        "timestamp_str": "01:48 / 05:00",
        "narration_title": "1:40–2:05 • Target vs Actual Budgeting",
        "narration_text": "In Module 4.4, Globetrotter tracks our 45,000 rupee target against actual expenses with category breakdowns and daily burn rates. Over-budget banners alert travelers if limits are exceeded.",
        "callout_badge": "Budget Health",
        "callout_title": "Spending Metrics",
        "callout_lines": [
            ("Target Budget", "₹45,000 INR"),
            ("Total Actual Spent", "₹30,450 INR"),
            ("Remaining Balance", "₹14,550 INR (32.3%)"),
            ("Daily Burn Rate", "₹4,350 / day"),
            "---",
            "✔ Over-Budget Banner Active (FR-16)",
            "✔ Category Bar Breakdown",
        ]
    },
    {
        "id": "slide_05b",
        "duration": 12.0,
        "screenshot": os.path.join(ARTIFACT_DIR, "scene_bookings_1792559358435.png"),
        "module_tag": "MODULE 4.5: BOOKINGS & STAYS (FR-17–20)",
        "session_tag": "ACCOUNT 1: AARAV SHARMA",
        "session_color": COLOR_ACC1,
        "timestamp_str": "02:00 / 05:00",
        "narration_title": "1:40–2:05 • Verified Stays & PNR Codes",
        "narration_text": "In Module 4.5, bookings feature verified confirmation codes and automatic date validation.",
        "callout_badge": "Validations",
        "callout_title": "Reservations Ledger",
        "callout_lines": [
            ("Taj Lake Palace", "HTL-TLP-8842 (₹14,500)"),
            ("Vande Bharat", "PNR-249019201 (₹1,850)"),
            ("Date Conflict Check", "Checkout cannot precede Checkin"),
            "---",
            "✔ Boundaries Validation (FR-18)",
            "✔ Categorized Stays vs Transit",
        ]
    },
    # Scene 6: Group Expense Splitting Across Two Accounts (90s total = 25s + 20s + 20s + 25s)
    {
        "id": "slide_06a",
        "duration": 25.0,
        "screenshot": os.path.join(ARTIFACT_DIR, "scene_shared_expenses_1792559330087.png"),
        "module_tag": "MODULE 4.6: EXPENSE 1 (HOTEL BOOKING)",
        "session_tag": "ACCOUNT 1: AARAV SHARMA",
        "session_color": COLOR_ACC1,
        "timestamp_str": "02:20 / 05:00",
        "narration_title": "2:05–3:35 • Shared Expense 1 (Hotel)",
        "narration_text": "Now for our core feature: group expense splitting across two accounts. First, in Account 1, Aarav logs a shared hotel booking of 2,000 rupees, paid by Account 1 and split equally. The application divides the expense at 1,000 rupees per member.",
        "callout_badge": "Expense 1",
        "callout_title": "Hotel Booking Split",
        "callout_lines": [
            ("Description", "Shared Hotel Booking"),
            ("Total Amount", "₹2,000 INR"),
            ("Paid By", "Aarav Sharma (Account 1)"),
            ("Split Method", "Equal Split (2 Members)"),
            ("Share per Person", "₹1,000 each"),
            "---",
            "➜ Account 2 owes Account 1: ₹1,000",
        ]
    },
    {
        "id": "slide_06b",
        "duration": 20.0,
        "screenshot": os.path.join(ARTIFACT_DIR, "group_split_view_1792558665787.png"),
        "module_tag": "REAL-TIME CROSS-SESSION UPDATE",
        "session_tag": "ACCOUNT 2: ANEESH (INCOGNITO)",
        "session_color": COLOR_ACC2,
        "timestamp_str": "02:40 / 05:00",
        "narration_title": "2:05–3:35 • Switch to Account 2 Profile",
        "narration_text": "In the settlement ledger, Account 2 now owes Account 1 exactly 1,000 rupees. Next, we switch visibly to Account 2's session. The shared hotel appears in Account 2's feed.",
        "callout_badge": "Session Switch",
        "callout_title": "Account 2 Synced View",
        "callout_lines": [
            ("Visible Session", "Account 2 (Incognito Window)"),
            ("Feed Sync", "Hotel Booking (₹2,000) Received"),
            ("Payer Logged", "Aarav Sharma"),
            ("Interim Balance", "Aneesh owes Aarav ₹1,000"),
            "---",
            "✔ Real-Time Supabase WebSocket Push",
        ]
    },
    {
        "id": "slide_06c",
        "duration": 20.0,
        "screenshot": os.path.join(ARTIFACT_DIR, "scene_shared_expenses_1792559330087.png"),
        "module_tag": "MODULE 4.6: EXPENSE 2 (DINNER)",
        "session_tag": "ACCOUNT 2: ANEESH (INCOGNITO)",
        "session_color": COLOR_ACC2,
        "timestamp_str": "03:00 / 05:00",
        "narration_title": "2:05–3:35 • Shared Expense 2 (Dinner)",
        "narration_text": "From Account 2, Aneesh records a shared dinner expense of 600 rupees, paid by Account 2 and split equally at 300 rupees each.",
        "callout_badge": "Expense 2",
        "callout_title": "Dinner Expense Split",
        "callout_lines": [
            ("Description", "Traditional Heritage Dinner"),
            ("Total Amount", "₹600 INR"),
            ("Paid By", "Aneesh Suvarna (Account 2)"),
            ("Split Method", "Equal Split (2 Members)"),
            ("Share per Person", "₹300 each"),
            "---",
            "➜ Account 1 owes Account 2: ₹300",
        ]
    },
    {
        "id": "slide_06d",
        "duration": 25.0,
        "screenshot": os.path.join(ARTIFACT_DIR, "group_split_view_1792558665787.png"),
        "module_tag": "MODULE 4.6: NET DEBT SETTLEMENT (FR-24)",
        "session_tag": "CONSOLIDATED SETTLEMENT LEDGER",
        "session_color": COLOR_ACC1,
        "timestamp_str": "03:25 / 05:00",
        "narration_title": "2:05–3:35 • Mathematical Net Settlement",
        "narration_text": "Let us look at the mathematics: total group spending is 2,000 plus 600, equaling 2,600 rupees. Each member's fair share is 1,300 rupees. Account 1 paid 2,000, leaving a net credit of 700. Account 2 paid 600, leaving a net debit of 700. The settlement engine nets both transactions into one direct payment: Account 2 owes Account 1 exactly 700 rupees.",
        "callout_badge": "Net Settlement",
        "callout_title": "Consolidated Math",
        "callout_lines": [
            ("Total Spending", "₹2,000 + ₹600 = ₹2,600"),
            ("Fair Share per Person", "₹2,600 ÷ 2 = ₹1,300"),
            ("Account 1 (Aarav)", "Paid ₹2,000 - ₹1,300 = +₹700"),
            ("Account 2 (Aneesh)", "Paid ₹600 - ₹1,300 = -₹700"),
            "---",
            "★ FINAL NET SETTLEMENT ★",
            "✔ ANEESH OWES AARAV ₹700",
        ]
    },
    # Scene 7: Debt Settlement (35s total = 18s + 17s)
    {
        "id": "slide_07a",
        "duration": 18.0,
        "screenshot": os.path.join(ARTIFACT_DIR, "group_split_view_1792558665787.png"),
        "module_tag": "GREEDY DEBT SIMPLIFICATION",
        "session_tag": "SETTLEMENT ENGINE",
        "session_color": COLOR_ACC1,
        "timestamp_str": "03:45 / 05:00",
        "narration_title": "3:35–4:10 • Eliminating Circular Debts",
        "narration_text": "In the debt settlement module, Globetrotter simplifies complex group obligations. Our greedy flow algorithm eliminates circular debts, consolidating multi-member balances into the minimum possible transactions.",
        "callout_badge": "Algorithm",
        "callout_title": "Greedy Flow Engine",
        "callout_lines": [
            ("Optimization", "Minimum Transaction Flow"),
            ("Complexity", "O(N log N) greedy settle"),
            ("Circular Debts", "Completely Eliminated"),
            "---",
            "✔ Single Consolidated Payment",
            "✔ Transparent Audit History",
        ]
    },
    {
        "id": "slide_07b",
        "duration": 17.0,
        "screenshot": os.path.join(ARTIFACT_DIR, "scene_shared_expenses_1792559330087.png"),
        "module_tag": "SETTLEMENT EXECUTION & STATUS",
        "session_tag": "GROUP AUDIT TRAIL",
        "session_color": COLOR_ACC1,
        "timestamp_str": "04:02 / 05:00",
        "narration_title": "3:35–4:10 • Recording Payments",
        "narration_text": "When payments are made, travelers can record settlements, instantly updating balances and keeping the group ledger transparent.",
        "callout_badge": "Settle Up",
        "callout_title": "Ledger Confirmation",
        "callout_lines": [
            ("Action", "Mark as Settled Button"),
            ("Result", "Debts cleared to ₹0.00"),
            ("Audit Log", "Recorded with Timestamp"),
            "---",
            "✔ Real-Time Broadcast to Members",
            "✔ Permanent Travel History Log",
        ]
    },
    # Scene 8: Other Implemented Modules (30s total = 10s + 10s + 10s)
    {
        "id": "slide_08a",
        "duration": 10.0,
        "screenshot": os.path.join(ARTIFACT_DIR, "my_trips_view_1792558673796.png"),
        "module_tag": "MY TRIPS PORTFOLIO",
        "session_tag": "TRAVELER WORKSPACE",
        "session_color": COLOR_PUBLIC,
        "timestamp_str": "04:15 / 05:00",
        "narration_title": "4:10–4:40 • My Trips Portfolio",
        "narration_text": "Globetrotter also includes comprehensive companion modules. The My Trips view organizes past and upcoming journeys.",
        "callout_badge": "Portfolios",
        "callout_title": "Journey Management",
        "callout_lines": [
            ("Filtering", "Upcoming, Past, & Shared Trips"),
            ("Actions", "View Itinerary, Duplicate, Edit"),
            "---",
            "✔ Lifetime Travel Archiving",
        ]
    },
    {
        "id": "slide_08b",
        "duration": 10.0,
        "screenshot": os.path.join(ARTIFACT_DIR, "community_trips_view_1792558682186.png"),
        "module_tag": "COMMUNITY & PUBLIC EXPLORER",
        "session_tag": "PUBLIC DISCOVERY HUB",
        "session_color": COLOR_PUBLIC,
        "timestamp_str": "04:25 / 05:00",
        "narration_title": "4:10–4:40 • Community Trips Feed",
        "narration_text": "The Community hub lets travelers discover and clone curated Indian itineraries. The Calendar view visualizes schedules day by day...",
        "callout_badge": "Community",
        "callout_title": "Social Discovery",
        "callout_lines": [
            ("Curated Feeds", "Top Indian Destinations"),
            ("One-Click Clone", "Import to Personal Trips"),
            "---",
            "✔ Public Itinerary Sharing",
        ]
    },
    {
        "id": "slide_08c",
        "duration": 10.0,
        "screenshot": os.path.join(ARTIFACT_DIR, "scene_admin_1792559368646.png"),
        "module_tag": "ADMINISTRATIVE ANALYTICS CONSOLE",
        "session_tag": "ROLE: PLATFORM ADMIN",
        "session_color": COLOR_ADMIN,
        "timestamp_str": "04:35 / 05:00",
        "narration_title": "4:10–4:40 • Admin Analytics",
        "narration_text": "...while the Admin dashboard tracks platform metrics and database health.",
        "callout_badge": "Admin Console",
        "callout_title": "System Telemetry",
        "callout_lines": [
            ("Admin Login", "admin@globetrotter.com"),
            ("Telemetry", "Active Users & Created Trips"),
            ("Database Health", "Postgres Realtime Connections"),
            "---",
            "✔ Strict Role-Guarded Route (/admin)",
        ]
    },
    # Scene 9: Testing and Conclusion (20s)
    {
        "id": "slide_09",
        "duration": 20.0,
        "screenshot": os.path.join(ASSETS_DIR, "terminal_tests_view.png"),
        "module_tag": "AUTOMATED UNIT TESTING & VALIDATION",
        "session_tag": "JEST / NODE TEST RUNNER (100%)",
        "session_color": COLOR_TESTS,
        "timestamp_str": "04:50 / 05:00",
        "narration_title": "4:40–5:00 • Unit Testing & Conclusion",
        "narration_text": "Finally, our automated test suite passes 100% across all 13 tests in 12 milliseconds, validating budget calculations, booking date checks, equal splits, and greedy debt simplification. Globetrotter delivers an end-to-end, verified planning experience.",
        "callout_badge": "Unit Tests",
        "callout_title": "Test Suite Results",
        "callout_lines": [
            ("Total Test Suites", "6 Suites Executed"),
            ("Tests Passing", "13 / 13 Passed (100%)"),
            ("Execution Duration", "12.06 ms"),
            "---",
            "✔ calculateBudgetSummary (Burn)",
            "✔ validateExpenseEntry (Bounds)",
            "✔ calculateEqualSplits (Math)",
            "✔ simplifyDebts (Greedy Netting)",
            "✔ validateBookingDates (Conflicts)",
        ]
    }
]

def render_all():
    print("--- 1. RENDERING 18 SLIDE FRAMES (1920x1080) ---")
    clip_list = []
    
    for idx, slide in enumerate(slides_data):
        slide_img = os.path.join(ASSETS_DIR, f"{slide['id']}.png")
        create_slide_frame(
            screenshot_path=slide["screenshot"],
            module_tag=slide["module_tag"],
            session_tag=slide["session_tag"],
            session_color=slide["session_color"],
            timestamp_str=slide["timestamp_str"],
            narration_title=slide["narration_title"],
            narration_text=slide["narration_text"],
            callout_badge=slide.get("callout_badge"),
            callout_title=slide.get("callout_title"),
            callout_lines=slide.get("callout_lines"),
            out_path=slide_img
        )
        
        # Render video clip for this slide
        clip_path = os.path.join(ASSETS_DIR, f"{slide['id']}.mp4")
        cmd = [
            "ffmpeg", "-y",
            "-loop", "1",
            "-t", str(slide["duration"]),
            "-i", slide_img,
            "-vf", "scale=1920:1080",
            "-c:v", "libx264",
            "-pix_fmt", "yuv420p",
            "-r", "30",
            clip_path
        ]
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        clip_list.append(clip_path)
        print(f"[{idx+1}/18] Rendered {slide['id']}.mp4 ({slide['duration']}s)")

    print("\n--- 2. CONCATENATING CLIPS WITH MASTER AUDIO (300.0s) ---")
    concat_file = os.path.join(ASSETS_DIR, "concat_list.txt")
    with open(concat_file, "w") as f:
        for c in clip_list:
            f.write(f"file '{c}'\n")

    master_audio = os.path.join(ASSETS_DIR, "audio", "master_audio.wav")
    final_output = r"e:\Odoo_hack\globetrotter_5min_demonstration.mp4"

    concat_cmd = [
        "ffmpeg", "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", concat_file,
        "-i", master_audio,
        "-c:v", "copy",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        final_output
    ]
    subprocess.run(concat_cmd, check=True)
    print(f"\nFINAL VIDEO RENDERED SUCCESSFULLY AT: {final_output}")

    # Copy to both artifact directories
    current_artifact_dir = r"C:\Users\Aneesh Suvarna\.gemini\antigravity-ide\brain\23204c6a-bc95-4f0d-b0a3-57c6d4f04046"
    os.makedirs(current_artifact_dir, exist_ok=True)
    
    for target_dir in [ARTIFACT_DIR, current_artifact_dir]:
        if os.path.exists(target_dir):
            art_out = os.path.join(target_dir, "globetrotter_5min_demonstration.mp4")
            shutil.copyfile(final_output, art_out)
            print(f"COPIED TO: {art_out}")

    # Extract clean preview frames at key timestamps
    sample_timestamps = [
        ("preview_01_landing.png", "00:00:05"),
        ("preview_02_dashboard.png", "00:00:35"),
        ("preview_03_itinerary.png", "00:01:05"),
        ("preview_05_budget.png", "00:01:45"),
        ("preview_06_split.png", "00:02:40"),
        ("preview_07_settlement.png", "00:03:45"),
    ]
    for fname, t_sec in sample_timestamps:
        out_f = os.path.join(current_artifact_dir, fname)
        subprocess.run([
            "ffmpeg", "-y", "-ss", t_sec, "-i", final_output, "-vframes", "1", "-q:v", "2", out_f
        ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        print(f"Extracted keyframe {fname} at {t_sec}")

if __name__ == "__main__":
    render_all()
