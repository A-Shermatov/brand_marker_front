"""Recreate the E2E database from scratch: an empty database, the schema, the demo seed.

Run by e2e/stack/backend.mjs with the backend folder as the working directory and
DATABASE_URL already pointing at the E2E database. Refuses any database whose name
does not end with _e2e, so it can never wipe the working or the test database.
"""

import asyncio
import os
import re
import sys
from urllib.parse import urlsplit, urlunsplit

import asyncpg

sys.path.insert(0, os.getcwd())

URL = os.environ["DATABASE_URL"]
NAME = urlsplit(URL).path.lstrip("/")
if not re.fullmatch(r"[A-Za-z0-9_]+_e2e", NAME):
    sys.exit(f"Refusing to reset database '{NAME}': the E2E database name must end with _e2e")


async def main() -> None:
    from app.database import DatabasePool

    dsn = DatabasePool.dsn(URL)
    server = await asyncpg.connect(urlunsplit(urlsplit(dsn)._replace(path="/postgres")))
    try:
        await server.execute(f'DROP DATABASE IF EXISTS "{NAME}" WITH (FORCE)')
        await server.execute(f'CREATE DATABASE "{NAME}"')
    finally:
        await server.close()

    from app.db.schema import prepare_database

    await prepare_database()

    from scripts.seed import seed

    await seed()
    print(f"E2E database {NAME} is ready")


asyncio.run(main())
