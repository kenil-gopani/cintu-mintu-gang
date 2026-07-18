import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/atom-one-dark.css' // Import a dark theme for code
import { Check, Copy } from 'lucide-react'

// Custom CodeBlock with Copy Button
const CodeBlock = ({ node, inline, className, children, ...props }) => {
  const [copied, setCopied] = useState(false)
  const match = /language-(\w+)/.exec(className || '')
  const language = match ? match[1] : ''

  const handleCopy = (e) => {
    e.stopPropagation()
    navigator.clipboard.writeText(String(children).replace(/\n$/, ''))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (inline) {
    return (
      <code className="bg-black/10 dark:bg-white/10 text-primary dark:text-blue-300 px-1.5 py-0.5 rounded-md text-[0.85em] font-mono break-all" {...props}>
        {children}
      </code>
    )
  }

  return (
    <div className="relative group my-4 rounded-xl overflow-hidden bg-[#282c34] border border-black/10 dark:border-white/10 shadow-sm" onContextMenu={e => e.stopPropagation()}>
      <div className="flex items-center justify-between px-4 py-2 bg-black/20 text-white/70 text-xs font-sans uppercase tracking-wider">
        <span>{language || 'Code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 hover:text-white transition-colors p-1"
          title="Copy code"
        >
          {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
          <span>{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>
      <div className="overflow-x-auto p-4 text-[0.85em] text-white">
        <code className={className} {...props}>
          {children}
        </code>
      </div>
    </div>
  )
}

export default function MarkdownRenderer({ content, isMe }) {
  // If the user sent the message, we might just want to render it as normal text with minimal formatting,
  // but to keep it consistent, we'll format it. We'll adjust text colors depending on `isMe`.
  
  return (
    <div className={`markdown-renderer leading-relaxed ${isMe ? 'text-white' : 'text-light-text dark:text-dark-text'}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          h1: ({node, ...props}) => <h1 className="text-2xl font-black mt-6 mb-3 border-b border-black/10 dark:border-white/10 pb-2" {...props} />,
          h2: ({node, ...props}) => <h2 className="text-xl font-bold mt-5 mb-2.5" {...props} />,
          h3: ({node, ...props}) => <h3 className="text-lg font-bold mt-4 mb-2" {...props} />,
          h4: ({node, ...props}) => <h4 className="text-base font-bold mt-3 mb-1" {...props} />,
          p: ({node, ...props}) => <p className="mb-3 last:mb-0 whitespace-pre-wrap break-words" {...props} />,
          ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 space-y-1" {...props} />,
          ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-4 space-y-1" {...props} />,
          li: ({node, ...props}) => <li className="pl-1" {...props} />,
          strong: ({node, ...props}) => <strong className="font-bold font-black" {...props} />,
          em: ({node, ...props}) => <em className="italic" {...props} />,
          blockquote: ({node, ...props}) => (
            <blockquote className={`border-l-4 px-4 py-2 my-4 rounded-r-xl italic ${isMe ? 'border-white/30 bg-white/10 text-white/90' : 'border-primary/50 bg-primary/5 dark:bg-primary/10 text-light-text dark:text-dark-text/90'}`} {...props} />
          ),
          hr: ({node, ...props}) => <hr className={`my-6 ${isMe ? 'border-white/20' : 'border-black/10 dark:border-white/10'}`} {...props} />,
          a: ({node, ...props}) => <a className={`underline underline-offset-2 ${isMe ? 'text-white hover:text-gray-200' : 'text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300'}`} target="_blank" rel="noopener noreferrer" {...props} />,
          table: ({node, ...props}) => (
            <div className={`w-full overflow-x-auto my-4 rounded-xl border shadow-sm ${isMe ? 'border-white/20 bg-white/5' : 'border-black/10 dark:border-white/10 bg-white dark:bg-dark-bg'}`} onContextMenu={e => e.stopPropagation()}>
              <table className="w-full text-sm text-left border-collapse" {...props} />
            </div>
          ),
          thead: ({node, ...props}) => <thead className={`border-b ${isMe ? 'bg-white/10 border-white/20' : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10'}`} {...props} />,
          th: ({node, ...props}) => <th className="px-4 py-3 font-bold whitespace-nowrap" {...props} />,
          tbody: ({node, ...props}) => <tbody className={`divide-y ${isMe ? 'divide-white/10' : 'divide-black/5 dark:divide-white/5'}`} {...props} />,
          tr: ({node, ...props}) => <tr className={`transition-colors ${isMe ? 'hover:bg-white/10' : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.02]'}`} {...props} />,
          td: ({node, ...props}) => <td className="px-4 py-3" {...props} />,
          code: CodeBlock
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
