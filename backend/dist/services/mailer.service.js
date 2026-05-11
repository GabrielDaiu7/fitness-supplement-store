"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
exports.isRealEmailEnabled = isRealEmailEnabled;
const nodemailer_1 = __importDefault(require("nodemailer"));
function smtpConfigured() {
    return Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS);
}
function createTransport() {
    if (smtpConfigured()) {
        return nodemailer_1.default.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: String(process.env.SMTP_SECURE ?? 'false') === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }
    return nodemailer_1.default.createTransport({ streamTransport: true, newline: 'unix', buffer: true });
}
async function sendEmail(input) {
    const transport = createTransport();
    await transport.sendMail({
        from: process.env.SMTP_FROM ?? 'no-reply@fusion.store',
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html,
    });
}
function isRealEmailEnabled() {
    return smtpConfigured();
}
