'use client';

interface ConfirmationDialogProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationDialog = ({ isOpen, message, onConfirm, onCancel }: ConfirmationDialogProps) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg overflow-hidden shadow-xl max-w-md w-full">
        <div className="p-6 text-center">
          <h3 className="text-xl font-bold mb-4">Confirm</h3>
          <p className="mb-6">
            Are you sure? {message}
          </p>
        </div>
        <div className="flex border-t border-gray-200">
          <button 
            className="flex-1 py-3 text-blue-500 font-medium border-r border-gray-200"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button 
            className="flex-1 py-3 text-blue-500 font-medium"
            onClick={onConfirm}
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  );
};
