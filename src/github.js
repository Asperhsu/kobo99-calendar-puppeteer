const fs = require('node:fs');
const path = require('node:path');

module.exports.upload = async function (filepath) {
    const fileExists = (() => {
        try {
            fs.accessSync(filepath, fs.constants.R_OK);
            return true;
        } catch (err) {
            return false;
        }
    })();

    if (!fileExists) {
        console.log(filepath + ' not exists');
        return;
    }

    const message = 'update ' + path.basename(filepath);
    const content = fs.readFileSync(filepath, { encoding: 'utf8', flag: 'r' });
    const owner = process.env.GITHUB_USERNAME;
    const repo = process.env.GITHUB_REPO;
    const auth = process.env.GITHUB_TOKEN;

    const existingFile = await (await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${filepath}`,
        {
            method: 'GET',
            headers: {
            Accept: 'application/vnd.github+json',
                Authorization: `Bearer ${auth}`
            }
        }
    )).json();

    await (await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${filepath}`,
        {
            method: 'PUT',
            headers: {
                Accept: 'application/vnd.github+json',
                Authorization: `Bearer ${auth}`
            },
            body: JSON.stringify({
                message: message,
                // content: btoa(content),
                content: Buffer.from(content).toString('base64'),
                sha: existingFile.sha,
            }),
        }
    )).json();
    console.log(`${filepath} uploaded`);
}