# @draint/snap

> **drain't MetaMask Snap** — pre-sign warning against EIP-7702 delegation drainers and Permit/Permit2 phishing.

Wallet drain? Didn't happen.

## What it does

Two intercept points:

1. **`onSignature`** — Detects typed-data (EIP-712) signatures asking for Permit/Permit2 spending approvals. Classifies the spender via [draint-be](https://github.com/DraintAi/draint-be). If risky, shows a critical warning before the user signs.

2. **`onTransaction`** — Inspects transactions of type 0x04 (EIP-7702 SET_CODE). Extracts every delegation target in the `authorizationList` and classifies. If any target is a CrimeEnjoyor-class drainer, blocks with a critical warning.

## Run locally

Install MetaMask Flask (developer build):
- https://docs.metamask.io/snaps/get-started/install-flask/

Then:

```bash
bun install
bun run start    # mm-snap watch — auto-rebuild on src change
```

Connect to `http://localhost:8080` from a test dApp (we use `draint-fe` dashboard) and call `wallet_requestSnaps`.

## Build

```bash
bun run build:clean
# Output: dist/bundle.js
```

## Permissions

- `endowment:signature-insight` — read raw signature payloads pre-sign
- `endowment:transaction-insight` — read tx payloads pre-submit
- `endowment:network-access` — call drain't backend `/api/classify`
- `snap_dialog` — render warning UI

## Architecture

```
User signs/sends in MM
        ↓
Snap handler fires
        ↓
extract Permit spender / 7702 delegation target
        ↓
POST https://draint-be.vercel.app/api/classify
        ↓
Render warning UI based on severity
```

## License

MIT — part of the [DraintAi/draint-fe](https://github.com/DraintAi/draint-fe) project.

Built for **MetaMask Smart Accounts Kit x 1Shot API Hackathon**, 2026.
