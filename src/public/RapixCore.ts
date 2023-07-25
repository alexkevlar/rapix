import ApiCache from "./ApiCache";
import { traverse } from "traverse-remap";
import { RapixResponse } from "../index";


export type methods = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD' | 'TRACE' | 'CONNECT';

const logColors: { [method in methods]: string } = {
  GET: "rgb(23,157,1)",
  POST: "rgb(181,0,206)",
  PUT: "rgb(255, 128, 62)",
  DELETE: "rgb(187, 1, 37)",
  PATCH: "rgb(0, 109, 201)",
  OPTIONS: "rgb(211,188,38)",
  HEAD: "rgb(64,100,128)",
  TRACE: "rgb(0,201,141)",
  CONNECT: "rgb(154,154,154)"
}

interface FailOption {
  type?: string,
  title?: string,
  status?: number,
  detail?: string,
  instance?: string,

  [key: string]: any
}

export type DataTypes = Record<string, any> | any;


export type ResponseFullData<T> = {
  data: RapixResponse<T>,
  headers: Record<string, any>,
  request: Record<string, any>,
  status: number,
  statusText: string
}

export interface EndpointOptions {
  url: string,
  method?: methods,
  headers?: { [key: string]: any },
  body?: DataTypes,
  cacheToClearAfter?: Array<string> | string,
  onSuccess?: (responseData?: any, response?: any) => void,
  retryIf?: (responseData?: any, response?: any) => boolean,
  test?: (data: any) => boolean,
  always?: (responseData?: any, response?: any) => void,
  onError?: (error?: any, response?: any) => void,
  mock?: {
    success?: { status?: number, [key: string]: any },
    fail?: FailOption,
    forceFail?: boolean,
    ping?: [number, number?] | number
  },
  transformResponse?: (original: any, response: any) => any,
  cacheTime?: number,
  timeout?: number,
  fetchRemote?: boolean
}

interface FetchAPIOptions extends EndpointOptions {
  apiName: string,
  cacheTime: number,
  signalCallback?: any
}

export interface ConfigOptions {
  baseURL: string;
  fetchRemote?: boolean,
  headers?: object,
  debug?: boolean,
  cache?: boolean,
  cacheTime?: number,
  validateStatus?: (status: number) => boolean,
  transformResponse?: (r: any) => any,
  timeout?: number
}

export interface APIOptions {
  settings: (params?: any) => ConfigOptions,
  collection: Record<string, (props?: any) => EndpointOptions>
}

const fn = {

  randomIntFromInterval(min: number, max?: number) { // min and max included

    if (!max) max = min;

    if (window?.crypto) {
      const randomBuffer = new Uint32Array(1);

      crypto.getRandomValues(randomBuffer);

      let randomNumber = randomBuffer[0] / (0xffffffff + 1);

      min = Math.ceil(min);
      max = Math.floor(max);
      return Math.floor(randomNumber * (max - min + 1)) + min;
    } else {
      return Math.floor(Math.random() * (max - min + 1) + min)
    }

  },

}

const mockFailDefaults: FailOption = {
  type: "BadRequest",
  title: "",
  status: 400,
  detail: "",
  instance: ""
}

const endpointOptionsDefaults: EndpointOptions = {
  url: "/",
  method: 'GET'
}

const configOptionsDefaults: ConfigOptions = {
  baseURL: "",
  headers: {
    'Content-Type': 'application/json',
  },
  debug: false,
  fetchRemote: true,
  cache: false,
  cacheTime: 300,
  validateStatus: (status: number) => {
    return status >= 200 && status < 300;
  },
  timeout: 0
}

function canSendBody(method: methods) {
  return method !== 'GET' && method !== 'HEAD' && method !== 'CONNECT' && method !== 'TRACE' && method !== 'OPTIONS';
}


export class ApiClass {

  readonly collection: any;

  private readonly call: any;

  private readonly fetchAPI: (
    {
      url,
      method,
      headers,
      body,
      mock,
      test,
      apiName,
      cacheTime,
      cacheToClearAfter,
      fetchRemote,
      retryIf
    }: FetchAPIOptions
  ) => (any);


  private readonly pendingPromise: {
    store: { [key: string]: any },
    remove: (endpoint: string, method: string, sentData: object | string | undefined) => {},
    get: (endpoint: string, method: string, sentData: object | string | undefined) => {},
    set: (endpoint: string, method: string, sentData: object | string | undefined, promise: any) => {}
  } = {

    store: {

      /**
       * Qui aggiungo tutte le promise delle chiamate API per evitare di effettuare più volte
       * la stessa chiamata verso il backend fino a quando non viene ricevuto l'esito della prima.
       *
       * Quando viene effettuata una stessa chiamata, se il frontend ne individua una identica già in pendenza,
       * fa sì che quella richiesta si agganci all'attesa della risposta della precedente promise.
       *
       * Ciò significa che se effettuiamo una stessa chiamata API da due componenti diversi nello stesso momento,
       * la stessa response verrà distribuita a entrambi i componenti non appena risponde con successo la prima delle due.
       */

    },

    remove: (endpoint = '', method = '', sentData = {}): any => delete this.pendingPromise.store[endpoint + '||' + JSON.stringify(sentData)],

    get: (endpoint = '', method = '', sentData = {}) => this.pendingPromise.store[endpoint + '||' + JSON.stringify(sentData)],

    set: (endpoint = '', method = '', sentData = {}, promise: any): any => {
      if (typeof sentData === 'object') {
        const sData = endpoint + '||' + JSON.stringify(sentData);
        if (!this.pendingPromise.store[sData]) this.pendingPromise.store[sData] = promise;
      }
    }

  }


  constructor(props: { settings: any, collection: any }) {

    this.collection = {};

    const { settings, collection } = props;
    const {
      cacheTime = configOptionsDefaults.cacheTime,
      cache,
      debug = false,
      timeout = configOptionsDefaults.timeout,
      transformResponse
    } = settings("init");

    const defaultTransform = transformResponse;
    const Cache = new ApiCache({ defaultCacheTimeInSeconds: cacheTime, enabled: cache === true });

    const extractData = (data: any) => {
      const { url, method, apiName, headers, body } = data;
      return { url, method, apiName, headers, body };
    }

    this.fetchAPI = (
      {
        url,
        signalCallback,
        method = 'GET',
        headers,
        body,
        mock,
        test,
        apiName,
        cacheTime,
        cacheToClearAfter = [],
        onError,
        onSuccess,
        always,
        transformResponse,
        fetchRemote,
        retryIf
      }
    ) => {

      const startTime = new Date();


      const transformData = (response: DataTypes) => {

        let _response: DataTypes = JSON.parse(JSON.stringify(response));

        if (typeof defaultTransform === 'function') {
          _response = defaultTransform(_response);
        }

        if (typeof transformResponse === 'function') {
          _response = transformResponse(_response, JSON.parse(JSON.stringify(response)));
        }

        if (_response?.status) delete _response.status;

        return { _response, __original: JSON.parse(JSON.stringify(response)) }

      }


      const responseData = (response: DataTypes, isCache: boolean = false, __original: DataTypes) => {

        const time = new Date();

        return {
            response, __original, ...{
            __reqTime: startTime.getTime(),
            __resTime: time.getTime(),
            __ping: time.getTime() - startTime.getTime(),
            __cached: isCache
          }
        };

      }


      const promise = (data: FetchAPIOptions) => new Promise((resolve, reject) => {

        // setup AbortController
        const controller = new AbortController();

        // signal to pass to fetch
        const signal = controller.signal;

        const api_setting: any = { ...configOptionsDefaults, ...settings(data) };
        const header = { ...configOptionsDefaults.headers, ...api_setting?.headers, ...headers };

        Object.keys(header).forEach((key) => {
          if (!header[key]) delete header[key];
        })

        if (body && typeof body === 'object') body = traverse(body, value => typeof value === 'string' ? value.trim() : value);

        const requestOptions = {
          headers: header,
          signal,
          method, ...(body && canSendBody(method) && { body: typeof body === 'string' ? body : JSON.stringify(body) })
        };

        const endPoint = url.indexOf('http') >= 0 ? url : `${api_setting.baseURL}${url}`;

        if (debug) console.log(`%c${method} ->`, `font-weight: bold; font-size: 12px; color: ${logColors[method]}`, {
          resource: url,
          endpoint: endPoint,
          payload: requestOptions, ...(body && { body })
        });

        const handleSuccess = (resData: any, response: any, resolve: (r: any) => {} | any) => {
          // Svuoto l'eventuale cache sulla GET se dopo una PUT o una DELETE richiedo di pulirla
          if (cacheToClearAfter.length > 0) Cache.remove(cacheToClearAfter);

          Cache.set(url, body, resData, method);

          const { _response, __original } = transformData(resData);

          let rData = responseData(_response, false, __original);
          if (debug) console.log(`%c<- ${method}`, `font-weight: bold; font-size: 12px; color: ${logColors[method]}`, {
            resource: url,
            endpoint: endPoint,
            response: rData
          });

          const fullResponse = {
            data: rData,
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            request: requestOptions/*, config: ''*/
          }

          resolve(fullResponse);
          if (typeof onSuccess === 'function') onSuccess(rData, fullResponse);

        }

        const handleError = (resData: {}, response: any, reject: (r: any) => {} | any, status: number) => {
          const rData = responseData(resData, false, resData);
          const fullResponse = {
            data: rData,
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            request: requestOptions/*, config: ''*/
          }

          if (debug && status > 0) console.error(`<- error ${method}`, {
            resource: url,
            endpoint: endPoint,
            response: rData
          });

          if (typeof retryIf === 'function' && retryIf(resData, { ...response, status })) {
            tryCall();
          } else {
            reject(fullResponse)
          }

          if (typeof onError === 'function') onError(rData, fullResponse);
        }

        const handleResponse = (props: {
          responseData: any,
          response: any,
          status: number,
          resolve: any,
          reject: any
        }) => {
          const { responseData, response, status, resolve, reject } = props;

          if (typeof retryIf === 'function' && retryIf(responseData, { ...response, status })) {
            //
          } else {
            this.pendingPromise.remove(apiName, method, extractData(data));
          }

          if (api_setting.validateStatus(status)) {
            handleSuccess(responseData, response, resolve);
          } else {
            handleError(responseData, response, reject, status);
          }

          if (typeof always === 'function') always(responseData, response);
        }

        const pingMin = typeof mock?.ping === 'number' ? mock.ping : mock?.ping?.[0] || 350;
        const pingMax = typeof mock?.ping === 'number' ? mock.ping : mock?.ping?.[1] || 500;

        const tryCall = () => {
          if (api_setting?.fetchRemote === true && fetchRemote !== false || fetchRemote === true) {

            signalCallback(controller);
            const id = timeout && setTimeout(() => controller.abort(), timeout);

            fetch(endPoint, requestOptions).catch((e) => {
              handleResponse({ responseData: { error: e }, response: e, status: -1, resolve, reject })
            })
            .then((r: any) => {

              clearTimeout(id);

              function parseResponse(response: any) {

                return new Promise((resolve, reject) => {
                  if (response) {
                    const _r = response.clone();
                    _r.json().then(() => {
                      resolve(response.clone().json())
                    }).catch(() => {
                      resolve(response.clone().text())
                    })
                  } else {
                    reject({ detail: 'Generic error' });
                  }
                })

              }

              return {
                res: (r && r?.status) ? parseResponse(r) : {
                  then(onfulfilled: any, onrejected: any) {
                    const res = parseResponse(r);
                    if (res) {
                      res.then((_r: any) => {
                        onrejected(_r);
                      }, () => {
                        onrejected({ detail: 'Endpoint not reachable' });
                      })
                    }
                  }
                }, r
              }

            })
            .then(({ res, r }) => {

              res.then((content: any) => {
                handleResponse({ responseData: content, response: r, status: r.status, resolve, reject })
              }, (content: any) => {
                handleResponse({ responseData: content, response: {}, status: r.status, resolve, reject })
              })

            }, (e) => reject({ data: e.data, status: e.status }))

          } else {
            let to = false;

            let id = timeout && setTimeout(() => {
              console.error('Timeout');
              handleResponse({ responseData: { error: `Timeout` }, response: {}, status: -2, resolve, reject });
              to = true;
              ctrl.abort = () => void 0;
            }, timeout);

            const ctrl = {
              abort: () => {
                clearTimeout(id);
                handleResponse({
                  responseData: { error: `The user aborted a request` },
                  response: {},
                  status: -3,
                  resolve,
                  reject
                });
                to = true;
                ctrl.abort = () => {
                }
              }
            }
            signalCallback(ctrl);

            setTimeout(() => {

              clearTimeout(id);
              ctrl.abort = () => void 0;

              if (!to) {
                let r;

                if (mock?.forceFail) {
                  mock.fail = { ...mockFailDefaults, ...mock.fail };
                  r = {
                    status: mock.fail.status,
                    response: { ...mock.fail, ...{ instance: mock.fail?.instance || url } }
                  };
                } else {
                  r = { status: mock?.success?.status || 200, response: mock?.success };
                }

                handleResponse({
                  responseData: r.response,
                  response: r,
                  status: r.status || mockFailDefaults.status || 400,
                  resolve,
                  reject
                });
              }

            }, fn.randomIntFromInterval(pingMin, pingMax));

          }
        }

        tryCall();

      });

      const data = {
        ...endpointOptionsDefaults, ...{
          url,
          signal: {},
          method, ...(headers && { headers }), ...(body && { body }),
          mock, ...(test && { test }),
          apiName,
          cacheTime,
          cacheToClearAfter
        }
      };

      const cache = Cache.get(url, body, cacheTime, method);

      const pendingData = extractData(data);

      if (!cache) {

        if (!this.pendingPromise.get(apiName, method, pendingData)) {

          /**
           * Aggiungo la chiamata allo store di chiamate in attesa per poter verificare successivamente
           * che la chiamata sia già stata effettuata ed è solo in attesa di risposta
           */

          this.pendingPromise.set(apiName, method, pendingData, promise(data));

        }

        return this.pendingPromise.get(apiName, method, pendingData);

      } else {

        if (debug) console.log(`%c${method} ->`, `font-weight: bold; font-size: 12px; color: ${logColors[method]}`, { resource: url, ...(body && { body }) });

        return new Promise((resolve) => {

          const { _response, __original } = transformData(cache);
          delete __original.__cacheExp;

          const response = responseData(_response, true, __original);

          const api_setting: any = { ...configOptionsDefaults, ...settings(data) };
          const endPoint = url.indexOf('http') >= 0 ? url : `${api_setting.baseURL}${url}`;

          if (debug) console.log("%c<- cached", 'font-weight: bold; font-size: 12px;color: rgb(66, 165, 244)', {
            resource: url,
            endpoint: endPoint,
            response
          });

          const fullResponse = {
            data: response,
            headers: {},
            status: 200,
            statusText: "OK",
            request: data
          }

          resolve(fullResponse);

          if (typeof onSuccess === 'function') onSuccess(response, fullResponse);

        })

      }


    }

    /**
     *
     * @param data
     * @param api
     * @returns {Promise<any>}
     */

    this.call = (data: any, apiName: string, api: any, signalCallback: any): Promise<any> => {

      if (typeof api.test === 'function') {

        if (!api.test(data)) {
          console.error(`${apiName}: test not passed`);
          return Promise.reject(`${apiName}: test not passed`)
        } else {
          return this.fetchAPI({
            ...api,
            signalCallback,
            apiName,
            cacheTime: api.cacheTime >= 0 ? api.cacheTime : cacheTime
          });
        }

      } else {
        return this.fetchAPI({
          ...api,
          signalCallback,
          apiName,
          cacheTime: api.cacheTime >= 0 ? api.cacheTime : cacheTime
        })
      }
    }

    Object.keys(collection).forEach((apiname: string) => {

      let controller: any = {};

      this.collection[apiname] = (data: any) => {

        let call = this.call(data, apiname, collection[apiname](data), (ctrl: any) => {
          controller = ctrl;
        });

        const returnObj = {
          onSuccess: (fn: any) => {
            call.then((r: any) => {
              fn(r?.data, r);
            });
            return returnObj;
          },
          onError: (fn: any) => {
            call.then(() => {
            }, (r: any) => {
              fn(r?.data, r);
            })
            return returnObj;
          },
          always: (fn: any) => {
            call.then((r: any) => {
              fn(r?.data, r);
            }, (r: any) => {
              fn(r?.data, r);
            })
            return returnObj;
          },
          abort: () => typeof controller.abort === 'function' ? controller.abort() : () => {
          },
          then: (onSuccess: any, onError: any) => {
            call.then((r: any) => {
              onSuccess(r?.data, r);
            }, (r: any) => {
              onError(r?.data, r);
            });
            return returnObj;
          }
        };

        return returnObj;

      };
    })
  }

}

export const APIOptionsDefaults: APIOptions = {
  settings: () => configOptionsDefaults,
  collection: {}
}