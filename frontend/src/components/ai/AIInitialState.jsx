import React from 'react';

export const AIInitialState = ({
  welcomeText,
  topicGroups = [],
  sampleQuestions = [],
  loading,
  onSelectQuestion,
}) => {
  const hasGroups = Array.isArray(topicGroups) && topicGroups.length > 0;

  return (
    <div className="chat-initial">
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>{welcomeText}</p>

      {hasGroups ? (
        <div className="chat-topic-grid">
          {topicGroups.map((group) => (
            <div key={group.topic} className="chat-topic-card">
              <div className="chat-prompts-label">{group.topic}</div>
              <div className="chat-prompts-list">
                {group.questions.map((q) => (
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
          ))}
        </div>
      ) : (
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
      )}
    </div>
  );
};

export default AIInitialState;
