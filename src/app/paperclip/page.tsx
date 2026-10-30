import HtmlFrame from './HtmlFrame';

export const metadata = { title: 'Requirements Dashboard' };

export default function PaperclipAgentesPage() {
  return <HtmlFrame src="/paperclip/doc/agentes?theme=dark" title="Agentes do Paperclip" />;
}
