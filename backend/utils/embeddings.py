import os
import numpy as np
from sentence_transformers import SentenceTransformer
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.vectorstores import FAISS
from langchain.docstore.document import Document

# Initialize embedding model
model_name = "all-MiniLM-L6-v2"
embedding_model = HuggingFaceEmbeddings(model_name=model_name)

class EmbeddingManager:
    def __init__(self):
        self.model = SentenceTransformer(model_name)
        self.vector_store = None
        
    def create_embeddings(self, texts):
        """
        Create embeddings for a list of texts
        """
        if not texts:
            return []
        
        # Convert texts to documents for FAISS
        documents = [Document(page_content=text) for text in texts]
        
        # Create vector store
        self.vector_store = FAISS.from_documents(documents, embedding_model)
        
        return self.vector_store
    
    def search_similar(self, query, k=5):
        """
        Search for similar texts based on a query
        """
        if not self.vector_store:
            return []
        
        # Search for similar documents
        docs = self.vector_store.similarity_search(query, k=k)
        
        return [doc.page_content for doc in docs]
    
    def update_vector_store(self, new_texts):
        """
        Update the vector store with new texts
        """
        if not new_texts:
            return
        
        # Convert texts to documents
        new_documents = [Document(page_content=text) for text in new_texts]
        
        if self.vector_store:
            # Add documents to existing store
            self.vector_store.add_documents(new_documents)
        else:
            # Create new store
            self.vector_store = FAISS.from_documents(new_documents, embedding_model)

# Create a singleton instance
embedding_manager = EmbeddingManager()