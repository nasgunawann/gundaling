import React, { useState } from 'react';
import { useNotification } from '../components/NotificationProvider';
import useStore from '../store';
import api from '../api';
import NextImage from '../components/NextImage';

export default function ProductEnrichment({ products }) {
  const { showToast, showConfirm } = useNotification();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isUpdatingStockId, setIsUpdatingStockId] = useState(null);

  const storeCategories = useStore((state) => state.categories || []);
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

  const allCategories = ['All', ...storeCategories.map(c => c.name)];
  const primaryCategories = allCategories.slice(0, 6);
  const secondaryCategories = allCategories.slice(6);
  const [showMoreCategories, setShowMoreCategories] = useState(false);

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
    setFormCategory(storeCategories[0]?.name || 'Meals');
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
    const categoryId = targetCategory ? targetCategory.id : null;

    const payload = {
      name: formName,
      price: priceNum,
      categoryId,
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
        await api.post('/products', payload);
        showToast(`Master dish "${formName}" created and added to POS Menu!`, 'success');
        setIsAddingNew(false);
        setIsEditing(false);
      } else if (selectedProduct) {
        await api.put(`/products/${selectedProduct.id}`, payload);
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
        await api.delete(`/products/${selectedProduct.id}`);
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

  const handleToggleStock = async (product, e) => {
    e.stopPropagation();
    setIsUpdatingStockId(product.id);
    try {
      await api.put(`/products/${product.id}`, {
        outOfStock: !product.outOfStock
      });
      showToast(`Stock availability updated for "${product.name}".`, 'success');
      await fetchInitialData();
    } catch (err) {
      console.error(err);
      showToast('Failed to update stock availability.', 'error');
    } finally {
      setIsUpdatingStockId(null);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesCat = activeCategory === 'All' || 
                       (product.category && (product.category.name === activeCategory || product.category === activeCategory));
    
    const catName = product.category?.name || product.category || ''
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           (product.desc && product.desc.toLowerCase().includes(searchQuery.toLowerCase())) ||
                           (typeof catName === 'string' && catName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                           (product.badge && product.badge.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCat && matchesSearch;
  });

  const isFormOpen = isEditing || isAddingNew;

  return (
    <div className="flex-1 flex flex-col lg:flex-row bg-background h-full w-full overflow-hidden relative">
      
      {/* LEFT: Products Catalog Grid */}
      <div className="flex-1 flex flex-col h-full overflow-hidden lg:border-r border-outline-variant/20">
        
        {/* Header */}
        <header className="h-20 bg-surface flex justify-between items-center px-container_margin border-b border-outline-variant/10 z-10 font-display shrink-0">
          <div>
            <h2 className="text-xl font-bold text-on-surface leading-tight">Product Enrichment</h2>
            <p className="text-xs text-on-surface-variant/80 uppercase tracking-widest mt-0.5">
              Master Catalog • Recipe & Price Management
            </p>
          </div>
          <button
            onClick={handleAddNewTrigger}
            className="h-12 px-6 bg-primary text-on-primary rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-md text-xs uppercase tracking-wider"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Add New Dish
          </button>
        </header>

        {/* Filters Wrapper: Merged Categories and Search Bar into one block */}
        <div className="px-container_margin py-4 border-b border-outline-variant/10 bg-surface-container-lowest/15 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          {/* Category Filters Container */}
          <div className="flex-1 flex items-center gap-2 max-w-full md:max-w-[calc(100%-300px)]">
            
            {/* Scrollable primary categories */}
            <div className="relative flex-grow overflow-hidden flex items-center group/nav">
              {/* Left Scroll Button */}
              <button 
                onClick={() => {
                  const container = document.getElementById('category-scroll-container-enrich');
                  if (container) container.scrollBy({ left: -200, behavior: 'smooth' });
                }}
                className="absolute left-1 z-20 flex items-center justify-center w-7 h-7 rounded-full bg-surface border border-outline-variant/20 shadow-sm text-on-surface-variant opacity-0 group-hover/nav:opacity-100 transition-opacity active:scale-95"
                title="Scroll Left"
              >
                <span className="material-symbols-outlined text-sm font-bold">chevron_left</span>
              </button>

              {/* Left Fade Overlay */}
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none z-10"></div>
              
              <div 
                id="category-scroll-container-enrich"
                className="flex gap-2 overflow-x-auto scrollbar-none py-1 px-8 w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] scroll-smooth items-center"
              >
                {primaryCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setActiveCategory(cat);
                      setShowMoreCategories(false);
                    }}
                    className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border shrink-0 ${activeCategory === cat
                        ? 'bg-primary text-on-primary border-primary shadow-sm'
                        : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container border-outline-variant/15'
                      }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Right Fade Overlay */}
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none z-10"></div>

              {/* Right Scroll Button */}
              <button 
                onClick={() => {
                  const container = document.getElementById('category-scroll-container-enrich');
                  if (container) container.scrollBy({ left: 200, behavior: 'smooth' });
                }}
                className="absolute right-1 z-20 flex items-center justify-center w-7 h-7 rounded-full bg-surface border border-outline-variant/20 shadow-sm text-on-surface-variant opacity-0 group-hover/nav:opacity-100 transition-opacity active:scale-95"
                title="Scroll Right"
              >
                <span className="material-symbols-outlined text-sm font-bold">chevron_right</span>
              </button>
            </div>

            {/* Non-scrollable More Dropdown wrapper placed outside of overflow-hidden container */}
            {secondaryCategories.length > 0 && (
              <div className="relative shrink-0 z-30">
                <button
                  onClick={() => setShowMoreCategories(!showMoreCategories)}
                  className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border flex items-center gap-1.5 ${
                    secondaryCategories.includes(activeCategory)
                      ? 'bg-primary text-on-primary border-primary shadow-sm'
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container border-outline-variant/15'
                  }`}
                >
                  <span>{secondaryCategories.includes(activeCategory) ? activeCategory : 'More'}</span>
                  <span className="material-symbols-outlined text-xs leading-none">expand_more</span>
                </button>

                {showMoreCategories && (
                  <div className="absolute right-0 mt-2 w-56 max-h-72 overflow-y-auto bg-surface border border-outline-variant/25 rounded-2xl shadow-xl p-2 custom-scrollbar scroll-smooth">
                    {secondaryCategories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => {
                          setActiveCategory(cat);
                          setShowMoreCategories(false);
                        }}
                        className={`w-full px-4 py-2.5 text-left text-xs font-bold uppercase rounded-xl transition-all ${
                          activeCategory === cat
                            ? 'bg-primary/10 text-primary'
                            : 'text-on-surface-variant hover:bg-surface-container-low'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Search bar positioned next to categories for consistency */}
          <div className="relative w-full md:max-w-[280px] shrink-0">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">search</span>
            <input
              type="text"
              placeholder="Search master catalog..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container-low border-none rounded-full py-2.5 pl-11 pr-4 text-xs font-semibold focus:ring-2 focus:ring-primary/20 shadow-sm"
            />
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="flex-grow p-container_margin overflow-y-auto custom-scrollbar pb-16 bg-surface-container-lowest/30">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.length > 0 ? filteredProducts.map((p) => (
              <div
                key={p.id}
                onClick={() => handleSelectProduct(p)}
                className={`bg-surface rounded-2xl overflow-hidden border border-outline-variant/35 shadow-sm flex flex-col justify-between group cursor-pointer active:scale-[0.98] ${
                  selectedProduct?.id === p.id ? 'ring-2 ring-primary border-transparent' : ''
                }`}
              >
                <div>
                  <div className="aspect-[4/3] bg-surface-container-highest relative overflow-hidden">
                    <NextImage
                      alt={p.name}
                      width={400}
                      quality={75}
                      className={`w-full h-full object-cover ${p.outOfStock ? 'grayscale' : ''}`}
                      src={p.image}
                    />
                    <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest shadow-sm bg-primary text-on-primary">
                      {p.category?.name || p.category || ''}
                    </span>
                    {p.outOfStock && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="bg-error text-on-error text-[10px] font-bold px-3 py-1 rounded-lg uppercase tracking-wider shadow-md">
                          SOLD OUT
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-3 pb-2">
                    <h3 className="font-display font-bold text-xs mb-0.5 leading-snug truncate text-on-surface">
                      {p.name}
                    </h3>
                    <p className="text-[10px] line-clamp-1 leading-relaxed text-on-surface-variant/85">
                      {p.desc}
                    </p>
                  </div>
                </div>

                <div className="p-3 pt-0 flex justify-between items-center mt-1">
                  <span className="text-sm font-bold font-display text-primary">
                    Rp {Math.floor(p.price).toLocaleString('id-ID')}
                  </span>

                  <button
                    onClick={(e) => handleToggleStock(p, e)}
                    disabled={isUpdatingStockId === p.id}
                    className={`w-11 h-11 rounded-xl transition-all flex items-center justify-center shadow-sm active:scale-90 border ${
                      p.outOfStock 
                        ? 'bg-error/10 text-error border-error/20 hover:bg-error hover:text-on-error'
                        : 'bg-primary/10 text-primary border-primary/20 hover:bg-primary hover:text-on-primary'
                    }`}
                    title={p.outOfStock ? "Mark In Stock" : "Mark Out of Stock"}
                  >
                    <span className="material-symbols-outlined text-base font-bold">
                      {isUpdatingStockId === p.id ? 'sync' : (p.outOfStock ? 'block' : 'check_circle')}
                    </span>
                  </button>
                </div>
              </div>
            )) : (
              <div className="col-span-full rounded-3xl border border-dashed border-outline-variant/40 bg-surface-container-low p-10 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-[40px] mb-4 inline-block">search_off</span>
                <p className="text-sm font-bold">No matching master menu items found</p>
                <p className="text-xs mt-2 leading-relaxed">Try another keyword or category to locate the recipe.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT: Collapsible Sliding Drawer Form for Editing/Adding Product */}
      <div 
        className={`fixed inset-y-0 right-0 z-50 w-[380px] sm:w-[440px] bg-surface flex flex-col h-full overflow-hidden shadow-[-8px_0_32px_rgba(0,0,0,0.12)] transition-transform duration-75 transform ${
          isFormOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {isFormOpen && (
          <form onSubmit={handleSaveProduct} className="flex-grow flex flex-col h-full overflow-hidden">
            {/* Drawer Header */}
            <header className="px-6 py-6 border-b border-surface-container flex justify-between items-center bg-surface-container-low/20 shrink-0">
              <div>
                <h3 className="text-base font-bold font-display text-on-surface">
                  {isAddingNew ? 'Culinary Creation' : 'Culinary Enrichment'}
                </h3>
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-0.5 font-mono">
                  {isAddingNew ? 'New Master Item' : `Edit: ${formName}`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {isEditing && (
                  <button
                    type="button"
                    onClick={handleDeleteProduct}
                    className="p-2 text-outline hover:text-error hover:bg-error/10 rounded-xl transition-all"
                    title="Remove from Master Menu"
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setIsAddingNew(false);
                    setSelectedProduct(null);
                  }}
                  className="p-2 text-outline hover:bg-surface-container rounded-xl transition-all"
                  title="Close Drawer"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>
            </header>

            {/* Drawer Content Body */}
            <div className="flex-grow overflow-y-auto px-6 py-4 custom-scrollbar bg-surface-container-lowest/15 space-y-4">
              
              {/* Product Image preview */}
              {!isAddingNew && selectedProduct && (
                <div className="aspect-video bg-surface-container rounded-2xl overflow-hidden border border-outline-variant/10 mb-2 shadow-inner shrink-0">
                  <NextImage src={formImage} width={600} quality={80} alt={formName} className="w-full h-full object-cover" />
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
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider ml-0.5">Price (Rp)</label>
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

              {/* Accent Badge & Serving Temp */}
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
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider ml-0.5">Prep Time</label>
                  <input 
                    type="text" 
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    placeholder="e.g. 15 min"
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-xs font-semibold shadow-sm focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider ml-0.5">Calories</label>
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

            {/* Drawer Footer Actions */}
            <footer className="p-6 border-t border-outline-variant/35 bg-surface-container-low/30 shrink-0">
              <button 
                type="submit"
                className="w-full h-14 bg-primary text-on-primary rounded-xl font-bold shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider"
              >
                <span className="material-symbols-outlined text-base">save</span>
                {isAddingNew ? 'Create Dish' : 'Apply Changes'}
              </button>
            </footer>
          </form>
        )}
      </div>

      {/* Backdrop for sliding drawer */}
      {isFormOpen && (
        <div 
          onClick={() => {
            setIsEditing(false);
            setIsAddingNew(false);
            setSelectedProduct(null);
          }}
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
        />
      )}
    </div>
  );
}
