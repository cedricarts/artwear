import { useState, useEffect }          from "react";
import { collection, addDoc, getDocs, deleteDoc, setDoc, doc, serverTimestamp, orderBy, query, updateDoc } from "firebase/firestore";
import { Link }                         from "react-router-dom";
import { db }                           from "../../firebase/firebase";
import { useCloudinaryUpload }          from "../../hooks/useCloudinaryUpload";
import { useAuth }                      from "../../hooks/useAuth";
import { formatPrice }                  from "../../utils/currency";
import { buildVariantsFromMatrix, getAvailableColors, getTotalStock, isProductSoldOut } from "../../utils/variants";
import styles                           from "../../styles/admin/AdminProducts.module.css";

const STANDARD_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const ONE_SIZE       = "One Size";

const COLOUR_PALETTE = [
  { color: "Black", colorHex: "#111111" }, { color: "White", colorHex: "#f5f5f5" },
  { color: "Cream", colorHex: "#f0ead6" }, { color: "Grey", colorHex: "#9e9e9e" },
  { color: "Stone", colorHex: "#c4b9a8" }, { color: "Navy", colorHex: "#1a2744" },
  { color: "Olive", colorHex: "#556b2f" }, { color: "Burgundy", colorHex: "#6e1423" },
  { color: "Brown", colorHex: "#5c3d2e" },
];

const EMPTY_FORM = { name: "", price: "", description: "", tags: "", productType: "standard", remaining: "", sizeType: "clothing" };

const MIN_IMAGES = 2;
const MAX_IMAGES = 7;

export default function AdminProducts() {
  const { logout } = useAuth();

  const [products,      setProducts]      = useState([]);
  const [form,          setForm]          = useState(EMPTY_FORM);
  const [imageFiles,    setImageFiles]    = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [editingId,     setEditingId]     = useState(null);
  const [submitting,    setSubmitting]    = useState(false);
  const [error,         setError]         = useState(null);
  const [success,       setSuccess]       = useState(null);

  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedSizes,  setSelectedSizes]  = useState([]);
  const [stockGrid,      setStockGrid]      = useState({});
  const [skuGrid,        setSkuGrid]        = useState({});

  const { uploadImages, progress: uploadProgress, resetProgress } = useCloudinaryUpload();

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      const q    = query(collection(db, "products"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Failed to fetch products:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const selected = Array.from(e.target.files).slice(0, MAX_IMAGES);
    if (selected.length === 0) return;
    setImageFiles(selected);
    setImagePreviews(selected.map((f) => URL.createObjectURL(f)));
    setError(null);
  };

  const removeImagePreview = (index) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleColor = (colorObj) => {
    setSelectedColors((prev) => {
      const exists = prev.find((c) => c.color === colorObj.color);
      if (exists) {
        const newStock = { ...stockGrid };
        const newSku   = { ...skuGrid };
        selectedSizes.forEach((size) => {
          const id = `${colorObj.color.toLowerCase().replace(/\s+/g, "-")}-${size}`;
          delete newStock[id]; delete newSku[id];
        });
        setStockGrid(newStock); setSkuGrid(newSku);
        return prev.filter((c) => c.color !== colorObj.color);
      }
      return [...prev, colorObj];
    });
  };

  const toggleSize = (size) => {
    setSelectedSizes((prev) => {
      if (prev.includes(size)) {
        const newStock = { ...stockGrid };
        const newSku   = { ...skuGrid };
        selectedColors.forEach(({ color }) => {
          const id = `${color.toLowerCase().replace(/\s+/g, "-")}-${size}`;
          delete newStock[id]; delete newSku[id];
        });
        setStockGrid(newStock); setSkuGrid(newSku);
        return prev.filter((s) => s !== size);
      }
      return [...prev, size];
    });
  };

  const handleSizeTypeChange = (type) => {
    setForm((prev) => ({ ...prev, sizeType: type }));
    setSelectedSizes([]); setStockGrid({}); setSkuGrid({});
  };

  const updateStock = (variantId, value) => setStockGrid((prev) => ({ ...prev, [variantId]: parseInt(value, 10) || 0 }));
  const updateSku   = (variantId, value) => setSkuGrid((prev) => ({ ...prev, [variantId]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null); setSuccess(null);

    const existingImages = editingId ? getProductImages(products.find((p) => p.id === editingId)) : [];

    if (!editingId && imageFiles.length < MIN_IMAGES) { setError(`Please select at least ${MIN_IMAGES} product images.`); return; }
    if (imageFiles.length > 0 && imageFiles.length < MIN_IMAGES) { setError(`Please select at least ${MIN_IMAGES} images.`); return; }
    if (selectedColors.length > 0 && selectedSizes.length === 0) { setError("Please select at least one size."); return; }
    if (selectedSizes.length > 0 && selectedColors.length === 0) { setError("Please select at least one colour."); return; }

    setSubmitting(true);

    try {
      let images = existingImages;
      if (imageFiles.length > 0) images = await uploadImages(imageFiles);

      const hasVariants = selectedColors.length > 0 && selectedSizes.length > 0;
      let variants = [];
      if (hasVariants) {
        variants = buildVariantsFromMatrix(
          selectedColors, selectedSizes,
          editingId ? (products.find((p) => p.id === editingId)?.variants ?? []) : []
        ).map((v) => ({ ...v, stock: stockGrid[v.id] ?? v.stock, sku: skuGrid[v.id] ?? v.sku }));
      }

      const soldOut = hasVariants ? isProductSoldOut(variants) : false;

      const productData = {
        name: form.name.trim(),
        price: parseFloat(form.price),
        description: form.description.trim(),
        tags: form.tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean),
        images, imageUrl: images[0] ?? "",
        productType: form.productType,
        isOneOfOne: form.productType === "custom",
        sizeType: form.sizeType,
        soldOut,
        ...(hasVariants && { variants, sizes: selectedSizes, colors: selectedColors.map((c) => c.color) }),
        ...(form.productType === "limited" && !hasVariants && { remaining: parseInt(form.remaining, 10) }),
        ...(form.productType === "custom" && !hasVariants && { remaining: 1 }),
        ...(editingId ? { updatedAt: serverTimestamp() } : { createdAt: serverTimestamp() }),
      };

      if (editingId) {
        await setDoc(doc(db, "products", editingId), productData, { merge: true });
        setSuccess("Product updated successfully.");
      } else {
        await addDoc(collection(db, "products"), productData);
        setSuccess("Product added successfully.");
      }

      resetForm();
      fetchProducts();
    } catch (err) {
      console.error("Product save failed:", err);
      setError("Failed to save product. Please try again.");
    } finally {
      setSubmitting(false);
      resetProgress();
    }
  };

  const handleEdit = (product) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setEditingId(product.id);
    setForm({
      name: product.name, price: String(product.price), description: product.description ?? "",
      tags: (product.tags ?? []).join(", "), productType: product.productType ?? "standard",
      remaining: product.remaining !== undefined ? String(product.remaining) : "",
      sizeType: product.sizeType ?? "clothing",
    });
    setImagePreviews(getProductImages(product));
    setImageFiles([]);
    setError(null); setSuccess(null);

    const existingVariants = product.variants ?? [];
    setSelectedColors(getAvailableColors(existingVariants));
    setSelectedSizes(product.sizes ?? []);

    const stock = {}; const sku = {};
    existingVariants.forEach((v) => { stock[v.id] = v.stock; sku[v.id] = v.sku ?? ""; });
    setStockGrid(stock); setSkuGrid(sku);
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"?`)) return;
    try {
      await deleteDoc(doc(db, "products", product.id));
      fetchProducts();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleToggleSoldOut = async (product) => {
    try {
      const newSoldOut = !product.soldOut;
      await updateDoc(doc(db, "products", product.id), { soldOut: newSoldOut });
      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, soldOut: newSoldOut } : p)));
    } catch (err) {
      console.error("Sold out toggle failed:", err);
    }
  };

  const resetForm = () => {
    setForm(EMPTY_FORM); setImageFiles([]); setImagePreviews([]); setEditingId(null);
    setSelectedColors([]); setSelectedSizes([]); setStockGrid({}); setSkuGrid({});
  };

  const displaySizes = form.sizeType === "onesize" ? [ONE_SIZE] : STANDARD_SIZES;

  return (
    <div className={styles.page}>
      <header className={styles.adminHeader}>
        <div className={styles.adminNav}>
          <span className={styles.adminTitle}>Admin</span>
          <div className={styles.adminLinks}>
            <Link to="/admin">Dashboard</Link>
            <Link to="/admin/products">Products</Link>
            <Link to="/admin/analytics">Analytics</Link>
            <Link to="/admin/design-requests">Custom Designs</Link>
            <Link to="/admin/home-content">Home Content</Link>
            <Link to="/">← Storefront</Link>
            <button onClick={logout} className={styles.logoutBtn}>Sign Out</button>
          </div>
        </div>
      </header>

      <div className={styles.content}>
        <section className={styles.formPanel}>
          <h2 className={styles.panelHeading}>{editingId ? "Edit Product" : "Add New Product"}</h2>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>Product Images<span className={styles.labelMeta}>{MIN_IMAGES}–{MAX_IMAGES} · first is primary</span></label>

              {imagePreviews.length > 0 && (
                <div className={styles.previewStrip}>
                  {imagePreviews.map((src, i) => (
                    <div key={i} className={styles.previewThumb}>
                      <img src={src} alt={`Preview ${i + 1}`} />
                      {i === 0 && <span className={styles.primaryLabel}>Primary</span>}
                      {imageFiles.length > 0 && <button type="button" className={styles.removeThumb} onClick={() => removeImagePreview(i)}>✕</button>}
                    </div>
                  ))}
                  {imageFiles.length > 0 && imageFiles.length < MAX_IMAGES && (
                    <label className={styles.addMoreBtn}>
                      <input type="file" accept="image/*" multiple onChange={(e) => {
                        const additional = Array.from(e.target.files);
                        const combined   = [...imageFiles, ...additional].slice(0, MAX_IMAGES);
                        setImageFiles(combined);
                        setImagePreviews(combined.map((f) => URL.createObjectURL(f)));
                      }} className={styles.fileInput} />
                      <span>+ Add</span>
                    </label>
                  )}
                </div>
              )}

              {imagePreviews.length === 0 && (
                <label className={styles.uploadLabel}>
                  <input type="file" accept="image/*" multiple onChange={handleImageChange} className={styles.fileInput} />
                  <span className={styles.uploadPrompt}>Click to select {MIN_IMAGES}–{MAX_IMAGES} images</span>
                  <span className={styles.uploadHint}>JPEG, PNG, WebP — first image appears in the grid</span>
                </label>
              )}

              {editingId && imagePreviews.length > 0 && imageFiles.length === 0 && (
                <label className={styles.replaceBtn}>
                  <input type="file" accept="image/*" multiple onChange={handleImageChange} className={styles.fileInput} />
                  Replace all images
                </label>
              )}
            </div>

            {submitting && uploadProgress > 0 && uploadProgress < 100 && (
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${uploadProgress}%` }} />
                <span className={styles.progressLabel}>Uploading {uploadProgress}%</span>
              </div>
            )}

            <div className={styles.field}>
              <label htmlFor="name" className={styles.label}>Product Name</label>
              <input id="name" name="name" value={form.name} onChange={handleChange} className={styles.input} placeholder="e.g. Oversized Graphic Hoodie" required />
            </div>

            <div className={styles.field}>
              <label htmlFor="price" className={styles.label}>Price (ZAR)</label>
              <input id="price" name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleChange} className={styles.input} placeholder="e.g. 599.00" required />
            </div>

            <div className={styles.field}>
              <label htmlFor="description" className={styles.label}>Description</label>
              <textarea id="description" name="description" value={form.description} onChange={handleChange} className={styles.textarea} rows={4} placeholder="Product description shown on the detail page..." />
            </div>

            <div className={styles.field}>
              <label htmlFor="tags" className={styles.label}>Tags</label>
              <input id="tags" name="tags" value={form.tags} onChange={handleChange} className={styles.input} placeholder="hoodies, sale, new-arrival" />
              <span className={styles.fieldHint}>Comma-separated. Used for storefront filtering.</span>
            </div>

            <div className={styles.field}>
              <label htmlFor="productType" className={styles.label}>Product Type</label>
              <select id="productType" name="productType" value={form.productType} onChange={handleChange} className={styles.input}>
                <option value="standard">Standard</option>
                <option value="limited">Limited Edition</option>
                <option value="custom">Custom (1 of 1)</option>
              </select>
              <span className={styles.fieldHint}>
                {form.productType === "standard" && "No stock tracking. Mark sold out manually when needed."}
                {form.productType === "limited" && "Set unit count below. Sold Out flips automatically at 0."}
                {form.productType === "custom" && "One unit only. Sold Out flips automatically after purchase."}
              </span>
            </div>

            {form.productType === "limited" && (
              <div className={styles.field}>
                <label htmlFor="remaining" className={styles.label}>Units Available</label>
                <input id="remaining" name="remaining" type="number" min="1" step="1" value={form.remaining} onChange={handleChange} className={styles.input} placeholder="e.g. 5" required />
              </div>
            )}

            <div className={styles.variantSection}>
              <h3 className={styles.variantHeading}>Sizes & Stock<span className={styles.variantHint}>Select colours and sizes, then enter stock per combination</span></h3>

              <div className={styles.field}>
                <label className={styles.label}>Size Format</label>
                <div className={styles.sizeTypeRow}>
                  <button type="button" onClick={() => handleSizeTypeChange("clothing")} className={`${styles.sizeTypeBtn} ${form.sizeType === "clothing" ? styles.sizeTypeBtnActive : ""}`}>Standard (XS–XXL)</button>
                  <button type="button" onClick={() => handleSizeTypeChange("onesize")} className={`${styles.sizeTypeBtn} ${form.sizeType === "onesize" ? styles.sizeTypeBtnActive : ""}`}>One Size</button>
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Available Colours{selectedColors.length > 0 && <span className={styles.selectedCount}>{selectedColors.length} selected</span>}</label>
                <div className={styles.colourPalette}>
                  {COLOUR_PALETTE.map((c) => {
                    const isSelected = selectedColors.some((sc) => sc.color === c.color);
                    return (
                      <button key={c.color} type="button" onClick={() => toggleColor(c)} className={`${styles.colourChip} ${isSelected ? styles.colourChipActive : ""}`} title={c.color}>
                        <span className={styles.colourDot} style={{ backgroundColor: c.colorHex }} />
                        <span className={styles.colourName}>{c.color}</span>
                        {isSelected && <span className={styles.checkMark}>✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedColors.length > 0 && (
                <div className={styles.field}>
                  <label className={styles.label}>Available Sizes{selectedSizes.length > 0 && <span className={styles.selectedCount}>{selectedSizes.length} selected</span>}</label>
                  <div className={styles.sizeRow}>
                    {displaySizes.map((size) => (
                      <button key={size} type="button" onClick={() => { if (form.sizeType === "onesize") setSelectedSizes([ONE_SIZE]); else toggleSize(size); }} className={`${styles.sizeChip} ${selectedSizes.includes(size) ? styles.sizeChipActive : ""}`}>{size}</button>
                    ))}
                  </div>
                </div>
              )}

              {selectedColors.length > 0 && selectedSizes.length > 0 && (
                <div className={styles.stockSection}>
                  <label className={styles.label}>Stock per Combination</label>
                  <div className={styles.stockTableWrapper}>
                    <table className={styles.stockTable}>
                      <thead>
                        <tr>
                          <th className={styles.stockTh}>Colour</th>
                          {selectedSizes.map((size) => <th key={size} className={styles.stockTh}>{size}</th>)}
                          <th className={styles.stockTh}>SKU prefix</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedColors.map(({ color, colorHex }) => (
                          <tr key={color}>
                            <td className={styles.stockColorCell}>
                              <span className={styles.stockColorDot} style={{ backgroundColor: colorHex }} />
                              {color}
                            </td>
                            {selectedSizes.map((size) => {
                              const id = `${color.toLowerCase().replace(/\s+/g, "-")}-${size}`;
                              return (
                                <td key={size} className={styles.stockCell}>
                                  <input type="number" min="0" value={stockGrid[id] ?? 0} onChange={(e) => updateStock(id, e.target.value)} className={styles.stockInput} aria-label={`Stock for ${color} ${size}`} />
                                </td>
                              );
                            })}
                            <td className={styles.stockCell}>
                              <input type="text" placeholder="e.g. AW-HOD-BLK"
                                value={skuGrid[`${color.toLowerCase().replace(/\s+/g, "-")}-${selectedSizes[0]}`]?.replace(`-${selectedSizes[0]}`, "") ?? ""}
                                onChange={(e) => {
                                  const prefix = e.target.value.trim();
                                  selectedSizes.forEach((size) => {
                                    const id = `${color.toLowerCase().replace(/\s+/g, "-")}-${size}`;
                                    updateSku(id, prefix ? `${prefix}-${size}` : "");
                                  });
                                }}
                                className={styles.skuInput} aria-label={`SKU prefix for ${color}`}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className={styles.stockSummary}>
                    Total stock: <strong>{Object.values(stockGrid).reduce((sum, v) => sum + (parseInt(v, 10) || 0), 0)}</strong> units across {selectedColors.length * selectedSizes.length} combinations
                  </p>
                </div>
              )}
            </div>

            {error   && <p className={styles.error}>{error}</p>}
            {success && <p className={styles.success}>{success}</p>}

            <div className={styles.formActions}>
              <button type="submit" className={styles.saveBtn} disabled={submitting}>
                {submitting ? (uploadProgress < 100 ? `Uploading ${uploadProgress}%` : "Saving...") : editingId ? "Save Changes" : "Add Product"}
              </button>
              {editingId && <button type="button" onClick={resetForm} className={styles.cancelBtn}>Cancel</button>}
            </div>
          </form>
        </section>

        <section className={styles.listPanel}>
          <h2 className={styles.panelHeading}>All Products<span className={styles.productCount}>{products.length}</span></h2>
          {products.length === 0 && <p className={styles.empty}>No products yet.</p>}
          <div className={styles.productList}>
            {products.map((product) => {
              const images      = getProductImages(product);
              const variants    = product.variants ?? [];
              const hasVariants = variants.length > 0;
              const totalStock  = hasVariants ? getTotalStock(variants) : null;
              return (
                <div key={product.id} className={`${styles.productRow} ${editingId === product.id ? styles.editing : ""} ${product.soldOut ? styles.soldOutRow : ""}`}>
                  <div className={styles.productThumb}>
                    {images[0] && <img src={images[0]} alt={product.name} />}
                    {images.length > 1 && <span className={styles.imageCount}>+{images.length - 1}</span>}
                  </div>
                  <div className={styles.productMeta}>
                    <p className={styles.productName}>{product.name}</p>
                    <p className={styles.productPrice}>{formatPrice(product.price)}</p>
                    {hasVariants && <p className={styles.variantSummary}>{getAvailableColors(variants).map((c) => c.color).join(", ")} · {totalStock} units total</p>}
                    <div className={styles.productBadges}>
                      {product.productType && product.productType !== "standard" && (
                        <span className={`${styles.typeBadge} ${styles[product.productType]}`}>
                          {product.productType === "limited" && "Limited"}
                          {product.productType === "custom"  && "1 of 1"}
                        </span>
                      )}
                      {product.soldOut && <span className={styles.soldOutBadge}>Sold Out</span>}
                    </div>
                    {(product.tags ?? []).length > 0 && <p className={styles.productTags}>{product.tags.join(", ")}</p>}
                  </div>
                  <div className={styles.productActions}>
                    <button onClick={() => handleEdit(product)} className={styles.editBtn}>Edit</button>
                    <button onClick={() => handleDelete(product)} className={styles.deleteBtn}>Delete</button>
                    {!hasVariants && (
                      (!product.productType || product.productType === "standard") ? (
                        <button onClick={() => handleToggleSoldOut(product)} className={`${styles.stockBtn} ${product.soldOut ? styles.inStockBtn : styles.soldOutBtn}`}>
                          {product.soldOut ? "In Stock" : "Sold Out"}
                        </button>
                      ) : (
                        <span className={styles.stockLabel}>{product.soldOut ? "Sold out" : `${product.remaining ?? 1} left`}</span>
                      )
                    )}
                    {hasVariants && <span className={styles.stockLabel}>{product.soldOut ? "Sold out" : `${totalStock} left`}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

export function getProductImages(product) {
  if (!product) return [];
  if (Array.isArray(product.images) && product.images.length > 0) return product.images;
  if (product.imageUrl) return [product.imageUrl];
  return [];
}
