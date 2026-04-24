-- ============================================================
-- AI Youth Sports League Manager - Seed Data
-- ============================================================
-- Run after schema.sql
-- All user passwords are bcrypt hash of 'password123'
-- ============================================================

-- ============================================================
-- USERS (3 users)
-- ============================================================
INSERT INTO users (email, password_hash, name, role) VALUES
('admin@league.com', '$2a$10$6iPp/FXw55Zoyc6ezv93H./LdFRDqhpiyhr1hsGg450fVgY/i7XeG', 'Sarah Mitchell', 'admin'),
('coach.johnson@league.com', '$2a$10$6iPp/FXw55Zoyc6ezv93H./LdFRDqhpiyhr1hsGg450fVgY/i7XeG', 'Mike Johnson', 'coach'),
('parent.williams@email.com', '$2a$10$6iPp/FXw55Zoyc6ezv93H./LdFRDqhpiyhr1hsGg450fVgY/i7XeG', 'Jessica Williams', 'parent');

-- ============================================================
-- SEASONS (4 seasons)
-- ============================================================
INSERT INTO seasons (name, start_date, end_date, registration_deadline, status, max_teams, division, age_group) VALUES
('Fall 2025', '2025-09-01', '2025-12-15', '2025-08-15', 'completed', 16, 'Premier', 'U12'),
('Spring 2026', '2026-03-01', '2026-06-15', '2026-02-15', 'active', 16, 'Premier', 'U14'),
('Summer 2026', '2026-06-20', '2026-08-30', '2026-06-01', 'upcoming', 12, 'Recreational', 'U10'),
('Fall 2026', '2026-09-01', '2026-12-15', '2026-08-15', 'upcoming', 20, 'Premier', 'U16');

-- ============================================================
-- FACILITIES (8 facilities)
-- ============================================================
INSERT INTO facilities (name, address, type, capacity, has_lights, has_parking, indoor, surface_type, available_days, available_hours_start, available_hours_end, hourly_rate, contact_phone, status) VALUES
('Riverside Soccer Complex', '1200 River Rd, Springfield, IL 62701', 'soccer_field', 500, TRUE, TRUE, FALSE, 'natural_grass', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun', '07:00', '22:00', 75.00, '(217) 555-0101', 'active'),
('Oakwood Community Center', '345 Oak Ave, Springfield, IL 62702', 'gymnasium', 300, TRUE, TRUE, TRUE, 'hardwood', 'Mon,Tue,Wed,Thu,Fri,Sat', '06:00', '22:00', 60.00, '(217) 555-0102', 'active'),
('Lincoln Park Fields', '890 Lincoln Blvd, Springfield, IL 62703', 'soccer_field', 400, TRUE, TRUE, FALSE, 'artificial_turf', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun', '08:00', '21:00', 90.00, '(217) 555-0103', 'active'),
('Eastside Recreation Center', '567 East Main St, Springfield, IL 62704', 'multi_purpose', 250, TRUE, TRUE, TRUE, 'synthetic', 'Mon,Wed,Fri,Sat,Sun', '08:00', '20:00', 55.00, '(217) 555-0104', 'active'),
('Westfield Sports Arena', '2100 West Grand Ave, Springfield, IL 62705', 'basketball_court', 600, TRUE, TRUE, TRUE, 'hardwood', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun', '06:00', '23:00', 100.00, '(217) 555-0105', 'active'),
('Maple Grove Diamond', '430 Maple St, Springfield, IL 62706', 'baseball_diamond', 350, TRUE, TRUE, FALSE, 'dirt', 'Tue,Thu,Sat,Sun', '09:00', '20:00', 45.00, '(217) 555-0106', 'active'),
('North County Athletic Park', '7800 County Rd N, Springfield, IL 62707', 'soccer_field', 800, TRUE, TRUE, FALSE, 'natural_grass', 'Sat,Sun', '07:00', '19:00', 120.00, '(217) 555-0107', 'maintenance'),
('Southside Indoor Dome', '1500 South Ave, Springfield, IL 62708', 'multi_purpose', 450, TRUE, TRUE, TRUE, 'artificial_turf', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun', '06:00', '23:00', 150.00, '(217) 555-0108', 'active');

-- ============================================================
-- REFEREES (10 referees)
-- ============================================================
INSERT INTO referees (first_name, last_name, email, phone, certification_level, years_experience, max_games_per_week, availability_days, specializations, rating, status) VALUES
('David', 'Anderson', 'david.anderson@ref.com', '(217) 555-0201', 'national', 12, 5, 'Mon,Wed,Fri,Sat,Sun', 'soccer,futsal', 9.2, 'active'),
('Maria', 'Garcia', 'maria.garcia@ref.com', '(217) 555-0202', 'regional', 8, 4, 'Sat,Sun', 'soccer', 8.5, 'active'),
('James', 'Brown', 'james.brown@ref.com', '(217) 555-0203', 'national', 15, 3, 'Tue,Thu,Sat,Sun', 'soccer,basketball', 9.5, 'active'),
('Linda', 'Martinez', 'linda.martinez@ref.com', '(217) 555-0204', 'grassroots', 2, 3, 'Sat,Sun', 'soccer', 7.0, 'active'),
('Robert', 'Taylor', 'robert.taylor@ref.com', '(217) 555-0205', 'regional', 6, 4, 'Mon,Wed,Sat,Sun', 'soccer,baseball', 8.0, 'active'),
('Susan', 'Thomas', 'susan.thomas@ref.com', '(217) 555-0206', 'grassroots', 1, 2, 'Sat', 'soccer', 6.5, 'active'),
('William', 'Jackson', 'william.jackson@ref.com', '(217) 555-0207', 'national', 20, 4, 'Mon,Tue,Wed,Thu,Fri,Sat,Sun', 'soccer,futsal,basketball', 9.8, 'active'),
('Patricia', 'White', 'patricia.white@ref.com', '(217) 555-0208', 'regional', 5, 3, 'Thu,Sat,Sun', 'soccer', 7.8, 'on_leave'),
('Michael', 'Harris', 'michael.harris@ref.com', '(217) 555-0209', 'fifa', 18, 5, 'Mon,Wed,Fri,Sat,Sun', 'soccer', 9.9, 'active'),
('Elizabeth', 'Clark', 'elizabeth.clark@ref.com', '(217) 555-0210', 'regional', 4, 3, 'Sat,Sun', 'soccer,basketball', 7.5, 'active');

-- ============================================================
-- TEAMS (8 teams)
-- ============================================================
INSERT INTO teams (name, division, age_group, head_coach, assistant_coach, max_players, home_facility_id, season_id) VALUES
('Springfield Thunder', 'Premier', 'U12', 'Mike Johnson', 'Tom Brady', 18, 1, 2),
('Riverside Raptors', 'Premier', 'U12', 'Carlos Ruiz', 'Ana Perez', 18, 3, 2),
('Oakwood Eagles', 'Premier', 'U14', 'Lisa Chen', 'Mark Davis', 18, 1, 2),
('Lincoln Lions', 'Recreational', 'U10', 'Steve Parker', NULL, 15, 3, 2),
('Eastside Strikers', 'Premier', 'U14', 'Rachel Adams', 'Jim Wilson', 18, 4, 2),
('Westfield Warriors', 'Recreational', 'U10', 'Karen Lee', 'Bob Miller', 15, 5, 2),
('Maple Grove Mustangs', 'Premier', 'U16', 'Derek Foster', 'Nina Patel', 20, 1, 2),
('Southside Sharks', 'Premier', 'U16', 'Tony Russo', 'Emily Grant', 20, 8, 2);

-- ============================================================
-- PLAYERS (18 players)
-- ============================================================
INSERT INTO players (first_name, last_name, age, date_of_birth, gender, skill_level, position, team_id, parent_email, parent_phone, emergency_contact, medical_notes, registration_date, status, season_id) VALUES
('Ethan', 'Williams', 11, '2014-07-15', 'male', 8, 'forward', 1, 'parent.williams@email.com', '(217) 555-0301', 'Jessica Williams (217) 555-0301', NULL, '2026-01-15', 'active', 2),
('Sophia', 'Martinez', 11, '2014-11-22', 'female', 7, 'midfielder', 1, 'rosa.martinez@email.com', '(217) 555-0302', 'Rosa Martinez (217) 555-0302', NULL, '2026-01-16', 'active', 2),
('Liam', 'Johnson', 12, '2013-03-08', 'male', 9, 'goalkeeper', 1, 'debra.johnson@email.com', '(217) 555-0303', 'Debra Johnson (217) 555-0303', 'Mild asthma - carries inhaler', '2026-01-14', 'active', 2),
('Olivia', 'Brown', 11, '2014-09-30', 'female', 6, 'defender', 2, 'tina.brown@email.com', '(217) 555-0304', 'Tina Brown (217) 555-0304', NULL, '2026-01-20', 'active', 2),
('Noah', 'Davis', 12, '2013-06-12', 'male', 8, 'forward', 2, 'mark.davis@email.com', '(217) 555-0305', 'Mark Davis (217) 555-0305', NULL, '2026-01-18', 'active', 2),
('Emma', 'Garcia', 13, '2012-12-05', 'female', 9, 'midfielder', 3, 'carlos.garcia@email.com', '(217) 555-0306', 'Carlos Garcia (217) 555-0306', 'Allergic to bee stings - epipen in bag', '2026-01-10', 'active', 2),
('Aiden', 'Wilson', 14, '2011-08-19', 'male', 7, 'defender', 3, 'janet.wilson@email.com', '(217) 555-0307', 'Janet Wilson (217) 555-0307', NULL, '2026-01-12', 'active', 2),
('Isabella', 'Moore', 9, '2016-04-25', 'female', 5, 'midfielder', 4, 'paula.moore@email.com', '(217) 555-0308', 'Paula Moore (217) 555-0308', NULL, '2026-02-01', 'active', 2),
('Mason', 'Taylor', 10, '2015-10-14', 'male', 4, 'forward', 4, 'greg.taylor@email.com', '(217) 555-0309', 'Greg Taylor (217) 555-0309', 'Peanut allergy', '2026-02-03', 'active', 2),
('Ava', 'Anderson', 13, '2012-05-17', 'female', 10, 'forward', 5, 'ruth.anderson@email.com', '(217) 555-0310', 'Ruth Anderson (217) 555-0310', NULL, '2026-01-08', 'active', 2),
('Lucas', 'Thomas', 14, '2011-11-03', 'male', 6, 'goalkeeper', 5, 'diane.thomas@email.com', '(217) 555-0311', 'Diane Thomas (217) 555-0311', NULL, '2026-01-09', 'active', 2),
('Mia', 'Jackson', 9, '2016-02-28', 'female', 3, 'defender', 6, 'brenda.jackson@email.com', '(217) 555-0312', 'Brenda Jackson (217) 555-0312', 'Wears glasses - sports goggles required', '2026-02-05', 'active', 2),
('Logan', 'White', 10, '2015-07-09', 'male', 5, 'midfielder', 6, 'kevin.white@email.com', '(217) 555-0313', 'Kevin White (217) 555-0313', NULL, '2026-02-06', 'active', 2),
('Charlotte', 'Harris', 15, '2010-01-20', 'female', 8, 'forward', 7, 'frank.harris@email.com', '(217) 555-0314', 'Frank Harris (217) 555-0314', NULL, '2026-01-05', 'active', 2),
('Jackson', 'Clark', 16, '2009-08-11', 'male', 9, 'midfielder', 7, 'donna.clark@email.com', '(217) 555-0315', 'Donna Clark (217) 555-0315', 'Previous ACL tear - cleared for play', '2026-01-06', 'active', 2),
('Amelia', 'Lewis', 15, '2010-06-03', 'female', 7, 'defender', 8, 'nancy.lewis@email.com', '(217) 555-0316', 'Nancy Lewis (217) 555-0316', NULL, '2026-01-07', 'active', 2),
('Benjamin', 'Walker', 16, '2009-12-22', 'male', 10, 'forward', 8, 'roger.walker@email.com', '(217) 555-0317', 'Roger Walker (217) 555-0317', NULL, '2026-01-04', 'active', 2),
('Harper', 'Young', 6, '2019-09-15', 'female', 2, 'midfielder', NULL, 'amy.young@email.com', '(217) 555-0318', 'Amy Young (217) 555-0318', NULL, '2026-02-20', 'waitlisted', 2);

-- ============================================================
-- GAMES (20 games)
-- ============================================================
INSERT INTO games (home_team_id, away_team_id, facility_id, game_date, game_time, duration_minutes, status, home_score, away_score, season_id, referee_id, notes) VALUES
-- Completed games
(1, 2, 1, '2026-03-07', '09:00', 60, 'completed', 3, 1, 2, 1, 'Great match, Thunder dominated second half'),
(3, 5, 3, '2026-03-07', '11:00', 70, 'completed', 2, 2, 2, 3, 'Even contest, both teams showed great skill'),
(4, 6, 1, '2026-03-07', '14:00', 50, 'completed', 1, 0, 2, 4, 'Defensive game, Lions held strong'),
(7, 8, 8, '2026-03-08', '10:00', 80, 'completed', 4, 3, 2, 7, 'High-scoring thriller, Mustangs edge it'),
(2, 1, 3, '2026-03-14', '09:00', 60, 'completed', 0, 2, 2, 2, 'Thunder with a clean sheet on the road'),
(5, 3, 4, '2026-03-14', '11:00', 70, 'completed', 3, 1, 2, 5, 'Strikers showed clinical finishing'),
(6, 4, 5, '2026-03-14', '14:00', 50, 'completed', 2, 2, 2, 6, 'Warriors came back from 0-2 down'),
(8, 7, 8, '2026-03-15', '10:00', 80, 'completed', 1, 2, 2, 9, 'Mustangs continue their winning streak'),
-- Scheduled games (upcoming)
(1, 3, 1, '2026-03-21', '09:00', 60, 'scheduled', 0, 0, 2, 1, NULL),
(2, 5, 3, '2026-03-21', '11:00', 70, 'scheduled', 0, 0, 2, 3, NULL),
(4, 6, 1, '2026-03-21', '14:00', 50, 'scheduled', 0, 0, 2, 2, NULL),
(7, 8, 1, '2026-03-22', '10:00', 80, 'scheduled', 0, 0, 2, 7, NULL),
(3, 1, 3, '2026-03-28', '09:00', 60, 'scheduled', 0, 0, 2, 5, NULL),
(5, 2, 4, '2026-03-28', '11:00', 70, 'scheduled', 0, 0, 2, 9, NULL),
(6, 4, 5, '2026-03-28', '14:00', 50, 'scheduled', 0, 0, 2, 10, NULL),
(8, 7, 8, '2026-03-29', '10:00', 80, 'scheduled', 0, 0, 2, 3, NULL),
-- Cancelled / postponed games
(1, 5, 1, '2026-03-10', '09:00', 60, 'cancelled', 0, 0, 2, 1, 'Cancelled due to severe weather warning'),
(2, 3, 3, '2026-03-10', '11:00', 70, 'postponed', 0, 0, 2, 2, 'Postponed - field waterlogged'),
(7, 4, 1, '2026-03-11', '10:00', 60, 'cancelled', 0, 0, 2, 7, 'Cancelled - insufficient referee availability'),
(8, 6, 8, '2026-03-11', '14:00', 80, 'postponed', 0, 0, 2, 9, 'Postponed to later date - facility maintenance');

-- ============================================================
-- COMMUNICATIONS (15 communications)
-- ============================================================
INSERT INTO communications (title, message, type, priority, sender_id, recipient_type, recipient_id, team_id, status, sent_at) VALUES
('Welcome to Spring 2026 Season!', 'Dear families, we are excited to announce the start of our Spring 2026 season. Registration is now open and games begin March 1st. Please ensure all paperwork is completed.', 'announcement', 'high', 1, 'all', NULL, NULL, 'sent', '2026-01-15 09:00:00-06'),
('Practice Schedule Update - Thunder', 'Thunder practice has been moved to Wednesdays 5-7 PM at Riverside Soccer Complex effective immediately.', 'announcement', 'normal', 2, 'team', NULL, 1, 'sent', '2026-02-20 14:30:00-06'),
('Severe Weather Alert', 'All outdoor activities are cancelled for Saturday March 10th due to incoming severe weather. Stay safe!', 'alert', 'urgent', 1, 'all', NULL, NULL, 'sent', '2026-03-09 18:00:00-06'),
('Uniform Pick-up Reminder', 'Reminder: Team uniforms are available for pick-up at the Oakwood Community Center this Saturday 9 AM - 12 PM.', 'reminder', 'normal', 1, 'all', NULL, NULL, 'sent', '2026-02-25 10:00:00-06'),
('Game Rescheduling Notice', 'The Raptors vs Eagles game originally scheduled for March 10th has been rescheduled to March 31st at 11 AM.', 'announcement', 'high', 1, 'team', NULL, 2, 'sent', '2026-03-10 08:00:00-06'),
('Volunteer Coaches Needed', 'We are looking for volunteer assistant coaches for the U10 Recreational division. If interested, please contact admin@league.com.', 'announcement', 'normal', 1, 'parents', NULL, NULL, 'sent', '2026-02-10 11:00:00-06'),
('Player Injury Report - Confidential', 'Jackson Clark has been cleared by his physician to return to full contact practice. Medical clearance form on file.', 'message', 'high', 2, 'individual', 2, 7, 'delivered', '2026-03-01 09:00:00-06'),
('End of Season Tournament Info', 'The end-of-season tournament will be held June 6-7 at North County Athletic Park. More details to follow.', 'announcement', 'normal', 1, 'all', NULL, NULL, 'sent', '2026-03-05 12:00:00-06'),
('Referee Availability Request', 'Referees: Please update your availability for the month of April in the system by March 25th.', 'reminder', 'normal', 1, 'referees', NULL, NULL, 'sent', '2026-03-15 08:00:00-06'),
('Team Photo Day', 'Team photos will be taken on Saturday March 22nd before each team''s game. Please wear full uniform.', 'announcement', 'normal', 1, 'all', NULL, NULL, 'sent', '2026-03-12 10:00:00-06'),
('Concession Stand Volunteers', 'We need parent volunteers for the concession stand on March 21-22. Sign up at the front desk or reply to this message.', 'message', 'low', 1, 'parents', NULL, NULL, 'sent', '2026-03-13 14:00:00-06'),
('Field Maintenance Notice', 'North County Athletic Park (Field 3) will be closed for maintenance March 15-20. Games have been relocated.', 'alert', 'high', 1, 'all', NULL, NULL, 'sent', '2026-03-14 07:00:00-06'),
('Coach Meeting Agenda', 'Monthly coaches meeting this Thursday at 7 PM at Oakwood Community Center. Agenda: tournament planning, rule updates.', 'reminder', 'normal', 1, 'coaches', NULL, NULL, 'sent', '2026-03-17 09:00:00-06'),
('Summer 2026 Early Registration', 'Early registration for Summer 2026 is now open! Register before May 1st to receive a 15% discount.', 'newsletter', 'normal', 1, 'all', NULL, NULL, 'draft', NULL),
('Emergency Contact Update Required', 'Please verify and update your emergency contact information in your player profile by March 31st.', 'reminder', 'high', 1, 'parents', NULL, NULL, 'sent', '2026-03-18 08:30:00-06');

-- ============================================================
-- STANDINGS (8 entries)
-- ============================================================
INSERT INTO standings (team_id, season_id, wins, losses, draws, points, goals_for, goals_against, goal_difference) VALUES
(1, 2, 3, 0, 0, 9, 7, 1, 6),
(2, 2, 0, 2, 0, 0, 1, 5, -4),
(3, 2, 1, 1, 1, 4, 5, 5, 0),
(4, 2, 1, 0, 1, 4, 3, 2, 1),
(5, 2, 2, 1, 0, 6, 7, 4, 3),
(6, 2, 0, 1, 2, 2, 4, 4, 0),
(7, 2, 3, 1, 0, 9, 10, 7, 3),
(8, 2, 1, 2, 0, 3, 7, 8, -1);

-- ============================================================
-- AI ANALYSES (15 entries)
-- ============================================================
INSERT INTO ai_analyses (type, input_data, output_data, model_used, created_at) VALUES
('team_balance', '{"season_id": 2, "division": "Premier", "age_group": "U12"}', '{"balance_score": 0.85, "recommendation": "Teams are well balanced. Consider moving player #5 to Team 1 for better skill distribution.", "skill_averages": {"team_1": 8.0, "team_2": 7.0}}', 'gpt-4', '2026-02-28 10:00:00-06'),
('schedule_optimization', '{"season_id": 2, "constraints": ["no_back_to_back", "balanced_home_away"]}', '{"optimized": true, "conflicts_resolved": 3, "total_games": 20, "facility_utilization": 0.78}', 'gpt-4', '2026-02-27 14:00:00-06'),
('player_development', '{"player_id": 1, "metrics": ["speed", "accuracy", "teamwork"]}', '{"current_level": 8, "predicted_level": 9, "areas_to_improve": ["left foot accuracy", "defensive positioning"], "recommended_drills": ["cone weave", "1v1 defending"]}', 'gpt-4', '2026-03-05 09:00:00-06'),
('matchup_prediction', '{"home_team_id": 1, "away_team_id": 2, "game_date": "2026-03-07"}', '{"home_win_probability": 0.65, "draw_probability": 0.20, "away_win_probability": 0.15, "predicted_score": "2-1", "key_factors": ["home advantage", "skill differential"]}', 'gpt-4', '2026-03-06 16:00:00-06'),
('facility_usage', '{"facility_ids": [1, 3, 4, 5, 8], "period": "2026-03"}', '{"utilization_rates": {"1": 0.82, "3": 0.75, "4": 0.45, "5": 0.60, "8": 0.90}, "recommendation": "Shift more games to Eastside Recreation Center to balance load"}', 'gpt-4', '2026-03-01 08:00:00-06'),
('referee_assignment', '{"game_ids": [9, 10, 11, 12], "date": "2026-03-21"}', '{"assignments": {"9": 1, "10": 3, "11": 2, "12": 7}, "conflicts": 0, "travel_optimized": true}', 'gpt-4', '2026-03-18 11:00:00-06'),
('performance_trend', '{"team_id": 7, "last_n_games": 4}', '{"trend": "improving", "avg_goals_scored": 2.5, "avg_goals_conceded": 1.75, "win_rate": 0.75, "key_performers": [15, 14]}', 'gpt-4', '2026-03-16 10:00:00-06'),
('injury_risk', '{"team_id": 1, "player_ids": [1, 2, 3]}', '{"risk_levels": {"1": "low", "2": "low", "3": "moderate"}, "recommendations": {"3": "Monitor workload, reduce training intensity by 10%"}}', 'gpt-4', '2026-03-10 09:00:00-06'),
('team_balance', '{"season_id": 2, "division": "Recreational", "age_group": "U10"}', '{"balance_score": 0.72, "recommendation": "Team 6 has lower average skill. Consider reassigning player #13 from Team 6 to Team 4.", "skill_averages": {"team_4": 4.5, "team_6": 4.0}}', 'gpt-4', '2026-02-28 11:00:00-06'),
('matchup_prediction', '{"home_team_id": 7, "away_team_id": 8, "game_date": "2026-03-08"}', '{"home_win_probability": 0.55, "draw_probability": 0.25, "away_win_probability": 0.20, "predicted_score": "3-2", "key_factors": ["recent form", "head to head record"]}', 'gpt-4', '2026-03-07 15:00:00-06'),
('player_development', '{"player_id": 10, "metrics": ["speed", "shooting", "leadership"]}', '{"current_level": 10, "predicted_level": 10, "areas_to_improve": ["consistency under pressure"], "recommended_drills": ["penalty practice", "captain drills"], "scout_note": "Exceptional talent, recommend for elite academy trial"}', 'gpt-4', '2026-03-08 10:00:00-06'),
('schedule_optimization', '{"season_id": 3, "constraints": ["weather_aware", "minimize_travel"]}', '{"optimized": true, "conflicts_resolved": 0, "total_games": 12, "facility_utilization": 0.65, "note": "Summer schedule accounts for heat advisories"}', 'gpt-4', '2026-03-15 14:00:00-06'),
('performance_trend', '{"team_id": 1, "last_n_games": 4}', '{"trend": "dominant", "avg_goals_scored": 2.33, "avg_goals_conceded": 0.33, "win_rate": 1.0, "key_performers": [1, 3]}', 'gpt-4', '2026-03-16 11:00:00-06'),
('facility_usage', '{"facility_ids": [1, 3, 8], "period": "2026-04"}', '{"utilization_rates": {"1": 0.70, "3": 0.68, "8": 0.85}, "recommendation": "Schedule evening games at Riverside to utilize lighting capacity"}', 'gpt-4', '2026-03-19 08:00:00-06'),
('injury_risk', '{"team_id": 7, "player_ids": [14, 15]}', '{"risk_levels": {"14": "low", "15": "moderate"}, "recommendations": {"15": "Previous ACL history - ensure proper warm-up protocol and limit to 70 minutes per game"}}', 'gpt-4', '2026-03-17 09:00:00-06');
