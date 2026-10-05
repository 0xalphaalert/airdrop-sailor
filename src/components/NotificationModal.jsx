import React from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
  X
} from 'lucide-react';

import './NotificationModal.css';

const NotificationModal = ({
  isOpen,
  onClose,
  type = 'success',
  title,
  message,
  details = [],
  buttonText = 'Continue'
}) => {
  if (!isOpen) return null;

  const icons = {
    success: <CheckCircle2 size={38} />,
    error: <XCircle size={38} />,
    warning: <AlertCircle size={38} />,
    info: <Info size={38} />
  };

  return (
    <div className="notification-overlay">
      <div className={`notification-modal notification-${type}`}>

        {/* Close Button */}
        <button
          className="notification-close"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* Icon */}
        <div className="notification-icon">
          {icons[type]}
        </div>

        {/* Content */}
        <div className="notification-content">

          <h2>{title}</h2>

          {message && (
            <p className="notification-message">
              {message}
            </p>
          )}

          {details.length > 0 && (
            <div className="notification-details">
              {details.map((detail, index) => (
                <div
                  className="notification-detail-row"
                  key={index}
                >
                  <span>{detail.label}</span>
                  <strong>{detail.value}</strong>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Button */}
        <button
          className="notification-button"
          onClick={onClose}
        >
          {buttonText}
        </button>

      </div>
    </div>
  );
};

export default NotificationModal;