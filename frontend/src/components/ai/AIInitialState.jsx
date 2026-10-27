import React from 'react';

export const AIInitialState = ({
  welcomeText,
  sampleQuestions,
  loading,
  onSelectQuestion,
}) => {
  return (
    <div style={{ maxWidth: '720px', margin: '20px auto', width: '100%' }}>
      <div
        className="glass-panel"
        style={{
          padding: '20px',
          marginBottom: '20px',
        }}
      >
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '6px' }}>
          Ask a question
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
          {welcomeText}
        </p>
      </div>

      <div>
        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
          Sample questions:
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {sampleQuestions.map((q) => (
            <button
              key={q}
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ textAlign: 'left', justifyContent: 'flex-start', padding: '8px 12px' }}
              disabled={loading}
              onClick={() => onSelectQuestion(q)}
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AIInitialState;
