-- F17: Smart Shopping Lists
-- Tables: shopping_lists + shopping_list_items
-- RLS: user owns list, items accessible via list ownership

-- ── shopping_lists ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS shopping_lists (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL DEFAULT '',
  source_recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at  TIMESTAMPTZ
);

CREATE INDEX idx_shopping_lists_user ON shopping_lists(user_id);
CREATE INDEX idx_shopping_lists_active ON shopping_lists(user_id, is_active) WHERE is_active = true;

-- RLS
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own shopping lists"
  ON shopping_lists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own shopping lists"
  ON shopping_lists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shopping lists"
  ON shopping_lists FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own shopping lists"
  ON shopping_lists FOR DELETE
  USING (auth.uid() = user_id);

-- GRANTs
GRANT SELECT, INSERT, UPDATE, DELETE ON shopping_lists TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON shopping_lists TO service_role;

-- ── shopping_list_items ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS shopping_list_items (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id               UUID NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  ingredient_name       TEXT NOT NULL,
  ingredient_normalized TEXT NOT NULL,
  amount                TEXT,
  unit                  TEXT,
  category              TEXT NOT NULL DEFAULT 'sonstiges',
  is_checked            BOOLEAN NOT NULL DEFAULT false,
  added_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_shopping_list_items_list ON shopping_list_items(list_id);

-- RLS: items accessible via list ownership
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view items of own lists"
  ON shopping_list_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM shopping_lists sl
    WHERE sl.id = shopping_list_items.list_id
      AND sl.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert items to own lists"
  ON shopping_list_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM shopping_lists sl
    WHERE sl.id = shopping_list_items.list_id
      AND sl.user_id = auth.uid()
  ));

CREATE POLICY "Users can update items of own lists"
  ON shopping_list_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM shopping_lists sl
    WHERE sl.id = shopping_list_items.list_id
      AND sl.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete items from own lists"
  ON shopping_list_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM shopping_lists sl
    WHERE sl.id = shopping_list_items.list_id
      AND sl.user_id = auth.uid()
  ));

-- GRANTs
GRANT SELECT, INSERT, UPDATE, DELETE ON shopping_list_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON shopping_list_items TO service_role;
