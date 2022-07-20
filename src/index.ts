import fs from "fs";
import jimp from "jimp";
import chalk from "chalk";
import tesseract from "node-tesseract-ocr";
import { resolve } from "path";
import { modifyMap } from "./modify";

const WIDTH = 709;
const HEIGHT = 1064;
const C_WIDTH = 622;
const C_HEIGHT = 949;

const files = fs.readdirSync("data");
const ml = files.slice(30, 462);
// const en = files.slice(462, 528);
const split_data = fs.readdirSync("split_data");
// for generating eng data separately
const en = split_data.slice(
  split_data.indexOf("page-463-left.png"),
  split_data.indexOf("page-529-left.png"),
);
const hn = files.slice(528, 545);
const kn = files.slice(545, 550);
const tm = files.slice(550, 556);

async function initialCrop(files: string[]) {
  fs.mkdirSync("cropped_data", { recursive: true });
  for (const file of files) {
    const pre = resolve("data", file);
    const page = await jimp.read(`data/${file}`);
    page.crop(50, 65, WIDTH - 87, HEIGHT - 115).write(`cropped_data/${file}`);
    console.log(`${chalk.yellow("Crop")} ${pre}`);
  }
}

async function splitPage(files: string[]) {
  fs.mkdirSync("split_data", { recursive: true });
  for (const file of files) {
    const pre = `split_data/${file.split(".")[0]}`;
    const left = await jimp.read(`cropped_data/${file}`);
    left.crop(0, 0, 311, 949).write(`${pre}-left.png`);
    const right = await jimp.read(`cropped_data/${file}`);
    right.crop(310, 0, 312, 949).write(`${pre}-right.png`);
    console.log(`${chalk.blue("Split")} cropped_data/${file}`);
  }
}

async function ocr(files: string[]) {
  fs.mkdirSync("written_data", { recursive: true });
  for (const file of files) {
    const f = file.split(".")[0].split("-");
    const pre = `${resolve("written_data")}/${
      f[1] + f[2][0].toUpperCase()
    }.txt`;
    const pg = parseInt(file.match(/\d+/g)?.[0]!);
    const text = await tesseract.recognize(
      `split_data/${file}`,
      { lang: pg > 462 && pg < 529 ? "eng" : "mal" },
    );
    fs.writeFileSync(pre, text);
    console.log(`${chalk.green("Read")} ${pre}`);
  }
}

const REPLACE_NO = new Map([
  ["032L.txt", "41 4"],
  ["530L.txt", "41 4"],
  ["552L.txt", "41 4"],
  ["047R.txt", "30 50"],
  ["048R.txt", "32 52"],
  // ["049R.txt", "5 55"],
  ["238L.txt", "693 603"],
  ["461L.txt", "1297 1257"],
  ["502R.txt", "\n17 \n117"],
  ["496R.txt", "20 90"],
  ["489R.txt", "\ni \n71"],
  ["551L.txt", "2\n, 2\n\n"],
]);

function modify() {
  const files = Array.from(modifyMap.keys());
  for (const file of files) {
    const exdata = fs.readFileSync(`written_data/${file}`).toString();
    const data = modifyMap.get(file)!;
    if (exdata === data) continue;
    fs.writeFileSync(`written_data/${file}`, data);
    console.log(`${chalk.green("Modify")} written_data/${file}`);
  }

  const rfiles = Array.from(REPLACE_NO.keys());
  for (const file of rfiles) {
    const data = fs.readFileSync(`written_data/${file}`).toString();
    const get = REPLACE_NO.get(file)!;
    const actual = get.split(" ")[0];
    const shouldbe = `${get.split(" ")[1]}\n`;
    const index = data.search(actual);
    if (index === -1) continue;
    const arr = data.split("");
    arr.splice(index, actual.length, shouldbe);
    const newdata = arr.join("");
    fs.writeFileSync(`written_data/${file}`, newdata);
    console.log(`${chalk.cyan("Replace")} written_data/${file}`);
  }

  const wfiles = fs.readdirSync("written_data");
  for (let i = 0; i < wfiles.length; i++) {
    const file = wfiles[i];
    if (NO_SONG_NUMBERS.includes(file)) continue;
    const text = fs.readFileSync(`written_data/${file}`).toString();
    const match = text.match(SONG_NO_REGEX)!;
    if (!match) {
      console.log(file);
      continue;
    }

    let newtext = text;

    match.map((v) => {
      const line = v.split("\n")[0].trim();
      const newNo = parseInt(line.split(" ")[0]);
      const kek = line.split(" ")[1]?.match(/(\d+)/)?.[0];
      const old = kek ? parseInt(kek) : undefined;
      newtext = newtext.replace(line, `${newNo}${old ? ` (${old})` : ""}`);
    });

    if (newtext === text) continue;
    fs.writeFileSync(`written_data/${file}`, newtext);
    console.log(`${chalk.cyan("Clean")} written_data/${file}`);
  }
}

async function main() {
  const files = fs.readdirSync("data").slice(30, 556);
  await initialCrop(files);
  const cfiles = fs.readdirSync("cropped_data");
  await splitPage(cfiles);
  const sfiles = fs.readdirSync("split_data");
  await ocr(sfiles);
  modify();
}

// main();

const NO_SONG_NUMBERS = [
  "059R.txt",
  "063L.txt",
  "082R.txt",
  "091R.txt",
  "104R.txt",
  "137R.txt",
  "145R.txt",
  "148R.txt",
  "168R.txt",
  "190R.txt",
  "212R.txt",
  "234R.txt",
  "249L.txt",
  "264R.txt",
  "387R.txt",
  "402R.txt",
  "427R.txt",
  "438L.txt",
  "439R.txt",
  "440L.txt",
  "454R.txt",
  "462R.txt",
  // en
  "519R.txt",
  "526L.txt",
  "542R.txt",
];

const SONG_NO_REGEX =
  /(?<!.+)(\d+)( \(\d+\)| \[\d+\)| \[\d+\]| \d+\)| [\[\()]\d+|\n|\w+)[\n\(]/gm;

async function parse() {
  const pages = new Array<number>();
  modify();
  const fi = fs.readdirSync("written_data");
  for (const file of fi) {
    if (NO_SONG_NUMBERS.includes(file)) continue;
    const text = fs.readFileSync(resolve("written_data", file)).toString();
    let match = text.match(SONG_NO_REGEX);
    if (match) {
      match?.map((v) => {
        let no = v.split("\n")[0].trim();
        const x = REPLACE_NO.get(file);
        if (x && x.split(" ")[0] === no) {
          no = x.split(" ")[1];
        }
        // if (parseInt(no.split(" ")[0]) === 118) console.log(file);
        pages.push(parseInt(no.split(" ")[0]));
      });
    } else {
      console.log(file);
    }
  }
  // const p = pages.slice(0, 1260);
  // const p = pages.slice(1260, 1481);
  // console.log(JSON.stringify(pages, null, 2), pages.length);
  // areConsecutive(p);
  return pages;
}

// parse();

function areConsecutive(arr: number[]) {
  arr.sort((a, b) => a - b);
  // console.log(JSON.stringify(arr, null, 2), arr.length);
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] !== arr[i - 1] + 1) {
      console.log(i, ": actual", arr[i], ": exp", arr[i - 1] + 1);
    }
  }
}

// makeSongsNo();
// modify();

// const f = file.split(".")[0].split("-");
// const fn = f[1] + f[2][0].toUpperCase() + ".txt";
// console.log(`written_data/${file} ==> ${fn}`);
// fs.renameSync(`written_data/${file}`, `written_data/${fn}`);
// console.log(file.split(/(L|R)/));

interface Data {
  new: number;
  old?: number;
  file: string;
  lang: string;
}

function makeSongsNo() {
  const songs = new Set<Data>();
  const files = fs.readdirSync("written_data");
  for (const file of files) {
    if (NO_SONG_NUMBERS.includes(file)) continue;
    const page = parseInt(file.match(/\d+/)![0]);
    const lang = page < 463
      ? "Malayalam"
      : page < 529
      ? "English"
      : page < 546
      ? "Hindi"
      : page < 551
      ? "Kannada"
      : "Tamil";
    const text = fs.readFileSync(`written_data/${file}`).toString();
    const match = text.match(SONG_NO_REGEX)!;
    // console.log(match)

    match.map((v) => {
      const line = v.split("\n")[0].trim();
      const newNo = parseInt(line.split(" ")[0]);
      const kek = line.split(" ")[1]?.match(/(\d+)/)?.[0];
      const old = kek ? parseInt(kek) : undefined;

      text.replace(line, `${newNo}${old ? ` (${old})\n` : "\n"}`);
      songs.add({ new: newNo, old, file, lang });
    });
  }
  fs.writeFileSync("songs_no.json", JSON.stringify(Array.from(songs)));
}

// const SONG_NO_REGEX_NEW = /(?<!.+)(\d+)( \(\d+\)|\n)[\n\(]/gm;

function bake() {
  const data: Data[] = JSON.parse(fs.readFileSync("songs_no.json").toString());

  const files = fs.readdirSync("written_data");
  const texts: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const text = fs.readFileSync(`written_data/${file}`).toString();
    if (NO_SONG_NUMBERS.includes(file)) {
      texts.push(file);
      continue;
    }
    const match = text.match(SONG_NO_REGEX)!;

    const idxs = match.map((v) => text.indexOf(v));

    idxs.unshift(0);
    idxs.push(text.length);

    for (let j = 0; j < idxs.length; j++) {
      const cut = text.substring(idxs[j], idxs[j + 1]);
      if (cut.trim() !== "") texts.push(cut);
    }
  }

  const parsed: string[] = [];
  let i = 0;
  while (i < texts.length) {
    const text = texts[i];
    const match = text.match(SONG_NO_REGEX);
    if (!match) {
      parsed[parsed.length - 1] += `\n\n${text}`;
    } else {
      parsed.push(text);
    }
    i++;
  }

  for (let i = 0; i < parsed.length; i++) {
    const metadata = data[i];
    const text = parsed[i].split("\n").slice(1).join("\n").trim();
    fs.writeFileSync(
      `songs/${metadata.lang[0].toUpperCase()}${metadata.new}.json`,
      JSON.stringify({
        number: metadata.new,
        old_number: metadata.old,
        language: metadata.lang,
        text,
      }),
    );

    fs.writeFileSync(
      `songs_categorized/${
        metadata.lang.slice(0, 3).toLowerCase()
      }/${metadata.new}.json`,
      JSON.stringify({ number: metadata.new, old_number: metadata.old, text }),
    );

    console.log(chalk.green("Generate"), metadata.lang, metadata.new);
  }
}

modify();
// makeSongsNo();
fs.mkdirSync("songs", { recursive: true });
fs.mkdirSync("songs_categorized", { recursive: true });

fs.mkdirSync("songs_categorized/mal", { recursive: true });
fs.mkdirSync("songs_categorized/eng", { recursive: true });
fs.mkdirSync("songs_categorized/hin", { recursive: true });
fs.mkdirSync("songs_categorized/kan", { recursive: true });
fs.mkdirSync("songs_categorized/tam", { recursive: true });
bake();
