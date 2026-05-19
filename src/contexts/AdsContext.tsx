import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { CustomAd } from '../components/AdsAdmin';

type AdsContextType = {
  ads: CustomAd[];
  loading: boolean;
};

export const AdsContext = createContext<AdsContextType>({ ads: [], loading: true });

export const AdsProvider = ({ children }: { children: React.ReactNode }) => {
  const [ads, setAds] = useState<CustomAd[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: () => void;

    // Safe fetch in case of missing index or permissions
    const fetchAds = async () => {
      try {
        const q = query(collection(db, 'customAds'), where('status', '==', 'active'));
        
        // Use onSnapshot to get real-time updates
        unsubscribe = onSnapshot(q, (snapshot) => {
          const adsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as CustomAd));
          setAds(adsData);
          setLoading(false);
        }, (err) => {
          console.warn("Snapshot error (permission or index). Falling back if needed.", err);
          setLoading(false);
        });

      } catch (err) {
        console.error("Error setting up ads snapshot:", err);
        setLoading(false);
      }
    };

    fetchAds();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  return (
    <AdsContext.Provider value={{ ads, loading }}>
      {children}
    </AdsContext.Provider>
  );
};

export const useAds = () => useContext(AdsContext);
