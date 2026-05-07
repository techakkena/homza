'use client';

import { Globe } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/lib/i18n/language-context';
import type { Language } from '@/lib/i18n/translations';

const LANGS: { code: Language; native: string; label: string }[] = [
  { code: 'en', native: 'English',  label: 'English' },
  { code: 'te', native: 'తెలుగు',   label: 'Telugu'  },
  { code: 'hi', native: 'हिंदी',    label: 'Hindi'   },
];

export function LanguageSelector() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="flex items-center gap-1">
      <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
      <Select value={language} onValueChange={v => setLanguage(v as Language)}>
        <SelectTrigger className="h-8 w-28 border border-border bg-background text-sm font-medium focus:ring-1">
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          {LANGS.map(({ code, native, label }) => (
            <SelectItem key={code} value={code}>
              <span className="font-medium">{native}</span>
              {native !== label && (
                <span className="ml-1.5 text-xs text-muted-foreground">({label})</span>
              )}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
