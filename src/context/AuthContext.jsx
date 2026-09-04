import { createContext, useEffect, useState } from "react";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../firebase/firebase";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null);

const googleProvider = new GoogleAuthProvider();

async function createOrUpdateUserProfile(user) {
  const userRef = doc(db, "users", user.uid);
  const snap    = await getDoc(userRef);

  if (!snap.exists()) {
    await setDoc(userRef, {
      uid:         user.uid,
      email:       user.email,
      displayName: user.displayName ?? user.email.split("@")[0],
      photoURL:    user.photoURL    ?? null,
      role:        "customer",
      createdAt:   serverTimestamp(),
    });
  } else {
    await setDoc(userRef, {
      email:       user.email,
      displayName: user.displayName ?? snap.data().displayName,
      photoURL:    user.photoURL    ?? snap.data().photoURL,
      lastLoginAt: serverTimestamp(),
    }, { merge: true });
  }
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await createOrUpdateUserProfile(user);
        const snap = await getDoc(doc(db, "users", user.uid));
        setUserProfile(snap.data() ?? null);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const loginWithEmail = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  const loginWithGoogle = () => signInWithPopup(auth, googleProvider);

  const logout = () => signOut(auth);

  const isAdmin = userProfile?.role === "admin";

  const value = {
    currentUser, userProfile, isAdmin, loading,
    loginWithEmail, loginWithGoogle, logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
