import puppeteer from "puppeteer";

class App {

    private browser: puppeteer.Browser;
    private pages: { [key:string] : puppeteer.Page };

    public constructor(){
        this.setup();
    }

    private setup = async () => {
        this.browser = await puppeteer.launch();
    }
}

export { App };