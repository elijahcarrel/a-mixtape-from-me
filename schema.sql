-- User table: stores all users who have ever logged in. StackAuthUserId is the UUID from StackAuth.
CREATE TABLE IF NOT EXISTS "User" (
    ID SERIAL PRIMARY KEY, -- Internal auto-generated ID
    StackAuthUserId VARCHAR(255) UNIQUE -- UUID from StackAuth
);

-- Mixtape table: captures the state of a mixtape created by a user.
CREATE TABLE IF NOT EXISTS Mixtape (
    ID SERIAL PRIMARY KEY, -- Internal auto-generated ID
    UserId INT REFERENCES "User"(ID), -- Nullable, foreign key to User
    PublicID UUID NOT NULL UNIQUE, -- Immutable public UUID
    Name VARCHAR(255) NOT NULL, -- Human-readable name
    IntroText TEXT, -- Optional intro text
    IsPublic BOOLEAN NOT NULL DEFAULT FALSE, -- Public flag
    CreateTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, -- Creation time
    LastModifiedTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, -- Last modified
    Version INT NOT NULL -- Monotonically increasing version
);

-- MixtapeAudit table: audit log for Mixtape, snapshotting all mutable fields.
CREATE TABLE IF NOT EXISTS MixtapeAudit (
    ID SERIAL PRIMARY KEY, -- Internal auto-generated ID
    MixtapeId INT NOT NULL REFERENCES Mixtape(ID), -- Foreign key to Mixtape
    PublicID UUID NOT NULL, -- Copied from Mixtape
    Name VARCHAR(255) NOT NULL, -- Copied from Mixtape
    IntroText TEXT, -- Copied from Mixtape
    IsPublic BOOLEAN NOT NULL, -- Copied from Mixtape
    CreateTime TIMESTAMP NOT NULL, -- Copied from Mixtape
    LastModifiedTime TIMESTAMP NOT NULL, -- Copied from Mixtape
    Version INT NOT NULL -- Copied from Mixtape
);

-- MixtapeTrack table: represents a single track within a mixtape.
CREATE TABLE IF NOT EXISTS MixtapeTrack (
    ID SERIAL PRIMARY KEY, -- Internal auto-generated ID
    MixtapeId INT NOT NULL REFERENCES Mixtape(ID) ON DELETE CASCADE, -- Foreign key to Mixtape
    TrackPosition INT NOT NULL, -- Unique position within mixtape
    TrackText TEXT, -- Optional text
    SpotifyURI VARCHAR(255) NOT NULL, -- Spotify URI
    CONSTRAINT mixtape_track_unique_position UNIQUE (MixtapeId, TrackPosition) -- Enforce unique position per mixtape
);

-- MixtapeAuditTrack table: audit log for MixtapeTrack, snapshotting all fields.
CREATE TABLE IF NOT EXISTS MixtapeAuditTrack (
    ID SERIAL PRIMARY KEY, -- Internal auto-generated ID
    MixtapeAuditId INT NOT NULL REFERENCES MixtapeAudit(ID) ON DELETE CASCADE, -- Foreign key to MixtapeAudit
    TrackPosition INT NOT NULL, -- Copied from MixtapeTrack
    TrackText TEXT, -- Copied from MixtapeTrack
    SpotifyURI VARCHAR(255) NOT NULL -- Copied from MixtapeTrack
); 