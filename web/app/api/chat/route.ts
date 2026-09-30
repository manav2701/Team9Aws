import { BedrockAgentCoreClient, InvokeAgentRuntimeCommand } from '@aws-sdk/client-bedrock-agentcore';
import type { UrgencyLevel } from '@/lib/types/journey';

// Runs on the server only: AWS credentials come from the shell that started `next dev`.
const REGION = process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION ?? 'us-west-2';
const AGENT_ARN =
  process.env.AGENT_RUNTIME_ARN ??
  'arn:aws:bedrock-agentcore:us-west-2:937350295455:runtime/AgentCoreProject_HealthAgent-anMoKd98GM';

const client = new BedrockAgentCoreClient({ region: REGION });

interface ChatRequest {
  message: string;
  patientId?: string;
  sessionId: string;
  history?: { role: string; content: string }[];
}

function unwrap(raw: string): string {
  // The runtime returns the agent's reply as a JSON string, sometimes as SSE `data:` lines.
  let text = raw;
  if (text.includes('data:')) {
    text = text
      .split('\n')
      .filter((l) => l.startsWith('data:'))
      .map((l) => l.slice(5).trim())
      .join('');
  }
  for (let i = 0; i < 2; i++) {
    try {
      const parsed = JSON.parse(text);
      if (typeof parsed === 'string') text = parsed;
      else if (parsed && typeof parsed === 'object') text = String(parsed.result ?? parsed.message ?? JSON.stringify(parsed));
      else break;
    } catch {
      break;
    }
  }
  return text;
}

function classify(text: string): { urgency: UrgencyLevel | null; refused: boolean } {
  const t = text.toLowerCase();
  const emergency =
    /call (emergency|911|999|998|an ambulance)|emergency (room|department|services (right )?now)|nearest (er|emergency)|seek emergency/.test(t);
  const refused = !emergency && /\b(can't|cannot|unable to) (diagnose|prescribe|provide|recommend)/.test(t);
  const soon = /within 24|today|urgent care|as soon as possible|evaluated soon/.test(t);
  return { urgency: emergency ? 'EMERGENCY' : soon ? 'HIGH' : null, refused };
}

export async function POST(req: Request) {
  const body = (await req.json()) as ChatRequest;
  if (!body.message?.trim()) {
    return Response.json({ error: 'Message is empty.' }, { status: 400 });
  }
  const history = (body.history ?? [])
    .slice(-6)
    .map((m) => `${m.role}: ${m.content}`)
    .join('\n');

  try {
    const res = await client.send(
      new InvokeAgentRuntimeCommand({
        agentRuntimeArn: AGENT_ARN,
        // AgentCore requires session ids of at least 33 characters.
        runtimeSessionId: body.sessionId.padEnd(40, '0'),
        payload: new TextEncoder().encode(
          JSON.stringify({ prompt: body.message, patient_id: body.patientId, history })
        ),
      })
    );
    const raw = res.response ? await res.response.transformToString() : '';
    const reply = unwrap(raw);
    return Response.json({ reply, ...classify(reply) });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json(
      { error: `Couldn't reach the Health Companion agent: ${message}. Check that AWS credentials are loaded.` },
      { status: 502 }
    );
  }
}
