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
  type SnapElement,
} from "@metamask/snaps-sdk/jsx";

import type { ClassifyResult } from "./api";

export function renderWarning(
  title: string,
  context: string,
  verdict: ClassifyResult,
  origin: string | undefined,
): SnapElement {
  const isCritical = verdict.severity === "critical";

  return (
    <Box>
      <Heading>
        {isCritical ? "🚨" : "⚠️"} {title}
      </Heading>
      <Text>{context}</Text>
      {origin ? (
        <Text>
          Origin: <Bold>{origin}</Bold>
        </Text>
      ) : null}
      <Divider />
      <Row label="Target">
        <Address address={verdict.target} />
      </Row>
      <Row label="Risk score">
        <Value
          value={`${(verdict.riskScore * 100).toFixed(0)}%`}
          extra={verdict.severity.toUpperCase()}
        />
      </Row>
      {verdict.matchedPattern ? (
        <Row label="Pattern">
          <Text>{verdict.matchedPattern}</Text>
        </Row>
      ) : null}
      <Divider />
      <Heading size="sm">Why drain't flagged this</Heading>
      {verdict.reasons.slice(0, 5).map((r) => (
        <Text>• {r}</Text>
      ))}
      <Divider />
      <Text>
        Signing this could let the contract take full control of assets.
        If you don't recognize the target, <Bold>reject</Bold>.
      </Text>
    </Box>
  );
}

export function renderSafePanel(numTargets: number): {
  severity?: undefined;
  content: SnapElement;
} {
  return {
    content: (
      <Box>
        <Heading>✓ drain't verified</Heading>
        <Text>
          Scanned {numTargets} delegation target
          {numTargets === 1 ? "" : "s"} — no drainer patterns matched.
        </Text>
      </Box>
    ),
  };
}
