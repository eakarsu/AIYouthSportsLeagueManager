-- ============================================================
-- AI Youth Sports League Manager - Database Schema
-- ============================================================

-- Drop tables in reverse dependency order if they exist
DROP TABLE IF EXISTS ai_analyses CASCADE;
DROP TABLE IF EXISTS standings CASCADE;
DROP TABLE IF EXISTS communications CASCADE;
DROP TABLE IF EXISTS games CASCADE;
DROP TABLE IF EXISTS players CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS facilities CASCADE;
DROP TABLE IF EXISTS referees CASCADE;
DROP TABLE IF EXISTS seasons CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'parent' CHECK (role IN ('admin', 'coach', 'parent', 'referee')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ============================================================
-- SEASONS
-- ============================================================
CREATE TABLE seasons (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    registration_deadline DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'registration', 'active', 'playoffs', 'completed', 'cancelled')),
    max_teams INTEGER NOT NULL DEFAULT 16,
    division VARCHAR(100),
    age_group VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_seasons_status ON seasons(status);
CREATE INDEX idx_seasons_dates ON seasons(start_date, end_date);

-- ============================================================
-- FACILITIES
-- ============================================================
CREATE TABLE facilities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(500) NOT NULL,
    type VARCHAR(100) NOT NULL CHECK (type IN ('soccer_field', 'basketball_court', 'baseball_diamond', 'multi_purpose', 'gymnasium', 'swimming_pool', 'tennis_court', 'track_field')),
    capacity INTEGER NOT NULL DEFAULT 100,
    has_lights BOOLEAN NOT NULL DEFAULT FALSE,
    has_parking BOOLEAN NOT NULL DEFAULT TRUE,
    indoor BOOLEAN NOT NULL DEFAULT FALSE,
    surface_type VARCHAR(100) CHECK (surface_type IN ('natural_grass', 'artificial_turf', 'hardwood', 'concrete', 'clay', 'synthetic', 'rubber', 'dirt')),
    available_days VARCHAR(100) DEFAULT 'Mon,Tue,Wed,Thu,Fri,Sat,Sun',
    available_hours_start TIME DEFAULT '08:00:00',
    available_hours_end TIME DEFAULT '21:00:00',
    hourly_rate DECIMAL(8,2) DEFAULT 0.00,
    contact_phone VARCHAR(20),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'closed', 'reserved'))
);

CREATE INDEX idx_facilities_type ON facilities(type);
CREATE INDEX idx_facilities_status ON facilities(status);
CREATE INDEX idx_facilities_indoor ON facilities(indoor);

-- ============================================================
-- REFEREES
-- ============================================================
CREATE TABLE referees (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    certification_level VARCHAR(50) NOT NULL CHECK (certification_level IN ('grassroots', 'regional', 'national', 'fifa')),
    years_experience INTEGER NOT NULL DEFAULT 0,
    max_games_per_week INTEGER NOT NULL DEFAULT 3,
    availability_days VARCHAR(100) DEFAULT 'Sat,Sun',
    specializations VARCHAR(255),
    rating DECIMAL(3,1) DEFAULT 5.0 CHECK (rating >= 0 AND rating <= 10),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'on_leave'))
);

CREATE INDEX idx_referees_certification ON referees(certification_level);
CREATE INDEX idx_referees_status ON referees(status);
CREATE INDEX idx_referees_rating ON referees(rating);

-- ============================================================
-- TEAMS
-- ============================================================
CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    division VARCHAR(100) NOT NULL,
    age_group VARCHAR(50) NOT NULL,
    head_coach VARCHAR(255),
    assistant_coach VARCHAR(255),
    max_players INTEGER NOT NULL DEFAULT 18,
    home_facility_id INTEGER REFERENCES facilities(id) ON DELETE SET NULL,
    season_id INTEGER REFERENCES seasons(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_teams_division ON teams(division);
CREATE INDEX idx_teams_age_group ON teams(age_group);
CREATE INDEX idx_teams_season ON teams(season_id);
CREATE INDEX idx_teams_facility ON teams(home_facility_id);

-- ============================================================
-- PLAYERS
-- ============================================================
CREATE TABLE players (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    age INTEGER NOT NULL CHECK (age >= 4 AND age <= 19),
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20) NOT NULL CHECK (gender IN ('male', 'female', 'non_binary')),
    skill_level INTEGER NOT NULL DEFAULT 5 CHECK (skill_level >= 1 AND skill_level <= 10),
    position VARCHAR(50),
    team_id INTEGER REFERENCES teams(id) ON DELETE SET NULL,
    parent_email VARCHAR(255) NOT NULL,
    parent_phone VARCHAR(20),
    emergency_contact VARCHAR(255),
    medical_notes TEXT,
    registration_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'injured', 'suspended', 'waitlisted')),
    season_id INTEGER REFERENCES seasons(id) ON DELETE SET NULL
);

CREATE INDEX idx_players_team ON players(team_id);
CREATE INDEX idx_players_season ON players(season_id);
CREATE INDEX idx_players_skill ON players(skill_level);
CREATE INDEX idx_players_age ON players(age);
CREATE INDEX idx_players_status ON players(status);
CREATE INDEX idx_players_parent_email ON players(parent_email);

-- ============================================================
-- GAMES
-- ============================================================
CREATE TABLE games (
    id SERIAL PRIMARY KEY,
    home_team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    away_team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    facility_id INTEGER REFERENCES facilities(id) ON DELETE SET NULL,
    game_date DATE NOT NULL,
    game_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'postponed', 'forfeit')),
    home_score INTEGER DEFAULT 0,
    away_score INTEGER DEFAULT 0,
    season_id INTEGER REFERENCES seasons(id) ON DELETE SET NULL,
    referee_id INTEGER REFERENCES referees(id) ON DELETE SET NULL,
    notes TEXT
);

CREATE INDEX idx_games_date ON games(game_date);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_home_team ON games(home_team_id);
CREATE INDEX idx_games_away_team ON games(away_team_id);
CREATE INDEX idx_games_season ON games(season_id);
CREATE INDEX idx_games_facility ON games(facility_id);
CREATE INDEX idx_games_referee ON games(referee_id);

-- ============================================================
-- COMMUNICATIONS
-- ============================================================
CREATE TABLE communications (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('announcement', 'alert', 'message', 'reminder', 'newsletter', 'emergency')),
    priority VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    recipient_type VARCHAR(50) NOT NULL CHECK (recipient_type IN ('all', 'team', 'individual', 'coaches', 'parents', 'referees')),
    recipient_id INTEGER,
    team_id INTEGER REFERENCES teams(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'delivered', 'read', 'archived')),
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_communications_type ON communications(type);
CREATE INDEX idx_communications_sender ON communications(sender_id);
CREATE INDEX idx_communications_team ON communications(team_id);
CREATE INDEX idx_communications_status ON communications(status);
CREATE INDEX idx_communications_priority ON communications(priority);
CREATE INDEX idx_communications_sent_at ON communications(sent_at);

-- ============================================================
-- STANDINGS
-- ============================================================
CREATE TABLE standings (
    id SERIAL PRIMARY KEY,
    team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    season_id INTEGER NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
    wins INTEGER NOT NULL DEFAULT 0,
    losses INTEGER NOT NULL DEFAULT 0,
    draws INTEGER NOT NULL DEFAULT 0,
    points INTEGER NOT NULL DEFAULT 0,
    goals_for INTEGER NOT NULL DEFAULT 0,
    goals_against INTEGER NOT NULL DEFAULT 0,
    goal_difference INTEGER NOT NULL DEFAULT 0,
    UNIQUE(team_id, season_id)
);

CREATE INDEX idx_standings_team ON standings(team_id);
CREATE INDEX idx_standings_season ON standings(season_id);
CREATE INDEX idx_standings_points ON standings(points DESC);

-- ============================================================
-- AI ANALYSES
-- ============================================================
CREATE TABLE ai_analyses (
    id SERIAL PRIMARY KEY,
    type VARCHAR(100) NOT NULL CHECK (type IN ('team_balance', 'schedule_optimization', 'player_development', 'matchup_prediction', 'facility_usage', 'referee_assignment', 'performance_trend', 'injury_risk')),
    input_data JSONB NOT NULL DEFAULT '{}',
    output_data JSONB NOT NULL DEFAULT '{}',
    model_used VARCHAR(100) NOT NULL DEFAULT 'gpt-4',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_analyses_type ON ai_analyses(type);
CREATE INDEX idx_ai_analyses_created ON ai_analyses(created_at);
CREATE INDEX idx_ai_analyses_input ON ai_analyses USING GIN (input_data);
CREATE INDEX idx_ai_analyses_output ON ai_analyses USING GIN (output_data);
