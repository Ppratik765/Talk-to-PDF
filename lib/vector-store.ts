import { Pinecone } from '@pinecone-database/pinecone';
import { google } from '@ai-sdk/google';
import { embedMany } from 'ai';

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

export async function embedAndStoreDocs(
  chunks: string[],
  fileName: string
) {
  const indexName = process.env.PINECONE_INDEX;
  if (!indexName) {
    throw new Error("PINECONE_INDEX is missing in .env.local file");
  }

  const index = pinecone.index(indexName);

  // FIX: Batch processing to respect Google's 100-item limit
  const batchSize = 100;

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);

    // 1. Generate embeddings for this specific batch
    const { embeddings } = await embedMany({
      model: google.textEmbeddingModel('text-embedding-004'),
      values: batch,
    });

    // 2. Prepare vectors for this batch
    const vectors = batch.map((chunk, batchIndex) => ({
      id: `${fileName}-${i + batchIndex}`,
      values: embeddings[batchIndex],
      metadata: {
        text: chunk,
        fileName,
      },
    }));

    // 3. Upsert this batch to Pinecone
    await index.namespace('ns1').upsert(vectors);
    
    console.log(`Processed batch ${i / batchSize + 1} for ${fileName}`);
  }
}

export async function getContext(query: string) {
  const indexName = process.env.PINECONE_INDEX;
  if (!indexName) {
    throw new Error("PINECONE_INDEX is missing in .env.local file");
  }

  // 1. Generate embedding using Gemini
  const { embeddings } = await embedMany({
    model: google.textEmbeddingModel('text-embedding-004'),
    values: [query],
  });

  // 2. Search Pinecone for similar chunks
  const index = pinecone.index(indexName);
  const queryResponse = await index.namespace('ns1').query({
    topK: 5,
    vector: embeddings[0],
    includeMetadata: true,
  });

  // 3. Extract the text and source
  return queryResponse.matches
    .map((match) => `Source: ${match.metadata?.fileName}\nContent: ${match.metadata?.text}`)
    .join('\n\n');
}
