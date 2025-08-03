import React from 'react';
import { FaExclamationCircle } from 'react-icons/fa';

const ApprovedActionModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 transform transition-all">
        <div className="flex flex-col items-center">
          <div className="mb-4">
            <FaExclamationCircle className="text-yellow-500 text-5xl animate-bounce" />
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Action Not Permitted
          </h3>
          
          <div className="text-center mb-6">
            <p className="text-gray-600">
              This admission has been approved and cannot be modified or deleted.
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Please contact an administrator if you need to make changes to an approved admission.
            </p>
          </div>

          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApprovedActionModal;