import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as htmlparser2 from 'htmlparser2';

const keys = [
	'Elektronik-cat.11044258',
	'Komputer-Aksesoris-cat.11044364',
	'Monitor-cat.11044364.11044371',
	'Penyimpanan-Data-cat.11044364.11044386',
	'Komponen-Network-cat.11044364.11044394',
	'Peralatan-Kantor-cat.11044364.11044410',
	'Printer-Scanner-cat.11044364.11044416',
];

let obj = {};
let scraped = [];
let n = 0;

function processArray(newElement) {
	n++;
	obj[n] = newElement;
	if (newElement.includes('KAB') || newElement.includes('KOTA')) {
		obj[n] = newElement;
		scraped.push({ ...obj });
		obj = {};
		n = 0;
	}
}

function write(data, name) {
	const folderName = './output';
	const date = new Date().toJSON();
	const currentDate = date.slice(0, 10);
	try {
		if (!fs.existsSync(folderName)) {
			fs.mkdirSync(folderName);
		}
		fs.writeFile(`./output/${name}-${currentDate}.json`, data, (err) => {
			if (err) {
				throw err;
			}
		});
	} catch (err) {
		console.error(err);
	}
}

const parser = new htmlparser2.Parser({
	ontext(text) {
		if (text && text.trim().length > 0) {
			processArray(text);
		}
	},
});

async function run(url, key) {
	let browser;
	try {
		const name = key.slice(0, key.indexOf('-cat.'));
		browser = await puppeteer.launch({ headless: true });
		const page = await browser.newPage();
		page.setDefaultNavigationTimeout(5 * 60 * 1000);

		await page.goto(url);

		const selector = '.shopee-search-item-result__items';

		await page.waitForSelector(selector);

		const el = await page.$(selector);

		const text = await el.evaluate((e) => e.innerHTML);
		parser.write(text);
		parser.end();

		write(JSON.stringify(scraped), name);
		console.log('Data has been written to file successfully.');
	} catch (error) {
		console.log('Error: ', error);
	} finally {
		await browser?.close();
	}
}

keys.map(async (key) => {
	const url = `https://shopee.co.id/${key}`;
	await run(url, key);
});
