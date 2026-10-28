import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface RichTextProps {
  content: string;
  className?: string;
  as?: 'div' | 'span' | 'p';
}

interface Segment {
  type: 'text' | 'inline-math' | 'block-math';
  value: string;
}

export const RichText: React.FC<RichTextProps> = ({ content, className = '', as = 'span' }) => {
  const segments = useMemo<Segment[]>(() => {
    if (!content) return [];

    // Regex split: captures $$...$$ or $...$
    const regex = /(\$\$[\s\S]+?\$\$|\$[^\$]+?\$)/g;
    const parts = content.split(regex);
    const result: Segment[] = [];

    for (const part of parts) {
      if (!part) continue;

      if (part.startsWith('$$') && part.endsWith('$$') && part.length >= 4) {
        result.push({
          type: 'block-math',
          value: part.slice(2, -2).trim()
        });
      } else if (part.startsWith('$') && part.endsWith('$') && part.length >= 2) {
        result.push({
          type: 'inline-math',
          value: part.slice(1, -1).trim()
        });
      } else {
        result.push({
          type: 'text',
          value: part
        });
      }
    }

    return result;
  }, [content]);

  const Tag = as;

  return (
    <Tag className={`rich-text ${className}`} style={{ whiteSpace: 'pre-line' }}>
      {segments.map((seg, idx) => {
        if (seg.type === 'text') {
          return <React.Fragment key={idx}>{seg.value}</React.Fragment>;
        }

        const isBlock = seg.type === 'block-math';
        let renderedHtml = '';
        try {
          renderedHtml = katex.renderToString(seg.value, {
            displayMode: isBlock,
            throwOnError: false
          });
        } catch {
          renderedHtml = seg.value;
        }

        return (
          <span
            key={idx}
            className={`katex-wrapper ${isBlock ? 'katex-block' : 'katex-inline'}`}
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />
        );
      })}
    </Tag>
  );
};
