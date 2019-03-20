enumerateAndPerformTask(object, condition, task) {
    let nextToAnalyse = [];
    // prepare loop
    for (let property of Object.keys(object))
      if (condition(object[property]))
        nextToAnalyse.push({
          target: object,
          key: property
        });
    // define loop
    const loop = () => {
      let next = nextToAnalyse;
      nextToAnalyse = [];

      for (let item of next) {
        // find the next eligible children before executing task
        for (let property of Object.keys(item.target[item.key])) {
          if (condition(item.target[item.key][property])) {
            nextToAnalyse.push({
              target: item.target[item.key],
              key: property
            });
          }
        }
        // carry out the task on this property
        task({ parent: item.target, property: item.key });
      }
      if (nextToAnalyse.length > 0) loop();
    };
    // call loop
    loop();
  }

  destroyProxies(object) {
    this.enumerateAndPerformTask(
      object,
      item => this.isWatchableObject(item),
      ({ parent, property }) => {
        // console.log(parent);
        // console.log(property);
        parent[property] = this.retrieveOriginalTarget(parent[property]);
      }
    );
  }

  retrieveOriginalTarget(property) {
    // access the property to trigger the get trap
    property;

    console.log('target should be: ', this._lastProxyTarget);
    // return the full target
    return this._lastProxyTarget;
  }