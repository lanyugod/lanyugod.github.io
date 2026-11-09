/** Public media is opt-in. Credentials, private NAS addresses and arbitrary proxies never enter the build. */
export function normalizeOrigin(value = '') {
  if (!value.trim()) return '';
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new Error('PUBLIC_MEDIA_ORIGIN must be an HTTPS origin without credentials, path, query or fragment.');
  }
  return url.origin;
}
export function mediaUrl(path, origin = '') {
  const base = normalizeOrigin(origin);
  // Site branding remains local so the blog remains recognizable when the NAS is offline.
  const eligible = /^\/images\/(posts|gallery)\//.test(path);
  return base && eligible ? new URL(path, base).href : path;
}
export function rehypeMedia({ origin = '' } = {}) {
  const base = normalizeOrigin(origin);
  return (tree) => {
    function visit(node) {
      if (node.type === 'element' && node.tagName === 'img' && typeof node.properties?.src === 'string') {
        node.properties.src = mediaUrl(node.properties.src, base);
        node.properties.loading = 'lazy';
        node.properties.decoding = 'async';
      }
      for (const child of node.children || []) visit(child);
    }
    visit(tree);
  };
}
