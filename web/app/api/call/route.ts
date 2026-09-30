import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';

// Starts an outbound call through M2's Lambda (Twilio + Bedrock). Server only.
const REGION = process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION ?? 'us-west-2';
const FUNCTION = process.env.CALLS_FUNCTION ?? 'workshop-shifa-calls';
const lambda = new LambdaClient({ region: REGION });

interface CallRequest {
  callType: 'booking' | 'insurance';
  toNumber: string;
  lang?: 'en' | 'ar';
  journeyId?: string;
  context: Record<string, unknown>;
}

export async function POST(req: Request) {
  const body = (await req.json()) as CallRequest;
  if (!/^\+[1-9]\d{7,14}$/.test(body.toNumber ?? '')) {
    return Response.json({ error: 'Enter the phone number in international form, for example +971501234567.' }, { status: 400 });
  }
  try {
    const res = await lambda.send(
      new InvokeCommand({
        FunctionName: FUNCTION,
        Payload: new TextEncoder().encode(
          JSON.stringify({
            call_type: body.callType,
            to_number: body.toNumber,
            lang: body.lang ?? 'en',
            journey_id: body.journeyId ?? 'web-demo',
            context: body.context,
          })
        ),
      })
    );
    const result = JSON.parse(new TextDecoder().decode(res.Payload));
    if (!result.call_id) {
      return Response.json({ error: `Couldn't place the call: ${result.errorMessage ?? JSON.stringify(result)}` }, { status: 502 });
    }
    return Response.json({ callId: result.call_id });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: `Couldn't place the call: ${message}` }, { status: 502 });
  }
}
