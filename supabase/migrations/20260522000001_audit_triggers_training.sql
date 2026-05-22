-- B29 (2026-05-22): Audit-Trigger-Lücke schließen — Trainingsplan-Tabellen
--
-- Beobachtet 2026-05-22 im User-Test: Buddy hat für c.merzbach@web.de einen
-- neuen Trainingsplan ("Psoas-Fokussiertes Training") erstellt und den alten
-- 3-Tage-Hauptplan deaktiviert. Im audit_logs ist von beidem nichts zu sehen,
-- weil die Trigger nur auf den 14 ursprünglichen Tabellen aus
-- 20260301000008_audit_trail.sql liegen.
--
-- DSGVO Art. 5 Abs. 1 lit. f verlangt Audit-Trail für alle relevanten
-- Datenveränderungen an Gesundheits- und Trainingsdaten. training_plans
-- + training_plan_days + training_phase_cycles sind klar Trainingsdaten.
--
-- Nicht eingeschlossen (kein Health-Datum):
--   - recipes / user_pantry / shopping_lists / shopping_list_items
-- Lassen sich später nachziehen, falls als personenbezogene Profilbildung
-- klassifiziert.

-- Trainingsplan-Header (split, days_per_week, is_active, ...)
CREATE OR REPLACE TRIGGER audit_training_plans
  AFTER INSERT OR UPDATE OR DELETE ON training_plans
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();

-- Trainingsplan-Tage (Übungen pro Tag).
-- Hat keine eigene user_id-Spalte (FK über plan_id) — der Trigger nutzt
-- den auth.uid()-Fallback aus audit_trigger_fn (siehe COALESCE in
-- 20260301000008_audit_trail.sql Zeile 71-76).
CREATE OR REPLACE TRIGGER audit_training_plan_days
  AFTER INSERT OR UPDATE OR DELETE ON training_plan_days
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();

-- Periodisierung (Bulk/Cut/Peak-Cycles)
CREATE OR REPLACE TRIGGER audit_training_phase_cycles
  AFTER INSERT OR UPDATE OR DELETE ON training_phase_cycles
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();
