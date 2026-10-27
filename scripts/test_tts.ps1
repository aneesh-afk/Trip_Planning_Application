Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.SetOutputToWaveFile("e:\Odoo_hack\test_voice.wav")
$synth.Speak("Welcome to Globetrotter, an end to end trip planning application.")
$synth.Dispose()
Write-Host "TTS output written successfully. File size: " (Get-Item "e:\Odoo_hack\test_voice.wav").Length
