export default function HtmlFrame({ src, title }: { src: string; title: string }) {
  return (
    <iframe
      src={src}
      title={title}
      style={{ display: 'block', width: '100%', height: 'calc(100vh - 57px - 42px)', border: 0, background: '#0f0f0f' }}
    />
  );
}
