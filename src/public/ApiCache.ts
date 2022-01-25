class ApiCache {

  public set: (requestType?: string, sentData?: {}, response?: {}, method?: string) => void;
  public get: (requestType?: string, sentData?: {}, timeInSeconds?: number) => false | object;
  public remove: (requestType?: Array<string> | string) => void;

  constructor({defaultCacheTimeInSeconds = 300, enabled = false}) {

    // Cache object
    // Here we will temporarily save all response data
    const __cacheStore: { [key: string]: any } = {};

    // Time in seconds within which a response remains in the cache
    const cacheTime: number = defaultCacheTimeInSeconds;

    const excludedMethods: string[] = ['POST', 'PUT', 'DELETE'];

    const cacheEnabled: boolean = enabled;


    this.set = (requestType = '', sentData = {}, response = {}, method = '') => {

      let excludeMethod = excludedMethods.length > 0 ? (excludedMethods.indexOf(method) >= 0) : false;
      let sData = JSON.stringify(sentData) || "__default";

      if (cacheEnabled && requestType !== '' && !excludeMethod) {
        if (typeof response === 'object') {
          let r = JSON.parse(JSON.stringify(response));
          r.__cacheExp = new Date().getTime();

          if (__cacheStore[requestType]) {
            __cacheStore[requestType][sData] = r;
          } else {
            __cacheStore[requestType] = {
              [sData]: r
            };
          }
        }
      }

    }


    this.get = (requestType = '', sentData = {}, timeInSeconds = cacheTime): any => {

      if (cacheEnabled && requestType !== '') {
        let sData = JSON.stringify(sentData);
        let responseCache = false;

        if (sData) {
          const cachedResponse = __cacheStore.hasOwnProperty(requestType) ? __cacheStore[requestType].hasOwnProperty(sData) ? __cacheStore[requestType][sData] : {} : {};

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
