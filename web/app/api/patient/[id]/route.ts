import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import type { PatientContext } from '@/lib/types/journey';

const REGION = process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION ?? 'us-west-2';
const TABLE = process.env.PATIENTS_TABLE ?? 'workshop-health-patients';
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));

const list = (v?: string) => (!v || v === 'none' ? [] : v.split(',').map((s) => s.trim()));

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { Item } = await ddb.send(new GetCommand({ TableName: TABLE, Key: { patient_id: id } }));
    if (!Item) return Response.json({ error: `No patient ${id}.` }, { status: 404 });
    const patient: PatientContext & { history: string[] } = {
      profile: { id: Item.patient_id, name: Item.name, insuranceId: Item.insurance },
      medications: list(Item.medications).map((name) => ({ name })),
      allergies: list(Item.allergies),
      history: list(Item.history),
    };
    return Response.json(patient);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: `Couldn't load patient ${id}: ${message}` }, { status: 502 });
  }
}
