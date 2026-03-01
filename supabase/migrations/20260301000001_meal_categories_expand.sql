-- Expand meal categories from 4 to 6 (add morning_snack, afternoon_snack)
-- Twin-Testing Finding: Dominik (C1) logs 6 meals/day, Marco (B3) has shift work with no fixed times

ALTER TABLE meals DROP CONSTRAINT IF EXISTS meals_type_check;
ALTER TABLE meals ADD CONSTRAINT meals_type_check
  CHECK (type IN ('breakfast', 'morning_snack', 'lunch', 'afternoon_snack', 'dinner', 'snack'));
