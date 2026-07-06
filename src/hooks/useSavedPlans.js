import { useEffect, useState } from 'react';
import { addDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { db, plansCollection } from '../lib/firebase';

export function useSavedPlans() {
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(plansCollection, (snapshot) => {
      const rows = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
      rows.sort((a, b) => b.savedAt - a.savedAt);
      setPlans(rows);
    });
    return unsubscribe;
  }, []);

  const savePlan = (name, planData) => addDoc(plansCollection, { name, savedAt: Date.now(), ...planData });
  const deletePlan = (id) => deleteDoc(doc(db, 'plans', id));

  return { plans, savePlan, deletePlan };
}
