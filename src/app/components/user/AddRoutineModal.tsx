"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Sun, Moon, Calendar, Sparkles } from "lucide-react";
import { useAppDispatch } from "@/store/hooks";
import { createRoutine, addRoutineStep, updateRoutine } from "@/store/slices/routineSlice";
import { toast } from "sonner";

interface AddRoutineModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  routineToEdit?: any; // Added to support editing
}

type RoutineType = "morning" | "night" | "weekly";

interface Step {
  id?: number;
  ordre: number;
  action: string;
}

export const AddRoutineModal: React.FC<AddRoutineModalProps> = ({
  isOpen,
  onClose,
  userId,
  routineToEdit,
}) => {
  const dispatch = useAppDispatch();
  const [routineType, setRoutineType] = useState<RoutineType>("morning");
  const [envie, setEnvie] = useState("");
  const [objectif, setObjectif] = useState("");
  const [steps, setSteps] = useState<Step[]>([{ ordre: 1, action: "" }]);
  const [loading, setLoading] = useState(false);

  // Pre-fill form if editing
  useEffect(() => {
    if (routineToEdit) {
      setRoutineType(routineToEdit.type);
      setEnvie(routineToEdit.envie || "");
      setObjectif(routineToEdit.objectif || "");
      setSteps(routineToEdit.steps?.length > 0
        ? [...routineToEdit.steps].sort((a: any, b: any) => a.ordre - b.ordre)
        : [{ ordre: 1, action: "" }]
      );
    } else {
      setRoutineType("morning");
      setEnvie("");
      setObjectif("");
      setSteps([{ ordre: 1, action: "" }]);
    }
  }, [routineToEdit, isOpen]);

  // Bloquer le scroll de la page mère quand le modal est ouvert
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleAddStep = () => {
    setSteps([...steps, { ordre: steps.length + 1, action: "" }]);
  };

  const handleRemoveStep = (index: number) => {
    const newSteps = steps
      .filter((_, i) => i !== index)
      .map((step, i) => ({ ...step, ordre: i + 1 })); // Recalculate order
    setSteps(newSteps);
  };

  const handleStepChange = (index: number, value: string) => {
    const newSteps = steps.map((step, i) => {
      if (i === index) {
        return { ...step, action: value }; // New object copy
      }
      return step;
    });
    setSteps(newSteps);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (routineToEdit) {
        // Update existing routine
        await dispatch(
          updateRoutine({
            id: routineToEdit.id,
            updates: {
              type: routineType,
              envie,
              objectif,
            },
          })
        ).unwrap();

        // Note: Full step sync (add/edit/remove) would require more backend logic.
        // For now, we update the main routine info as requested.

        toast.success("Routine mise à jour! ✨");
      } else {
        // Create new routine
        const result = await dispatch(
          createRoutine({
            user_id: userId,
            type: routineType,
            envie,
            objectif,
          })
        ).unwrap();

        // Add steps
        for (const step of steps.filter((s) => s.action.trim() !== "")) {
          await dispatch(
            addRoutineStep({
              routine_id: result.id,
              ordre: step.ordre,
              action: step.action,
            })
          );
        }
        toast.success("Routine créée avec succès! ✨");
      }

      onClose();
    } catch (error) {
      console.error('Error saving routine:', error);
      toast.error("Erreur lors de l'enregistrement", {
        description: "Veuillez réessayer.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-card border border-border rounded-[40px] w-full max-w-2xl max-h-[85vh] my-auto overflow-y-auto overscroll-contain touch-pan-y shadow-2xl flex flex-col"
          style={{ WebkitOverflowScrolling: "touch" }}
          data-lenis-prevent
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-card/95 backdrop-blur-md border-b border-border p-8 flex items-center justify-between z-10 rounded-t-[40px] flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-foreground">
                  Create a Routine
                </h2>
                <p className="text-sm text-muted-foreground font-medium">
                  Personalize your skincare routine
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-3 hover:bg-muted rounded-2xl transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8 flex-1">
            {/* Routine Type Selection */}
            <div className="space-y-4">
              <label className="block text-sm font-black text-foreground uppercase tracking-widest">
                Routine Type
              </label>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { value: "morning", label: "Morning", icon: Sun },
                  { value: "night", label: "Night", icon: Moon },
                  { value: "weekly", label: "Weekly", icon: Calendar },
                ].map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setRoutineType(type.value as RoutineType)}
                    className={`flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all ${routineType === type.value
                      ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                      : "bg-muted/30 border-border hover:border-primary/30"
                      }`}
                  >
                    <type.icon className="w-8 h-8" />
                    <span className="text-sm font-black uppercase tracking-wider">
                      {type.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Envie */}
            <div className="space-y-3">
              <label className="block text-sm font-black text-foreground uppercase tracking-widest">
                Desire
              </label>
              <input
                type="text"
                value={envie}
                onChange={(e) => setEnvie(e.target.value)}
                placeholder="e.g. Achieve glowing skin"
                className="w-full px-6 py-4 bg-muted/30 border border-border rounded-3xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            {/* Objectif */}
            <div className="space-y-3">
              <label className="block text-sm font-black text-foreground uppercase tracking-widest">
                Goal
              </label>
              <textarea
                value={objectif}
                onChange={(e) => setObjectif(e.target.value)}
                placeholder="e.g. Reduce blemishes and hydrate my skin"
                rows={3}
                className="w-full px-6 py-4 bg-muted/30 border border-border rounded-3xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
              />
            </div>

            {/* Steps */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-black text-foreground uppercase tracking-widest">
                  Steps
                </label>
                <button
                  type="button"
                  onClick={handleAddStep}
                  className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-primary/20 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>

              <div className="space-y-3">
                {steps.map((step, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black">
                      {index + 1}
                    </div>
                    <input
                      type="text"
                      value={step.action}
                      onChange={(e) => handleStepChange(index, e.target.value)}
                      placeholder="e.g. Cleanse the face"
                      className="flex-1 px-6 py-3 bg-muted/30 border border-border rounded-3xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                    {steps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveStep(index)}
                        className="flex-shrink-0 p-2 hover:bg-red-500/10 text-red-500 rounded-2xl transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-4 bg-muted text-foreground rounded-3xl font-black uppercase tracking-widest hover:bg-muted/80 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-4 bg-primary text-primary-foreground rounded-3xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating..." : "Create Routine"}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
