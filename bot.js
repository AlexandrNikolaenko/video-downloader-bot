const { Telegraf, Markup } = require("telegraf");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const api = require('./api/api.js');
const pool = require('./api/db.js');
require("dotenv").config();

const bot = new Telegraf(process.env.token);

// ========== Команда рассылки (только админ) ==========
const ADMIN_ID = parseInt(process.env.ADMIN_ID, 10);
const DEVELOPER_ID = parseInt(process.env.DEVELOPER_ID, 10);

bot.start(async (ctx) => {
  await pool.saveUser(ctx);
  await ctx.reply(
    "👋 Привет, @" +
      ctx.from.username +
      "! \n" +
      "Я помогаю скачать видео без водяного знака и в хорошем качестве из TikTok, Instagram, YouTube Shorts и Pinterest. \n \n" +
      "<i>Присылай ссылку на ролик и через мгновение получишь видео без водяного знака.</i> \n \n" +
      "Если возникла техническая ошибка, пиши сюда — @AliBabagg. \n" +
      "<b>Исправим как можно скорее! 🔧</b> \n",
    {
      parse_mode: "HTML",
      ...Markup.inlineKeyboard([
        [Markup.button.callback('📘 Инструкция', 'how_to_use')]
      ])
    },
  );

  await ctx.reply(
    'Вы можете в любой момент открыть меню:',
    Markup.keyboard([
      ['📘 Инструкция']
    ])
    .resize() // чтобы кнопка подстроилась под экран
    .oneTime(false) // чтобы не пропадала после нажатия
  );
});

bot.hears('📘 Инструкция',  async (ctx) => {
  await pool.saveUser(ctx);
  const instruction = `📘 <b>Как пользоваться ботом:</b>

1️⃣ Найди видео в TikTok, Instagram, YouTube Shorts или Pinterest.  
2️⃣ Скопируй ссылку на видео.  
3️⃣ Отправь ссылку сюда, в чат со мной.  
4️⃣ Через несколько секунд получишь файл без водяного знака! 🎉  

❗Если видео слишком большое или не загружается — попробуй позже или напиши в поддержку.`;

  await ctx.reply(instruction, { parse_mode: 'HTML',  });
});

bot.action('how_to_use', async (ctx) => {
  await pool.saveUser(ctx);
  await ctx.answerCbQuery();

  const instruction = `📘 <b>Как пользоваться ботом:</b>

1️⃣ Найди видео в TikTok, Instagram, YouTube Shorts или Pinterest.  
2️⃣ Скопируй ссылку на видео.  
3️⃣ Отправь ссылку сюда, в чат со мной.  
4️⃣ Через несколько секунд получишь файл без водяного знака! 🎉  

❗Если видео слишком большое или не загружается — попробуй позже или напиши в поддержку.`;

  await ctx.reply(instruction, { parse_mode: 'HTML',  });
});

// Храним состояние, ждём сообщение для рассылки
let waitingForBroadcast = false;

// Команда для старта рассылки
bot.command('broadcast', async (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return;
  waitingForBroadcast = true;
  await ctx.reply('📣 Отправь сообщение, которое нужно разослать (может быть текст, фото, видео, документ, сообщение с кнопками).');
});


bot.on("text", async (ctx) => {
  await pool.saveUser(ctx);
  console.log(ctx.from.id);
  const url = ctx.message.text;
  await ctx.reply("⏳ Скачиваю видео...");
  const interval = setInterval(async () => {
    await ctx.reply("Отправляю видео...");
  }, 60000);

  let videoUrl, filePath;
  try {
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      videoUrl = await api.downloadYoutube(url);
      console.log(videoUrl);
    } else if (url.includes("tiktok")) {
      videoUrl = await api.downloadTikTok(url);
      console.log(videoUrl);
    } else if (url.includes("instagram")) {
      videoUrl = await api.downloadInstagram(url);
      console.log(videoUrl);
    } else if (url.includes("pinterest") || url.includes("pin.it")) {
      videoUrl = await api.downloadPinterest(url);
      console.log(videoUrl);
    } else {
      return ctx.reply(
        "❌ Поддерживаются только YouTube, TikTok, Instagram и Pinterest.",
      );
    }

    if (videoUrl) {
      filePath = path.resolve(
        __dirname,
        `video/video_${Date.now()}_${ctx.from.id}.mp4`,
      );
      const writer = fs.createWriteStream(filePath);
      const response = await axios({
        url: videoUrl,
        method: "GET",
        responseType: "stream",
      });
      response.data.pipe(writer);

      writer.on("finish", async () => {
        try {
          await ctx.replyWithDocument(
            { source: filePath },
            {
              caption: `Видео скачано с помощью @${ctx.botInfo.username || "my_bot"} 😍`,
            },
          );
        } catch (err) {
          await ctx.reply(
            "Это видео слишком большое, попробуйте еще раз или скачайте видео по этой ссылке " +
              videoUrl,
          );
        }
        clearInterval(interval);
        if (filePath) {
          fs.unlink(filePath, () => {});
        }
      });
      writer.on("error", (err) => new Error(err));
    } else {
      return await ctx.reply("❌ Видео по данной ссылке не найдено");
    }
  } catch (err) {
    console.log(err);
    await ctx.reply("⚠️ Ошибка при скачивании видео.");
    if (filePath) {
      fs.unlink(filePath, () => {});
    }
  } finally {
    clearInterval(interval);
  }
});

// При получении любого сообщения проверяем, ждёт ли админ рассылку
bot.on('message', async (ctx) => {
  if ((ctx.from.id == ADMIN_ID || ctx.from.id == DEVELOPER_ID) && waitingForBroadcast) {
    waitingForBroadcast = false;

    broadcastInBackground(ctx);
  }
});

async function broadcastInBackground(ctx) {
  try {
    const [chats] = await pool.getAllChats();
    let sent = 0, removed = 0, failed = 0;

    // не блокируем event loop
    setImmediate(async () => {
      for (const chat of chats) {
        try {
          await ctx.telegram.copyMessage(
            chat.chat_id,
            ctx.chat.id,
            ctx.message.message_id
          );
          sent++;
        } catch (err) {
          if (err.response?.error_code === 403) {
            removed++;
            await pool.deleteChat(chat.chat_id);
          } else {
            failed++;
          }
        }

        // немного спим, чтобы избежать flood limit
        await new Promise(r => setTimeout(r, 100));
      }

      await ctx.telegram.sendMessage(
        ctx.chat.id,
        `✅ Рассылка завершена.\n\n📨 Успешно: ${sent}\n🚫 Удалено: ${removed}\n⚠️ Ошибок: ${failed}`
      );
    });
  } catch (err) {
    console.error("Ошибка при рассылке:", err);
    await ctx.reply("⚠️ Ошибка при запуске рассылки.");
  }
}

bot.launch().catch(() => waitingForBroadcast = false);
