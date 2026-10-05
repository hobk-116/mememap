# Backups and recovery

**English** · [Tiếng Việt](../vi/BACKUP.md) · [Documentation index](README.md)

The application currently has no built-in automatic backup scheduler or restore interface. These are operator procedures; moving source files into `archive/` is not a database/media backup.

## Runtime data and backups

First startup creates `mememap.sqlite3`; image uploads create `uploads/memes/` and `uploads/profiles/`. These are ignored by Git. Back up the SQLite database and uploads folders together while the server is stopped, or use a consistent SQLite backup method. Restoring only one of them can leave pins or profiles pointing to missing image files.

Do not commit the database, uploaded user media, or secrets to the repository.


## Select the actual runtime paths

Check `MEMEMAP_DB_PATH` and `MEMEMAP_UPLOADS_PATH` in the server's environment before copying or restoring data. Their defaults are `mememap.sqlite3` and `uploads/` in the repository; relative custom paths resolve from the repository. Admin-provisioning commands must use the same configured database.

Git ignores the default data paths. Keep custom data outside the repo or add matching ignore rules. Git/GitHub source history does not preserve ignored user data.

## Manual backup

1. Stop the application so no database or image writes are in progress.
2. Copy the SQLite database and the complete configured uploads directory into the same dated backup set outside the source checkout.
3. Record the source commit or code version, configured paths and backup time with that set. Preserve both `memes/` and `profiles/`.
4. Restart the application and confirm normal operation.

An online backup must coordinate SQLite and media writes to form one consistent set. Copying only the database while images change does not provide that guarantee.

## Restore and confirm

1. Restore a matching database/media set into isolated paths first, using the code version appropriate for that backup.
2. Confirm startup, account access, pin images and avatars, and the expected moderation state. Use disposable copied data for this check.
3. For a real restore, stop the application and preserve the current data before replacing it with the verified set.
4. Start with the intended environment settings and confirm that the database references resolve to the restored media.

Back up before schema/media migrations. Migration rollback and retry checks are documented in [testing](TESTING.md); they do not replace a restore check for an actual backup.
