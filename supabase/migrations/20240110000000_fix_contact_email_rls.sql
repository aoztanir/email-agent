-- Fix RLS policy for contact_email table to allow backend operations
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON contact_email;

-- Create a more permissive policy that allows operations from both frontend and backend
CREATE POLICY "Enable all operations for contact_email" ON contact_email
FOR ALL USING (true);

-- Alternative: If you want to restrict to authenticated users only, use this instead:
-- CREATE POLICY "Allow all operations for authenticated users" ON contact_email
-- FOR ALL USING (auth.uid() IS NOT NULL OR current_setting('role') = 'service_role');