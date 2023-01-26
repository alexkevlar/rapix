"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.APIOptionsDefaults = exports.ApiClass = void 0;
const ApiCache_1 = __importDefault(require("./ApiCache"));
const traverse_remap_1 = require("traverse-remap");
const logColors = {
    GET: "rgb(23,157,1)",
    POST: "rgb(181,0,206)",
    PUT: "rgb(255, 128, 62)",
    DELETE: "rgb(187, 1, 37)",
    PATCH: "rgb(0, 109, 201)",
    OPTIONS: "rgb(211,188,38)",
    HEAD: "rgb(64,100,128)",
    TRACE: "rgb(0,201,141)",
    CONNECT: "rgb(154,154,154)"
};
const fn = {
    randomIntFromInterval(min, max) {
        if (!max)
            max = min;
        if (window === null || window === void 0 ? void 0 : window.crypto) {
            const randomBuffer = new Uint32Array(1);
            crypto.getRandomValues(randomBuffer);
            let randomNumber = randomBuffer[0] / (0xffffffff + 1);
            min = Math.ceil(min);
            max = Math.floor(max);
            return Math.floor(randomNumber * (max - min + 1)) + min;
        }
        else {
            return Math.floor(Math.random() * (max - min + 1) + min);
        }
    }
};
const mockFailDefaults = {
    type: "BadRequest",
    title: "",
    status: 400,
    detail: "",
    instance: ""
};
const endpointOptionsDefaults = {
    url: "/",
    method: 'GET'
};
const configOptionsDefaults = {
    baseURL: "http://127.0.0.1",
    headers: {
        'Content-Type': 'application/json',
    },
    debug: false,
    fetchRemote: true,
    cache: false,
    cacheTime: 300,
    validateStatus: (status) => {
        return status >= 200 && status < 300;
    },
    timeout: 0
};
function canSendBody(method) {
    return method !== 'GET' && method !== 'HEAD' && method !== 'CONNECT' && method !== 'TRACE' && method !== 'OPTIONS';
}
class ApiClass {
    constructor(props) {
        this.pendingPromise = {
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
            remove: (endpoint = '', method = '', sentData = {}) => delete this.pendingPromise.store[endpoint + '||' + JSON.stringify(sentData)],
            get: (endpoint = '', method = '', sentData = {}) => this.pendingPromise.store[endpoint + '||' + JSON.stringify(sentData)],
            set: (endpoint = '', method = '', sentData = {}, promise) => {
                if (typeof sentData === 'object') {
                    const sData = endpoint + '||' + JSON.stringify(sentData);
                    if (!this.pendingPromise.store[sData])
                        this.pendingPromise.store[sData] = promise;
                }
            }
        };
        this.collection = {};
        const { settings, collection } = props;
        const { cacheTime = configOptionsDefaults.cacheTime, cache, debug = false, timeout = configOptionsDefaults.timeout, transformResponse } = settings("init");
        const defaultTransform = transformResponse;
        const Cache = new ApiCache_1.default({ defaultCacheTimeInSeconds: cacheTime, enabled: cache === true });
        const extractData = (data) => {
            const { url, method, apiName, headers, body } = data;
            return { url, method, apiName, headers, body };
        };
        this.fetchAPI = ({ url, signalCallback, method = 'GET', headers, body, mock, test, apiName, cacheTime, cacheToClearAfter = [], onError, onSuccess, always, transformResponse, retryIf }) => {
            const startTime = new Date();
            const responseData = (response, isCache = false) => {
                const time = new Date();
                let _original = typeof response === "object" ? Object.assign({}, response) : { response }.response;
                if (typeof transformResponse === 'function') {
                    response = transformResponse(response);
                }
                else if (typeof defaultTransform === 'function') {
                    response = defaultTransform(response);
                }
                return Object.assign({ response, _original }, {
                    __reqTime: startTime.getTime(),
                    __resTime: time.getTime(),
                    __ping: time.getTime() - startTime.getTime(),
                    __cached: isCache
                });
            };
            const promise = (data) => new Promise((resolve, reject) => {
                var _a, _b;
                // setup AbortController
                const controller = new AbortController();
                // signal to pass to fetch
                const signal = controller.signal;
                const api_setting = Object.assign(Object.assign({}, configOptionsDefaults), settings(data));
                const header = Object.assign(Object.assign(Object.assign({}, configOptionsDefaults.headers), api_setting === null || api_setting === void 0 ? void 0 : api_setting.headers), headers);
                Object.keys(header).forEach((key) => {
                    if (!header[key])
                        delete header[key];
                });
                if (body && typeof body === 'object')
                    body = (0, traverse_remap_1.traverse)(body, value => typeof value === 'string' ? value.trim() : value);
                const requestOptions = Object.assign({ headers: header, signal,
                    method }, (body && canSendBody(method) && { body: typeof body === 'string' ? body : JSON.stringify(body) }));
                const endPoint = url.indexOf('http') >= 0 ? url : `${api_setting.baseURL}${url}`;
                if (debug)
                    console.log(`%c${method} ->`, `font-weight: bold; font-size: 12px; color: ${logColors[method]}`, Object.assign({ resource: url, endpoint: endPoint, payload: requestOptions }, (body && { body })));
                const handleSuccess = (resData, response, resolve) => {
                    // Svuoto l'eventuale cache sulla GET se dopo una PUT o una DELETE richiedo di pulirla
                    if (cacheToClearAfter.length > 0)
                        Cache.remove(cacheToClearAfter);
                    Cache.set(url, body, resData, method);
                    if (resData === null || resData === void 0 ? void 0 : resData.status)
                        delete resData.status;
                    let rData = responseData(resData);
                    if (debug)
                        console.log(`%c<- ${method}`, `font-weight: bold; font-size: 12px; color: ${logColors[method]}`, { resource: url, endpoint: endPoint, response: rData });
                    resolve(rData);
                    if (typeof onSuccess === 'function')
                        onSuccess(rData, {
                            data: rData,
                            status: response.status,
                            statusText: response.statusText,
                            headers: response.headers,
                            request: requestOptions /*, config: ''*/
                        });
                };
                const handleError = (resData, response, reject, status) => {
                    const rData = responseData(resData);
                    if (debug && status > 0)
                        console.error(`<- error ${method}`, { resource: url, endpoint: endPoint, response: rData });
                    if (typeof retryIf === 'function' && retryIf(resData, Object.assign(Object.assign({}, response), { status }))) {
                        tryCall();
                    }
                    else {
                        reject(rData);
                    }
                    if (typeof onError === 'function')
                        onError(rData, {
                            data: rData,
                            status: response.status,
                            statusText: response.statusText,
                            headers: response.headers,
                            request: requestOptions /*, config: ''*/
                        });
                };
                const handleResponse = (props) => {
                    const { responseData, response, status, resolve, reject } = props;
                    if (typeof retryIf === 'function' && retryIf(responseData, Object.assign(Object.assign({}, response), { status }))) {
                        //
                    }
                    else {
                        this.pendingPromise.remove(apiName, method, extractData(data));
                    }
                    if (api_setting.validateStatus(status)) {
                        handleSuccess(responseData, response, resolve);
                    }
                    else {
                        handleError(responseData, response, reject, status);
                    }
                    if (typeof always === 'function')
                        always(responseData, response);
                };
                const pingMin = typeof (mock === null || mock === void 0 ? void 0 : mock.ping) === 'number' ? mock.ping : ((_a = mock === null || mock === void 0 ? void 0 : mock.ping) === null || _a === void 0 ? void 0 : _a[0]) || 350;
                const pingMax = typeof (mock === null || mock === void 0 ? void 0 : mock.ping) === 'number' ? mock.ping : ((_b = mock === null || mock === void 0 ? void 0 : mock.ping) === null || _b === void 0 ? void 0 : _b[1]) || 500;
                const tryCall = () => {
                    if ((api_setting === null || api_setting === void 0 ? void 0 : api_setting.fetchRemote) === true) {
                        signalCallback(controller);
                        const id = timeout && setTimeout(() => controller.abort(), timeout);
                        fetch(endPoint, requestOptions).catch((e) => {
                            handleResponse({ responseData: { error: e }, response: e, status: -1, resolve, reject });
                        })
                            .then((r) => {
                            clearTimeout(id);
                            function parseResponse(response) {
                                const _r = response.clone();
                                return requestOptions.headers["Content-Type"] === "application/json" && api_setting.validateStatus(_r.status) ? _r.json() : _r.text();
                            }
                            return {
                                res: (r && (r === null || r === void 0 ? void 0 : r.status)) ? parseResponse(r) : {
                                    then(onfulfilled, onrejected) {
                                        const res = parseResponse(r);
                                        if (res) {
                                            res.then((_r) => {
                                                onrejected(_r);
                                            }, () => {
                                                onrejected({ detail: 'Endpoint not reachable' });
                                            });
                                        }
                                    }
                                }, r
                            };
                        })
                            .then(({ res, r }) => {
                            res.then((content) => {
                                handleResponse({ responseData: content, response: r, status: r.status, resolve, reject });
                            }, (content) => {
                                handleResponse({ responseData: content, response: {}, status: r.status, resolve, reject });
                            });
                        }, (e) => reject(e));
                    }
                    else {
                        let to = false;
                        let id = timeout && setTimeout(() => {
                            console.error('Timeout');
                            handleResponse({ responseData: { error: `Timeout` }, response: {}, status: -2, resolve, reject });
                            to = true;
                            ctrl.abort = () => { };
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
                                ctrl.abort = () => { };
                            }
                        };
                        signalCallback(ctrl);
                        setTimeout(() => {
                            var _a, _b;
                            clearTimeout(id);
                            ctrl.abort = () => { };
                            if (!to) {
                                let r;
                                if (mock === null || mock === void 0 ? void 0 : mock.forceFail) {
                                    mock.fail = Object.assign(Object.assign({}, mockFailDefaults), mock.fail);
                                    r = { status: mock.fail.status, response: Object.assign(Object.assign({}, mock.fail), { instance: ((_a = mock.fail) === null || _a === void 0 ? void 0 : _a.instance) || url }) };
                                }
                                else {
                                    r = { status: ((_b = mock === null || mock === void 0 ? void 0 : mock.success) === null || _b === void 0 ? void 0 : _b.status) || 200, response: mock === null || mock === void 0 ? void 0 : mock.success };
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
                };
                tryCall();
            });
            const data = Object.assign(Object.assign({}, endpointOptionsDefaults), Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({ url, signal: {}, method }, (headers && { headers })), (body && { body })), { mock }), (test && { test })), { apiName,
                cacheTime,
                cacheToClearAfter }));
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
            }
            else {
                if (debug)
                    console.log(`%c${method} ->`, `font-weight: bold; font-size: 12px; color: ${logColors[method]}`, Object.assign({ resource: url }, (body && { body })));
                return new Promise((resolve) => {
                    const response = responseData(cache, true);
                    if (debug)
                        console.log("%c<- cached", 'font-weight: bold; font-size: 12px;color: rgb(66, 165, 244)', { resource: url, response });
                    resolve(response);
                    if (typeof onSuccess === 'function')
                        onSuccess(response, { data: response, headers: {}, status: 200, statusText: "OK", request: data });
                });
            }
        };
        /**
         *
         * @param data
         * @param api
         * @returns {Promise<any>}
         */
        this.call = (data, apiName, api, signalCallback) => {
            if (typeof api.test === 'function') {
                if (!api.test(data)) {
                    console.error(`${apiName}: test not passed`);
                    return Promise.reject(`${apiName}: test not passed`);
                }
                else {
                    return this.fetchAPI(Object.assign(Object.assign({}, api), { signalCallback,
                        apiName, cacheTime: api.cacheTime >= 0 ? api.cacheTime : cacheTime }));
                }
            }
            else {
                return this.fetchAPI(Object.assign(Object.assign({}, api), { signalCallback,
                    apiName, cacheTime: api.cacheTime >= 0 ? api.cacheTime : cacheTime }));
            }
        };
        Object.keys(collection).forEach((apiname) => {
            let controller = {};
            this.collection[apiname] = (data) => {
                let call = this.call(data, apiname, collection[apiname](data), (ctrl) => {
                    controller = ctrl;
                });
                const returnObj = {
                    onSuccess: (fn) => {
                        call.then((r) => {
                            fn(r);
                        });
                        return returnObj;
                    },
                    onError: (fn) => {
                        call.then(() => {
                        }, (r) => {
                            fn(r);
                        });
                        return returnObj;
                    },
                    always: (fn) => {
                        call.then((r) => {
                            fn(r);
                        }, (r) => {
                            fn(r);
                        });
                        return returnObj;
                    },
                    abort: () => typeof controller.abort === 'function' ? controller.abort() : () => {
                    },
                    then: (onSuccess, onError) => {
                        call.then(onSuccess, onError);
                        return returnObj;
                    }
                };
                return returnObj;
            };
        });
    }
}
exports.ApiClass = ApiClass;
exports.APIOptionsDefaults = {
    settings: () => configOptionsDefaults,
    collection: {}
};
