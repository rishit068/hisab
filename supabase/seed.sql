-- Seed data for Hisaab
-- 6 members (first is admin) and 11 categories

-- Members (placeholder names — replace with real names)
INSERT INTO members (id, name, is_admin) VALUES
  (uuid_generate_v4(), 'Ramesh', TRUE),
  (uuid_generate_v4(), 'Meena', FALSE),
  (uuid_generate_v4(), 'Suresh', FALSE),
  (uuid_generate_v4(), 'Priya', FALSE),
  (uuid_generate_v4(), 'Amit', FALSE),
  (uuid_generate_v4(), 'Neha', FALSE);

-- Categories (sorted by sort order)
INSERT INTO categories (id, name, sort) VALUES
  (uuid_generate_v4(), 'Groceries', 1),
  (uuid_generate_v4(), 'Medicine', 2),
  (uuid_generate_v4(), 'Electricity', 3),
  (uuid_generate_v4(), 'Water', 4),
  (uuid_generate_v4(), 'Gas', 5),
  (uuid_generate_v4(), 'Fuel', 6),
  (uuid_generate_v4(), 'Rent', 7),
  (uuid_generate_v4(), 'Dining', 8),
  (uuid_generate_v4(), 'Travel', 9),
  (uuid_generate_v4(), 'Household', 10),
  (uuid_generate_v4(), 'Other', 11);
