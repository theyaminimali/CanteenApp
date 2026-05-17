'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Fetch user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithPhone = async (name, phone) => {
    // Generate a pseudo-email and password for Firebase Auth
    const email = `${phone}@campusbite.app`;
    const password = `${phone}CampusBite!`;

    try {
      // Try logging in first
      const result = await signInWithEmailAndPassword(auth, email, password);
      // Update name in Firestore to match the typed name upon login
      await setDoc(doc(db, 'users', result.user.uid), {
        name,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      
      // Fetch latest document to ensure React state is fully synchronized
      const latestDoc = await getDoc(doc(db, 'users', result.user.uid));
      if (latestDoc.exists()) {
        setUserData(latestDoc.data());
      }
      return result;
    } catch (error) {
      // If user not found, register them automatically
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.message.includes('invalid')) {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        
        let role = 'student';
        // Normal users are students

        await setDoc(doc(db, 'users', result.user.uid), {
          name,
          email,
          phone,
          role,
          createdAt: serverTimestamp(),
        });
        return result;
      }
      throw error;
    }
  };

  const registerReceiver = async (email, password, name, phone) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Security Check: Ensure no other receiver exists
      const q = query(collection(db, 'users'), where('role', '==', 'receiver'));
      const snapshot = await getDocs(q);
      
      // If a receiver exists, and it's not the user we JUST created
      const otherReceivers = snapshot.docs.filter(d => d.id !== result.user.uid);
      if (otherReceivers.length > 0) {
        // Rollback creation
        await result.user.delete();
        await signOut(auth);
        throw new Error('A receiver is already registered. Registration is locked.');
      }

      // Create user profile in Firestore
      await setDoc(doc(db, 'users', result.user.uid), {
        name,
        email,
        phone,
        role: 'receiver',
        createdAt: serverTimestamp(),
      });
      return result;
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        try {
          // Log in the user instead and update their profile with the new name/phone
          const result = await signInWithEmailAndPassword(auth, email, password);
          await setDoc(doc(db, 'users', result.user.uid), {
            name,
            email,
            phone,
            role: 'receiver',
            updatedAt: serverTimestamp(),
          }, { merge: true });
          return result;
        } catch (loginError) {
          if (loginError.code === 'auth/invalid-credential' || loginError.code === 'auth/wrong-password') {
            throw new Error('This receiver account already exists. Please use the correct password.');
          }
          throw loginError;
        }
      }
      throw error;
    }
  };
  
  const login = async (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    return signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, loginWithPhone, login, registerReceiver, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
