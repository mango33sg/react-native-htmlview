import i18n from 'react-native-i18n';
import en from './locale/en.json';
import de from './locale/de.json';

const combine = (code, lang) => Object.assign({}, i18n.translations[code], lang);
i18n.fallbacks = true;
i18n.translations = {
  en: combine('en', en),
  'de-DE': combine('de-DE', de),
};

export default i18n;

