/**
 * BodySilhouette — SVG body outline scaled by circumference measurements.
 * Color changes based on body fat percentage.
 */

interface BodySilhouetteProps {
  measurements: {
    waist_cm?: number;
    chest_cm?: number;
    arm_cm?: number;
    leg_cm?: number;
    body_fat_pct?: number;
    weight_kg?: number;
  };
  gender?: 'male' | 'female' | 'other';
  language?: 'de' | 'en';
  className?: string;
}

// Reference values for scaling (average adult)
const REF_MALE = { chest: 100, waist: 85, arm: 33, leg: 55 };
const REF_FEMALE = { chest: 90, waist: 72, arm: 28, leg: 52 };

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function getBodyColor(bodyFatPct: number | undefined, gender: string): string {
  if (bodyFatPct == null) return '#94a3b8'; // slate-400
  const isMale = gender !== 'female';
  const ranges = isMale
    ? { lean: 12, moderate: 20, high: 28 }
    : { lean: 20, moderate: 28, high: 36 };

  if (bodyFatPct <= ranges.lean) return '#22c55e';    // green-500
  if (bodyFatPct <= ranges.moderate) return '#eab308'; // yellow-500
  return '#ef4444';                                    // red-500
}

function getBodyColorLight(bodyFatPct: number | undefined, gender: string): string {
  if (bodyFatPct == null) return '#cbd5e1'; // slate-300
  const isMale = gender !== 'female';
  const ranges = isMale
    ? { lean: 12, moderate: 20, high: 28 }
    : { lean: 20, moderate: 28, high: 36 };

  if (bodyFatPct <= ranges.lean) return '#bbf7d0';    // green-200
  if (bodyFatPct <= ranges.moderate) return '#fef08a'; // yellow-200
  return '#fecaca';                                    // red-200
}

const labels = {
  de: { chest: 'Brust', waist: 'Taille', arm: 'Arm', leg: 'Bein' },
  en: { chest: 'Chest', waist: 'Waist', arm: 'Arm', leg: 'Leg' },
};

export function BodySilhouette({ measurements, gender = 'male', language = 'de', className = '' }: BodySilhouetteProps) {
  const ref = gender === 'female' ? REF_FEMALE : REF_MALE;
  const l = labels[language] ?? labels.de;

  // Calculate scale factors (clamped 0.7–1.3)
  const chestScale = clamp((measurements.chest_cm ?? ref.chest) / ref.chest, 0.7, 1.3);
  const waistScale = clamp((measurements.waist_cm ?? ref.waist) / ref.waist, 0.7, 1.3);
  const armScale = clamp((measurements.arm_cm ?? ref.arm) / ref.arm, 0.7, 1.3);
  const legScale = clamp((measurements.leg_cm ?? ref.leg) / ref.leg, 0.7, 1.3);

  const bodyColor = getBodyColor(measurements.body_fat_pct, gender);
  const bodyColorLight = getBodyColorLight(measurements.body_fat_pct, gender);

  // Body part widths (base values at scale 1.0)
  const headR = 18;
  const neckW = 12;
  const shoulderW = 42 * chestScale;
  const chestW = 38 * chestScale;
  const waistW = 30 * waistScale;
  const hipW = gender === 'female' ? 36 * waistScale : 32 * waistScale;
  const armW = 10 * armScale;
  const legW = 16 * legScale;

  const cx = 100; // center x
  const headY = 30;
  const neckY = headY + headR + 4;
  const shoulderY = neckY + 16;
  const chestY = shoulderY + 30;
  const waistY = chestY + 35;
  const hipY = waistY + 25;
  const kneeY = hipY + 60;
  const ankleY = kneeY + 55;

  // Build body outline path (simplified symmetrical)
  const leftShoulder = cx - shoulderW;
  const rightShoulder = cx + shoulderW;
  const leftChest = cx - chestW;
  const rightChest = cx + chestW;
  const leftWaist = cx - waistW;
  const rightWaist = cx + waistW;
  const leftHip = cx - hipW;
  const rightHip = cx + hipW;

  const bodyPath = `
    M ${cx - neckW} ${neckY + 10}
    Q ${cx - neckW - 5} ${shoulderY - 5} ${leftShoulder} ${shoulderY}
    L ${leftShoulder - armW * 2} ${shoulderY + 5}
    L ${leftShoulder - armW * 2.5} ${shoulderY + 65}
    L ${leftShoulder - armW * 1.5} ${shoulderY + 68}
    L ${leftShoulder - armW * 0.5} ${shoulderY + 15}
    Q ${leftChest - 3} ${chestY - 10} ${leftChest} ${chestY}
    Q ${leftWaist + 2} ${(chestY + waistY) / 2} ${leftWaist} ${waistY}
    Q ${leftHip - 2} ${(waistY + hipY) / 2} ${leftHip} ${hipY}
    L ${cx - legW - 4} ${kneeY}
    L ${cx - legW - 2} ${ankleY}
    L ${cx - 4} ${ankleY}
    L ${cx - 3} ${kneeY + 5}
    Q ${cx} ${hipY + 20} ${cx + 3} ${kneeY + 5}
    L ${cx + 4} ${ankleY}
    L ${cx + legW + 2} ${ankleY}
    L ${cx + legW + 4} ${kneeY}
    L ${rightHip} ${hipY}
    Q ${rightHip + 2} ${(waistY + hipY) / 2} ${rightWaist} ${waistY}
    Q ${rightWaist - 2} ${(chestY + waistY) / 2} ${rightChest} ${chestY}
    Q ${rightChest + 3} ${chestY - 10} ${rightShoulder + armW * 0.5} ${shoulderY + 15}
    L ${rightShoulder + armW * 1.5} ${shoulderY + 68}
    L ${rightShoulder + armW * 2.5} ${shoulderY + 65}
    L ${rightShoulder + armW * 2} ${shoulderY + 5}
    L ${rightShoulder} ${shoulderY}
    Q ${cx + neckW + 5} ${shoulderY - 5} ${cx + neckW} ${neckY + 10}
    Z
  `;

  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm ${className}`}>
      <div className="max-w-[240px] mx-auto">
        <svg viewBox="0 0 200 380" className="w-full h-auto">
          {/* Background glow */}
          <defs>
            <radialGradient id="bodyGlow" cx="50%" cy="40%" r="45%">
              <stop offset="0%" stopColor={bodyColorLight} stopOpacity="0.3" />
              <stop offset="100%" stopColor={bodyColorLight} stopOpacity="0" />
            </radialGradient>
          </defs>
          <ellipse cx={cx} cy="190" rx="70" ry="140" fill="url(#bodyGlow)" />

          {/* Head */}
          <circle cx={cx} cy={headY} r={headR} fill={bodyColor} opacity="0.8" />

          {/* Neck */}
          <rect
            x={cx - neckW}
            y={headY + headR - 2}
            width={neckW * 2}
            height={16}
            rx="4"
            fill={bodyColor}
            opacity="0.7"
          />

          {/* Body */}
          <path d={bodyPath} fill={bodyColor} opacity="0.6" stroke={bodyColor} strokeWidth="1" />

          {/* Measurement labels with lines */}
          {measurements.chest_cm && (
            <g>
              <line x1={rightChest + 5} y1={chestY - 5} x2="170" y2={chestY - 5} stroke="#9ca3af" strokeWidth="0.5" strokeDasharray="2 2" />
              <text x="172" y={chestY - 1} fontSize="8" fill="#6b7280" fontFamily="system-ui">
                {l.chest}: {measurements.chest_cm} cm
              </text>
            </g>
          )}
          {measurements.waist_cm && (
            <g>
              <line x1={rightWaist + 3} y1={waistY} x2="170" y2={waistY} stroke="#9ca3af" strokeWidth="0.5" strokeDasharray="2 2" />
              <text x="172" y={waistY + 4} fontSize="8" fill="#6b7280" fontFamily="system-ui">
                {l.waist}: {measurements.waist_cm} cm
              </text>
            </g>
          )}
          {measurements.arm_cm && (
            <g>
              <line x1={leftShoulder - armW * 2} y1={shoulderY + 35} x2="5" y2={shoulderY + 35} stroke="#9ca3af" strokeWidth="0.5" strokeDasharray="2 2" />
              <text x="2" y={shoulderY + 30} fontSize="8" fill="#6b7280" fontFamily="system-ui">
                {l.arm}: {measurements.arm_cm} cm
              </text>
            </g>
          )}
          {measurements.leg_cm && (
            <g>
              <line x1={cx + legW + 5} y1={kneeY + 20} x2="170" y2={kneeY + 20} stroke="#9ca3af" strokeWidth="0.5" strokeDasharray="2 2" />
              <text x="172" y={kneeY + 24} fontSize="8" fill="#6b7280" fontFamily="system-ui">
                {l.leg}: {measurements.leg_cm} cm
              </text>
            </g>
          )}

          {/* Weight + Body Fat label at bottom */}
          {(measurements.weight_kg || measurements.body_fat_pct) && (
            <text x={cx} y="370" textAnchor="middle" fontSize="9" fill="#374151" fontFamily="system-ui" fontWeight="600">
              {measurements.weight_kg ? `${measurements.weight_kg} kg` : ''}
              {measurements.weight_kg && measurements.body_fat_pct ? ' · ' : ''}
              {measurements.body_fat_pct ? `${measurements.body_fat_pct}% KFA` : ''}
            </text>
          )}
        </svg>
      </div>
    </div>
  );
}
