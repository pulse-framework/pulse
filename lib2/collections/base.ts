import Collection from "../collection";
import { Global, RootCollectionObject } from "../interfaces";

export default class Request extends Collection {
  constructor(global: Global, root: RootCollectionObject = {}) {
    root = Object.assign({}, root);

    delete root.collections;
    delete root.request;

    if (!root.data) root.data = {};
    if (!root.persist) root.persist = [];

    root.data["isAuthenticated"] = false;
    root.data["appReady"] = false;

    root.persist.push("isAuthenticated");

    console.log(root);
    super("base", global, root);
  }
}
