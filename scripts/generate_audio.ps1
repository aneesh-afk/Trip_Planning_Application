Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.Rate = 0 # Normal speaking speed

$audioDir = "e:\Odoo_hack\render_assets\audio"
if (!(Test-Path $audioDir)) {
    New-Item -ItemType Directory -Force -Path $audioDir | Out-Null
}

$scenes = @(
    @{
        id = 1
        duration = 20
        text = "Welcome to Globetrotter, a full-stack trip planning and collaborative travel platform. Globetrotter streamlines every stage of group travel, from itinerary building and target-versus-actual budget tracking, to verified booking management, multi-user collaboration, and automated group debt settlement."
    },
    @{
        id = 2
        duration = 25
        text = "We begin by authenticating as Account 1, Aarav Sharma, our trip organizer. The dashboard provides immediate visibility into active trips, planned destinations across India, and upcoming group travels. From here, users can create new trips, monitor active itineraries, and access shared expenses."
    },
    @{
        id = 3
        duration = 30
        text = "Here we demonstrate creating a new trip. We name it Goa Beach and Heritage Getaway, select the Western India region, and set our travel dates from November 10th to 14th with a target budget of 25,000 rupees. The system initializes the itinerary, allowing travelers to add custom stops, daily activities, and transport legs without any template restrictions."
    },
    @{
        id = 4
        duration = 25
        text = "Next, we invite our travel partner into the group trip. Using the group members panel, we invite Account 2, Aneesh Suvarna. We switch over to a separate browser profile logged in as Account 2. The shared trip immediately synchronizes in real time, granting both travelers collaborative access to the itinerary and finances."
    },
    @{
        id = 5
        duration = 25
        text = "In Module 4.4, Globetrotter tracks our 45,000 rupee target against actual expenses with category breakdowns and daily burn rates. Over-budget banners alert travelers if limits are exceeded. In Module 4.5, bookings feature verified confirmation codes and automatic date validation."
    },
    @{
        id = 6
        duration = 90
        text = "Now for our core feature: group expense splitting across two accounts. First, in Account 1, Aarav logs a shared hotel booking of 2,000 rupees, paid by Account 1 and split equally. The application divides the expense at 1,000 rupees per member. In the settlement ledger, Account 2 now owes Account 1 exactly 1,000 rupees. Next, we switch visibly to Account 2's session. The shared hotel appears in Account 2's feed. From Account 2, Aneesh records a shared dinner expense of 600 rupees, paid by Account 2 and split equally at 300 rupees each. Let us look at the mathematics: total group spending is 2,000 plus 600, equaling 2,600 rupees. Each member's fair share is 1,300 rupees. Account 1 paid 2,000 rupees, leaving a net credit of 700 rupees. Account 2 paid 600 rupees, leaving a net debit of 700 rupees. The settlement engine nets both transactions into one direct payment: Account 2 owes Account 1 exactly 700 rupees."
    },
    @{
        id = 7
        duration = 35
        text = "In the debt settlement module, Globetrotter simplifies complex group obligations. Our greedy flow algorithm eliminates circular debts, consolidating multi-member balances into the minimum possible transactions. When payments are made, travelers can record settlements, instantly updating balances and keeping the group ledger transparent."
    },
    @{
        id = 8
        duration = 30
        text = "Globetrotter also includes comprehensive companion modules. The My Trips view organizes past and upcoming journeys. The Community hub lets travelers discover and clone curated Indian itineraries. The Calendar view visualizes schedules day by day, while the Admin dashboard tracks platform metrics and database health."
    },
    @{
        id = 9
        duration = 20
        text = "Finally, our automated test suite passes 100% across all 13 tests in 12 milliseconds, validating budget calculations, booking date checks, equal splits, and greedy debt simplification. Globetrotter delivers an end-to-end, verified planning experience."
    }
)

foreach ($s in $scenes) {
    $outPath = Join-Path $audioDir ("scene_" + $s.id + "_raw.wav")
    $synth.SetOutputToWaveFile($outPath)
    $synth.Speak($s.text)
    Write-Host ("Generated Scene " + $s.id + " audio.")
}

$synth.Dispose()
Write-Host "All 9 scene audio files generated successfully."
