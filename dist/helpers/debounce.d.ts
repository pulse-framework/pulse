export declare const debounce: <F extends (...args: any[]) => ReturnType<F>>(func: F, wait: number, immediate?: boolean) => (...args: Parameters<F>) => ReturnType<F>;
