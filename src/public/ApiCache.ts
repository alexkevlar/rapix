import { DataTypes, methods } from "./RapixCore";

class ApiCache {

  public set: (requestID?: string, sentData?: {}, response?: {}, method?: methods) => void;
  public get: (requestID?: string, sentData?: {}, timeInSeconds?: number, method?: methods) => DataTypes;
  public remove: (requestID?: Array<string> | string) => void;

  constructor({defaultCacheTimeInSeconds = 300, enabled = false}) {

    // Cache object
    // Here we will temporarily save all response data
    const __cacheStore: { [key: string]: any } = {};

    // Time in seconds within which a response remains in the cache
    const cacheTime: number = defaultCacheTimeInSeconds;

    const excludedMethods: methods[] = ['POST', 'PUT', 'DELETE', 'PATCH', 'CONNECT', 'OPTIONS', 'TRACE'];

    const cacheEnabled: boolean = enabled;


    this.set = (requestID = '', sentData = {}, response = {}, method = 'GET') => {
  
      let excludeMethod = excludedMethods.length > 0 ? (excludedMethods.indexOf(method) >= 0) : false;
      let sData = JSON.stringify(sentData) || "__default";

      if (cacheEnabled && requestID !== '' && !excludeMethod) {
        if (typeof response === 'object') {
          let r = JSON.parse(JSON.stringify(response));
          r.__cacheExp = new Date().getTime();

          if (__cacheStore[requestID]) {
            __cacheStore[requestID][sData] = r;
          } else {
            __cacheStore[requestID] = {
              [sData]: r
            };
          }
        }
      }

    }


    this.get = (requestID = '', sentData = {}, timeInSeconds = cacheTime, method = 'GET'): any => {

      let excludeMethod = excludedMethods.length > 0 ? (excludedMethods.indexOf(method) >= 0) : false;

      if (cacheEnabled && requestID !== '' && !excludeMethod) {
        let sData = JSON.stringify(sentData);
        let responseCache = false;

        if (sData) {
          const cachedResponse = __cacheStore.hasOwnProperty(requestID) ? __cacheStore[requestID].hasOwnProperty(sData) ? __cacheStore[requestID][sData] : {} : {};

          if (cachedResponse.hasOwnProperty('__cacheExp')) {
            const now = new Date().getTime();
            if (cachedResponse.__cacheExp >= now - timeInSeconds * 1000) {
              responseCache = JSON.parse(JSON.stringify(cachedResponse));
            }
          }
        }
        return responseCache;
      } else {
        return false;
      }

    }


    this.remove = (cacheToRemove: Array<string> | string = []) => {

      Object.keys(__cacheStore).forEach((value) => {
        if (typeof cacheToRemove === 'string') {
          delete __cacheStore[cacheToRemove];
        } else {
          cacheToRemove.forEach((key) => {
            if (value.indexOf(key) >= 0) delete __cacheStore[value]
          })
        }
      })

    }

  }

}

export default ApiCache;
