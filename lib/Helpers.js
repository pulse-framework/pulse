export const mapCollection = (collection, properties = []) => {
  if (properties.length == 0) {
    return this.$pulse._collections[collection].data;
  }
  let ret = {};
  properties.forEach(prop => {
    ret[prop] = this.$pulse._collections[collection].data[prop];
  });
  return ret;
};
