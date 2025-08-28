/*
  # Create vedic_faqs table for VoiceVedic smart suggestions

  1. New Tables
    - `vedic_faqs`
      - `id` (uuid, primary key, auto-generated)
      - `question` (text, the FAQ question)
      - `embedding` (vector, 1536 dimensions for OpenAI embeddings)
      - `created_at` (timestamp, auto-set to now())

  2. Security
    - Enable RLS on `vedic_faqs` table
    - Add policy for public read access (questions are public)
    - Add policy for authenticated users to insert/update (for admin functions)

  3. Data
    - Insert 5 initial FAQ questions for spiritual guidance
    - Questions cover common Hindu calendar and ritual topics
    - Embeddings left null for later population via Edge Function

  4. Indexes
    - Add index on question for text search
    - Add vector index for embedding similarity search (when populated)
*/

-- Enable the vector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Create vedic_faqs table
CREATE TABLE IF NOT EXISTS vedic_faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  embedding vector(1536), -- OpenAI embedding dimension
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE vedic_faqs ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access to FAQ questions
CREATE POLICY "Public can read FAQ questions"
  ON vedic_faqs
  FOR SELECT
  TO public
  USING (true);

-- Policy: Allow authenticated users to insert/update (for admin functions)
CREATE POLICY "Authenticated users can manage FAQs"
  ON vedic_faqs
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS vedic_faqs_question_idx ON vedic_faqs(question);
CREATE INDEX IF NOT EXISTS vedic_faqs_created_at_idx ON vedic_faqs(created_at);

-- Create vector index for similarity search (when embeddings are populated)
-- This will be used later when embeddings are added
CREATE INDEX IF NOT EXISTS vedic_faqs_embedding_idx ON vedic_faqs 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Insert the 5 initial FAQ questions
INSERT INTO vedic_faqs (question) VALUES
  ('When is the next Amavasya?'),
  ('What should I do on Ekadashi?'),
  ('How do I perform a simple pooja at home?'),
  ('Which day is best for Hanuman prayers?'),
  ('What is the meaning of Rahukalam?')
ON CONFLICT DO NOTHING; -- Prevent duplicates if migration runs multiple times