declare class ApiCache {
    set: (requestID?: string, sentData?: {}, response?: {}, method?: string) => void;
    get: (requestID?: string, sentData?: {}, timeInSeconds?: number) => false | object;
    remove: (requestID?: Array<string> | string) => void;
    constructor({ defaultCacheTimeInSeconds, enabled }: {
        defaultCacheTimeInSeconds?: number | undefined;
        enabled?: boolean | undefined;
    });
}
export default ApiCache;
