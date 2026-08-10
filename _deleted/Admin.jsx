import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Edit } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMenu, createMenuItem, updateMenuItem, deleteMenuItem } from '../lib/api/menu';
import { uploadMenuImage } from '../lib/api/storage';
import { getAllOrders } from '../lib/api/orders';

const Admin = () => {
    const [activeTab, setActiveTab] = useState('menu'); // 'menu' | 'orders'
    const [items, setItems] = useState([]);
    const [orders, setOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(true);
    const [formData, setFormData] = useState({ name: '', description: '', price: '', category: 'Espresso', image: '/images/latte.jpg' });
    const [imageFile, setImageFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const navigate = useNavigate();
    const { isAdmin, loading: authLoading } = useAuth();

    const fetchMenu = async () => {
        const data = await getMenu();
        setItems(data);
    };

    const fetchOrders = async () => {
        setOrdersLoading(true);
        try {
            const data = await getAllOrders();
            setOrders(data);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setOrdersLoading(false);
        }
    };

    useEffect(() => {
        if (authLoading) return; // wait for profile/role to resolve
        if (!isAdmin) {
            navigate('/login');
            return;
        }
        fetchMenu();
        fetchOrders();
    }, [isAdmin, authLoading]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageFileChange = (e) => {
        setImageFile(e.target.files?.[0] ?? null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let imageUrl = formData.image;

            if (imageFile) {
                setUploading(true);
                imageUrl = await uploadMenuImage(imageFile);
                setUploading(false);
            }

            const payload = { ...formData, image: imageUrl };

            if (isEditing) {
                await updateMenuItem(editId, payload);
            } else {
                await createMenuItem(payload);
            }
            fetchMenu();
            resetForm();
        } catch (error) {
            setUploading(false);
            console.error('Error:', error);
            alert(error.message || 'Operation failed');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure?')) return;
        try {
            await deleteMenuItem(id);
            fetchMenu();
        } catch (error) {
            console.error('Error deleting:', error);
        }
    };

    const handleEdit = (item) => {
        setFormData({
            name: item.name,
            description: item.description,
            price: item.price,
            category: item.category,
            image: item.image || '/images/latte.jpg'
        });
        setImageFile(null);
        setIsEditing(true);
        setEditId(item.id);
    };

    const resetForm = () => {
        setFormData({ name: '', description: '', price: '', category: 'Espresso', image: '/images/latte.jpg' });
        setImageFile(null);
        setIsEditing(false);
        setEditId(null);
    };

    if (authLoading) return <div className="pt-32 text-center text-espresso">Loading...</div>;

    return (
        <div className="pt-32 pb-20 px-4 max-w-6xl mx-auto min-h-screen">
            <h2 className="text-4xl text-center mb-8 font-serif text-espresso">Admin Dashboard</h2>

            {/* Tabs */}
            <div className="flex justify-center gap-4 mb-10">
                <button
                    onClick={() => setActiveTab('menu')}
                    className={`px-4 py-2 text-sm uppercase tracking-widest border transition-all ${activeTab === 'menu' ? 'bg-espresso text-parchment border-espresso' : 'bg-transparent text-espresso border-oatmeal hover:border-bean hover:text-bean'}`}
                >
                    Menu
                </button>
                <button
                    onClick={() => setActiveTab('orders')}
                    className={`px-4 py-2 text-sm uppercase tracking-widest border transition-all ${activeTab === 'orders' ? 'bg-espresso text-parchment border-espresso' : 'bg-transparent text-espresso border-oatmeal hover:border-bean hover:text-bean'}`}
                >
                    Orders
                </button>
                <Link
                    to="/pos"
                    className="px-4 py-2 text-sm uppercase tracking-widest border transition-all bg-transparent text-espresso border-oatmeal hover:border-bean hover:text-bean"
                >
                    Open POS
                </Link>
            </div>

            {activeTab === 'menu' && (
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Form Section */}
                    <div className="bg-parchment p-6 rounded-lg shadow-md border border-oatmeal h-fit">
                        <h3 className="text-xl font-bold text-espresso mb-4 flex items-center gap-2">
                            {isEditing ? <Edit size={20}/> : <Plus size={20}/>} 
                            {isEditing ? 'Edit Item' : 'Add New Item'}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input name="name" placeholder="Item Name" value={formData.name} onChange={handleChange} className="w-full px-4 py-2 border rounded" required />
                            <textarea name="description" placeholder="Description" value={formData.description} onChange={handleChange} className="w-full px-4 py-2 border rounded" required />
                            <input name="price" type="number" step="0.01" placeholder="Price" value={formData.price} onChange={handleChange} className="w-full px-4 py-2 border rounded" required />
                            <select name="category" value={formData.category} onChange={handleChange} className="w-full px-4 py-2 border rounded">
                                {['Espresso', 'Pour Over', 'Cold Brew', 'Signature', 'Pastry'].map(c => <option key={c} value={c}>{c}</option>)}
                            </select>

                            <div>
                                <label className="block text-sm text-espresso font-semibold mb-1">Image</label>
                                {formData.image && !imageFile && (
                                    <img src={formData.image} alt="Current" className="w-16 h-16 rounded object-cover mb-2 border border-oatmeal" onError={(e) => e.target.style.display='none'} />
                                )}
                                <input type="file" accept="image/*" onChange={handleImageFileChange} className="w-full text-sm" />
                                <p className="text-xs text-bean mt-1">Choose a file to upload. Leave blank to keep the current image.</p>
                            </div>

                            <div className="flex gap-2">
                                <button type="submit" disabled={uploading} className="flex-1 bg-espresso text-parchment py-2 rounded hover:bg-bean transition-colors disabled:opacity-50">
                                    {uploading ? 'Uploading...' : isEditing ? 'Update' : 'Add'}
                                </button>
                                {isEditing && (
                                    <button type="button" onClick={resetForm} className="px-4 py-2 border border-espresso text-espresso rounded hover:bg-oatmeal/20">
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* List Section */}
                    <div className="lg:col-span-2 space-y-4">
                        {items.map(item => (
                            <div key={item.id} className="bg-white/50 p-4 rounded-lg border border-oatmeal flex justify-between items-center shadow-sm">
                               <div className="flex items-center gap-4">
                                    <img src={item.image} alt={item.name} className="w-12 h-12 rounded object-cover bg-oatmeal/20" onError={(e) => e.target.src='/images/latte.jpg'}/>
                                    <div>
                                        <h4 className="font-bold text-espresso">{item.name}</h4>
                                        <p className="text-sm text-bean">${Number(item.price).toFixed(2)} - {item.category}</p>
                                    </div>
                               </div>
                               <div className="flex gap-2">
                                    <button onClick={() => handleEdit(item)} className="p-2 text-espresso hover:bg-oatmeal/20 rounded"><Edit size={18}/></button>
                                    <button onClick={() => handleDelete(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 size={18}/></button>
                               </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'orders' && (
                <div className="max-w-3xl mx-auto space-y-4">
                    {ordersLoading ? (
                        <p className="text-center text-bean italic">Loading orders...</p>
                    ) : orders.length === 0 ? (
                        <p className="text-center text-bean italic">No orders yet.</p>
                    ) : (
                        orders.map(order => (
                            <div key={`${order.source}-${order.id}`} className="bg-parchment p-5 rounded-lg border border-oatmeal shadow-sm">
                                <div className="flex justify-between items-baseline mb-3 border-b border-oatmeal pb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-espresso">Order #{order.id}</span>
                                        <span className={`text-xs uppercase tracking-widest px-2 py-0.5 rounded ${order.source === 'pos' ? 'bg-bean/20 text-bean' : 'bg-oatmeal/40 text-espresso'}`}>
                                            {order.source === 'pos' ? 'POS' : 'Online'}
                                        </span>
                                        {order.status && (
                                            <span className="text-xs uppercase tracking-widest text-bean">{order.status}</span>
                                        )}
                                    </div>
                                    <span className="text-sm text-bean">{new Date(order.created_at).toLocaleString()}</span>
                                </div>
                                <ul className="text-sm text-espresso space-y-1 mb-3">
                                    {order.items.map(oi => (
                                        <li key={oi.id} className="flex justify-between">
                                            <span>{oi.quantity}x {oi.name}</span>
                                            <span>${(oi.price * oi.quantity).toFixed(2)}</span>
                                        </li>
                                    ))}
                                </ul>
                                <div className="flex justify-between font-bold text-espresso border-t border-oatmeal pt-2">
                                    <span>Total</span>
                                    <span>${Number(order.total).toFixed(2)}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default Admin;
