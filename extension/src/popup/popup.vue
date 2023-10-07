<template>
    <div id="app" :class="popupClass">

        <div v-if="!isModelLoaded" class="progress-container">
            <!--todo: make this its own vue component-->
            <div class="progress-background">
                <div class="progress-bar" :style="{ width: progressValue + `%`}"></div>
            </div>
            <div class="loading-text">First time loading</div>
        </div>

        <div v-else>
            <div v-if="error" class="error">
                <span class="dismiss" @click="dismissError">&#x2612;</span>
                ERROR: {{ error }}
            </div>
            <AnimatedInput ref="input"></AnimatedInput>

            <!-- Display results and progress only if popupClass is 'popup-expanded' -->
            <div v-if="popupClass === 'popup-expanded'">
                <div class="results-container">
                    <ResultItem
                            v-for="(result, index) in results"
                            :key="index"
                            :result="result.text"
                            :score="result.sim"
                            @click="handleResultClick(result)"
                    />
                </div>

                <div class="progress-container search-progress">
                    <div class="progress-bar" :style="{ width: searchProgress + `%` }"></div>
                </div>

            </div>
        </div>


    </div>
</template>


<script>

import ResultItem from './result.vue';
import AnimatedInput from './AnimatedInput.vue'
import {prettyLog} from "../utils/utils.js";

export default {
    components: {
        AnimatedInput,
        ResultItem,
    },
    data() {
        return {
            results: [],
            progressValue: 0,
            searchProgress: 0,
            isModelLoaded: false,
            error: undefined,
        };
    },
    computed: {
        popupClass() {
            return this.results.length > 0 ? 'popup-expanded' : 'popup-default';
        },
    },
    watch: {},
    methods: {
        async handleMessage(request, sender, sendResponse) {
            // console.dir(request);
            switch (request.type) {
                case "results":
                    if ('text' in request) {
                        this.results = request.text;
                    }
                    this.searchProgress = request.progress;

                    break;
                case "download":
                    if (request.data.file && request.data.file !== "onnx/model_quantized.onnx") {
                        break;
                    }
                    if (request.data.status === 'progress') {
                        this.progressValue = request.data.progress.toFixed(2);
                    } else if (request.data.status === 'complete') {
                        this.progressValue = 100;
                        this.isModelLoaded = true;
                    }
                    break;
                case "error":
                    this.error = request.reason;
            }
        },

        // todo: move to result.vue
        handleResultClick(result) {
            chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {type: 'highlightAndScroll', text: result.text});
            });
        },
        dismissError() {
            this.error = null;
        },
    },

    async mounted() {
        chrome.runtime.onMessage.addListener(this.handleMessage);
        const [tab] = await chrome.tabs.query({active: true, currentWindow: true});

        chrome.tabs.sendMessage(tab.id, {type: "getText"});
        chrome.runtime.sendMessage({type: "load"});

        this.results = [];

    },
    beforeUnmount() {
        this.results = [];
        chrome.runtime.sendMessage({type: "pruneEmbeddings"});
        chrome.runtime.onMessage.removeListener(this.handleMessage);
    },
};
</script>

<style scoped src="./css/popup.css"></style>