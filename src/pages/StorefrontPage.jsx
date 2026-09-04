import { useState, useMemo }      from "react";
import { useProducts }            from "../hooks/useProducts";
import { useRecentlyViewed }      from "../hooks/useRecentlyViewed";
import { useHomeContent }         from "../hooks/useHomeContent";
import ProductCard                from "../components/ProductCard";
import SearchBar                  from "../components/SearchBar";
import TagFilter                  from "../components/TagFilter";
import SortFilterBar              from "../components/SortFilterBar";
import HomeBanner                 from "../components/HomeBanner";
import HomeCarousel               from "../components/HomeCarousel";
import FeaturedBento              from "../components/FeaturedBento";
import styles                     from "../styles/StorefrontPage.module.css";

const NEW_ARRIVAL_DAYS = 7;

export default function StorefrontPage() {
  const { products, loading, error } = useProducts();
  const { viewedIds }                = useRecentlyViewed();
  const { banner, slides, featuredProductIds } = useHomeContent();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTags,  setActiveTags]  = useState(new Set());
  const [sortBy,      setSortBy]      = useState("newest");
  const [priceMin,    setPriceMin]    = useState("");
  const [priceMax,    setPriceMax]    = useState("");

  const allTags = useMemo(() => {
    const tagSet = new Set();
    products.forEach((p) => (p.tags ?? []).forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [products]);

  const newProductIds = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - NEW_ARRIVAL_DAYS);
    return new Set(
      products.filter((p) => {
        if (!p.createdAt) return false;
        const created = p.createdAt.toDate ? p.createdAt.toDate() : new Date(p.createdAt);
        return created > cutoff;
      }).map((p) => p.id)
    );
  }, [products]);

  const filteredAndSorted = useMemo(() => {
    const q        = searchQuery.toLowerCase().trim();
    const minPrice = priceMin !== "" ? parseFloat(priceMin) : null;
    const maxPrice = priceMax !== "" ? parseFloat(priceMax) : null;

    let result = products.filter((product) => {
      const matchesSearch = !q || product.name.toLowerCase().includes(q) ||
        (product.description ?? "").toLowerCase().includes(q) ||
        (product.tags ?? []).some((t) => t.includes(q));
      const matchesTags = activeTags.size === 0 || [...activeTags].every((tag) => (product.tags ?? []).includes(tag));
      const matchesPrice = (minPrice === null || product.price >= minPrice) && (maxPrice === null || product.price <= maxPrice);
      return matchesSearch && matchesTags && matchesPrice;
    });

    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case "price-asc":  return a.price - b.price;
        case "price-desc": return b.price - a.price;
        case "top-rated":  return (b.avgRating ?? 0) - (a.avgRating ?? 0);
        case "oldest": {
          const aTime = a.createdAt?.toDate?.() ?? new Date(0);
          const bTime = b.createdAt?.toDate?.() ?? new Date(0);
          return aTime - bTime;
        }
        case "newest":
        default: {
          const aTime = a.createdAt?.toDate?.() ?? new Date(0);
          const bTime = b.createdAt?.toDate?.() ?? new Date(0);
          return bTime - aTime;
        }
      }
    });

    return result;
  }, [products, searchQuery, activeTags, sortBy, priceMin, priceMax]);

  const recentlyViewedProducts = useMemo(() => {
    return viewedIds.map((id) => products.find((p) => p.id === id)).filter(Boolean).slice(0, 6);
  }, [viewedIds, products]);

  const featuredProducts = useMemo(() => {
    return (featuredProductIds ?? []).map((id) => products.find((p) => p.id === id)).filter(Boolean);
  }, [featuredProductIds, products]);

  const handleTagToggle = (tag) => {
    setActiveTags((prev) => {
      const next = new Set(prev);
      next.has(tag) ? next.delete(tag) : next.add(tag);
      return next;
    });
  };

  const handleClearAll = () => {
    setSearchQuery(""); setActiveTags(new Set()); setPriceMin(""); setPriceMax(""); setSortBy("newest");
  };

  const isFiltering = searchQuery || activeTags.size > 0 || priceMin !== "" || priceMax !== "" || sortBy !== "newest";

  if (loading) return <div className={styles.status}><p>Loading...</p></div>;
  if (error) return <div className={styles.status}><p>Something went wrong. Please try again.</p></div>;

  return (
    <div>
      {!isFiltering && (
        <>
          {slides.length > 0 && <HomeCarousel slides={slides} />}
          {banner.enabled && (
            <HomeBanner
              eyebrow={banner.eyebrow}
              title={banner.title}
              subtitle={banner.subtitle}
              ctaLabel={banner.ctaLabel}
              ctaTo={banner.ctaTo}
            />
          )}
          <FeaturedBento products={featuredProducts} />
        </>
      )}

      <div className={styles.controls}>
        <SearchBar value={searchQuery} onChange={setSearchQuery} onClear={() => setSearchQuery("")} />
        <TagFilter allTags={allTags} activeTags={activeTags} onToggle={handleTagToggle} onClear={() => setActiveTags(new Set())} />
      </div>

      <SortFilterBar
        sortBy={sortBy} onSortChange={setSortBy}
        priceMin={priceMin} priceMax={priceMax}
        onPriceMinChange={setPriceMin} onPriceMaxChange={setPriceMax}
        onClearPrice={() => { setPriceMin(""); setPriceMax(""); }}
        resultCount={filteredAndSorted.length} totalCount={products.length}
      />

      <div className={styles.header}>
        <h1 className={styles.title}>{isFiltering ? "Results" : "New Arrivals"}</h1>
        <span className={styles.count}>{filteredAndSorted.length} {filteredAndSorted.length === 1 ? "piece" : "pieces"}</span>
      </div>

      {products.length === 0 && <div className={styles.status}><p>No products yet. Check back soon.</p></div>}

      {products.length > 0 && filteredAndSorted.length === 0 && (
        <div className={styles.status}>
          <p>No products match your filters.</p>
          <button onClick={handleClearAll} className={styles.clearBtn}>Clear all filters</button>
        </div>
      )}

      {filteredAndSorted.length > 0 && (
        <div className={styles.grid}>
          {filteredAndSorted.map((product) => (
            <ProductCard key={product.id} product={product} isNew={newProductIds.has(product.id)} />
          ))}
        </div>
      )}

      {recentlyViewedProducts.length > 0 && (
        <div className={styles.recentSection}>
          <h2 className={styles.recentHeading}>Recently Viewed</h2>
          <div className={styles.recentScroll}>
            {recentlyViewedProducts.map((product) => (
              <div key={product.id} className={styles.recentCard}><ProductCard product={product} compact /></div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
