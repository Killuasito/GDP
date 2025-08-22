import React from 'react';
import { FaMapMarkedAlt, FaEdit, FaTrash, FaLocationArrow, FaLock, FaShieldAlt } from 'react-icons/fa';

const PoleCard = ({ pole, onSelect, onEdit, onDelete }) => {
  // Format location safely to handle both string and object formats
  const formatLocation = (location) => {
    if (!location) return '';
    
    // If location is an object with latitude and longitude
    if (typeof location === 'object' && location.latitude !== undefined && location.longitude !== undefined) {
      return `${location.latitude}, ${location.longitude}`;
    }
    
    // If it's already a string, return as is
    return location.toString();
  };

  return (
    <div
      className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer relative"
      onClick={() => onSelect(pole)}
    >
      {/* Password protection badge */}
      {pole.isPasswordProtected && (
        <div className="absolute top-0 right-0 transform translate-x-1/3 -translate-y-1/3">
          <div className="bg-yellow-500 text-white p-1.5 rounded-full shadow-md">
            <FaLock size={10} />
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <FaMapMarkedAlt className="text-green-600" />
          <h3 className="text-lg font-semibold">{pole.name}</h3>
          {pole.isPasswordProtected && (
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
              onEdit(pole);
            }}
            className="p-2 text-gray-600 hover:text-blue-600"
            title="Editar polo"
          >
            <FaEdit />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(pole);
            }}
            className="p-2 text-gray-600 hover:text-red-600"
            title="Excluir polo"
          >
            <FaTrash />
          </button>
        </div>
      </div>
      <p className="text-gray-600">{pole.description}</p>
      
      {pole.location && (
        <div className="mt-2 text-sm text-gray-600 flex items-center">
          <FaLocationArrow className="text-gray-500 mr-1" size={12} />
          <span>{formatLocation(pole.location)}</span>
        </div>
      )}
      
      <div className="mt-4 text-sm text-gray-500">
        <div>Criado por: {pole.createdBy}</div>
        <div className="mt-2 text-blue-600 hover:text-blue-800">
          Ver poços →
        </div>
      </div>
    </div>
  );
};

export default PoleCard;
