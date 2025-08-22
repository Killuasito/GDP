import React from 'react';
import { FaWater, FaEdit, FaTrash, FaLock, FaShieldAlt } from 'react-icons/fa';

const WellCard = ({ well, onSelect, onEdit, onDelete }) => {
  // Status styles
  const statusColors = {
    active: "bg-green-100 text-green-800",
    inactive: "bg-red-100 text-red-800",
    maintenance: "bg-yellow-100 text-yellow-800",
  };
  
  // Status labels
  const statusLabels = {
    active: "Ativo",
    inactive: "Inativo",
    maintenance: "Manutenção",
  };

  return (
    <div 
      className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer relative"
      onClick={() => onSelect(well)}
    >
      {/* Password protection badge */}
      {well.isPasswordProtected && (
        <div className="absolute top-0 right-0 transform translate-x-1/3 -translate-y-1/3">
          <div className="bg-yellow-500 text-white p-1.5 rounded-full shadow-md">
            <FaLock size={10} />
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <FaWater className="text-blue-600" />
          <h3 className="text-lg font-semibold">{well.name}</h3>
          {well.isPasswordProtected && (
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
              onEdit(well);
            }}
            className="p-2 text-gray-600 hover:text-blue-600"
            title="Editar poço"
          >
            <FaEdit />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(well);
            }}
            className="p-2 text-gray-600 hover:text-red-600"
            title="Excluir poço"
          >
            <FaTrash />
          </button>
        </div>
      </div>
      
      <div className="flex items-center space-x-2 mb-3">
        <span className={`px-2 py-1 rounded-full text-xs ${statusColors[well.status]}`}>
          {statusLabels[well.status]}
        </span>
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        <div className="flex justify-between">
          <span>Criado por: {well.createdBy}</span>
          <span className="text-blue-600 hover:text-blue-800">
            Ver detalhes →
          </span>
        </div>
      </div>
    </div>
  );
};

export default WellCard;
