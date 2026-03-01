-- Breastfeeding / Stillzeit support.
-- Adds a boolean flag to profiles for lactation calorie adjustment (+300-500 kcal/day).
-- Only relevant for gender='female', gated via useGenderFeatures hook.
-- Scientific basis: Dewey et al. 2003 (PMID:14506247), ~500 kcal/day energy cost of exclusive lactation.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_breastfeeding BOOLEAN DEFAULT false;
