-- Creates the BTSCALLS database if it does not exist yet.
-- Run in SSMS / sqlcmd, or let `npm run db:setup` run it for you.
IF DB_ID(N'BTSCALLS') IS NULL
BEGIN
    CREATE DATABASE BTSCALLS;
END
GO
