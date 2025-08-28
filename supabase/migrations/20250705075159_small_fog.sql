/*
  # Populate embeddings for existing vedic_faqs questions

  1. Purpose
    - This migration will be used to populate embeddings for existing FAQ questions
    - The embeddings will be generated via the Edge Function or a separate script
    - For now, we're just ensuring the table structure is ready

  2. Notes
    - Embeddings should be populated after the Edge Function is deployed
    - You can use the OpenAI API to generate embeddings for each question
    - This is a placeholder migration for future embedding population
*/

-- Ensure the vedic_faqs table has the correct structure
-- This is mainly for verification and future embedding population

-- Add a comment to track when embeddings were last updated
COMMENT ON COLUMN vedic_faqs.embedding IS 'OpenAI text-embedding-3-small vectors (1536 dimensions)';

-- Create a function to update embeddings (for future use)
CREATE OR REPLACE FUNCTION update_vedic_faq_embedding(
  faq_id uuid,
  new_embedding vector(1536)
)
RETURNS void
LANGUAGE sql
AS $$
  UPDATE vedic_faqs 
  SET embedding = new_embedding 
  WHERE id = faq_id;
$$;

-- Grant necessary permissions for the Edge Function to update embeddings
-- This allows the service role to update embeddings when needed
GRANT UPDATE ON vedic_faqs TO service_role;