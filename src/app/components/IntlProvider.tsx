"use client";

import {NextIntlClientProvider} from "next-intl";

type IntlProviderProps = {
  locale: string;
  messages: Record<string, unknown>;
  children: React.ReactNode;
};

export default function IntlProvider({locale, messages, children}: IntlProviderProps) {
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      timeZone="UTC"
      onError={(error) => {
        // During incremental adoption, do not crash on missing messages.
        if (process.env.NODE_ENV !== "production") {
          console.warn("[i18n]", error);
        }
      }}
      getMessageFallback={({key}) => key}
    >
      {children}
    </NextIntlClientProvider>
  );
}
