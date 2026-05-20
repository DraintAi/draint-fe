// Snap UI components — rendered inside MetaMask's signature/tx confirmation
// dialog as insight panels. Grunge-themed copy to match drain't brand.

import {
  Box,
  Heading,
  Text,
  Bold,
  Divider,
  Address,
  Row,
  Value,
  Link,
  Banner,
  Section,
  type SnapElement,
} from "@metamask/snaps-sdk/jsx";

import type { ClassifyResult } from "./api";
import type { AlertEntry } from "./state";

// ─── Warning panel (used by onSignature + onTransaction) ────────────

export function renderWarning(
  title: string,
  context: string,
  verdict: ClassifyResult,
  origin: string | null | undefined,
): SnapElement {
  const isCritical = verdict.severity === "critical";
  const pctScore = `${(verdict.riskScore * 100).toFixed(0)}%`;

  return (
    <Box>
      <Banner severity={isCritical ? "danger" : "warning"} title={title}>
        <Text>{context}</Text>
      </Banner>

      <Section>
        <Row label="Target">
          <Address address={verdict.target} />
        </Row>
        <Row label="Risk">
          <Value
            value={pctScore}
            extra={verdict.severity.toUpperCase()}
          />
        </Row>
        {verdict.matchedPattern ? (
          <Row label="Pattern">
            <Text>{verdict.matchedPattern}</Text>
          </Row>
        ) : null}
        {origin ? (
          <Row label="From">
            <Text>{origin}</Text>
          </Row>
        ) : null}
      </Section>

      <Section>
        <Heading size="sm">Why drain't flagged this</Heading>
        {verdict.reasons.slice(0, 5).map((r) => (
          <Text>• {r}</Text>
        ))}
      </Section>

      <Divider />
      <Text>
        Signing could let this contract take full control of your assets.
        If you don't recognize it, <Bold>reject</Bold>.
      </Text>
      <Text>
        Learn more at{" "}
        <Link href="https://draint.vercel.app">draint.vercel.app</Link>
      </Text>
    </Box>
  );
}

// ─── Safe panel ─────────────────────────────────────────────────────

export function renderSafePanel(numTargets: number) {
  return {
    content: (
      <Box>
        <Banner severity="info" title="drain't verified ✓">
          <Text>
            Scanned {String(numTargets)} delegation target
            {numTargets === 1 ? "" : "s"} — no drainer patterns matched.
          </Text>
        </Banner>
      </Box>
    ),
  };
}

// ─── Home page (snap settings UI) ───────────────────────────────────

export function renderHome(alerts: AlertEntry[]): SnapElement {
  return (
    <Box>
      <Heading>drain't</Heading>
      <Text>
        <Bold>Wallet drain? Didn't happen.</Bold>
      </Text>
      <Text>
        AI security agent protecting against EIP-7702 delegation drainers
        and Permit phishing.
      </Text>

      <Divider />
      <Heading size="md">Recent activity</Heading>

      {alerts.length === 0 ? (
        <Text>
          No alerts yet. drain't watches every signature and transaction in
          the background.
        </Text>
      ) : (
        <Section>
          {alerts.slice(0, 8).map((a) => (
            <Row label={`${a.verdict.severity.toUpperCase()} · ${a.kind}`}>
              <Address address={a.verdict.target as `0x${string}`} />
            </Row>
          ))}
        </Section>
      )}

      <Divider />
      <Text>
        Dashboard:{" "}
        <Link href="https://draint.vercel.app">draint.vercel.app</Link>
      </Text>
    </Box>
  );
}

// ─── Manual classification result (for test harness RPC) ────────────

export function renderClassifyResult(verdict: ClassifyResult): SnapElement {
  const banner =
    verdict.severity === "critical"
      ? { severity: "danger" as const, title: "Critical risk" }
      : verdict.severity === "warning"
        ? { severity: "warning" as const, title: "Suspicious" }
        : verdict.severity === "unknown"
          ? { severity: "info" as const, title: "Inconclusive" }
          : { severity: "success" as const, title: "Looks safe" };

  return (
    <Box>
      <Banner severity={banner.severity} title={banner.title}>
        <Address address={verdict.target} />
      </Banner>

      <Section>
        <Row label="Risk score">
          <Value
            value={`${(verdict.riskScore * 100).toFixed(0)}%`}
            extra={verdict.severity.toUpperCase()}
          />
        </Row>
        <Row label="Chain">
          <Text>{String(verdict.chainId)}</Text>
        </Row>
        {verdict.matchedPattern ? (
          <Row label="Pattern">
            <Text>{verdict.matchedPattern}</Text>
          </Row>
        ) : null}
      </Section>

      {verdict.reasons.length > 0 ? (
        <Section>
          <Heading size="sm">Reasoning</Heading>
          {verdict.reasons.slice(0, 6).map((r) => (
            <Text>• {r}</Text>
          ))}
        </Section>
      ) : null}
    </Box>
  );
}
