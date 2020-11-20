const path = require("path");
const fs = require("fs");
const { fork } = require("child_process");
const { createServer } = require("http-server");
const { app, BrowserWindow } = require("electron");

app.commandLine.appendSwitch("disable-http-cache");

async function generate(name) {
    fs.writeFileSync(path.join(__dirname, "_config.next.yml"), `scheme: ${name}`);
    await new Promise((resolve, reject) => {
        const hexo = fork(path.join(__dirname, "node_modules/.bin/hexo"), ["g"], {
            stdio: "inherit",
            cwd: __dirname
        });
        hexo.on("exit", code => {
            resolve(code);
        });
    });
    fs.renameSync(path.join(__dirname, "public"), path.join(__dirname, name));
}

async function main() {
    const schemes = ["Muse", "Mist", "Pisces", "Gemini"];
    let port = 8080;
    for (let name of schemes) {
        console.log(`Generating: ${name}`);
        await generate(name);
    }
    fs.mkdirSync(path.join(__dirname, "public"));
    for (let name of schemes) {
        fs.renameSync(path.join(__dirname, name), path.join(__dirname, `public/${name}`));
        createServer({
            root: path.join(__dirname, `public/${name}`)
        }).listen(port);
        createPanel(`http://localhost:${port++}/`);
    }
}

function createPanel(url) {

    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        fullscreenable: false,
        title: "NexT"
    });

    mainWindow.loadURL(url);
}

app.on("window-all-closed", () => {
    app.quit();
});

main();
