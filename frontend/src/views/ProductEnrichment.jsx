import React, { useState } from 'react';
import { useNotification } from '../components/NotificationProvider';
import useStore from '../store';
import api from '../api';

export default function ProductEnrichment({ products }) {
  const { showToast, showConfirm } = useNotification();
  const [selectedProduct, setSelectedProduct] = useState(products[0] || null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);

  const storeCategories = useStore((state) => state.categories);
  const fetchInitialData = useStore((state) => state.fetchInitialData);

  // Form states for Editing or Adding New
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formCategory, setFormCategory] = useState('Meals');
  const [formDesc, setFormDesc] = useState('');
  const [formBadge, setFormBadge] = useState('New');
  const [formImage, setFormImage] = useState('');
  const [formTemp, setFormTemp] = useState('HOT');
  const [formTime, setFormTime] = useState('10 min');
  const [formCalories, setFormCalories] = useState('450 kcal');
  
  // Kitchen Quality Checklist states
  const [formOrganic, setFormOrganic] = useState(false);
  const [formTempControlled, setFormTempControlled] = useState(false);
  const [formAllergen, setFormAllergen] = useState(false);
  const [formGarnish, setFormGarnish] = useState(false);

  const categories = ['All', 'Meals', 'Milk & Dairy', 'Coffee', 'Desserts'];

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setIsEditing(true);
    setIsAddingNew(false);
    
    // Populate form values
    setFormName(product.name);
    setFormPrice(product.price.toString());
    setFormCategory(product.category?.name || product.category || 'Meals');
    setFormDesc(product.desc || '');
    setFormBadge(product.badge || '');
    setFormImage(product.image || '');
    setFormTemp(product.details?.temp || 'HOT');
    setFormTime(product.details?.time || '10 min');
    setFormCalories(product.details?.calories || '450 kcal');
    setFormOrganic(product.standards?.organicCert || false);
    setFormTempControlled(product.standards?.tempControlled || false);
    setFormAllergen(product.standards?.allergenWarning || false);
    setFormGarnish(product.standards?.garnishAdded || false);
  };

  const handleAddNewTrigger = () => {
    setIsAddingNew(true);
    setIsEditing(false);
    setSelectedProduct(null);

    // Clear form for new item
    setFormName('');
    setFormPrice('10000');
    setFormCategory('Meals');
    setFormDesc('');
    setFormBadge('New');
    setFormImage('/images/gundaling_milk.png');
    setFormTemp('HOT');
    setFormTime('10 min');
    setFormCalories('400 kcal');
    setFormOrganic(true);
    setFormTempControlled(true);
    setFormAllergen(false);
    setFormGarnish(false);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!formName.trim() || !formPrice.trim()) {
      showToast('Please complete the product details.', 'error');
      return;
    }

    const priceNum = parseFloat(formPrice);
    if (isNaN(priceNum)) {
      showToast('Price must be a valid number.', 'error');
      return;
    }

    const targetCategory = storeCategories.find(c => c.name === formCategory);
    const categoryId = targetCategory ? targetCategory.id : 1;

    const payload = {
      name: formName,
      price: priceNum,
      category_id: categoryId,
      image: formImage,
      desc: formDesc,
      badge: formBadge,
      details: { temp: formTemp, time: formTime, calories: formCalories },
      standards: {
        organicCert: formOrganic,
        tempControlled: formTempControlled,
        allergenWarning: formAllergen,
        garnishAdded: formGarnish
      }
    };

    try {
      if (isAddingNew) {
        const res = await api.post('/api/products', payload);
        showToast(`Master dish "${formName}" created and added to POS Menu!`, 'success');
        setIsAddingNew(false);
        setIsEditing(false);
      } else if (selectedProduct) {
        await api.put(`/api/products/${selectedProduct.id}`, payload);
        showToast(`Dish "${formName}" updated successfully!`, 'success');
        setIsEditing(false);
      }
      await fetchInitialData();
      setSelectedProduct(null);
    } catch (err) {
      console.error(err);
      showToast('Failed to save product details.', 'error');
    }
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;
    const confirmed = await showConfirm(
      'Delete Master Dish',
      `Are you absolutely sure you want to delete "${selectedProduct.name}" from the POS master database?`
    );
    if (confirmed) {
      try {
        await api.delete(`/api/products/${selectedProduct.id}`);
        showToast(`Product deleted successfully.`, 'success');
        await fetchInitialData();
        setSelectedProduct(null);
        setIsEditing(false);
      } catch (err) {
        console.error(err);
        showToast('Failed to delete product.', 'error');
      }
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesCat = activeCategory === 'All' || 
                       (product.category && (product.category.name === activeCategory || product.category === activeCategory));
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (product.desc && product.desc.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="flex-1 flex bg-background h-full w-full overflow-hidden">
      
      {/* LEFT PANEL: Master Menu Products Catalog List */}
      <div className="flex-1 flex flex-col h-full overflow-hidden border-r border-outline-variant/20">
        
        {/* Header */}
        <header className="h-20 bg-surface/80 backdrop-blur-md flex justify-between items-center px-container_margin border-b border-outline-variant/10 z-10 font-display">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-full max-w-xs">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">search</span>
              <input 
                type="text"
                placeholder="Search master catalog..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface-container-low border-none rounded-full py-2.5 pl-12 pr-4 text-xs font-semibold focus:ring-2 focus:ring-primary/20 shadow-sm"
              />
            </div>
          </div>
          
          <button
            onClick={handleAddNewTrigger}
            className="h-12 px-6 bg-primary text-on-primary rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-md text-sm"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Add New Dish
          </button>
        </header>

        {/* Category Horizontal Filters */}
        <div className="px-container_margin py-4 flex gap-2 overflow-x-auto custom-scrollbar bg-surface-container-lowest/15">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${
                activeCategory === cat 
                  ? 'bg-primary text-on-primary border-primary shadow-sm' 
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container border-outline-variant/15'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Catalog Grid list */}
        <div className="flex-grow p-container_margin overflow-y-auto custom-scrollbar pb-16 bg-surface-container-lowest/30">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-gutter">
            {filteredProducts.map((p) => (
              <div 
                key={p.id} 
                onClick={() => handleSelectProduct(p)}
                className={`bg-surface rounded-3xl overflow-hidden border transition-all duration-200 cursor-pointer flex flex-col justify-between group shadow-sm ${
                  selectedProduct?.id === p.id 
                    ? 'ring-2 ring-primary ring-offset-2 border-primary' 
                    : 'border-outline-variant/35 hover:shadow-md'
                }`}
              >
                <div>
                  <div className="aspect-[16/10] bg-surface-container-highest relative overflow-hidden">
                    <img 
                      alt={p.name} 
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-200"
                      src={p.image}
                    />
                    <span className="absolute top-2.5 left-2.5 bg-primary text-on-primary px-2.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest shadow-sm">
                      {p.badge}
                    </span>
                  </div>
                  <div className="p-3 pb-2">
                    <h3 className="font-display font-bold text-xs text-on-surface mb-0.5 leading-snug group-hover:text-primary transition-colors truncate">
                      {p.name}
                    </h3>
                    <p className="text-[10px] text-on-surface-variant/80 line-clamp-1 leading-relaxed">
                      {p.desc}
                    </p>
                  </div>
                </div>

                <div className="p-3 pt-0 border-t border-outline-variant/10 flex justify-between items-center mt-1">
                  <span className="text-xs font-bold text-primary font-display">Rp {Math.floor(p.price).toLocaleString('id-ID')}</span>
                  <span className="text-[9px] font-bold text-outline-variant uppercase tracking-widest">
                    {p.category?.name || p.category || ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Dynamic Culinary Flow Editor / Creation Form */}
      <div className="w-[440px] bg-surface flex flex-col h-full overflow-hidden shadow-[-4px_0_24px_rgba(0,0,0,0.02)] z-10 border-l border-outline-variant/20">
        {(isEditing || isAddingNew) ? (
          <form onSubmit={handleSaveProduct} className="flex-1 flex flex-col h-full overflow-y-auto custom-scrollbar p-6">
            
            <header className="border-b border-outline-variant/20 pb-3 mb-5 flex justify-between items-center font-display">
              <h3 className="font-bold text-base text-on-surface uppercase tracking-wider">
                {isAddingNew ? 'Culinary Creation' : 'Culinary Enrichment'}
              </h3>
              
              {isEditing && (
                <button
                  type="button"
                  onClick={handleDeleteProduct}
                  className="p-1.5 text-outline hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                  title="Remove from Master Menu"
                >
                  <span className="material-symbols-outlined text-lg">delete</span>
                </button>
              )}
            </header>

            {/* Inputs Body */}
            <div className="space-y-4 flex-1">
              
              {/* Product Image preview */}
              {!isAddingNew && selectedProduct && (
                <div className="aspect-video bg-surface-container rounded-2xl overflow-hidden border border-outline-variant/10 mb-4 shadow-inner">
                  <img src={formImage} alt={formName} className="w-full h-full object-cover" />
                </div>
              )}

              {/* Title Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider ml-0.5">Dish Name</label>
                <input 
                  type="text" 
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Roasted Rack of Lamb"
                  required
                  className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-xs font-semibold shadow-sm focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Price & Category */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider ml-0.5">Price (Rupiah - Rp)</label>
                  <input 
                    type="number" 
                    step="1000"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    required
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-xs font-semibold shadow-sm focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider ml-0.5">Menu Category</label>
                  <select 
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-xs font-semibold shadow-sm focus:ring-2 focus:ring-primary cursor-pointer"
                  >
                    {categories.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider ml-0.5">Description</label>
                <textarea 
                  rows="3"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Describe the organic culinary details and chef plating..."
                  className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-xs font-semibold shadow-sm focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              {/* Accent Badge & Image Link */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider ml-0.5">Accent Badge</label>
                  <input 
                    type="text" 
                    value={formBadge}
                    onChange={(e) => setFormBadge(e.target.value)}
                    placeholder="e.g. Signature, Chef Choice"
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-xs font-semibold shadow-sm focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider ml-0.5">Serving Temp</label>
                  <select 
                    value={formTemp}
                    onChange={(e) => setFormTemp(e.target.value)}
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-xs font-semibold shadow-sm focus:ring-2 focus:ring-primary cursor-pointer"
                  >
                    <option value="HOT">HOT Serve</option>
                    <option value="COLD">COLD Serve</option>
                  </select>
                </div>
              </div>

              {/* Prep time & Calories */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider ml-0.5">Kitchen Prep Time</label>
                  <input 
                    type="text" 
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    placeholder="e.g. 15 min"
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-xs font-semibold shadow-sm focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider ml-0.5">Energy / Calories</label>
                  <input 
                    type="text" 
                    value={formCalories}
                    onChange={(e) => setFormCalories(e.target.value)}
                    placeholder="e.g. 520 kcal"
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-xs font-semibold shadow-sm focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Photo Link */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider ml-0.5">Photo Link (Optional)</label>
                <input 
                  type="text" 
                  value={formImage}
                  onChange={(e) => setFormImage(e.target.value)}
                  placeholder="URL link to food picture"
                  className="w-full bg-surface-container-low border-none rounded-xl px-4 py-2.5 text-[10px] font-mono shadow-sm focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Quality Standards checkboxes */}
              <div className="pt-2">
                <h4 className="text-[11px] font-bold text-on-surface uppercase tracking-wider mb-2.5">Kitchen Quality Checkpoints</h4>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 p-3 bg-surface-container-low rounded-xl border border-outline-variant/20 cursor-pointer shadow-sm">
                    <input 
                      type="checkbox" 
                      checked={formOrganic}
                      onChange={(e) => setFormOrganic(e.target.checked)}
                      className="w-4.5 h-4.5 text-primary rounded border-outline-variant focus:ring-primary shadow-sm"
                    />
                    <span className="text-[10px] font-bold text-on-surface leading-tight">Organic Cert</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 bg-surface-container-low rounded-xl border border-outline-variant/20 cursor-pointer shadow-sm">
                    <input 
                      type="checkbox" 
                      checked={formTempControlled}
                      onChange={(e) => setFormTempControlled(e.target.checked)}
                      className="w-4.5 h-4.5 text-primary rounded border-outline-variant focus:ring-primary shadow-sm"
                    />
                    <span className="text-[10px] font-bold text-on-surface leading-tight">Thermal Guard</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 bg-surface-container-low rounded-xl border border-outline-variant/20 cursor-pointer shadow-sm">
                    <input 
                      type="checkbox" 
                      checked={formAllergen}
                      onChange={(e) => setFormAllergen(e.target.checked)}
                      className="w-4.5 h-4.5 text-primary rounded border-outline-variant focus:ring-primary shadow-sm"
                    />
                    <span className="text-[10px] font-bold text-on-surface leading-tight">Allergen Warn</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 bg-surface-container-low rounded-xl border border-outline-variant/20 cursor-pointer shadow-sm">
                    <input 
                      type="checkbox" 
                      checked={formGarnish}
                      onChange={(e) => setFormGarnish(e.target.checked)}
                      className="w-4.5 h-4.5 text-primary rounded border-outline-variant focus:ring-primary shadow-sm"
                    />
                    <span className="text-[10px] font-bold text-on-surface leading-tight">Chef Signature</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Submission triggers */}
            <div className="mt-8 flex gap-3 pb-6">
              <button 
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setIsAddingNew(false);
                  setSelectedProduct(null);
                }}
                className="flex-1 h-13 border border-outline-variant rounded-xl font-bold text-on-surface-variant hover:bg-surface-container hover:text-on-surface active:scale-95 transition-all text-xs"
              >
                Cancel Form
              </button>
              
              <button 
                type="submit"
                className="flex-grow h-13 bg-primary text-on-primary rounded-xl font-bold shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1 text-xs"
              >
                <span className="material-symbols-outlined text-base">save</span>
                {isAddingNew ? 'Create Dish' : 'Apply Changes'}
              </button>
            </div>
          </form>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-on-surface-variant/70">
            <span className="material-symbols-outlined text-[64px] opacity-35 mb-3" style={{ fontVariationSettings: '"FILL" 1' }}>
              inventory_2
            </span>
            <p className="text-xs font-bold font-display uppercase tracking-wider">Catalog Administrator</p>
            <p className="text-[11px] max-w-xs mt-1 leading-relaxed px-4">
              Select any organic food dish or latte from the master menu on the left to edit its visual descriptions, price lists, or preparation standards. Or click **Add New Dish** to register a new recipe.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
