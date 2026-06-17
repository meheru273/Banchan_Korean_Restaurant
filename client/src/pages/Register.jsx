import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import GoogleButton from '../components/GoogleButton';

// Map Firebase auth error codes to friendly messages.
const firebaseError = (err) => {
  switch (err?.code) {
    case 'auth/email-already-in-use': return 'An account with this email already exists.';
    case 'auth/invalid-email': return 'That email address is not valid.';
    case 'auth/weak-password': return 'Password is too weak (min 6 characters).';
    case 'auth/operation-not-allowed': return 'Email/password sign-in is not enabled in Firebase.';
    default: return err?.message || 'Registration failed';
  }
};

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await register(form);
      setSent(true);
      toast.success('Verification email sent!');
    } catch (err) {
      toast.error(firebaseError(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="max-w-md mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold text-[#1C1613] mb-3">Check your inbox</h1>
        <p className="text-gray-600 mb-2">
          We&apos;ve sent a verification link to <strong>{form.email}</strong>.
        </p>
        <p className="text-gray-500 text-sm mb-6">
          Click the link to verify your email, then come back and log in. (Check spam if you don&apos;t see it.)
        </p>
        <button onClick={() => navigate('/login')} className="bg-[#DC2113] text-white px-6 py-2 rounded">
          Go to login
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold text-[#1C1613] mb-4">Create account</h1>
      <form onSubmit={submit} className="space-y-3">
        <input placeholder="Name" className="w-full border rounded px-3 py-2"
          value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input type="email" required placeholder="Email" className="w-full border rounded px-3 py-2"
          value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input type="password" required minLength={6} placeholder="Password (min 6 chars)" className="w-full border rounded px-3 py-2"
          value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button disabled={submitting} className="w-full bg-[#DC2113] text-white py-2 rounded disabled:opacity-50">
          {submitting ? 'Creating…' : 'Register'}
        </button>
      </form>

      <div className="flex items-center gap-3 my-4">
        <div className="h-px bg-gray-200 flex-1" />
        <span className="text-xs text-gray-400">OR</span>
        <div className="h-px bg-gray-200 flex-1" />
      </div>
      <GoogleButton onSuccess={(user) => { toast.success('Welcome!'); navigate(user.role === 'admin' ? '/admin' : '/menu'); }} />

      <p className="text-sm text-gray-500 mt-3">
        Already have an account? <Link to="/login" className="text-[#DC2113]">Login</Link>
      </p>
    </div>
  );
}
