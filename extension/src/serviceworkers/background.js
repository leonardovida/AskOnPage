// background.js - Handles requests from the UI, runs the model, then sends back a response

import {prettyLog, getSiteID} from '../utils/utils.js';
import {similarity, storeEmbeddings, loadEmbeddings} from "./semantic.js";

let bodyText = [];
let inputText = "";

let liveProcess = 0;
let currSite = "";

chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
    if (request.type === "tabUpdated") {
        if (request.text.length > 0) {
            bodyText = request.text;
            currSite = getSiteID(request.currentURL);
        }
    } else if (request.type === "inputText") {
        inputText = request.text;
    } else {return; }
    if (!bodyText || !inputText) {
        return;
    }

    liveProcess++;
    const processId = liveProcess;

    await processQuery(inputText, bodyText, processId);
});


async function processQuery(query, bodyText, processId) {
    if (bodyText.length === 0) {
        prettyLog("Error", "no content found. please reload this page if this is unexpected", "red");
        chrome.runtime.sendMessage({type: "error", reason: "No content detected. Reloading may help."});
        return;
    }

    await loadEmbeddings(currSite);
    prettyLog("starting process " + processId, bodyText.length + " items, input: " + query, "orange");

    let results = [];
    const k = 10;

    let i = 0;
    for (let text of bodyText) {
        if (processId !== liveProcess) { return;}
        let sim = await similarity(query, text);

        if (sim > 0.15) {
            results.push({sim: sim, text: text});
            results.sort((a, b) => b.sim - a.sim);
            results.length = Math.min(results.length, k);

            if (processId !== liveProcess) { return;}
            chrome.runtime.sendMessage({
                type: "results", progress: 100 * (i / bodyText.length),
                text: results
            });
        }
        i += 1;
    }
    chrome.runtime.sendMessage({type: "results", progress: 100});
    await storeEmbeddings();
}

//////////////////////////////////////////////////////////////

