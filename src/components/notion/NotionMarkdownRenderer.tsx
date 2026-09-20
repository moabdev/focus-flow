import React from 'react';

interface NotionMarkdownRendererProps {
  content: string;
  onContentChange: (newContent: string) => void;
}

export const NotionMarkdownRenderer: React.FC<NotionMarkdownRendererProps> = ({
  content,
  onContentChange,
}) => {
  if (!content.trim()) {
    return (
      <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '1rem' }}>
        Nenhuma anotação ainda. Use a barra de ferramentas acima para adicionar títulos, checklists, callouts ou código!
      </div>
    );
  }

  const lines = content.split('\n');

  return (
    <div className="notion-preview-content">
      {lines.map((line, idx) => {
        // 1. Título H1
        if (line.startsWith('# ')) {
          return <h1 key={idx} className="notion-h1">{line.replace('# ', '')}</h1>;
        }
        // 2. Título H2
        if (line.startsWith('## ')) {
          return <h2 key={idx} className="notion-h2">{line.replace('## ', '')}</h2>;
        }
        // 3. Título H3
        if (line.startsWith('### ')) {
          return <h3 key={idx} className="notion-h3">{line.replace('### ', '')}</h3>;
        }
        // 4. Checklists interativos [ ] ou [x]
        if (/^- \[( |x)\] /i.test(line)) {
          const isChecked = /- \[x\] /i.test(line);
          const taskText = line.replace(/^- \[( |x)\] /i, '');
          return (
            <div
              key={idx}
              className={`notion-checklist-item ${isChecked ? 'completed' : ''}`}
              onClick={() => {
                const newLines = [...lines];
                newLines[idx] = isChecked ? `- [ ] ${taskText}` : `- [x] ${taskText}`;
                onContentChange(newLines.join('\n'));
              }}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => {}}
                className="notion-checkbox"
              />
              <span
                style={{
                  textDecoration: isChecked ? 'line-through' : 'none',
                  color: isChecked ? 'var(--text-muted)' : 'inherit',
                }}
              >
                {taskText}
              </span>
            </div>
          );
        }
        // 5. Callouts / Citações (> 💡 ...)
        if (line.startsWith('> ')) {
          return (
            <blockquote key={idx} className="notion-callout">
              {line.replace('> ', '')}
            </blockquote>
          );
        }
        // 6. Linha horizontal
        if (line.trim() === '---') {
          return <hr key={idx} className="notion-divider" />;
        }
        // 7. Lista não-ordenada (- ...)
        if (line.startsWith('- ')) {
          return (
            <li key={idx} className="notion-bullet-item">
              {line.replace('- ', '')}
            </li>
          );
        }
        // 8. Linhas vazias
        if (!line.trim()) {
          return <div key={idx} style={{ height: '0.75rem' }} />;
        }

        // Parágrafo padrão
        return (
          <p key={idx} className="notion-p">
            {line}
          </p>
        );
      })}
    </div>
  );
};
