// Use dynamic require to avoid TypeScript import extension checks and circular aliasing
const _tp: any = require('./translation-provider');

export const TranslationProvider = _tp.TranslationProvider;
export const useTranslation = _tp.useTranslation;

export default TranslationProvider;
