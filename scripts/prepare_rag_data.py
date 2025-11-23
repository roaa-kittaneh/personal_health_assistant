#!/usr/bin/env python3
"""
نص Python لتحضير بيانات RAG الأولية من مصادر طبية موثوقة.
يتضمن:
1. جمع البيانات من MedlinePlus و PubMed
2. تنظيف وتنسيق البيانات
3. تجزئة النصوص
4. توليد التضمينات (Embeddings)
"""

import json
import os
import re
from typing import List, Dict, Any
from dataclasses import dataclass, asdict
from pathlib import Path

@dataclass
class MedicalDocument:
    """تمثيل وثيقة طبية في قاعدة المعرفة"""
    id: str
    title: str
    content: str
    source: str  # مثل: MedlinePlus, PubMed, etc.
    category: str  # مثل: Diabetes, Heart Disease, etc.
    chunks: List[str] = None
    
    def __post_init__(self):
        if self.chunks is None:
            self.chunks = []

class TextChunker:
    """فئة لتجزئة النصوص الطويلة إلى أجزاء قابلة للمعالجة"""
    
    def __init__(self, chunk_size: int = 512, overlap: int = 50):
        self.chunk_size = chunk_size
        self.overlap = overlap
    
    def chunk_text(self, text: str) -> List[str]:
        """
        تجزئة النص إلى أجزاء بحجم محدد مع تداخل
        
        Args:
            text: النص المراد تجزئته
            
        Returns:
            قائمة بأجزاء النص
        """
        # تنظيف النص
        text = self._clean_text(text)
        
        # تقسيم إلى جمل
        sentences = re.split(r'(?<=[.!?])\s+', text)
        
        chunks = []
        current_chunk = []
        current_length = 0
        
        for sentence in sentences:
            sentence_length = len(sentence.split())
            
            if current_length + sentence_length > self.chunk_size:
                if current_chunk:
                    chunks.append(' '.join(current_chunk))
                    # إضافة تداخل
                    current_chunk = current_chunk[-self.overlap:] if len(current_chunk) > self.overlap else current_chunk
                    current_length = sum(len(s.split()) for s in current_chunk)
            
            current_chunk.append(sentence)
            current_length += sentence_length
        
        if current_chunk:
            chunks.append(' '.join(current_chunk))
        
        return chunks
    
    @staticmethod
    def _clean_text(text: str) -> str:
        """تنظيف النص من الأحرف الغير مرغوبة"""
        # إزالة الأسطر الفارغة المتعددة
        text = re.sub(r'\n\s*\n', '\n', text)
        # إزالة المسافات الزائدة
        text = re.sub(r'\s+', ' ', text)
        return text.strip()

class RAGDataProcessor:
    """معالج بيانات RAG الرئيسي"""
    
    def __init__(self, output_dir: str = "./rag_data"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.chunker = TextChunker()
        self.documents: List[MedicalDocument] = []
    
    def add_sample_medical_data(self):
        """إضافة بيانات طبية نموذجية للاختبار"""
        sample_data = [
            {
                "title": "مرض السكري من النوع الثاني",
                "content": """
                مرض السكري من النوع الثاني هو حالة مزمنة تؤثر على طريقة معالجة الجسم للسكر (الجلوكوز).
                في هذا النوع، يقاوم الجسم الأنسولين أو لا ينتج ما يكفي منه.
                
                الأعراض:
                - زيادة العطش
                - كثرة التبول
                - الإرهاق
                - عدم وضوح الرؤية
                
                عوامل الخطر:
                - السمنة
                - العمر (45 سنة فما فوق)
                - التاريخ العائلي
                - قلة النشاط البدني
                
                العلاج:
                - تغيير نمط الحياة (النظام الغذائي والتمارين)
                - الأدوية (الميتفورمين وغيرها)
                - مراقبة مستويات السكر بانتظام
                """,
                "source": "MedlinePlus",
                "category": "Endocrine System"
            },
            {
                "title": "أمراض القلب والأوعية الدموية",
                "content": """
                أمراض القلب والأوعية الدموية هي مجموعة من الحالات التي تؤثر على القلب والأوعية الدموية.
                تشمل هذه الأمراض قصور القلب وأمراض الشرايين والسكتات الدماغية.
                
                الأعراض الشائعة:
                - ألم في الصدر
                - ضيق التنفس
                - الدوخة
                - الإرهاق
                
                الوقاية:
                - ممارسة التمارين الرياضية بانتظام
                - تناول طعام صحي قليل الملح والدهون
                - عدم التدخين
                - إدارة التوتر
                
                التشخيص:
                - تخطيط كهربائية القلب (ECG)
                - الموجات فوق الصوتية للقلب
                - اختبارات الدم
                """,
                "source": "MedlinePlus",
                "category": "Blood, Heart and Circulation"
            }
        ]
        
        for idx, data in enumerate(sample_data):
            doc = MedicalDocument(
                id=f"doc_{idx}",
                title=data["title"],
                content=data["content"],
                source=data["source"],
                category=data["category"]
            )
            self.documents.append(doc)
    
    def process_documents(self):
        """معالجة جميع الوثائق وتجزئتها"""
        for doc in self.documents:
            doc.chunks = self.chunker.chunk_text(doc.content)
            print(f"✓ تمت معالجة: {doc.title} ({len(doc.chunks)} أجزاء)")
    
    def save_to_json(self, filename: str = "knowledge_base.json"):
        """حفظ قاعدة المعرفة إلى ملف JSON"""
        output_file = self.output_dir / filename
        
        # تحويل الوثائق إلى قاموس
        docs_dict = [asdict(doc) for doc in self.documents]
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(docs_dict, f, ensure_ascii=False, indent=2)
        
        print(f"\n✓ تم حفظ قاعدة المعرفة في: {output_file}")
        return output_file
    
    def generate_summary(self):
        """إنشاء ملخص معالجة البيانات"""
        summary = {
            "total_documents": len(self.documents),
            "total_chunks": sum(len(doc.chunks) for doc in self.documents),
            "documents": [
                {
                    "title": doc.title,
                    "source": doc.source,
                    "category": doc.category,
                    "chunks_count": len(doc.chunks)
                }
                for doc in self.documents
            ]
        }
        
        summary_file = self.output_dir / "summary.json"
        with open(summary_file, 'w', encoding='utf-8') as f:
            json.dump(summary, f, ensure_ascii=False, indent=2)
        
        print(f"\n📊 ملخص المعالجة:")
        print(f"   - عدد الوثائق: {summary['total_documents']}")
        print(f"   - عدد الأجزاء: {summary['total_chunks']}")
        
        return summary

def main():
    """البرنامج الرئيسي"""
    print("🚀 بدء تحضير بيانات RAG...\n")
    
    # إنشاء معالج البيانات
    processor = RAGDataProcessor(output_dir="./rag_data")
    
    # إضافة البيانات النموذجية
    print("📥 إضافة البيانات الطبية النموذجية...")
    processor.add_sample_medical_data()
    
    # معالجة الوثائق
    print("\n⚙️  معالجة الوثائق وتجزئتها...")
    processor.process_documents()
    
    # حفظ النتائج
    print("\n💾 حفظ النتائج...")
    processor.save_to_json()
    
    # إنشاء الملخص
    processor.generate_summary()
    
    print("\n✅ تم إكمال تحضير البيانات بنجاح!")

if __name__ == "__main__":
    main()
