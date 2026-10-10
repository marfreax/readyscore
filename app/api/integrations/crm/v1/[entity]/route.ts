import { handleFeed } from "../../../../../../lib/crm-feed/service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request, context: { params: Promise<{ entity: string }> }) {
  const { entity } = await context.params;
  return handleFeed(request, entity);
}
