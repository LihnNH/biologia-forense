import { marked } from 'marked';
import { useMemo } from 'react';

// All Markdown comes from the local case data, never from user input.
export function Markdown({ text, className, id }: {
  text: string;
  className: string;
  id?: string;
}) {
  const html = useMemo(() => marked.parse(text, {
    async: false, gfm: true, breaks: true,
  }), [text]);
  return <div id={id} className={`${className} markdown-body`} dangerouslySetInnerHTML={{ __html: html }} />;
}
