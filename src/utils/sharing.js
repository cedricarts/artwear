export async function shareProduct(product) {
  const url   = `${window.location.origin}/product/${product.id}`;
  const title = product.name;
  const text  = `Check out ${product.name} on ArtWear`;

  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return "shared";
    } catch {
      return "cancelled";
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    return "copied";
  } catch {
    return "error";
  }
}
