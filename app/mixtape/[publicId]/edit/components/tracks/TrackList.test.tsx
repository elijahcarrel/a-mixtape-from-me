import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@/app/test-utils';
import TrackList from './TrackList';

const mockTrackDetails1 = {
  id: 'track1',
  name: 'Test Track 1',
  artists: [{ name: 'Artist 1' }],
  album: {
    name: 'Album 1',
    images: [
      { url: 'https://example.com/image1.jpg', width: 300, height: 300 },
    ],
  },
  uri: 'spotify:track:track1',
};
const mockTrackDetails2 = {
  id: 'track2',
  name: 'Test Track 2',
  artists: [{ name: 'Artist 2' }],
  album: {
    name: 'Album 2',
    images: [
      { url: 'https://example.com/image2.jpg', width: 300, height: 300 },
    ],
  },
  uri: 'spotify:track:track2',
};

const mockTracks = [
  {
    track_position: 1,
    track_text: 'This song always reminds me of our road trip to Big Sur!',
    track: mockTrackDetails1,
  },
  {
    track_position: 2,
    track_text: 'You played this for me on our first date. <3',
    track: mockTrackDetails2,
  },
];

describe('TrackList', () => {
  it('shows empty state when no tracks are present', () => {
    const mockOnRemoveTrack = jest.fn();
    render(<TrackList tracks={[]} onRemoveTrack={mockOnRemoveTrack} />);
    expect(
      screen.getByText(
        'No tracks added yet. Search for tracks above to get started!'
      )
    ).toBeInTheDocument();
  });

  it('displays tracks with details', () => {
    const mockOnRemoveTrack = jest.fn();
    render(<TrackList tracks={mockTracks} onRemoveTrack={mockOnRemoveTrack} />);
    // Track titles
    expect(screen.getByText('Test Track 1')).toBeInTheDocument();
    expect(screen.getByText('Artist 1')).toBeInTheDocument();
    expect(screen.getByText('Test Track 2')).toBeInTheDocument();
    expect(screen.getByText('Artist 2')).toBeInTheDocument();
    // Track texts (personal messages)
    expect(
      screen.getByText(
        'This song always reminds me of our road trip to Big Sur!'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText('You played this for me on our first date. <3')
    ).toBeInTheDocument();
  });

  it('shows album art when available', () => {
    const mockOnRemoveTrack = jest.fn();
    render(<TrackList tracks={mockTracks} onRemoveTrack={mockOnRemoveTrack} />);
    const albumImage = screen.getByAltText('Album 1');
    expect(albumImage).toBeInTheDocument();
    expect(albumImage).toHaveAttribute('src', 'https://example.com/image1.jpg');
  });

  it('shows placeholder when album art is not available', () => {
    const trackWithoutImage = {
      ...mockTrackDetails1,
      album: { name: 'Album 1', images: [] },
    };
    const mockOnRemoveTrack = jest.fn();
    render(
      <TrackList
        tracks={[
          {
            track_position: 1,
            track_text: 'A special note for you',
            track: trackWithoutImage,
          },
        ]}
        onRemoveTrack={mockOnRemoveTrack}
      />
    );
    // There are two 'No Image' elements: one in album art, one possibly in track_text. Use getAllByText.
    expect(screen.getAllByText('No Image').length).toBeGreaterThanOrEqual(1);
  });

  it('calls onRemoveTrack when remove button is clicked', () => {
    const mockOnRemoveTrack = jest.fn();
    render(<TrackList tracks={mockTracks} onRemoveTrack={mockOnRemoveTrack} />);
    const removeButtons = screen.getAllByTitle('Remove track');
    fireEvent.click(removeButtons[0]);
    expect(mockOnRemoveTrack).toHaveBeenCalledWith(1);
  });

  it('displays track_text if present', () => {
    const mockOnRemoveTrack = jest.fn();
    render(<TrackList tracks={mockTracks} onRemoveTrack={mockOnRemoveTrack} />);
    expect(
      screen.getByText(
        'This song always reminds me of our road trip to Big Sur!'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText('You played this for me on our first date. <3')
    ).toBeInTheDocument();
  });

  it('handles multiple artists correctly', () => {
    const trackWithMultipleArtists = {
      ...mockTrackDetails1,
      artists: [{ name: 'Artist 1' }, { name: 'Artist 2' }],
    };
    const mockOnRemoveTrack = jest.fn();
    render(
      <TrackList
        tracks={[
          {
            track_position: 1,
            track_text: 'A duet for us',
            track: trackWithMultipleArtists,
          },
        ]}
        onRemoveTrack={mockOnRemoveTrack}
      />
    );
    expect(screen.getByText('Artist 1, Artist 2')).toBeInTheDocument();
  });

  describe('Track Note Editing', () => {
    it('shows "Add note" button when track has no note', () => {
      const mockOnRemoveTrack = jest.fn();
      const trackWithoutNote = {
        track_position: 1,
        track_text: undefined,
        track: mockTrackDetails1,
      };
      render(
        <TrackList
          tracks={[trackWithoutNote]}
          onRemoveTrack={mockOnRemoveTrack}
        />
      );
      expect(screen.getByText('Add note')).toBeInTheDocument();
      expect(screen.getByText('No note')).toBeInTheDocument();
    });

    it('shows "Edit note" button when track has a note', () => {
      const mockOnRemoveTrack = jest.fn();
      render(
        <TrackList tracks={mockTracks} onRemoveTrack={mockOnRemoveTrack} />
      );
      expect(screen.getAllByText('Edit note')).toHaveLength(2);
    });

    it('opens textarea when "Add note" is clicked', () => {
      const mockOnRemoveTrack = jest.fn();
      const trackWithoutNote = {
        track_position: 1,
        track_text: undefined,
        track: mockTrackDetails1,
      };
      render(
        <TrackList
          tracks={[trackWithoutNote]}
          onRemoveTrack={mockOnRemoveTrack}
        />
      );

      const addNoteButton = screen.getByText('Add note');
      fireEvent.click(addNoteButton);

      expect(screen.getByTestId('track-textarea-1')).toBeInTheDocument();
      expect(screen.getByText('Save')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('opens textarea with existing text when "Edit note" is clicked', () => {
      const mockOnRemoveTrack = jest.fn();
      render(
        <TrackList tracks={mockTracks} onRemoveTrack={mockOnRemoveTrack} />
      );

      const editNoteButton = screen.getByTestId('edit-track-text-1');
      fireEvent.click(editNoteButton);

      const textarea = screen.getByTestId('track-textarea-1');
      expect(textarea).toBeInTheDocument();
      expect((textarea as HTMLTextAreaElement).value).toBe(
        'This song always reminds me of our road trip to Big Sur!'
      );
    });

    it('calls onEditTrackText when Save is clicked', () => {
      const mockOnRemoveTrack = jest.fn();
      const mockOnEditTrackText = jest.fn();
      const trackWithoutNote = {
        track_position: 1,
        track_text: undefined,
        track: mockTrackDetails1,
      };
      render(
        <TrackList
          tracks={[trackWithoutNote]}
          onRemoveTrack={mockOnRemoveTrack}
          onEditTrackText={mockOnEditTrackText}
        />
      );

      // Open editor
      const addNoteButton = screen.getByText('Add note');
      fireEvent.click(addNoteButton);

      // Type in textarea
      const textarea = screen.getByTestId('track-textarea-1');
      fireEvent.change(textarea, { target: { value: 'New note text' } });

      // Save
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      expect(mockOnEditTrackText).toHaveBeenCalledWith(1, 'New note text');
    });

    it('closes editor when Cancel is clicked', () => {
      const mockOnRemoveTrack = jest.fn();
      const trackWithoutNote = {
        track_position: 1,
        track_text: undefined,
        track: mockTrackDetails1,
      };
      render(
        <TrackList
          tracks={[trackWithoutNote]}
          onRemoveTrack={mockOnRemoveTrack}
        />
      );

      // Open editor
      const addNoteButton = screen.getByText('Add note');
      fireEvent.click(addNoteButton);

      // Cancel
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      // Editor should be closed
      expect(screen.queryByTestId('track-textarea-1')).not.toBeInTheDocument();
      expect(screen.queryByText('Save')).not.toBeInTheDocument();
      expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
    });

    it('truncates long track text with ellipsis', () => {
      const mockOnRemoveTrack = jest.fn();
      const longTrackText = 'A'.repeat(100); // 100 characters
      const trackWithLongNote = {
        track_position: 1,
        track_text: longTrackText,
        track: mockTrackDetails1,
      };
      render(
        <TrackList
          tracks={[trackWithLongNote]}
          onRemoveTrack={mockOnRemoveTrack}
        />
      );

      // Should show truncated text (first 80 chars + ...)
      const truncatedText = 'A'.repeat(80) + '...';
      expect(screen.getByText(truncatedText)).toBeInTheDocument();

      // Should not show the full text
      expect(screen.queryByText(longTrackText)).not.toBeInTheDocument();
    });

    it('shows full text for short track text', () => {
      const mockOnRemoveTrack = jest.fn();
      const shortTrackText = 'Short note';
      const trackWithShortNote = {
        track_position: 1,
        track_text: shortTrackText,
        track: mockTrackDetails1,
      };
      render(
        <TrackList
          tracks={[trackWithShortNote]}
          onRemoveTrack={mockOnRemoveTrack}
        />
      );

      // Should show the full text
      expect(screen.getByText(shortTrackText)).toBeInTheDocument();
    });

    it('allows editing multiple tracks independently', () => {
      const mockOnRemoveTrack = jest.fn();
      const mockOnEditTrackText = jest.fn();
      render(
        <TrackList
          tracks={mockTracks}
          onRemoveTrack={mockOnRemoveTrack}
          onEditTrackText={mockOnEditTrackText}
        />
      );

      // Open editor for first track
      const editNoteButton1 = screen.getByTestId('edit-track-text-1');
      fireEvent.click(editNoteButton1);

      // Should show textarea for track 1
      expect(screen.getByTestId('track-textarea-1')).toBeInTheDocument();

      // Open editor for second track
      const editNoteButton2 = screen.getByTestId('edit-track-text-2');
      fireEvent.click(editNoteButton2);

      // Should show textarea for track 2 and close track 1
      expect(screen.getByTestId('track-textarea-2')).toBeInTheDocument();
      expect(screen.queryByTestId('track-textarea-1')).not.toBeInTheDocument();
    });
  });
});
