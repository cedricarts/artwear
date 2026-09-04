import { useState }             from "react";
import { Link, useNavigate }    from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db }                   from "../firebase/firebase";
import { useAuth }              from "../hooks/useAuth";
import GarmentPreview           from "../components/GarmentPreview";
import { GARMENT_TEMPLATES, GARMENT_COLOURS, STRIPE_COLOUR_PRESETS, getPhotoUrl } from "../config/garments";
import styles                   from "../styles/CustomDesignPage.module.css";

const DEFAULT_DESIGN = { template: "tshirt", garmentColor: "#111111", stripeColor: "#f5f5f5" };

export default function CustomDesignPage() {
  const { currentUser } = useAuth();
  const navigate        = useNavigate();

  const [design,     setDesign]     = useState(DEFAULT_DESIGN);
  const [notes,      setNotes]      = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState(null);

  if (!currentUser) {
    return (
      <div className={styles.gate}>
        <h1 className={styles.gateHeading}>Custom Design</h1>
        <p className={styles.gateMsg}><Link to="/login" className={styles.gateLink}>Sign in</Link> to submit a custom design request.</p>
      </div>
    );
  }

  const update = (field, value) => setDesign((prev) => ({ ...prev, [field]: value }));

  const garmentColorKey = GARMENT_COLOURS.find((c) => c.hex === design.garmentColor)?.key ?? "black";
  const photoUrl = getPhotoUrl(design.template, garmentColorKey);
  const selectedTemplate = GARMENT_TEMPLATES.find((t) => t.key === design.template);
  const selectedGarmentColour = GARMENT_COLOURS.find((c) => c.hex === design.garmentColor);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await addDoc(collection(db, "designRequests"), {
        uid: currentUser.uid,
        displayName: currentUser.displayName ?? currentUser.email.split("@")[0],
        email: currentUser.email,
        customisation: { ...design, garmentColorKey, garmentColorLabel: selectedGarmentColour?.label ?? "Unknown", templateLabel: selectedTemplate?.label ?? "Unknown" },
        notes: notes.trim(),
        status: "pending",
        createdAt: serverTimestamp(),
      });
      navigate("/design-success");
    } catch (err) {
      console.error("Design request failed:", err);
      setError("Failed to submit your request. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.heading}>Custom Design</h1>
        <p className={styles.subheading}>Design your one-of-one piece. Every custom is made once — never reproduced.</p>
      </div>

      <div className={styles.layout}>
        <form onSubmit={handleSubmit} className={styles.controls}>
          <section className={styles.section}>
            <h2 className={styles.sectionLabel}>Garment</h2>
            <div className={styles.templateGrid}>
              {GARMENT_TEMPLATES.map((t) => (
                <button key={t.key} type="button" onClick={() => update("template", t.key)} className={`${styles.templateBtn} ${design.template === t.key ? styles.selected : ""}`}>
                  <span className={styles.templateIcon}>{t.icon}</span>
                  <span className={styles.templateLabel}>{t.label}</span>
                </button>
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionLabel}>Garment colour<span className={styles.selectedLabel}>{selectedGarmentColour?.label}</span></h2>
            <div className={styles.swatchRow}>
              {GARMENT_COLOURS.map((colour) => (
                <button key={colour.key} type="button" onClick={() => update("garmentColor", colour.hex)} className={`${styles.swatch} ${design.garmentColor === colour.hex ? styles.swatchActive : ""}`} style={{ backgroundColor: colour.hex }} aria-label={colour.label} title={colour.label} />
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionLabel}>Stripe colour<span className={styles.stripePreview} style={{ backgroundColor: design.stripeColor }} /></h2>
            <div className={styles.swatchRow}>
              {STRIPE_COLOUR_PRESETS.map((colour) => (
                <button key={colour.hex} type="button" onClick={() => update("stripeColor", colour.hex)} className={`${styles.swatch} ${design.stripeColor === colour.hex ? styles.swatchActive : ""}`} style={{ backgroundColor: colour.hex }} aria-label={colour.label} title={colour.label} />
              ))}
            </div>
            <div className={styles.colourPickerRow}>
              <label htmlFor="stripeColorPicker" className={styles.pickerLabel}>Custom colour</label>
              <input id="stripeColorPicker" type="color" value={design.stripeColor} onChange={(e) => update("stripeColor", e.target.value)} className={styles.colourPicker} aria-label="Choose stripe colour" />
              <span className={styles.colourHex}>{design.stripeColor}</span>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionLabel}>Notes<span className={styles.optionalTag}>optional</span></h2>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={styles.textarea} placeholder="Any additional details — size, special requests, inspiration..." rows={4} maxLength={500} />
            <span className={styles.charCount}>{notes.length} / 500</span>
          </section>

          {error && <p className={styles.error} role="alert">{error}</p>}

          <button type="submit" className={styles.submitBtn} disabled={submitting}>{submitting ? "Submitting..." : "Submit Design Request"}</button>
          <p className={styles.disclaimer}>Once approved, your design will be produced as a single unique piece and listed on the store. You'll be notified when it's available.</p>
        </form>

        <div className={styles.previewCol}>
          <p className={styles.previewLabel}>Live preview</p>
          <GarmentPreview template={design.template} garmentColor={design.garmentColor} stripeColor={design.stripeColor} photoUrl={photoUrl} />
          <div className={styles.previewSummary}>
            <p className={styles.summaryLine}>{selectedTemplate?.label}</p>
            <p className={styles.summaryLine}>{selectedGarmentColour?.label} · Custom stripe</p>
          </div>
        </div>
      </div>
    </div>
  );
}
