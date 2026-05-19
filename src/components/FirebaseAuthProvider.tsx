import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, profile: null, loading: true });

export const FirebaseAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubProfile: (() => void) | undefined;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      
      if (user) {
        // Listen to Firestore profile
        unsubProfile = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setProfile(data);

            // Auto-grant admin and initial coins to specific user if not already set
            if (user.email === 'dweminem@gmail.com' || user.email === 'contato.packzinhu@gmail.com') {
              const updates: any = {};
              if (data.role !== 'admin') updates.role = 'admin';
              if (data.hotCoins === undefined) updates.hotCoins = 2000;

              if (Object.keys(updates).length > 0) {
                updateDoc(doc(db, 'users', user.uid), updates)
                  .catch(err => console.error("Error auto-updating admin profile:", err));
              }
            }
          } else {
            setProfile(null);
          }
          setLoading(false);
        });
      } else {
        setProfile(null);
        if (unsubProfile) unsubProfile();
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    // Heartbeat online monitoring removed permanently to save quota
    return () => {};
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
