import { signInAnonymously, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

import { auth, db } from '../firebase/config.js';

export async function ensureAnonymousUser() {
  if (auth.currentUser) {
    return auth.currentUser;
  }

  const result = await signInAnonymously(auth);
  return result.user;
}

export async function signInAdmin(email, password) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function isAdminUid(uid) {
  if (!uid) {
    return false;
  }

  const docRef = doc(db, 'admins', uid);
  const snapshot = await getDoc(docRef);
  return snapshot.exists();
}

export function watchAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function logoutUser() {
  await signOut(auth);
}
