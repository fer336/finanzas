import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function MarkdownRenderer({ content }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Headings con estética dark/retro
        h1: ({ children }) => (
          <h1 className="text-2xl font-bold text-green-400 mb-4 border-b border-zinc-700 pb-2">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-xl font-bold text-green-400 mb-3 mt-6">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-lg font-semibold text-white mb-2 mt-4">
            {children}
          </h3>
        ),

        // Párrafos
        p: ({ children }) => (
          <p className="text-zinc-300 mb-3 leading-relaxed">
            {children}
          </p>
        ),

        // Listas
        ul: ({ children }) => (
          <ul className="list-disc list-inside text-zinc-300 mb-3 space-y-1 ml-4">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside text-zinc-300 mb-3 space-y-1 ml-4">
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className="text-zinc-300">
            {children}
          </li>
        ),

        // Código inline y bloques especiales
        code: ({ className, children, ...props }) => {
          // Detectar bloques especiales: ```card { "title": "...", "kpis":[...] }
          if (className?.includes('language-card')) {
            try {
              const data = JSON.parse(String(children));
              return <InteractiveCard data={data} />;
            } catch (error) {
              console.error('Error parsing card JSON:', error);
              return (
                <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-3 mb-4">
                  <div className="text-red-400 text-sm font-bold mb-1">Error en Card JSON:</div>
                  <pre className="text-red-300 text-xs whitespace-pre-wrap">{String(children)}</pre>
                </div>
              );
            }
          }
          
          // Código inline normal
          return (
            <code className="bg-zinc-800 text-green-400 px-2 py-1 rounded font-mono text-sm" {...props}>
              {children}
            </code>
          );
        },

        // Bloques de código
        pre: ({ children }) => (
          <pre className="bg-black border border-zinc-700 rounded-lg p-4 mb-4 overflow-x-auto">
            {children}
          </pre>
        ),

        // Tablas con estética dark/retro
        table: ({ children }) => (
          <div className="mb-4 overflow-x-auto">
            <div className="bg-zinc-900 border border-zinc-700 rounded-lg">
              <table className="w-full text-sm">
                {children}
              </table>
            </div>
          </div>
        ),
        
        thead: ({ children }) => (
          <thead className="bg-zinc-800">
            {children}
          </thead>
        ),
        
        th: ({ children }) => (
          <th className="text-left py-3 px-4 text-green-400 font-semibold border-b border-zinc-700">
            {children}
          </th>
        ),
        
        tbody: ({ children }) => (
          <tbody>
            {children}
          </tbody>
        ),
        
        tr: ({ children }) => (
          <tr className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
            {children}
          </tr>
        ),
        
        td: ({ children }) => (
          <td className="py-3 px-4 text-zinc-300">
            {children}
          </td>
        ),

        // Enlaces
        a: ({ href, children }) => (
          <a 
            href={href} 
            className="text-green-400 hover:text-green-300 underline transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            {children}
          </a>
        ),

        // Texto enfatizado
        strong: ({ children }) => (
          <strong className="text-white font-bold">
            {children}
          </strong>
        ),
        
        em: ({ children }) => (
          <em className="text-green-400 italic">
            {children}
          </em>
        ),

        // Citas
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-green-500 pl-4 py-2 my-4 bg-zinc-900/50 rounded-r">
            <div className="text-zinc-400 italic">
              {children}
            </div>
          </blockquote>
        ),

        // Líneas horizontales
        hr: () => (
          <hr className="border-t border-zinc-700 my-6" />
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

// Componente para cards interactivos usando bloques ```card
// Sigue exactamente tu especificación: kpi-card, table, actions
function InteractiveCard({ data }) {
  const { type, title, kpis, items, columns, rows, actions } = data;

  // Card de KPIs/métricas - igual que tu spec
  if (type === 'kpi-card') {
    return (
      <div className="bg-zinc-900/60 border-2 border-zinc-700 rounded-xl p-4 mb-4">
        <div className="text-sm text-zinc-400 mb-2">{title}</div>
        <div className="grid grid-cols-2 gap-3">
          {(kpis || items || []).map((k, i) => (
            <div key={i} className="rounded-xl border border-zinc-700 p-3">
              <div className="text-xs text-zinc-400">{k.label}</div>
              <div className="text-lg font-semibold text-white">{k.value}</div>
              {k.change && (
                <div className={`text-xs mt-1 ${
                  k.change.startsWith('+') ? 'text-green-400' : 'text-red-400'
                }`}>
                  {k.change}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Tabla interactiva - igual que tu spec
  if (type === 'table') {
    return (
      <div className="mt-2 mb-4">
        {title && <div className="text-sm text-zinc-400 mb-2">{title}</div>}
        <div className="overflow-x-auto border border-zinc-700 rounded-xl">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-900/70">
              <tr>
                {(columns || []).map((c, i) => (
                  <th key={i} className="text-left p-2 text-green-400 font-semibold">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(rows || []).map((r, i) => (
                <tr key={i} className="border-t border-zinc-700">
                  {r.map((c, j) => (
                    <td key={j} className="p-2 text-zinc-300">
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Botones de acción - igual que tu spec
  if (type === 'actions') {
    return (
      <div className="flex gap-2 mt-3 mb-4 flex-wrap">
        {(actions || []).map((a, i) => (
          <button
            key={i}
            className="px-3 py-2 border border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-lg transition-all text-sm font-medium"
            onClick={() => window.dispatchEvent(new CustomEvent('chat-action', { detail: a }))}
          >
            {a.label}
          </button>
        ))}
      </div>
    );
  }

  // Auto-detectar el tipo si no se especifica (backward compatibility)
  if (!type) {
    // Si tiene kpis, es un kpi-card
    if (kpis || items) {
      return <InteractiveCard data={{ ...data, type: 'kpi-card' }} />;
    }
    // Si tiene columns y rows, es una tabla
    if (columns && rows) {
      return <InteractiveCard data={{ ...data, type: 'table' }} />;
    }
    // Si tiene actions, es un grupo de botones
    if (actions) {
      return <InteractiveCard data={{ ...data, type: 'actions' }} />;
    }
  }

  // Fallback: mostrar JSON raw con estilo
  return (
    <div className="bg-zinc-900 border-2 border-zinc-800 rounded-xl p-4 mb-4">
      {title && <div className="text-white font-bold text-sm mb-2">{title}</div>}
      <div className="text-zinc-400 text-xs mb-2">Unknown card type: {type || 'undefined'}</div>
      <pre className="text-zinc-300 text-xs whitespace-pre-wrap overflow-x-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}