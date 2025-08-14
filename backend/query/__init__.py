# query package defines query helpers for database models, to be used by router and entity code for lookups.
# Accepts and returns database models objects directly, never API objects or dicts mapping to database models.
# All methods exposed by this package should only raise errors when they should be considered unexpected internal errors, not client-facing errors. This means:
# - When querying for an entry that does not exist, this package returns None rather than raising a ValueError. Calling code should handle this and translate this to the error of their choosing.
