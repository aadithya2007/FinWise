AI Semantic Search Engine – Deep Learning Model Explanation

The core intelligence behind the FinWise AI Chatbot lies in its AI Semantic Search Engine, which enables the chatbot to understand user queries based on meaning, not just keywords. This deep-learning-powered engine allows FinWise to deliver accurate, context-aware financial information in a natural, conversational manner.

The working of this Semantic Search Engine can be understood in two main phases:

1. Offline Phase: Knowledge Base Indexing (One-Time Training)

This phase runs only once—typically when the Python AI service (app.py) starts for the first time or when pre-computed embeddings are unavailable.
Its goal is to prepare the financial knowledge base for fast, real-time semantic searches.

a) Loading the Financial Knowledge Base (FIQA Dataset)

Purpose: Provide the raw financial text data the AI will learn from and use for answering queries.

Details: FinWise uses the FIQA (Financial Question Answering) dataset, which contains a large collection of expert-curated financial questions and answer passages (definitions, advice, explanations, etc.).

Execution:

corpus_data = pd.read_parquet('fiqa_corpus.parquet')
corpus_sentences = corpus_data['text'].tolist()


The .parquet format is used for its fast loading, efficient compression, and schema consistency, making it ideal for ML workloads.

b) Loading the Pre-trained Sentence-BERT Model

Purpose: To convert text into semantic numerical representations (embeddings) that capture meaning.

Details: The system leverages a pre-trained Sentence-BERT model (sentence-transformers/all-MiniLM-L6-v2), which has already been trained on massive language datasets to understand human semantics.
FinWise does not retrain this model — it reuses its existing knowledge.

Execution:

from sentence_transformers import SentenceTransformer
model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')

c) Generating Embeddings for the Entire Knowledge Base

Purpose: Convert every financial passage into a unique numerical vector (embedding) to enable semantic comparison.

Details:
Each of the 57,000+ financial text passages is passed through the Sentence-BERT model to generate a 384-dimensional embedding vector.
Texts with similar meanings produce vectors that are close together in high-dimensional space.

Execution:

corpus_embeddings = model.encode(corpus_sentences, convert_to_tensor=True, show_progress_bar=True)

d) Saving Embeddings for Fast Future Access

Purpose: Avoid recomputation by saving embeddings locally.

Details:
The generated embeddings are stored as a NumPy array file (knowledge_base_embeddings.npy) — effectively becoming FinWise’s searchable “brain.”

Execution:

np.save('knowledge_base_embeddings.npy', corpus_embeddings.cpu().numpy())


This completes the one-time indexing phase, setting the stage for instant, real-time responses.

2. Online Phase: Real-time Query Inference & Semantic Search

This phase executes every time a user asks a question, enabling dynamic retrieval of the most relevant financial answer.

a) User Query Input & Routing

Purpose: Capture the user’s question from the frontend.

Details:
A user enters a query (e.g., “What is a mortgage?”) in the React frontend.
This request is sent to the Node.js backend, which securely forwards it to the Python AI microservice at the /ask API endpoint.

b) Real-time Query Embedding

Purpose: Convert the user’s question into a semantic embedding.

Details:
The Python service receives the query text and encodes it using the same Sentence-BERT model used during indexing.
This ensures semantic consistency between the query and the pre-computed corpus embeddings.

Execution:

query_embedding = model.encode(query, convert_to_tensor=True)

c) Similarity Calculation (Cosine Similarity)

Purpose: Measure how closely the query’s meaning matches each passage in the knowledge base.

Details:
FinWise compares the query embedding against all stored corpus embeddings using Cosine Similarity — a metric that measures the cosine of the angle between two vectors.

A value close to 1 indicates a strong semantic match.

Execution:

cosine_scores = util.cos_sim(query_embedding, corpus_embeddings)[0]

d) Retrieving the Best Match

Purpose: Identify the most relevant answer from the knowledge base.

Details:
The system sorts all cosine similarity scores in descending order and retrieves the highest-scoring passage, optionally applying a threshold to ensure quality.

Execution:

top_results = np.argsort(cosine_scores.cpu().numpy())[::-1][0:top_k]
best_answer = corpus_data['text'][top_results[0]]

e) Returning the AI-Generated Answer

Purpose: Deliver the final financial answer to the user.

Details:
The best-matching passage is sent back through the Node.js backend to the React frontend, where it appears as the chatbot’s response in the chat interface.
