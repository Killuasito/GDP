import React, { useState, useEffect, useCallback } from "react";
import { firebaseService } from "../services/firebaseService";
import { toast } from "react-toastify";
import { format } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { 
  FaUpload, 
  FaDownload, 
  FaWater, 
  FaTachometerAlt, 
  FaCompressArrowsAlt,
  FaEye,
  FaEyeSlash,
  FaPlus,
  FaHistory,
  FaTimes
} from "react-icons/fa";
import { exportWellData } from "../utils/exportData";
import { useAuth } from "../contexts/AuthContext"; // Add this import

const WellDetails = ({ well, onUpdate }) => {
  const { currentUser } = useAuth(); // Get current user from auth context
  const [loading, setLoading] = useState(false);
  const [measurements, setMeasurements] = useState([]);
  const [formData, setFormData] = useState({
    waterLevel: well.data.waterLevel,
    pressure: well.data.pressure,
    flowRate: well.data.flowRate,
    observations: well.data.observations,
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [status, setStatus] = useState(well.status);
  const [observationsOpen, setObservationsOpen] = useState(false);
  const [showAddMeasurement, setShowAddMeasurement] = useState(false);
  const [newMeasurementData, setNewMeasurementData] = useState({
    waterLevel: 0,
    pressure: 0,
    flowRate: 0,
    observations: "",
    customMeasurements: []
  });
  
  const [customFields, setCustomFields] = useState([
    { name: 'pH', value: '', unit: '' },
    { name: 'Turbidez', value: '', unit: 'NTU' },
    { name: 'Condutividade', value: '', unit: 'μS/cm' }
  ]);

  const loadMeasurements = useCallback(async () => {
    try {
      const data = await firebaseService.getWellMeasurements(well.id);
      setMeasurements(data);
    } catch (err) {
      toast.error("Erro ao carregar medições");
      console.error(err);
    }
  }, [well.id]);

  useEffect(() => {
    loadMeasurements();
  }, [loadMeasurements]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const measurementData = {
        ...formData,
        updatedBy: currentUser?.displayName || "Usuário", // Use actual username
        customMeasurements: customFields.filter(field => field.value.toString().trim() !== '')
      };
      
      await firebaseService.updateWell(well.id, measurementData);

      if (selectedFile) {
        await firebaseService.uploadWellImage(well.id, selectedFile);
      }

      const updatedWell = {
        ...well,
        data: {
          ...well.data,
          ...formData,
          lastMeasurement: new Date().toISOString(),
        },
      };
      onUpdate(updatedWell);
      toast.success("Dados atualizados com sucesso!");
      await loadMeasurements();
    } catch (error) {
      toast.error("Erro ao atualizar dados");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      setLoading(true);
      const updatedWell = await firebaseService.updateWellStatus(
        well.id,
        newStatus
      );
      onUpdate(updatedWell);
      toast.success("Status atualizado com sucesso!");
      setStatus(newStatus);
    } catch (error) {
      toast.error("Erro ao atualizar status");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMeasurement = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const measurementData = {
        ...newMeasurementData,
        updatedBy: currentUser?.displayName || "Usuário", // Use actual username
        customMeasurements: customFields.filter(field => field.value.toString().trim() !== '')
      };
      
      await firebaseService.updateWell(well.id, measurementData);

      const updatedWell = {
        ...well,
        data: {
          ...well.data,
          waterLevel: newMeasurementData.waterLevel,
          pressure: newMeasurementData.pressure,
          flowRate: newMeasurementData.flowRate,
          observations: newMeasurementData.observations,
          lastMeasurement: new Date().toISOString(),
        },
      };
      onUpdate(updatedWell);
      toast.success("Nova medição registrada com sucesso!");
      await loadMeasurements();
      setShowAddMeasurement(false);
      setNewMeasurementData({
        waterLevel: 0,
        pressure: 0,
        flowRate: 0,
        observations: "",
        customMeasurements: []
      });
    } catch (err) {
      console.error(err);
      toast.error("Erro ao adicionar medição");
    } finally {
      setLoading(false);
    }
  };

  const statusColors = {
    active: "bg-green-100 text-green-800 border-green-200",
    inactive: "bg-red-100 text-red-800 border-red-200",
    maintenance: "bg-yellow-100 text-yellow-800 border-yellow-200",
  };

  const statusLabels = {
    active: "Ativo",
    inactive: "Inativo",
    maintenance: "Manutenção",
  };

  const handleExportData = () => {
    exportWellData(well, measurements);
    toast.success("Dados exportados com sucesso!");
  };

  // Custom field handlers
  const handleCustomFieldChange = (index, field, value) => {
    const newFields = [...customFields];
    newFields[index][field] = value;
    setCustomFields(newFields);
  };

  const handleDeleteCustomField = (index) => {
    const newFields = customFields.filter((_, i) => i !== index);
    setCustomFields(newFields);
  };

  const MobileMeasurementRow = ({ measurement, index }) => {
    const [expanded, setExpanded] = useState(false);
    
    return (
      <div className={`sm:hidden mb-3 border border-gray-300 rounded-lg overflow-hidden shadow-sm transition-all ${expanded ? 'shadow-md' : ''} ${index % 2 === 0 ? "bg-gray-50" : "bg-white"}`}>
        <div 
          className="flex justify-between items-center p-3 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div>
            <div className="font-medium text-gray-800">
              {format(new Date(measurement.timestamp), "dd/MM/yyyy")}
              <span className="ml-2 text-xs font-normal text-gray-500">
                {format(new Date(measurement.timestamp), "HH:mm")}
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-1 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {measurement.measuredBy || 'Sistema'}
            </div>
          </div>
          <div className={`flex items-center transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>
            <div className={`rounded-full p-1 bg-blue-50 text-blue-600 transition-colors ${expanded ? 'bg-blue-100' : ''}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expanded ? 'max-h-96' : 'max-h-0'}`}>
          <div className="p-3 border-t border-gray-300">
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-blue-50 p-2 rounded-md text-center">
                <div className="text-xs text-blue-700 font-medium">Nível da Água</div>
                <div className="font-bold text-blue-600">{measurement.waterLevel} m</div>
              </div>
              <div className="bg-green-50 p-2 rounded-md text-center">
                <div className="text-xs text-green-700 font-medium">Pressão</div>
                <div className="font-bold text-green-600">{measurement.pressure} PSI</div>
              </div>
              <div className="bg-red-50 p-2 rounded-md text-center">
                <div className="text-xs text-red-700 font-medium">Vazão</div>
                <div className="font-bold text-red-600">{measurement.flowRate} m³/h</div>
              </div>
            </div>
            
            {measurement.customMeasurements && measurement.customMeasurements.length > 0 && (
              <div className="mt-3 bg-purple-50 p-2 rounded-md">
                <div className="text-xs text-purple-700 font-medium mb-1">Medidas Adicionais</div>
                <div className="grid grid-cols-2 gap-2">
                  {measurement.customMeasurements.map((item, idx) => (
                    <div key={idx} className="text-xs bg-white p-1.5 rounded border border-purple-100">
                      <span className="text-purple-800 font-medium block">{item.name}</span>
                      <span className="text-purple-600">{item.value} {item.unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {measurement.observations && (
              <div className="mt-3 bg-gray-50 p-2 rounded-md border border-gray-100">
                <div className="text-xs text-gray-700 font-medium mb-1">Observações</div>
                <div className="text-sm text-gray-600 italic">"{measurement.observations}"</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with well name and status - modified to remove any add well button */}
      <div className="flex flex-wrap justify-between items-center bg-white p-4 rounded-lg shadow-md">
        <div className="flex items-center">
          <h2 className="text-xl font-bold text-gray-800">{well.name}</h2>
          <span
            className={`ml-3 px-3 py-1 rounded-full text-sm font-medium ${
              statusColors[well.status]
            }`}
          >
            {statusLabels[well.status]}
          </span>
        </div>
        <button
          onClick={handleExportData}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors mt-2 sm:mt-0"
        >
          <FaDownload />
          <span>Exportar dados</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Card */}
        <div className="bg-white rounded-lg p-6 shadow-md">
          <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200">
            Status do Poço
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status Atual
              </label>
              <select
                value={status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={loading}
                className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
                <option value="maintenance">Manutenção</option>
              </select>
            </div>
            <div className="pt-4 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-sm">
                  <span className="block text-gray-500">Criado por</span>
                  <span className="font-medium">{well.createdBy}</span>
                </div>
                <div className="text-sm">
                  <span className="block text-gray-500">Última atualização</span>
                  <span className="font-medium">
                    {format(new Date(well.data.lastMeasurement), "dd/MM/yyyy")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Current Readings Card */}
        <div className="bg-white rounded-lg p-6 shadow-md lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200">
            Medições Atuais
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div className="flex items-center space-x-2 text-blue-700 mb-1">
                <FaWater className="text-lg" />
                <span className="font-medium">Nível da Água</span>
              </div>
              <div className="text-2xl font-bold">{well.data.waterLevel} m</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <div className="flex items-center space-x-2 text-green-700 mb-1">
                <FaCompressArrowsAlt className="text-lg" />
                <span className="font-medium">Pressão</span>
              </div>
              <div className="text-2xl font-bold">{well.data.pressure} PSI</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border border-red-100">
              <div className="flex items-center space-x-2 text-red-700 mb-1">
                <FaTachometerAlt className="text-lg" />
                <span className="font-medium">Vazão</span>
              </div>
              <div className="text-2xl font-bold">{well.data.flowRate} m³/h</div>
            </div>
          </div>

          <details 
            className="group" 
            open={observationsOpen}
            onClick={(e) => {
              if (e.target.tagName.toLowerCase() !== 'summary') return;
              e.preventDefault();
              setObservationsOpen(!observationsOpen);
            }}
          >
            <summary className="cursor-pointer list-none flex items-center justify-between font-medium text-gray-700 hover:text-blue-600 p-2 rounded-md hover:bg-gray-50">
              <div className="flex items-center">
                {observationsOpen ? (
                  <FaEyeSlash className="mr-2 text-gray-500" />
                ) : (
                  <FaEye className="mr-2 text-blue-500" />
                )}
                <span>Observações</span>
              </div>
            </summary>
            <div className="mt-3 bg-gray-50 p-4 rounded-md text-gray-700">
              {well.data.observations || "Sem observações."}
            </div>
          </details>

          <div className="mt-4 flex justify-end items-center">
            <button
              onClick={handleExportData}
              className="flex items-center space-x-2 text-sm font-medium text-gray-600 hover:text-gray-800"
            >
              <FaHistory size={14} />
              <span>Ver histórico completo</span>
            </button>
          </div>
        </div>

        {/* Formulário do Poço */}
        <div className="bg-white rounded-lg p-6 shadow-md">
          <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200">
            Registrar Nova Medição
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nível da Água (m)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.waterLevel}
                onChange={(e) =>
                  setFormData({ ...formData, waterLevel: parseFloat(e.target.value) })
                }
                className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pressão (PSI)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.pressure}
                onChange={(e) =>
                  setFormData({ ...formData, pressure: parseFloat(e.target.value) })
                }
                className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vazão (m³/h)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.flowRate}
                onChange={(e) =>
                  setFormData({ ...formData, flowRate: parseFloat(e.target.value) })
                }
                className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            
            {/* Custom Fields Section */}
            <div className="pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Medições Adicionais</h4>
              <div className="space-y-3">
                {customFields.map((field, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-4">
                      <input
                        type="text"
                        value={field.name}
                        onChange={(e) => handleCustomFieldChange(index, 'name', e.target.value)}
                        placeholder="Nome do campo"
                        className="block w-full rounded-md border border-gray-300 py-1 px-2 shadow-sm text-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div className="col-span-4">
                      <input
                        type="number"
                        step="0.01"
                        value={field.value}
                        onChange={(e) => handleCustomFieldChange(index, 'value', e.target.value)}
                        placeholder="Valor"
                        className="block w-full rounded-md border border-gray-300 py-1 px-2 shadow-sm text-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="text"
                        value={field.unit}
                        onChange={(e) => handleCustomFieldChange(index, 'unit', e.target.value)}
                        placeholder="Unidade"
                        className="block w-full rounded-md border border-gray-300 py-1 px-2 shadow-sm text-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomField(index)}
                        className="text-red-500 hover:text-red-700"
                        title="Remover campo"
                      >
                        <FaTimes size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                <button 
                  type="button"
                  onClick={() => setCustomFields([...customFields, { name: '', value: '', unit: '' }])}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <FaPlus size={10} className="mr-1" /> Adicionar campo
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observações
              </label>
              <textarea
                value={formData.observations}
                onChange={(e) =>
                  setFormData({ ...formData, observations: e.target.value })
                }
                className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                rows={3}
                placeholder="Adicione observações relevantes aqui"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adicionar Imagem
              </label>
              <div className="flex items-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="well-image"
                />
                <label
                  htmlFor="well-image"
                  className="cursor-pointer flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <FaUpload className="text-gray-500" />
                  <span className="text-sm truncate max-w-[200px]">
                    {selectedFile ? selectedFile.name : "Selecionar arquivo"}
                  </span>
                </label>
              </div>
            </div>
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full mt-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {loading ? "Salvando..." : "Salvar"}
            </button>
          </form>
        </div>

        {/* Gráfico Histórico */}
        <div className="bg-white rounded-lg p-6 shadow-md lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200">
            Histórico de Medições
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={measurements}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(timestamp) =>
                    format(new Date(timestamp), "dd/MM")
                  }
                  stroke="#64748b"
                />
                <YAxis yAxisId="left" stroke="#2563eb" />
                <YAxis yAxisId="right" orientation="right" stroke="#16a34a" />
                <Tooltip
                  labelFormatter={(timestamp) =>
                    format(new Date(timestamp), "dd/MM/yyyy HH:mm")
                  }
                  contentStyle={{ borderRadius: '4px', border: '1px solid #e2e8f0' }}
                />
                <Legend iconType="circle" />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="waterLevel"
                  name="Nível da Água"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="pressure"
                  name="Pressão"
                  stroke="#16a34a"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="flowRate"
                  name="Vazão"
                  stroke="#dc2626"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabela de últimas medições */}
        <div className="bg-white rounded-lg p-6 shadow-md lg:col-span-3">
          <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200">
            Últimas Medições
          </h3>
          
          {/* Mobile view */}
          <div className="sm:hidden">
            {measurements.length > 0 ? (
              measurements.slice(0, 5).map((measurement, index) => (
                <MobileMeasurementRow key={index} measurement={measurement} index={index} />
              ))
            ) : (
              <div className="text-center py-4 text-sm text-gray-500">
                Nenhuma medição registrada.
              </div>
            )}
          </div>
          
          {/* Desktop view */}
          <div className="hidden sm:block overflow-x-auto -mx-6 px-6">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Data
                  </th>
                  <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Água
                  </th>
                  <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pressão
                  </th>
                  <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vazão
                  </th>
                  <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Adicionais
                  </th>
                  <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Observações
                  </th>
                  <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Por
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {measurements.length > 0 ? (
                  measurements.slice(0, 5).map((measurement, index) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                      <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                        {format(new Date(measurement.timestamp), "dd/MM/yyyy HH:mm")}
                      </td>
                      <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                        <span className="text-blue-600 font-medium">{measurement.waterLevel} m</span>
                      </td>
                      <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                        <span className="text-green-600 font-medium">{measurement.pressure} PSI</span>
                      </td>
                      <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                        <span className="text-red-600 font-medium">{measurement.flowRate} m³/h</span>
                      </td>
                      <td className="px-2 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm text-gray-900">
                        {measurement.customMeasurements && measurement.customMeasurements.length > 0 ? (
                          <div className="space-y-1">
                            {measurement.customMeasurements.map((item, idx) => (
                              <div key={idx} className="text-purple-600">
                                <span className="font-medium">{item.name}:</span> {item.value} {item.unit}
                              </div>
                            ))}
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-2 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm text-gray-500 max-w-xs truncate">
                        {measurement.observations || "-"}
                      </td>
                      <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                        {measurement.measuredBy || "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                      Nenhuma medição registrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {measurements.length > 5 && (
            <div className="mt-4 text-right">
              <button
                onClick={handleExportData}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Ver todas as {measurements.length} medições
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WellDetails;
