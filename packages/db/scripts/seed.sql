-- ==============================================================================
-- SEED DATA FOR SMART DONATION DRIVE & VOLUNTEER COORDINATION PLATFORM
-- ==============================================================================

-- Clear existing data if re-seeding
TRUNCATE TABLE impact_updates, drive_milestones, volunteer_assignments, volunteer_roles, 
               volunteers, donations, drive_item_needs, donors, drives, organizations CASCADE;

-- 1. SEED ORGANIZATIONS
INSERT INTO organizations (id, name, slug, email, phone, category, verification_status, tax_id_ein, website_url, logo_url, mission_statement, address, city, state, postal_code, country)
VALUES
('00000000-0000-0000-0000-000000000001', 'Hope Harvest Food Bank', 'hope-harvest', 'contact@hopeharvest.org', '+1 (555) 234-5678', 'Food Security', 'verified', 'EIN-84-9281729', 'https://hopeharvest.org', 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=200&q=80', 'Dedicated to eliminating hunger across vulnerable neighborhoods through food rescues and community pantries.', '450 Community Way', 'Chicago', 'IL', '60616', 'USA'),
('00000000-0000-0000-0000-000000000002', 'Global Rapid Relief Corps', 'global-relief', 'info@rapidreliefcorps.org', '+1 (555) 876-5432', 'Disaster Response', 'verified', 'EIN-12-3849102', 'https://rapidreliefcorps.org', 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=200&q=80', 'Mobilizing emergency medical aid, clean water, and search-and-rescue assistance within hours of natural disasters.', '100 Humanitarian Blvd', 'Austin', 'TX', '78701', 'USA'),
('00000000-0000-0000-0000-000000000003', 'BrightPath Youth Education', 'brightpath-edu', 'hello@brightpath.org', '+1 (555) 432-1098', 'Education', 'verified', 'EIN-56-7819201', 'https://brightpath.org', 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=200&q=80', 'Bridging the digital divide and providing classroom supplies and tutoring to underserved youth.', '88 Scholars Lane', 'Atlanta', 'GA', '30303', 'USA'),
('00000000-0000-0000-0000-000000000004', 'Guardian Paws Animal Haven', 'guardian-paws', 'rescue@guardianpaws.org', '+1 (555) 345-6789', 'Animal Welfare', 'verified', 'EIN-99-4412039', 'https://guardianpaws.org', 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=200&q=80', 'Rescuing, rehabilitating, and rehoming abandoned animals during emergencies and severe weather events.', '72 Shelter Creek Rd', 'Denver', 'CO', '80202', 'USA');

-- 2. SEED DRIVES
INSERT INTO drives (id, org_id, title, slug, tagline, description, category, status, urgency_level, drive_type, target_amount, currency, target_items_count, item_unit_name, target_volunteers_count, target_volunteer_hours, start_date, end_date, location_name, location_address, is_virtual, featured_image_url)
VALUES
('11111111-1111-1111-1111-111111111101', '00000000-0000-0000-0000-000000000001', 'Winter Warmth & Holiday Food Drive', 'winter-warmth-holiday-food-drive', 'Help provide 10,000 warm meals and thermal kits to families in need this winter season.', 'As temperatures plummet, over 2,500 local families face severe shortages of heating, warm coats, and nutritious meals. Join our united community effort to provide non-perishable food boxes, thermal blankets, and kitchen assistance.', 'food_security', 'active', 'high', 'hybrid', 50000.00, 'USD', 10000, 'warm meals & kits', 60, 300.00, NOW() - INTERVAL '5 days', NOW() + INTERVAL '25 days', 'Metro Chicago Central Depot', '450 Community Way, Chicago, IL', false, 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1000&q=80'),

('11111111-1111-1111-1111-111111111102', '00000000-0000-0000-0000-000000000002', 'Flash Flood Emergency Medical & Water Response', 'flood-emergency-medical-water-response', 'Rapid deployment of water filtration, hygiene kits, and field medics to flooded coastal counties.', 'Following catastrophic river flooding, critical infrastructure has collapsed. We are establishing mobile clinics, distributing potable water bladders, and assembling emergency cleanup crews.', 'disaster_relief', 'active', 'critical', 'hybrid', 120000.00, 'USD', 5000, 'filtration kits', 100, 600.00, NOW() - INTERVAL '2 days', NOW() + INTERVAL '14 days', 'East Coast Relief Hub', 'Staging Area 4, Port Arthur, TX', false, 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=1000&q=80'),

('11111111-1111-1111-1111-111111111103', '00000000-0000-0000-0000-000000000003', 'STEM Laptops & Robotics Kits for Inner-City Schools', 'stem-laptops-robotics-drive', 'Empowering 500 high school students with refurbished laptops, coding gear, and weekend mentors.', 'Equipping 8 title-1 high schools with computing labs, STEM robotics starter sets, and volunteer software engineers for 1-on-1 mentorship.', 'education', 'active', 'medium', 'hybrid', 35000.00, 'USD', 500, 'laptop & robotic sets', 40, 200.00, NOW() - INTERVAL '10 days', NOW() + INTERVAL '30 days', 'Tech Commons Hub', '88 Scholars Lane, Atlanta, GA', false, 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1000&q=80'),

('11111111-1111-1111-1111-111111111104', '00000000-0000-0000-0000-000000000004', 'Cold Weather Pet Shelter & Medical Care Fund', 'cold-weather-pet-shelter-fund', 'Providing insulated kennels, vaccines, and emergency foster supplies for 300 rescued animals.', 'Winter storms increase stray intakes by 300%. We need volunteer kennel caretakers, dry dog/cat food pallets, and veterinary surgery sponsorships.', 'animal_welfare', 'active', 'high', 'hybrid', 25000.00, 'USD', 1500, 'food bags & vaccines', 30, 150.00, NOW() - INTERVAL '3 days', NOW() + INTERVAL '20 days', 'Guardian Haven Sanctuary', '72 Shelter Creek Rd, Denver, CO', false, 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=1000&q=80');

-- 3. SEED DRIVE ITEM NEEDS
INSERT INTO drive_item_needs (id, drive_id, item_name, category, target_quantity, unit, is_urgent, drop_off_instructions)
VALUES
('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111101', 'Heavy Duty Winter Coats (Adult & Child)', 'Clothing', 1200, 'coats', true, 'Clean coats can be dropped at Bay 2 loading dock Monday to Saturday 8am-6pm.'),
('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111101', 'Canned Protein & Dry Bean Boxes', 'Food', 5000, 'boxes', false, 'Non-perishable canned meats, beans, and lentils. Unopened standard packaging.'),
('22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111102', 'Gravity Water Purification Filters', 'Medical Supplies', 800, 'units', true, 'High priority. Deliver directly to triage warehouse dock A.'),
('22222222-2222-2222-2222-222222222204', '11111111-1111-1111-1111-111111111102', 'Emergency Hygiene Care Packs', 'Hygiene', 2000, 'kits', true, 'Includes soap, toothbrushes, antiseptic wipes, and sanitary supplies.'),
('22222222-2222-2222-2222-222222222205', '11111111-1111-1111-1111-111111111103', 'Refurbished Laptops (Core i5 / 8GB+)', 'Educational', 250, 'units', false, 'Working condition laptops with power adapters. Data wiped.'),
('22222222-2222-2222-2222-222222222206', '11111111-1111-1111-1111-111111111104', 'High-Protein Dog & Cat Kibble (30lb Bags)', 'Food', 400, 'bags', true, 'Unopened dry pet food bags dropped off at front intake.');

-- 4. SEED DONORS
INSERT INTO donors (id, full_name, email, phone, donor_tier, total_donated_amount, total_donations_count, is_anonymous_default)
VALUES
('33333333-3333-3333-3333-333333333301', 'Eleanor Vance', 'eleanor.vance@techcorp.com', '+1 (555) 901-2345', 'champion', 0.00, 0, false),
('33333333-3333-3333-3333-333333333302', 'Marcus Sterling', 'msterling@investments.org', '+1 (555) 902-3456', 'platinum', 0.00, 0, false),
('33333333-3333-3333-3333-333333333303', 'Sarah Jenkins', 'sarah.j@gmail.com', '+1 (555) 903-4567', 'gold', 0.00, 0, false),
('33333333-3333-3333-3333-333333333304', 'David & Linda Chen', 'chendonations@familytrust.net', '+1 (555) 904-5678', 'champion', 0.00, 0, false),
('33333333-3333-3333-3333-333333333305', 'Anonymous Philanthropist', 'anon.backer@proton.me', '+1 (555) 905-6789', 'gold', 0.00, 0, true);

-- 5. SEED DONATIONS (Monetary & Item)
-- Note: Trigger will automatically recalculate drives.raised_amount, drives.collected_items_count, donors.total_donated_amount & milestones!
INSERT INTO donations (id, drive_id, donor_id, donor_name, donor_email, donation_type, amount, currency, item_need_id, item_description, item_quantity, status, payment_method, transaction_reference, is_anonymous, donor_message, receipt_number)
VALUES
-- Monetary for Winter Warmth
('44444444-4444-4444-4444-444444444401', '11111111-1111-1111-1111-111111111101', '33333333-3333-3333-3333-333333333301', 'Eleanor Vance', 'eleanor.vance@techcorp.com', 'monetary', 12500.00, 'USD', NULL, NULL, 0, 'completed', 'stripe', 'txn_strp_9481920', false, 'Keep the warmth spreading this season! Warm wishes to all families.', 'RCPT-2026-00101'),
('44444444-4444-4444-4444-444444444402', '11111111-1111-1111-1111-111111111103', '33333333-3333-3333-3333-333333333303', 'Sarah Jenkins', 'sarah.j@gmail.com', 'monetary', 2500.00, 'USD', NULL, NULL, 0, 'completed', 'stripe', 'txn_strp_9481921', false, 'In memory of my grandmother who loved teaching.', 'RCPT-2026-00102'),
('44444444-4444-4444-4444-444444444403', '11111111-1111-1111-1111-111111111102', '33333333-3333-3333-3333-333333333304', 'David & Linda Chen', 'chendonations@familytrust.net', 'monetary', 35000.00, 'USD', NULL, NULL, 0, 'completed', 'bank_transfer', 'txn_ach_8819203', false, 'Urgent flood relief dispatch funding.', 'RCPT-2026-00103'),
('44444444-4444-4444-4444-444444444404', '11111111-1111-1111-1111-111111111104', '33333333-3333-3333-3333-333333333302', 'Marcus Sterling', 'msterling@investments.org', 'monetary', 7500.00, 'USD', NULL, NULL, 0, 'completed', 'card', 'txn_crd_1289128', false, 'For veterinary surgeries and warm kennels.', 'RCPT-2026-00104'),

-- In-Kind Items for Drives
('44444444-4444-4444-4444-444444444405', '11111111-1111-1111-1111-111111111101', '33333333-3333-3333-3333-333333333301', 'Eleanor Vance', 'eleanor.vance@techcorp.com', 'item', 0.00, 'USD', '22222222-2222-2222-2222-222222222201', 'Assorted NorthFace & Columbia adult winter jackets', 350, 'received', 'dropoff', 'drop_off_receipt_441', false, 'Direct company surplus jacket donation.', 'RCPT-2026-ITEM-01'),
('44444444-4444-4444-4444-444444444406', '11111111-1111-1111-1111-111111111101', '33333333-3333-3333-3333-333333333303', 'Sarah Jenkins', 'sarah.j@gmail.com', 'item', 0.00, 'USD', '22222222-2222-2222-2222-222222222202', 'Cases of canned tuna, chicken, and black beans', 1200, 'received', 'dropoff', 'drop_off_receipt_442', false, 'Neighborhood grocery collective drive collection.', 'RCPT-2026-ITEM-02'),
('44444444-4444-4444-4444-444444444407', '11111111-1111-1111-1111-111111111102', '33333333-3333-3333-3333-333333333304', 'David & Linda Chen', 'chendonations@familytrust.net', 'item', 0.00, 'USD', '22222222-2222-2222-2222-222222222203', 'Industrial LifeStraw community purification canisters', 250, 'received', 'in_person', 'drop_off_receipt_443', false, 'Direct manufacturer drop.', 'RCPT-2026-ITEM-03');

-- 6. SEED VOLUNTEERS
INSERT INTO volunteers (id, full_name, email, phone, skills, availability, emergency_contact_name, emergency_contact_phone, total_hours_logged, shifts_completed_count, volunteer_rating, is_background_checked)
VALUES
('55555555-5555-5555-5555-555555555501', 'Dr. Aris Thorne', 'aris.thorne@mednet.org', '+1 (555) 710-1122', ARRAY['First Aid', 'Medical Triage', 'Emergency Medicine', 'Logistics'], ARRAY['Weekends', 'Emergency On-Call'], 'Clara Thorne', '+1 (555) 710-9988', 0.00, 0, 5.00, true),
('55555555-5555-5555-5555-555555555502', 'Maya Rodriguez', 'maya.rodriguez@gmail.com', '+1 (555) 720-2233', ARRAY['Food Prep', 'Crowd Management', 'Spanish Translation', 'Logistics'], ARRAY['Weekdays', 'Weekends', 'Mornings'], 'Carlos Rodriguez', '+1 (555) 720-8877', 0.00, 0, 4.95, true),
('55555555-5555-5555-5555-555555555503', 'Jackson Burke', 'jburke.ops@gmail.com', '+1 (555) 730-3344', ARRAY['Driving', 'Heavy Equipment', 'Logistics', 'Warehouse Operations'], ARRAY['Weekdays', 'Evenings'], 'Sam Burke', '+1 (555) 730-7766', 0.00, 0, 4.90, true),
('55555555-5555-5555-5555-555555555504', 'Amina Al-Mansoor', 'amina.mansoor@techdev.io', '+1 (555) 740-4455', ARRAY['Teaching', 'Robotics & Python', 'Mentorship', 'Arabic Translation'], ARRAY['Weekends', 'Evenings'], 'Tariq Mansoor', '+1 (555) 740-6655', 0.00, 0, 5.00, true),
('55555555-5555-5555-5555-555555555505', 'Liam Gallagher', 'liam.g@vetclinic.net', '+1 (555) 750-5566', ARRAY['Animal Care', 'Veterinary Tech', 'First Aid', 'Driving'], ARRAY['Weekends', 'Mornings', 'Emergency On-Call'], 'Nora Gallagher', '+1 (555) 750-4433', 0.00, 0, 4.98, true);

-- 7. SEED VOLUNTEER ROLES (Shifts)
INSERT INTO volunteer_roles (id, drive_id, title, description, required_skills, shift_date, start_time, end_time, capacity, location, is_urgent)
VALUES
('66666666-6666-6666-6666-666666666601', '11111111-1111-1111-1111-111111111101', 'Food Packing & Sorting Lead', 'Sort bulk canned goods, inspect packaging, and assemble standard family meal hampers.', ARRAY['Food Prep', 'Logistics'], CURRENT_DATE + INTERVAL '2 days', '09:00:00', '13:00:00', 15, 'Depot Bay 1', false),
('66666666-6666-6666-6666-666666666602', '11111111-1111-1111-1111-111111111101', 'Mobile Meal Distribution Driver', 'Transport meal boxes and coats to elderly housing units and neighborhood drop points.', ARRAY['Driving', 'Logistics'], CURRENT_DATE + INTERVAL '2 days', '13:30:00', '17:30:00', 10, 'Distribution Zone B', false),
('66666666-6666-6666-6666-666666666603', '11111111-1111-1111-1111-111111111102', 'Emergency Medical Triage & First Responder', 'Support field physicians in assessing displaced residents and distributing water filters.', ARRAY['Medical Triage', 'First Aid'], CURRENT_DATE + INTERVAL '1 day', '08:00:00', '16:00:00', 20, 'Field Clinic Staging 4', true),
('66666666-6666-6666-6666-666666666604', '11111111-1111-1111-1111-111111111103', 'STEM Weekend Coding & Robotics Mentor', 'Guide high school students in setting up dev environments and assembling sensor boards.', ARRAY['Teaching', 'Robotics & Python'], CURRENT_DATE + INTERVAL '3 days', '10:00:00', '14:00:00', 12, 'Tech Commons Lab 3', false),
('66666666-6666-6666-6666-666666666605', '11111111-1111-1111-1111-111111111104', 'Emergency Animal Intake & Care Attendant', 'Help walk, feed, vaccinate, and settle newly rescued dogs and cats into heated enclosures.', ARRAY['Animal Care', 'Veterinary Tech'], CURRENT_DATE + INTERVAL '1 day', '07:30:00', '12:30:00', 8, 'Guardian Haven Intake Ward', true);

-- 8. SEED VOLUNTEER ASSIGNMENTS
INSERT INTO volunteer_assignments (id, role_id, drive_id, volunteer_id, status, hours_logged, check_in_time, check_out_time, coordinator_notes, feedback_rating)
VALUES
('77777777-7777-7777-7777-777777777701', '66666666-6666-6666-6666-666666666601', '11111111-1111-1111-1111-111111111101', '55555555-5555-5555-5555-555555555502', 'attended', 4.00, NOW() - INTERVAL '2 days' + INTERVAL '9 hours', NOW() - INTERVAL '2 days' + INTERVAL '13 hours', 'Excellent sorting speed and team communication.', 5),
('77777777-7777-7777-7777-777777777702', '66666666-6666-6666-6666-666666666602', '11111111-1111-1111-1111-111111111101', '55555555-5555-5555-5555-555555555503', 'attended', 4.00, NOW() - INTERVAL '2 days' + INTERVAL '13 hours 30 mins', NOW() - INTERVAL '2 days' + INTERVAL '17 hours 30 mins', 'Completed all 14 neighborhood deliveries safely.', 5),
('77777777-7777-7777-7777-777777777703', '66666666-6666-6666-6666-666666666603', '11111111-1111-1111-1111-111111111102', '55555555-5555-5555-5555-555555555501', 'attended', 8.00, NOW() - INTERVAL '1 day' + INTERVAL '8 hours', NOW() - INTERVAL '1 day' + INTERVAL '16 hours', 'Treated 42 patients and coordinated med transfer.', 5),
('77777777-7777-7777-7777-777777777704', '66666666-6666-6666-6666-666666666604', '11111111-1111-1111-1111-111111111103', '55555555-5555-5555-5555-555555555504', 'confirmed', 0.00, NULL, NULL, 'Confirmed for upcoming weekend session.', NULL),
('77777777-7777-7777-7777-777777777705', '66666666-6666-6666-6666-666666666605', '11111111-1111-1111-1111-111111111104', '55555555-5555-5555-5555-555555555505', 'attended', 5.00, NOW() - INTERVAL '1 day' + INTERVAL '7 hours 30 mins', NOW() - INTERVAL '1 day' + INTERVAL '12 hours 30 mins', 'Administered 28 kennel vaccines & intake logs.', 5);

-- 9. SEED DRIVE MILESTONES
INSERT INTO drive_milestones (id, drive_id, title, target_type, target_value, reward_badge)
VALUES
('88888888-8888-8888-8888-888888888801', '11111111-1111-1111-1111-111111111101', 'First $10,000 Raised', 'financial', 10000.00, 'Bronze Spark'),
('88888888-8888-8888-8888-888888888802', '11111111-1111-1111-1111-111111111101', '50% Financial Goal Reached ($25,000)', 'financial', 25000.00, 'Silver Horizon'),
('88888888-8888-8888-8888-888888888803', '11111111-1111-1111-1111-111111111101', '1,000 Warm Items Gathered', 'items', 1000.00, 'Warmth Champion'),
('88888888-8888-8888-8888-888888888804', '11111111-1111-1111-1111-111111111102', 'Rapid Medical Dispatch ($30,000)', 'financial', 30000.00, 'Life Saver'),
('88888888-8888-8888-8888-888888888805', '11111111-1111-1111-1111-111111111103', 'First 10 STEM Mentors Registered', 'volunteers', 10.00, 'Future Builder');

-- 10. SEED IMPACT UPDATES
INSERT INTO impact_updates (id, drive_id, author_org_id, title, content, media_urls, metrics_highlight)
VALUES
('99999999-9999-9999-9999-999999999901', '11111111-1111-1111-1111-111111111101', '00000000-0000-0000-0000-000000000001', 'First 1,500 Care Hampers Dispatched to South Side Pantries!', 'Thanks to the incredible influx of winter coats and canned protein boxes, our volunteer teams packaged and distributed 1,550 family hampers this morning.', ARRAY['https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=800&q=80'], '{"families_served": 1550, "volunteers_active": 25, "pounds_food": 8200}'::jsonb),

('99999999-9999-9999-9999-999999999902', '11111111-1111-1111-1111-111111111102', '00000000-0000-0000-0000-000000000002', 'Potable Water Distribution Station 4 Live in Port Arthur', 'Our industrial LifeStraw canisters have arrived and are now filtering 4,000 gallons of drinking water daily for displaced residents.', ARRAY['https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=800&q=80'], '{"gallons_clean_water": 4000, "triage_cases_treated": 118}'::jsonb);
