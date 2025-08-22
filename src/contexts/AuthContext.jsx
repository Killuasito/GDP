import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../config/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase'; // Import the Firestore database

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  // Effect to listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // Store the actual Firebase Auth user object
      setCurrentUser(user);
      
      if (user) {
        try {
          // Fetch additional user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserDetails(userDoc.data());
          } else {
            setUserDetails({
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || 'User',
              role: 'user'
            });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUserDetails({
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || 'User',
            role: 'user'
          });
        }
      } else {
        setUserDetails(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  // Update the register function to accept phone and CPF
  const register = async (email, password, displayName, phone, cpf) => {
    // Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update profile with displayName
    await updateProfile(user, { displayName });
    
    // Store additional user data in Firestore
    const userData = {
      uid: user.uid,
      email,
      displayName,
      phone,
      cpf,
      createdAt: new Date().toISOString(),
      role: 'user'
    };
    
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, userData);
    
    setUserDetails(userData);
    
    return user;
  };

  const logout = () => signOut(auth);

  // Function to refresh user data
  const refreshUser = async () => {
    if (currentUser) {
      try {
        // Fetch the latest user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setUserDetails(userDoc.data());
        }
      } catch (error) {
        console.error("Error refreshing user data:", error);
      }
    }
  };

  const value = {
    currentUser, // Actual Firebase Auth user
    userDetails, // Additional user details from Firestore
    login,
    register,
    logout,
    loading,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};