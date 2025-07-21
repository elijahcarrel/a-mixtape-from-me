# Mixtape Creation Feature

## Overview
This feature allows users to create and edit mixtapes with a vintage, cassette-inspired interface. Users can search for tracks on Spotify, add them to their mixtape, and save their work automatically.

## Features

### Auto-Creation Flow
- Users click "Create a new mixtape" from the homepage
- The system automatically creates an empty mixtape with a server-generated UUID
- Users are redirected to the edit page for that mixtape

### Mixtape Editor
- **Title Field**: Large, prominent text field for the mixtape name
- **Intro Text**: Optional text area for mixtape description
- **Public/Private Toggle**: Checkbox to control mixtape visibility
- **Track Search**: Autocomplete search box that queries Spotify API
- **Track List**: Visual display of added tracks with album art and delete buttons

### Track Management
- **Search**: Debounced search (1-second delay) that queries Spotify's search API
- **Auto-complete**: Dropdown with track suggestions showing album art, title, artist, and album
- **Add Tracks**: Click or press Enter to add tracks to the end of the playlist
- **Remove Tracks**: Delete button on each track with automatic position reordering
- **Track Details**: Fetches and displays album art, track name, and artist information

### Auto-Save
- All changes (title, intro text, public/private, track additions/removals) are automatically saved
- 1-second debounced save to prevent excessive API calls
- Visual feedback shows when saving is in progress

## Technical Implementation

### Frontend Components
- `app/create/page.tsx`: Auto-creates empty mixtape and redirects
- `app/mixtape/[publicId]/page.tsx`: Main mixtape editing page
- `app/components/MixtapeEditor.tsx`: Main editor component with Formik integration
- `app/components/TrackAutocomplete.tsx`: Generic autocomplete with track-specific implementation
- `app/components/TrackList.tsx`: Displays tracks with album art and delete functionality

### Backend Integration
- **Authentication**: All endpoints require valid Stack Auth tokens
- **CRUD Operations**: Full create, read, update support for mixtapes
- **Spotify Integration**: Uses service account credentials for track search and details
- **Database**: SQLModel-based entities with audit trail support

### API Endpoints
- `POST /api/mixtape/`: Create new mixtape
- `GET /api/mixtape/{public_id}`: Get mixtape details
- `PUT /api/mixtape/{public_id}`: Update mixtape
- `GET /api/spotify/search`: Search Spotify tracks
- `GET /api/spotify/track/{track_id}`: Get track details

## Styling
- Vintage, sepia color scheme with cassette-inspired design
- Responsive layout that works on mobile and desktop
- Smooth transitions and hover effects
- Loading states and error handling

## Dependencies
- Formik for form management
- Lodash for debouncing
- Stack Auth for authentication
- Spotify API for track data
- SQLModel for database operations 