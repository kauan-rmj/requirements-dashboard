import { marked } from 'marked';
import { getDoc } from '@/lib/paperclip-auth';

export default async function MarkdownDoc({ name }: { name: string }) {
  const source = await getDoc(name);
  if (!source) return null;
  const html = marked.parse(source, { gfm: true }) as string;
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
      <article className="pc-md" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
