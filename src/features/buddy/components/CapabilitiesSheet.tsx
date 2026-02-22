/**
 * CapabilitiesSheet — Bottom-sheet listing all Buddy capabilities.
 *
 * Tap an example to close the sheet and auto-send the message.
 * Triggered by the Lightbulb icon in the chat header.
 */

import { X, Utensils, Dumbbell, ClipboardList, Activity, Heart, Pill, Camera, BarChart3 } from 'lucide-react';
import { useTranslation } from '../../../i18n';

interface CapabilitiesSheetProps {
  open: boolean;
  onClose: () => void;
  onSendMessage: (msg: string) => void;
}

interface Capability {
  icon: React.ReactNode;
  labelKey: string;
  example: string;
}

export function CapabilitiesSheet({ open, onClose, onSendMessage }: CapabilitiesSheetProps) {
  const { t, language } = useTranslation();
  const isDE = language === 'de';

  const capabilities: Capability[] = [
    { icon: <Utensils className="h-4 w-4 text-emerald-500" />, labelKey: 'capNutrition', example: isDE ? '200g Hähnchen mit Reis und Salat' : '200g chicken with rice and salad' },
    { icon: <Dumbbell className="h-4 w-4 text-blue-500" />, labelKey: 'capWorkout', example: isDE ? 'Heute 45 Minuten Krafttraining gemacht' : 'Did 45 minutes of strength training today' },
    { icon: <ClipboardList className="h-4 w-4 text-purple-500" />, labelKey: 'capPlan', example: isDE ? 'Erstell mir einen 3-Tage Trainingsplan' : 'Create a 3-day training plan for me' },
    { icon: <Activity className="h-4 w-4 text-teal-500" />, labelKey: 'capBody', example: isDE ? 'Wie hat sich mein Gewicht entwickelt?' : 'How has my weight progressed?' },
    { icon: <Heart className="h-4 w-4 text-red-500" />, labelKey: 'capBP', example: isDE ? 'Blutdruck 135/88 Puls 72' : 'Blood pressure 135/88 pulse 72' },
    { icon: <Pill className="h-4 w-4 text-amber-500" />, labelKey: 'capSubstance', example: isDE ? 'Habe meine Substanzen genommen' : 'Took my substances today' },
    { icon: <Camera className="h-4 w-4 text-indigo-500" />, labelKey: 'capScreenshot', example: isDE ? 'Screenshot meiner Waage analysieren' : 'Analyze my scale screenshot' },
    { icon: <BarChart3 className="h-4 w-4 text-orange-500" />, labelKey: 'capAnalysis', example: isDE ? 'Wie war meine Woche?' : 'How was my week?' },
  ];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Sheet */}
      <div
        className="relative w-full max-w-lg bg-white rounded-t-2xl shadow-2xl max-h-[75vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center py-2">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3">
          <h2 className="text-base font-bold text-gray-900">
            {t.buddy.capabilities}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        {/* Capabilities List */}
        <div className="px-5 pb-6 space-y-2">
          {capabilities.map((cap) => (
            <button
              key={cap.labelKey}
              onClick={() => {
                onSendMessage(cap.example);
                onClose();
              }}
              className="w-full flex items-start gap-3 p-3 bg-gray-50 rounded-xl hover:bg-teal-50 transition-colors text-left group"
            >
              <div className="mt-0.5">{cap.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900">
                  {(t.buddy as Record<string, string>)[cap.labelKey]}
                </p>
                <p className="text-[10px] text-gray-400 group-hover:text-teal-600 mt-0.5 truncate">
                  &ldquo;{cap.example}&rdquo;
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
