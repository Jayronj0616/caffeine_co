import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Edit } from 'lucide-react';
import { getMenu, createMenuItem, updateMenuItem, deleteMenuItem } from '../../lib/api/menu';
import { uploadMenuImage } from '../../lib/api/storage';
import ErrorState from '../../components/ErrorState';

const Inventory = () => {
    const [items, setItems] = useState([]);
    const [formData, setFormData] = useState({ name: '', description: '', price: '', category: 'Espresso', image: '/images/latte.jpg' });
    const [imageFile, setImageFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [loadError, setLoadError] = useState(false);

    // Had no catch at all: a failed load was an unhandled rejection and the
    // list just rendered empty, which looks identical to an empty menu.
    const fetchMenu = async () => {
        setLoadError(false);
        try {
            const data = await getMenu();
            setItems(data);
        } catch (error) {
            console.error('Error fetching menu:', error);
            setLoadError(true);
        }
    };

    useEffect(() => {
        fetchMenu();
    }, []);

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

    const inputClass = "w-full px-4 py-2 rounded bg-[var(--adm-bg)] border border-[var(--adm-border)] text-[var(--adm-text)] placeholder:text-[var(--adm-text-dim)] focus:outline-none focus:border-[var(--adm-copper)]";

    return (
        <div>
            <h2 className="font-display font-bold text-3xl mb-1">Inventory</h2>
            <p className="text-sm text-[var(--adm-text-dim)] mb-8">What's on the board today.</p>
            <div className="grid lg:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="bg-[var(--adm-surface)] border border-[var(--adm-border)] p-6 rounded-md h-fit">
                    <h3 className="font-display font-bold text-xl mb-4 flex items-center gap-2">
                        {isEditing ? <Edit size={18} style={{ color: 'var(--adm-copper)' }} /> : <Plus size={18} style={{ color: 'var(--adm-copper)' }} />}
                        {isEditing ? 'Edit Item' : 'Add New Item'}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input name="name" placeholder="Item Name" value={formData.name} onChange={handleChange} className={inputClass} required />
                        <textarea name="description" placeholder="Description" value={formData.description} onChange={handleChange} className={inputClass} required />
                        <input name="price" type="number" step="0.01" placeholder="Price" value={formData.price} onChange={handleChange} className={`${inputClass} font-data`} required />
                        <select name="category" value={formData.category} onChange={handleChange} className={inputClass}>
                            {['Espresso', 'Pour Over', 'Cold Brew', 'Signature', 'Pastry'].map(c => <option key={c} value={c}>{c}</option>)}
                        </select>

                        <div>
                            <label className="block text-sm font-semibold mb-1 text-[var(--adm-text)]">Image</label>
                            {formData.image && !imageFile && (
                                <img src={formData.image} alt="Current" className="w-16 h-16 rounded object-cover mb-2 border border-[var(--adm-border)]" onError={(e) => e.target.style.display='none'} />
                            )}
                            <input type="file" accept="image/*" onChange={handleImageFileChange} className="w-full text-sm text-[var(--adm-text-dim)]" />
                            <p className="text-xs text-[var(--adm-text-dim)] mt-1">Choose a file to upload. Leave blank to keep the current image.</p>
                        </div>

                        <div className="flex gap-2">
                            <button type="submit" disabled={uploading} className="flex-1 bg-[var(--adm-copper)] text-[#1C1613] py-2 rounded font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
                                {uploading ? 'Uploading...' : isEditing ? 'Update' : 'Add'}
                            </button>
                            {isEditing && (
                                <button type="button" onClick={resetForm} className="px-4 py-2 border border-[var(--adm-border)] text-[var(--adm-text)] rounded hover:bg-[var(--adm-surface-hi)]">
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* List Section */}
                <div className="lg:col-span-2 space-y-3">
                    {loadError && (
                        <ErrorState title="Couldn't load inventory" onRetry={fetchMenu} />
                    )}
                    {items.map(item => (
                        <div key={item.id} className="bg-[var(--adm-surface)] border border-[var(--adm-border)] p-4 rounded-md flex justify-between items-center hover:border-[var(--adm-copper)]/50 transition-colors">
                           <div className="flex items-center gap-4 min-w-0">
                                <img src={item.image} alt={item.name} className="w-14 h-14 rounded object-cover bg-[var(--adm-surface-hi)] shrink-0" onError={(e) => e.target.src='/images/latte.jpg'}/>
                                <div className="min-w-0">
                                    <h4 className="font-semibold truncate text-[var(--adm-text)]">{item.name}</h4>
                                    <p className="font-data text-sm text-[var(--adm-text-dim)]">${Number(item.price).toFixed(2)} · <span className="uppercase tracking-wide text-xs">{item.category}</span></p>
                                </div>
                           </div>
                           <div className="flex gap-1 shrink-0">
                                <button onClick={() => handleEdit(item)} className="p-2 rounded hover:bg-[var(--adm-surface-hi)] transition-colors text-[var(--adm-text)]"><Edit size={18}/></button>
                                <button onClick={() => handleDelete(item.id)} className="p-2 rounded hover:bg-[var(--adm-danger)]/15 transition-colors" style={{ color: 'var(--adm-danger)' }}><Trash2 size={18}/></button>
                           </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Inventory;
