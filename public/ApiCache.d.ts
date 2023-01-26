import { DataTypes, methods } from "./RapixCore";
declare class ApiCache {
    set: (requestID?: string, sentData?: {}, response?: {}, method?: methods) => void;
    get: (requestID?: string, sentData?: {}, timeInSeconds?: number, method?: methods) => DataTypes;
    remove: (requestID?: Array<string> | string) => void;
    constructor({ defaultCacheTimeInSeconds, enabled }: {
        defaultCacheTimeInSeconds?: number | undefined;
        enabled?: boolean | undefined;
    });
}
export default ApiCache;
