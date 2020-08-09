interface DebouncedFunction {
  (): any;
  cancel: () => void;
}

export const debounce = <F extends (...args: any[]) => ReturnType<F>>(func: F, wait: number, immediate?: boolean) => {
  let timeout: number = 0;

  const debounced: DebouncedFunction = function (this: void) {
    const context: any = this;
    const args = arguments;

    const later = function () {
      timeout = 0;
      if (!immediate) func.call(context, ...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = window.setTimeout(later, wait);
    if (callNow) func.call(context, ...args);
  };

  debounced.cancel = function () {
    clearTimeout(timeout);
    timeout = 0;
  };

  return debounced as (...args: Parameters<F>) => ReturnType<F>;
};
