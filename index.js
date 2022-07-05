"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cascade = void 0;
const RapixCore_1 = require("./public/RapixCore");
function rapix(props) {
    return new RapixCore_1.API_class(Object.assign(Object.assign({}, RapixCore_1.APIOptionsDefaults), props)).collection;
}
function cascade(props, callbacks) {
    let countCalls = 0;
    let successes = 0;
    let results = [];
    return new Promise((resolve, reject) => {
        function checkResults() {
            if (countCalls === props.length) {
                if (countCalls === successes) {
                    resolve(results);
                }
                else {
                    reject(results);
                }
            }
        }
        function makeCall(number, params) {
            let successResponse;
            props[number](params).onSuccess((r) => {
                if (callbacks && typeof callbacks[number] === "function")
                    callbacks[number](r);
                successResponse = r;
                successes++;
                results.push(r);
                if (typeof props[number + 1] === "function") {
                    makeCall(number + 1, successResponse);
                }
            }).onError((e) => {
                if (callbacks && typeof callbacks[number] === "function")
                    callbacks[number](undefined, e);
                results.push(e);
                reject(results);
            }).always(() => {
                countCalls++;
                checkResults();
            });
        }
        makeCall(0);
    });
}
exports.cascade = cascade;
exports.default = rapix;
