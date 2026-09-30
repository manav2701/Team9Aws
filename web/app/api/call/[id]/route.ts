import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

// Reads a call's live status and transcript from M2's calls table.
const REGION = process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION ?? 'us-west-2';
const TABLE = process.env.CALLS_TABLE ?? 'workshop-shifa-calls';
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { Item } = await ddb.send(new GetCommand({ TableName: TABLE, Key: { call_id: id }, ConsistentRead: true }));
    if (!Item) return Response.json({ error: `No call ${id}.` }, { status: 404 });
    return Response.json({
      status: Item.status as string,
      history: (Item.history ?? []) as { role: string; text: string }[],
      outcome: Item.outcome ?? {},
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: `Couldn't read call ${id}: ${message}` }, { status: 502 });
  }
}
