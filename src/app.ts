import puppeteer from 'puppeteer';
import mongoose from 'mongoose';
import Modality, { ModalityInterface } from './schemas/Modality';
import Results from './schemas/Results';
import { CronJob } from "cron";

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
            headless: true
        });

        this.cron = new CronJob("*/1 * * * *", () => {
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
        await this.sleep(5000);

        var modalityMap = this.modalities.map(async (modality: ModalityInterface) => {
            this.pages[modality.name.toString()] = await this.browser.newPage();
            await this.pages[modality.name.toString()].setRequestInterception(true);
            this.pages[modality.name.toString()].on('request', async (interceptedRequest: puppeteer.Request) => {
                if(interceptedRequest.url().includes("!ut/p/a1")){
                    this.modalitiesApi[modality.name.toString()] = interceptedRequest.url();
                }

                interceptedRequest.continue();
            });

            await this.pages[modality.name.toString()].goto(modality.url.toString());
            await this.pages[modality.name.toString()].close();
            delete this.pages[modality.name.toString()];

            if(this.modalitiesApi[modality.name.toString()]){
                this.pages[modality.name.toString()] = await this.browser.newPage();
                await this.pages[modality.name.toString()].goto(`${this.modalitiesApi[modality.name.toString()]}`);
                let bodyHTML = await this.pages[modality.name.toString()].evaluate(() => document.body.innerHTML);
                let bodyJson = JSON.parse(bodyHTML);
                await this.pages[modality.name.toString()].close();
                delete this.pages[modality.name.toString()];

                if(bodyJson.nu_concurso && !bodyJson.concurso){
                    bodyJson.concurso = bodyJson.nu_concurso;
                    delete bodyJson.nu_concurso;
                }else if(bodyJson.nu_CONCURSO && !bodyJson.concurso){
                    bodyJson.concurso = bodyJson.nu_CONCURSO;
                    delete bodyJson.nu_CONCURSO;
                }

                let exists = await Results.findOne({name: modality.name.toString(), concurso: bodyJson.concurso});
                
                if(!exists){
                    bodyJson.name = modality.name.toString();
                    await Results.create(bodyJson);
                    console.log("New insert");
                }
            }
        });

        await Promise.all(modalityMap);
        console.log("Finish");
    }

    public async loadDataDatabase(){
        await this.sleep(10000);

        var modalityMap = this.modalities.map(async (modality: ModalityInterface) => {
            this.pages[modality.name.toString()] = await this.browser.newPage();
            await this.pages[modality.name.toString()].setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36');
            await this.pages[modality.name.toString()].setRequestInterception(true);
            this.pages[modality.name.toString()].on('request', async (interceptedRequest: puppeteer.Request) => {
                if(interceptedRequest.url().includes("!ut/p/a1")){
                    this.modalitiesApi[modality.name.toString()] = interceptedRequest.url();
                }

                interceptedRequest.continue();
            });

            await this.pages[modality.name.toString()].goto(modality.url.toString());
            await this.pages[modality.name.toString()].close();
            delete this.pages[modality.name.toString()];

            if(this.modalitiesApi[modality.name.toString()]){
                await this.recursiveLoadDatabase(modality.name.toString(), "1");
            }
        });
        await Promise.all(modalityMap);
    }

    private async recursiveLoadDatabase(name:string, concurso: string){
        try{
            this.pages[name] = await this.browser.newPage();
            await this.pages[name].setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36');

            await this.pages[name].goto(`${this.modalitiesApi[name]}&concurso=${concurso.toString()}`);
            //await this.sleep(1000);
            let bodyHTML = await this.pages[name].evaluate(() => document.body.innerHTML);

            let bodyJson = JSON.parse(bodyHTML);
            await this.pages[name].close();
            delete this.pages[name];

            if(bodyJson.nu_concurso && !bodyJson.concurso){
                bodyJson.concurso = bodyJson.nu_concurso;
                delete bodyJson.nu_concurso;
            }else if(bodyJson.nu_CONCURSO && !bodyJson.concurso){
                bodyJson.concurso = bodyJson.nu_CONCURSO;
                delete bodyJson.nu_CONCURSO;
            }

            let exists = await Results.findOne({name: name, concurso: bodyJson.concurso});
            
            if(!exists){
                bodyJson.name = name;
                await Results.create(bodyJson);
                console.log("New insert");
            }
            
            if(bodyJson.proximoConcurso.toString() != bodyJson.concurso.toString()){
                //await this.sleep(1000);
                this.recursiveLoadDatabase(name, bodyJson.proximoConcurso);
            }
        }catch(err){
            console.log(err);
            await this.sleep(1000);
            if(await this.pages[name])
                await this.pages[name].close();

            delete this.pages[name];
            
            this.recursiveLoadDatabase(name, concurso);
        }
    }

    private sleep(ms: number) {
        return new Promise((resolve) => {
          setTimeout(resolve, ms);
        });
      }  
}

export { App }