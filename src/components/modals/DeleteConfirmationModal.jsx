import React from 'react';
import { Dialog } from '@headlessui/react';
import { FaExclamationTriangle } from 'react-icons/fa';

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg">
          <div className="flex items-center text-red-600 mb-4">
            <FaExclamationTriangle className="text-xl mr-2" />
            <Dialog.Title className="text-lg font-medium">
              {title || 'Confirmar Exclusão'}
            </Dialog.Title>
          </div>
          
          <p className="text-gray-700 mb-6">
            {message || 'Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.'}
          </p>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
            >
              Excluir
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default DeleteConfirmationModal;
