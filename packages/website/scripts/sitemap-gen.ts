import path from 'node:path'
import { SitemapStream } from "sitemap";
import fs from "fs-extra";

const desc = path.resolve(__dirname, "../dist");

export function createSitemapGener() {
  let smStream: SitemapStream

  function getSmStream() {
    if (smStream) {
      return smStream;
    }
    
    smStream = new SitemapStream({
        hostname: "https://www.reactuse.com",
    });
    fs.ensureDirSync(desc);
    const writeStream = fs.createWriteStream(`${desc}/sitemap.xml`);
    smStream.pipe(writeStream);
    return smStream;
  }
  
  return {
    add: (route: string) => {
      route = route[0] === '/' ? route : `/${route}`;
      getSmStream().write({ url: route });
    },
    end: () => smStream.end()
  }
}