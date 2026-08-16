-- ==============================================================================
-- BASE DE DONNEES TLWM (TOGO LWM DASHBOARD & COLLECTE)
-- SCRIPT DE CREATION POSTGRESQL V1.0
-- ==============================================================================

-- Extension pour la génération de UUID si besoin
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 0. TABLE DES PAYS (Multi-pays Afrique)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pays (
    id SERIAL PRIMARY KEY,
    code_pays VARCHAR(10) UNIQUE NOT NULL, -- Ex: 'TG', 'BJ', 'CI', 'GH'
    nom_pays VARCHAR(100) NOT NULL,       -- Ex: 'Togo', 'Bénin', 'Côte d''Ivoire'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 1. TABLE DES DISTRICTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS districts (
    id SERIAL PRIMARY KEY,
    pays_id INTEGER REFERENCES pays(id) ON DELETE CASCADE,
    code_district VARCHAR(50) UNIQUE NOT NULL,
    nom_district VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 2. TABLE DES ASSEMBLEES ET CELLULES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assemblees (
    id SERIAL PRIMARY KEY,
    district_id INTEGER REFERENCES districts(id) ON DELETE CASCADE,
    code_assemblee VARCHAR(50) UNIQUE,
    nom_assemblee VARCHAR(150) NOT NULL,
    type_unite VARCHAR(50) DEFAULT 'Assemblée', -- 'Assemblée' ou 'Cellule'
    pasteur_responsable VARCHAR(150),
    latitude NUMERIC(10, 6),
    longitude NUMERIC(10, 6),
    effectif_base INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 3. TABLE DU COMITE DE L'ASSEMBLEE (Données de structure semi-fixes)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS comite_assemblee (
    id SERIAL PRIMARY KEY,
    assemblee_id INTEGER REFERENCES assemblees(id) ON DELETE CASCADE,
    fonction VARCHAR(100) NOT NULL, -- Ex: 'Pasteur principal', 'Secrétaire', 'Conseiller'
    nom VARCHAR(100) NOT NULL,
    prenoms VARCHAR(150),
    contact VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 4. TABLE DES UTILISATEURS / ACCES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS utilisateurs (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'RAPPORTEUR_ASSEMBLEE', -- 'ADMIN_AFRIQUE', 'ADMIN_PAYS', 'SUPERVISEUR_DISTRICT', 'RAPPORTEUR_ASSEMBLEE'
    statut VARCHAR(30) NOT NULL DEFAULT 'ACTIF', -- 'ACTIF', 'EN_ATTENTE', 'REJETE'
    pays_id INTEGER REFERENCES pays(id) ON DELETE SET NULL,
    district_id INTEGER REFERENCES districts(id) ON DELETE SET NULL,
    assemblee_id INTEGER REFERENCES assemblees(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 5. RAPPORTS MENSUELS DES ASSEMBLEES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rapports_assemblee (
    id SERIAL PRIMARY KEY,
    assemblee_id INTEGER REFERENCES assemblees(id) ON DELETE CASCADE,
    annee INTEGER NOT NULL,
    mois VARCHAR(20) NOT NULL, -- Ex: 'Janvier', 'Février'
    
    -- Séminaires
    sem_assemblees INTEGER DEFAULT 0,
    sem_hors INTEGER DEFAULT 0,
    sem_total INTEGER GENERATED ALWAYS AS (sem_assemblees + sem_hors) STORED,
    
    -- Assistance & Impact
    assistance_cultes INTEGER DEFAULT 0,
    assistance_mission INTEGER DEFAULT 0,
    sauves INTEGER DEFAULT 0,
    ajoutes INTEGER DEFAULT 0,
    invites INTEGER DEFAULT 0,
    temoignages INTEGER DEFAULT 0,
    
    -- Ressources Humaines
    membres_actifs INTEGER DEFAULT 0,
    predicateurs INTEGER DEFAULT 0,
    pasteurs INTEGER DEFAULT 0,
    
    -- Finances locales (FCFA)
    offrandes NUMERIC(12, 2) DEFAULT 0,
    dimes NUMERIC(12, 2) DEFAULT 0,
    depenses_fonctionnement NUMERIC(12, 2) DEFAULT 0,
    depenses_mission NUMERIC(12, 2) DEFAULT 0,
    
    -- Statut du rapport
    statut VARCHAR(30) DEFAULT 'SOUMIS', -- 'BROUILLON', 'SOUMIS', 'VALIDE'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_rapport_assemblee_mois UNIQUE (assemblee_id, annee, mois)
);

-- ------------------------------------------------------------------------------
-- 6. ACTIVITES PROPRES DU DISTRICT
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activites_district (
    id SERIAL PRIMARY KEY,
    district_id INTEGER REFERENCES districts(id) ON DELETE CASCADE,
    annee INTEGER NOT NULL,
    mois VARCHAR(20) NOT NULL,
    date_activite DATE,
    type_activite VARCHAR(100), -- Formations, CPPD, Évangélisation...
    nom_activite VARCHAR(200) NOT NULL,
    lieu VARCHAR(150),
    nb_jours INTEGER DEFAULT 1,
    intervenant_principal VARCHAR(150),
    theme_module TEXT,
    hommes INTEGER DEFAULT 0,
    femmes INTEGER DEFAULT 0,
    jeunes INTEGER DEFAULT 0,
    assistance_totale INTEGER DEFAULT 0,
    budget_fcfa NUMERIC(12, 2) DEFAULT 0,
    depenses_fcfa NUMERIC(12, 2) DEFAULT 0,
    observations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 7. FINANCES CONSOLIDEES DU DISTRICT
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS finances_district (
    id SERIAL PRIMARY KEY,
    district_id INTEGER REFERENCES districts(id) ON DELETE CASCADE,
    annee INTEGER NOT NULL,
    mois VARCHAR(20) NOT NULL,
    remontees_assemblees NUMERIC(12, 2) DEFAULT 0,
    dotation_national NUMERIC(12, 2) DEFAULT 0,
    autres_recettes NUMERIC(12, 2) DEFAULT 0,
    depenses_locales NUMERIC(12, 2) DEFAULT 0,
    dotations_redistribuees NUMERIC(12, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_finance_district_mois UNIQUE (district_id, annee, mois)
);

-- ------------------------------------------------------------------------------
-- 8. REUSSITES, DIFFICULTES ET PERSPECTIVES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reussites_difficultes (
    id SERIAL PRIMARY KEY,
    district_id INTEGER REFERENCES districts(id) ON DELETE CASCADE,
    annee INTEGER NOT NULL,
    mois VARCHAR(20) NOT NULL,
    type VARCHAR(30) NOT NULL, -- 'Réussite', 'Difficulté', 'Perspective'
    categorie VARCHAR(100), -- 'Mission', 'Ressources Humaines', 'Finance'...
    description TEXT NOT NULL,
    statut VARCHAR(50) DEFAULT 'En cours', -- 'Résolu', 'En cours', 'Nouveau'
    actions_suivi TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index pour accélérer les requêtes du Dashboard
CREATE INDEX IF NOT EXISTS idx_rapports_annee_mois ON rapports_assemblee(annee, mois);
CREATE INDEX IF NOT EXISTS idx_assemblees_district ON assemblees(district_id);

-- ------------------------------------------------------------------------------
-- 9. MEMBRES DES ASSEMBLEES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS membres_assemblee (
    id SERIAL PRIMARY KEY,
    assemblee_id INTEGER REFERENCES assemblees(id) ON DELETE CASCADE,
    nom VARCHAR(100) NOT NULL,
    prenoms VARCHAR(150),
    sexe VARCHAR(10),                          -- 'M', 'F'
    date_naissance DATE,
    contact VARCHAR(50),
    statut_membre VARCHAR(50) DEFAULT 'Actif', -- 'Actif', 'Inactif', 'Visiteur'
    type_membre VARCHAR(50) DEFAULT 'Membre',  -- 'Membre', 'Prédicateur', 'Pasteur'
    date_adhesion DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_membres_assemblee ON membres_assemblee(assemblee_id);
