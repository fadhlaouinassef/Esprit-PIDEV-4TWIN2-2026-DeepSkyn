'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const languages = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'ar', label: 'العربية', flag: '🇸🇦' },
];

export default function LanguageSwitcher() {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedLang, setSelectedLang] = useState('fr'); // Default to French as seen in screenshots

    useEffect(() => {
        const saved = localStorage.getItem('app-language');
        if (saved) setSelectedLang(saved);
    }, []);

    const toggleDropdown = () => setIsOpen(!isOpen);

    const selectLanguage = (code: string) => {
        setSelectedLang(code);
        localStorage.setItem('app-language', code);
        setIsOpen(false);
        // Optional: window.location.reload() or hook into i18n if needed later
    };

    const currentLang = languages.find(l => l.code === selectedLang) || languages[1];

    return (
        <div className="relative inline-block text-left font-sans">
            <button
                onClick={toggleDropdown}
                className={cn(
                    "group flex items-center gap-2 rounded-full border border-gray-100 bg-white/80 px-4 py-2 text-sm font-medium text-gray-700 backdrop-blur-sm transition-all hover:border-gray-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-900/80 dark:text-gray-200",
                    isOpen && "border-[#156d95] ring-1 ring-[#156d95]"
                )}
            >
                <Globe className="h-4 w-4 text-[#156d95] transition-transform group-hover:rotate-12" />
                <span className="hidden sm:inline-block">{currentLang.label}</span>
                <span className="sm:hidden">{currentLang.code.toUpperCase()}</span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop for closing */}
                        <div
                            className="fixed inset-0 z-40 cursor-default"
                            onClick={() => setIsOpen(false)}
                        />

                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="absolute right-0 mt-3 z-50 w-48 origin-top-right rounded-2xl border border-gray-100 bg-white p-2 shadow-2xl backdrop-blur-xl dark:border-gray-800 dark:bg-gray-950"
                        >
                            <div className="space-y-1">
                                {languages.map((lang) => (
                                    <button
                                        key={lang.code}
                                        onClick={() => selectLanguage(lang.code)}
                                        className={cn(
                                            "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-all",
                                            selectedLang === lang.code
                                                ? "bg-[#156d95]/10 text-[#156d95] font-semibold"
                                                : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-900"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg">{lang.flag}</span>
                                            <span>{lang.label}</span>
                                        </div>
                                        {selectedLang === lang.code && (
                                            <Check className="h-4 w-4" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
