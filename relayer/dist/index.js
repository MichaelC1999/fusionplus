"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const evm_1 = __importDefault(require("./routes/evm"));
const sui_1 = __importDefault(require("./routes/sui"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// mount routers
app.use('/evm', evm_1.default);
app.use('/sui', sui_1.default);
const PORT = process.env.PORT || 2000;
app.listen(PORT, () => {
    console.log(`🚀 zkPix backend listening on http://localhost:${PORT}`);
});
