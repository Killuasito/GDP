import React from 'react';
import { FaMapMarkedAlt, FaEdit, FaTrash, FaLock, FaShieldAlt } from 'react-icons/fa';

const RegionCard = ({ region, onSelect, onEdit, onDelete }) => {
  return (
    <div
      className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer relative border border-blue-100 hover:border-blue-200 card-hover-effect"
      onClick={() => onSelect(region)}
    >
      {/* Password protection badge */}
      {region.isPasswordProtected && (
        <div className="absolute top-0 right-0 transform translate-x-1/3 -translate-y-1/3">
          <div className="bg-yellow-500 text-white p-1.5 rounded-full shadow-md">
            <FaLock size={10} />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-blue-100 rounded-full text-blue-600">
            <FaMapMarkedAlt className="text-lg" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">{region.name}</h3>
          {region.isPasswordProtected && (
            <div className="flex items-center bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full">
              <FaShieldAlt className="mr-1" size={10} />
              <span>Protegido</span>
            </div>
          )}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(region);
            }}
            className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
            title="Editar região"
          >
            <FaEdit />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(region);
            }}
            className="p-2 text-gray-600 hover:text-red-600 transition-colors"
            title="Excluir região"
          >
            <FaTrash />
          </button>
        </div>
      </div>
      <p className="text-gray-600 mb-4">{region.description}</p>
      
      <div className="pt-3 border-t border-blue-100 mt-4 text-sm text-gray-500">
        <div>Criado por: {region.createdBy}</div>
        <div className="mt-2 text-blue-600 hover:text-blue-800 flex items-center">
          Ver polos <span className="ml-1">→</span>
        </div>
      </div>
    </div>
  );
};

export default RegionCard;
