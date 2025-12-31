# Chat to PDF
A smart document study assistant built with Next.js 16 and TypeScript. This application uses Retrieval-Augmented Generation (RAG) to allow users to upload PDF, DOCX, and PPTX files and ask questions in natural language. Powered by Google's Gemini AI and Pinecone Vector Database, it provides accurate, context-aware answers with support for Markdown and mathematical notation.

## 🚀 Features

* **Multi-Format Support**: Upload and chat with PDF, Word (`.docx`), and PowerPoint (`.pptx`) documents.
* **Intelligent RAG Pipeline**: Uses vector embeddings to retrieve relevant document context for every query.
* **Advanced AI Model**: Powered by Google's **Gemini 2.5 Flash** for high-speed, accurate responses.
* **Rich Text Rendering**: Responses support **Markdown** formatting and **LaTeX** math equations using `katex`.
* **Modern UI/UX**:
    * Responsive design with a collapsible sidebar.
    * Smooth animations using `framer-motion`.
    * Real-time streaming responses.
* **Efficient Vector Search**: Utilises Pinecone for fast and scalable vector storage and retrieval.

## 🛠️ Tech Stack

* **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
* **Language**: TypeScript
