import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownMessageProps {
  content: string;
  isUser?: boolean;
}

export const MarkdownMessage: React.FC<MarkdownMessageProps> = ({ content, isUser }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ node, ...props }) => <h1 className="text-[16px] font-bold text-[#1a1714] mb-3 pb-2 border-b border-[#f0ede8]" {...props} />,
        h2: ({ node, ...props }) => <h2 className="text-[14px] font-bold text-[#1a1714] mb-3 pb-1 border-b border-[#f0ede8] mt-4" {...props} />,
        h3: ({ node, ...props }) => <h3 className="text-[13px] font-semibold text-[#1a1714] mb-2 mt-3" {...props} />,
        strong: ({ node, ...props }) => <strong className="text-[#1a1714] font-semibold" {...props} />,
        ul: ({ node, ...props }) => <ul className="list-disc pl-5 my-2 space-y-1 text-[13px] text-[#3a3530]" {...props} />,
        ol: ({ node, ...props }) => <ol className="list-decimal pl-5 my-2 space-y-1 text-[13px] text-[#3a3530]" {...props} />,
        li: ({ node, ...props }) => <li className="pl-1" {...props} />,
        blockquote: ({ node, ...props }) => (
          <blockquote className="border-l-[3px] border-[#c8873a] pl-4 py-1 my-3 text-[#5a5248] italic bg-[#fdfaf5] rounded-r-md" {...props} />
        ),
        p: ({ node, ...props }) => <p className="text-[13px] text-[#3a3530] leading-[1.7] mb-3 last:mb-0" {...props} />,
        hr: ({ node, ...props }) => <hr className="border-t border-[#f0ede8] my-4" {...props} />,
        code: ({ node, ...props }) => <code className="bg-[#f5f0e8] px-1.5 py-0.5 rounded text-[#c8873a] font-mono text-[12px]" {...props} />,
        a: ({ node, ...props }) => <a className="text-[#c8873a] hover:underline" target="_blank" rel="noreferrer" {...props} />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

export default MarkdownMessage;