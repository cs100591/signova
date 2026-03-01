'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownMessageProps {
  content: string;
  isUser?: boolean;
}

export function MarkdownMessage({ content, isUser = false }: MarkdownMessageProps) {
  // Use inherited colors for user messages (dark background), specific colors for assistant
  const textColor = isUser ? 'text-inherit' : 'text-[#3a3530]';
  const headingColor = isUser ? 'text-inherit' : 'text-[#1a1714]';
  
  return (
    <div className="prose prose-sm max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ children }) => (
            <h2 className={`text-sm font-semibold ${headingColor} border-b border-[#f0ede8] pb-2 mt-4 mb-3`}>
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className={`text-sm font-medium ${headingColor} mt-3 mb-2`}>
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className={`text-[13px] ${textColor} leading-[1.7] mb-3`}>
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className={`font-semibold ${headingColor}`}>
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
            <li className={`text-[13px] ${textColor} leading-[1.7]`}>
              {children}
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote className={`border-l-[3px] border-[#c8873a] pl-3 italic ${isUser ? 'text-inherit opacity-80' : 'text-[#6b7280]'} my-3`}>
              {children}
            </blockquote>
          ),
          code: ({ children, className }) => {
            const isInline = !className;
            return isInline ? (
              <code className={`bg-[#f5f0e8] px-1.5 py-0.5 rounded text-xs font-mono ${isUser ? 'text-[#1a1714]' : 'text-[#1a1714]'}`}>
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
