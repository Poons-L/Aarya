# Contact Detail Integrations Guide

## Overview

The Contact Detail screen now includes a comprehensive Quick Actions section with five powerful integrations for professional networking and CRM management.

## Quick Actions Features

### 1. Send Email

**What it does**: Opens your default email client with a pre-addressed email to the contact.

**How it works**:
- Uses `mailto:` protocol for universal compatibility
- Pre-fills subject: "Following up"
- Pre-fills body with personalized greeting using contact's first name
- Works with: Gmail, Outlook, Apple Mail, Thunderbird, and all email clients

**User Experience**:
- Button shows contact's email address
- Disabled (greyed out) if no email saved
- Clear visual indicator: "No email address"

**Technical Implementation**:
```typescript
createMailtoLink(email, subject, body)
// Returns: mailto:email@example.com?subject=...&body=...
```

### 2. View LinkedIn

**What it does**: Opens the contact's LinkedIn profile in a new browser tab.

**How it works**:
- Direct link to saved LinkedIn URL
- Opens in new tab using `window.open(url, '_blank')`
- Preserves current app state

**User Experience**:
- Shows "Open profile" when URL exists
- Shows "No LinkedIn saved" when missing
- Button greyed out if no URL configured

### 3. Schedule Meeting

**What it does**: Creates a pre-filled calendar invite for a meeting with the contact.

**How it works**:
- Generates Google Calendar URL with event template
- Pre-fills title: "Meeting with [Contact Name]"
- Adds contact as attendee (if email available)
- Opens in new tab for user to customize time/details

**Format**:
```
https://calendar.google.com/calendar/render?action=TEMPLATE&text=[title]&add=[email]&details=[body]
```

**Compatibility**:
- Google Calendar (web)
- Syncs to all devices connected to Google account
- User can edit all details before saving

### 4. Export to CRM

**What it does**: Generates CRM-specific CSV files ready for import into HubSpot or Salesforce.

**How it works**:
- Expandable dropdown reveals two export options
- Each generates optimized CSV format for specific CRM
- Instant download with descriptive filename

#### HubSpot Export

**Fields included**:
- First Name, Last Name (split from full name)
- Email
- Phone Number
- Company Name
- Job Title
- LinkedIn URL
- Website (placeholder)

**File format**: `ContactName_HubSpot.csv`

**Import instructions**:
1. In HubSpot, go to Contacts > Import
2. Select "Start an import"
3. Choose "Import file from computer"
4. Upload the CSV file
5. Map fields and complete import

#### Salesforce Export

**Fields included**:
- First Name, Last Name (split from full name)
- Email
- Phone
- Title
- Company
- Description (combines notes, met_at, met_date)
- Lead Source (uses met_at or defaults to "Networking")

**File format**: `ContactName_Salesforce.csv`

**Import instructions**:
1. In Salesforce, go to Setup > Data Import Wizard
2. Choose "Leads" or "Contacts"
3. Upload the CSV file
4. Map fields and complete import

**Technical Details**:
- Proper CSV escaping for special characters
- Handles commas, quotes, and newlines
- First row contains headers
- UTF-8 encoding

### 5. Save as Contact (vCard)

**What it does**: Downloads a vCard (.vcf) file that can be imported into any contact management system.

**How it works**:
- Generates vCard 3.0 format file
- Includes all available contact information
- Instant download ready to import

**Fields included**:
- Full Name (FN)
- Name components (N)
- Organization (ORG)
- Title
- Email (TYPE=INTERNET)
- Phone (TYPE=CELL)
- URL (LinkedIn)
- Notes

**Compatible with**:
- iOS Contacts
- Android Contacts
- Microsoft Outlook
- Apple Contacts (macOS)
- Google Contacts
- Any vCard 3.0 compliant application

**How to use**:
1. Tap "Save as Contact"
2. File downloads to device
3. Open .vcf file
4. Contact automatically imports to default contact app

**Technical Details**:
```
BEGIN:VCARD
VERSION:3.0
FN:John Doe
N:Doe;John;;;
ORG:Acme Corp
TITLE:Senior Manager
EMAIL;TYPE=INTERNET:john@example.com
TEL;TYPE=CELL:+1-555-123-4567
URL:https://linkedin.com/in/johndoe
NOTE:Met at Tech Conference 2026
END:VCARD
```

## Design Guidelines

### Colors
- **Email**: Blue gradient (`from-blue-500 to-blue-600`)
- **LinkedIn**: Darker blue (`from-blue-600 to-blue-700`)
- **Meeting**: Green gradient (`from-green-500 to-emerald-600`)
- **CRM Export**: Purple gradient (`from-purple-500 to-purple-600`)
- **vCard**: Orange/Amber gradient (`from-amber-500 to-orange-600`)
- **Disabled**: Grey (`bg-slate-100 text-slate-400`)

### Icons
- Send: `<Send />` - Paper airplane
- LinkedIn: `<ExternalLink />` - Arrow leaving box
- Meeting: `<CalendarPlus />` - Calendar with plus
- Export: `<Download />` - Download arrow
- vCard: `<User />` - Person icon
- Dropdown: `<ChevronDown />` - Arrow pointing down

### Layout
- All buttons full width
- Consistent padding: `p-3`
- Rounded corners: `rounded-xl`
- Active state: `active:scale-98`
- Transition: `transition-all`
- Gap between elements: `gap-3` or `space-y-2`

## Error Handling

### Missing Data
- Email button disabled if `!contact.email`
- LinkedIn button disabled if `!contact.linkedin_url`
- All other actions work with partial data
- CSV exports include empty fields for missing data
- vCard omits missing fields (valid per spec)

### User Feedback
- Disabled buttons clearly show reason
- "No email address" / "No LinkedIn saved"
- Successful downloads automatic (no popup needed)
- CRM dropdown collapses after export

## Testing Checklist

- [ ] Send Email opens mail client correctly
- [ ] LinkedIn opens correct profile
- [ ] Calendar creates event with correct details
- [ ] HubSpot CSV downloads with correct format
- [ ] Salesforce CSV downloads with correct format
- [ ] vCard downloads and imports successfully
- [ ] Disabled states work correctly
- [ ] All icons display properly
- [ ] Colors match brand guidelines
- [ ] Mobile responsive (tap targets)
- [ ] Works on iOS Safari
- [ ] Works on Chrome/Edge
- [ ] Works on Firefox

## Future Enhancements

### Planned
- Batch export multiple contacts
- Custom email templates
- Multiple calendar providers (Outlook, Apple)
- Direct API integrations (no CSV)
- Contact sync (two-way)

### Requested Features
- WhatsApp quick message
- SMS text message
- Twitter/X DM link
- Calendar scheduling links (Calendly style)
- Business card scanner integration

## Support

For issues or feature requests, please refer to the main project documentation.
