-- ============================================================
-- DROPDOWN MASTER SEED DATA
-- Loaded by `npm run db:init` when dropdown_options is empty
-- ============================================================

-- Clear existing data (optional — comment out if you want to keep existing)
-- TRUNCATE TABLE dropdown_options RESTART IDENTITY;

-- ── 1. NATIONALITY ──────────────────────────────────────────
INSERT INTO dropdown_options (category, value, sort_order) VALUES
  ('nationality', 'Indian',        1),
  ('nationality', 'Afghan',        2),
  ('nationality', 'Australian',    3),
  ('nationality', 'Bangladeshi',   4),
  ('nationality', 'Bhutanese',     5),
  ('nationality', 'British',       6),
  ('nationality', 'Canadian',      7),
  ('nationality', 'Chinese',       8),
  ('nationality', 'French',        9),
  ('nationality', 'German',        10),
  ('nationality', 'Indonesian',    11),
  ('nationality', 'Iranian',       12),
  ('nationality', 'Japanese',      13),
  ('nationality', 'Malaysian',     14),
  ('nationality', 'Maldivian',     15),
  ('nationality', 'Nepali',        16),
  ('nationality', 'Pakistani',     17),
  ('nationality', 'Russian',       18),
  ('nationality', 'Saudi Arabian', 19),
  ('nationality', 'Singaporean',   20),
  ('nationality', 'Sri Lankan',    21),
  ('nationality', 'Thai',          22),
  ('nationality', 'Turkish',       23),
  ('nationality', 'American',      24),
  ('nationality', 'Others',        99)
ON CONFLICT (category, value, parent) DO NOTHING;

-- ── 2. RELIGION ─────────────────────────────────────────────
INSERT INTO dropdown_options (category, value, sort_order) VALUES
  ('religion', 'Hindu',       1),
  ('religion', 'Muslim',      2),
  ('religion', 'Christian',   3),
  ('religion', 'Sikh',        4),
  ('religion', 'Buddhist',    5),
  ('religion', 'Jain',        6),
  ('religion', 'Zoroastrian', 7),
  ('religion', 'Jewish',      8),
  ('religion', 'Others',      99)
ON CONFLICT (category, value, parent) DO NOTHING;

-- ── 3. COMMUNITY (parent = religion) ────────────────────────
INSERT INTO dropdown_options (category, value, parent, sort_order) VALUES
  -- Hindu
  ('community', 'OC',     'Hindu', 1),
  ('community', 'BC',     'Hindu', 2),
  ('community', 'BC(M)',  'Hindu', 3),
  ('community', 'MBC',    'Hindu', 4),
  ('community', 'MBC(V)', 'Hindu', 5),
  ('community', 'SC',     'Hindu', 6),
  ('community', 'SC(A)',  'Hindu', 7),
  ('community', 'ST',     'Hindu', 8),
  -- Muslim
  ('community', 'BC(M)',  'Muslim', 1),
  ('community', 'OC',     'Muslim', 2),
  -- Christian
  ('community', 'BC(C)',  'Christian', 1),
  ('community', 'SC(C)',  'Christian', 2),
  ('community', 'ST',     'Christian', 3),
  ('community', 'OC',     'Christian', 4),
  -- Sikh
  ('community', 'OC',     'Sikh', 1),
  -- Buddhist
  ('community', 'OC',     'Buddhist', 1),
  ('community', 'SC',     'Buddhist', 2),
  -- Jain
  ('community', 'OC',     'Jain', 1),
  -- Zoroastrian
  ('community', 'OC',     'Zoroastrian', 1),
  -- Jewish
  ('community', 'OC',     'Jewish', 1),
  -- Others
  ('community', 'OC',     'Others', 1),
  ('community', 'BC',     'Others', 2),
  ('community', 'SC',     'Others', 3),
  ('community', 'ST',     'Others', 4)
ON CONFLICT (category, value, parent) DO NOTHING;

-- ── 4. CASTE (parent = community) ───────────────────────────
INSERT INTO dropdown_options (category, value, parent, sort_order) VALUES
  -- OC
  ('caste', 'Brahmin - Iyer',          'OC', 1),
  ('caste', 'Brahmin - Iyengar',       'OC', 2),
  ('caste', 'Brahmin - Others',        'OC', 3),
  ('caste', 'Mudaliar',                'OC', 4),
  ('caste', 'Vellalar',                'OC', 5),
  ('caste', 'Pillai',                  'OC', 6),
  ('caste', 'Chettiar',                'OC', 7),
  ('caste', 'Naidu',                   'OC', 8),
  ('caste', 'Gounder (OC)',            'OC', 9),
  ('caste', 'Kamma',                   'OC', 10),
  ('caste', 'Reddy',                   'OC', 11),
  ('caste', 'Nair',                    'OC', 12),
  ('caste', 'Kshatriya',               'OC', 13),
  ('caste', 'Vysya',                   'OC', 14),
  ('caste', 'Arya Vysya',              'OC', 15),
  ('caste', 'Balija',                  'OC', 16),
  ('caste', 'Nattukotai Chettiar',     'OC', 17),
  ('caste', 'Saiva Vellalar',          'OC', 18),
  ('caste', 'Senguntha Mudaliar',      'OC', 19),
  ('caste', 'Sozhia Vellalar',         'OC', 20),
  ('caste', 'Thuluva Vellalar',        'OC', 21),
  ('caste', 'Udayar',                  'OC', 22),
  ('caste', 'Vishwakarma',             'OC', 23),
  ('caste', 'Others',                  'OC', 99),
  -- BC
  ('caste', 'Agamudayar',              'BC', 1),
  ('caste', 'Ambalakarar',             'BC', 2),
  ('caste', 'Boyar',                   'BC', 3),
  ('caste', 'Devanga',                 'BC', 4),
  ('caste', 'Gounder (BC)',            'BC', 5),
  ('caste', 'Idaiyar',                 'BC', 6),
  ('caste', 'Kaikolar',                'BC', 7),
  ('caste', 'Kallar',                  'BC', 8),
  ('caste', 'Konar',                   'BC', 9),
  ('caste', 'Kongu Vellalar',          'BC', 10),
  ('caste', 'Kumbar',                  'BC', 11),
  ('caste', 'Kurumbar',                'BC', 12),
  ('caste', 'Maravars',                'BC', 13),
  ('caste', 'Meenavar',                'BC', 14),
  ('caste', 'Mudaliar (BC)',           'BC', 15),
  ('caste', 'Mukkuvar',                'BC', 16),
  ('caste', 'Muthuraja',               'BC', 17),
  ('caste', 'Naicker (BC)',            'BC', 18),
  ('caste', 'Nadar',                   'BC', 19),
  ('caste', 'Padayachi',               'BC', 20),
  ('caste', 'Saliyar',                 'BC', 21),
  ('caste', 'Senaithalaivar',          'BC', 22),
  ('caste', 'Thachar',                 'BC', 23),
  ('caste', 'Uppara',                  'BC', 24),
  ('caste', 'Urali Gounder',           'BC', 25),
  ('caste', 'Valayar',                 'BC', 26),
  ('caste', 'Vannar',                  'BC', 27),
  ('caste', 'Vanniyar',                'BC', 28),
  ('caste', 'Vishwakarma',             'BC', 29),
  ('caste', 'Yadavar',                 'BC', 30),
  ('caste', 'Others',                  'BC', 99),
  -- BC(M)
  ('caste', 'Dekkani Muslim',          'BC(M)', 1),
  ('caste', 'Dudekula',                'BC(M)', 2),
  ('caste', 'Labbai',                  'BC(M)', 3),
  ('caste', 'Lebbai',                  'BC(M)', 4),
  ('caste', 'Marakkar',                'BC(M)', 5),
  ('caste', 'Marakkayar',              'BC(M)', 6),
  ('caste', 'Memon',                   'BC(M)', 7),
  ('caste', 'Nattu Labbai',            'BC(M)', 8),
  ('caste', 'Rawther',                 'BC(M)', 9),
  ('caste', 'Rowther',                 'BC(M)', 10),
  ('caste', 'Sheik',                   'BC(M)', 11),
  ('caste', 'Syed',                    'BC(M)', 12),
  ('caste', 'Tamil Muslim',            'BC(M)', 13),
  ('caste', 'Others',                  'BC(M)', 99),
  -- BC(C)
  ('caste', 'Adi Dravida Christian',   'BC(C)', 1),
  ('caste', 'Anglo Indian',            'BC(C)', 2),
  ('caste', 'Christian Nadar',         'BC(C)', 3),
  ('caste', 'Christian Vanniyar',      'BC(C)', 4),
  ('caste', 'Latin Catholic',          'BC(C)', 5),
  ('caste', 'Protestant Christian',    'BC(C)', 6),
  ('caste', 'Roman Catholic',          'BC(C)', 7),
  ('caste', 'Others',                  'BC(C)', 99),
  -- MBC
  ('caste', 'Agamudayar (MBC)',        'MBC', 1),
  ('caste', 'Chakkiliyar (MBC)',       'MBC', 2),
  ('caste', 'Idaiyar (MBC)',           'MBC', 3),
  ('caste', 'Kallar (MBC)',            'MBC', 4),
  ('caste', 'Konar (MBC)',             'MBC', 5),
  ('caste', 'Kumbar (MBC)',            'MBC', 6),
  ('caste', 'Kurumbar (MBC)',          'MBC', 7),
  ('caste', 'Maravars (MBC)',          'MBC', 8),
  ('caste', 'Meenavar (MBC)',          'MBC', 9),
  ('caste', 'Mudaliar (MBC)',          'MBC', 10),
  ('caste', 'Muthuraja (MBC)',         'MBC', 11),
  ('caste', 'Naicker (MBC)',           'MBC', 12),
  ('caste', 'Nadar',                   'MBC', 13),
  ('caste', 'Padayachi (MBC)',         'MBC', 14),
  ('caste', 'Vanniyar (MBC)',          'MBC', 15),
  ('caste', 'Vishwakarma (MBC)',       'MBC', 16),
  ('caste', 'Yadavar (MBC)',           'MBC', 17),
  ('caste', 'Others',                  'MBC', 99),
  -- MBC(V)
  ('caste', 'Vokkaliga',               'MBC(V)', 1),
  ('caste', 'Vokkaliga Gowda',         'MBC(V)', 2),
  ('caste', 'Others',                  'MBC(V)', 99),
  -- SC
  ('caste', 'Adi Dravida',             'SC', 1),
  ('caste', 'Arunthathiyar',           'SC', 2),
  ('caste', 'Chakkiliyar',             'SC', 3),
  ('caste', 'Chamar',                  'SC', 4),
  ('caste', 'Devendrakulam',           'SC', 5),
  ('caste', 'Madiga',                  'SC', 6),
  ('caste', 'Mala',                    'SC', 7),
  ('caste', 'Pallan',                  'SC', 8),
  ('caste', 'Paraiyar',                'SC', 9),
  ('caste', 'Pulayan',                 'SC', 10),
  ('caste', 'Puthirai Vannan',         'SC', 11),
  ('caste', 'Vannan (SC)',             'SC', 12),
  ('caste', 'Others',                  'SC', 99),
  -- SC(A)
  ('caste', 'Arunthathiyar',           'SC(A)', 1),
  ('caste', 'Chakkiliyan',             'SC(A)', 2),
  ('caste', 'Chakkiliyar',             'SC(A)', 3),
  ('caste', 'Madiga',                  'SC(A)', 4),
  ('caste', 'Others',                  'SC(A)', 99),
  -- SC(C)
  ('caste', 'Adi Dravida Christian',   'SC(C)', 1),
  ('caste', 'Christian Paraiyar',      'SC(C)', 2),
  ('caste', 'Christian Pallan',        'SC(C)', 3),
  ('caste', 'Christian Chakkiliyar',   'SC(C)', 4),
  ('caste', 'Others',                  'SC(C)', 99),
  -- ST
  ('caste', 'Irular',                  'ST', 1),
  ('caste', 'Kattunayakan',            'ST', 2),
  ('caste', 'Koraga',                  'ST', 3),
  ('caste', 'Kota',                    'ST', 4),
  ('caste', 'Kurumba',                 'ST', 5),
  ('caste', 'Malasar',                 'ST', 6),
  ('caste', 'Malayan',                 'ST', 7),
  ('caste', 'Mudugar',                 'ST', 8),
  ('caste', 'Muduvan',                 'ST', 9),
  ('caste', 'Paniyan',                 'ST', 10),
  ('caste', 'Sholaga',                 'ST', 11),
  ('caste', 'Toda',                    'ST', 12),
  ('caste', 'Others',                  'ST', 99)
ON CONFLICT (category, value, parent) DO NOTHING;

-- ── 5. MEDIUM ────────────────────────────────────────────────
INSERT INTO dropdown_options (category, value, sort_order) VALUES
  ('medium', 'Tamil',   1),
  ('medium', 'English', 2),
  ('medium', 'Hindi',   3),
  ('medium', 'Telugu',  4),
  ('medium', 'Kannada', 5),
  ('medium', 'Malayalam', 6),
  ('medium', 'Urdu',    7),
  ('medium', 'Others',  99)
ON CONFLICT (category, value, parent) DO NOTHING;

-- ── 6. PROMOTION STATUS ──────────────────────────────────────
INSERT INTO dropdown_options (category, value, sort_order) VALUES
  ('promotion_status', 'Qualified',                          1),
  ('promotion_status', 'Not Qualified',                      2),
  ('promotion_status', 'Promoted',                           3),
  ('promotion_status', 'Course Completed',                   4),
  ('promotion_status', 'Detained',                           5),
  ('promotion_status', 'Passed',                             6),
  ('promotion_status', 'Failed',                             7),
  ('promotion_status', 'Eligible for Higher Studies',        8),
  ('promotion_status', 'Not Eligible for Higher Studies',    9)
ON CONFLICT (category, value, parent) DO NOTHING;

-- ── 7. CONDUCT ───────────────────────────────────────────────
INSERT INTO dropdown_options (category, value, sort_order) VALUES
  ('conduct', 'Good',                  1),
  ('conduct', 'Very Good',             2),
  ('conduct', 'Excellent',             3),
  ('conduct', 'Satisfactory',          4),
  ('conduct', 'Outstanding',           5),
  ('conduct', 'Good and Satisfactory', 6)
ON CONFLICT (category, value, parent) DO NOTHING;

-- ── 8. REASON ────────────────────────────────────────────────
INSERT INTO dropdown_options (category, value, sort_order) VALUES
  ('reason', 'Completion of Course',                        1),
  ('reason', 'Higher Studies',                              2),
  ('reason', 'Employment',                                  3),
  ('reason', 'Personal Reasons',                            4),
  ('reason', 'Transfer of Parents',                         5),
  ('reason', 'Financial Reasons',                           6),
  ('reason', 'Health Reasons',                              7),
  ('reason', 'Migration',                                   8),
  ('reason', 'Joining Another Institution',                 9),
  ('reason', 'At the Request of Parents / Guardian',        10),
  ('reason', 'Others',                                      99)
ON CONFLICT (category, value, parent) DO NOTHING;
