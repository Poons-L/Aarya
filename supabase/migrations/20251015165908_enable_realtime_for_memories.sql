/*
  # Enable realtime for memories table

  1. Changes
    - Enable realtime replication for the memories table
    - This allows real-time subscriptions to work properly
  
  2. Security
    - Realtime respects existing RLS policies
    - Only authorized users will receive updates
*/

ALTER publication supabase_realtime ADD TABLE memories;