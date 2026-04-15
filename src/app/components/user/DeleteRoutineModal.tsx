"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface DeleteRoutineModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    routineName?: string;
    loading?: boolean;
}

export const DeleteRoutineModal: React.FC<DeleteRoutineModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    routineName,
    loading = false,
}) => {
    const t = useTranslations();
    const displayRoutineName = routineName || t('components.deleteRoutineModal.thisRoutine');

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white rounded-[28px] w-full max-w-[440px] overflow-hidden shadow-2xl p-8"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header with Icon and Title */}
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 bg-[#FEF2F2] text-[#DC2626] rounded-full flex items-center justify-center flex-shrink-0">
                            <AlertTriangle className="w-7 h-7" />
                        </div>
                        <h2 className="text-[24px] font-bold text-[#111827]">
                            {t('components.deleteRoutineModal.title')}
                        </h2>
                    </div>

                    {/* Content */}
                    <div className="mb-10">
                        <p className="text-[#6B7280] text-[16px] leading-relaxed font-medium">
                            {t('components.deleteRoutineModal.confirmText')} <span className="text-[#DC2626] font-bold">{t('components.deleteRoutineModal.delete')}</span> {t('components.deleteRoutineModal.routineName')} <span className="text-[#111827] font-bold">{"\"" + displayRoutineName + "\""}</span>? {t('components.deleteRoutineModal.actionPrompt')}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 border border-[#E5E7EB] text-[#374151] rounded-[18px] font-bold text-[16px] hover:bg-gray-50 transition-colors"
                        >
                            {t('components.deleteRoutineModal.cancel')}
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={loading}
                            className="flex-1 py-4 bg-[#DC2626] text-white rounded-[18px] font-bold text-[16px] hover:bg-[#B91C1C] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-red-200"
                        >
                            {loading ? t('components.deleteRoutineModal.deleting') : t('components.deleteRoutineModal.delete')}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
