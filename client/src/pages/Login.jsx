import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { login, getProfile } from '../lib/api/auth';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const swalOptions = {
        confirmButtonColor: '#4A3B32',
        background: '#F5F5DC',
        color: '#4A3B32',
        width: '24em',
        customClass: {
            popup: 'font-serif border-2 border-[#D2B48C]',
            title: 'text-xl',
            confirmButton: 'uppercase tracking-widest px-4 py-2 text-sm'
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const { user } = await login({ email, password });

            await Swal.fire({
                ...swalOptions,
                icon: 'success',
                title: 'Welcome Back!',
                timer: 1500,
                timerProgressBar: true
            });

            // Admins go straight to the Admin dashboard, not the customer landing page.
            let isAdmin = false;
            try {
                const profile = await getProfile(user.id);
                isAdmin = profile?.role === 'admin';
            } catch (profileErr) {
                console.error('Failed to load profile after login:', profileErr.message);
            }
            navigate(isAdmin ? '/admin' : '/');
        } catch (err) {
            Swal.fire({
                ...swalOptions,
                icon: 'error',
                title: 'Login Failed',
                text: err.message
            });
        }
    };

    return (
        <div className="pt-32 pb-20 px-4 min-h-screen flex items-center justify-center">
            <div className="bg-parchment p-8 rounded-lg shadow-lg border border-oatmeal max-w-md w-full">
                <h2 className="text-3xl font-serif text-espresso text-center mb-6">Welcome Back</h2>
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-espresso font-semibold mb-1">Email</label>
                        <input 
                            type="email" 
                            className="w-full px-4 py-2 border border-oatmeal rounded focus:outline-none focus:border-bean bg-cream/50"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-espresso font-semibold mb-1">Password</label>
                        <input 
                            type="password" 
                            className="w-full px-4 py-2 border border-oatmeal rounded focus:outline-none focus:border-bean bg-cream/50"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button 
                        type="submit" 
                        className="w-full bg-espresso text-parchment py-3 rounded uppercase tracking-widest hover:bg-bean transition-colors"
                    >
                        Sign In
                    </button>
                </form>
                <div className="mt-6 text-center text-sm text-espresso">
                    Don't have an account? <Link to="/register" className="font-bold hover:underline">Register here</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
