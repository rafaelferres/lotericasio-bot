import puppeteer from 'puppeteer';
import mongoose from 'mongoose';
import Modality, { ModalityInterface } from './schemas/Modality';
import Results from './schemas/Results';
import { CronJob } from "cron";
import fetch from "node-fetch";

class App {

    private browser: puppeteer.Browser;
    private pages: { [key:string] : puppeteer.Page } = {};
    private modalities: Array<ModalityInterface>;
    private modalitiesApi: { [key:string] : string } = {};
    private cron: CronJob;

    public constructor(){
        this.setup();
    }

    private async setup(){
        require('events').EventEmitter.defaultMaxListeners = 50;
        this.database();  
        this.modalities = await Modality.find();

        this.browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox']
        });

        this.cron = new CronJob("*/5 * * * *", () => {
            this.run();
        });

        this.cron.start();
    }

    private async database () {
        await mongoose.connect('mongodb+srv://adm:b2fteqUrouYXdT9U@cluster0-6q8xt.gcp.mongodb.net/lotericas', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
    }

    public async run(){
        console.log("Running ...");

        var modalityMap = this.modalities.map(async (modality: ModalityInterface) => {
            this.pages[modality.name.toString()] = await this.browser.newPage();
            await this.pages[modality.name.toString()].setRequestInterception(true);
            this.pages[modality.name.toString()].on('request', async (interceptedRequest: puppeteer.Request) => {
                if(interceptedRequest.url().includes("!ut/p/a1")){
                    this.modalitiesApi[modality.name.toString()] = interceptedRequest.url();
                }

                interceptedRequest.continue();
            });

            await this.pages[modality.name.toString()].goto(modality.url.toString(), {
                timeout: 0
            });
            await this.pages[modality.name.toString()].close();
            delete this.pages[modality.name.toString()];

            if(this.modalitiesApi[modality.name.toString()]){
                await this.fetchResult(modality.name.toString(), this.modalitiesApi[modality.name.toString()]);
            }
        });

        await Promise.all(modalityMap);

        console.log("Finish");
    }

    async fetchResult(modality: string, url: string): Promise<any>{
        return new Promise(async (resolve, reject) => {
            var headers: any = {
                "Host": "loterias.caixa.gov.br",
                "Connection": "keep-alive",
                "Accept": ["application/json", "text/plain"],
                "Request-Id": "|gQ3bt.OiZid",
                "User-Agent": ["Mozilla/5.0 (Macintosh", "Intel Mac OS X 10_15_2) AppleWebKit/537.36 (KHTML", "like Gecko) Chrome/79.0.3945.130 Safari/537.36"],
                "Request-Context": ["appId=cid-v1:51424569-30f5-41dc-acc7-6ddd0767375a"],
                "Referer": [url],
                "Accept-Encoding": ["gzip", "deflate"],
                "Accept-Language": ["pt-BR,pt", "q=0.9", "en-US", "q=0.8", "en", "q=0.7"],
                "Cookie": ["security=true", "ai_user=olcix|2020-02-10T17:43:07.421Z", "ai_session=/VySj|1581356587424.43|1581356587424.43", "_pk_ref.4.968f=%5B%22%22%2C%22%22%2C1581356588%2C%22https%3A%2F%2Fwww.google.com%2F%22%5D", "_pk_id.4.968f=b454e510ffe028c5.1581356588.1.1581356588.1581356588.", "_pk_ses.4.968f=*", "_ga=GA1.4.1094927038.1581356588", "_gid=GA1.4.213073038.1581356588"]
            };

            fetch(url, { method: 'GET', headers: headers })
                    .then((res) => {
                        return res.json()
                    })
                    .then(async (json) => {
                        if(json.nu_concurso && !json.concurso){
                            json.concurso = json.nu_concurso;
                            delete json.nu_concurso;
                        }else if(json.nu_CONCURSO && !json.concurso){
                            json.concurso = json.nu_CONCURSO;
                            delete json.nu_CONCURSO;
                        }
    
                        json.concurso = json.concurso.toString();

                        let exists = await Results.findOne({name: modality, concurso: json.concurso});
                    
                        if(!exists){
                            json.name = modality;
                            console.log(json);
                            await Results.create(json);
                            console.log("New insert");
                        }

                        resolve();
                    })
                    .catch(function (error) {
                        console.log('Não foi possível realizar o método GET: ' + error.message);
                        reject(error);
                    });
        });
    }

}

export { App }