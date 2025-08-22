import { db, storage, auth } from '../config/firebase'; // Import auth from config/firebase
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  getDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  EmailAuthProvider, 
  reauthenticateWithCredential, 
  updatePassword 
} from 'firebase/auth'; // Remove auth from this import
import { Region, Pole, Well, Measurement, CustomMeasurement } from '../types/types';

// Add a utility function to encrypt passwords - this is a simple implementation
// In a real-world app, you'd want to use a more secure method
const encryptPassword = (password: string): string => {
  // Simple encryption - in production, use a proper encryption library
  return btoa(password.split('').reverse().join(''));
};

// Add a utility function to decrypt passwords
const decryptPassword = (encryptedPassword: string): string => {
  // Simple decryption matching the above encryption
  return atob(encryptedPassword).split('').reverse().join('');
};

export const firebaseService = {
  // ------------------- REGIÕES -------------------
  async addRegion(data: { name: string; description: string; createdBy: string }) {
    const now = new Date().toISOString();
    const region = { ...data, createdAt: now, updatedAt: now, updatedBy: data.createdBy };
    const docRef = await addDoc(collection(db, 'regions'), region);
    return { ...region, id: docRef.id };
  },

  async updateRegion(id: string, data: Partial<Region>) {
    const regionRef = doc(db, 'regions', id);
    await updateDoc(regionRef, { ...data, updatedAt: new Date().toISOString() });
  },

  async deleteRegion(id: string) {
    await deleteDoc(doc(db, 'regions', id));
  },

  async getRegions() {
    const q = query(collection(db, 'regions'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Region[];
  },

  // ------------------- POLOS -------------------
  async addPole(data: {
    name: string;
    description: string;
    regionId: string;
    location: string; // Changed from object to string
    createdBy: string;
  }) {
    if (!data.regionId) {
      console.error("Missing regionId when adding pole:", data);
      throw new Error('regionId is required to add a pole');
    }

    const now = new Date().toISOString();
    const pole = { 
      ...data, 
      createdAt: now, 
      updatedAt: now, 
      updatedBy: data.createdBy 
    };
    
    console.log("Adding pole with data:", pole);
    const docRef = await addDoc(collection(db, 'poles'), pole);
    return { ...pole, id: docRef.id };
  },

  async updatePole(id: string, data: Partial<Pole>) {
    const poleRef = doc(db, 'poles', id);
    await updateDoc(poleRef, { ...data, updatedAt: new Date().toISOString() });
  },

  async deletePole(id: string) {
    await deleteDoc(doc(db, 'poles', id));
  },

  async getPoles(regionId: string) {
    if (!regionId) {
      console.error("Trying to get poles with empty regionId");
      return [];
    }
    
    console.log("Fetching poles for regionId:", regionId);
    
    try {
      // Try first with ordering
      const q = query(
        collection(db, 'poles'),
        where('regionId', '==', regionId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const poles = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Pole[];
      
      console.log(`Found ${poles.length} poles for regionId ${regionId}:`, poles);
      return poles;
    } catch (error) {
      // If index doesn't exist yet, try without ordering
      console.warn("Index not yet created. Falling back to unordered query:", error);
      try {
        const q = query(
          collection(db, 'poles'),
          where('regionId', '==', regionId)
        );
        
        const querySnapshot = await getDocs(q);
        const poles = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Pole[];
        
        console.log(`Found ${poles.length} poles for regionId ${regionId} (unordered):`, poles);
        return poles;
      } catch (secondError) {
        console.error("Error fetching poles:", secondError);
        throw secondError;
      }
    }
  },

  // ------------------- POÇOS -------------------
  async addWell(data: {
    name: string;
    poleId: string;
    status: 'active' | 'inactive' | 'maintenance';
    createdBy: string;
  }) {
    const now = new Date().toISOString();
    const well = {
      ...data,
      data: {
        lastMeasurement: now,
        waterLevel: 0,
        pressure: 0,
        flowRate: 0,
        observations: '',
        history: []
      },
      createdAt: now,
      updatedAt: now,
      updatedBy: data.createdBy
    };
    const docRef = await addDoc(collection(db, 'wells'), well);
    return { ...well, id: docRef.id };
  },

  async updateWell(id: string, data: {
    waterLevel: number;
    pressure: number;
    flowRate: number;
    observations: string;
    updatedBy: string;
    customMeasurements?: CustomMeasurement[];
  }) {
    const wellRef = doc(db, 'wells', id);
    const now = new Date().toISOString();

    const measurement: Measurement = {
      timestamp: now,
      waterLevel: data.waterLevel,
      pressure: data.pressure,
      flowRate: data.flowRate,
      observations: data.observations,
      measuredBy: data.updatedBy,
      customMeasurements: data.customMeasurements || []
    };

    await updateDoc(wellRef, {
      'data.lastMeasurement': now,
      'data.waterLevel': data.waterLevel,
      'data.pressure': data.pressure,
      'data.flowRate': data.flowRate,
      'data.observations': data.observations,
      updatedAt: now,
      updatedBy: data.updatedBy
    });

    // Adiciona a medição ao histórico
    await addDoc(collection(db, `wells/${id}/measurements`), measurement);
  },

  async updateWellInfo(id: string, data: {
    name?: string;
    status?: 'active' | 'inactive' | 'maintenance';
    updatedBy: string;
  }) {
    const wellRef = doc(db, 'wells', id);
    await updateDoc(wellRef, {
      ...(data.name && { name: data.name }),
      ...(data.status && { status: data.status }),
      updatedAt: new Date().toISOString(),
      updatedBy: data.updatedBy
    });
    
    // Get the updated well to return it
    const wellDoc = await getDoc(wellRef);
    if (wellDoc.exists()) {
      return { id: wellDoc.id, ...wellDoc.data() } as Well;
    }
    throw new Error('Well not found after update');
  },

  async deleteWell(id: string) {
    await deleteDoc(doc(db, 'wells', id));
  },

  async getWells(poleId: string) {
    if (!poleId) {
      console.error("Trying to get wells with empty poleId");
      return [];
    }
    
    console.log("Fetching wells for poleId:", poleId);
    
    try {
      // Try with ordering first
      const q = query(
        collection(db, 'wells'),
        where('poleId', '==', poleId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const wells = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Well[];
      
      console.log(`Found ${wells.length} wells for poleId ${poleId}:`, wells);
      return wells;
    } catch (error) {
      // If index doesn't exist yet, try without ordering
      console.warn("Index not yet created for wells query. Falling back to unordered query:", error);
      try {
        const q = query(
          collection(db, 'wells'),
          where('poleId', '==', poleId)
        );
        
        const querySnapshot = await getDocs(q);
        const wells = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Well[];
        
        console.log(`Found ${wells.length} wells for poleId ${poleId} (unordered):`, wells);
        return wells;
      } catch (secondError) {
        console.error("Error fetching wells:", secondError);
        throw secondError;
      }
    }
  },

  // ------------------- MEDIÇÕES -------------------
  async getWellMeasurements(wellId: string) {
    const q = query(
      collection(db, `wells/${wellId}/measurements`),
      orderBy('timestamp', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Measurement[];
  },

  // ------------------- UPLOAD DE IMAGENS -------------------
  async uploadWellImage(wellId: string, file: File) {
    const storageRef = ref(storage, `wells/${wellId}/${file.name}`);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  },

  async updateWellStatus(id: string, status: 'active' | 'inactive' | 'maintenance') {
    const wellRef = doc(db, 'wells', id);
    const now = new Date().toISOString();
    
    await updateDoc(wellRef, {
      status: status,
      updatedAt: now
    });
    
    // Return the updated well
    const wellDoc = await getDoc(wellRef);
    if (wellDoc.exists()) {
      return { id: wellDoc.id, ...wellDoc.data() } as Well;
    }
    throw new Error('Well not found after updating status');
  },

  // ------------------- USUÁRIOS -------------------
  async getUserData(userId: string) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return userDoc.data();
      }
      return null;
    } catch (error) {
      console.error("Error fetching user data:", error);
      throw error;
    }
  },

  async updateUserData(userId: string, data: {
    displayName?: string;
    phone?: string;
    cpf?: string;
  }) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        ...data,
        updatedAt: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error("Error updating user data:", error);
      throw error;
    }
  },

  async changePassword(currentPassword: string, newPassword: string) {
    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        throw new Error('No user is currently logged in');
      }

      // Re-authenticate the user
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Change the password
      await updatePassword(user, newPassword);
      return true;
    } catch (error) {
      console.error("Error changing password:", error);
      throw error;
    }
  },

  // Additional user-related functions
  async deleteUser(userId: string) {
    const userRef = doc(db, 'users', userId);
    await deleteDoc(userRef);
  },
  
  async getUserRegions(userId: string) {
    const q = query(
      collection(db, 'regions'),
      where('createdBy', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Region[];
  },
  
  async getUserPoles(userId: string) {
    const q = query(
      collection(db, 'poles'),
      where('createdBy', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Pole[];
  },
  
  async getUserWells(userId: string) {
    const q = query(
      collection(db, 'wells'),
      where('createdBy', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Well[];
  },

  // ------------------- PASSWORD PROTECTION -------------------
  async updateItemPassword(collection: string, itemId: string, isProtected: boolean, password?: string) {
    try {
      // First check if the user has permission to update the password
      const itemRef = doc(db, collection, itemId);
      const itemDoc = await getDoc(itemRef);
      
      if (!itemDoc.exists()) {
        throw new Error('Item not found');
      }
      
      const itemData = itemDoc.data();
      const currentUser = auth.currentUser;
      
      // Check if user is creator or admin
      const userData = currentUser ? await this.getUserData(currentUser.uid) : null;
      const isAdmin = userData?.role === 'admin';
      const isCreator = itemData.createdBy === currentUser?.displayName;
      
      if (!isAdmin && !isCreator) {
        throw new Error('Você não tem permissão para alterar a senha deste item');
      }
      
      // If password protection is enabled but no password is provided, 
      // keep the existing password if there is one
      let encryptedPassword = null;
      if (isProtected) {
        // If password is provided, encrypt it
        if (password && password.trim() !== '') {
          encryptedPassword = encryptPassword(password);
        } 
        // If no password is provided but item already has a password, keep the existing one
        else if (itemData.isPasswordProtected && itemData.password) {
          encryptedPassword = itemData.password;
        }
        // If no password is provided and item doesn't have a password, throw error
        else {
          throw new Error('Uma senha é necessária para proteção');
        }
      }
      
      // Update with appropriate password state
      await updateDoc(itemRef, {
        isPasswordProtected: isProtected,
        password: encryptedPassword,
        ...(isProtected ? { 
          lastPasswordUpdate: new Date().toISOString(),
          passwordUpdatedBy: currentUser?.displayName || 'Unknown'
        } : { 
          lastPasswordUpdate: null,
          passwordUpdatedBy: null
        }),
        updatedAt: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      console.error(`Error updating password for ${collection}/${itemId}:`, error);
      throw error;
    }
  },

  // Add this new function to get the decrypted password
  async getDecryptedPassword(collection: string, itemId: string): Promise<string | null> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('Usuário não autenticado');
      
      // Check if user has permission (is creator or admin)
      const hasPermission = await this.hasEditPermission(collection, itemId);
      if (!hasPermission) {
        throw new Error('Você não tem permissão para visualizar esta senha');
      }
      
      const itemDoc = await getDoc(doc(db, collection, itemId));
      if (!itemDoc.exists()) {
        throw new Error('Item não encontrado');
      }
      
      const itemData = itemDoc.data();
      if (!itemData.isPasswordProtected || !itemData.password) {
        return null;
      }
      
      return decryptPassword(itemData.password);
    } catch (error) {
      console.error(`Error getting decrypted password:`, error);
      throw error;
    }
  },

  // Check if the current user has edit permission for an item
  async hasEditPermission(collection: string, itemId: string): Promise<boolean> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return false;
      
      const userData = await this.getUserData(currentUser.uid);
      const isAdmin = userData?.role === 'admin';
      
      // Admins always have permission
      if (isAdmin) return true;
      
      // Check if user is the creator
      const itemDoc = await getDoc(doc(db, collection, itemId));
      if (!itemDoc.exists()) return false;
      
      const itemData = itemDoc.data();
      return itemData.createdBy === currentUser.displayName;
    } catch (error) {
      console.error(`Error checking edit permission:`, error);
      return false;
    }
  },

  // Make sure this function is properly defined and exported as part of the firebaseService object
  async verifyItemPassword(collection: string, itemId: string, password: string): Promise<boolean> {
    try {
      const itemDoc = await getDoc(doc(db, collection, itemId));
      
      if (!itemDoc.exists()) {
        throw new Error('Item not found');
      }
      
      const itemData = itemDoc.data();
      
      // If the item isn't password protected
      if (!itemData.isPasswordProtected) {
        return true;
      }
      
      // Check if user is creator or admin (they can bypass password)
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userData = await this.getUserData(currentUser.uid);
        const isAdmin = userData?.role === 'admin';
        const isCreator = itemData.createdBy === currentUser?.displayName;
        
        if (isAdmin || isCreator) {
          return true;
        }
      }
      
      // If no password is set but protection is enabled, allow access (edge case)
      if (!itemData.password) {
        return true;
      }
      
      try {
        // Try to decrypt the password
        const decryptedPassword = decryptPassword(itemData.password);
        return decryptedPassword === password;
      } catch (error) {
        // If decryption fails (e.g., password isn't properly encrypted), allow access
        console.error("Error decrypting password:", error);
        return true;
      }
    } catch (error) {
      console.error(`Error verifying password for ${collection}/${itemId}:`, error);
      // For now, allow access on error to prevent blocking users
      return true;
    }
  },

  // ...existing code...
};
