INSERT INTO storage.buckets
  (id, name, public, file_size_limit)
VALUES
  ('workspaces', 'workspaces', false, 10485760);

CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'workspaces' AND
  EXISTS (
    SELECT 1
    FROM public.chats
    WHERE chats.id = (storage.foldername(name))[1]::uuid AND
          chats.user_id = auth.uid()
  )
);

CREATE POLICY "Allow authenticated updates"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'workspaces' AND
  EXISTS (
    SELECT 1
    FROM public.chats
    WHERE chats.id = (storage.foldername(name))[1]::uuid AND
          chats.user_id = auth.uid()
  )
);

CREATE POLICY "Allow authenticated deletes"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'workspaces' AND
  EXISTS (
    SELECT 1
    FROM public.chats
    WHERE chats.id = (storage.foldername(name))[1]::uuid AND
          chats.user_id = auth.uid()
  )
);

CREATE POLICY "Allow authenticated reads"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'workspaces' AND
  EXISTS (
    SELECT 1
    FROM public.chats
    WHERE chats.id = (storage.foldername(name))[1]::uuid AND
          chats.user_id = auth.uid()
  )
);