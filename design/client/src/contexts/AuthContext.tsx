import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  User as FirebaseUser,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile as firebaseUpdateProfile,
  deleteUser as firebaseDeleteUser,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export interface UserProfile {
  uid: string;
  email: string | null;
  username: string | null;
  displayName: string | null;
  phoneNumber: string | null;
  location: string | null;
  address: string | null;
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  signUpWithEmail: (options: {
    email: string;
    password: string;
    username: string;
    displayName?: string;
    phoneNumber?: string;
    location?: string;
    address?: string;
  }) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  updateProfile: (updates: Partial<Omit<UserProfile, "uid">>) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchOrCreateUserProfile(user: FirebaseUser): Promise<UserProfile> {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const data = snap.data() as any;
    return {
      uid: user.uid,
      email: user.email,
      username: data.username ?? null,
      displayName: data.displayName ?? user.displayName ?? null,
      phoneNumber: data.phoneNumber ?? user.phoneNumber ?? null,
      location: data.location ?? null,
      address: data.address ?? null,
    };
  }

  const initial: UserProfile = {
    uid: user.uid,
    email: user.email,
    username: null,
    displayName: user.displayName ?? null,
    phoneNumber: user.phoneNumber ?? null,
    location: null,
    address: null,
  };

  await setDoc(ref, {
    ...initial,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return initial;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        const userProfile = await fetchOrCreateUserProfile(firebaseUser);
        setProfile(userProfile);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  const signUpWithEmail: AuthContextType["signUpWithEmail"] = async ({
    email,
    password,
    username,
    displayName,
    phoneNumber,
    location,
    address,
  }) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
      await firebaseUpdateProfile(cred.user, { displayName });
    }

    const userDocRef = doc(db, "users", cred.user.uid);
    const profileData = {
      uid: cred.user.uid,
      email: cred.user.email,
      username,
      displayName: displayName ?? cred.user.displayName ?? null,
      phoneNumber: phoneNumber ?? cred.user.phoneNumber ?? null,
      location: location ?? null,
      address: address ?? null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(userDocRef, profileData);
    setProfile({
      uid: profileData.uid,
      email: profileData.email,
      username: profileData.username,
      displayName: profileData.displayName,
      phoneNumber: profileData.phoneNumber,
      location: profileData.location,
      address: profileData.address,
    });
    setUser(cred.user);
  };

  const signInWithEmail: AuthContextType["signInWithEmail"] = async (
    email,
    password,
  ) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle: AuthContextType["signInWithGoogle"] = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const updateProfileFn: AuthContextType["updateProfile"] = async (updates) => {
    if (!user) return;
    const ref = doc(db, "users", user.uid);
    const payload: any = {
      updatedAt: serverTimestamp(),
    };
    if (typeof updates.username !== "undefined") payload.username = updates.username;
    if (typeof updates.displayName !== "undefined")
      payload.displayName = updates.displayName;
    if (typeof updates.phoneNumber !== "undefined")
      payload.phoneNumber = updates.phoneNumber;
    if (typeof updates.location !== "undefined") payload.location = updates.location;
    if (typeof updates.address !== "undefined") payload.address = updates.address;

    await updateDoc(ref, payload);

    if (updates.displayName && user) {
      await firebaseUpdateProfile(user, { displayName: updates.displayName });
    }

    setProfile((prev) =>
      prev
        ? {
            ...prev,
            ...updates,
          }
        : prev,
    );
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setProfile(null);
  };

  const deleteAccount = async () => {
    if (!user) return;
    await firebaseDeleteUser(user);
    setUser(null);
    setProfile(null);
  };

  const value: AuthContextType = {
    user,
    profile,
    loading,
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    updateProfile: updateProfileFn,
    signOut,
    deleteAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

