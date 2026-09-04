import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import { useCloudinaryUpload } from "../../hooks/useCloudinaryUpload";
import { getProductImages } from "./AdminProducts";
import styles from "../../styles/admin/AdminHomeContent.module.css";

const EMPTY_BANNER = { enabled: false, eyebrow: "New Drop", title: "", subtitle: "", ctaLabel: "Shop Now", ctaTo: "/" };
const HOME_DOC = doc(db, "siteContent", "home");
const MAX_FEATURED = 6;

export default function AdminHomeContent() {
  const [banner, setBanner] = useState(EMPTY_BANNER);
  const [slides, setSlides] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [featuredProductIds, setFeaturedProductIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const { uploadImage, progress, resetProgress } = useCloudinaryUpload();
  const [uploadingSlideIdx, setUploadingSlideIdx] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [homeSnap, productsSnap] = await Promise.all([
          getDoc(HOME_DOC),
          getDocs(query(collection(db, "products"), orderBy("createdAt", "desc"))),
        ]);
        if (homeSnap.exists()) {
          const data = homeSnap.data();
          setBanner({ ...EMPTY_BANNER, ...data.banner });
          setSlides(data.slides ?? []);
          setFeaturedProductIds(data.featuredProductIds ?? []);
        }
        setAllProducts(productsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Failed to load home content:", err);
        setError("Could not load current content.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await setDoc(HOME_DOC, { banner, slides, featuredProductIds, updatedAt: serverTimestamp() });
      setSuccess("Saved. Live on the storefront now.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Failed to save home content:", err);
      setError("Save failed. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const toggleFeatured = (productId) => {
    setFeaturedProductIds((prev) => {
      if (prev.includes(productId)) return prev.filter((id) => id !== productId);
      if (prev.length >= MAX_FEATURED) return prev; // silently caps — button below explains the cap
      return [...prev, productId];
    });
  };

  const moveFeatured = (idx, dir) => {
    setFeaturedProductIds((prev) => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const handleBannerField = (field, value) => setBanner((prev) => ({ ...prev, [field]: value }));

  const addSlide = () => setSlides((prev) => [...prev, { id: crypto.randomUUID(), image: "", title: "", subtitle: "", to: "/" }]);
  const updateSlide = (idx, field, value) => setSlides((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
  const removeSlide = (idx) => setSlides((prev) => prev.filter((_, i) => i !== idx));
  const moveSlide = (idx, dir) => {
    setSlides((prev) => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const handleSlideImage = async (idx, file) => {
    if (!file) return;
    setUploadingSlideIdx(idx);
    setError(null);
    try {
      const url = await uploadImage(file);
      updateSlide(idx, "image", url);
    } catch (err) {
      console.error("Slide image upload failed:", err);
      setError("Image upload failed.");
    } finally {
      setUploadingSlideIdx(null);
      resetProgress();
    }
  };

  if (loading) return <div className={styles.page}><p className={styles.status}>Loading…</p></div>;

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <section className={styles.panel}>
          <div className={styles.panelHeading}>
            Homepage Banner
            <label className={styles.enableToggle}>
              <input type="checkbox" checked={banner.enabled} onChange={(e) => handleBannerField("enabled", e.target.checked)} />
              Show on storefront
            </label>
          </div>
          <div className={styles.form}>
            <Field label="Eyebrow" value={banner.eyebrow} onChange={(v) => handleBannerField("eyebrow", v)} placeholder="New Drop" />
            <Field label="Title" value={banner.title} onChange={(v) => handleBannerField("title", v)} placeholder="Sold out in 48 hours last time." />
            <Field label="Subtitle" value={banner.subtitle} onChange={(v) => handleBannerField("subtitle", v)} placeholder="Restocked. Won't last." />
            <div className={styles.fieldGroup}>
              <Field label="CTA Label" value={banner.ctaLabel} onChange={(v) => handleBannerField("ctaLabel", v)} placeholder="Shop the drop" />
              <Field label="CTA Link" value={banner.ctaTo} onChange={(v) => handleBannerField("ctaTo", v)} placeholder="/ or /product/abc123" />
            </div>
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeading}>
            Homepage Carousel
            <span className={styles.slideCount}>{slides.length} slide{slides.length === 1 ? "" : "s"}</span>
          </div>
          <div className={styles.slideList}>
            {slides.map((slide, idx) => (
              <div key={slide.id} className={styles.slideCard}>
                <div className={styles.slideImageCol}>
                  {slide.image ? <img src={slide.image} alt="" className={styles.slidePreview} /> : <div className={styles.slidePlaceholder}>No image</div>}
                  <label className={styles.uploadBtn}>
                    {uploadingSlideIdx === idx ? `Uploading… ${progress}%` : slide.image ? "Replace" : "Upload"}
                    <input type="file" accept="image/*" className={styles.fileInput} onChange={(e) => handleSlideImage(idx, e.target.files?.[0])} />
                  </label>
                </div>
                <div className={styles.slideFields}>
                  <Field label="Title" value={slide.title} onChange={(v) => updateSlide(idx, "title", v)} placeholder="Fall Collection" />
                  <Field label="Subtitle" value={slide.subtitle} onChange={(v) => updateSlide(idx, "subtitle", v)} placeholder="Limited run, drops Friday" />
                  <Field label="Link" value={slide.to} onChange={(v) => updateSlide(idx, "to", v)} placeholder="/ or /product/abc123" />
                </div>
                <div className={styles.slideActions}>
                  <button type="button" onClick={() => moveSlide(idx, -1)} disabled={idx === 0} className={styles.iconBtn} aria-label="Move up">↑</button>
                  <button type="button" onClick={() => moveSlide(idx, 1)} disabled={idx === slides.length - 1} className={styles.iconBtn} aria-label="Move down">↓</button>
                  <button type="button" onClick={() => removeSlide(idx)} className={styles.removeBtn}>Remove</button>
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={addSlide} className={styles.addSlideBtn}>+ Add Slide</button>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeading}>
            Featured Products (Bento)
            <span className={styles.slideCount}>{featuredProductIds.length}/{MAX_FEATURED} selected</span>
          </div>
          <p className={styles.hint}>
            First pick renders as the large tile, next two as wide tiles. Order matters — use the arrows.
          </p>

          {featuredProductIds.length > 0 && (
            <div className={styles.featuredOrderList}>
              {featuredProductIds.map((id, idx) => {
                const product = allProducts.find((p) => p.id === id);
                if (!product) return null;
                return (
                  <div key={id} className={styles.featuredOrderRow}>
                    <span className={styles.featuredOrderName}>{idx + 1}. {product.name}</span>
                    <div className={styles.slideActions}>
                      <button type="button" onClick={() => moveFeatured(idx, -1)} disabled={idx === 0} className={styles.iconBtn} aria-label="Move up">↑</button>
                      <button type="button" onClick={() => moveFeatured(idx, 1)} disabled={idx === featuredProductIds.length - 1} className={styles.iconBtn} aria-label="Move down">↓</button>
                      <button type="button" onClick={() => toggleFeatured(id)} className={styles.removeBtn}>Remove</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className={styles.productPicker}>
            {allProducts.map((product) => {
              const isSelected = featuredProductIds.includes(product.id);
              const atCap = !isSelected && featuredProductIds.length >= MAX_FEATURED;
              return (
                <label key={product.id} className={`${styles.pickerRow} ${atCap ? styles.pickerRowDisabled : ""}`}>
                  <input type="checkbox" checked={isSelected} disabled={atCap} onChange={() => toggleFeatured(product.id)} />
                  <span>{product.name}</span>
                </label>
              );
            })}
            {allProducts.length === 0 && <p className={styles.status}>No products yet.</p>}
          </div>
        </section>

        {error && <p className={styles.error} role="alert">{error}</p>}
        {success && <p className={styles.success}>{success}</p>}

        <button type="button" onClick={save} disabled={saving} className={styles.saveBtn}>
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      <input className={styles.input} value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}
