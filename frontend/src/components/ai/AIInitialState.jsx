import React from 'react';

export const AIInitialState = ({
  welcomeText,
  sampleQuestions,
  loading,
  onSelectQuestion,
}) => {
  return (
    <div className="chat-initial">
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>{welcomeText}</p>

      <div>
        <div className="chat-prompts-label">Sample questions:</div>
        <div className="chat-prompts-list">
          {sampleQuestions.map((q) => (
            <button
              key={q}
              type="button"
              className="btn btn-secondary btn-sm chat-prompt-btn"
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
