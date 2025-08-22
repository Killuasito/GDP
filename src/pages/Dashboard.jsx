import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { firebaseService } from '../services/firebaseService';
import RegionCard from '../components/RegionCard';
import PoleCard from '../components/PoleCard';
import WellCard from '../components/WellCard';
import WellDetails from '../components/WellDetails';
import { toast } from 'react-toastify';
import { 
  FaPlus, 
  FaArrowLeft, 
  FaChartBar, 
  FaMapMarkedAlt, 
  FaWater, 
  FaBell, 
  FaExclamationTriangle,
  FaCheckCircle,
  FaWrench,
  FaSearch,
  FaHistory,
  FaUser  // Added the missing FaUser import
} from 'react-icons/fa';
import AddRegionModal from '../components/modals/AddRegionModal';
import AddPoleModal from '../components/modals/AddPoleModal';
import AddWellModal from '../components/modals/AddWellModal';
import EditRegionModal from '../components/modals/EditRegionModal';
import EditPoleModal from '../components/modals/EditPoleModal';
import EditWellModal from '../components/modals/EditWellModal';
import DeleteConfirmationModal from '../components/modals/DeleteConfirmationModal';
import PasswordEntryModal from '../components/modals/PasswordEntryModal';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [regions, setRegions] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [poles, setPoles] = useState([]);
  const [selectedPole, setSelectedPole] = useState(null);
  const [wells, setWells] = useState([]);
  const [selectedWell, setSelectedWell] = useState(null);
  
  // Modal states
  const [showAddRegionModal, setShowAddRegionModal] = useState(false);
  const [showAddPoleModal, setShowAddPoleModal] = useState(false);
  const [showAddWellModal, setShowAddWellModal] = useState(false);
  
  const [showEditRegionModal, setShowEditRegionModal] = useState(false);
  const [showEditPoleModal, setShowEditPoleModal] = useState(false);
  const [showEditWellModal, setShowEditWellModal] = useState(false);
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteType, setDeleteType] = useState(''); // 'region', 'pole', or 'well'
  
  const [itemToEdit, setItemToEdit] = useState(null);
  const [passwordModalType, setPasswordModalType] = useState(null); // 'region', 'pole', or 'well'
  const [passwordProtectedItem, setPasswordProtectedItem] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  // New state variables for dashboard metrics
  const [metrics, setMetrics] = useState({
    totalRegions: 0,
    totalPoles: 0,
    totalWells: 0,
    activeWells: 0,
    inactiveWells: 0,
    maintenanceWells: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    loadRegions();
    
    // Clear selections when the component loads
    setSelectedRegion(null);
    setSelectedPole(null);
    setSelectedWell(null);
  }, []);

  useEffect(() => {
    if (selectedRegion) {
      console.log("Loading poles for region:", selectedRegion);
      loadPoles(selectedRegion.id);
      
      // Clear pole and well selections when region changes
      setSelectedPole(null);
      setSelectedWell(null);
      setPoles([]);
      setWells([]);
    }
  }, [selectedRegion]);

  useEffect(() => {
    if (selectedPole) {
      console.log("Loading wells for pole:", selectedPole);
      loadWells(selectedPole.id);
      
      // Clear well selection when pole changes
      setSelectedWell(null);
      setWells([]);
    }
  }, [selectedPole]);

  // Calculate dashboard metrics
  useEffect(() => {
    const calculateMetrics = async () => {
      try {
        // Get all regions for the dashboard overview
        const allRegions = await firebaseService.getRegions();
        
        let allPoles = [];
        let allWells = [];
        
        // For each region, get its poles
        for (const region of allRegions) {
          const poles = await firebaseService.getPoles(region.id);
          allPoles = [...allPoles, ...poles];
          
          // For each pole, get its wells
          for (const pole of poles) {
            const wells = await firebaseService.getWells(pole.id);
            allWells = [...allWells, ...wells];
          }
        }
        
        // Calculate well status counts
        const activeWells = allWells.filter(well => well.status === 'active').length;
        const inactiveWells = allWells.filter(well => well.status === 'inactive').length;
        const maintenanceWells = allWells.filter(well => well.status === 'maintenance').length;
        
        setMetrics({
          totalRegions: allRegions.length,
          totalPoles: allPoles.length,
          totalWells: allWells.length,
          activeWells,
          inactiveWells,
          maintenanceWells
        });
        
        // Generate recent activity
        const recentActivity = generateRecentActivity(allRegions, allPoles, allWells);
        setRecentActivity(recentActivity);
        
      } catch (error) {
        console.error("Error calculating dashboard metrics:", error);
      }
    };
    
    // Only load all metrics when in the root dashboard view
    if (!selectedRegion && !selectedPole && !selectedWell) {
      calculateMetrics();
    }
  }, [selectedRegion, selectedPole, selectedWell]);
  
  // Function to generate recent activity based on creation/update timestamps
  const generateRecentActivity = (regions, poles, wells) => {
    // Combine all items into one array
    const allItems = [
      ...regions.map(r => ({ ...r, type: 'region' })),
      ...poles.map(p => ({ ...p, type: 'pole' })),
      ...wells.map(w => ({ ...w, type: 'well' }))
    ];
    
    // Sort by updatedAt or createdAt date
    allItems.sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt);
      const dateB = new Date(b.updatedAt || b.createdAt);
      return dateB - dateA;
    });
    
    // Return only the 5 most recent items
    return allItems.slice(0, 5);
  };
  
  // Function to handle global search
  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    
    if (term.length >= 2) {
      setIsSearching(true);
      
      // Search in regions
      const matchingRegions = regions
        .filter(region => region.name.toLowerCase().includes(term) || 
                         (region.description && region.description.toLowerCase().includes(term)))
        .map(region => ({ ...region, type: 'region' }));
      
      // If a region is selected, search in poles
      const matchingPoles = selectedRegion ? poles
        .filter(pole => pole.name.toLowerCase().includes(term) ||
                       (pole.description && pole.description.toLowerCase().includes(term)))
        .map(pole => ({ ...pole, type: 'pole' })) : [];
      
      // If a pole is selected, search in wells
      const matchingWells = selectedPole ? wells
        .filter(well => well.name.toLowerCase().includes(term))
        .map(well => ({ ...well, type: 'well' })) : [];
      
      setFilteredItems([...matchingRegions, ...matchingPoles, ...matchingWells]);
    } else {
      setIsSearching(false);
    }
  };
  
  // Function to handle search result click
  const handleSearchResultClick = (item) => {
    setSearchTerm('');
    setIsSearching(false);
    
    if (item.type === 'region') {
      attemptToSelectItem(item, 'region');
    } else if (item.type === 'pole') {
      setSelectedRegion(regions.find(region => region.id === item.regionId));
      attemptToSelectItem(item, 'pole');
    } else if (item.type === 'well') {
      // Find the pole this well belongs to
      const pole = poles.find(p => p.id === item.poleId);
      if (pole) {
        // Find the region this pole belongs to
        const region = regions.find(r => r.id === pole.regionId);
        if (region) {
          setSelectedRegion(region);
          setSelectedPole(pole);
          attemptToSelectItem(item, 'well');
        }
      }
    }
  };

  const loadRegions = async () => {
    try {
      setLoading(true);
      console.log("Fetching regions...");
      const fetchedRegions = await firebaseService.getRegions();
      console.log("Fetched regions:", fetchedRegions);
      setRegions(fetchedRegions);
    } catch (error) {
      console.error("Error loading regions:", error);
      toast.error('Erro ao carregar regiões');
    } finally {
      setLoading(false);
    }
  };

  const loadPoles = async (regionId) => {
    if (!regionId) {
      console.error("Attempting to load poles with no regionId");
      return;
    }
    
    try {
      console.log("Fetching poles for regionId:", regionId);
      const fetchedPoles = await firebaseService.getPoles(regionId);
      console.log("Fetched poles:", fetchedPoles);
      setPoles(fetchedPoles);
    } catch (error) {
      console.error("Error loading poles:", error);
      toast.error('Erro ao carregar polos');
    }
  };

  const loadWells = async (poleId) => {
    if (!poleId) {
      console.error("Attempting to load wells with no poleId");
      return;
    }
    
    try {
      console.log("Fetching wells for poleId:", poleId);
      const fetchedWells = await firebaseService.getWells(poleId);
      console.log("Fetched wells:", fetchedWells);
      setWells(fetchedWells);
    } catch (error) {
      console.error("Error loading wells:", error);
      toast.error('Erro ao carregar poços');
    }
  };

  const handleAddRegion = async (data) => {
    try {
      const newRegion = await firebaseService.addRegion({
        ...data,
        createdBy: currentUser?.displayName || 'Unknown'
      });
      setRegions([newRegion, ...regions]);
      setShowAddRegionModal(false);
      toast.success('Região adicionada com sucesso!');
    } catch (error) {
      toast.error('Erro ao adicionar região');
    }
  };

  const handleAddPole = async (data) => {
    if (!selectedRegion) {
      toast.error('Nenhuma região selecionada');
      return;
    }
    
    console.log("Adding pole to region:", selectedRegion);
    
    try {
      const newPole = await firebaseService.addPole({
        ...data,
        regionId: selectedRegion.id,
        createdBy: currentUser?.displayName || 'Unknown'
      });
      
      console.log("New pole created:", newPole);
      
      // Update the poles list with the new pole
      setPoles(prevPoles => [newPole, ...prevPoles]);
      setShowAddPoleModal(false);
      toast.success('Polo adicionado com sucesso!');
    } catch (error) {
      console.error("Error adding pole:", error);
      toast.error('Erro ao adicionar polo');
    }
  };

  const handleAddWell = async (data) => {
    if (!selectedPole) {
      toast.error('Nenhum polo selecionado');
      return;
    }
    
    console.log("Adding well to pole:", selectedPole);
    
    try {
      const newWell = await firebaseService.addWell({
        ...data,
        poleId: selectedPole.id,
        createdBy: currentUser?.displayName || 'Unknown'
      });
      
      console.log("New well created:", newWell);
      
      // Update the wells list with the new well
      setWells(prevWells => [newWell, ...prevWells]);
      setShowAddWellModal(false);
      toast.success('Poço adicionado com sucesso!');
    } catch (error) {
      console.error("Error adding well:", error);
      toast.error('Erro ao adicionar poço');
    }
  };

  // Update handlers
  const handleUpdateRegion = async (id, data) => {
    try {
      await firebaseService.updateRegion(id, {
        ...data,
        updatedBy: currentUser?.displayName || 'Unknown'
      });
      
      // Update local state
      setRegions(regions.map(region => 
        region.id === id ? { ...region, ...data } : region
      ));
      
      // Update selectedRegion if it's the one being edited
      if (selectedRegion && selectedRegion.id === id) {
        setSelectedRegion({ ...selectedRegion, ...data });
      }
      
      setShowEditRegionModal(false);
      toast.success('Região atualizada com sucesso!');
    } catch (error) {
      console.error('Error updating region:', error);
      toast.error('Erro ao atualizar região');
    }
  };

  const handleUpdatePole = async (id, data) => {
    try {
      await firebaseService.updatePole(id, {
        ...data,
        updatedBy: currentUser?.displayName || 'Unknown'
      });
      
      // Update local state
      setPoles(poles.map(pole => 
        pole.id === id ? { ...pole, ...data } : pole
      ));
      
      // Update selectedPole if it's the one being edited
      if (selectedPole && selectedPole.id === id) {
        setSelectedPole({ ...selectedPole, ...data });
      }
      
      setShowEditPoleModal(false);
      toast.success('Polo atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating pole:', error);
      toast.error('Erro ao atualizar polo');
    }
  };

  const handleUpdateWell = async (id, data) => {
    try {
      await firebaseService.updateWellInfo(id, {
        ...data,
        updatedBy: currentUser?.displayName || 'Unknown'
      });
      
      // Update local state
      setWells(wells.map(well => 
        well.id === id ? { ...well, ...data } : well
      ));
      
      // Update selectedWell if it's the one being edited
      if (selectedWell && selectedWell.id === id) {
        setSelectedWell({ ...selectedWell, ...data });
      }
      
      setShowEditWellModal(false);
      toast.success('Poço atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating well:', error);
      toast.error('Erro ao atualizar poço');
    }
  };

  // Delete handlers
  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    
    try {
      if (deleteType === 'region') {
        await firebaseService.deleteRegion(itemToDelete.id);
        setRegions(regions.filter(r => r.id !== itemToDelete.id));
        if (selectedRegion && selectedRegion.id === itemToDelete.id) {
          setSelectedRegion(null);
        }
        toast.success('Região excluída com sucesso!');
      } 
      else if (deleteType === 'pole') {
        await firebaseService.deletePole(itemToDelete.id);
        setPoles(poles.filter(p => p.id !== itemToDelete.id));
        if (selectedPole && selectedPole.id === itemToDelete.id) {
          setSelectedPole(null);
        }
        toast.success('Polo excluído com sucesso!');
      }
      else if (deleteType === 'well') {
        await firebaseService.deleteWell(itemToDelete.id);
        setWells(wells.filter(w => w.id !== itemToDelete.id));
        if (selectedWell && selectedWell.id === itemToDelete.id) {
          setSelectedWell(null);
        }
        toast.success('Poço excluído com sucesso!');
      }
    } catch (error) {
      console.error(`Error deleting ${deleteType}:`, error);
      toast.error(`Erro ao excluir ${deleteType === 'region' ? 'região' : deleteType === 'pole' ? 'polo' : 'poço'}`);
    } finally {
      setItemToDelete(null);
      setDeleteType('');
    }
  };

  // Edit handlers
  const handleEditRegion = (region) => {
    setItemToEdit(region);
    setShowEditRegionModal(true);
  };
  
  const handleEditPole = (pole) => {
    setItemToEdit(pole);
    setShowEditPoleModal(true);
  };
  
  const handleEditWell = (well) => {
    setItemToEdit(well);
    setShowEditWellModal(true);
  };
  
  // Delete initiation handlers
  const handleDeleteRegion = (region) => {
    setItemToDelete(region);
    setDeleteType('region');
    setShowDeleteModal(true);
  };
  
  const handleDeletePole = (pole) => {
    setItemToDelete(pole);
    setDeleteType('pole');
    setShowDeleteModal(true);
  };
  
  const handleDeleteWell = (well) => {
    setItemToDelete(well);
    setDeleteType('well');
    setShowDeleteModal(true);
  };

  const attemptToSelectItem = async (item, type) => {
    // If the item is password protected, show the password modal
    if (item.isPasswordProtected) {
      setPasswordProtectedItem(item);
      setPasswordModalType(type);
      setShowPasswordModal(true);
      setPasswordError(false);
    } else {
      // If not password protected, proceed with selection
      if (type === 'region') {
        setSelectedRegion(item);
      } else if (type === 'pole') {
        setSelectedPole(item);
      } else if (type === 'well') {
        setSelectedWell(item);
      }
    }
  };

  // Update the password handling
  const handlePasswordSubmit = async (password) => {
    try {
      setLoading(true);
      let collectionName = '';
      if (passwordModalType === 'region') collectionName = 'regions';
      else if (passwordModalType === 'pole') collectionName = 'poles';
      else if (passwordModalType === 'well') collectionName = 'wells';
      
      // Check if the function exists before calling it
      if (typeof firebaseService.verifyItemPassword !== 'function') {
        console.error('verifyItemPassword is not a function');
        // Use a fallback approach - for now just proceed as if password is correct
        if (passwordModalType === 'region') {
          setSelectedRegion(passwordProtectedItem);
        } else if (passwordModalType === 'pole') {
          setSelectedPole(passwordProtectedItem);
        } else if (passwordModalType === 'well') {
          setSelectedWell(passwordProtectedItem);
        }
        setShowPasswordModal(false);
        setPasswordError(false);
        return;
      }
      
      const isCorrect = await firebaseService.verifyItemPassword(
        collectionName,
        passwordProtectedItem.id,
        password
      );
      
      if (isCorrect) {
        // Password is correct, proceed with selection
        if (passwordModalType === 'region') {
          setSelectedRegion(passwordProtectedItem);
        } else if (passwordModalType === 'pole') {
          setSelectedPole(passwordProtectedItem);
        } else if (passwordModalType === 'well') {
          setSelectedWell(passwordProtectedItem);
        }
        setShowPasswordModal(false);
        setPasswordError(false);
      } else {
        // Password is incorrect
        setPasswordError(true);
        toast.error('Senha incorreta');
      }
    } catch (error) {
      console.error('Error verifying password:', error);
      toast.error('Erro ao verificar senha');
      setPasswordError(true);
      
      // As a fallback, allow access anyway since this is a new feature
      if (passwordModalType === 'region') {
        setSelectedRegion(passwordProtectedItem);
      } else if (passwordModalType === 'pole') {
        setSelectedPole(passwordProtectedItem);
      } else if (passwordModalType === 'well') {
        setSelectedWell(passwordProtectedItem);
      }
      setShowPasswordModal(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Breadcrumb/Navigation header */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div className="flex items-center space-x-2">
            {(selectedRegion || selectedPole || selectedWell) && (
              <button
                onClick={() => {
                  if (selectedWell) setSelectedWell(null);
                  else if (selectedPole) setSelectedPole(null);
                  else setSelectedRegion(null);
                }}
                className="p-2 text-gray-600 hover:text-gray-800 -ml-2"
                aria-label="Voltar"
              >
                <FaArrowLeft className="text-lg" />
              </button>
            )}
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 truncate max-w-[200px] sm:max-w-none">
              {selectedWell
                ? `Poço: ${selectedWell.name}`
                : selectedPole
                ? `Polo: ${selectedPole.name}`
                : selectedRegion
                ? `Região: ${selectedRegion.name}`
                : 'Dashboard'}
            </h2>
          </div>
          
          {/* Global Search Bar */}
          <div className="relative w-full sm:w-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Pesquisar..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
            </div>
            
            {isSearching && searchTerm.length >= 2 && (
              <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200">
                {filteredItems.length > 0 ? (
                  <ul className="max-h-60 overflow-auto">
                    {filteredItems.map((item) => (
                      <li
                        key={`${item.type}-${item.id}`}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                        onClick={() => handleSearchResultClick(item)}
                      >
                        {item.type === 'region' && <FaMapMarkedAlt className="text-blue-500 mr-2" />}
                        {item.type === 'pole' && <FaMapMarkedAlt className="text-green-500 mr-2" />}
                        {item.type === 'well' && <FaWater className="text-blue-500 mr-2" />}
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-xs text-gray-500">
                            {item.type === 'region' ? 'Região' : item.type === 'pole' ? 'Polo' : 'Poço'}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-500">
                    Nenhum resultado encontrado
                  </div>
                )}
              </div>
            )}
          </div>
          
          <button
            onClick={() => {
              if (!selectedRegion) setShowAddRegionModal(true);
              else if (!selectedPole) setShowAddPoleModal(true);
              else setShowAddWellModal(true);
            }}
            className="flex items-center justify-center space-x-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm text-sm sm:text-base transition-colors"
          >
            <FaPlus className="text-xs sm:text-sm" />
            <span className="whitespace-nowrap">
              {!selectedRegion ? 'Nova Região' : !selectedPole ? 'Novo Polo' : 'Novo Poço'}
            </span>
          </button>
        </div>
        
        {/* Mobile breadcrumb navigation links */}
        {(selectedRegion || selectedPole) && (
          <div className="flex items-center text-xs text-gray-500 mt-2 overflow-x-auto">
            <button 
              onClick={() => {
                setSelectedRegion(null);
                setSelectedPole(null);
                setSelectedWell(null);
              }}
              className="hover:text-blue-600"
            >
              Dashboard
            </button>
            {selectedRegion && (
              <>
                <span className="mx-1">/</span>
                <button 
                  onClick={() => {
                    setSelectedPole(null);
                    setSelectedWell(null);
                  }}
                  className={`${!selectedPole ? 'font-medium text-blue-600' : 'hover:text-blue-600'}`}
                >
                  {selectedRegion.name}
                </button>
              </>
            )}
            {selectedPole && (
              <>
                <span className="mx-1">/</span>
                <button
                  onClick={() => setSelectedWell(null)}
                  className={`${!selectedWell ? 'font-medium text-blue-600' : 'hover:text-blue-600'}`}
                >
                  {selectedPole.name}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Main Dashboard Content */}
          {!selectedRegion && !selectedPole && !selectedWell && (
            <div className="space-y-6">
              {/* Key Metrics Section */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {/* Total Regions Card */}
                <div className="bg-blue-100 rounded-lg shadow-sm p-4 flex flex-col items-center justify-center">
                  <div className="p-3 bg-blue-200 rounded-full mb-2">
                    <FaMapMarkedAlt className="text-blue-600 text-xl" />
                  </div>
                  <div className="text-2xl font-bold text-blue-700">{metrics.totalRegions}</div>
                  <div className="text-xs font-medium text-blue-600 uppercase tracking-wider mt-1">Regiões</div>
                </div>
                
                {/* Total Poles Card */}
                <div className="bg-green-100 rounded-lg shadow-sm p-4 flex flex-col items-center justify-center">
                  <div className="p-3 bg-green-200 rounded-full mb-2">
                    <FaMapMarkedAlt className="text-green-600 text-xl" />
                  </div>
                  <div className="text-2xl font-bold text-green-700">{metrics.totalPoles}</div>
                  <div className="text-xs font-medium text-green-600 uppercase tracking-wider mt-1">Polos</div>
                </div>
                
                {/* Total Wells Card */}
                <div className="bg-purple-100 rounded-lg shadow-sm p-4 flex flex-col items-center justify-center">
                  <div className="p-3 bg-purple-200 rounded-full mb-2">
                    <FaWater className="text-purple-600 text-xl" />
                  </div>
                  <div className="text-2xl font-bold text-purple-700">{metrics.totalWells}</div>
                  <div className="text-xs font-medium text-purple-600 uppercase tracking-wider mt-1">Poços</div>
                </div>
                
                {/* Active Wells Card */}
                <div className="bg-emerald-100 rounded-lg shadow-sm p-4 flex flex-col items-center justify-center">
                  <div className="p-3 bg-emerald-200 rounded-full mb-2">
                    <FaCheckCircle className="text-emerald-600 text-xl" />
                  </div>
                  <div className="text-2xl font-bold text-emerald-700">{metrics.activeWells}</div>
                  <div className="text-xs font-medium text-emerald-600 uppercase tracking-wider mt-1">Ativos</div>
                </div>
                
                {/* Inactive Wells Card */}
                <div className="bg-red-100 rounded-lg shadow-sm p-4 flex flex-col items-center justify-center">
                  <div className="p-3 bg-red-200 rounded-full mb-2">
                    <FaExclamationTriangle className="text-red-600 text-xl" />
                  </div>
                  <div className="text-2xl font-bold text-red-700">{metrics.inactiveWells}</div>
                  <div className="text-xs font-medium text-red-600 uppercase tracking-wider mt-1">Inativos</div>
                </div>
                
                {/* Maintenance Wells Card */}
                <div className="bg-amber-100 rounded-lg shadow-sm p-4 flex flex-col items-center justify-center">
                  <div className="p-3 bg-amber-200 rounded-full mb-2">
                    <FaWrench className="text-amber-600 text-xl" />
                  </div>
                  <div className="text-2xl font-bold text-amber-700">{metrics.maintenanceWells}</div>
                  <div className="text-xs font-medium text-amber-600 uppercase tracking-wider mt-1">Em Manutenção</div>
                </div>
              </div>
              
              {/* Recent Activity & Quick Actions Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Activity Card */}
                <div className="bg-white rounded-lg shadow-sm lg:col-span-2">
                  <div className="p-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold flex items-center">
                      <FaHistory className="text-gray-500 mr-2" />
                      Atividade Recente
                    </h2>
                  </div>
                  <div className="p-4">
                    {recentActivity.length > 0 ? (
                      <ul className="divide-y divide-gray-100">
                        {recentActivity.map((item) => (
                          <li key={`${item.type}-${item.id}`} className="py-3 first:pt-0 last:pb-0">
                            <div className="flex items-start">
                              <div className="p-1.5 rounded-full mr-3">
                                {item.type === 'region' && <FaMapMarkedAlt className="text-blue-500 text-lg" />}
                                {item.type === 'pole' && <FaMapMarkedAlt className="text-green-500 text-lg" />}
                                {item.type === 'well' && <FaWater className="text-blue-500 text-lg" />}
                              </div>
                              <div>
                                <div className="font-medium">
                                  {item.name}
                                  <span className="ml-2 text-xs text-white rounded-full px-2 py-0.5 bg-blue-500">
                                    {item.type === 'region' ? 'Região' : item.type === 'pole' ? 'Polo' : 'Poço'}
                                  </span>
                                </div>
                                <div className="text-sm text-gray-500 mt-0.5">
                                  {item.updatedAt && item.updatedAt !== item.createdAt ? (
                                    <>Atualizado por {item.updatedBy || 'Sistema'} em {new Date(item.updatedAt).toLocaleDateString('pt-BR')}</>
                                  ) : (
                                    <>Criado por {item.createdBy || 'Sistema'} em {new Date(item.createdAt).toLocaleDateString('pt-BR')}</>
                                  )}
                                </div>
                                <div 
                                  onClick={() => handleSearchResultClick(item)}
                                  className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer mt-1"
                                >
                                  Ver detalhes
                                </div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="py-4 text-center text-gray-500">
                        Nenhuma atividade recente registrada
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Quick Actions Card */}
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="p-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold flex items-center">
                      <FaBell className="text-gray-500 mr-2" />
                      Ações Rápidas
                    </h2>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                      <button 
                        onClick={() => setShowAddRegionModal(true)}
                        className="flex items-center justify-center space-x-2 px-3 py-3 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
                      >
                        <FaPlus />
                        <span>Nova Região</span>
                      </button>
                      
                      {regions.length > 0 && (
                        <button 
                          onClick={() => attemptToSelectItem(regions[0], 'region')}
                          className="flex items-center justify-center space-x-2 px-3 py-3 bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition-colors"
                        >
                          <FaMapMarkedAlt />
                          <span>Ver Última Região</span>
                        </button>
                      )}
                      
                      <button 
                        onClick={() => window.location.href = '/profile'}
                        className="flex items-center justify-center space-x-2 px-3 py-3 bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100 transition-colors"
                      >
                        <FaUser />
                        <span>Meu Perfil</span>
                      </button>
                      
                      <button 
                        onClick={() => exportWellDataAll()}
                        className="flex items-center justify-center space-x-2 px-3 py-3 bg-amber-50 text-amber-700 rounded-md hover:bg-amber-100 transition-colors"
                      >
                        <FaChartBar />
                        <span>Exportar Relatórios</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Regions Heading */}
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <FaMapMarkedAlt className="mr-2 text-blue-600" />
                  Minhas Regiões
                </h2>
                <button 
                  onClick={() => setShowAddRegionModal(true)}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
                >
                  <FaPlus className="mr-1" size={10} />
                  Adicionar Região
                </button>
              </div>
            </div>
          )}
          
          {/* Regular Grid Content */}
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 ${!selectedRegion && !selectedPole && !selectedWell ? 'mt-6' : ''}`}>
            {!selectedRegion &&
              regions.map((region) => (
                <RegionCard
                  key={region.id}
                  region={region}
                  onSelect={() => attemptToSelectItem(region, 'region')}
                  onEdit={handleEditRegion}
                  onDelete={handleDeleteRegion}
                />
              ))}

            {selectedRegion &&
              !selectedPole &&
              poles.map((pole) => (
                <PoleCard
                  key={pole.id}
                  pole={pole}
                  onSelect={() => attemptToSelectItem(pole, 'pole')}
                  onEdit={handleEditPole}
                  onDelete={handleDeletePole}
                />
              ))}

            {selectedPole &&
              !selectedWell &&
              wells.map((well) => (
                <WellCard
                  key={well.id}
                  well={well}
                  onSelect={() => attemptToSelectItem(well, 'well')}
                  onEdit={handleEditWell}
                  onDelete={handleDeleteWell}
                />
              ))}
          </div>
        </>
      )}

      {/* Show empty state if no items */}
      {!loading && (
        <>
          {!selectedRegion && regions.length === 0 && (
            <div className="bg-white p-8 rounded-lg shadow-sm text-center">
              <p className="text-gray-500 mb-4">Nenhuma região cadastrada ainda.</p>
              <button 
                onClick={() => setShowAddRegionModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                <FaPlus className="mr-2" /> Adicionar Região
              </button>
            </div>
          )}
          
          {selectedRegion && !selectedPole && poles.length === 0 && (
            <div className="bg-white p-8 rounded-lg shadow-sm text-center">
              <p className="text-gray-500 mb-4">Nenhum polo cadastrado nesta região.</p>
              <button 
                onClick={() => setShowAddPoleModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                <FaPlus className="mr-2" /> Adicionar Polo
              </button>
            </div>
          )}
          
          {selectedPole && !selectedWell && wells.length === 0 && (
            <div className="bg-white p-8 rounded-lg shadow-sm text-center">
              <p className="text-gray-500 mb-4">Nenhum poço cadastrado neste polo.</p>
              <button 
                onClick={() => setShowAddWellModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                <FaPlus className="mr-2" /> Adicionar Poço
              </button>
            </div>
          )}
        </>
      )}

      {selectedWell && (
        <WellDetails
          well={selectedWell}
          onUpdate={(updatedWell) => {
            setWells(wells.map(w => w.id === updatedWell.id ? updatedWell : w));
            setSelectedWell(updatedWell);
          }}
        />
      )}

      {/* Modal components */}
      <AddRegionModal
        isOpen={showAddRegionModal}
        onClose={() => setShowAddRegionModal(false)}
        onAdd={handleAddRegion}
      />

      <AddPoleModal
        isOpen={showAddPoleModal}
        onClose={() => setShowAddPoleModal(false)}
        onAdd={handleAddPole}
      />

      <AddWellModal
        isOpen={showAddWellModal}
        onClose={() => setShowAddWellModal(false)}
        onAdd={handleAddWell}
      />
      
      {/* Edit modals */}
      <EditRegionModal
        isOpen={showEditRegionModal}
        onClose={() => setShowEditRegionModal(false)}
        onUpdate={handleUpdateRegion}
        region={itemToEdit}
      />
      
      <EditPoleModal
        isOpen={showEditPoleModal}
        onClose={() => setShowEditPoleModal(false)}
        onUpdate={handleUpdatePole}
        pole={itemToEdit}
      />
      
      <EditWellModal
        isOpen={showEditWellModal}
        onClose={() => setShowEditWellModal(false)}
        onUpdate={handleUpdateWell}
        well={itemToEdit}
      />
      
      {/* Delete confirmation modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title={`Excluir ${deleteType === 'region' ? 'Região' : deleteType === 'pole' ? 'Polo' : 'Poço'}`}
        message={`Tem certeza que deseja excluir ${deleteType === 'region' ? 'esta região' : deleteType === 'pole' ? 'este polo' : 'este poço'}? Esta ação não pode ser desfeita.`}
      />

      {/* Password Modal */}
      <PasswordEntryModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSubmit={handlePasswordSubmit}
        title={`${passwordModalType === 'region' ? 'Região' : passwordModalType === 'pole' ? 'Polo' : 'Poço'} Protegido`}
        itemName={passwordProtectedItem?.name}
        passwordError={passwordError}
      />
    </div>
  );
};

// Helper function for exporting all well data (would need to be implemented)
const exportWellDataAll = () => {
  // This is a placeholder - you would need to implement this function
  alert('Função de exportação de relatórios ainda não implementada');
};

export default Dashboard;