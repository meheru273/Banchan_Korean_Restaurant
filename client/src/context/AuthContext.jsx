import { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  signOut,
} from 'firebase/auth';
import { auth } from '../firebase';

const googleProvider = new GoogleAuthProvider();
import api from '../api/axios';

const Ctx = createContext(null);

// Raised by login() when the Firebase account exists but the email isn't verified yet.
export class EmailNotVerifiedError extends Error {
  constructor() {
    super('Please verify your email address before logging in.');
    this.code = 'EMAIL_NOT_VERIFIED';
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On load, restore our session from the stored JWT (set after a verified Firebase login).
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return setLoading(false);
    api.get('/auth/profile')
      .then(({ data }) => setUser(data.data))
      .catch(() => localStorage.removeItem('accessToken'))
      .finally(() => setLoading(false));
  }, []);

  /**
   * Register via Firebase: create the account, set the display name, and send a
   * verification email. We deliberately sign the user out and do NOT log them in
   * — they must verify their email first.
   */
  const register = async ({ name, email, password }) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (name) {
      try { await updateProfile(cred.user, { displayName: name }); } catch { /* non-fatal */ }
    }
    await sendEmailVerification(cred.user);
    await signOut(auth);
  };

  /**
   * Login via Firebase. Blocks unverified accounts. On success, exchanges the
   * verified Firebase ID token for our own JWT through the backend.
   */
  const login = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    await cred.user.reload();
    if (!cred.user.emailVerified) {
      await signOut(auth);
      throw new EmailNotVerifiedError();
    }
    const idToken = await cred.user.getIdToken();
    const { data } = await api.post('/auth/firebase', { idToken });
    localStorage.setItem('accessToken', data.data.accessToken);
    setUser(data.data.user);
    // We have our own JWT now; no need to keep the Firebase session around.
    await signOut(auth);
    return data.data.user;
  };

  /**
   * Sign in with Google. Google accounts are already verified, so there's no
   * email-verification step — straight to exchanging the token for our JWT.
   */
  const loginWithGoogle = async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    const idToken = await cred.user.getIdToken();
    const { data } = await api.post('/auth/firebase', { idToken });
    localStorage.setItem('accessToken', data.data.accessToken);
    setUser(data.data.user);
    await signOut(auth);
    return data.data.user;
  };

  /**
   * Re-send the verification email for an account that signed in but isn't verified.
   */
  const resendVerification = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(cred.user);
    await signOut(auth);
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
    try { await signOut(auth); } catch { /* ignore */ }
    localStorage.removeItem('accessToken');
    setUser(null);
  };

  return (
    <Ctx.Provider value={{ user, loading, login, loginWithGoogle, register, resendVerification, logout }}>
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => useContext(Ctx);
