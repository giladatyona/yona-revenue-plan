import { useEffect, useState } from 'react';
import { addDoc, deleteDoc, doc, onSnapshot, updateDoc } from 'firebase/firestore';
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
  const renamePlan = (id, name) => updateDoc(doc(db, 'plans', id), { name });
  const overwritePlan = (id, planData) => updateDoc(doc(db, 'plans', id), { savedAt: Date.now(), ...planData });

  return { plans, savePlan, deletePlan, renamePlan, overwritePlan };
}
