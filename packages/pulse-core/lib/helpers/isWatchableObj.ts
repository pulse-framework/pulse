export function isWatchableObject(value) {
  function isHTMLElement(obj) {
    try {
      return obj instanceof HTMLElement;
    } catch (e) {
      return typeof obj === 'object' && obj.nodeType === 1 && typeof obj.style === 'object' && typeof obj.ownerDocument === 'object';
    }
  }
  let type = typeof value;
  return value != null && type == 'object' && !isHTMLElement(value) && !Array.isArray(value);
}
