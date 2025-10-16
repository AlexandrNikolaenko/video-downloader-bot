const { Telegraf } = require('telegraf');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const bot = new Telegraf(process.env.token);

// ===== API-шки для сторонних сервисов =====
async function downloadTikTok(url) {
  try {
    const result = await fetch(`https://tiktok-downloader-download-tiktok-videos-without-watermark.p.rapidapi.com/rich_response/index?url=${encodeURIComponent(url)}`, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': '3db90c491dmshbcd9b9306cd665ap15ce25jsneeded7be80ee',
        'x-rapidapi-host': 'tiktok-downloader-download-tiktok-videos-without-watermark.p.rapidapi.com',
      },
      signal: AbortSignal.timeout(60000),
    });
    console.log(url, result.status);
    if (result.status == 200) {
      const data = (await result.json());
      return data.video[0]; // mp4
    } else return new Error('api недоступно')
  } catch(err) {
    console.log(err);
    return new Error('api недоступно');
  }
}

async function downloadInstagram(url) {
  try {
    const result = await fetch(`https://instagram-downloader-download-instagram-stories-videos4.p.rapidapi.com/convert?url=${encodeURIComponent(url)}`, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': '3db90c491dmshbcd9b9306cd665ap15ce25jsneeded7be80ee',
        'x-rapidapi-host': 'instagram-downloader-download-instagram-stories-videos4.p.rapidapi.com',
      },
      signal: AbortSignal.timeout(60000),
    });
    console.log(url, result.status);
    if (result.status == 200) {
      const data = (await result.json());
      return data.media[0].url; // mp4
    } else return new Error('api недоступно')
  } catch(err) {
    console.log(err);
    return new Error('api недоступно')
  }
}

async function downloadPinterest(url) {
  try {
    const result = await fetch(`https://pinterest-video-and-image-downloader.p.rapidapi.com/pinterest?url=${encodeURIComponent(url)}`, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': '3db90c491dmshbcd9b9306cd665ap15ce25jsneeded7be80ee',
        'x-rapidapi-host': 'pinterest-video-and-image-downloader.p.rapidapi.com',
      },
      signal: AbortSignal.timeout(60000),
    });
    console.log(url, result.status);
    if (result.status == 200) {
      const data = (await result.json());
      return data.data.url; // mp4
    } else return new Error('api недоступно')
  } catch(err) {
    console.log(err);
    return new Error('api недоступно')
  }
}

async function downloadYoutube (url) {
  const path = url.split('/');
  let result;
  try {
    if (path[path.length - 2] == 'shorts') {
      result = await fetch(`https://youtube-video-fast-downloader-24-7.p.rapidapi.com/download_short/${path[path.length - 1].split("?")[0]}?quality=247`, {
        method: 'GET',
        headers: {
          'x-rapidapi-key': '3db90c491dmshbcd9b9306cd665ap15ce25jsneeded7be80ee',
          'x-rapidapi-host': 'youtube-video-fast-downloader-24-7.p.rapidapi.com',
        },
        signal: AbortSignal.timeout(60000),
      });
    } else {
      const id = path[path.length - 1].split('=')[1];
      result = await fetch(`https://youtube-video-fast-downloader-24-7.p.rapidapi.com/download_video/${id}?quality=247`, {
        method: 'GET',
        headers: {
          'x-rapidapi-key': '3db90c491dmshbcd9b9306cd665ap15ce25jsneeded7be80ee',
          'x-rapidapi-host': 'youtube-video-fast-downloader-24-7.p.rapidapi.com',
        },
        signal: AbortSignal.timeout(60000),
      });
    }
  
    console.log(url, result.status);
    if (result.status == 200) {
      const data = (await result.json());
      return data.file; // mp4
    } else return new Error('api недоступно');
  } catch(err) {
    console.log(err);
    return new Error('api недоступно');
  }

}

bot.start((ctx) => ctx.reply(
  'Привет, @' + ctx.from.username + '! \n' +
'Я помогаю скачать видео без водяного знака и в хорошем качестве из TikTok, Instagram, YouTube Shorts и Pinterest. \n \n' +

'<i>Присылай ссылку на ролик и через мгновение получишь видео без водяного знака.</i> \n \n'+

'Если возникла техническая ошибка, пиши сюда — @AliBabagg. \n'+
'<b>Исправим как можно скорее!</b> \n', {
  parse_mode: 'HTML'
}
  ));

bot.on('text', async (ctx) => {
  const url = ctx.message.text;
  await ctx.reply('⏳ Скачиваю видео...');
  const interval = setInterval(async () => {
    await ctx.reply('Отправляю видео...')
  }, 60000)

  let videoUrl, filePath;
  try {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      videoUrl = await downloadYoutube(url);
      console.log(videoUrl);
    } else if (url.includes('tiktok')) {
      videoUrl = await downloadTikTok(url);
      console.log(videoUrl);
    } else if (url.includes('instagram')) {
      videoUrl = await downloadInstagram(url);
      console.log(videoUrl);
    } else if (url.includes('pinterest') || url.includes('pin.it')) {
      videoUrl = await downloadPinterest(url);
      console.log(videoUrl);
    } else {
      return ctx.reply('❌ Поддерживаются только YouTube, TikTok, Instagram и Pinterest.');
    }

    if (videoUrl) {
      filePath = path.resolve(__dirname, `video/video_${Date.now()}_${ctx.from.id}.mp4`);
      const writer = fs.createWriteStream(filePath);
      const response = await axios({ url: videoUrl, method: 'GET', responseType: 'stream' });
      response.data.pipe(writer);

      writer.on('finish', async () => {
        try {
          await ctx.replyWithDocument({ source: filePath }, { caption: `Видео скачано с помощью @${ctx.botInfo.username || 'my_bot'} 😍` });
        } catch (err) {
          await ctx.reply('Это видео слишком большое, попробуйте еще раз или скачайте видео по этой ссылке ' + videoUrl);
        }
        clearInterval(interval);
        if (filePath) {
          fs.unlink(filePath, () => {});
        }
      })
      writer.on('error', (err) => new Error(err))
    } else {
      return await ctx.reply('❌ Видео по данной ссылке не найдено')
    }
  } catch (err) {
    console.log(err);
    await ctx.reply('⚠️ Ошибка при скачивании видео.');
    if (filePath) {
      fs.unlink(filePath, () => {});
    }
  } finally {
    clearInterval(interval);
  }
});

bot.launch();
