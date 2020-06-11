import { App } from './app';

const app = new App();
//app.run();
/*import puppeteer from "puppeteer";

async function run(){
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on('request', (interceptedRequest: any) => {
        if(interceptedRequest.url().includes("!ut/p/a1")){
            console.log(interceptedRequest.url());
        }
        interceptedRequest.continue();
      });

    await page.goto('http://loterias.caixa.gov.br/wps/portal/loterias/landing/megasena');
    await browser.close();
}

run();*/