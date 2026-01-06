import { Pinecone } from '@pinecone-database/pinecone';
import { google } from '@ai-sdk/google';
import { embedMany } from 'ai';

// EXPORTED so we can use it in the delete route if needed directly
export const pinecone = new Pinecone({
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
  const batchSize = 100;

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);

    const { embeddings } = await embedMany({
      model: google.textEmbeddingModel('text-embedding-004'),
      values: batch,
    });

    const vectors = batch.map((chunk, batchIndex) => ({
      id: `${fileName}-${i + batchIndex}`,
      values: embeddings[batchIndex],
      metadata: {
        text: chunk,
        fileName,
      },
    }));

    await index.namespace('ns1').upsert(vectors);
    console.log(`Processed batch ${i / batchSize + 1} for ${fileName}`);
  }
}

export async function getContext(query: string) {
  const indexName = process.env.PINECONE_INDEX;
  if (!indexName) {
    throw new Error("PINECONE_INDEX is missing in .env.local file");
  }

  const { embeddings } = await embedMany({
    model: google.textEmbeddingModel('text-embedding-004'),
    values: [query],
  });

  const index = pinecone.index(indexName);
  const queryResponse = await index.namespace('ns1').query({
    topK: 5,
    vector: embeddings[0],
    includeMetadata: true,
  });

  return queryResponse.matches
    .map((match) => `Source: ${match.metadata?.fileName}\nContent: ${match.metadata?.text}`)
    .join('\n\n');
}

// NEW FUNCTION: Deletes all vectors associated with a specific file
export async function deleteSource(fileName: string) {
  const indexName = process.env.PINECONE_INDEX;
  if (!indexName) {
    throw new Error("PINECONE_INDEX is missing in .env.local file");
  }

  const index = pinecone.index(indexName);
  
  // Delete all vectors where metadata.fileName equals the target
  await index.namespace('ns1').deleteMany({
    fileName: { $eq: fileName }
  });
}