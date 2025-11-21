-- Seed charities for existing crises
-- Make sure to run this after you have crises in your database

-- Add charities for various crisis types
INSERT INTO charities (name, description, donation_url, crisis_id) VALUES
  ('International Red Cross', 'Leading humanitarian organization providing emergency assistance', 'https://opencollective.com/red-cross', 18),
  ('Direct Relief', 'Improves the health and lives of people affected by poverty or emergencies', 'https://opencollective.com/direct-relief', 18),
  
  ('UNICEF', 'Works in over 190 countries to save children''s lives', 'https://opencollective.com/unicef', 21),
  ('Save the Children', 'Helping children in need around the world', 'https://opencollective.com/save-the-children', 21),
  
  ('Doctors Without Borders', 'Medical humanitarian organization', 'https://opencollective.com/doctors-without-borders', 24),
  ('World Health Organization', 'International public health organization', 'https://opencollective.com/who', 24),
  
  ('World Food Programme', 'Fighting hunger worldwide', 'https://opencollective.com/wfp', 25),
  ('Action Against Hunger', 'Global humanitarian organization fighting hunger', 'https://opencollective.com/action-against-hunger', 25),
  
  ('Oxfam', 'Working to end poverty and injustice', 'https://opencollective.com/oxfam', 18),
  ('CARE International', 'Fighting global poverty through development', 'https://opencollective.com/care', 21)
ON CONFLICT DO NOTHING;

-- Verify the inserts
SELECT c.id, c.title, ch.name, ch.donation_url 
FROM crises c 
LEFT JOIN charities ch ON ch.crisis_id = c.id 
WHERE ch.id IS NOT NULL
ORDER BY c.id
LIMIT 20;
