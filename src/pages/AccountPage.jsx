import { Link }              from "react-router-dom";
import { useAuth }           from "../hooks/useAuth";
import { useSavedAddresses } from "../hooks/useSavedAddresses";
import styles                from "../styles/AccountPage.module.css";

export default function AccountPage() {
  const { currentUser, isAdmin, logout } = useAuth();
  const { addresses, loading: addressLoading, deleteAddress, setDefaultAddress } = useSavedAddresses();

  if (!currentUser) {
    return (
      <div className={styles.gate}>
        <h1 className={styles.heading}>Account</h1>
        <p className={styles.gateMsg}><Link to="/login" className={styles.gateLink}>Sign in</Link> to view your account.</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.profileCard}>
        {currentUser.photoURL ? (
          <img src={currentUser.photoURL} alt={currentUser.displayName ?? "User"} className={styles.avatar} referrerPolicy="no-referrer" />
        ) : (
          <div className={styles.avatarFallback}>{(currentUser.displayName ?? currentUser.email ?? "?")[0].toUpperCase()}</div>
        )}
        <div className={styles.profileInfo}>
          <p className={styles.profileName}>{currentUser.displayName ?? "ArtWear Customer"}</p>
          <p className={styles.profileEmail}>{currentUser.email}</p>
          {isAdmin && <span className={styles.adminBadge}>Admin</span>}
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionHeading}>My Account</h2>
        <div className={styles.linkList}>
          <Link to="/orders" className={styles.linkRow}><span>Order History</span><span className={styles.linkArrow}>→</span></Link>
          <Link to="/wishlist" className={styles.linkRow}><span>Wishlist</span><span className={styles.linkArrow}>→</span></Link>
          <Link to="/custom-design" className={styles.linkRow}><span>Custom Design</span><span className={styles.linkArrow}>→</span></Link>
          {isAdmin && <Link to="/admin" className={`${styles.linkRow} ${styles.adminLink}`}><span>Admin Dashboard</span><span className={styles.linkArrow}>→</span></Link>}
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionHeading}>Saved Addresses<span className={styles.sectionCount}>{addresses.length}</span></h2>
        {addressLoading && <p className={styles.empty}>Loading addresses...</p>}
        {!addressLoading && addresses.length === 0 && <p className={styles.empty}>No saved addresses yet. Addresses are saved at checkout.</p>}
        <div className={styles.addressList}>
          {addresses.map((addr) => (
            <div key={addr.id} className={`${styles.addressCard} ${addr.isDefault ? styles.addressCardDefault : ""}`}>
              <div className={styles.addressHeader}>
                <span className={styles.addressLabel}>{addr.label ?? "Address"}</span>
                {addr.isDefault && <span className={styles.defaultBadge}>Default</span>}
              </div>
              <p className={styles.addressLine}>{addr.name}</p>
              <p className={styles.addressLine}>{addr.address}</p>
              <p className={styles.addressLine}>{addr.city}, {addr.postalCode}</p>
              {addr.phone && <p className={styles.addressLine}>{addr.phone}</p>}
              <div className={styles.addressActions}>
                {!addr.isDefault && <button onClick={() => setDefaultAddress(addr.id)} className={styles.setDefaultBtn}>Set as default</button>}
                <button onClick={() => { if (window.confirm("Remove this address?")) deleteAddress(addr.id); }} className={styles.deleteAddressBtn}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <button onClick={logout} className={styles.signOutBtn}>Sign Out</button>
      </div>
    </div>
  );
}
