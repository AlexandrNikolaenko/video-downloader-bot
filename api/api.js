require("dotenv").config();

// ===== API-шки для сторонних сервисов =====
class API {
  constructor () {
    this.api_key = process.env.RAPIDAPI_KEY
  }

  async downloadTikTok(url) {
    try {
      const result = await fetch(
        `https://tiktok-downloader-download-tiktok-videos-without-watermark.p.rapidapi.com/rich_response/index?url=${encodeURIComponent(url)}`,
        {
          method: "GET",
          headers: {
            "x-rapidapi-key":
              "3db90c491dmshbcd9b9306cd665ap15ce25jsneeded7be80ee",
            "x-rapidapi-host":
              "tiktok-downloader-download-tiktok-videos-without-watermark.p.rapidapi.com",
          },
          signal: AbortSignal.timeout(60000),
        },
      );
      console.log(url, result.status);
      if (result.status == 200) {
        const data = await result.json();
        return data.video[0]; // mp4
      } else return new Error("api недоступно");
    } catch (err) {
      console.log(err);
      return new Error("api недоступно");
    }
  }
  
  async downloadInstagram(url) {
    try {
      const result = await fetch(
        `https://instagram-downloader-download-instagram-stories-videos4.p.rapidapi.com/convert?url=${encodeURIComponent(url)}`,
        {
          method: "GET",
          headers: {
            "x-rapidapi-key":
              "3db90c491dmshbcd9b9306cd665ap15ce25jsneeded7be80ee",
            "x-rapidapi-host":
              "instagram-downloader-download-instagram-stories-videos4.p.rapidapi.com",
          },
          signal: AbortSignal.timeout(60000),
        },
      );
      console.log(url, result.status);
      if (result.status == 200) {
        const data = await result.json();
        return data.media[0].url; // mp4
      } else return new Error("api недоступно");
    } catch (err) {
      console.log(err);
      return new Error("api недоступно");
    }
  }
  
  async downloadPinterest(url) {
    try {
      const result = await fetch(
        `https://pinterest-video-and-image-downloader.p.rapidapi.com/pinterest?url=${encodeURIComponent(url)}`,
        {
          method: "GET",
          headers: {
            "x-rapidapi-key":
              "3db90c491dmshbcd9b9306cd665ap15ce25jsneeded7be80ee",
            "x-rapidapi-host":
              "pinterest-video-and-image-downloader.p.rapidapi.com",
          },
          signal: AbortSignal.timeout(60000),
        },
      );
      console.log(url, result.status);
      if (result.status == 200) {
        const data = await result.json();
        return data.data.url; // mp4
      } else return new Error("api недоступно");
    } catch (err) {
      console.log(err);
      return new Error("api недоступно");
    }
  }
  
  async downloadYoutube(url) {
    const path = url.split("/");
    let result;
    try {
      if (path[path.length - 2] == "shorts") {
        result = await fetch(
          `https://youtube-video-fast-downloader-24-7.p.rapidapi.com/download_short/${path[path.length - 1].split("?")[0]}?quality=247`,
          {
            method: "GET",
            headers: {
              "x-rapidapi-key":
                "3db90c491dmshbcd9b9306cd665ap15ce25jsneeded7be80ee",
              "x-rapidapi-host":
                "youtube-video-fast-downloader-24-7.p.rapidapi.com",
            },
            signal: AbortSignal.timeout(60000),
          },
        );
      } else {
        const id = path[path.length - 1].split("=")[1];
        result = await fetch(
          `https://youtube-video-fast-downloader-24-7.p.rapidapi.com/download_video/${id}?quality=247`,
          {
            method: "GET",
            headers: {
              "x-rapidapi-key":
                "3db90c491dmshbcd9b9306cd665ap15ce25jsneeded7be80ee",
              "x-rapidapi-host":
                "youtube-video-fast-downloader-24-7.p.rapidapi.com",
            },
            signal: AbortSignal.timeout(60000),
          },
        );
      }
  
      console.log(url, result.status);
      if (result.status == 200) {
        const data = await result.json();
        return data.file; // mp4
      } else return new Error("api недоступно");
    } catch (err) {
      console.log(err);
      return new Error("api недоступно");
    }
  }

  static setApi() {
    return new API();
  }
}

const api = API.setApi();


module.exports = api;