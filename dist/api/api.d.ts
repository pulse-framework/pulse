export interface PulseResponse<DataType = any> {
    data: DataType;
    timedout?: boolean;
    status: number;
    raw?: Response;
    type?: string;
}
export interface apiConfig {
    options: RequestInit;
    baseURL?: string;
    path?: string;
    timeout?: number;
    requestIntercept?: Function;
    responseIntercept?: Function;
}
export default class API {
    config: apiConfig;
    constructor(config?: apiConfig);
    /**
     * Override API config and request options. Returns a modified instance this API with overrides applied.
     * @param config - O
     */
    with(config: apiConfig): API;
    get(endpoint: string): Promise<PulseResponse<any>>;
    post(endpoint: string, payload?: any): Promise<PulseResponse<any>>;
    put(endpoint: string, payload?: any): Promise<PulseResponse<any>>;
    patch(endpoint: string, payload?: any): Promise<PulseResponse<any>>;
    delete(endpoint: string, payload?: any): Promise<PulseResponse<any>>;
    private send;
}
export declare const getChannel: (channelId: any) => Promise<PulseResponse<any>>;
