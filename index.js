"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const RapixCore_1 = require("./public/RapixCore");
function rapix(props) {
    return new RapixCore_1.API_class(Object.assign(Object.assign({}, RapixCore_1.APIOptionsDefaults), props)).collection;
}
exports.default = rapix;
