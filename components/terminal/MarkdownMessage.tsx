'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownMessageProps {
  content: string;
}

export function MarkdownMessage({ content }: MarkdownMessageProps) {
  return (
    <div className="prose prose-sm max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ children }) => (
            <h2 className="text-sm font-semibold text-[#1a1714] border-b border-[#f0ede8] pb-2 mt-4 mb-3">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-medium text-[#1a1714] mt-3 mb-2">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="text-[13px] text-[#3a3530] leading-[1.7] mb-3">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-[#1a1714]">
              {children}
            </strong>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-4 mb-3 space-y-1">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-4 mb-3 space-y-1">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-[13px] text-[#3a3530] leading-[1.7]">
              {children}
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-[3px] border-[#c8873a] pl-3 italic text-[#6b7280] my-3">
              {children}
            </blockquote>
          ),
          code: ({ children, className }) => {
            const isInline = !className;
            return isInline ? (
              <code className="bg-[#f5f0e8] px-1.5 py-0.5 rounded text-xs font-mono text-[#1a1714]">
                {children}
              </code>
            ) : (
              <pre className="bg-[#1a1714] text-white p-3 rounded-lg overflow-x-auto my-3">
                <code className="text-xs font-mono">{children}</code>
              </pre>
            );
          },
          hr: () => (
            <hr className="border-t border-[#f0ede8] my-4" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
