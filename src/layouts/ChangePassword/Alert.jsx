import React from 'react';
import { AiOutlineClose } from 'react-icons/ai';

const Alert = ({ message, type, onClose }) => {
  const alertStyles = {
    success: 'bg-green-100 border border-green-400 text-green-700',
    error: 'bg-red-100 border border-red-400 text-red-700',
  };

  return (
    <div className={`${alertStyles[type]} px-4 py-3 rounded mb-4 flex items-center`}>
      <span className="flex-grow">{message}</span>
      <button onClick={onClose} className="ml-4">
        <AiOutlineClose size={20} />
      </button>
    </div>
  );
};

export default Alert;
