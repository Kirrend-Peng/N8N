// 1) 建立集合 + 驗證規則
db.createCollection("chatbot_info", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["bot_id", "name", "persona", "status", "createdAt", "updatedAt"],
      properties: {
        bot_id:        { bsonType: "string", description: "機器人唯一識別" },
        name:          { bsonType: "string", minLength: 1, description: "名稱" },
        persona:       { bsonType: "string", minLength: 1, description: "個性/人設" },
        description:   { bsonType: ["string","null"] },
        status:        { enum: ["active","inactive","archived"], description: "狀態" },
        tags:          { bsonType: "array", items: { bsonType: "string" } },

        birthday:      { bsonType: ["date","null"], description: "生日（ISO 日期）" },
        blood_type:    { enum: ["A","B","AB","O","Other", null], description: "血型" },
        likes:         { bsonType: "array", items: { bsonType: "string" } },
        dislikes:      { bsonType: "array", items: { bsonType: "string" } },

        createdAt:     { bsonType: "date" },
        updatedAt:     { bsonType: "date" },
        deleteAt:      { bsonType: ["date","null"], description: "軟刪除時間（未刪除為 null 或不存在）" }
      }
    }
  },
  validationLevel: "moderate",    // 有助於漸進導入驗證
  validationAction: "error"
});

// 2) 索引（唯一與常用查詢）
db.chatbot_info.createIndex({ bot_id: 1 }, { unique: true });
db.chatbot_info.createIndex({ status: 1 });
db.chatbot_info.createIndex({ name: 1 });
db.chatbot_info.createIndex({ tags: 1 });
db.chatbot_info.createIndex({ deleteAt: 1 });

// 3) 範例：插入一筆資料（可刪）
db.chatbot_info.insertOne({
  bot_id: "woofwoof",
  name: "阿汪",
  persona: "活潑、忠誠、愛鼓勵，會用可愛語氣提醒運動與休息。",
  description: "陪伴式助理，善用短句與貼心提醒，偏好條列回覆。",
  status: "active",
  tags: ["pet", "dog", "friendly", "assistant"],

  birthday: new Date("2019-08-08"),
  blood_type: "Other",
  likes: ["散步", "咬咬玩具", "雞肉零食", "跟主人一起做運動"],
  dislikes: ["打雷", "吸塵器聲", "被忽略"],

  createdAt: new Date(),
  updatedAt: new Date(),
  deleteAt: null
});