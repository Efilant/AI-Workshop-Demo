import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// 1. Generate Interview Questions from Interviewer Title & Context
app.post("/api/generate-questions", async (req, res) => {
  try {
    const { interviewerTitle, companyType, experienceLevel, department, context } = req.body;

    const prompt = `
Sen kıdemli bir mülakat ve kariyer koçusun. Aşağıdaki bilgilere dayanarak, mülakata katılacak yetkilinin unvanına ve şirket profiline göre adaya yöneltebileceği en kritik mülakat sorularını oluştur.

Mülakatı Yapacak Kişinin Unvanı: ${interviewerTitle || "Engineering Manager / Hiring Manager"}
Şirket Türü / Sektör: ${companyType || "Teknoloji / Kurumsal"}
Deneyim Seviyesi: ${experienceLevel || "Mid/Senior"}
Departman / Rol: ${department || "Yazılım / Ürün"}
Ek Bağlam / Notlar: ${context || "Belirtilmedi"}

Lütfen Türkçe olarak şu JSON şemasına uygun 6 adet derinlemesine soru üret:
- category: (Örn: "Teknik Mimari ve Ölçeklenebilirlik", "Kültürel Uyum ve Takım Çalışması", "Problem Çözme ve Kriz Yönetimi", "Liderlik ve Mentorluk", "Stratejik Düşünme")
- question: Sorunun tam metni
- interviewerPerspective: Bu unvandaki kişi bu soruyu neden sorar ve arkasındaki niyet nedir?
- whatTheyLookFor: Adayın cevabında aranan anahtar kriterler (array of strings)
- starTip: Bu soruya STAR (Situation, Task, Action, Result) metoduyla nasıl cevap verilmeli? İpucu.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING },
              question: { type: Type.STRING },
              interviewerPerspective: { type: Type.STRING },
              whatTheyLookFor: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              starTip: { type: Type.STRING },
            },
            required: ["category", "question", "interviewerPerspective", "whatTheyLookFor", "starTip"],
          },
        },
      },
    });

    const data = JSON.parse(response.text || "[]");
    res.json({ questions: data });
  } catch (error: any) {
    console.error("Generate questions error:", error);
    res.status(500).json({ error: error.message || "Sorular üretilirken bir hata oluştu." });
  }
});

// 2. Evaluate User's Answer
app.post("/api/evaluate-answer", async (req, res) => {
  try {
    const { question, answer, interviewerTitle, targetRole } = req.body;

    const prompt = `
Sen kıdemli bir mülakat koçusun. Bir adayın mülakat sorusuna verdiği yanıtı değerlendireceksin.

Hedef Rol / Unvan: ${targetRole || "Belirtilmedi"}
Mülakatı Yapan Unvan: ${interviewerTitle || "Mülakatçı"}
Soru: "${question}"
Adayın Yanıtı: "${answer}"

Lütfen bu yanıtı profesyonel düzeyde analiz et ve şu JSON formatında yanıt ver:
- score: 0 ile 100 arasında bir puan (integer)
- starAnalysis: { situation: string, task: string, action: string, result: string } (Adayın yanıtında STAR bileşenlerinin durumu ve eksikleri)
- strengths: Güçlü yönler (array of strings)
- improvements: Geliştirilmesi gereken alanlar (array of strings)
- modelAnswer: Bu soruya verilebilecek çok daha güçlü, yapılandırılmış örnek bir yanıt
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            starAnalysis: {
              type: Type.OBJECT,
              properties: {
                situation: { type: Type.STRING },
                task: { type: Type.STRING },
                action: { type: Type.STRING },
                result: { type: Type.STRING },
              },
              required: ["situation", "task", "action", "result"],
            },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
            modelAnswer: { type: Type.STRING },
          },
          required: ["score", "starAnalysis", "strengths", "improvements", "modelAnswer"],
        },
      },
    });

    const data = JSON.parse(response.text || "{}");
    res.json(data);
  } catch (error: any) {
    console.error("Evaluate answer error:", error);
    res.status(500).json({ error: error.message || "Yanıt değerlendirilirken hata oluştu." });
  }
});

// 3. Analyze Training & Career Roadmap
app.post("/api/analyze-training", async (req, res) => {
  try {
    const { completedTrainings, targetRole, careerGoals } = req.body;

    const prompt = `
Sen kıdemli bir kariyer koçu ve yetenek gelişim danışmanısın. Kullanıcının tamamladığı eğitimleri ve sertifikaları analiz ederek, hedeflediği pozisyon için mevcut durumunu değerlendir ve sonraki adımlar için kapsamlı bir gelişim yol haritası çıkar.

Hedef Pozisyon / Unvan: ${targetRole || "Kıdemli Uzman / Lider"}
Kariyer Hedefleri: ${careerGoals || "Kariyer basamaklarında hızla yükselmek ve uzmanlaşmak"}
Tamamlanan Eğitimler / Sertifikalar / İçerikler:
${completedTrainings || "Belirtilmedi"}

Lütfen şu JSON formatında detaylı bir analiz sun:
- currentLevelAssessment: Kullanıcının mevcut yetkinlik seviyesinin değerlendirmesi (string)
- skillGaps: Hedef role ulaşmak için eksik olan kritik yetkinlikler ve bilgi boşlukları (array of strings)
- nextTrainingRecommendations: Bir sonraki adımda alınması gereken spesifik eğitimler, sertifikalar veya kurs konuları (array of objects: { title: string, platformOrType: string, reason: string, estimatedWeeks: number })
- careerActionPlan: 3 adımlı stratejik kariyer eylem planı (array of objects: { step: number, title: string, description: string })
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            currentLevelAssessment: { type: Type.STRING },
            skillGaps: { type: Type.ARRAY, items: { type: Type.STRING } },
            nextTrainingRecommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  platformOrType: { type: Type.STRING },
                  reason: { type: Type.STRING },
                  estimatedWeeks: { type: Type.NUMBER },
                },
                required: ["title", "platformOrType", "reason", "estimatedWeeks"],
              },
            },
            careerActionPlan: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  step: { type: Type.NUMBER },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                },
                required: ["step", "title", "description"],
              },
            },
          },
          required: ["currentLevelAssessment", "skillGaps", "nextTrainingRecommendations", "careerActionPlan"],
        },
      },
    });

    const data = JSON.parse(response.text || "{}");
    res.json(data);
  } catch (error: any) {
    console.error("Analyze training error:", error);
    res.status(500).json({ error: error.message || "Eğitim analizi yapılırken hata oluştu." });
  }
});

// 4. Career Coach Chat
app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body; // array of { role: 'user' | 'model', content: string }

    const formattedHistory = (messages || []).slice(0, -1).map((m: any) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    const lastMessage = messages[messages.length - 1]?.content || "Merhaba";

    const chat = ai.chats.create({
      model: "gemini-3.8-flash",
      history: formattedHistory,
      config: {
        systemInstruction: "Sen dünyaca unvanlı, empatik, stratejik ve yapıcı bir Kıdemli Kariyer ve Mülakat Koçusun. Kullanıcılara mülakat hazırlığı, CV optimizasyonu, maaş pazarlığı, liderlik ve kariyer geçişleri konularında en iyi rehberliği Türkçe olarak sunarsın.",
      },
    });

    const result = await chat.sendMessage({ message: lastMessage });
    res.json({ reply: result.text });
  } catch (error: any) {
    console.error("Chat error:", error);
    res.status(500).json({ error: error.message || "Sohbet sırasında hata oluştu." });
  }
});

// 5. Generate STAR Success Story Draft
app.post("/api/generate-star-story", async (req, res) => {
  try {
    const { storyTitle, rawSituation, rawTask, rawAction, rawResult, targetCompetency } = req.body;

    const prompt = `
Sen kıdemli bir mülakat ve kariyer koçusun. Kullanıcının iş hayatındaki bir deneyimini STAR (Situation, Task, Action, Result) metodolojisine göre profesyonel, etkileyici ve mülakatlarda doğrudan anlatılabilecek bir başarı hikayesi taslağına dönüştüreceksin.

Hikaye Başlığı / Konusu: ${storyTitle || "Başarı Hikayesi"}
Hedef Yetkinlik / Soru Tipi: ${targetCompetency || "Liderlik, Problem Çözme veya Kriz Yönetimi"}
1. Durum (Situation): ${rawSituation}
2. Görev (Task): ${rawTask}
3. Aksiyon (Action): ${rawAction}
4. Sonuç (Result / Metrics): ${rawResult}

Lütfen şu JSON formatında yapılandırılmış profesyonel bir hikaye taslağı üret:
- polishedTitle: Akılda kalıcı, güçlü bir hikaye başlığı (string)
- elevatorPitch: Mülakatçıyı ilk 30 saniyede etkileyecek kısa özet giriş (string)
- structuredStar: {
    situation: "Profesyonel dille yeniden yazılmış Situation paragrafı",
    task: "Profesyonel dille yeniden yazılmış Task paragrafı",
    action: "Adayın aldığı stratejik aksiyonlar (string)",
    result: "Ölçülebilir metrikler ve iş sonuçları ile güçlendirilmiş Result paragrafı"
  }
- keyTakeaways: Bu hikayenin mülakatçılara vereceği 3 anahtar mesaj / yetkinlik sinyali (array of strings)
- sampleSpokenScript: Adayın mülakatta bu hikayeyi akıcı bir şekilde anlatabileceği hazır konuşma metni (string)
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            polishedTitle: { type: Type.STRING },
            elevatorPitch: { type: Type.STRING },
            structuredStar: {
              type: Type.OBJECT,
              properties: {
                situation: { type: Type.STRING },
                task: { type: Type.STRING },
                action: { type: Type.STRING },
                result: { type: Type.STRING },
              },
              required: ["situation", "task", "action", "result"],
            },
            keyTakeaways: { type: Type.ARRAY, items: { type: Type.STRING } },
            sampleSpokenScript: { type: Type.STRING },
          },
          required: ["polishedTitle", "elevatorPitch", "structuredStar", "keyTakeaways", "sampleSpokenScript"],
        },
      },
    });

    const data = JSON.parse(response.text || "{}");
    res.json(data);
  } catch (error: any) {
    console.error("Generate star story error:", error);
    res.status(500).json({ error: error.message || "Başarı hikayesi oluşturulurken hata oluştu." });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const staticDir = fs.existsSync(path.join(__dirname, "dist")) ? path.join(__dirname, "dist") : __dirname;
    app.use(express.static(staticDir));
    app.get("*", (req, res) => {
      res.sendFile(path.join(staticDir, "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
