-- Fix: Allow contest owner to update entry status (approve/reject)

DROP POLICY IF EXISTS "Contest owner can update entries" ON entries;
CREATE POLICY "Contest owner can update entries"
  ON entries FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM contests
      WHERE contests.id = entries.contest_id
      AND contests.creator_id = auth.uid()
    )
  );
