# Voice, QR/Business Card Scan, and VCF Import Implementation

## Overview
Implemented three major contact capture features: voice recording with AI transcription, business card scanning with OCR, and vCard (VCF) file import.

## 1. Voice Recording & Transcription

### Location
- `src/screens/QuickCaptureScreen.tsx`

### Features
- Real-time voice recording using browser MediaRecorder API
- Audio transcription using OpenAI Whisper via `transcribe-audio` edge function
- Visual feedback with recording status (red pulse animation)
- Transcription progress indicator
- Microphone permission handling
- Appends transcribed text to notes field

### Usage
1. User taps "Record Voice Note" button
2. Browser requests microphone permission
3. Recording starts (button shows "Stop Recording" with pulse animation)
4. User speaks contact details
5. Tap "Stop Recording"
6. AI transcribes audio and populates the note field
7. User can record multiple times (text appends)

### Edge Function
- **Function**: `transcribe-audio`
- **Model**: OpenAI Whisper-1
- **Input**: Base64-encoded WebM audio
- **Output**: Transcribed text

## 2. Business Card Scanning

### Location
- `src/screens/AddContactScreen.tsx`

### Features
- Camera capture of business card images
- OCR text extraction using OpenAI GPT-4o-mini Vision
- Smart parsing of extracted text into contact fields
- Auto-fills: name, company, title, email, phone, location
- Loading overlay during processing

### Usage
1. User selects "Scan Business Card"
2. Device camera opens
3. User takes photo of business card
4. AI extracts text via `process-ocr` edge function
5. Text is parsed via `smart-paste` edge function
6. Contact form pre-fills with extracted data
7. User can edit/complete remaining fields

### Edge Functions
- **OCR Function**: `process-ocr`
  - Extracts text from images using GPT-4o-mini Vision API
  - Returns raw text from business card

- **Smart Parse Function**: `smart-paste`
  - Parses text into structured contact fields
  - Uses GPT-4o-mini with JSON response format
  - Extracts: first_name, last_name, job_title, company, email, phone, location, linkedin_url, notes

## 3. vCard (VCF) Import

### Location
- `src/screens/AddContactScreen.tsx`

### Features
- Native VCF/vCard file import
- Parses standard vCard 2.1/3.0/4.0 formats
- Extracts all standard contact fields
- No external API calls (pure client-side parsing)

### Supported vCard Fields
- `FN` (Full Name)
- `N` (Structured Name)
- `ORG` (Organization/Company)
- `TITLE` (Job Title)
- `EMAIL` (Email addresses)
- `TEL` (Phone numbers)
- `NOTE` (Additional notes)

### Usage
1. User selects "Import vCard (VCF)"
2. File picker opens
3. User selects .vcf or .vcard file
4. Parser extracts contact information
5. Contact form pre-fills with imported data
6. User can edit/complete remaining fields

## UI Changes

### Add Contact Screen
Added two new buttons:
1. **Scan Business Card** (amber icon)
   - Opens camera to capture business card
   - Shows loading overlay during AI processing

2. **Import vCard (VCF)** (purple icon)
   - Opens file picker for .vcf/.vcard files
   - Instant parsing without loading delay

### Quick Capture Screen
Enhanced voice recording button:
- Shows different states: Ready → Recording → Transcribing
- Visual feedback with color changes and animations
- Disabled state during transcription
- Status messages guide the user

## Technical Implementation

### Voice Recording Flow
```
User taps button
  → Request mic permission
  → Start MediaRecorder
  → Collect audio chunks
  → Stop recording
  → Convert to base64
  → Send to transcribe-audio edge function
  → Receive transcript
  → Append to notes field
```

### Business Card Scan Flow
```
User taps Scan Business Card
  → Open camera
  → Capture image
  → Convert to base64
  → Send to process-ocr (extract text)
  → Send text to smart-paste (parse fields)
  → Pre-fill form
  → User reviews/edits
```

### VCF Import Flow
```
User selects VCF file
  → Read file as text
  → Parse vCard format
  → Extract standard fields
  → Pre-fill form
  → User reviews/edits
```

## Error Handling

All three features include comprehensive error handling:
- Microphone permission denial
- Network errors during API calls
- Invalid file formats
- Parsing failures
- User-friendly error messages
- Graceful fallbacks to manual entry

## Browser Compatibility

### Voice Recording
- ✅ Chrome/Edge (Android & Desktop)
- ✅ Firefox (Android & Desktop)
- ✅ Safari (iOS 14.5+)
- Requires HTTPS (mic permission)

### Business Card Scan
- ✅ All modern browsers with camera API
- Requires HTTPS (camera permission)
- Mobile-optimized with `capture="environment"`

### VCF Import
- ✅ All browsers (pure JavaScript parsing)
- No special permissions required
- Works offline after initial load

## Credits System

All three features use the existing OpenAI integration:
- Voice transcription: Uses OpenAI Whisper API
- Business card scan: Uses GPT-4o-mini Vision + GPT-4o-mini
- VCF import: No API usage (free)

AI features respect existing rate limits and caching where applicable.

## Testing Checklist

- [x] Voice recording starts/stops correctly
- [x] Audio transcription returns accurate text
- [x] Business card scanning extracts text
- [x] Extracted text parses into correct fields
- [x] VCF files import correctly
- [x] Error messages display appropriately
- [x] UI states update during processing
- [x] All features work on mobile browsers
- [x] Build completes successfully

## Future Enhancements

Potential improvements:
1. Support for multiple business card formats (international)
2. LinkedIn profile QR code scanning
3. Batch VCF import (multiple contacts)
4. Voice commands for hands-free operation
5. Real-time transcription during recording
6. Business card image storage for reference
