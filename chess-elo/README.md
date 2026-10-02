# Checkmate Club

A mobile-first web app for over-the-board chess with friends: a chess clock, Elo ratings, a leaderboard and per-player stats. You play on a real board; the app keeps time and score.

## Features

- **Players**: name and photo (taken with the camera or picked from the gallery; resized on the phone before upload).
- **Match setup**: pick who plays white and black, swap or randomize colors, and choose a time control (default **10+5**; presets from 1+0 to 30+20, or custom). Before you start, it shows how much Elo each player would win or lose.
- **Chess clock**: two halves with the top one rotated for the player across the table. Tap your half after you move; the Fischer increment is added. Black taps first to start white's clock, as on a real clock. It has pause/resume and keeps the screen awake. If you reload, the game picks up where it was. Sounds: a soft click on every tap, a tick each second in the last 10 seconds, and an alarm when time runs out. The speaker button mutes them, and the setting is remembered.
- **Finishing**: press the flag to choose white wins, draw or black wins. When a clock runs out, the opponent is preselected and the game is marked "on time". You can also just enter a result without using the clock.
- **Summary**: the winner, each player's rating before and after, and the Elo gained or lost. Then rematch with colors swapped.
- **Ranking**: a podium and full table with the last rating change.
- **Player stats**: rating chart, peak and lowest rating, score %, results as white and as black, streaks, best win, head-to-head records and recent games.
- **Head to head**: pick any two players to see their record against each other, score, current streak, both ratings on one chart (with the games they played each other marked), a side-by-side comparison, and every game between them. "Play a match" starts a game with both players already picked.
- **Club stats**: white/draw/black split, most active player, longest streak, biggest upset, top rivalry.
- **Games**: full history. Deleting a game recalculates everyone's ratings.

## Elo system

- Everyone starts at **1200**.
- Expected score is `1 / (1 + 10^((Rb − Ra) / 400))`, and a player's rating changes by `K × (score − expected)`, rounded.
- **K = 60** for everyone, always. That's higher than FIDE's 10–40 on purpose: friends play few games, so each one should count. An even game is worth ±30 and an upset up to about ±46. The winner gains exactly what the loser loses.
- Ratings are never stored. They're recalculated by replaying every game in order, so deleting a game keeps everything consistent.

## Running

```bash
npm install
cp .env.example .env.local   # set APP_PASSWORD
npm run dev        # http://localhost:3000
npm test           # Elo + stats unit tests
npm run build && npm start
```

Open the app on your phone and use "Add to Home Screen" so it runs fullscreen like a native app.

## Deploying with Dokploy

1. **Create an Application** and connect this GitHub repo and branch.
2. **Build:** set the build type to **Dockerfile**, the **Build Path** to `/chess-elo` and the Dockerfile to `Dockerfile`.
3. **Environment:**
   ```
   APP_PASSWORD=<a long password>
   AUTH_SECRET=<random string, e.g. from: openssl rand -base64 32>
   ```
   `AUTH_SECRET` is optional but recommended. Don't set `DATA_DIR`; the image already points it at `/app/data`.
4. **Volume** (Advanced → Mounts): add a **Volume Mount** with mount path **`/app/data`** and any volume name, e.g. `checkmate-data`. This holds the database and photos. Without it, every redeploy wipes your data.
5. **Domain:** add your domain with container port **3000** and HTTPS (Let's Encrypt) turned on.
6. Deploy, then open the domain on your phone and add it to the home screen.

To back up, copy the files out of the `/app/data` volume (`db.json` and the `photos/` folder).

Keep the app at **1 replica**. It stores data in a file, so two copies running at once would overwrite each other.

## Data

Everything is stored on the server under `data/`: `db.json` for players and games, and `photos/` for player pictures. Set `DATA_DIR` to put it elsewhere. Run the app somewhere with a persistent disk (a VPS, a Raspberry Pi or a Docker volume) so every phone sees the same leaderboard. Serverless hosts like Vercel don't keep files between requests. Back up the `data/` folder to keep your history.

## Password

The app is locked behind a single password. Set it before starting:

```bash
cp .env.example .env.local   # then edit APP_PASSWORD
```

- Every page, photo and action needs a valid session. Without one, pages redirect to the sign-in screen and everything else gets a 401.
- Signing in sets an HTTP-only cookie that lasts 90 days. You can sign out from the bottom of the Players tab.
- If `APP_PASSWORD` isn't set, the app stays locked and the sign-in screen says so.
- Changing `APP_PASSWORD` signs out every device, unless you set a separate `AUTH_SECRET`.
- After 10 wrong attempts from one IP address, sign-in is blocked for 15 minutes.
- Use HTTPS when the app is reachable from the internet. Over plain HTTP the password and cookie aren't encrypted, which is only acceptable on your home network.
