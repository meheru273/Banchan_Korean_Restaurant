import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import GoogleButton from '../components/GoogleButton';

const firebaseError = (err) => {
  switch (err?.code) {
    case 'EMAIL_NOT_VERIFIED': return 'Please verify your email before logging in.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found': return 'Invalid email or password.';
    case 'auth/invalid-email': return 'That email address is not valid.';
    case 'auth/too-many-requests': return 'Too many attempts. Try again later.';
    default: return err?.response?.data?.error || err?.message || 'Login failed';
  }
};

export default function Login() {
  const { login, resendVerification } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [needsVerify, setNeedsVerify] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setNeedsVerify(false);
    try {
      const user = await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate(user.role === 'admin' ? '/admin' : '/menu');
    } catch (err) {
      if (err?.code === 'EMAIL_NOT_VERIFIED') setNeedsVerify(true);
      toast.error(firebaseError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const resend = async () => {
    try {
      await resendVerification(form.email, form.password);
      toast.success('Verification email re-sent.');
    } catch (err) {
      toast.error(firebaseError(err));
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold text-[#1C1613] mb-4">Login</h1>
      <form onSubmit={submit} className="space-y-3">
        <input type="email" required placeholder="Email" className="w-full border rounded px-3 py-2"
          value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input type="password" required placeholder="Password" className="w-full border rounded px-3 py-2"
          value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button disabled={submitting} className="w-full bg-[#DC2113] text-white py-2 rounded disabled:opacity-50">
          {submitting ? 'Logging in…' : 'Login'}
        </button>
      </form>

      <div className="flex items-center gap-3 my-4">
        <div className="h-px bg-gray-200 flex-1" />
        <span className="text-xs text-gray-400">OR</span>
        <div className="h-px bg-gray-200 flex-1" />
      </div>
      <GoogleButton onSuccess={(user) => { toast.success('Welcome!'); navigate(user.role === 'admin' ? '/admin' : '/menu'); }} />

      {needsVerify && (
        <div className="mt-3 text-sm bg-yellow-50 border border-yellow-200 rounded p-3">
          Your email isn&apos;t verified yet.{' '}
          <button onClick={resend} className="text-[#DC2113] font-medium underline">Resend verification email</button>
        </div>
      )}

      <p className="text-sm text-gray-500 mt-3">
        No account? <Link to="/register" className="text-[#DC2113]">Register</Link>
      </p>
    </div>
  );
}
