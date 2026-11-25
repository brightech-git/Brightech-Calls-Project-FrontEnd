# Meeting booking API (SQL Server)

A small Node.js API plus two pages:

- `http://localhost:5050/` : public booking page, shows **only remaining (unbooked) slots**
- `http://localhost:5050/admin` : admin login (fixed username/password from config), list of booked meetings, book a slot for a client, cancel a booking, block dates

Everything is set in **`public/config.json`**.

## 1. Configure

```bash
cd backend
npm install
copy public\config.example.json public\config.json   # Windows (or: cp ... on Mac/Linux)
```

The server also creates `config.json` from the example the first time it starts.
`config.json` is in `.gitignore`, so your real passwords stay on your PC. Never commit it.

| Section | What it controls |
| --- | --- |
| `server` | `port` (default 5050), `host`, `corsOrigins` allowed to call the API (e.g. the website on :3000) |
| `database` | SQL Server `server`, `port` or `instanceName` (e.g. `SQLEXPRESS`), `database` (`BTSCALLS`), `user`, `password`, `encrypt`, `trustServerCertificate` |
| `tables` | Table names: `slots` (`MeetSlot`), `bookings` (`MeetBooking`), `blockedDates` (`MeetBlockedDate`) |
| `admin` | Fixed admin `username` / `password`, `tokenSecret` (any long random text), `tokenHours`, login lockout |
| `slots` | `workingDays` (0 = Sun ... 6 = Sat), `dayStart`, `dayEnd`, `durationMinutes`, `gapMinutes`, `breaks`, `capacityPerSlot`, `daysAhead`, `minNoticeMinutes`, `holidays` |
| `booking` | `companyName`, `requirePhone`, `maxPurposeLength` |

`config.json` and `config.example.json` are never served over HTTP even though they sit in `public/`.
Restart the server after editing the config.

## 2. Create the database and tables

```bash
npm run db:setup
```

This runs `sql/01_create_database.sql` and `sql/02_create_tables.sql` with the names from config.
You can also run those two files yourself in SSMS.

Tables:

- **MeetSlot** : one row per time slot. The API fills it from the `slots` settings for the next `daysAhead` days. If you change the timings, future unbooked slots that no longer fit are switched off (never deleted).
- **MeetBooking** (main) : one row per meeting, linked to `MeetSlot`. `Status` is `Booked` or `Cancelled`, `Source` is `Website` or `Admin`.
- **MeetBlockedDate** : dates the admin closed (holiday, leave).
- **vw_MeetBookingDetail** : view joining bookings with their slot date and time, for reports.

## 3. Run

```bash
npm start        # or: npm run dev  (restarts on file changes)
```

## API

Public:

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/health` | DB check |
| GET | `/api/settings` | Slot length, days ahead, whether phone is required |
| GET | `/api/slots` | Remaining slots grouped by day. Optional `?date=YYYY-MM-DD` or `?from=&to=` |
| POST | `/api/bookings` | `{ slotId, name, email, phone, company?, purpose? }` |

Admin (send `Authorization: Bearer <token>` from login):

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/api/admin/login` | `{ username, password }` returns `{ token }` |
| GET | `/api/admin/stats` | Today / upcoming / cancelled / open slots |
| GET | `/api/admin/bookings` | `?status=Booked|Cancelled&from=&to=&q=` |
| POST | `/api/admin/bookings` | Book a slot for a client (phone optional, no notice period) |
| PATCH | `/api/admin/bookings/:id/cancel` | Cancel; the slot opens again |
| GET/POST/DELETE | `/api/admin/blocked-dates` | List / add `{ date, reason }` / remove `/:date` |

Two people can never take the same last place: bookings run in a serializable transaction.
