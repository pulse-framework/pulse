import Pulse from '..';
import State from '../state';
declare type keyedState = {
    [key: string]: State;
};
declare const _default: {
    name: string;
    bind(pulseConstructor: any): void;
    updateMethod(componentInstance: any, updatedData: Object): void;
    onReady(pulseInstance: any | Pulse): void;
};
export default _default;
/**
 *
 * @param deps Can either be a string or an array of strings set equal to the same of the pulse objects defined in Vue.use()
 * @param pulseInstance The pulse container to look at if you want to use a different SSOT
 */
export declare function usePulse(deps: Array<string | State | keyedState> | string | State, pulseInstance?: Pulse): any;
