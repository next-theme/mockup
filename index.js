const path = require("path");
const fs = require("fs");
const { fork, spawn } = require("child_process");
const { createServer } = require("http-server");
const { app, BrowserWindow } = require("electron");
const yaml = require("js-yaml");

app.commandLine.appendSwitch("disable-http-cache");

async function generate(name) {
    fs.writeFileSync(path.join(__dirname, "_config.next.yml"), yaml.dump({
        scheme: name,
        motion: {
            enable: false
        }
    }));
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
        createPanel(name, port++);
    }
}

function createPanel(name, port) {
    const pisces = name === "Pisces";
    const mainWindow = new BrowserWindow({
        width: 1000,
        height: 300,
        fullscreenable: false,
        title: "NexT"
    });

    // https://github.com/electron/electron/issues/24505
    mainWindow.loadURL(pisces ? `http://localhost:${port}/` : `http://127.0.0.1:${port}/`).then(() => {
        if (pisces) mainWindow.webContents.setZoomFactor(1.2);
        spawn("/usr/sbin/screencapture", [`-l${mainWindow.getMediaSourceId().split(":")[1]}`, "-T5", `assets/${name}.png`], {
            stdio: "inherit",
            cwd: __dirname
        });
    });
}

app.on("window-all-closed", () => {
    app.quit();
});

main();
