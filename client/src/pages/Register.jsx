import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { register } from '../lib/api/auth';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

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

    const handleRegister = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            Swal.fire({
                ...swalOptions,
                icon: 'warning',
                title: 'Password Mismatch',
                text: 'Your passwords do not match.'
            });
            return;
        }

        try {
            await register({
                username: formData.username,
                email: formData.email,
                phone: formData.phone,
                password: formData.password
            });

            await Swal.fire({
                ...swalOptions,
                icon: 'success',
                title: 'Welcome Aboard!',
                text: 'Account created. Check your email to confirm before logging in.'
            });
            navigate('/login');
        } catch (err) {
             Swal.fire({
                ...swalOptions,
                icon: 'error',
                title: 'Registration Failed',
                text: err.message
            });
        }
    };

    return (
        <div className="pt-32 pb-20 px-4 min-h-screen flex items-center justify-center">
            <div className="bg-parchment p-8 rounded-lg shadow-lg border border-oatmeal max-w-md w-full">
                <h2 className="text-3xl font-serif text-espresso text-center mb-6">Join the Community</h2>
                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className="block text-espresso font-semibold mb-1">Username</label>
                        <input 
                            type="text" 
                            name="username"
                            className="w-full px-4 py-2 border border-oatmeal rounded focus:outline-none focus:border-bean bg-cream/50"
                            value={formData.username}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-espresso font-semibold mb-1">Email</label>
                        <input 
                            type="email" 
                            name="email"
                            className="w-full px-4 py-2 border border-oatmeal rounded focus:outline-none focus:border-bean bg-cream/50"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>
                     <div>
                        <label className="block text-espresso font-semibold mb-1">Phone Number (Optional)</label>
                        <input 
                            type="tel" 
                            name="phone"
                            className="w-full px-4 py-2 border border-oatmeal rounded focus:outline-none focus:border-bean bg-cream/50"
                            value={formData.phone}
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label className="block text-espresso font-semibold mb-1">Password</label>
                        <input 
                            type="password" 
                            name="password"
                            className="w-full px-4 py-2 border border-oatmeal rounded focus:outline-none focus:border-bean bg-cream/50"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-espresso font-semibold mb-1">Confirm Password</label>
                        <input 
                            type="password" 
                            name="confirmPassword"
                            className="w-full px-4 py-2 border border-oatmeal rounded focus:outline-none focus:border-bean bg-cream/50"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <button 
                        type="submit" 
                        className="w-full bg-espresso text-parchment py-3 rounded uppercase tracking-widest hover:bg-bean transition-colors"
                    >
                        Register
                    </button>
                </form>
                <div className="mt-6 text-center text-sm text-espresso">
                    Already have an account? <Link to="/login" className="font-bold hover:underline">Sign In</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
