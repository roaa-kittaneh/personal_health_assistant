import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Heart, Send, AlertCircle, History } from "lucide-react";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Streamdown } from 'streamdown';

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [question, setQuestion] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  // tRPC hooks
  const askQuestionMutation = trpc.health.askQuestion.useMutation();
  const historyQuery = trpc.health.getHistory.useQuery(undefined, {
    enabled: isAuthenticated && showHistory,
  });

  const handleAskQuestion = async () => {
    if (!question.trim()) return;

    try {
      await askQuestionMutation.mutateAsync({ question });
      setQuestion("");
    } catch (error) {
      console.error("Error asking question:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Heart className="w-12 h-12 text-red-500" />
            </div>
            <CardTitle className="text-2xl">{APP_TITLE}</CardTitle>
            <CardDescription>
              مساعد صحي ذكي يجيب على أسئلتك الصحية العامة
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-700">
                <strong>ملاحظة مهمة:</strong> هذا المساعد يوفر معلومات عامة فقط ولا يعتبر بديلاً عن استشارة الطبيب المتخصص.
              </p>
            </div>
            <Button 
              onClick={() => window.location.href = getLoginUrl()} 
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              تسجيل الدخول
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-red-500" />
            <h1 className="text-xl font-bold text-gray-900">{APP_TITLE}</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.name}</span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={logout}
            >
              تسجيل الخروج
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Medical Disclaimer */}
        <Card className="mb-6 border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-900 mb-1">تحذير طبي مهم</p>
                <p className="text-sm text-yellow-800">
                  المعلومات المقدمة هنا لأغراض تعليمية فقط وليست بديلاً عن استشارة الطبيب المتخصص. 
                  في حالة الطوارئ الطبية، يرجى التواصل مع خدمات الطوارئ فوراً.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chat Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Question Input Card */}
            <Card>
              <CardHeader>
                <CardTitle>اسأل سؤالاً صحياً</CardTitle>
                <CardDescription>
                  اطرح سؤالك الصحي وسيقدم المساعد معلومات عامة موثوقة
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="مثال: ما هي أعراض نقص الحديد؟ أو كيف يمكنني الوقاية من الإنفلونزا؟"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="min-h-24 resize-none"
                  disabled={askQuestionMutation.isPending}
                />
                <Button
                  onClick={handleAskQuestion}
                  disabled={!question.trim() || askQuestionMutation.isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  {askQuestionMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      جاري المعالجة...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      إرسال السؤال
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Answer Display */}
            {askQuestionMutation.data && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-lg">الإجابة</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="prose prose-sm max-w-none">
                    <Streamdown>{askQuestionMutation.data.answer}</Streamdown>
                  </div>

                  {/* Sources */}
                  {askQuestionMutation.data.sources && askQuestionMutation.data.sources.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm font-semibold text-gray-700 mb-2">المصادر:</p>
                      <div className="space-y-2">
                        {askQuestionMutation.data.sources.map((source, idx) => (
                          <div key={idx} className="text-sm bg-white p-2 rounded border border-green-200">
                            <p className="font-medium text-gray-900">{source.title}</p>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">{source.source}</Badge>
                              <Badge variant="secondary" className="text-xs">{source.category}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {askQuestionMutation.error && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-6">
                  <p className="text-sm text-red-800">
                    حدث خطأ: {askQuestionMutation.error.message}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* History Button */}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowHistory(!showHistory)}
            >
              <History className="w-4 h-4 mr-2" />
              {showHistory ? "إخفاء السجل" : "عرض السجل"}
            </Button>

            {/* History List */}
            {showHistory && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">السجل الشخصي</CardTitle>
                </CardHeader>
                <CardContent>
                  {historyQuery.isLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  ) : historyQuery.data && historyQuery.data.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {historyQuery.data.map((item) => (
                        <div key={item.id} className="text-sm border-l-2 border-blue-300 pl-3 py-2">
                          <p className="font-medium text-gray-900 line-clamp-2">
                            {item.question}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(item.createdAt).toLocaleDateString("ar-SA")}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">
                      لا توجد أسئلة سابقة
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Tips Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">نصائح مفيدة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-700">
                <p>✓ اطرح أسئلة واضحة وموجزة</p>
                <p>✓ تجنب الأسئلة التشخيصية المعقدة</p>
                <p>✓ استشر الطبيب دائماً للتشخيص</p>
                <p>✓ احفظ الإجابات المفيدة</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
