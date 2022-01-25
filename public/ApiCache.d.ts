declare class ApiCache {
    set: (requestType?: string, sentData?: {}, response?: {}, method?: string) => void;
    get: (requestType?: string, sentData?: {}, timeInSeconds?: number) => false | object;
    remove: (requestType?: Array<string> | string) => void;
    constructor({ defaultCacheTimeInSeconds, enabled }: {
        defaultCacheTimeInSeconds?: number | undefined;
        enabled?: boolean | undefined;
    });
}
export default ApiCache;
