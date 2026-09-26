-- Enable public read access to the profiles table so the emergency QR code works for first responders
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
ON profiles FOR SELECT 
USING (true);

-- Enable public read access to the vault_documents so the emergency QR code can display Reports
DROP POLICY IF EXISTS "Public documents are viewable" ON vault_documents;
CREATE POLICY "Public documents are viewable" 
ON vault_documents FOR SELECT 
USING (true);
