-- ==============================================================================
-- SEED DE DONNEES INITIALES (GENERATION AUTOMATIQUE)
-- ==============================================================================

-- 1. INSERTION DES DISTRICTS
INSERT INTO districts (code_district, nom_district) VALUES ('D-BASS', 'BASSAR') ON CONFLICT (code_district) DO NOTHING;
INSERT INTO districts (code_district, nom_district) VALUES ('D-BERC', 'BERCEAU') ON CONFLICT (code_district) DO NOTHING;
INSERT INTO districts (code_district, nom_district) VALUES ('D-BINA', 'BINAH') ON CONFLICT (code_district) DO NOTHING;
INSERT INTO districts (code_district, nom_district) VALUES ('D-CENT', 'CENTRAL') ON CONFLICT (code_district) DO NOTHING;
INSERT INTO districts (code_district, nom_district) VALUES ('D-CENT', 'CENTRALE') ON CONFLICT (code_district) DO NOTHING;
INSERT INTO districts (code_district, nom_district) VALUES ('D-GAME', 'GAME') ON CONFLICT (code_district) DO NOTHING;
INSERT INTO districts (code_district, nom_district) VALUES ('D-KARA', 'KARA') ON CONFLICT (code_district) DO NOTHING;
INSERT INTO districts (code_district, nom_district) VALUES ('D-KARA', 'KARA-SOKODE') ON CONFLICT (code_district) DO NOTHING;
INSERT INTO districts (code_district, nom_district) VALUES ('D-LITT', 'LITTORAL') ON CONFLICT (code_district) DO NOTHING;
INSERT INTO districts (code_district, nom_district) VALUES ('D-PLAT', 'PLATEAUX-EST') ON CONFLICT (code_district) DO NOTHING;
INSERT INTO districts (code_district, nom_district) VALUES ('D-PLAT', 'PLATEAUX-OUEST') ON CONFLICT (code_district) DO NOTHING;
INSERT INTO districts (code_district, nom_district) VALUES ('D-SAVA', 'SAVANES') ON CONFLICT (code_district) DO NOTHING;
INSERT INTO districts (code_district, nom_district) VALUES ('D-YOTO', 'YOTO') ON CONFLICT (code_district) DO NOTHING;

-- 2. INSERTION DES ASSEMBLEES
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'BASSAR' LIMIT 1), 'A-001', 'Bassar', 'Assemblée', 48, 9.260468, 0.784253)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'BASSAR' LIMIT 1), 'A-002', 'Kabou', 'Assemblée', 24, 9.454745, 0.8185)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'BASSAR' LIMIT 1), 'A-003', 'Guérin Kouka', 'Assemblée', 15, 9.691624, 0.608885)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'BASSAR' LIMIT 1), 'A-004', 'Dimori', 'Assemblée', 10, 9.202836, 0.591929)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'BERCEAU' LIMIT 1), 'A-005', 'Gbatope lycée', 'Assemblée', 26, 6.445571, 1.25992)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'BERCEAU' LIMIT 1), 'A-006', 'Notsè', 'Assemblée', 112, 6.939053, 1.165282)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'BERCEAU' LIMIT 1), 'A-007', 'Agbelouvé', 'Assemblée', 41, 6.67183, 1.167253)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'BERCEAU' LIMIT 1), 'A-008', 'Wahala (Gotha -Conakry)', 'Assemblée', 12, 7.18908, 1.120628)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'BERCEAU' LIMIT 1), 'A-009', 'Agoto', 'Assemblée', 46, 6.849863, 1.370009)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'BERCEAU' LIMIT 1), 'A-010', 'Davié', 'Assemblée', 83, 6.385789, 1.199079)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'BERCEAU' LIMIT 1), 'A-011', 'Tsevié', 'Assemblée', 143, 6.419732, 1.211198)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'BINAH' LIMIT 1), 'A-012', 'Kétao', 'Assemblée', 77, 9.6683, 1.322419)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'BINAH' LIMIT 1), 'A-013', 'Houloun', 'Assemblée', 32, 9.684249, 1.235496)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'BINAH' LIMIT 1), 'A-014', 'Asere', 'Assemblée', 15, 9.788618, 1.313727)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'BINAH' LIMIT 1), 'A-015', 'Koukade', 'Assemblée', 16, 9.861798, 1.36494)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'CENTRAL' LIMIT 1), 'A-016', 'Sokodé - Barrière', 'Assemblée', 54, 8.993142000000002, 1.133688)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'CENTRAL' LIMIT 1), 'A-017', 'Haloukpaboundou', 'Assemblée', 58, 8.688631000000003, 1.114542)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'CENTRAL' LIMIT 1), 'A-018', 'Solao', 'Assemblée', 7, 8.766252, 1.131245)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'CENTRAL' LIMIT 1), 'A-019', 'Sotouboua', 'Assemblée', 70, 8.554221, 0.977939)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'CENTRAL' LIMIT 1), 'A-020', 'Kassikade', 'Assemblée', 26, 8.604999, 1.222739)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'CENTRALE' LIMIT 1), 'A-021', 'Affossala', 'Assemblée', 56, 8.454602, 1.305357)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'GAME' LIMIT 1), 'A-022', 'Kpoklolo', 'Assemblée', 65, 6.768942, 0.970025)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'GAME' LIMIT 1), 'A-023', 'Atikoloe', 'Assemblée', 42, 6.766517, 0.985618)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'GAME' LIMIT 1), 'A-024', 'Abolodji', 'Assemblée', 19, 6.753982, 0.992558)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'GAME' LIMIT 1), 'A-025', 'Lomnava', 'Assemblée', 26, 6.73336, 0.989043)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'GAME' LIMIT 1), 'A-026', 'Ake', 'Assemblée', 11, 6.757057, 0.960465)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'GAME' LIMIT 1), 'A-027', 'Wonougba', 'Assemblée', 11, 6.75536, 0.90878)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'KARA' LIMIT 1), 'A-028', 'Koutamagou', 'Assemblée', 22, 10.082772, 1.195916)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'KARA' LIMIT 1), 'A-029', 'Kantè', 'Assemblée', 34, 9.938823, 1.029362)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'KARA' LIMIT 1), 'A-030', 'Niamtougou', 'Assemblée', 8, 9.756717, 1.105819)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'KARA' LIMIT 1), 'A-031', 'Dongoyo', 'Assemblée', 180, 9.545149, 1.183317)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'KARA' LIMIT 1), 'A-032', 'Bohou', 'Assemblée', 15, 9.605137, 1.160866)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'KARA-SOKODE' LIMIT 1), 'A-033', 'Défalé', 'Assemblée', 12, 9.862727, 1.092697)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'LITTORAL' LIMIT 1), 'A-034', 'Gbetsogbe', 'Assemblée', 45, 6.153415, 1.307565)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'LITTORAL' LIMIT 1), 'A-035', 'Sogbosito-Kove', 'Assemblée', 144, 6.250478, 1.160081)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'LITTORAL' LIMIT 1), 'A-036', 'Apédokoè', 'Assemblée', 315, 6.20415, 1.146228)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'LITTORAL' LIMIT 1), 'A-037', 'Adetikope', 'Assemblée', 134, 6.322549, 1.221887)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'LITTORAL' LIMIT 1), 'A-038', 'Kpessi', 'Assemblée', 90, 6.21139, 1.438875)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'LITTORAL' LIMIT 1), 'A-039', 'Noepe', 'Assemblée', 45, 6.258392, 1.044022)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'LITTORAL' LIMIT 1), 'A-040', 'Hedzranawoe', 'Assemblée', 40, 6.194336, 1.244023)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'LITTORAL' LIMIT 1), 'A-041', 'Djagblé', 'Assemblée', 267, 6.24978, 1.292027)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'LITTORAL' LIMIT 1), 'A-042', 'Togo 2000', 'Assemblée', 150, 6.182929, 1.255299)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'LITTORAL' LIMIT 1), 'A-043', 'Baguida', 'Assemblée', 310, 6.172297, 1.323761)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'LITTORAL' LIMIT 1), 'A-044', 'Tokoin Gbadago', 'Assemblée', 147, 6.14748, 1.214012)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'LITTORAL' LIMIT 1), 'A-045', 'Klémé', 'Assemblée', 63, 6.223697, 1.092297)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'LITTORAL' LIMIT 1), 'A-046', 'Bè', 'Assemblée', 260, 6.155721, 1.252119)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'LITTORAL' LIMIT 1), 'A-047', 'Wonyome', 'Assemblée', 162, 6.193847, 1.149405)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'LITTORAL' LIMIT 1), 'A-048', 'Cacaveli', 'Assemblée', 48, 6.216409, 1.1982)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'LITTORAL' LIMIT 1), 'A-049', 'Adoglové', 'Assemblée', 20, 6.307467, 1.233909)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'LITTORAL' LIMIT 1), 'A-050', 'Forever', 'Assemblée', 98, 6.164715, 1.22465)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'LITTORAL' LIMIT 1), 'A-051', 'Gbomame', 'Assemblée', 124, 6.19927, 1.128131)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'LITTORAL' LIMIT 1), 'A-052', 'Dabarakondji', 'Assemblée', 181, 6.176202, 1.278122)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'LITTORAL' LIMIT 1), 'A-053', 'Nanégbe', 'Assemblée', 83, 6.22795, 1.15123)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'LITTORAL' LIMIT 1), 'A-054', 'Kove', 'Assemblée', 144, 6.250083, 1.15982)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'LITTORAL' LIMIT 1), 'A-055', 'Atsanve', 'Assemblée', 170, 6.234807, 1.204213)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'LITTORAL' LIMIT 1), 'A-056', 'Awatame', 'Assemblée', 30, 6.170132, 1.162627)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'LITTORAL' LIMIT 1), 'A-057', 'Togblekopé', 'Assemblée', 51, 6.264055, 1.217875)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'LITTORAL' LIMIT 1), 'A-058', 'Agoé Fiovi', 'Assemblée', 170, 6.24001, 1.184684)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'LITTORAL' LIMIT 1), 'A-059', 'Mission-Tové', 'Assemblée', 35, 6.321566, 1.126827)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'LITTORAL' LIMIT 1), 'A-060', 'Adakpamé', 'Assemblée', 165, 6.177892, 1.300318)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'LITTORAL' LIMIT 1), 'A-061', 'Akato viépé', 'Assemblée', 83, 6.171933, 1.09115)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'PLATEAUX-EST' LIMIT 1), 'A-062', 'Atakpamé', 'Assemblée', 13, 7.52334, 1.167383)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'PLATEAUX-EST' LIMIT 1), 'A-063', 'Amou-oblo', 'Assemblée', 14, 7.387165, 0.867793)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'PLATEAUX-EST' LIMIT 1), 'A-064', 'Gbadi Gawado', 'Assemblée', 35, 7.479363, 0.76049)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'PLATEAUX-EST' LIMIT 1), 'A-065', 'Ebeva', 'Assemblée', 15, 7.526048, 1.082835)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'PLATEAUX-EST' LIMIT 1), 'A-066', 'Doulasseme', 'Assemblée', 42, 7.527693, 1.119638)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'PLATEAUX-EST' LIMIT 1), 'A-067', 'Assemblée de GLEI', 'Assemblée', 59, 7.311867, 1.164383)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'PLATEAUX-EST' LIMIT 1), 'A-068', 'Glei', 'Assemblée', 59, 7.311847, 1.164271)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'PLATEAUX-EST' LIMIT 1), 'A-069', 'Kougnohou', 'Assemblée', 28, 7.656862, 0.794364)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'PLATEAUX-EST' LIMIT 1), 'A-070', 'Atkpame', 'Assemblée', 107, 7.514653, 1.162978)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'PLATEAUX-EST' LIMIT 1), 'A-071', 'Anie', 'Assemblée', 50, 7.76997, 1.203212)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'PLATEAUX-EST' LIMIT 1), 'A-072', 'Badou', 'Assemblée', 14, 7.587279, 0.604776)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'PLATEAUX-EST' LIMIT 1), 'A-073', 'Sodo', 'Assemblée', 14, 7.314933, 0.812785)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'PLATEAUX-OUEST' LIMIT 1), 'A-074', 'Kpalimé Béthel', 'Assemblée', 119, 6.899165, 0.616141)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'PLATEAUX-OUEST' LIMIT 1), 'A-075', 'Kpalimé Nogo', 'Assemblée', 40, 6.910642, 0.651024)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'PLATEAUX-OUEST' LIMIT 1), 'A-076', 'Kévé et Assahoun', 'Assemblée', 42, 6.428358, 0.935753)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'PLATEAUX-OUEST' LIMIT 1), 'A-077', 'Amoussoukopé', 'Assemblée', 73, 6.657045, 0.84584)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'PLATEAUX-OUEST' LIMIT 1), 'A-078', 'Gadzéfé', 'Assemblée', 35, 6.844982, 0.716695)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'PLATEAUX-OUEST' LIMIT 1), 'A-079', 'Agbadjanakin', 'Assemblée', 11, 6.481883, 0.82579)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'PLATEAUX-OUEST' LIMIT 1), 'A-080', 'Tové Agbessia', 'Assemblée', 10, 6.874428, 0.667483)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'PLATEAUX-OUEST' LIMIT 1), 'A-081', 'Agou Nyogbo', 'Assemblée', 15, NULL, NULL)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'PLATEAUX-OUEST' LIMIT 1), 'A-082', 'Attigbé Dzogbepimé', 'Assemblée', 65, 6.829521, 0.718081)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'PLATEAUX-OUEST' LIMIT 1), 'A-083', 'Gadzéfé', 'Assemblée', 35, 6.844982, 0.716695)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'PLATEAUX-OUEST' LIMIT 1), 'A-084', 'Tovegan', 'Assemblée', 16, 6.564754, 0.893195)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'PLATEAUX-OUEST' LIMIT 1), 'A-085', 'Atti atovou', 'Assemblée', 13, 6.548966, 0.868742)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'PLATEAUX-OUEST' LIMIT 1), 'A-086', 'Hanyigba Todzi', 'Assemblée', 32, 6.894798, 0.561044)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'PLATEAUX-OUEST' LIMIT 1), 'A-087', 'Kati', 'Assemblée', 11, 6.889785, 0.858707)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'PLATEAUX-OUEST' LIMIT 1), 'A-088', 'Avetonou', 'Assemblée', 10, 6.793158, 0.794638)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'PLATEAUX-OUEST' LIMIT 1), 'A-089', 'Danyi Elavanyo', 'Assemblée', 9, 7.281625, 0.709967)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'PLATEAUX-OUEST' LIMIT 1), 'A-090', 'Adeta', 'Assemblée', 35, 7.120767, 0.74125)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'PLATEAUX-OUEST' LIMIT 1), 'A-091', 'Koumassi', 'Assemblée', 16, 6.741921, 0.677839)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'PLATEAUX-OUEST' LIMIT 1), 'A-092', 'Klomayondi', 'Assemblée', 19, NULL, NULL)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'PLATEAUX-OUEST' LIMIT 1), 'A-093', 'Danyi Koudjravi', 'Assemblée', 5, 7.137843, 0.641166)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'PLATEAUX-OUEST' LIMIT 1), 'A-094', 'Klonou', 'Assemblée', 25, 6.834621, 0.67892)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'SAVANES' LIMIT 1), 'A-095', 'Kpembonga', 'Assemblée', 70, 10.644045, 0.357073)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'SAVANES' LIMIT 1), 'A-096', 'dapaong', 'Assemblée', 89, 10.875632, 0.2059)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'SAVANES' LIMIT 1), 'A-097', 'Mango', 'Assemblée', 53, 10.329373, 0.465871)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'SAVANES' LIMIT 1), 'A-098', 'Barkoissi', 'Assemblée', 21, 10.559562, 0.310104)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'SAVANES' LIMIT 1), 'A-099', 'Kadjitièri 2', 'Assemblée', 8, 10.58397, 0.394449)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'SAVANES' LIMIT 1), 'A-100', 'Mandjieri', 'Assemblée', 59, 10.660502, 0.28851)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'SAVANES' LIMIT 1), 'A-101', 'Naki Est', 'Assemblée', 7, 10.698617, 0.392491)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'YOTO' LIMIT 1), 'A-102', 'Kpotossou-Hedje', 'Assemblée', 24, 6.335196, 1.445366)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'YOTO' LIMIT 1), 'A-103', 'Tchekpo-Dedekpoe', 'Assemblée', 18, 6.532004, 1.359879)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'YOTO' LIMIT 1), 'A-104', 'Dzrekpo Apedome', 'Assemblée', 8, 6.37799, 1.560778)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'YOTO' LIMIT 1), 'A-105', 'Sevatonou', 'Assemblée', 15, 6.29229, 1.417652)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'YOTO' LIMIT 1), 'A-106', 'Aneho zebevi', 'Assemblée', 54, 6.259641, 1.609654)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'YOTO' LIMIT 1), 'A-107', 'Ahepe', 'Assemblée', 15, 6.602514, 1.393863)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'YOTO' LIMIT 1), 'A-108', 'Tannou', 'Assemblée', 27, 6.373676, 1.643362)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'YOTO' LIMIT 1), 'A-109', 'Adangbé', 'Assemblée', 11, 6.556236, 1.265787)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'YOTO' LIMIT 1), 'A-110', 'Dzrekpo centre', 'Assemblée', 35, 6.477427, 1.564597)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'YOTO' LIMIT 1), 'A-111', 'Adangbe', 'Assemblée', 11, 6.524042, 1.28967)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'YOTO' LIMIT 1), 'A-112', 'Kpeve', 'Assemblée', 5, 6.549965, 1.274427)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'YOTO' LIMIT 1), 'A-113', 'Afagna', 'Assemblée', 22, 6.512755, 1.608121)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'YOTO' LIMIT 1), 'A-114', 'Vogan-ville', 'Assemblée', 39, 6.34199, 1.530384)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'YOTO' LIMIT 1), 'A-115', 'Aklakou Hetchiavi', 'Assemblée', 8, 6.348155, 1.710675)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'YOTO' LIMIT 1), 'A-116', 'Tabligbo', 'Assemblée', 30, 6.590925, 1.490738)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'YOTO' LIMIT 1), 'A-117', 'Kouvé', 'Assemblée', 12, 6.663602, 1.420465)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'YOTO' LIMIT 1), 'A-118', 'Atakpamede', 'Assemblée', 5, 6.642605, 1.560093)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'YOTO' LIMIT 1), 'A-119', 'Sevatonou', 'Assemblée', 15, 6.29054, 1.413267)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'YOTO' LIMIT 1), 'A-120', 'Kpémé', 'Assemblée', 38, 6.225118, 1.500648)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'YOTO' LIMIT 1), 'A-121', 'Donomade', 'Assemblée', 13, 6.791414, 1.532032)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'YOTO' LIMIT 1), 'A-122', 'Kpome Apeyeme', 'Assemblée', 60, 6.288032, 1.362113)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'YOTO' LIMIT 1), 'A-123', 'Ahépé', 'Assemblée', 15, 6.602401, 1.393913)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'YOTO' LIMIT 1), 'A-124', 'Dzrekpo centre', 'Assemblée', 33, 6.470097, 1.565757)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'YOTO' LIMIT 1), 'A-125', 'Kpome Akadjame', 'Assemblée', 28, 6.332415, 1.336474)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'YOTO' LIMIT 1), 'A-126', 'Abobo', 'Assemblée', 5, 6.235451, 1.371543)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'YOTO' LIMIT 1), 'A-127', 'Djokoto', 'Assemblée', 26, 6.468468, 1.541344)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'YOTO' LIMIT 1), 'A-128', 'Hahotoe', 'Assemblée', 36, 6.361248, 1.423677)
ON CONFLICT (code_assemblee) DO NOTHING;
INSERT INTO assemblees (district_id, code_assemblee, nom_assemblee, type_unite, effectif_base, latitude, longitude) 
VALUES ((SELECT id FROM districts WHERE nom_district = 'YOTO' LIMIT 1), 'A-129', 'Kpome Akadjame', 'Assemblée', 32, 6.328673, 1.333967)
ON CONFLICT (code_assemblee) DO NOTHING;

-- 3. UTILISATEUR ADMIN PAR DEFAUT (mot de passe: admin123)
INSERT INTO utilisateurs (nom, email, password_hash, role) 
VALUES ('Administrateur National', 'admin@tlwm.tg', '$2b$10$EpRnTzWlqHNP0.fKbX9mvevE4b0qK4z5L5/5x.kKx5L5/5x.kKx5L', 'ADMIN')
ON CONFLICT (email) DO NOTHING;

