-- Adds the missing DELETE policy for leadership_notes. 0001_init.sql only
-- granted SELECT/INSERT/UPDATE to authenticated users — E-Board members
-- need to be able to remove outdated notes too. Run this in the Supabase
-- SQL editor (same project as 0001) once, after 0001 has already run.

create policy "authenticated can delete leadership_notes" on leadership_notes
  for delete using (auth.role() = 'authenticated');
