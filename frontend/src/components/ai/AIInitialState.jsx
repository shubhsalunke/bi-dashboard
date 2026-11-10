import React from 'react';

export const AIInitialState = ({
  welcomeText,
  sampleQuestions,
  loading,
  onSelectQuestion,
}) => {
  return (
    <div className="chat-initial">
      <div className="chat-initial-intro">
        <h3 className="chat-initial-title">Ask a question</h3>
        <p className="chat-initial-desc">{welcomeText}</p>
      </div>

      <div>
        <div className="chat-prompts-label">Sample questions:</div>
        <div className="chat-prompts-grid">
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
