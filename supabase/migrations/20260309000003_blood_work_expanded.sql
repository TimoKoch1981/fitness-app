-- Expand blood_work table from 22 to 38 biomarkers
-- New columns: cortisol, free_androgen_index, erythrocytes, leukocytes, platelets,
-- bilirubin, alkaline_phosphatase, urea, fasting_glucose, uric_acid, iron,
-- total_protein, potassium, sodium, calcium, free_psa

ALTER TABLE blood_work ADD COLUMN IF NOT EXISTS cortisol REAL;
ALTER TABLE blood_work ADD COLUMN IF NOT EXISTS free_androgen_index REAL;
ALTER TABLE blood_work ADD COLUMN IF NOT EXISTS erythrocytes REAL;
ALTER TABLE blood_work ADD COLUMN IF NOT EXISTS leukocytes REAL;
ALTER TABLE blood_work ADD COLUMN IF NOT EXISTS platelets REAL;
ALTER TABLE blood_work ADD COLUMN IF NOT EXISTS bilirubin REAL;
ALTER TABLE blood_work ADD COLUMN IF NOT EXISTS alkaline_phosphatase REAL;
ALTER TABLE blood_work ADD COLUMN IF NOT EXISTS urea REAL;
ALTER TABLE blood_work ADD COLUMN IF NOT EXISTS fasting_glucose REAL;
ALTER TABLE blood_work ADD COLUMN IF NOT EXISTS uric_acid REAL;
ALTER TABLE blood_work ADD COLUMN IF NOT EXISTS iron REAL;
ALTER TABLE blood_work ADD COLUMN IF NOT EXISTS total_protein REAL;
ALTER TABLE blood_work ADD COLUMN IF NOT EXISTS potassium REAL;
ALTER TABLE blood_work ADD COLUMN IF NOT EXISTS sodium REAL;
ALTER TABLE blood_work ADD COLUMN IF NOT EXISTS calcium REAL;
ALTER TABLE blood_work ADD COLUMN IF NOT EXISTS free_psa REAL;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
