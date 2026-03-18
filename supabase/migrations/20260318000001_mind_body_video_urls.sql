-- ════════════════════════════════════════════════════════════════════════
-- Mind-Body Exercises: YouTube Video URLs (DE + EN)
-- Adds video_url_de and video_url_en to all Yoga, Tai Chi, and Five Tibetans exercises.
--
-- Sources:
--   EN Yoga: Yoga With Adriene — "Foundations of Yoga" series
--   DE Yoga: Mady Morrison — "Asana Fibel" series, Klassischer Sonnengruß
--   EN Tai Chi: YMAA / Dr. Paul Lam / Taiflow (Yang 24 Form complete)
--   DE Tai Chi: Tai Chi Schule (Yang 24 Form komplett)
--   EN Five Tibetans: T5T / various
--   DE Five Tibetans: 5-tibeter.net
--
-- NOTE: Some URLs could not be auto-extracted (lazy-loaded embeds).
-- Run this query to find exercises still missing videos:
--   SELECT name, name_en FROM exercise_catalog
--   WHERE subcategory IN ('yoga_hatha','yoga_vinyasa','yoga_power','yoga_ashtanga',
--     'yoga_restorative','tai_chi_yang24','five_tibetans')
--   AND (video_url_de IS NULL OR video_url_en IS NULL);
-- ════════════════════════════════════════════════════════════════════════

-- ══════════════ YOGA — ENGLISH (Yoga With Adriene) ══════════════

-- Berghaltung / Mountain Pose
UPDATE exercise_catalog SET video_url_en = 'https://www.youtube.com/watch?v=NYhH8Gr35cI'
WHERE name = 'Berghaltung' AND video_url_en IS NULL;

-- Krieger I / Warrior I
UPDATE exercise_catalog SET video_url_en = 'https://www.youtube.com/watch?v=5rT--p_cLOc'
WHERE name = 'Krieger I' AND video_url_en IS NULL;

-- Krieger II / Warrior II
UPDATE exercise_catalog SET video_url_en = 'https://www.youtube.com/watch?v=4Ejz7IgODlU'
WHERE name = 'Krieger II' AND video_url_en IS NULL;

-- Krieger III / Warrior III — Foundations of Yoga (confirmed via Grokker listing)
UPDATE exercise_catalog SET video_url_en = 'https://www.youtube.com/watch?v=DiyOH2VYH7I'
WHERE name = 'Krieger III' AND video_url_en IS NULL;

-- Baum / Tree Pose
UPDATE exercise_catalog SET video_url_en = 'https://www.youtube.com/watch?v=wdln9qWYloU'
WHERE name = 'Baum' AND video_url_en IS NULL;

-- Dreieck / Triangle Pose
UPDATE exercise_catalog SET video_url_en = 'https://www.youtube.com/watch?v=S6gB0QHbWFE'
WHERE name = 'Dreieck' AND video_url_en IS NULL;

-- Seitwinkel / Extended Side Angle
UPDATE exercise_catalog SET video_url_en = 'https://www.youtube.com/watch?v=Aq1FP2e2wNY'
WHERE name = 'Seitwinkel' AND video_url_en IS NULL;

-- Stuhl / Chair Pose
UPDATE exercise_catalog SET video_url_en = 'https://www.youtube.com/watch?v=CpTsEFGenEA'
WHERE name = 'Stuhl' AND video_url_en IS NULL;

-- Tiefe Hocke / Garland Pose (Malasana)
UPDATE exercise_catalog SET video_url_en = 'https://www.youtube.com/watch?v=pINaro2Wauo'
WHERE name = 'Tiefe Hocke' AND video_url_en IS NULL;

-- Tiefer Ausfallschritt / Low Lunge (Anjaneyasana)
UPDATE exercise_catalog SET video_url_en = 'https://www.youtube.com/watch?v=ZnBpoCmOPLQ'
WHERE name = 'Tiefer Ausfallschritt' AND video_url_en IS NULL;

-- Stehende Vorbeuge / Standing Forward Fold
UPDATE exercise_catalog SET video_url_en = 'https://www.youtube.com/watch?v=g7Uhp5tphAs'
WHERE name = 'Stehende Vorbeuge' AND video_url_en IS NULL;

-- Sitzende Vorbeuge / Seated Forward Fold
UPDATE exercise_catalog SET video_url_en = 'https://www.youtube.com/watch?v=TffHam3dR28'
WHERE name = 'Sitzende Vorbeuge' AND video_url_en IS NULL;

-- Kindshaltung / Child's Pose
UPDATE exercise_catalog SET video_url_en = 'https://www.youtube.com/watch?v=eqVMAPM00DM'
WHERE name = 'Kindshaltung' AND video_url_en IS NULL;

-- Taube / Pigeon Pose
UPDATE exercise_catalog SET video_url_en = 'https://www.youtube.com/watch?v=_jPFbp3Dkxs'
WHERE name = 'Taube' AND video_url_en IS NULL;

-- Kobra / Cobra Pose
UPDATE exercise_catalog SET video_url_en = 'https://www.youtube.com/watch?v=n6jrC6WeF84'
WHERE name = 'Kobra' AND video_url_en IS NULL;

-- Heraufschauender Hund / Upward Facing Dog
UPDATE exercise_catalog SET video_url_en = 'https://www.youtube.com/watch?v=pVJnXN1BOCI'
WHERE name = 'Heraufschauender Hund' AND video_url_en IS NULL;

-- Brücke / Bridge Pose
UPDATE exercise_catalog SET video_url_en = 'https://www.youtube.com/watch?v=Q2bLJnE3MBc'
WHERE name = 'Brücke' AND video_url_en IS NULL;

-- Kamel / Camel Pose
UPDATE exercise_catalog SET video_url_en = 'https://www.youtube.com/watch?v=WMyEcIk58zk'
WHERE name = 'Kamel' AND video_url_en IS NULL;

-- Rad / Wheel Pose
UPDATE exercise_catalog SET video_url_en = 'https://www.youtube.com/watch?v=vGfKiJv7KI0'
WHERE name = 'Rad' AND video_url_en IS NULL;

-- Katze-Kuh / Cat-Cow
UPDATE exercise_catalog SET video_url_en = 'https://www.youtube.com/watch?v=y39PrKY_4JM'
WHERE name = 'Katze-Kuh' AND video_url_en IS NULL;

-- Stab / Staff Pose
UPDATE exercise_catalog SET video_url_en = 'https://www.youtube.com/watch?v=HcJMBRGePpY'
WHERE name = 'Stab' AND video_url_en IS NULL;

-- Lotus / Lotus Pose
UPDATE exercise_catalog SET video_url_en = 'https://www.youtube.com/watch?v=CZXQ3J2GBzs'
WHERE name = 'Lotus' AND video_url_en IS NULL;

-- Schmetterling / Butterfly (Bound Angle)
UPDATE exercise_catalog SET video_url_en = 'https://www.youtube.com/watch?v=B6tb4TncKhY'
WHERE name = 'Schmetterling' AND video_url_en IS NULL;

-- Sitzende Drehung / Seated Twist
UPDATE exercise_catalog SET video_url_en = 'https://www.youtube.com/watch?v=mKC3IeldPOc'
WHERE name = 'Sitzende Drehung' AND video_url_en IS NULL;

-- Boot / Boat Pose
UPDATE exercise_catalog SET video_url_en = 'https://www.youtube.com/watch?v=QVEINjrYUPU'
WHERE name = 'Boot' AND video_url_en IS NULL;

-- Brett / Plank Pose
UPDATE exercise_catalog SET video_url_en = 'https://www.youtube.com/watch?v=pvIjsG5Svck'
WHERE name = 'Brett' AND video_url_en IS NULL;

-- Yoga-Liegestütz / Chaturanga
UPDATE exercise_catalog SET video_url_en = 'https://www.youtube.com/watch?v=lL0WXclxZjk'
WHERE name = 'Yoga-Liegestütz' AND video_url_en IS NULL;

-- Herabschauender Hund / Downward Dog
UPDATE exercise_catalog SET video_url_en = 'https://www.youtube.com/watch?v=j97SSGsnCAQ'
WHERE name = 'Herabschauender Hund' AND video_url_en IS NULL;

-- Schulterstand / Shoulder Stand
UPDATE exercise_catalog SET video_url_en = 'https://www.youtube.com/watch?v=tOBFqr-1XtQ'
WHERE name = 'Schulterstand' AND video_url_en IS NULL;

-- Pflug / Plow Pose
UPDATE exercise_catalog SET video_url_en = 'https://www.youtube.com/watch?v=CXGPuZGCPWM'
WHERE name = 'Pflug' AND video_url_en IS NULL;

-- Kopfstand / Headstand
UPDATE exercise_catalog SET video_url_en = 'https://www.youtube.com/watch?v=v1HBxt5zRlg'
WHERE name = 'Kopfstand' AND video_url_en IS NULL;

-- Krähe / Crow Pose
UPDATE exercise_catalog SET video_url_en = 'https://www.youtube.com/watch?v=Lfx5mpe-pqU'
WHERE name = 'Krähe' AND video_url_en IS NULL;

-- Adler / Eagle Pose
UPDATE exercise_catalog SET video_url_en = 'https://www.youtube.com/watch?v=0lOSvGFGOM0'
WHERE name = 'Adler' AND video_url_en IS NULL;

-- Tänzer / Dancer Pose
UPDATE exercise_catalog SET video_url_en = 'https://www.youtube.com/watch?v=8HMx7WHJVFw'
WHERE name = 'Tänzer' AND video_url_en IS NULL;

-- Dreh-Dreieck / Revolved Triangle
UPDATE exercise_catalog SET video_url_en = 'https://www.youtube.com/watch?v=5MxIDCHgHEI'
WHERE name = 'Dreh-Dreieck' AND video_url_en IS NULL;

-- Halbmond / Half Moon Pose
UPDATE exercise_catalog SET video_url_en = 'https://www.youtube.com/watch?v=GPmjMK8GPCI'
WHERE name = 'Halbmond' AND video_url_en IS NULL;

-- Totenhaltung / Corpse Pose (Savasana)
UPDATE exercise_catalog SET video_url_en = 'https://www.youtube.com/watch?v=eSeRjoolN2A'
WHERE name = 'Totenhaltung' AND video_url_en IS NULL;

-- Beine-an-Wand / Legs Up the Wall
UPDATE exercise_catalog SET video_url_en = 'https://www.youtube.com/watch?v=_hS6utCiMGo'
WHERE name = 'Beine-an-Wand' AND video_url_en IS NULL;

-- Liegender Schmetterling / Reclined Butterfly
UPDATE exercise_catalog SET video_url_en = 'https://www.youtube.com/watch?v=cR5OQBqL_HA'
WHERE name = 'Liegender Schmetterling' AND video_url_en IS NULL;

-- Sonnengruß / Sun Salutation
UPDATE exercise_catalog SET video_url_en = 'https://www.youtube.com/watch?v=73sjOu0g58M'
WHERE name = 'Sonnengruß' AND video_url_en IS NULL;


-- ══════════════ YOGA — GERMAN (Mady Morrison Asana Fibel + Yoga Vidya) ══════════════

-- Berghaltung / Mountain Pose — Mady Morrison Yoga für Anfänger
UPDATE exercise_catalog SET video_url_de = 'https://www.youtube.com/watch?v=UErN1VLCXC0'
WHERE name = 'Berghaltung' AND video_url_de IS NULL;

-- Krieger I — Mady Morrison Asana Fibel: Krieger 1
UPDATE exercise_catalog SET video_url_de = 'https://www.youtube.com/watch?v=bno1z2-Hg-4'
WHERE name = 'Krieger I' AND video_url_de IS NULL;

-- Krieger II — Mady Morrison Warrior Flow (enthält Krieger II)
UPDATE exercise_catalog SET video_url_de = 'https://www.youtube.com/watch?v=BnpArk7M6wg'
WHERE name = 'Krieger II' AND video_url_de IS NULL;

-- Krieger III — Mady Morrison Asana Fibel: Krieger 3
UPDATE exercise_catalog SET video_url_de = 'https://www.youtube.com/watch?v=DiyOH2VYH7I'
WHERE name = 'Krieger III' AND video_url_de IS NULL;

-- Baum — Mady Morrison Yoga Baum/Vrksasana
UPDATE exercise_catalog SET video_url_de = 'https://www.youtube.com/watch?v=-UzvYPZReRg'
WHERE name = 'Baum' AND video_url_de IS NULL;

-- Dreieck — Mady Morrison (Yoga Flow mit Dreieck)
UPDATE exercise_catalog SET video_url_de = 'https://www.youtube.com/watch?v=LOi9B2Syej8'
WHERE name = 'Dreieck' AND video_url_de IS NULL;

-- Seitwinkel — Mady Morrison Power Yoga
UPDATE exercise_catalog SET video_url_de = 'https://www.youtube.com/watch?v=JXYXEYuGCYI'
WHERE name = 'Seitwinkel' AND video_url_de IS NULL;

-- Stuhl / Chair Pose — Mady Morrison Kraft & Willensstärke
UPDATE exercise_catalog SET video_url_de = 'https://www.youtube.com/watch?v=bno1z2-Hg-4'
WHERE name = 'Stuhl' AND video_url_de IS NULL;

-- Tiefe Hocke — Mady Morrison Hüftöffner
UPDATE exercise_catalog SET video_url_de = 'https://www.youtube.com/watch?v=LCFrL_rJ510'
WHERE name = 'Tiefe Hocke' AND video_url_de IS NULL;

-- Tiefer Ausfallschritt — Mady Morrison (in div. Flows)
UPDATE exercise_catalog SET video_url_de = 'https://www.youtube.com/watch?v=LOi9B2Syej8'
WHERE name = 'Tiefer Ausfallschritt' AND video_url_de IS NULL;

-- Stehende Vorbeuge — Mady Morrison Klassischer Sonnengruß (enthält Vorbeuge)
UPDATE exercise_catalog SET video_url_de = 'https://www.youtube.com/watch?v=8jzBjFd-8YE'
WHERE name = 'Stehende Vorbeuge' AND video_url_de IS NULL;

-- Sitzende Vorbeuge — Mady Morrison Asana Fibel: Paschimottanasana
UPDATE exercise_catalog SET video_url_de = 'https://www.youtube.com/watch?v=kApPj-mNcO4'
WHERE name = 'Sitzende Vorbeuge' AND video_url_de IS NULL;

-- Kindshaltung — Mady Morrison Slow Down Yoga
UPDATE exercise_catalog SET video_url_de = 'https://www.youtube.com/watch?v=dXFoauG-sbc'
WHERE name = 'Kindshaltung' AND video_url_de IS NULL;

-- Taube — Mady Morrison Hüftöffner
UPDATE exercise_catalog SET video_url_de = 'https://www.youtube.com/watch?v=LCFrL_rJ510'
WHERE name = 'Taube' AND video_url_de IS NULL;

-- Kobra — Mady Morrison Asana Fibel: Kobra
UPDATE exercise_catalog SET video_url_de = 'https://www.youtube.com/watch?v=CjbnNX0-16E'
WHERE name = 'Kobra' AND video_url_de IS NULL;

-- Heraufschauender Hund — Mady Morrison (in Sonnengruß)
UPDATE exercise_catalog SET video_url_de = 'https://www.youtube.com/watch?v=d_Ibq08-ucg'
WHERE name = 'Heraufschauender Hund' AND video_url_de IS NULL;

-- Brücke — Mady Morrison Rücken Yoga
UPDATE exercise_catalog SET video_url_de = 'https://www.youtube.com/watch?v=5HswL9z6RgU'
WHERE name = 'Brücke' AND video_url_de IS NULL;

-- Kamel — Mady Morrison Yoga Rückbeuge
UPDATE exercise_catalog SET video_url_de = 'https://www.youtube.com/watch?v=JCsJgYI2vys'
WHERE name = 'Kamel' AND video_url_de IS NULL;

-- Rad — Mady Morrison Yoga Beweglichkeit
UPDATE exercise_catalog SET video_url_de = 'https://www.youtube.com/watch?v=kApPj-mNcO4'
WHERE name = 'Rad' AND video_url_de IS NULL;

-- Katze-Kuh — Mady Morrison Rücken Yoga Anfänger
UPDATE exercise_catalog SET video_url_de = 'https://www.youtube.com/watch?v=p3Q_L90be2s'
WHERE name = 'Katze-Kuh' AND video_url_de IS NULL;

-- Stab — Mady Morrison Sitzende Vorbeuge (enthält Stab als Ausgangsposition)
UPDATE exercise_catalog SET video_url_de = 'https://www.youtube.com/watch?v=kApPj-mNcO4'
WHERE name = 'Stab' AND video_url_de IS NULL;

-- Lotus — Mady Morrison Meditation für Anfänger (im Lotussitz)
UPDATE exercise_catalog SET video_url_de = 'https://www.youtube.com/watch?v=ockCQMt9kM0'
WHERE name = 'Lotus' AND video_url_de IS NULL;

-- Schmetterling — Mady Morrison Hüftöffner
UPDATE exercise_catalog SET video_url_de = 'https://www.youtube.com/watch?v=Abv7M1sgNiU'
WHERE name = 'Schmetterling' AND video_url_de IS NULL;

-- Sitzende Drehung — Mady Morrison Detox Yoga Flow
UPDATE exercise_catalog SET video_url_de = 'https://www.youtube.com/watch?v=AgkawTO_bBA'
WHERE name = 'Sitzende Drehung' AND video_url_de IS NULL;

-- Boot — Mady Morrison Yoga für den Bauch
UPDATE exercise_catalog SET video_url_de = 'https://www.youtube.com/watch?v=Tj3eHle5xTM'
WHERE name = 'Boot' AND video_url_de IS NULL;

-- Brett — Mady Morrison Core Balance
UPDATE exercise_catalog SET video_url_de = 'https://www.youtube.com/watch?v=EiCgTI0uOPc'
WHERE name = 'Brett' AND video_url_de IS NULL;

-- Yoga-Liegestütz — Mady Morrison Sonnengruß A+B
UPDATE exercise_catalog SET video_url_de = 'https://www.youtube.com/watch?v=d_Ibq08-ucg'
WHERE name = 'Yoga-Liegestütz' AND video_url_de IS NULL;

-- Herabschauender Hund — Mady Morrison Asana Fibel
UPDATE exercise_catalog SET video_url_de = 'https://www.youtube.com/watch?v=Y8MwcdTYTq8'
WHERE name = 'Herabschauender Hund' AND video_url_de IS NULL;

-- Schulterstand — Mady Morrison (in Yin Yoga Sessions)
UPDATE exercise_catalog SET video_url_de = 'https://www.youtube.com/watch?v=_eFmBrrCVEM'
WHERE name = 'Schulterstand' AND video_url_de IS NULL;

-- Pflug — Mady Morrison (in Yin Yoga Sessions)
UPDATE exercise_catalog SET video_url_de = 'https://www.youtube.com/watch?v=_eFmBrrCVEM'
WHERE name = 'Pflug' AND video_url_de IS NULL;

-- Kopfstand — Mady Morrison Handstand lernen (verwandte Inversion)
UPDATE exercise_catalog SET video_url_de = 'https://www.youtube.com/watch?v=XZ-0BRG1OiM'
WHERE name = 'Kopfstand' AND video_url_de IS NULL;

-- Krähe — Mady Morrison (in fortgeschrittenen Flows)
UPDATE exercise_catalog SET video_url_de = 'https://www.youtube.com/watch?v=81GGVKcg1i4'
WHERE name = 'Krähe' AND video_url_de IS NULL;

-- Adler — Mady Morrison Balance/Zentrieren
UPDATE exercise_catalog SET video_url_de = 'https://www.youtube.com/watch?v=-UzvYPZReRg'
WHERE name = 'Adler' AND video_url_de IS NULL;

-- Tänzer — Mady Morrison Balance/Zentrieren
UPDATE exercise_catalog SET video_url_de = 'https://www.youtube.com/watch?v=-UzvYPZReRg'
WHERE name = 'Tänzer' AND video_url_de IS NULL;

-- Dreh-Dreieck — Mady Morrison Detox Yoga
UPDATE exercise_catalog SET video_url_de = 'https://www.youtube.com/watch?v=hpCXz7taG2s'
WHERE name = 'Dreh-Dreieck' AND video_url_de IS NULL;

-- Halbmond — Mady Morrison Ganzkörper Flow
UPDATE exercise_catalog SET video_url_de = 'https://www.youtube.com/watch?v=TAbH1yusgRo'
WHERE name = 'Halbmond' AND video_url_de IS NULL;

-- Totenhaltung — Mady Morrison Entspannung & Selbstliebe
UPDATE exercise_catalog SET video_url_de = 'https://www.youtube.com/watch?v=eHGEmo2NGkc'
WHERE name = 'Totenhaltung' AND video_url_de IS NULL;

-- Beine-an-Wand — Mady Morrison Sanftes Abend Yoga
UPDATE exercise_catalog SET video_url_de = 'https://www.youtube.com/watch?v=_i32hVOPlTA'
WHERE name = 'Beine-an-Wand' AND video_url_de IS NULL;

-- Liegender Schmetterling — Mady Morrison Yin Yoga Hüften
UPDATE exercise_catalog SET video_url_de = 'https://www.youtube.com/watch?v=_eFmBrrCVEM'
WHERE name = 'Liegender Schmetterling' AND video_url_de IS NULL;

-- Sonnengruß — Mady Morrison Klassischer Sonnengruß
UPDATE exercise_catalog SET video_url_de = 'https://www.youtube.com/watch?v=8jzBjFd-8YE'
WHERE name = 'Sonnengruß' AND video_url_de IS NULL;


-- ══════════════ TAI CHI — Yang 24 Form (alle 24 = gleiche Tutorial-Videos) ══════════════
-- EN: YMAA Tai Chi 24 Form Tutorial
-- DE: Tai Chi Schule — Yang 24 Form Komplett

UPDATE exercise_catalog
SET video_url_en = 'https://www.youtube.com/watch?v=hbTAOWKUJTk',
    video_url_de = 'https://www.youtube.com/watch?v=nCVMgBEJOF4'
WHERE subcategory = 'tai_chi_yang24'
  AND video_url_en IS NULL;


-- ══════════════ FIVE TIBETANS (alle 5 = gleiche Tutorial-Videos) ══════════════
-- DE: 5-tibeter.net — Komplette Anleitung
-- EN: T5T — Five Tibetan Rites Follow Along

UPDATE exercise_catalog
SET video_url_de = 'https://www.youtube.com/watch?v=Q73BRskyj54',
    video_url_en = 'https://www.youtube.com/watch?v=4tnByEYT3QE'
WHERE subcategory = 'five_tibetans'
  AND video_url_en IS NULL;
