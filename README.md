Personal Health Assistant

A smart web application powered by Retrieval-Augmented Generation (RAG) to provide reliable, general health information safely and accurately.

---
Key Features

AI-powered health question answering using advanced LLM models

Trusted medical knowledge base sourced from MedlinePlus and PubMed

RAG pipeline for retrieving relevant medical context

User history for storing past questions and answers

Built-in medical disclaimers to ensure safe usage

Secure OAuth authentication

Fully tested backend with nine successful unit tests

---
Requirements

Node.js 18+

pnpm

MySQL or TiDB
---
Installation
# Clone the repository
git clone <repo-url>
cd personal_health_assistant

# Install dependencies
pnpm install

# Initialize the database
pnpm db:push

# Start the development server
pnpm dev

---
Project Structure
personal_health_assistant/
├── client/               # Frontend (React)
│   ├── src/
│   └── public/
├── server/               # Backend (Express + tRPC)
├── drizzle/              # Database schema
├── scripts/              # Utility scripts
└── rag_data/             # Knowledge base files

---
Technology Stack

Frontend: React 19, Tailwind CSS, shadcn/ui, tRPC
Backend: Node.js, Express.js, tRPC
Database: MySQL/TiDB, Drizzle ORM
AI: RAG pipeline and LLM integration

Usage Example
const result = await trpc.health.askQuestion.mutate({
  question: "What are the symptoms of iron deficiency?"
});

Testing

The project includes nine unit tests that cover authentication, RAG question handling, history retrieval, feedback submission, and medical disclaimer enforcement.

Run tests:

pnpm test

Medical Disclaimer

This application provides general information only and is not a substitute for professional medical advice or diagnosis. For emergencies, contact official medical services immediately.

License

This project is licensed under the MIT License.

Contributions

Contributions are welcome.
Please create a new branch, make your changes, add tests, and submit a pull request.
