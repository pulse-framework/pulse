export const mapCollection = (collection, properties = []) => {
  return function(collection, properties) {
    console.log(this);
    if (properties.length == 0) {
      return this.$pulse._collections[collection].data;
    }
    let ret = {};
    properties.forEach(prop => {
      ret[prop] = this.$pulse._collections[collection].data[prop];
    });
    return ret;
  };
};
