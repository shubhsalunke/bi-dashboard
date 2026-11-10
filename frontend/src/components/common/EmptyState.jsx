import React from 'react';
import { Inbox } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No records found',
  message,
  description,
  action = null,
}) => {
  const descText = message || description || 'There are no items matching your current filters.';

  return (
    <div className="empty-state">
      <div className="empty-state-icon" aria-hidden="true">
        <Icon size={22} />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-desc">{descText}</p>
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;
