from flask import Flask, request, jsonify
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import pandas as pd
import os

app = Flask(__name__)

# --- Load Model ---
print("Loading Sentence Transformer model...")
model = SentenceTransformer('all-MiniLM-L6-v2')

# --- Load Knowledge Base ---
print("Loading knowledge base from Parquet file...")
try:
    # Make sure this path is correct for your project structure
    corpus_df = pd.read_parquet('data/data/corpus/corpus.parquet')
    knowledge_base = corpus_df['doc'].tolist()
    print(f"Loaded {len(knowledge_base)} passages.")
except Exception as e:
    print(f"❌ CRITICAL ERROR: Could not load data file. {e}")
    exit()

# --- Load or Create Embeddings (.npy file) ---
embedding_file = 'knowledge_base_embeddings.npy'

if not os.path.exists(embedding_file):
    print(f"Embeddings file '{embedding_file}' not found.")
    print("Creating new embeddings... This will take a few minutes, please wait.")

    # This is the step that creates the .npy file
    knowledge_base_embeddings = model.encode(knowledge_base, show_progress_bar=True)

    print("Saving embeddings to file...")
    np.save(embedding_file, knowledge_base_embeddings)
else:
    print(f"Loading existing embeddings from '{embedding_file}'...")
    knowledge_base_embeddings = np.load(embedding_file)

print("✅ Model and data are ready!")


# --- End of loading ---


def get_best_answer(user_query):
    """Finds the most relevant answer from the knowledge base."""
    query_embedding = model.encode([user_query])
    similarities = cosine_similarity(query_embedding, knowledge_base_embeddings)
    best_answer_index = np.argmax(similarities)
    return knowledge_base[best_answer_index]


@app.route('/ask', methods=['POST'])
def ask():
    """API endpoint to receive a question and return an answer."""
    data = request.get_json()
    if not data or 'query' not in data:
        return jsonify({"error": "Query not provided"}), 400

    user_query = data['query']
    answer = get_best_answer(user_query)

    return jsonify({"answer": answer})


if __name__ == '__main__':
    print("Starting Flask server...")
    app.run(host='0.0.0.0', port=5001)