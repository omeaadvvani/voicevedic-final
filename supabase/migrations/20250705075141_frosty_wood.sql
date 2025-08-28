/*
  # Add RPC function for vector similarity search

  1. New Functions
    - `match_vedic_faqs` - Server-side function for vector similarity search
      - Takes query_embedding (vector) and match_count (integer)
      - Returns table with id, question, and similarity score
      - Uses pgvector cosine similarity for ranking

  2. Features
    - Optimized vector search using cosine distance
    - Configurable result count (default: 5)
    - Returns similarity scores for ranking
    - SQL-based for maximum performance
*/

-- Create RPC function for vector similarity search
CREATE OR REPLACE FUNCTION match_vedic_faqs (
  query_embedding vector(1536),
  match_count integer DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  question text,
  similarity float
)
LANGUAGE sql
AS $$
  SELECT
    id,
    question,
    1 - (embedding <=> query_embedding) AS similarity
  FROM vedic_faqs
  WHERE embedding IS NOT NULL
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;