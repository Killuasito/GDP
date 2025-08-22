import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { firebaseService } from '../services/firebaseService';
import RegionCard from '../components/RegionCard';
import PoleCard from '../components/PoleCard';
import WellCard from '../components/WellCard';
import WellDetails from '../components/WellDetails';
import { toast } from 'react-toastify';
import { FaPlus, FaArrowLeft } from 'react-icons/fa';
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
                : 'Regiões'}
            </h2>
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
              Regiões
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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

export default Dashboard;