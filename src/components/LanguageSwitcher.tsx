import React from 'react';
import { Button, ButtonGroup } from '@mui/material';
import { useTranslation } from 'react-i18next';

/** Language switcher button group — toggles EN / HE */
const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const current = i18n.language;

  const change = (lng: 'en' | 'he') => {
    i18n.changeLanguage(lng);
    localStorage.setItem('lang', lng);
    // Set document direction for RTL support
    document.documentElement.dir = lng === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = lng;
  };

  return (
    <ButtonGroup size="small" variant="outlined" sx={{ ml: 1 }}>
      <Button
        onClick={() => change('en')}
        variant={current === 'en' ? 'contained' : 'outlined'}
        sx={{ color: 'inherit', borderColor: 'rgba(255,255,255,0.5)', minWidth: 40 }}
      >
        EN
      </Button>
      <Button
        onClick={() => change('he')}
        variant={current === 'he' ? 'contained' : 'outlined'}
        sx={{ color: 'inherit', borderColor: 'rgba(255,255,255,0.5)', minWidth: 40 }}
      >
        עב
      </Button>
    </ButtonGroup>
  );
};

export default LanguageSwitcher;
