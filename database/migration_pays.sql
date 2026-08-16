CREATE TABLE IF NOT EXISTS pays (
    id SERIAL PRIMARY KEY,
    code_pays VARCHAR(10) UNIQUE NOT NULL,
    nom_pays VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO pays (code_pays, nom_pays) VALUES 
('TG', 'Togo'),
('BJ', 'Benin'),
('CI', 'Cote d''Ivoire'),
('GH', 'Ghana'),
('BF', 'Burkina Faso'),
('CM', 'Cameroun'),
('NG', 'Nigeria')
ON CONFLICT (code_pays) DO NOTHING;

ALTER TABLE districts ADD COLUMN IF NOT EXISTS pays_id INTEGER REFERENCES pays(id) ON DELETE CASCADE;
UPDATE districts SET pays_id = (SELECT id FROM pays WHERE code_pays = 'TG' LIMIT 1) WHERE pays_id IS NULL;

ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS pays_id INTEGER REFERENCES pays(id) ON DELETE SET NULL;
UPDATE utilisateurs SET pays_id = (SELECT id FROM pays WHERE code_pays = 'TG' LIMIT 1), role = 'ADMIN_AFRIQUE' WHERE email = 'admin@tlwm.tg';
