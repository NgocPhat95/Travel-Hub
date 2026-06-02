import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SearchService } from '../search/search.service';

interface ItineraryActivity {
  placeName: string;
  category: 'HOTEL' | 'RESTAURANT' | 'ATTRACTION';
  time: string;
  note: string;
  placeId?: string;
}

interface ItineraryDay {
  dayNumber: number;
  activities: ItineraryActivity[];
}

interface ItineraryResponse {
  title: string;
  description: string;
  days: ItineraryDay[];
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly geminiApiKey = process.env.GEMINI_API_KEY || '';
  private readonly geminiModel = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

  constructor(
    private readonly prisma: PrismaService,
    private readonly searchService: SearchService,
  ) {}

  /**
   * Helper function to execute asynchronous tasks with Exponential Backoff
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    retries = 5,
    delayMs = 1000,
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retries <= 1) {
        this.logger.error('Failed all retries for AI API request.');
        throw error;
      }
      this.logger.warn(
        `AI API request failed. Retrying in ${delayMs}ms. Retries left: ${retries - 1}. Error: ${error.message || error}`,
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return this.retryWithBackoff(fn, retries - 1, delayMs * 2);
    }
  }

  /**
   * AI Chatbot Concierge
   */
  async chat(message: string, chatHistory: { role: 'user' | 'model'; parts: string }[]): Promise<string> {
    if (!this.geminiApiKey) {
      this.logger.warn('GEMINI_API_KEY not configured. Using Mock Chat response.');
      return this.getMockChatResponse(message);
    }

    const systemInstruction = 
      'Bạn là trợ lý ảo AI Concierge của Travel Hub - hệ thống gợi ý du lịch và bản đồ thông minh. ' +
      'Nhiệm vụ của bạn là tư vấn du lịch, gợi ý khách sạn, nhà hàng, điểm tham quan và lên lịch trình ngắn gọn. ' +
      'Hãy trả lời bằng tiếng Việt lịch sự, thân thiện, súc tích và hữu ích.';

    const formattedContents = [
      ...chatHistory.map((h) => ({
        role: h.role,
        parts: [{ text: h.parts }],
      })),
      {
        role: 'user',
        parts: [{ text: message }],
      },
    ];

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.geminiModel}:generateContent?key=${this.geminiApiKey}`;

    try {
      const responseText = await this.retryWithBackoff(async () => {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: formattedContents,
            systemInstruction: {
              parts: [{ text: systemInstruction }],
            },
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1000,
            },
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Gemini API Error (HTTP ${res.status}): ${errText}`);
        }

        const data = await res.json() as any;
        if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
          throw new Error('Invalid response structure from Gemini API');
        }
        return data.candidates[0].content.parts[0].text as string;
      });

      return responseText;
    } catch (e) {
      this.logger.error(`Failed to get AI Chat response: ${e.message}. Falling back to mock response.`);
      return this.getMockChatResponse(message);
    }
  }

  /**
   * AI Itinerary Generator with Post-Processing place mapping and Postgres saving
   */
  async generateItinerary(
    userId: string,
    destination: string,
    days: number,
    budget: string,
    companions: string,
  ): Promise<any> {
    destination = destination || '';
    let itinerary: ItineraryResponse;

    if (!this.geminiApiKey) {
      this.logger.warn('GEMINI_API_KEY not configured. Using Smart Mock Itinerary Generator.');
      itinerary = await this.generateMockItinerary(destination, days, budget, companions);
    } else {
      const prompt = 
        `Hãy lập lịch trình chi tiết đi du lịch tại ${destination} trong ${days} ngày. ` +
        `Ngân sách: ${budget}. Bạn đồng hành: ${companions}. ` +
        `Yêu cầu lập kế hoạch phân bổ hợp lý các địa điểm tham quan (ATTRACTION), nhà hàng (RESTAURANT), và khách sạn (HOTEL). ` +
        `Bạn bắt buộc phải trả về dữ liệu định dạng JSON theo đúng cấu trúc sau:\n` +
        `{\n` +
        `  "title": "Tên lịch trình du lịch (ví dụ: Khám phá Đà Nẵng 3 ngày 2 đêm)",\n` +
        `  "description": "Mô tả tổng quan về chuyến đi này",\n` +
        `  "days": [\n` +
        `    {\n` +
        `      "dayNumber": 1,\n` +
        `      "activities": [\n` +
        `        {\n` +
        `          "placeName": "Tên của địa điểm du lịch cụ thể (ví dụ: Chùa Linh Ứng)",\n` +
        `          "category": "HOTEL hoặc RESTAURANT hoặc ATTRACTION",\n` +
        `          "time": "Thời gian hoạt động (ví dụ: 08:30)",\n` +
        `          "note": "Ghi chú hoạt động cụ thể (ví dụ: Tham quan ngắm cảnh biển và tượng Phật Bà)"\n` +
        `        }\n` +
        `      ]\n` +
        `    }\n` +
        `  ]\n` +
        `}`;

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.geminiModel}:generateContent?key=${this.geminiApiKey}`;

      try {
        const responseJsonString = await this.retryWithBackoff(async () => {
          const res = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.5,
              },
            }),
          });

          if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Gemini API Error (HTTP ${res.status}): ${errText}`);
          }

          const data = await res.json() as any;
          if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
            throw new Error('Invalid response structure from Gemini API');
          }
          return data.candidates[0].content.parts[0].text as string;
        });

        itinerary = this.parseAndCleanJson(responseJsonString);
      } catch (e) {
        this.logger.error(`Error generating itinerary via Gemini: ${e.message}. Falling back to Smart Mock.`);
        itinerary = await this.generateMockItinerary(destination, days, budget, companions);
      }
    }

    // Post-Processing: Map place names to real Place records in DB and find Place_IDs
    const processedItinerary = await this.postProcessItinerary(itinerary, destination);

    // Save Itinerary directly to DB (Trips & TripItems tables)
    const trip = await this.saveItineraryToDatabase(userId, processedItinerary, days);

    return {
      tripId: trip.id,
      title: trip.title,
      description: trip.description,
      startDate: trip.startDate,
      endDate: trip.endDate,
      days: processedItinerary.days,
    };
  }

  /**
   * Helper function to extract and parse JSON safely
   */
  private parseAndCleanJson(rawString: string): ItineraryResponse {
    let cleanString = rawString.trim();
    
    // Remove markdown code blocks if present
    if (cleanString.startsWith('```')) {
      const firstLineBreak = cleanString.indexOf('\n');
      const lastCodeBlock = cleanString.lastIndexOf('```');
      if (firstLineBreak !== -1 && lastCodeBlock !== -1 && lastCodeBlock > firstLineBreak) {
        cleanString = cleanString.substring(firstLineBreak + 1, lastCodeBlock).trim();
      }
    }

    try {
      return JSON.parse(cleanString) as ItineraryResponse;
    } catch (e) {
      this.logger.error(`JSON Parse failure: ${e.message}. Attempting regex recovery.`);
      
      // Regex recovery: try to extract matching outer curly braces
      const match = cleanString.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          return JSON.parse(match[0]) as ItineraryResponse;
        } catch (innerError) {
          this.logger.error(`Regex JSON recovery failed: ${innerError.message}`);
        }
      }
      throw new Error(`Failed to parse LLM response as JSON: ${rawString}`);
    }
  }

  /**
   * Post-Processing: Map place names to actual Place_IDs
   */
  private async postProcessItinerary(
    itinerary: ItineraryResponse,
    destination: string,
  ): Promise<ItineraryResponse> {
    const updatedDays: ItineraryDay[] = [];

    for (const day of itinerary.days) {
      const updatedActivities: ItineraryActivity[] = [];
      for (const act of day.activities) {
        let placeId = '';
        let mappedName = act.placeName;

        // Ensure category matches expected Place schema enum/category strings
        const categoryUpper = (act.category || 'ATTRACTION').toUpperCase() as 'HOTEL' | 'RESTAURANT' | 'ATTRACTION';
        const searchCategory = ['HOTEL', 'RESTAURANT', 'ATTRACTION'].includes(categoryUpper)
          ? categoryUpper
          : 'ATTRACTION';

        try {
          // 1. Elasticsearch autocomplete matching
          const esHits = await this.searchService.autocomplete(act.placeName, searchCategory);
          let esVerified = false;
          if (esHits && esHits.length > 0) {
            const potentialId = esHits[0].id;
            const dbVerified = await this.prisma.place.findUnique({
              where: { id: potentialId },
            });
            if (dbVerified) {
              placeId = dbVerified.id;
              mappedName = dbVerified.name;
              esVerified = true;
              this.logger.log(`Mapped via ES (Verified): "${act.placeName}" -> "${mappedName}" (${placeId})`);
            }
          }
          
          if (!esVerified) {
            // 2. Direct Prisma fuzzy search fallback
            const dbMatch = await this.prisma.place.findFirst({
              where: {
                name: {
                  contains: act.placeName,
                  mode: 'insensitive',
                },
                category: searchCategory,
              },
            });

            if (dbMatch) {
              placeId = dbMatch.id;
              mappedName = dbMatch.name;
              this.logger.log(`Mapped via Prisma Fuzzy: "${act.placeName}" -> "${mappedName}" (${placeId})`);
            } else {
              // 3. Fallback to a place of the same category in the destination
              const destMatch = await this.prisma.place.findFirst({
                where: {
                  category: searchCategory,
                  OR: [
                    { address: { contains: destination, mode: 'insensitive' } },
                    { name: { contains: destination, mode: 'insensitive' } },
                  ],
                },
              });

              if (destMatch) {
                placeId = destMatch.id;
                mappedName = destMatch.name;
                this.logger.log(`Mapped via Destination Category match: "${act.placeName}" -> "${mappedName}" (${placeId})`);
              } else {
                // 4. Default global category match fallback
                const globalMatch = await this.prisma.place.findFirst({
                  where: { category: searchCategory },
                });

                if (globalMatch) {
                  placeId = globalMatch.id;
                  mappedName = globalMatch.name;
                  this.logger.log(`Mapped via Global Category match: "${act.placeName}" -> "${mappedName}" (${placeId})`);
                } else {
                  // 5. Ultimate backup - any place in DB
                  const ultimateMatch = await this.prisma.place.findFirst();
                  if (ultimateMatch) {
                    placeId = ultimateMatch.id;
                    mappedName = ultimateMatch.name;
                    this.logger.log(`Mapped via Ultimate backup: "${act.placeName}" -> "${mappedName}" (${placeId})`);
                  }
                }
              }
            }
          }
        } catch (err) {
          this.logger.error(`Error querying mapping for ${act.placeName}: ${err.message}`);
          // Fallback to any place in DB on error to satisfy FK constraint
          const ultimateMatch = await this.prisma.place.findFirst();
          if (ultimateMatch) {
            placeId = ultimateMatch.id;
            mappedName = ultimateMatch.name;
          }
        }

        updatedActivities.push({
          ...act,
          placeName: mappedName,
          category: searchCategory,
          placeId,
        });
      }

      updatedDays.push({
        dayNumber: day.dayNumber,
        activities: updatedActivities,
      });
    }

    return {
      ...itinerary,
      days: updatedDays,
    };
  }

  /**
   * Save itinerary to Trips and TripItems tables
   */
  private async saveItineraryToDatabase(
    userId: string,
    itinerary: ItineraryResponse,
    days: number,
  ) {
    const startDate = new Date(); // starts today
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + days - 1);

    // 1. Create Trip
    const trip = await this.prisma.trip.create({
      data: {
        title: itinerary.title || `Hành trình du lịch ${days} ngày`,
        description: itinerary.description || `Lịch trình khám phá tự động sinh bởi AI`,
        startDate,
        endDate,
        ownerId: userId,
      },
    });

    // 2. Create TripItems in order
    const tripItemsData: any[] = [];
    for (const day of itinerary.days) {
      let order = 0;
      for (const act of day.activities) {
        if (act.placeId) {
          tripItemsData.push({
            tripId: trip.id,
            placeId: act.placeId,
            dayNumber: day.dayNumber,
            sequenceOrder: order++,
            note: `[${act.time}] ${act.note || ''}`,
          });
        }
      }
    }

    if (tripItemsData.length > 0) {
      await this.prisma.tripItem.createMany({
        data: tripItemsData,
      });
    }

    return trip;
  }

  /**
   * Smart Fallback Mock Itinerary Generator using real DB places
   */
  private async generateMockItinerary(
    destination: string,
    days: number,
    budget: string,
    companions: string,
  ): Promise<ItineraryResponse> {
    this.logger.log(`Generating smart mock itinerary for destination: ${destination}`);
    
    // Fetch places in the system
    const dbPlaces = await this.prisma.place.findMany({
      where: { status: 'ACTIVE' },
    });

    // Group places by category
    const hotels = dbPlaces.filter((p) => p.category === 'HOTEL');
    const restaurants = dbPlaces.filter((p) => p.category === 'RESTAURANT');
    const attractions = dbPlaces.filter((p) => p.category === 'ATTRACTION');

    const destLower = destination.toLowerCase();
    
    // Filter places in destination if possible
    const filterByDest = (list: any[]) => {
      const match = list.filter((p) => 
        p.address.toLowerCase().includes(destLower) || 
        p.name.toLowerCase().includes(destLower)
      );
      return match.length > 0 ? match : list;
    };

    const destHotels = filterByDest(hotels);
    const destRestaurants = filterByDest(restaurants);
    const destAttractions = filterByDest(attractions);

    const selectRandom = (list: any[], fallbackList: any[]) => {
      const source = list.length > 0 ? list : fallbackList;
      if (source.length === 0) return { name: 'Điểm tham quan hấp dẫn', id: '' };
      return source[Math.floor(Math.random() * source.length)];
    };

    const daysList: ItineraryDay[] = [];
    
    // Select one hotel for the whole trip
    const selectedHotel = selectRandom(destHotels, hotels);

    for (let d = 1; d <= days; d++) {
      const activities: ItineraryActivity[] = [];

      // Day 1 check-in hotel
      if (d === 1 && selectedHotel.name) {
        activities.push({
          placeName: selectedHotel.name,
          category: 'HOTEL',
          time: '08:00',
          note: `Nhận phòng tại ${selectedHotel.name} và chuẩn bị đồ đạc.`,
        });
      }

      // Morning attraction
      const morningAtt = selectRandom(destAttractions, attractions);
      activities.push({
        placeName: morningAtt.name,
        category: 'ATTRACTION',
        time: '09:00',
        note: `Khám phá ${morningAtt.name}, chụp hình lưu niệm.`,
      });

      // Lunch restaurant
      const lunchRes = selectRandom(destRestaurants, restaurants);
      activities.push({
        placeName: lunchRes.name,
        category: 'RESTAURANT',
        time: '12:00',
        note: `Ăn trưa tại ${lunchRes.name}, thưởng thức đặc sản ẩm thực địa phương.`,
      });

      // Afternoon attraction
      const afternoonAtt = selectRandom(destAttractions, attractions);
      // Make sure afternoon attraction is different from morning
      const finalAfternoonAtt = afternoonAtt.name === morningAtt.name && destAttractions.length > 1 
        ? destAttractions.find((p) => p.name !== morningAtt.name) || afternoonAtt
        : afternoonAtt;

      activities.push({
        placeName: finalAfternoonAtt.name,
        category: 'ATTRACTION',
        time: '14:30',
        note: `Tham quan ${finalAfternoonAtt.name}, tìm hiểu văn hóa địa phương.`,
      });

      // Dinner restaurant
      const dinnerRes = selectRandom(destRestaurants, restaurants);
      const finalDinnerRes = dinnerRes.name === lunchRes.name && destRestaurants.length > 1 
        ? destRestaurants.find((p) => p.name !== lunchRes.name) || dinnerRes
        : dinnerRes;

      activities.push({
        placeName: finalDinnerRes.name,
        category: 'RESTAURANT',
        time: '19:00',
        note: `Ăn tối lãng mạn/ấm cúng tại ${finalDinnerRes.name} cùng ${companions.toLowerCase()}.`,
      });

      daysList.push({
        dayNumber: d,
        activities,
      });
    }

    return {
      title: `Hành trình khám phá ${destination} ${days} Ngày ${days - 1 > 0 ? `${days - 1} Đêm` : ''}`,
      description: `Lịch trình được thiết kế tối ưu cho ${companions.toLowerCase()} với mức ngân sách ${budget.toLowerCase()} tại ${destination}.`,
      days: daysList,
    };
  }

  /**
   * Mock Chat Responses for Concierge Chatbot
   */
  private getMockChatResponse(message: string): string {
    const msgLower = message.toLowerCase();
    
    if (msgLower.includes('chào') || msgLower.includes('hello') || msgLower.includes('hi')) {
      return 'Xin chào! Tôi là trợ lý ảo AI Concierge của Travel Hub. Tôi có thể giúp gì cho bạn trong việc lên kế hoạch du lịch hôm nay?';
    }
    
    if (msgLower.includes('đà nẵng')) {
      return 'Đà Nẵng là điểm đến tuyệt vời! Bạn có thể ghé thăm Cầu Vàng (Bà Nà Hills), Bán đảo Sơn Trà (Chùa Linh Ứng), và thưởng thức mì Quảng hoặc hải sản tươi sống bên bờ biển Mỹ Khê. Bạn có muốn tôi thiết kế lịch trình tại đây không? Hãy bấm vào tính năng AI Planner ở thanh công cụ phía trên nhé!';
    }

    if (msgLower.includes('ăn') || msgLower.includes('nhà hàng') || msgLower.includes('ngon')) {
      return 'Tại Travel Hub, chúng tôi có danh sách các nhà hàng địa phương rất được ưa chuộng. Bạn có thể sử dụng bộ lọc "Nhà hàng" trên Bản đồ du lịch để tìm những nơi phục vụ đặc sản gần vị trí của bạn nhất!';
    }

    if (msgLower.includes('khách sạn') || msgLower.includes('ở đâu') || msgLower.includes('nghỉ')) {
      return 'Để tìm nơi lưu trú lý tưởng, bạn có thể lọc danh mục "Khách sạn" trong hệ thống của chúng tôi. Chúng tôi liên kết với Agoda, Booking.com để hiển thị so sánh giá tốt nhất cho bạn.';
    }

    return 'Tôi hiểu câu hỏi của bạn. Để được hỗ trợ lập kế hoạch chi tiết hơn, bạn hãy sử dụng chức năng "AI Planner" trên thanh Navbar. Hoặc bạn có thể tìm kiếm địa điểm cụ thể bằng thanh tìm kiếm ở trang chủ!';
  }
}
