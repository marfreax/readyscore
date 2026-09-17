# V17.2.3 Correction Note

The safe migration preflight casts PostgreSQL `regclass` results to text before Prisma deserialization. No prior migration files or database migration history are modified.
