-- Run this in Supabase SQL Editor to populate dummy data

DO $$
DECLARE
  demo_student_id UUID;
  f_business UUID;
  f_ai UUID;
  m_management UUID;
  m_informatics UUID;
  m_accounting UUID;
  m_is UUID;
  sg1_id UUID := gen_random_uuid();
  sg2_id UUID := gen_random_uuid();
  sg3_id UUID := gen_random_uuid();
  sg4_id UUID := gen_random_uuid();
  event1_id UUID := gen_random_uuid();
  event2_id UUID := gen_random_uuid();
BEGIN
  -- Get Demo Student ID safely
  SELECT id INTO demo_student_id FROM public.users WHERE email LIKE '%demostudent2%' OR email LIKE '%demo@student%' LIMIT 1;
  
  -- Get Faculties and Majors safely
  SELECT id INTO f_business FROM faculties WHERE name = 'Faculty of Business' LIMIT 1;
  SELECT id INTO f_ai FROM faculties WHERE name = 'Faculty of Artificial Intelligence and Smart Manufacturing' LIMIT 1;
  
  SELECT id INTO m_management FROM majors WHERE name = 'Management' LIMIT 1;
  SELECT id INTO m_accounting FROM majors WHERE name = 'Accounting' LIMIT 1;
  SELECT id INTO m_informatics FROM majors WHERE name = 'Informatics' LIMIT 1;
  SELECT id INTO m_is FROM majors WHERE name = 'Information System' LIMIT 1;

  -- 1. Assign demo student to Informatics
  IF demo_student_id IS NOT NULL THEN
    UPDATE public.users 
    SET faculty_id = f_ai, major_id = m_informatics
    WHERE id = demo_student_id;
  END IF;

  -- 2. Add Study Groups (2 per major)
  -- We delete existing dummy ones first to avoid redundancy if re-run multiple times
  DELETE FROM study_groups WHERE slug IN ('dummy-info-1', 'dummy-info-2', 'dummy-biz-1', 'dummy-biz-2');

  -- Ensure demo_student_id is not null for creation, fallback to gen_random_uuid() which will violate constraint if no users exist, but assuming demo exists.
  IF demo_student_id IS NOT NULL THEN
    INSERT INTO study_groups (id, name, slug, description, course_name, faculty_id, creator_id, is_private, major_id)
    VALUES 
      (sg1_id, 'Informatics Final Prep', 'dummy-info-1', 'Preparing for the final project in Informatics.', 'Software Engineering', f_ai, demo_student_id, false, m_informatics),
      (sg2_id, 'AI Enthusiasts', 'dummy-info-2', 'Discussion group for AI concepts and Machine Learning.', 'Artificial Intelligence', f_ai, demo_student_id, true, m_informatics),
      (sg3_id, 'Business Management 101', 'dummy-biz-1', 'Study group for Intro to Management.', 'Intro to Management', f_business, demo_student_id, false, m_management),
      (sg4_id, 'Accounting Case Studies', 'dummy-biz-2', 'Solving complex accounting cases together.', 'Financial Accounting', f_business, demo_student_id, false, m_accounting);

    -- 3. Add Members to Study Groups
    INSERT INTO study_group_members (group_id, user_id, role) VALUES (sg1_id, demo_student_id, 'owner');
    INSERT INTO study_group_members (group_id, user_id, role) VALUES (sg2_id, demo_student_id, 'owner');
    INSERT INTO study_group_members (group_id, user_id, role) VALUES (sg3_id, demo_student_id, 'owner');
    INSERT INTO study_group_members (group_id, user_id, role) VALUES (sg4_id, demo_student_id, 'owner');
  END IF;

  -- 4. Add Dummy Events
  DELETE FROM events WHERE title IN ('Tech Career Fair 2026', 'Startup Pitching Competition');
  
  INSERT INTO events (id, title, description, event_type, start_at, end_at, location_or_link, status)
  VALUES 
    (event1_id, 'Tech Career Fair 2026', 'Join us for the biggest tech career fair of the year! Meet top tech companies.', 'meetup', now() + interval '5 days', now() + interval '5 days 4 hours', 'President University Convention Center', 'upcoming'),
    (event2_id, 'Startup Pitching Competition', 'Watch student startups pitch their ideas to investors.', 'seminar', now() + interval '10 days', now() + interval '10 days 3 hours', 'Auditorium', 'upcoming');

  -- 5. Add Calendar Events for Demo Student
  IF demo_student_id IS NOT NULL THEN
    DELETE FROM calendar_events WHERE user_id = demo_student_id AND title LIKE 'Dummy:%';

    INSERT INTO calendar_events (user_id, title, start_at, end_at, type, color)
    VALUES 
      (demo_student_id, 'Dummy: Submit Software Project', now() + interval '2 days', now() + interval '2 days 1 hour', 'task', 'destructive'),
      (demo_student_id, 'Dummy: Informatics Final Prep Meeting', now() + interval '3 days', now() + interval '3 days 2 hours', 'group_meeting', 'primary'),
      (demo_student_id, 'Dummy: Tech Career Fair', now() + interval '5 days', now() + interval '5 days 4 hours', 'custom', 'secondary');
  END IF;

END $$;
