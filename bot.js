const { Telegraf } = require('telegraf');
const axios = require('axios');
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const pTimeout = require('p-timeout');
const play = require('play-dl');

const bot = new Telegraf(process.env.token);

// ===== API-шки для сторонних сервисов =====
async function downloadTikTok(url) {
  const result = await fetch(`https://tiktok-video-downloader-api.p.rapidapi.com/media?videoUrl=${encodeURIComponent(url)}`, {
    method: 'GET',
    headers: {
      'x-rapidapi-key': '3db90c491dmshbcd9b9306cd665ap15ce25jsneeded7be80ee',
      'x-rapidapi-host': 'tiktok-video-downloader-api.p.rapidapi.com',
    },
  });
  const data = (await result.json());
  return data.downloadUrl; // mp4
}

async function downloadInstagram(url) {
  const result = await fetch(`https://instagram-reels-downloader-api.p.rapidapi.com/download?url=${encodeURIComponent(url)}`, {
    method: 'GET',
    headers: {
      'x-rapidapi-key': '3db90c491dmshbcd9b9306cd665ap15ce25jsneeded7be80ee',
      'x-rapidapi-host': 'instagram-reels-downloader-api.p.rapidapi.com',
    },
  });
  const data = (await result.json());
  return data.data.medias[0].url; // mp4
}

async function downloadPinterest(url) {
  const result = await fetch(`https://pinterest-video-and-image-downloader.p.rapidapi.com/pinterest?url=${encodeURIComponent(url)}`, {
    method: 'GET',
    headers: {
      'x-rapidapi-key': '3db90c491dmshbcd9b9306cd665ap15ce25jsneeded7be80ee',
      'x-rapidapi-host': 'pinterest-video-and-image-downloader.p.rapidapi.com',
    },
  });
  const data = (await result.json());
  return data.data.url; // mp4
}

async function downloadYoutube (url) {
  const path = url.split('/');
  let result;
  if (path[path.length - 2] == 'shorts') {
    result = await fetch(`https://youtube-video-fast-downloader-24-7.p.rapidapi.com/download_short/${path[path.length - 1].split("?")[0]}?quality=247`, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': '3db90c491dmshbcd9b9306cd665ap15ce25jsneeded7be80ee',
        'x-rapidapi-host': 'youtube-video-fast-downloader-24-7.p.rapidapi.com',
      },
    });
  } else {
    const id = path[path.length - 1].split('=')[1];
    result = await fetch(`https://youtube-video-fast-downloader-24-7.p.rapidapi.com/download_video/${id}?quality=247`, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': '3db90c491dmshbcd9b9306cd665ap15ce25jsneeded7be80ee',
        'x-rapidapi-host': 'youtube-video-fast-downloader-24-7.p.rapidapi.com',
      },
    });
  }
  
  const data = (await result.json());
  return data.file; // mp4
}

bot.start((ctx) => ctx.reply(
  '👋 Привет, ' + ctx.from.first_name + '! Я помогу тебе скачать видео.\n\n' +
    'Отправь мне ссылку на ролик с:\n' +
    '▶️ YouTube\n' +
    '🎵 TikTok\n' +
    '📸 Instagram\n' +
    '📌 Pinterest\n\n' +
    'Я подготовлю файл и пришлю его прямо сюда. 🚀'
  ));

bot.on('text', async (ctx) => {
  const url = ctx.message.text;
  await ctx.reply('⏳ Скачиваю видео...');
  const interval = setInterval(() => {
    ctx.reply('Отправляю видео...')
  }, 60000)

  let videoUrl, filePath;
  try {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      videoUrl = await downloadYoutube(url);
    } else if (url.includes('tiktok')) {
      videoUrl = await downloadTikTok(url);
    } else if (url.includes('instagram')) {
      videoUrl = await downloadInstagram(url);
    } else if (url.includes('pinterest') || url.includes('pin.it')) {
      videoUrl = await downloadPinterest(url);
    } else {
      return ctx.reply('❌ Поддерживаются только YouTube, TikTok, Instagram и Pinterest.');
    }

    if (videoUrl) {
      filePath = path.resolve(__dirname, `video/video_${Date.now()}_${ctx.from.id}.mp4`);
      const writer = fs.createWriteStream(filePath);
      const response = await axios({ url: videoUrl, method: 'GET', responseType: 'stream' });
      response.data.pipe(writer);

      writer.on('finish', async () => {
        await ctx.replyWithDocument({ source: filePath });
        // await ctx.replyWithVideo({ source: filePath });
        clearInterval(interval);
        if (filePath) {
          fs.unlink(filePath, () => {});
        }
      })
      writer.on('error', (err) => new Error(err))
    }
  } catch (err) {
    console.log(err.message.code);
    ctx.reply('⚠️ Ошибка при скачивании видео.');
    clearInterval(interval);
    if (filePath) {
      fs.unlink(filePath, () => {});
    }
  }
});

bot.launch();
