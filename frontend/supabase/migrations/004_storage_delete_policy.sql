-- 004_storage_delete_policy.sql: Allow authenticated users to delete video files
-- Execute in Supabase SQL editor if direct storage deletions with user JWT are desired:

create policy "Allow authenticated users to delete from videos bucket"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'videos');
