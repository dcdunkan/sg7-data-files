import fs from "fs";
import jimp from "jimp";
import chalk from "chalk";
import tesseract from "node-tesseract-ocr";
import { resolve } from "path";

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

const modifyMap = new Map([
  [
    "048L.txt",
    `ആക്കിടുന്നെന്നെ (2)

ഒട്ടനേകം സിദ്ധയാഭരോടൊത്തു
ചേര്‍ന്നുനിന്നു സ്തുതി-
ച്ലാര്‍ത്തിടുവാനവനെന്നെ
യോമ്യനാക്കിത്തീര്‍ത്തതോര്‍ത്ത്‌

കാത്തിരിക്കുന്നവനെ ഞാന്‍
കുണ്ടിടുവാനെന്റെ കണ്‍കര്‍
കൊരിച്ചിടുന്നധികമായ്‌ കുതുകമോടെ
കാലടമറെ ചെല്ലും മുമ്പെ
കാഹളനാദം കേൾക്കുവാൻ
കാതുകളും കൊതിക്കുന്നു
കാരുബ്വാരിധേ ദേവാ

51

വാഴ്ത്തി സ്തുതിക്കുമെന്നും ഞാനെന്റെ
താഴ്ചയിടലോര്‍ത്ത ഈശനെ (2)

വര്‍ണ്ണിച്ചിടാനെനിക്കെന്റെ നാവു പോരാഭയ
എണ്ണിത്തീര്‍ത്തിടാമോ അവന്‍ ചെയ്തത്‌
ആയിരമായ്‌ സ്തുരിച്ചിടുന്നേ

ആനന്ദ ഹസ്തങ്ങളെയുയര്‍ത്തി

പാപരാപദോഗമായതെന്റെ ഭീതിയാൽ
നാരഗര്‍ത്തത്തില്‍ പതിക്കും നേരത്തില്‍
സ്നേഹഹസ്തം നീട്ടിയെന്നെ

നിന്‍ തിരുരാജ്യത്തിലാക്കിയല്ലോ

ചേറ്റിലല്യോ കിടന്നതോര്‍ത്തു
നോക്കിയാല്‍ - നാറ്റമല്ലയോ
വമിച്ചതെന്‍ ജീവിതെ

മാറ്റിയടല്ലോ എന്‍ ജീവിതത്തെ
മാറ്റമില്ലാത്ത നിന്റെ കുപയാല്‍
പാപികളെ തേടിവന്ന യേശു രക്ഷകന്‍
പാപമില്ലാ ശുദ്ധര്‍ക്കായിതാ വരുന്നേ
വരവിന്‍ ദിനം അതിസമീപം
വരവിന്‍ പ്രത്യാഭയാല്‍ നിറഞ്ഞിടാളേ
അല്ലല്‍ തിങ്ങും ജീവിതത്തില്‍
ഞാന്‍ വസിച്ചടഷോൾ
`,
  ],
  [
    "091R.txt",
    `യെന്നും പാത്രമാക്കുക-

ജീവനാഥനേ ദേവനന്ദനാ- നിന്റെ
ജീവനെന്നില്‍ തന്നതിന്നായ്‌

സ്തോത്രദേശുദവേ-
നാഭലോകത്തില്‍ ദാസനാമെന്നെ-
സത്പ്രകാശമായ്‌
നടത്തിടേണം യശുനാഥനേ-
ല്ല 5...

200 (169)

ഉല്‍പ്രാണ നായകന
ളാ കുപാസിന്ധോ- 2ല്‍
സത്പ്രകാരഭമ ദിവ -
സുസ്നേഹമയാ വന്ദേ! -

തങ്കമേനിയിലെന്റെ ലാഘനങ്ങളെയെല്ലാം
ശങ്കയെന്യേ വഹിച്ചെന്‍ സങ്കട0കുറ്റിയ -

രാവും പകലുമെന്നെ
മാര്‍വ്വില്‍ വഹിച്ചു തൻ പി-
താവിന്‍ മുമ്പിലെനിക്കായ്‌
ദേവുന്നാചാര്യനാകും

പത്ഥ്യവചനം മൂലം മിത്ഥ്വാഴബാധാകുറ്റി
സത്യമാര്‍ഗ്ഗത്തിലൂടെ
നിത്യം നടത്തിടുന്ന -

വിണ്ണില്‍ ചേര്‍ത്തിടുവോളം-
ഉന്നിലെന്നെ നിന്‍ സ്വന്ത
കണ്ണിന്‍ കൃഷ്ണാണിയെ-
നെണ്ണി സൂക്ഷിച്ചിടുന്ന
വേഗമെന്നെയി നാൾ-
ലോകേ നിന്നുദ്ധരിഷാന്‍
മേഘവാഹനദേറി

നാകേ നിന്നിറങ്ങിടും -

സങ്കടങ്ങളിലെല്ലാം
പൊന്‍കരങ്ങളാല്‍ താങ്ങി
സങ്കേതം നെഞ്ചിലേകി
കണ്‍കര്‍ തുടച്ചിടുന്ന
`,
  ],
  [
    "360R.txt",
    `നടുങ്ങിടുന്നിതാ (2)

നീക്കും ലോകവാഴ്ച യേശു
രാജരാജനായ്‌

സ്ഥാപിക്കും സ്വര്‍ഗ്ഗീയ വാഴ്ച

തന്‍ വിരുദ്ധര്‍ക്കായ്‌ (2)
മുര്‍മുടിയണിഞ്ഞു ഭക്തധാരിയായവൻ
പൊന്‍കിരീടം ചൂടി
തേജപൂര്‍ണ്ണനായിതാ (2)

ദൈവം തന്‍ വിരുദ്ധന്മാരിന്‍
കണ്ണുനീരെല്ലാം നീക്കിയേകും നിതയ
ജീവനെന്നെന്നേക്കുമായ്‌ (2)

ഹാ! സ്വര്‍ഗ്ഗീയ നാളതിന്‍
പ്രദാതമായിതാ

ഹാ! എന്‍ പ്രിയന്‍ വാനിൽ
ദുതഴസനടയോടിതാ [2)

971 (703)

ദൈവകുൃപയനുദവിക്കും ദൈവമക്കള
ദൈവരാജ്യപ്രചരണ-

ത്തിനണി നിരക്കുവിന്‍

മുന്നമെ തന്‍ രാജ്യം നീതി

നമ്മള്‍ തേടുകിലൊന്നുഭേ
കുറവില്ലാതെ കരുതിടും പരന്‍
അനുഗ്രഹത്തിനുറവിടം
2നുസുതന്റെ മാറിടം (2)
അനുദിനവും ചാരിടുടന്നോ-
രാകുലരാകാ

കുരിശില്‍ നിജ്ജീവനൊരു
കുരുതിയാക്കിയോന്‍

മൃതിയെ വെന്നു വിണ്ണിലിന്നു
വാണിടുന്നല്ലോ

ഇത്ര നല്ല രക്ഷകനുലകുമൊങ്ങും
സാക്ഷികള്‍ നിത്യജീവന്‍ കൈവരിച്ച
നമമളല്ലയോ?
`,
  ],
  [
    "467L.txt",
    `And the glory of His resurrection share;
When His chosen ones shall gather
to their home beyond the skies,
And the roll is called up yonder;
I'll be there.

Let us labour for the Master from
the dawn till setting sun
Let us talk of all His
Wondrous love and care,
Then when all of life is over,
and Our work on earth is done,
And the roll is called up yonder,
I'll be there.
***  James M. Black

11

Joy to the world!

The Lord is come;

Let earth receive her King;

Let every heart prepare Him room,
And heav'n and nature sing,

And heaven and heaven

and nature sing.

Joy to the earth!

The Saviour reigns;

Let men, their songs employ;
While fields and floods,

Rocks, hills and plains,

Repeat the sounding joy (2)
Repeat, repeat the sounding joy.

No more let sins and sorrows grow,
Nor thorns infest the ground;

He comes to make His blessings flow
Far as the curse is found (2)

Far as, far as the curse is found.

He rules the world with truth and grace,
And makes the nations prove
The glories of His righteousness,
And wonders of His love (2)
`,
  ],
  [
    "051L.txt",
    `ഒന്നായ്‌ ചേര്‍ന്നു പാടുഭമ്പോര്‍
ആധിയും മാറിഷോകും

തീരാത്ത വ്യാധിയും

എല്ലാമീടരോ നല്‍കുന്ന ദാനേ
ഹല്ലേലുയ്യാ പാടി വാഴ്ത്തിടാം

ജാതി 20ന്നും പേരു മ0ന്നും
സകലേശനു സ്തുതി പാടാം അനുദിനവും

കഷ്ടഷാടും ജീവന്റെ ദാധമേ

നഷ്ടം ഇല്ലാതാരുണ്ടു ദൈവ
ചൊല്ലേണം നാം എല്ലാം ആ കാതിലായ്‌
എങ്കില്‍ ശാന്തി നേടും ജീവിതം

ജാതി 20ന്നും പേരു മ0ന്നും
സകലേശനു സ്തുതി പാടാം അനുദിനവും

60

ദിനമനുമംഗളം ദേവാധിദേവാ
ദേവാധിദേവാ ദേവാധിദേവാ
ദിവിമരുവീടും ജീവികളാകെ
ദിനവും നിന്നടിയിണ പണിയുന്നു നാഥാ
നിന്തിരു തേജസ്സുന്തരമെന്യേ
ചന്തമായടിയങ്ങര്‍ കാണുതിന്നരുര്‍ക
തിരുക്കരം തന്നിലിരിക്കുമച്ചെട്കാൽ
ദരിച്ചിടുന്നഖിലവും വിചിത്രമാം വിധത്തില്‍
ഏതൊരു നാളും നിന്തിരു കൈയ്യാല്‍
€ചതന ലദിച്ചെങ്ങള്‍ മാദമായ്‌ വാഴ്വു
നിത്യമാം ജീവന്‍ പുത്രനിലൂടെ
ഉര്‍ത്ൃരാമടിയര്‍ക്കു തന്ന മഹേശാ -
ല്ല [0.5

61

എന്നും ഉയർത്തിടുവാൻ.
എന്നും പുകഴ്ത്തിടുവാന്‍.
എന്നും പാടിടുവാന്‍ നീ യോല്യഭന (2)
മല്‍? മത? മാഥാ.
അത്യ്തമാം 69൮2.
`,
  ],
  [
    "065R.txt",
    `പാപികളായ്‌ നാമാധികലര്‍ന്നും
ദഭാവിയെയോര്‍ത്തു ദയന്നും
പാര്‍ത്തൊരു നേരം നമെത്തേടിയ
പരനെ ദിനവും സ്തുതി ചെയ്തിടാം

ഇരുളിന്‍ ഭീകര വഴിയില്‍ നിന്നും
നിരുപമ തേജസ്സില്‍ വന്ന്‌
നിജഗുണമഹിമ ഘോഷണം ചെയ്വാന്‍
നിര്‍മ്മല ഇനമായ്‌ നമൊക്കരുതിയ

നീചരാം നമ്മളെ മോചിതരാക്കി

രാജപുദരോഹിതരാക്കി

ആത്മിക ബലികര്‍ കഴിഷതിനായി

യോല്യരെന്നെണ്ണി അത്ഭുതമാമീ-
ല്ല 1195.

105

ദേവദേവനു 2൦0ളം

മഹോന്നതനാം ഭദവദേവനു 2൦0ളം
ദേവദുതരാകാഭേ ദിവൃധീതങ്ങര്‍ പാടി
കേവലാനനത്തോടു വി

സ്തുതി ചെയ്യുന്ന

സകല ലോകങ്ങളിലെ സര്‍വ്വ ഗണങ്ങളെയും
സുഖമുടനെ പടച്ചു
സകല നാളും പാലിക്കും

നരഗണങ്ങളിന്നതി ദുരിതമൊഴിഷതിന്നായ്‌
തിരുമകനെ നരനായ്‌ ധരണിയിങ്കലയച്ച

പാപബോധം വരുത്തി
പാപിയെ രുദ്ധമാക്കാൻ
പാവനാത്മാവെ നല്‍കും
ജീവജലാരയമാം

ആദരവോടു തന്റെ വേദവെളിവുമനു

ജാതികള്‍ക്കരുളിയ ആദിനാഥനാകുന്ന
ല്ല പ്പ്‌.

106

വിരുദ്ധനാം കര്‍ത്താഭവ
വിശ്വസ്തനാം കര്‍ത്താ€വേ
`,
  ],
  [
    "077R.txt",
    `കര്‍ത്താവു ബലം നല്‍കിടും (2)

143

യേശുനായക്‌:! ശ്രീരാ! നമോ നമോ
നാഭവാരണ സ്വാമിന്‍! നമാ നമാ
മോശി പൂജിതരുപാ! നമോ നമോ
ഉഹീപാദ!

മാനുവേലന പാഹി നമോ നമോ
മാനവസുതവര്യാ! നമോ നമാ
ദീനവത്സലാ! ക്രിസ്തോ!

നമോ നമോ ദിനമാകെ

കുഷ്ഠഭരാഗവിനാഭാ! നമാ നമാ
തുഷ്ടി നല്‍കുമെന്നീരാ! നമോ നമോ
രിഷ്ടപാലക വന്ദേ നോ നടമാ ദിവപിഠ!

പഞ്ചപുപ്പ്രദാനാ! നടമാ നമോ
സഞ്ചിതാധിക പുബ്ബാ! നടമാ നമാ
അഞ്ചിതാനനയുക്താ! നടമാ നമാ
പരമീഡേ

ആഴിഭമേല്‍ നടന്നോനേ! നടമാ നമാ
ഭൾഷിയറ്റവര്‍ക്കീരാ! നമാ നമോ
ഉഴഴിമേല്‍ വരും നാഥാ! നടമാ നമോ
തൊഴുകൈയായ്‌

സ്വസ്തികാവിദ്ധദേഹാ! നമോ നമോ
ദുസ്ഥരക്ഷണ ശീലാ! നമോ നമാ
ശസ്തമസ്തു തേ നിത്യം നമാ നമോ
ബഹുദുയാല്‍

144

നിന്നെ വാഴ്ത്തും- നിന്റെ

ഭവ്യമാം നാമം ഞാനെന്നും പുകഴ്ത്തും
നാള്‍തോറും ഞാന്‍ തിരുനാളത്തെ വാഴ്ത്തി
നാഥാ തുടര്‍ന്നിനി നിന്നെ സ്തുതിക്കും

യാവേ നീയോ മഹാന്‍ തന്നെ-അതാല്‍
`,
  ],
  [
    "104L.txt",
    `കാലങ്ങള്‍ തീര്‍ന്നാലും നിന്നിടും എന്‍
പ്രത്വാര എന്റെ ഉള്ളിൽ
കൈഷണിയല്ലാത്ത നിതയ വീട്‌
സ്വര്‍ഗ്ഗത്തിലുണ്ടെനിക്കായ്‌
സ്വന്തമായ്‌ തീര്‍ന്നിതാ വന്‍ കൃപയാല്‍
വിശ്വസിച്ചാ ദിനത്തില്‍
നിത്യമാം ധനവും അനു്രഹലെല്ലാം
തന്‍ കരത്താലെനിക്കായ്‌
(സ്വര്‍ഗ്ഗം...)
ലു സ

220

പ്രാണ്പ്രിയാ പ്രാണ്പ്രിയാ

ചങ്കിലെ ചോര തനെന്നെ
വീണ്ടെടുത്തവ$ന- വീണ്ടെടുഷുകാരാ
പ്രാണപ്രിയന്‍ തന്റെ

ചങ്കിലെ ചോരയാല്‍

എന്നെയും വീണ്ടെടുത്തു (2)
കുപയ കൃപയേ വര്‍ണ്ണിഷാന്‍
അസാദ്ധ്ഭേയത്‌ [2)

നന്ദി യേശുഭവ നന്ദി യേശുവേ

നീ ചെയ്ത നന്മകൾക്കൊരായിരം നന്ദി
നന്ദി യേരു€വ നിനക്ക്‌ നന്ദി യേശുവേ
നീ ചെയ്ത നന്മകൾക്കൊരായിരം നന്ദി
എന്‍ ശക്തിയാലല്ല

3. ആഃ

221 (172)

ആരാധനയ്ക്കു യോഗ്യ

നിന്നെ ഞങ്ങ ആരാധിച്ചിടുന്നിതാ
ആഴിയും ഈഴിയും നിര്‍മ്മിച്ച നാഥനെ
ആത്മാവില്‍ ആരാധിക്കാം കര്‍ത്താവിനെ
നിത്യം സ്തുതിച്ചിടും ഞാന്‍
`,
  ],
  [
    "386R.txt",
    `1047 (766)

ഉരണഃ€മ വിഷമെങ്ങു നിന്റെ
വിജയവുമെവിടെ എഴന്നരു
ഉരണത്തെ ജയിച്ചു തനിക്കു
സ്തുതി ഹല്ലേലുയ്യാ
തന്‍ ക്രൂരിൽ ഞാനും ഹാ മരിച്ചു നിത്യമാം
ജീവന്‍ കൈവരിച്ചു - തന്നിൽ ഞാൻ
സര്‍വ്വവും ലയിച്ചു - ഹല്ലേലുയ്യാ
എന്‍ ജീവന്‍ ക്രിസ്തുവിൽ 88൦ 2ന€2
പാടുക സ്തോത്രം - എന്‍ അദയം
തന്‍ കുപ മാത്രം - ഹല്ലേലുയ്യാ
വൃഥാവിലല്ല ഞാന്‍ ചെയ്യും പ്രയത്നം
ഒടുവില്‍ ഞാന്‍ കൊയ്യും- തടയുവാ-
നില്ലൊരു കൈയ്യും - ഹല്ലേലൂയ്യാ
പ്രത്യാരയ്ുവരെഷോലല്ല നാം
ക്രിസ്തുവില്‍ മ2രിച്ചോര്‍ - ഉയിര്‍ക്കും
താന്‍ വരുമഃഷോൾ ഹല്ലേലുയ്യാ

സ്വര്‍ട്ലോക കാഹളം ധവനിക്കും
മരിച്ചോര്‍ക്ഷണമുയിര്‍ക്കും- തന്‍
തേജസ്തക്ഷയം ധരിക്കും ഹല്ലേലുയ്യാ

എന്‍ ദേഹം 8ണയമെന്നാല്‍ ഇനിയും
താന്‍ വരുമന്നാൾ- വിളങ്ങും
തേജസ്സില്‍ നന്നായ്‌ ഹല്ലേലുയ്യാ

ല്ല 1.£.0.

1048 (767)

അല്‍പകാലം മാത്രം ഈ ദുവിലെ വാസം
സ്വര്‍ഭുരമാണെന്റെ നിത്യമാം വീട്‌-എന്റെ

എന്‍ പ്രയാണകാലം നാലു വിരല്‍ നീളം
ആയതിന്‍ പ്രതാപം കഷ്ടത മാത്രം
ഞാന്‍ പറന്നു ഭവം പ്രിയഭനോടു ഭചരും
വിണ്‍മഹിമ പ്രാപിച്ചെന്നും
വിശ്രമിച്ചിടും - എന്നും

ചാളയത്തിനഷുറത്തു കഷ്ടഃമല്‍ക്കുക നാം
`,
  ],
  [
    "444R.txt",
    `മിങ്ങരക്കായിരമായിഭമാഭംവകള്‍

പറുദീസയില്‍ വിരിഞ്ഞ

2ലരിന്‍ സുഗന്ധവാഹിനിയായ്‌

ഒഴുകിയ തെന്നല്‍ തഴുകീടട്ടെ

നിങ്ങളെ അനുനിമിഷം (2)

ദൈവം മെനഞ്ഞ കൂടാരത്തില്‍

ജീവിതമുണരട്ടെ

പുതു ജീവിതമുണരട്ടെ
(വധുവരന്മാരെ ...)

ഒരുമയിലെന്നും പുലരാനായി

ദൈവം കനിയട്ടെ

ആശകളെല്ലാം പുങ്കനി ചുടാൻ

ദൈവം കനിയട്ടെ

നയ്യകളേകാന്‍ അനുഗ്രഹിക്കാന്‍

കുടെ വസിക്കട്ടെ

ദൈവം കൂടെ വസിക്കട്ടെ

(8൦0ള€വള......]


ആവശ്യഭനരത്ത്‌ അവന്‍ തുണയായ്‌
അതിശയമായെന്നെ പുലര്‍ത്തിടുന്നു

അണഞ്ഞിടുമൊടുവില്‍ ഞാനവനരികില്‍
അകതാരിലാകെ എന്നാര്രയം
അവിടെയാണെന്നുടെ സ്വന്തമൃഹം
അനവരതം അതില്‍ അധിവസിക്കും
ല്ല കള്‍.

1205 (870)
കര്‍ത്താവിനെ ഉണ്ടയോടറിയും
ഭര്‍ത്താവും ദാര്യയും കൂടുമ്പോഴിമ്പം
ദൈവം തന്നനുഗ്രഹങ്ങര്‍
`,
  ],
  [
    "049R.txt",
    `തന്നെനിക്കവന്‍

മോദമോടെ കാത്തിടും എന്നും (2)

ഇഷ്ടനാഥന്‍ കഷ്ടതയില്‍

വിട്ടകന്നു നില്‍ക്കയില്ല

കഷ്ടതകള്‍ ഉറ്റവര്‍ക്ക്‌ നയയായിടും
ല്ല 8.0.

55

സങ്കീര്‍ത്തന സ്തുതികളാല്‍
കീര്‍ത്തനം പാടിടുവാന്‍
സന്തോഷത്തോടെ വന്നിടാം
കര്‍ത്തന്‍ സന്നിധാ [2)

കാവ! വ്ഭഗേഫത്മാ്‌

2? ൭00 രത്മോഷം

കാരുഞ്/8201ു൦ ഭക്ഷയി? ആരം
തേജസ്വി? 8൪0൦ മുത വമമ്മോഷം
തമ്മിടും എന്നുടെ ആയുസ്തി? ഗാളെല്ലാം
സത്യാത്മാവില്‍ നടക്കുവാന്‍
ജ്ഞാനം തന്നിടണേ

സൂഷ്മത്തോടെ നടക്കട്ടെ

ഈ ദുഷ്‌കാലമെന്നും

കര്‍ത്താവേ നിന്‍ അതിബലത്തില്‍
നടന്നിടാന്‍ കൃപ തായോ

കുരുത്തനാം ശ്രതുവെ കീഴടക്കി ജീവിഷാന്‍

വിദ്വാസമാം പരിചയാല്‍ നിത്യം

പോരാടുവാന്‍

വിരുദ്ധാത്മാവില്‍ ശ്രതുവെ

ജയ്ിച്ചിടാമെന്നും

സര്‍വ്വായുധമെടുത്തു

യുദ്ധം ചെയ്തിടുവാന്‍

സഹായിക്ക നീ എന്നെ എന്നുമെന്നും
ക 8.0

56
യേശു നല്ലവന്‍ എനിക്ക്‌ യേശു നല്ലവന്‍
നല്ല രക്ഷകന്‍ തന്‍ നാമം
വാഴ്ത്തിഷാടും ഞാന്‍
`,
  ],
  [
    "466L.txt",
    `Rock of Ages, cleft for me,
Let me hide myself in Thee.
*** Augustus M. Toplady

8

There is a fountain fill'd with blood,
Drawn from Immanuel's veins;
And ssinners plunged beneath that blood
Loose all their guilty stains. (3)
And ssinners plunged beneath that blood

E’er since by faith | saw the stream
Thy flowing wounds supply,
Redeeming love has been my theme,
And shall be till | die (3)
Redeeming love has been my theme,

The dying thief rejoiced to see
That fountain in his day;

And there may I, though vile as he,
Wash all my sins away (3)

And there may I, though vile as he,

Dear dying Lamb! Thy precious blood
Shall never lose its power, Till all
the ransomed Church of God

Be saved to sin no more (3)

Till all the ransomed Church of God

Then, in a nobler, sweeter song,
I'll sing Thy power to save
When this poor lisping,
stam’ering tongue

Lies silent in the grave (3)
When this poor lisping,
stam’ering tongue

W. Cowper
9

What a Friend we have in Jesus,

All our sins and griefs to bear!
What a privilege to carry
`,
  ],
  [
    "514L.txt",
    `173

Sing a joyful song unto the Lord,
Praise the Lord with gladness,
Sing a joyful song unto the Lord
For He alone is God (2)

Praise Him!

Praise the Lord with gladness
Praise Him!

For He alone is God

174

He is Lord, He is Lord

He has risen from the dead
And He is Lord

Every knee shall bow

Every tongue confess

That Jesus Christ is Lord (2)

175

You are my strength

when | am weak

You are the treasure that | seek,
You are my all in all.

Seeking You,

as a precious jewel;

Lord to give up I'd be a fool,
You are my all in all.

Jesus, Lamb of God
Worthy is Your name (2)

Taking my sin, my cross,

my shame;

Rising again I'll bless Your
name,

You are my all in all.

When | fall down You pick me up;
When | am dry You fill my cup,
You are my all in all.
`,
  ],
  [
    "551L.txt",
    `തമിഴ്‌ ഗ്‌

1

അനാതി സ്നേഹത്താല്‍
എന്നൈ നേസിത്തിരയ്യാ
കാരുണ്യത്തിനാല്‍

എന്നൈ ഇഴുത്തുക്കൊണ്ടീേ
ഉങ്ക അന്‍പു പെരിയതു

ഉങ്ക ഇറക്കം പെരിയതു

ഉങ്ക കിരുപൈ പെരിയതു
ഉങ്ക തയവു പെരിയതു

അനാതൈയായ്‌ അലൈന്ത
എന്നൈ തേടിവന്തീഭേ
അന്‍പുകാട്ടി അരവണൈത്തു
കാത്തു കൊണ്ടീദേ

തായിന്‍ കുരുവില്‍ തോന്റു
ളുടന്ന തെരിന്തു കൊണ്ടീദേ
തായൈഷോലെ ആറ്റിടത്തറ്റി
അരവണൈത്തിഭരേ

നടത്തി വന്ത പാതൈകുളെ
നിനൈക്കുടമ്പോതെല്ലാം
കണ്ണീടരോടു നന്റി സൊല്ലി
തുതിക്കിന്‍ദേനയ്യാ

കര്‍ത്തര്‍ശെയ്യ നിനൈത്തതു
തടൈ പടവില്ലെ
സകലത്തൈയും നനൈയാക
സെയ്തുമുടിത്തീരേ

2

ആരാധിഷേന്‍ നാന്‍ ആരാധിഭഷന്‍
ആണ്ടവദേസുഭവ ആരാധിഭഷന്‍
വല്ലവരേ ഉമൈ ആരാധിഭ€ഷന്‍
`,
  ],
  [
    "553L.txt",
    `പോതും എനക്കു നീദേ
(ആ....ആനന്തം.

6

കുതുഹലം കൊണ്ടാട്ടടേ
എന്‍ യേസുവിന്‍ സന്നിതാനത്തില്‍
ആനന്ദം ആനന്ദമേ

എന്‍ അന്‍പരിന്‍ തിരുപാദത്തില്‍

പാവലെല്ലാം പറന്തതു
നോയ്കളെല്ലാം തീര്‍ന്തതു
യേസുവിന്‍ രത്തത്തിനാല്‍
കിറിസ്തുവുക്കുര്‍ വാഴ്വ്‌
കിരുപൈയാല്‍ മീട്പ്‌
പരിസുത്ത ആവിയിനാല്‍

തേവാതിതേവന്‍ തിനം തോറും
തങ്കും തേവാലയം നാടേ
ആവിയാന ഭതവന്‍ അച്ചാരമാനാര്‍
അതിസയം അതിസയദഭ2

വല്ലവര്‍ എന്‍ യേസു
വാഴവൈക്കും ദൈവം
വെറ്ററിമേടല വെറ്റ്റി തന്താര്‍
ഒരു ഉനമായ്‌ കൂടി ഓസാന പാടി
ഉരെല്ലാം കൊടി ഏറ്റുടവോം

എക്കാള സത്തം തുതര്‍കൾ കൂട്ടം
നേസര്‍ വരുകിന്റാര്‍

ഒരു നൊടികൊഴുതില്‍ 2റുരൂപമാടവാം
ഉകിലൈയില്‍ പ്രവേസിഷോം

7

/തിദുക്കഭത്മാൽ വഫാച്ഛ/

തിരുക്കരത്താല്‍ താങ്കി എന്നൈ
തിരുച്ഛിത്തം $പാല്‍ നടത്തിടുടേ
കുയവന്‍ കയ്യില്‍ കളിമൺ നാൻ
`,
  ],
  [
    "031L.txt",
    `1

സ്തുതിഷിന്‍ സ്തുതിഷിന്‍ എന്നും
സ്തുതിച്ചിടുവിന്‍
യേശു രാജാധിരാജാവിനെ
ഈ പാര്‍ത്തലത്തിന്‍
സൃഷ്ടികര്‍ത്തനവന്‍
എന്റെ ഉള്ളത്തില്‍ വന്നതിനാല്‍

ആ...ആ... ആമ പദ2062
ഇതു ദ്/771യ ഃ്മോഷമേ
ഇഈപാര്‍ത്മലത്തി7?
രൂഷ്ടികര്‍ത്ത൦വ/?

എന്റെ ഉള്ളത്തില്‍ വതിഗാ₹

അവന്‍ വരുന്ന നാളില്‍

എന്റെ കരം പിടിച്ചു

തന്റെ മാര്‍വ്വോടണച്ചിടുദേ

ആ സമൂഹമതില്‍ അന്നു കര്‍ത്തനുമായ്‌
ആര്‍ത്തു ഘോഷിക്കും സന്തോഷത്താല്‍

എന്‍ പാപങ്ങളെ മുറ്റും കഴുകിടുവാന്‍
തന്‍ ജീവനെ നല്‍കിയവന്‍

വീണ്ടും വന്നിടുമേ ഭഘവാഹനത്തില്‍
കോടാകോടി തന്‍ ദുതരുമായ്‌

കണ്‍കര്‍ കൊതിച്ചിടുടന്നേ

ഉള്ളം തുടിച്ചിടുട്നേ

നാഥാ നിന്നുടെ വരവിനായി

പാരില്‍ കഷ്ടതകൾഫഏറുംദിനാ$താറുഭേ
കാന്താ വേധം നീ വന്നിടടണ

2

സ്തുതിക്കാം ഉച്ചത്തില്‍ കര്‍ത്താവിനെ
സ്തുതിക്കു യോഗ്യനാം ദൈവത്തെ
`,
  ],
  [
    "051R.txt",
    `മി? മ22൦ എത്ര ൮...! 2)
ഫലള്ല്ൂഗ്ാ

എന്നെ സ്നേഹിച്ചു നീ

സ്വന്ത ജീവനും ഈ
ഏഴയ്ടക്കേകിയതാം വന്‍ ത്യാഗ.

പാപച്ഛേറ്റില്‍ നിന്നുമെന്‍
പാദം ഉയര്‍ത്തിയവന്‍
പാരില്‍ നടത്തുന്നവന്‍ നീയേകന

എന്നെ പൊന്നുമകനായ്‌
മാറില്‍ അണച്ചവ$ന
കണ്ണീര്‍ തുടഷവനനേ എന്‍പ്രിയനേ.

വിണ്ണില്‍ വീടൊരുക്കി
വീട്ടില്‍ ഭചര്‍ത്തിടുവാന്‍
വീണ്ടും വന്നിടുന്ന വിൺനാഥ$ന

62

സ്തുതിക്കാം നമ്മൾ നന്ദിയാല്‍.
സ്തുതിക്കാം പരിരുദ്ധനെ
സ്തുതിക്കാം പുത്രനെ തന്ന ദൈവത്തെ (2)

ആയതാല്‍ ദുര്‍ബലന്‍

ഞാന്‍ ബലവാനായ്‌

സാധു ഞാനും ധന്യനായ്‌

യേശു എന്റെ രക്ഷകന്‍ - ആയതാല്‍

വണങ്ങാം നമ്മ ഭക്തിയാല്‍
വണങ്ങാം പരിശുദ്ധനെ

വണങ്ങാം പുത്രനെ തന്ന ദൈവത്തെ
വണങ്ങാം - ആയതാല്‍ [2)

63

കര്‍ത്തനെ സ്തുരതിച്ചിടുവിന്‍
അവന്‍ കൃപയോ എന്നുമുള്ളത്‌
ദേവാധിദേവനെ സ്തുതിച്ചിടുവിൻ
അവന്‍ കൃപയോ എന്നുമുള്ളത്‌
`,
  ],
  [
    "529R.txt",
    `തങ്ങള്‍

ഭേടാ കിയാ തുനേ പാര്‍, യീശു പ്യാർ
കിയാ ഹമാരാ ഉദ്ധാര്‍ (3)

യീരു പ്യാരേ കിയാ ഹമാരാ ഉദ്ധാര്‍

പാപ്‌ കാ ഭരാഴി ജീവന്‍ ബര്‍ മം ധാ
യത്ന്‌ ബി കര്‍ത്താ പര്‍ കുച്ച്‌ ന ബന്‍താ
യരു ജബ്‌ തരാ വസ്ത്ര ഛുവാ തബ്‌,
ചഗോ ഹുവാ യഹ്‌ ബീമാര്‍, യീര്രു പ്യാര്‍
കിയാ ഹമാരാ ഉദ്ധാര്‍ (3)

യീരു പ്യാരേ കിയാ ഹമാരാ ഉദ്ധാര്‍

3

7/1 5/7 07 /7/ 26075667
യീരു നാധ്‌ ഭക പ്രേം അപാര്‍ കു,
കുരുംഗാ മേ സ്തുതി ഗാൻ,
ഉസ്ടേ ക്രൂസ്‌ പര്‍ പ്രാണ്‌ ദേ അപ്നാ,
മുഭഛ മുക്തി കി പ്രധാൻ
26൮12 ഗാ€വ? ടം 2വ/ഹ്‌ കു.
ജി്€ക ഭക്ത്‌ €വേ ഹുവാ (താണ്‌
8282 ദാദാ ശ്ര/ണ്‌ ഭര്‍ ദി
ഉമ ശ്ര” പ? 810 പ്രാണ?
ഉസ്കേ ഇസ്‌ അഭനാഭഘ ട്രേം കാ,
നിത്‌ കരുംഗാ ളേ൦ം ബഘാന്‍,
പാപിയോം ഭേ ത്രാണ്‍ കേലിയേ,
പ്രാൺ ദേ ദിയാ ബലിദാന്‍.

ഉസ്കി സ്തുതി ക്യോം ന ഗാവും,
ജിസ്കി സാമര്‍ത്ഥ്‌ ഹെ അക്ഷയ്‌,
മൃത്യു, നരക്‌, പാപ്‌ ഭക ഈപര്‍,
മുഭഛ ദേതാ കൈസി ജയ്‌.

ട്രം സ പ്രേരിത്‌ ഫോ ദം ഗാവും,
യീരു കാ അനുഠാ പ്യാര്‍,
`,
  ],
  [
    "530R.txt",
    `ഫിര്‍ സേ യീരു ജഗ്‌ 82 തു ആയേഥാ

ഭൂമി ആകാര്‌ 2 സമാ ന സകാ,
2ന്ദിരോം 8 തു രഹ്‌ ന സകാ,

ന്രമ്‌ €ഹോകര്‍ ചര്‍നി 89൦ പൈദാ ഹുവാ,
നാം 8 ഹമാരേ ഖര്‍ തൂ ബനാ
ഖര്‍ തു ബനാ യീരു ഖര്‍ തു ബനാ
നാം 8 ഹമാരേ ഖര്‍ തൂ ബനാ

ഫഘേല ദം ആകര്‍ തു ഹി ബസ,
ലോഗോം കാ അപ€ന ലിയേ ഫിരാ,
അഗ്നി ഒര്‍ ബാദല്‍ മേം തു ഹി ദിഖാ
ഫിര്‍ സേ യീരു അപനി ഉഹിമാ ദിഖാ
ഹിമാ ദിഖാ യീരു മഹിമാ ദിഖാ
ഫിര്‍ സേ യീരു അപനി ഉഹിമാ ദിഖാ

ദാനിയേല്‍ കി തുഭന

പ്രാര്‍ത്ഥനാ സുനി,

എസ്രാ കി തുനേ സഹായതാ കി,
ബാബുല്‍ ൦ തുഴന €ബദാരി ഭജി,
അപ്നേ ലോഭകോം കോ

ഫിര്‍ €സ 68 രിഫായി

6 രിഹായി യീശു 68 രിഫായി
അപ്നേ ലോഭകോം കോ

ഫിര്‍ €സ 68 രിഫായി

തു ഹി ഹമാരാ രാജാ ഹെ,

തു ഹി മുക്തി ദാതാ ഹെ

ഫിര്‍ €സ ആടനവാലാ ഹെ,
പ്യാദേ പ്രദു യീരു തു ജല്‍ദി ആ
ഇല്‍ദി ആ യീരു ജൽദി ആ
പ്യാദേ പ്രദു യീരു തു ജല്‍ദി ആ

6

8282 2]ഹ്‌, പദ 2]ഫ്‌
ചം 62 8282 പാദാ 2൮]ഫ്‌
ദേരാ അകേലാ സഹാരാ വാഹി

ഖുശ്‌ അജ്ഹം ഹെ
ഒര്‍ ഖുര്‌ ഹെനിഗാഴഹ
`,
  ],
  [
    "546L.txt",
    `കന്നട €
1

അഷാ അഷാ ഏനുഷാ
ആര്‍്യ/
മാമു മിമ്മാമ്മു ബിജു
ഏനു മാദ്ധലാദമു 2
(അകാ...
നന്ന നഡയിന്താകലി
നന്ന നൊഡിയിന്താകുലി
നിന്ന നാമ ഒന്തേ മഹിദ ഒമ്പല്ലി [2)
നന്ന സര്‍വാന്കുകളു
നിന്ന സ്ഥുഥി മാഡലി (മു
(അകാ...
സര്‍വ സ(്രുഷ്ടിഭക നീനു എജമാനനു
സര്‍വ ടലാകവു നിന$ഗ
അഡബിഡലി [2)
സര്‍വ ജനാരു നിന്നല്ലി
ബന്ദു സേദലി (2)
(അകാ...
ഏസു നാനു നിന്നല്ല
നിന്ന വാക നന്നല്ല
നന്ന പ്രാര്‍ഥനയല്ലീ
നിന ഇയ സിലി (2)
നാനു നിന്നല്ല ഇദ്ദു ബാള
ഫലവ കൊഡുവേനു (2)
(അകാ...

2

ആദാധിഷേ ഗഹുയവ/
തെമെഥു മാ?

ആത്മ 2ഞാഥ2്‌ മ77 ബിമ
തായിരു? മാ
ദധാഷ്മമ്കമമിയുവേ /2/
`,
  ],
  [
    "547R.txt",
    `ഭരീര ആത്മ പ്രാണദിംദഭല
സോലുവ സമയദല്ലീ 2)
സ്ഥുതിയുഡ€ന പ്രാര്‍ത്ഥിസലു
ആത്മന ബല സിക്കുവുദു (2)
(കൃത...)
ശരരുവിന സേന മുട്ദ ബംദരു
സിലുവയ നിരലു വുംഡു (2)
ഹാഡോണ സ്ഥുതിസോണാ
ളാര്‍ഗവു തെരെയുവദു (2)
(കൃത...)

6

4 തോടു ഏമ്മു ഭവ
മി? 80൮

25 ഗ282 ഗാ കേള?
2മഥ 21027 ബയ്? എ
2മഥല് ഥുത! ഗാമ ഫാദ്ധുഭവ/
(3യ...]
നിനകര്‍പിസു€വ എന്‍ സ്ഥുഥി നവാ
ദേവാ നിന്ന സന്നിധി ൫ (2)
അനുഗ്രഹ തോരു ഏസു ദേവാ
2നുകുലര്‍കെല്ലാ ജീവനിരീ (2)
(3യ...]
അനുദിന ജീവിത തല്ലി
നാ സാമുവേ നിന്ന പ്രീതിയല്ലി (2)
അനുഗ്രഹ തോരു നിന്‍ സന്നിധിയല്ലി
ഭസേരലു ദയസിദഥ എന്ത നീ നല്ലി2)
(3യ...]

7

മമ്ുവേ ഭാ 07 ശ്രദുദേ

ദ്ഥുഥി? മാ കൊഞ്ഡാദ്ധുവേ /2/

കുരുണീസു നന്നനു നിന്നയ ഹസ്ഥതി (2)

കൈ ഫുദ്ധി8/ ൦൮൫൮0777

മ ക്/പെയു 00187
(൫൬...
`,
  ],
  [
    "549L.txt",
    `10

ംപ്യുര്‍ണവ/5
കുപ

ശാശ്/ഃ വാ മ107 ശ്രുപേ /2/

ബാള1€ഗ ബെളക്കെതു

മ വ നി (രുപ

7 വ ന രുപ
(സംപൂര്‍ണ

ചാപി€ഗ ബിഡുഗഡേ

നീഡി തന്ത നിന്ന ക്രുപേ

പരലോക ബാഗ്യവ

ദയപാലിസിദ നിന്ന ക്രുപേ [2)

ആത ദേവനേ നിന്ന ക്രൂപേ

ആദര്യ ദൈവവേ നിന്ന ക്രൂപേ
(സംപൂര്‍ണ...)

കരുണയ... തോരിദ

പരിഷുദ്ദ വാദന്ത നിന്ന ക്രു

സത്വയവാദ മരണദിന്ദ

കാകഡിദന്ദ നിന്ന ക്രുടപേ [2)

ആത ദേവനേ നിന്ന ക്രൂപേ

ആരോഗ്യ ദാഥനേ നിന്ന ക്രുടപേ [2)
(സംപൂര്‍ണ

11

്ാടിപുകഴ്ത്മിടാം 868167)
സ്ഥുതിസി ഒറ്റളുവേ ദേവാദി ദേവനേ
പുനിഥരു ദയഥിസ്ഥലേ (2)

നിന്നെ ഇന്ദു എന്ദു ഇരുവ ദേവരന്ന
ഹാഡി സ്ഥുതിസുഭവനു (2)

എഏന്ുവിര 228 മാ26/
൭ അമ്മ 2/൦ 2/൭
൬ ഭക്ഷിസ്വ]ത ഏനുവിമ
ഫാദ്ധ! മ്ഥുതിന്പുഭവമു /(2/

ഹോദ ബയന്‍കരവാദ തെരയോ
മുളുകി ഓഗഴുവ സമയാ [2)
കായത കൈകളിന്ത
`,
  ],
]);

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
