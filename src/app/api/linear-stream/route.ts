import { fetchTargetProjects, fetchSingleProjectData, formatUpdatedAt } from '@/lib/linear';

export const dynamic = 'force-dynamic';

export async function GET() {
  const apiKey = process.env.LINEAR_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'LINEAR_API_KEY not set' }, { status: 500 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const write = (data: object) => {
        controller.enqueue(encoder.encode(JSON.stringify(data) + '\n'));
      };

      try {
        const targetProjects = await fetchTargetProjects(apiKey);
        write({ type: 'meta', total: targetProjects.length, updatedAt: formatUpdatedAt() });

        await Promise.all(
          targetProjects.map(async (p) => {
            const project = await fetchSingleProjectData(apiKey, p);
            write({ type: 'project', data: project });
          }),
        );
      } catch (err) {
        write({ type: 'error', message: err instanceof Error ? err.message : 'Unknown error' });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-cache, no-store',
      'X-Accel-Buffering': 'no',
    },
  });
}
